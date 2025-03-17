use crate::entities::generated::sys::{PublicKeyGetIn, PublicKeyGetOut};
use crate::services::generated::sys::PublicKeyService;
#[cfg_attr(test, mockall_double::double)]
use crate::services::service_executor::ServiceExecutor;
use crate::services::ExtraServiceParams;
use crate::tutanota_constants::PublicKeyIdentifierType;
use crate::util::{convert_version_to_i64, convert_version_to_u64, Versioned};
use crate::ApiCallError;
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq)]
pub struct PublicKeyIdentifier {
	pub identifier: String,
	pub identifier_type: PublicKeyIdentifierType,
}

pub struct PublicKeys {
	pub pub_rsa_key: Option<Vec<u8>>,
	pub pub_x25519_key: Option<Vec<u8>>,
	pub pub_kyber_key: Option<Vec<u8>>,
}

pub struct PublicKeyProvider {
	service_executor: Arc<ServiceExecutor>,
}

#[derive(thiserror::Error, Debug, Clone)]
#[error("PublicKeyLoadingError")]
pub enum PublicKeyLoadingError {
	KeyValidationError(String),
	KeyLoadingError(#[from] ApiCallError),
}

#[cfg_attr(test, mockall::automock)]
impl PublicKeyProvider {
	#[must_use]
	pub fn new(service_executor: Arc<ServiceExecutor>) -> Self {
		Self { service_executor }
	}

	pub async fn load_current_pub_key(
		&self,
		pub_key_identifier: &PublicKeyIdentifier,
	) -> Result<Versioned<PublicKeys>, PublicKeyLoadingError> {
		self.load_pub_key(pub_key_identifier, None).await
	}

	pub async fn load_versioned_pub_key(
		&self,
		pub_key_identifier: &PublicKeyIdentifier,
		version: u64,
	) -> Result<PublicKeys, PublicKeyLoadingError> {
		Ok(self
			.load_pub_key(pub_key_identifier, Some(version))
			.await?
			.object)
	}

	async fn load_pub_key(
		&self,
		pub_key_identifier: &PublicKeyIdentifier,
		version: Option<u64>,
	) -> Result<Versioned<PublicKeys>, PublicKeyLoadingError> {
		let request_data = PublicKeyGetIn {
			version: version.map(convert_version_to_i64),
			identifier: pub_key_identifier.identifier.clone(),
			identifierType: pub_key_identifier.identifier_type.clone() as i64,
			_format: 0,
		};
		let public_key_get_out: PublicKeyGetOut = self
			.service_executor
			.get::<PublicKeyService>(request_data, ExtraServiceParams::default())
			.await?;

		let pub_keys = Self::convert_to_versioned_public_keys(public_key_get_out);
		Self::enforce_rsa_key_version_letraint(&pub_keys)?;
		if version.is_some() && pub_keys.version != version.unwrap() {
			Err(PublicKeyLoadingError::KeyValidationError(
				"the server returned a key version that was not requested".to_string(),
			))
		} else {
			Ok(pub_keys)
		}
	}

	/// RSA keys were only created before introducing key versions, i.e. they always have version 0.
	/// Receiving a higher version would indicate a protocol downgrade/ MITM attack, and we reject such keys.
	fn enforce_rsa_key_version_letraint(
		pub_keys: &Versioned<PublicKeys>,
	) -> Result<(), PublicKeyLoadingError> {
		if pub_keys.version != 0 && pub_keys.object.pub_rsa_key.is_some() {
			Err(PublicKeyLoadingError::KeyValidationError(
				"rsa key in a version that is not 0".to_string(),
			))
		} else {
			Ok(())
		}
	}

	fn convert_to_versioned_public_keys(
		public_key_get_out: PublicKeyGetOut,
	) -> Versioned<PublicKeys> {
		Versioned {
			object: PublicKeys {
				pub_rsa_key: public_key_get_out.pubRsaKey,
				pub_kyber_key: public_key_get_out.pubKyberKey,
				pub_x25519_key: public_key_get_out.pubEccKey,
			},
			version: convert_version_to_u64(public_key_get_out.pubKeyVersion),
		}
	}
}

#[cfg(test)]
mod tests {
	use crate::crypto::public_key_provider::{PublicKeyIdentifier, PublicKeyProvider};
	use crate::entities::generated::sys::PublicKeyGetIn;
	use crate::services::service_executor::MockServiceExecutor;
	use crate::tutanota_constants::PublicKeyIdentifierType;
	use std::sync::Arc;

