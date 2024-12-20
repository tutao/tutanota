use crate::crypto::aes::{AesEncryptError, Iv};
use crate::crypto::ecc::{EccKeyPair, EccPublicKey};
use crate::crypto::key::{
	AsymmetricKeyPair, AsymmetricPublicKey, GenericAesKey, KeyLoadError, VersionedAesKey,
};
use crate::crypto::kyber::{KyberKeyError, KyberPublicKey};
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::rsa::{RSAEccKeyPair, RSAEncryptionError, RSAKeyError, RSAPublicKey};
use crate::crypto::tuta_crypt::{PQError, PQMessage, TutaCryptPublicKeys};
use crate::crypto::Aes256Key;
use crate::entities::generated::sys::{PubEncKeyData, PublicKeyGetIn, PublicKeyPutIn};
#[cfg_attr(test, mockall_double::double)]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::services::generated::sys::PublicKeyService;
#[cfg_attr(test, mockall_double::double)]
use crate::services::service_executor::ServiceExecutor;
use crate::services::ExtraServiceParams;
use crate::tutanota_constants::CryptoProtocolVersion;
use crate::tutanota_constants::{EncryptionAuthStatus, PublicKeyIdentifierType};
use crate::util::ArrayCastingError;
use crate::util::Versioned;
use crate::ApiCallError;
use crate::GeneratedId;
use std::sync::Arc;
use zeroize::Zeroizing;

pub struct DecapsulatedAesKey {
	pub decrypted_aes_key: GenericAesKey,
	pub sender_identity_pub_key: Option<EccPublicKey>, // for authentication: None for rsa only
}

pub struct PublicKeyIdentifier {
	pub identifier: String,
	pub identifier_type: PublicKeyIdentifierType,
}

pub struct PubEncSymKey {
	pub_enc_sym_key_bytes: Vec<u8>,
	crypto_protocol_version: CryptoProtocolVersion,
	sender_key_version: Option<i64>,
	recipient_key_version: i64,
}

pub struct PublicKeys {
	pub_rsa_key: Option<Vec<u8>>,
	pub_ecc_key: Option<Vec<u8>>,
	pub_kyber_key: Option<Vec<u8>>,
}