	fn make_public_key_provider(service_executor: MockServiceExecutor) -> PublicKeyProvider {
		PublicKeyProvider::new(Arc::new(service_executor))
	}

	fn setup_test() -> (
		u64,
		PublicKeyIdentifier,
		PublicKeyGetIn,
		MockServiceExecutor,
	) {
		let current_key_version = 2u64;
		let public_key_identifier = PublicKeyIdentifier {
			identifier: "myMailAddress".to_string(),
			identifier_type: PublicKeyIdentifierType::MailAddress,
		};
		let first_service_executor_invocation = PublicKeyGetIn {
			_format: 0,
			identifier: public_key_identifier.identifier.clone(),
			identifierType: public_key_identifier.identifier_type.clone() as i64,
			version: None,
		};

		let service_executor = MockServiceExecutor::default();
		(
			current_key_version,
			public_key_identifier,
			first_service_executor_invocation,
			service_executor,
		)
	}

	mod load_current_pub_key {
		use crate::crypto::public_key_provider::tests::{make_public_key_provider, setup_test};
		use crate::crypto::public_key_provider::PublicKeyLoadingError;
		use crate::entities::generated::sys::PublicKeyGetOut;
		use crate::services::generated::sys::PublicKeyService;
		use mockall::predicate::{always, eq};

		#[tokio::test]
		async fn success() {
			let (
				current_key_version,
				public_key_identifier,
				first_service_executor_invocation,
				mut service_executor,
			) = setup_test();

			let pub_key = vec![9, 8, 7];
			let pub_key_for_mock = pub_key.clone();

			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: Some(pub_key_for_mock.clone()),
						pubKeyVersion: current_key_version as i64,
						pubKyberKey: Some(pub_key_for_mock.clone()),
						pubRsaKey: None,
					})
				});
			let public_key_provider = make_public_key_provider(service_executor);
			let pub_keys = public_key_provider
				.load_current_pub_key(&public_key_identifier)
				.await
				.unwrap();
			assert_eq!(pub_keys.version, current_key_version);
			assert_eq!(pub_keys.object.pub_rsa_key, None);
			assert_eq!(pub_keys.object.pub_kyber_key, Some(pub_key.clone()));
			assert_eq!(pub_keys.object.pub_x25519_key, Some(pub_key.clone()));
		}

		#[tokio::test]
		async fn rsa_key_in_version_other_than_0() {
			let (_, public_key_identifier, first_service_executor_invocation, mut service_executor) =
				setup_test();
			let current_key_version = 1u64;

			let pub_key = vec![9, 8, 7];
			let pub_key_for_mock = pub_key.clone();

			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: None,
						pubKeyVersion: current_key_version as i64,
						pubKyberKey: None,
						pubRsaKey: Some(pub_key_for_mock.clone()),
					})
				});
			let public_key_provider = make_public_key_provider(service_executor);
			assert_ne!(0u64, current_key_version); // !0 is important for what we are testing here

			let result = public_key_provider
				.load_current_pub_key(&public_key_identifier)
				.await;
			assert!(result.is_err());
			assert!(matches!(
				result.err().unwrap(),
				PublicKeyLoadingError::KeyValidationError { .. }
			))
		}
	}

	mod load_version_pub_key {
		use crate::crypto::public_key_provider::tests::{make_public_key_provider, setup_test};
		use crate::crypto::public_key_provider::PublicKeyLoadingError;
		use crate::entities::generated::sys::PublicKeyGetOut;
		use crate::services::generated::sys::PublicKeyService;
		use mockall::predicate::{always, eq};

		#[tokio::test]
		async fn success() {
			let (
				_,
				public_key_identifier,
				mut first_service_executor_invocation,
				mut service_executor,
			) = setup_test();
			let requested_version = 1u64;
			first_service_executor_invocation.version = Some(requested_version as i64);

			let pub_key = vec![9, 8, 7];
			let pub_key_for_mock = pub_key.clone();

			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: Some(pub_key_for_mock.clone()),
						pubKeyVersion: requested_version as i64,
						pubKyberKey: Some(pub_key_for_mock.clone()),
						pubRsaKey: None,
					})
				});
			let public_key_provider = make_public_key_provider(service_executor);
			let pub_keys = public_key_provider
				.load_versioned_pub_key(&public_key_identifier, requested_version)
				.await
				.unwrap();
			assert_eq!(pub_keys.pub_rsa_key, None);
			assert_eq!(pub_keys.pub_kyber_key, Some(pub_key.clone()));
			assert_eq!(pub_keys.pub_x25519_key, Some(pub_key.clone()));
		}

		#[tokio::test]
		async fn invalid_version_returned() {
			// await assertThrows(InvalidDataError, async () => publicKeyProvider.loadVersionedPubKey(publicKeyIdentifier, requestedVersion))
			let (
				current_key_version,
				public_key_identifier,
				mut first_service_executor_invocation,
				mut service_executor,
			) = setup_test();
			let requested_version = 1u64;
			first_service_executor_invocation.version = Some(requested_version as i64);

			let pub_key = vec![9, 8, 7];
			let pub_key_for_mock = pub_key.clone();

			assert_ne!(requested_version, current_key_version);
			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: Some(pub_key_for_mock.clone()),
						pubKeyVersion: current_key_version as i64,
						pubKyberKey: Some(pub_key_for_mock.clone()),
						pubRsaKey: None,
					})
				});
			let public_key_provider = make_public_key_provider(service_executor);
			let result = public_key_provider
				.load_versioned_pub_key(&public_key_identifier, requested_version)
				.await;
			assert!(result.is_err());
			assert!(matches!(
				result.err().unwrap(),
				PublicKeyLoadingError::KeyValidationError { .. }
			))
		}

		#[tokio::test]
		async fn rsa_key_in_version_other_than_0() {
			let (
				_,
				public_key_identifier,
				mut first_service_executor_invocation,
				mut service_executor,
			) = setup_test();
			let requested_version = 1u64;
			first_service_executor_invocation.version = Some(requested_version as i64);

			let pub_key = vec![9, 8, 7];
			let pub_key_for_mock = pub_key.clone();

			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: None,
						pubKeyVersion: requested_version as i64,
						pubKyberKey: None,
						pubRsaKey: Some(pub_key_for_mock.clone()),
					})
				});
			let public_key_provider = make_public_key_provider(service_executor);
			assert_ne!(0u64, requested_version); // !0 is important for what we are testing here

			let result = public_key_provider
				.load_versioned_pub_key(&public_key_identifier, requested_version)
				.await;
			assert!(result.is_err());
			assert!(matches!(
				result.err().unwrap(),
				PublicKeyLoadingError::KeyValidationError { .. }
			))
		}
	}

	mod version_validation {
		use crate::crypto::public_key_provider::tests::{make_public_key_provider, setup_test};
		use crate::entities::generated::sys::PublicKeyGetOut;
		use crate::services::generated::sys::PublicKeyService;
		use mockall::predicate::{always, eq};

		#[tokio::test]
		#[should_panic]
		async fn panics_if_the_version_is_negative() {
			let (_, public_key_identifier, first_service_executor_invocation, mut service_executor) =
				setup_test();
			let bad_version_from_server = -1i64;

			let pub_key = vec![9, 8, 7];
			let pub_key_for_mock = pub_key.clone();

			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: Some(pub_key_for_mock.clone()),
						pubKeyVersion: bad_version_from_server,
						pubKyberKey: Some(pub_key_for_mock.clone()),
						pubRsaKey: None,
					})
				});
			let public_key_provider = make_public_key_provider(service_executor);
			// this is expected to panic!
			let _ = public_key_provider
				.load_current_pub_key(&public_key_identifier)
				.await;
		}
	}
}