#[derive(thiserror::Error, Debug)]
#[error("AsymmetricCryptoError")]
pub enum AsymmetricCryptoError {
	InvalidCryptoProtocolVersion(CryptoProtocolVersion),
	UnexpectedAsymmetricKeyPairType(String),
	UnexpectedPublicKeyPairType(String),
	UnexpectedSymmetricKeyType(String),
	RsaEncrypt(#[from] RSAEncryptionError),
	PqCrypto(#[from] PQError),
	ArrayCasting(#[from] ArrayCastingError),
	KeyLoading(#[from] KeyLoadError),
	KeyParsing(String),
	RsaKey(#[from] RSAKeyError),
	KyberKey(#[from] KyberKeyError),
	AesEncrypt(#[from] AesEncryptError),
	ApiCall(#[from] ApiCallError),
	AuthenticationError(EncryptionAuthStatus),
}

pub struct AsymmetricCryptoFacade {
	key_loader_facade: Arc<KeyLoaderFacade>,
	randomizer_facade: RandomizerFacade,
	service_executor: Arc<ServiceExecutor>,
}

#[cfg_attr(test, mockall::automock)]
impl AsymmetricCryptoFacade {
	#[must_use]
	pub fn new(
		key_loader_facade: Arc<KeyLoaderFacade>,
		randomizer_facade: RandomizerFacade,
		service_executor: Arc<ServiceExecutor>,
	) -> Self {
		Self {
			key_loader_facade,
			randomizer_facade,
			service_executor,
		}
	}

	/// Verifies whether the key that the public key service returns is the same as the one used for encryption.
	/// When we have key verification we should stop verifying against the PublicKeyService but against the verified key.
	///
	/// @param identifier the identifier to load the public key to verify that it matches the one used in the protocol run.
	/// @param sender_identity_pub_key the sender_identity_pub_key that was used to encrypt/authenticate the data.
	/// @param sender_key_version the version of the sender_identity_pub_key.
	pub async fn authenticate_sender(
		&self,
		identifier: PublicKeyIdentifier,
		sender_identity_pub_key: &[u8],
		sender_key_version: i64,
	) -> Result<EncryptionAuthStatus, AsymmetricCryptoError> {
		let key_data = PublicKeyGetIn {
			_format: 0,
			identifier: identifier.identifier,
			identifierType: identifier.identifier_type as i64,
			version: Some(sender_key_version),
		};
		let public_key_get_out = self
			.service_executor
			.get::<PublicKeyService>(key_data, ExtraServiceParams::default())
			.await?;
		if Option::is_some(&public_key_get_out.pubEccKey)
			&& public_key_get_out.pubEccKey.unwrap() == sender_identity_pub_key
		{
			Ok(EncryptionAuthStatus::TutacryptAuthenticationSucceeded)
		} else {
			Ok(EncryptionAuthStatus::TutacryptAuthenticationFailed)
		}
	}

	/// Decrypts the pubEncSymKey with the recipientKeyPair and authenticates it if the protocol supports authentication.
	/// If the protocol does not support authentication this method will only decrypt.
	/// @param recipientKeyPair the recipientKeyPair. Must match the cryptoProtocolVersion and must be of the required recipientKeyVersion.
	/// @param pubEncKeyData the encrypted symKey with the metadata (versions, group identifier etc.) for decryption and authentication.
	/// @param senderIdentifier the identifier for the sender's key group
	/// @throws CryptoError in case the authentication fails.
	pub async fn decrypt_sym_key_with_key_pair_and_authenticate(
		&self,
		recipient_key_pair: AsymmetricKeyPair,
		pub_enc_key_data: PubEncKeyData,
		sender_identifier: PublicKeyIdentifier,
	) -> Result<DecapsulatedAesKey, AsymmetricCryptoError> {
		let crypto_protocol_version =
			CryptoProtocolVersion::try_from(pub_enc_key_data.protocolVersion).unwrap();
		let decapsulated_aes_key = Self::decrypt_sym_key_with_key_pair(
			recipient_key_pair,
			&crypto_protocol_version,
			&pub_enc_key_data.pubEncSymKey,
		)?;
		if crypto_protocol_version == CryptoProtocolVersion::TutaCrypt {
			let sender_identity_pub_key_from_pq_message = decapsulated_aes_key
				.sender_identity_pub_key
				.as_ref()
				.unwrap()
				.as_bytes();
			let encryption_auth_status = self
				.authenticate_sender(
					sender_identifier,
					sender_identity_pub_key_from_pq_message,
					pub_enc_key_data.senderKeyVersion.unwrap(),
				)
				.await?;
			if encryption_auth_status != EncryptionAuthStatus::TutacryptAuthenticationSucceeded {
				//the provided public key could not be authenticated
				return Err(AsymmetricCryptoError::AuthenticationError(
					encryption_auth_status,
				));
			}
		}
		Ok(decapsulated_aes_key)
	}

	/// Decrypts the pub_enc_sym_key with the recipientKeyPair.
	/// @param pub_enc_sym_key the asymmetrically encrypted session key
	/// @param crypto_protocol_version asymmetric protocol to decrypt pub_enc_sym_key (RSA or TutaCrypt)
	/// @param recipient_key_pair the recipientKeyPair. Must match the crypto_protocol_version.
	pub fn decrypt_sym_key_with_key_pair(
		recipient_key_pair: AsymmetricKeyPair,
		crypto_protocol_version: &CryptoProtocolVersion,
		pub_enc_sym_key: &[u8],
	) -> Result<DecapsulatedAesKey, AsymmetricCryptoError> {
		match crypto_protocol_version {
			CryptoProtocolVersion::Rsa => match recipient_key_pair {
				AsymmetricKeyPair::RSAEccKeyPair(RSAEccKeyPair {
					rsa_key_pair: key_pair,
					..
				})
				| AsymmetricKeyPair::RSAKeyPair(key_pair) => {
					let sym_key_bytes =
						Zeroizing::new(key_pair.private_key.decrypt(pub_enc_sym_key)?);
					let decrypted_aes_key = GenericAesKey::from_bytes(sym_key_bytes.as_slice())?;
					Ok(DecapsulatedAesKey {
						decrypted_aes_key,
						sender_identity_pub_key: None,
					})
				},
				_ => Err(AsymmetricCryptoError::UnexpectedAsymmetricKeyPairType(
					format!("{:? }", recipient_key_pair),
				)),
			},
			CryptoProtocolVersion::TutaCrypt => match recipient_key_pair {
				AsymmetricKeyPair::PQKeyPairs(key_pair) => {
					let decapsulated_sym_key =
						PQMessage::deserialize(pub_enc_sym_key)?.decapsulate(&key_pair)?;
					Ok(DecapsulatedAesKey {
						decrypted_aes_key: decapsulated_sym_key.decrypted_sym_key_bytes.into(),
						sender_identity_pub_key: Some(decapsulated_sym_key.sender_identity_pub_key),
					})
				},
				_ => Err(AsymmetricCryptoError::UnexpectedAsymmetricKeyPairType(
					format!("{:? }", recipient_key_pair),
				)),
			},
			_ => Err(AsymmetricCryptoError::InvalidCryptoProtocolVersion(
				crypto_protocol_version.to_owned(),
			)),
		}
	}

	/// Loads the recipient_key_pair in the required version and decrypts the pub_enc_sym_key with it.
	pub async fn load_key_pair_and_decrypt_sym_key(
		&self,
		recipient_key_pair_group_id: &GeneratedId,
		recipient_key_version: i64,
		crypto_protocol_version: &CryptoProtocolVersion,
		pub_enc_sym_key: &[u8],
	) -> Result<DecapsulatedAesKey, AsymmetricCryptoError> {
		let key_pair = self
			.key_loader_facade
			.load_key_pair(recipient_key_pair_group_id, recipient_key_version)
			.await?;
		Self::decrypt_sym_key_with_key_pair(key_pair, crypto_protocol_version, pub_enc_sym_key)
	}

	/// Encrypts the symKey asymmetrically with the provided public keys.
	/// @param symKey the symmetric key  to be encrypted
	/// @param recipientPublicKeys the public key(s) of the recipient in the current version
	/// @param senderGroupId the group id of the sender. will only be used in case we also need the sender's key pair, e.g. with TutaCrypt.
	pub async fn asym_encrypt_sym_key(
		&self,
		sym_key: GenericAesKey,
		versioned_recipient_public_keys: Versioned<PublicKeys>,
		sender_group_id: &GeneratedId,
	) -> Result<PubEncSymKey, AsymmetricCryptoError> {
		let recipient_public_key = AsymmetricCryptoFacade::extract_recipient_public_key(
			versioned_recipient_public_keys.object,
		)?;

		match recipient_public_key {
			AsymmetricPublicKey::RsaPublicKey(rsa_pub_key) => {
				let pub_enc_sym_key_bytes =
					rsa_pub_key.encrypt(&self.randomizer_facade, sym_key.as_bytes())?;
				Ok(PubEncSymKey {
					pub_enc_sym_key_bytes,
					crypto_protocol_version: CryptoProtocolVersion::Rsa,
					sender_key_version: None,
					recipient_key_version: versioned_recipient_public_keys.version,
				})
			},
			AsymmetricPublicKey::PqPublicKeys(pq_pub_keys) => {
				let sender_key_pair: Versioned<AsymmetricKeyPair> = self
					.key_loader_facade
					.load_current_key_pair(sender_group_id)
					.await?;
				let sender_ecc_key_pair = self
					.get_or_make_sender_identity_key_pair(sender_key_pair.object, sender_group_id)
					.await?;
				match sym_key {
					GenericAesKey::Aes128(_) => {
						Err(AsymmetricCryptoError::UnexpectedSymmetricKeyType(format!(
							"{:? }",
							sym_key
						)))
					},
					GenericAesKey::Aes256(aes256_sym_key) => Ok(self
						.tuta_crypt_encrypt_sym_key_impl(
							Versioned {
								object: *pq_pub_keys,
								version: versioned_recipient_public_keys.version,
							},
							aes256_sym_key,
							Versioned {
								object: sender_ecc_key_pair,
								version: sender_key_pair.version,
							},
						)?),
				}
			},
		}
	}

	/// Encrypts the symKey asymmetrically with the provided public keys using the TutaCrypt protocol.
	/// @param symKey the key to be encrypted
	/// @param recipientPublicKeys MUST be a pq key pair
	/// @param senderEccKeyPair the sender's key pair (needed for authentication)
	/// @throws ProgrammingError if the recipientPublicKeys are not suitable for TutaCrypt
	pub fn tuta_crypt_encrypt_sym_key(
		&self,
		sym_key: Aes256Key,
		recipient_public_keys: Versioned<PublicKeys>,
		sender_ecc_key_pair: Versioned<EccKeyPair>,
	) -> Result<PubEncSymKey, AsymmetricCryptoError> {
		let recipient_public_key =
			AsymmetricCryptoFacade::extract_recipient_public_key(recipient_public_keys.object)?;
		match recipient_public_key {
			AsymmetricPublicKey::RsaPublicKey(_) => {
				Err(AsymmetricCryptoError::UnexpectedPublicKeyPairType(format!(
					"{:? }",
					recipient_public_key
				)))
			},
			AsymmetricPublicKey::PqPublicKeys(pq_pub_keys) => self.tuta_crypt_encrypt_sym_key_impl(
				Versioned {
					object: *pq_pub_keys,
					version: recipient_public_keys.version,
				},
				sym_key,
				sender_ecc_key_pair,
			),
		}
	}

	fn tuta_crypt_encrypt_sym_key_impl(
		&self,
		recipient_public_key: Versioned<TutaCryptPublicKeys>,
		sym_key: Aes256Key,
		sender_ecc_key_pair: Versioned<EccKeyPair>,
	) -> Result<PubEncSymKey, AsymmetricCryptoError> {
		let ephemeral_key_pair = EccKeyPair::generate(&self.randomizer_facade);
		let encapsulation_iv = Iv::generate(&self.randomizer_facade);
		let pub_enc_sym_key_bytes = PQMessage::encapsulate(
			&sender_ecc_key_pair.object,
			&ephemeral_key_pair,
			&recipient_public_key.object.ecc_public_key,
			&recipient_public_key.object.kyber_public_key,
			&sym_key,
			encapsulation_iv,
		)?
		.serialize();
		Ok(PubEncSymKey {
			pub_enc_sym_key_bytes,
			crypto_protocol_version: CryptoProtocolVersion::TutaCrypt,
			sender_key_version: Some(sender_ecc_key_pair.version),
			recipient_key_version: recipient_public_key.version,
		})
	}

	fn extract_recipient_public_key(
		public_keys: PublicKeys,
	) -> Result<AsymmetricPublicKey, AsymmetricCryptoError> {
		if Option::is_some(&public_keys.pub_rsa_key) {
			// we ignore ecc keys as this is only used for the recipient keys
			Ok(AsymmetricPublicKey::RsaPublicKey(Box::new(
				RSAPublicKey::deserialize(public_keys.pub_rsa_key.unwrap().as_slice())?,
			)))
		} else if Option::is_some(&public_keys.pub_ecc_key)
			&& Option::is_some(&public_keys.pub_kyber_key)
		{
			let kyber_public_key =
				KyberPublicKey::deserialize(public_keys.pub_kyber_key.unwrap().as_slice())?;
			let ecc_public_key =
				EccPublicKey::from_bytes(public_keys.pub_ecc_key.unwrap().as_slice())?;
			return Ok(AsymmetricPublicKey::PqPublicKeys(Box::new(
				TutaCryptPublicKeys {
					ecc_public_key,
					kyber_public_key,
				},
			)));
		} else {
			Err(AsymmetricCryptoError::KeyParsing(
				"Got an unparseable public key".to_string(),
			))
		}
	}

	/// Returns the SenderIdentityKeyPair that is either already on the KeyPair that is being passed in,
	/// or creates a new one and writes it to the respective Group.
	/// @param senderKeyPair
	/// @param keyGroupId Id for the Group that Public Key Service might write a new IdentityKeyPair for.
	///        This is necessary as a User might send an E-Mail from a shared mailbox,
	///        for which the KeyPair should be created.
	async fn get_or_make_sender_identity_key_pair(
		&self,
		sender_key_pair: AsymmetricKeyPair,
		key_group_id: &GeneratedId,
	) -> Result<EccKeyPair, AsymmetricCryptoError> {
		match sender_key_pair {
			AsymmetricKeyPair::PQKeyPairs(pq_pairs) => Ok(pq_pairs.ecc_keys),
			AsymmetricKeyPair::RSAEccKeyPair(rsa_ecc_pairs) => Ok(rsa_ecc_pairs.ecc_key_pair),
			AsymmetricKeyPair::RSAKeyPair(_rsa_pair) => {
				// there is no ecc key pair yet, so we have to generate and upload one
				let sym_group_key: VersionedAesKey = self
					.key_loader_facade
					.get_current_sym_group_key(key_group_id)
					.await?;
				let new_identity_key_pair = EccKeyPair::generate(&self.randomizer_facade);
				let sym_enc_priv_ecc_key = sym_group_key.object.encrypt_data(
					new_identity_key_pair.private_key.as_bytes(),
					Iv::generate(&self.randomizer_facade),
				)?;

				let data = PublicKeyPutIn {
					_format: 0,
					pubEccKey: new_identity_key_pair.public_key.as_bytes().to_vec(),
					symEncPrivEccKey: sym_enc_priv_ecc_key,
					keyGroup: key_group_id.to_owned(),
				};
				self.service_executor
					.put::<PublicKeyService>(data, ExtraServiceParams::default())
					.await?;
				Ok(new_identity_key_pair)
			},
		}
	}
}

#[cfg(test)]
mod tests {
	use crate::crypto::asymmetric_crypto_facade::AsymmetricCryptoFacade;
	use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
	use crate::entities::generated::sys::PublicKeyGetIn;
	use crate::key_loader_facade::MockKeyLoaderFacade;
	use crate::services::service_executor::MockServiceExecutor;
	use crate::tutanota_constants::PublicKeyIdentifierType;
	use std::sync::Arc;

	fn make_asymmetric_crypto_facade(
		service_executor: MockServiceExecutor,
	) -> AsymmetricCryptoFacade {
		let key_loader_facade = MockKeyLoaderFacade::default();
		AsymmetricCryptoFacade::new(
			Arc::new(key_loader_facade),
			make_thread_rng_facade(),
			Arc::new(service_executor),
		)
	}

	fn setup_authentication_test() -> (
		i64,
		String,
		PublicKeyIdentifierType,
		PublicKeyGetIn,
		MockServiceExecutor,
	) {
		let sender_key_version = 0i64;
		let identifier = String::from("sender_id");
		let identifier_type = PublicKeyIdentifierType::MailAddress;
		let first_service_executor_invocation = PublicKeyGetIn {
			_format: 0,
			identifier: identifier.clone(),
			identifierType: identifier_type.clone() as i64,
			version: Some(sender_key_version),
		};

		let service_executor = MockServiceExecutor::default();
		(
			sender_key_version,
			identifier,
			identifier_type,
			first_service_executor_invocation,
			service_executor,
		)
	}

	mod authenticate_sender {
		use crate::crypto::asymmetric_crypto_facade::tests::{
			make_asymmetric_crypto_facade, setup_authentication_test,
		};
		use crate::crypto::asymmetric_crypto_facade::PublicKeyIdentifier;
		use crate::entities::generated::sys::PublicKeyGetOut;
		use crate::services::generated::sys::PublicKeyService;
		use crate::tutanota_constants::EncryptionAuthStatus;
		use mockall::predicate::{always, eq};

		#[tokio::test]
		async fn should_return_tutacrypt_authentication_succeeded_if_the_key_matches() {
			let (
				sender_key_version,
				identifier,
				identifier_type,
				first_service_executor_invocation,
				mut service_executor,
			) = setup_authentication_test();
			let sender_identity_pub_key = vec![9, 8, 7];

			let pub_key = sender_identity_pub_key.clone();
			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: Some(pub_key.clone()),
						pubKeyVersion: 0i64,
						pubKyberKey: Some(vec![1, 2, 3]),
						pubRsaKey: None,
					})
				});

			let asymmetric_crypto_facade = make_asymmetric_crypto_facade(service_executor);

			let result = asymmetric_crypto_facade
				.authenticate_sender(
					PublicKeyIdentifier {
						identifier,
						identifier_type,
					},
					&sender_identity_pub_key,
					sender_key_version,
				)
				.await
				.unwrap();
			assert_eq!(
				result,
				EncryptionAuthStatus::TutacryptAuthenticationSucceeded,
			);
		}

		#[tokio::test]
		async fn should_return_tutacrypt_authentication_failed_if_sender_does_not_have_an_ecc_identity_key_in_the_requested_version(
		) {
			let (
				sender_key_version,
				identifier,
				identifier_type,
				first_service_executor_invocation,
				mut service_executor,
			) = setup_authentication_test();
			let sender_identity_pub_key = vec![9, 8, 7];

			let pub_key = sender_identity_pub_key.clone();
			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: None,
						pubKeyVersion: 0i64,
						pubKyberKey: None,
						pubRsaKey: Some(pub_key.clone()),
					})
				});

			let asymmetric_crypto_facade = make_asymmetric_crypto_facade(service_executor);
			let result = asymmetric_crypto_facade
				.authenticate_sender(
					PublicKeyIdentifier {
						identifier,
						identifier_type,
					},
					&sender_identity_pub_key,
					sender_key_version,
				)
				.await
				.unwrap();

			assert_eq!(result, EncryptionAuthStatus::TutacryptAuthenticationFailed,);
		}

		#[tokio::test]
		async fn should_return_tutacrypt_authentication_failed_if_the_key_does_not_match() {
			let (
				sender_key_version,
				identifier,
				identifier_type,
				first_service_executor_invocation,
				mut service_executor,
			) = setup_authentication_test();
			let sender_identity_pub_key = vec![9, 8, 7];

			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: Some(vec![5, 5, 5, 1]), // not matching the sender_identity_pub_key
						pubKeyVersion: 0i64,
						pubKyberKey: Some(vec![1, 2, 3]),
						pubRsaKey: None,
					})
				});

			let asymmetric_crypto_facade = make_asymmetric_crypto_facade(service_executor);

			let result = asymmetric_crypto_facade
				.authenticate_sender(
					PublicKeyIdentifier {
						identifier,
						identifier_type,
					},
					&sender_identity_pub_key,
					sender_key_version,
				)
				.await
				.unwrap();

			assert_eq!(result, EncryptionAuthStatus::TutacryptAuthenticationFailed,);
		}
	}

	mod decrypt_sym_key_with_key_pair_and_authenticate {
		use crate::crypto::aes::Iv;
		use crate::crypto::asymmetric_crypto_facade::tests::{
			make_asymmetric_crypto_facade, setup_authentication_test,
		};
		use crate::crypto::asymmetric_crypto_facade::{AsymmetricCryptoError, PublicKeyIdentifier};
		use crate::crypto::ecc::EccKeyPair;
		use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey};
		use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
		use crate::crypto::rsa::RSAKeyPair;
		use crate::crypto::tuta_crypt::PQMessage;
		use crate::crypto::{Aes256Key, PQKeyPairs};
		use crate::entities::generated::sys::{PubEncKeyData, PublicKeyGetOut};
		use crate::services::generated::sys::PublicKeyService;
		use crate::tutanota_constants::CryptoProtocolVersion;
		use crate::tutanota_constants::PublicKeyIdentifierType;
		use mockall::predicate::{always, eq};

		#[tokio::test]
		async fn error_if_authentication_fails() {
			let (
				sender_key_version,
				sender_identifier,
				sender_identifier_type,
				first_service_executor_invocation,
				mut service_executor,
			) = setup_authentication_test();

			service_executor
				.expect_get::<PublicKeyService>()
				.with(eq(first_service_executor_invocation), always())
				.returning(move |_, _| {
					Ok(PublicKeyGetOut {
						_format: 0,
						pubEccKey: Some(vec![5, 5, 5, 1]), // not matching the sender_identity_pub_key
						pubKeyVersion: 0i64,
						pubKyberKey: Some(vec![1, 2, 3]),
						pubRsaKey: None,
					})
				});

			let asymmetric_crypto_facade = make_asymmetric_crypto_facade(service_executor);

			let randomizer_facade = make_thread_rng_facade();
			let recipient_key_pair = PQKeyPairs::generate(&randomizer_facade);

			let pub_enc_sym_key = PQMessage::encapsulate(
				&EccKeyPair::generate(&randomizer_facade),
				&EccKeyPair::generate(&randomizer_facade),
				&recipient_key_pair.ecc_keys.public_key.clone(),
				&recipient_key_pair.kyber_keys.public_key.clone(),
				&Aes256Key::generate(&randomizer_facade),
				Iv::generate(&randomizer_facade),
			)
			.unwrap();

			let recipient_identifier = String::from("recipient_identifier");
			let recipient_identifier_type = PublicKeyIdentifierType::MailAddress;
			let pub_enc_key_data = PubEncKeyData {
				_id: Default::default(),
				pubEncSymKey: pub_enc_sym_key.serialize(),
				protocolVersion: CryptoProtocolVersion::TutaCrypt as i64,
				recipientIdentifier: recipient_identifier,
				recipientIdentifierType: recipient_identifier_type as i64,
				recipientKeyVersion: 0,
				senderKeyVersion: Some(sender_key_version),
			};

			let result = asymmetric_crypto_facade
				.decrypt_sym_key_with_key_pair_and_authenticate(
					AsymmetricKeyPair::PQKeyPairs(recipient_key_pair),
					pub_enc_key_data,
					PublicKeyIdentifier {
						identifier: sender_identifier,
						identifier_type: sender_identifier_type,
					},
				)
				.await;
			assert!(result.is_err());
			assert!(matches!(
				result.err().unwrap(),
				AsymmetricCryptoError::AuthenticationError { .. }
			));
		}

		#[tokio::test]
		async fn should_not_try_authentication_when_protocol_is_not_tuta_crypt() {
			let (
				_sender_key_version,
				sender_identifier,
				sender_identifier_type,
				_first_service_executor_invocation,
				mut service_executor,
			) = setup_authentication_test();

			service_executor.expect_get::<PublicKeyService>().never();

			let asymmetric_crypto_facade = make_asymmetric_crypto_facade(service_executor);

			let randomizer_facade = make_thread_rng_facade();
			let recipient_key_pair = RSAKeyPair::generate(&randomizer_facade);

			let sym_key = Aes256Key::generate(&randomizer_facade);
			let pub_enc_sym_key = recipient_key_pair
				.public_key
				.encrypt(&randomizer_facade, sym_key.as_bytes())
				.unwrap();
			let pub_enc_key_data: PubEncKeyData = PubEncKeyData {
				_id: Default::default(),
				pubEncSymKey: pub_enc_sym_key,
				recipientIdentifier: "".to_string(),
				recipientIdentifierType: 0,
				recipientKeyVersion: 0,
				protocolVersion: CryptoProtocolVersion::Rsa as i64,
				senderKeyVersion: None,
			};

			let result = asymmetric_crypto_facade
				.decrypt_sym_key_with_key_pair_and_authenticate(
					AsymmetricKeyPair::RSAKeyPair(recipient_key_pair),
					pub_enc_key_data,
					PublicKeyIdentifier {
						identifier: sender_identifier,
						identifier_type: sender_identifier_type,
					},
				)
				.await
				.unwrap();

			assert_eq!(result.sender_identity_pub_key, None);
			assert_eq!(result.decrypted_aes_key, GenericAesKey::Aes256(sym_key));
		}
	}

	mod decrypt_sym_key_with_key_pair {
		use crate::crypto::aes::Iv;
		use crate::crypto::asymmetric_crypto_facade::{
			AsymmetricCryptoError, AsymmetricCryptoFacade,
		};
		use crate::crypto::ecc::EccKeyPair;
		use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey};
		use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
		use crate::crypto::rsa::RSAKeyPair;
		use crate::crypto::tuta_crypt::PQMessage;
		use crate::crypto::{Aes256Key, PQKeyPairs};
		use crate::tutanota_constants::CryptoProtocolVersion;

		#[tokio::test]
		async fn error_when_the_protocol_version_is_symmetric() {
			let result = AsymmetricCryptoFacade::decrypt_sym_key_with_key_pair(
				AsymmetricKeyPair::RSAKeyPair(RSAKeyPair::generate(&make_thread_rng_facade())),
				&CryptoProtocolVersion::SymmetricEncryption,
				&vec![1, 2, 3],
			);
			assert!(result.is_err());
			assert!(matches!(
				result.err().unwrap(),
				AsymmetricCryptoError::InvalidCryptoProtocolVersion { .. }
			));
		}

		#[tokio::test]
		async fn should_call_rsa_decryption_when_the_protocol_version_is_set_to_rsa() {
			let randomizer_facade = make_thread_rng_facade();
			let recipient_key_pair = RSAKeyPair::generate(&randomizer_facade);

			let sym_key = Aes256Key::generate(&randomizer_facade);
			let pub_enc_sym_key = recipient_key_pair
				.public_key
				.encrypt(&randomizer_facade, sym_key.as_bytes())
				.unwrap();

			let result = AsymmetricCryptoFacade::decrypt_sym_key_with_key_pair(
				AsymmetricKeyPair::RSAKeyPair(recipient_key_pair),
				&CryptoProtocolVersion::Rsa,
				&pub_enc_sym_key,
			)
			.unwrap();

			assert_eq!(result.sender_identity_pub_key, None);
			assert_eq!(result.decrypted_aes_key, GenericAesKey::Aes256(sym_key));
		}

		#[tokio::test]
		async fn error_when_crypto_protocol_version_does_not_match_key_pair_rsa() {
			let result = AsymmetricCryptoFacade::decrypt_sym_key_with_key_pair(
				AsymmetricKeyPair::PQKeyPairs(PQKeyPairs::generate(&make_thread_rng_facade())),
				&CryptoProtocolVersion::Rsa,
				&vec![1, 2, 3],
			);
			assert!(result.is_err());
			assert!(matches!(
				result.err().unwrap(),
				AsymmetricCryptoError::UnexpectedAsymmetricKeyPairType { .. }
			));
		}

		#[tokio::test]
		async fn error_when_crypto_protocol_version_does_not_match_key_pair_tuta_crypt() {
			let result = AsymmetricCryptoFacade::decrypt_sym_key_with_key_pair(
				AsymmetricKeyPair::RSAKeyPair(RSAKeyPair::generate(&make_thread_rng_facade())),
				&CryptoProtocolVersion::TutaCrypt,
				&vec![1, 2, 3],
			);
			assert!(result.is_err());
			assert!(matches!(
				result.err().unwrap(),
				AsymmetricCryptoError::UnexpectedAsymmetricKeyPairType { .. }
			));
		}

		#[tokio::test]
		async fn should_call_tuta_crypt_decryption_when_the_protocol_version_is_set_to_tuta_crypt()
		{
			let randomizer_facade = make_thread_rng_facade();
			let recipient_key_pair = PQKeyPairs::generate(&randomizer_facade);

			let sender_ecc_key_pair = EccKeyPair::generate(&randomizer_facade);
			let sym_key = Aes256Key::generate(&randomizer_facade);
			let pub_enc_sym_key = PQMessage::encapsulate(
				&sender_ecc_key_pair,
				&EccKeyPair::generate(&randomizer_facade),
				&recipient_key_pair.ecc_keys.public_key.clone(),
				&recipient_key_pair.kyber_keys.public_key.clone(),
				&sym_key,
				Iv::generate(&randomizer_facade),
			)
			.unwrap();

			let result = AsymmetricCryptoFacade::decrypt_sym_key_with_key_pair(
				AsymmetricKeyPair::PQKeyPairs(recipient_key_pair),
				&CryptoProtocolVersion::TutaCrypt,
				&pub_enc_sym_key.serialize(),
			)
			.unwrap();

			assert_eq!(
				result.sender_identity_pub_key,
				Some(sender_ecc_key_pair.public_key)
			);
			assert_eq!(result.decrypted_aes_key, GenericAesKey::Aes256(sym_key));
		}
	}

	mod encrypt_pub_sym_key {
		// let recipientKeyVersion = 1
		// let sender_key_version = 2
		// let senderGroupId = "senderGroupId"
		// let symKey: AesKey
		// let pubEncSymKeyBytes: Uint8Array
		// let recipientKyberPublicKey: KyberPublicKey
		// let senderPqKeyPair: Versioned<PQKeyPairs>
		// let ephemeralKeyPair: EccKeyPair
		//
		// o.beforeEach(function () {
		// recipientKyberPublicKey = object<KyberPublicKey>()
		// symKey = [1, 2, 3, 4]
		// pubEncSymKeyBytes = object<Uint8Array>()
		// senderPqKeyPair = {
		// object: { keyPairType: KeyPairType.TUTA_CRYPT, eccKeyPair: object(), kyberKeyPair: object() },
		// version: sender_key_version,
		// }
		// ephemeralKeyPair = object()
		// when(cryptoWrapper.generateEccKeyPair()).thenReturn(ephemeralKeyPair)
		// when(keyLoaderFacade.loadCurrentKeyPair(senderGroupId)).thenResolve(senderPqKeyPair)
		// })

		use crate::crypto::asymmetric_crypto_facade::{AsymmetricCryptoFacade, PublicKeys};
		use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey};
		use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
		use crate::crypto::rsa::RSAKeyPair;
		use crate::crypto::{Aes256Key, PQKeyPairs};
		use crate::entities::generated::sys::PublicKeyPutIn;
		use crate::key_loader_facade::MockKeyLoaderFacade;
		use crate::services::generated::sys::PublicKeyService;
		use crate::services::service_executor::MockServiceExecutor;
		use crate::services::ExtraServiceParams;
		use crate::tutanota_constants::CryptoProtocolVersion;
		use crate::util::Versioned;
		use crate::GeneratedId;
		use mockall::predicate::eq;
		use std::sync::Arc;

		#[tokio::test]
		async fn encrypt_the_sym_key_with_the_recipient_pq_public_key() {
			let sender_key_version = 1i64;
			let sender_group_id = GeneratedId::test_random();

			let mut service_executor = MockServiceExecutor::default();
			service_executor.expect_get::<PublicKeyService>().never();

			let mut key_loader_facade = MockKeyLoaderFacade::default();

			let randomizer_facade = make_thread_rng_facade();
			let sender_key_pair =
				AsymmetricKeyPair::PQKeyPairs(PQKeyPairs::generate(&randomizer_facade));
			key_loader_facade
				.expect_load_current_key_pair()
				.with(eq(sender_group_id.clone()))
				.returning(move |_| {
					Ok(Versioned {
						object: sender_key_pair.clone(),
						version: sender_key_version,
					})
				});

			let asymmetric_crypto_facade = AsymmetricCryptoFacade::new(
				Arc::new(key_loader_facade),
				make_thread_rng_facade(),
				Arc::new(service_executor),
			);

			let sym_key = Aes256Key::generate(&randomizer_facade);
			let recipient_key_pair = PQKeyPairs::generate(&randomizer_facade);
			let recipient_key_version = 3i64;
			let versioned_recipient_public_keys: Versioned<PublicKeys> = Versioned {
				version: recipient_key_version,
				object: PublicKeys {
					pub_ecc_key: Some(
						recipient_key_pair
							.ecc_keys
							.public_key
							.clone()
							.as_bytes()
							.to_vec(),
					),
					pub_kyber_key: Some(
						recipient_key_pair.kyber_keys.public_key.clone().serialize(),
					),
					pub_rsa_key: None,
				},
			};
			let pub_enc_sym_key = asymmetric_crypto_facade
				.asym_encrypt_sym_key(
					GenericAesKey::Aes256(sym_key),
					versioned_recipient_public_keys,
					&sender_group_id,
				)
				.await
				.unwrap();

			assert_eq!(
				pub_enc_sym_key.crypto_protocol_version,
				CryptoProtocolVersion::TutaCrypt
			);
			assert_eq!(pub_enc_sym_key.sender_key_version, Some(sender_key_version));
			assert_eq!(pub_enc_sym_key.recipient_key_version, recipient_key_version);
			assert!(pub_enc_sym_key.pub_enc_sym_key_bytes.len() > 1000); // tutaCrypt tests will check that this is a valid pqmessage
		}

		#[tokio::test]
		async fn recipient_has_pq_public_key_and_sender_has_only_rsa_key_pair_then_put_sender_ecc_key(
		) {
			let sender_key_version = 1i64;
			let sender_group_id = GeneratedId::test_random();
			let sender_group_id_clone = sender_group_id.clone();

			let mut service_executor = MockServiceExecutor::default();
			service_executor.expect_get::<PublicKeyService>().never();
			service_executor
				.expect_put::<PublicKeyService>()
				.withf(
					move |put_in: &PublicKeyPutIn, _params: &ExtraServiceParams| {
						put_in.keyGroup == sender_group_id_clone
					},
				)
				.returning(|_, _| Ok(()))
				.once();

			let mut key_loader_facade = MockKeyLoaderFacade::default();

			let randomizer_facade = make_thread_rng_facade();
			let sender_key_pair =
				AsymmetricKeyPair::RSAKeyPair(RSAKeyPair::generate(&randomizer_facade));
			key_loader_facade
				.expect_load_current_key_pair()
				.with(eq(sender_group_id.clone()))
				.returning(move |_| {
					Ok(Versioned {
						object: sender_key_pair.clone(),
						version: sender_key_version,
					})
				});

			let current_sym_sender_group_key = Aes256Key::generate(&randomizer_facade);
			key_loader_facade
				.expect_get_current_sym_group_key()
				.with(eq(sender_group_id.clone()))
				.returning(move |_| {
					Ok(Versioned {
						version: sender_key_version,
						object: GenericAesKey::Aes256(current_sym_sender_group_key.clone()),
					})
				})
				.once();

			let asymmetric_crypto_facade = AsymmetricCryptoFacade::new(
				Arc::new(key_loader_facade),
				make_thread_rng_facade(),
				Arc::new(service_executor),
			);

			let sym_key = Aes256Key::generate(&randomizer_facade);
			let recipient_key_pair = PQKeyPairs::generate(&randomizer_facade);
			let recipient_key_version = 3i64;
			let versioned_recipient_public_keys: Versioned<PublicKeys> = Versioned {
				version: recipient_key_version,
				object: PublicKeys {
					pub_ecc_key: Some(
						recipient_key_pair
							.ecc_keys
							.public_key
							.clone()
							.as_bytes()
							.to_vec(),
					),
					pub_kyber_key: Some(
						recipient_key_pair.kyber_keys.public_key.clone().serialize(),
					),
					pub_rsa_key: None,
				},
			};
			let pub_enc_sym_key = asymmetric_crypto_facade
				.asym_encrypt_sym_key(
					GenericAesKey::Aes256(sym_key),
					versioned_recipient_public_keys,
					&sender_group_id,
				)
				.await
				.unwrap();

			assert_eq!(
				pub_enc_sym_key.crypto_protocol_version,
				CryptoProtocolVersion::TutaCrypt
			);
			assert_eq!(pub_enc_sym_key.sender_key_version, Some(sender_key_version));
			assert_eq!(pub_enc_sym_key.recipient_key_version, recipient_key_version);
			assert!(pub_enc_sym_key.pub_enc_sym_key_bytes.len() > 1000); // tutaCrypt tests will check that this is a valid pqmessage
		}

		#[tokio::test]
		async fn encrypt_rsa() {
			let sender_group_id = GeneratedId::test_random();

			let mut service_executor = MockServiceExecutor::default();
			service_executor.expect_put::<PublicKeyService>().never();
			service_executor.expect_get::<PublicKeyService>().never();

			let key_loader_facade = MockKeyLoaderFacade::default();

			let randomizer_facade = make_thread_rng_facade();

			let asymmetric_crypto_facade = AsymmetricCryptoFacade::new(
				Arc::new(key_loader_facade),
				make_thread_rng_facade(),
				Arc::new(service_executor),
			);

			let sym_key = Aes256Key::generate(&randomizer_facade);
			let recipient_key_pair = RSAKeyPair::generate(&randomizer_facade);
			let recipient_key_version = 3i64;
			let versioned_recipient_public_keys: Versioned<PublicKeys> = Versioned {
				version: recipient_key_version,
				object: PublicKeys {
					pub_ecc_key: None,
					pub_kyber_key: None,
					pub_rsa_key: Some(recipient_key_pair.public_key.serialize()),
				},
			};

			let pub_enc_sym_key = asymmetric_crypto_facade
				.asym_encrypt_sym_key(
					GenericAesKey::Aes256(sym_key),
					versioned_recipient_public_keys,
					&sender_group_id,
				)
				.await
				.unwrap();

			assert_eq!(
				pub_enc_sym_key.crypto_protocol_version,
				CryptoProtocolVersion::Rsa
			);
			assert_eq!(pub_enc_sym_key.sender_key_version, None);
			assert_eq!(pub_enc_sym_key.recipient_key_version, recipient_key_version);
			assert!(pub_enc_sym_key.pub_enc_sym_key_bytes.len() > 1); // rsa tests will check that this is a valid ciphertext
		}
		mod tuta_crypt_encrypt_sym_key {
			use crate::crypto::asymmetric_crypto_facade::tests::make_asymmetric_crypto_facade;
			use crate::crypto::asymmetric_crypto_facade::{AsymmetricCryptoError, PublicKeys};
			use crate::crypto::ecc::EccKeyPair;
			use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
			use crate::crypto::rsa::RSAKeyPair;
			use crate::crypto::Aes256Key;
			use crate::services::generated::sys::PublicKeyService;
			use crate::services::service_executor::MockServiceExecutor;
			use crate::util::Versioned;

			#[tokio::test]
			async fn error_when_passing_an_rsa_public_key() {
				let sender_key_version = 1i64;

				let mut service_executor = MockServiceExecutor::default();
				service_executor.expect_get::<PublicKeyService>().never();
				let randomizer_facade = make_thread_rng_facade();

				let asymmetric_crypto_facade = make_asymmetric_crypto_facade(service_executor);

				let sym_key = Aes256Key::generate(&randomizer_facade);
				let recipient_key_pair = RSAKeyPair::generate(&randomizer_facade);
				let recipient_key_version = 3i64;
				let versioned_recipient_public_keys: Versioned<PublicKeys> = Versioned {
					version: recipient_key_version,
					object: PublicKeys {
						pub_ecc_key: None,
						pub_kyber_key: None,
						pub_rsa_key: Some(recipient_key_pair.public_key.serialize()),
					},
				};

				let result = asymmetric_crypto_facade.tuta_crypt_encrypt_sym_key(
					sym_key,
					versioned_recipient_public_keys,
					Versioned {
						version: sender_key_version,
						object: EccKeyPair::generate(&randomizer_facade),
					},
				);

				assert!(result.is_err());
				assert!(matches!(
					result.err().unwrap(),
					AsymmetricCryptoError::UnexpectedPublicKeyPairType { .. }
				));
			}
		}
	}
}
