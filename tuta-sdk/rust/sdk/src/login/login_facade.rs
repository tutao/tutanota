use std::sync::Arc;

use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::{DecodeError, Engine};
use thiserror::Error;

use crate::crypto::key::GenericAesKey;
use crate::crypto::{generate_key_from_passphrase, sha256, Aes256Key};
use crate::element_value::ParsedEntity;
use crate::entities::sys::{Session, User};
use crate::entities::Entity;
#[cfg_attr(test, mockall_double::double)]
use crate::entity_client::EntityClient;
use crate::generated_id::{GeneratedId, GENERATED_ID_BYTES_LENGTH};
use crate::login::credentials::Credentials;
#[cfg_attr(test, mockall_double::double)]
use crate::typed_entity_client::TypedEntityClient;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::util::{array_cast_slice, BASE64_EXT};
use crate::ApiCallError::InternalSdkError;
use crate::{ApiCallError, IdTuple};

/// Error that may occur during login and session creation
#[derive(Error, Debug, uniffi::Error, Clone, PartialEq)]
pub enum LoginError {
	#[error("InvalidSessionId: {error_message}")]
	InvalidSessionId { error_message: String },
	#[error("InvalidPassphrase: {error_message}")]
	InvalidPassphrase { error_message: String },
	#[error("InvalidKey: {error_message}")]
	InvalidKey { error_message: String },
	#[error("ApiCall: {source}")]
	ApiCall {
		#[from]
		source: ApiCallError,
	},
}

pub enum KdfType {
	Bcrypt,
	Argon2id,
}

impl TryFrom<i64> for KdfType {
	// TODO: Use a specific error here
	type Error = ApiCallError;

	fn try_from(value: i64) -> Result<Self, Self::Error> {
		match value {
			0 => Ok(KdfType::Bcrypt),
			1 => Ok(KdfType::Argon2id),
			_ => Err(InternalSdkError {
				error_message: format!("Failed to convert int {} into KdfType", value),
			}),
		}
	}
}

/// Simple LoginFacade that take in an existing credential
/// and returns a UserFacade after resuming the session.
pub struct LoginFacade {
	entity_client: Arc<EntityClient>,
	typed_entity_client: Arc<TypedEntityClient>,
	user_facade_factory: fn(user: User) -> UserFacade,
}

impl LoginFacade {
	pub fn new(
		entity_client: Arc<EntityClient>,
		typed_entity_client: Arc<TypedEntityClient>,
		user_facade_factory: fn(user: User) -> UserFacade,
	) -> Self {
		LoginFacade {
			entity_client,
			typed_entity_client,
			user_facade_factory,
		}
	}

	/// Resumes previously created session (using persisted credentials).
	#[allow(dead_code)] // Used over FFI
	pub async fn resume_session(
		&self,
		credentials: &Credentials,
	) -> Result<UserFacade, LoginError> {
		let session_id = parse_session_id(credentials.access_token.as_str()).map_err(|e| {
			LoginError::InvalidSessionId {
				error_message: format!("Could not decode session id: {}", e),
			}
		})?;
		// Cannot use typed client because session is encrypted, and we haven't init crypto client yet
		let session: ParsedEntity = self
			.entity_client
			.load(&Session::type_ref(), &session_id)
			.await?;

		let access_key = self.get_access_key(&session)?;
		let passphrase_key = access_key
			.decrypt_aes_key(&credentials.encrypted_passphrase_key)
			.map_err(|e| LoginError::InvalidPassphrase {
				error_message: format!("Failed to decrypt key: {e}"),
			})?;

		let user: User = self.typed_entity_client.load(&credentials.user_id).await?;

		let user_facade = self.init_session(user, passphrase_key)?;

		Ok(user_facade)
	}

	/// Derive a key given a KDF type, passphrase, and salt
	#[allow(dead_code)]
	fn load_user_passphrase_key(
		&self,
		user: &User,
		passphrase: &str,
	) -> Result<Aes256Key, ApiCallError> {
		let Some(salt) = user.salt.as_ref() else {
			return Err(InternalSdkError {
				error_message: "Salt is missing from User!".to_string(),
			});
		};
		Ok(derive_user_passphrase_key(
			KdfType::try_from(user.kdfVersion)?,
			passphrase,
			array_cast_slice(salt, "Vec")
				.map_err(|e| ApiCallError::internal_with_err(e, "Invalid salt"))?,
		))
	}

	/// Initialize a session with given user id and return a new UserFacade
	fn init_session(
		&self,
		user: User,
		user_passphrase_key: GenericAesKey,
	) -> Result<UserFacade, LoginError> {
		let user_facade = (self.user_facade_factory)(user);

		user_facade
			.unlock_user_group_key(user_passphrase_key)
			.map_err(|e| LoginError::InvalidKey {
				error_message: format!("Failed to unlock user group key: {e}"),
			})?;
		Ok(user_facade)
	}

	/// Get access key from session
	fn get_access_key(&self, session: &ParsedEntity) -> Result<GenericAesKey, LoginError> {
		let access_key_raw = session
			.get("accessKey")
			.ok_or_else(|| LoginError::ApiCall {
				source: InternalSdkError {
					error_message: "no access key on session!".to_owned(),
				},
			})?
			.assert_bytes();
		let access_key = GenericAesKey::from_bytes(access_key_raw.as_slice()).map_err(|e| {
			LoginError::ApiCall {
				source: InternalSdkError {
					error_message: format!("Failed to create AES key from access key string: {e}"),
				},
			}
		})?;
		Ok(access_key)
	}
}

/// Generate session id tuple from access token
fn parse_session_id(access_token: &str) -> Result<IdTuple, DecodeError> {
	let bytes = BASE64_URL_SAFE_NO_PAD.decode(access_token)?;
	if bytes.len() < GENERATED_ID_BYTES_LENGTH {
		return Err(DecodeError::InvalidLength(bytes.len()));
	}
	let (list_id_bytes, element_id_bytes) = bytes.split_at(GENERATED_ID_BYTES_LENGTH);
	let list_id = GeneratedId(BASE64_EXT.encode(list_id_bytes));
	let element_id = GeneratedId(BASE64_URL_SAFE_NO_PAD.encode(sha256(element_id_bytes)));
	Ok(IdTuple {
		list_id,
		element_id,
	})
}

#[allow(dead_code)]
pub fn derive_user_passphrase_key(
	kdf_type: KdfType,
	passphrase: &str,
	salt: [u8; 16],
) -> Aes256Key {
	match kdf_type {
		KdfType::Argon2id => generate_key_from_passphrase(passphrase, salt),
		KdfType::Bcrypt => panic!("BCrypt not implemented"),
	}
}

#[cfg(test)]
mod tests {
	use std::sync::Arc;

	use mockall::predicate::eq;

	use crate::crypto::key::GenericAesKey;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::crypto::{aes::Iv, Aes128Key, Aes256Key};
	use crate::entities::sys::{GroupMembership, Session, User, UserExternalAuthInfo};
	use crate::entities::Entity;
	use crate::entity_client::MockEntityClient;
	use crate::generated_id::GeneratedId;
	use crate::login::credentials::{CredentialType, Credentials};
	use crate::login::login_facade::LoginFacade;
	use crate::typed_entity_client::MockTypedEntityClient;
	use crate::user_facade::MockUserFacade;
	use crate::util::test_utils::{create_test_entity, typed_entity_to_parsed_entity};
	use crate::IdTuple;

	#[tokio::test]
	async fn test_resume_session() {
		let randomizer = RandomizerFacade::from_core(rand::rngs::OsRng {});
		let user_id = GeneratedId::test_random();
		let access_token = "ZB-VPZfACMABhx-jUBZ91wyBWLlaJ6AIzg".to_string();
		let passphrase_key = Aes256Key::generate(&randomizer);
		let salt: Vec<u8> = vec![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
		let iv = Iv::generate(&randomizer);
		let access_key = GenericAesKey::from(Aes256Key::generate(&randomizer));
		let user = make_user(&user_id, salt, passphrase_key.clone(), &randomizer);
		let session = make_session(&user_id, &access_key);
		let parsed_session = typed_entity_to_parsed_entity(session.clone());

		let session_id = IdTuple {
			list_id: GeneratedId("O0yKEOU-1B-0".to_owned()),
			element_id: GeneratedId("jlv3AEmnv8rvtZe38u2dk-U1kzxpkMXWNusNz-NhnMI".to_owned()),
		};
		let mut mock_entity_client = MockEntityClient::default();
		let mut mock_typed_entity_client = MockTypedEntityClient::default();

		{
			let parsed_session = parsed_session.clone();
			mock_entity_client
				.expect_load::<IdTuple>()
				.with(eq(Session::type_ref()), eq(session_id.clone()))
				.returning(move |_, _| Ok(parsed_session.clone()));
		}

		mock_typed_entity_client
			.expect_load::<User, GeneratedId>()
			.with(eq(user_id.clone()))
			.returning(move |_| Ok(user.clone()));

		let entity_client = Arc::new(mock_entity_client);
		let typed_entity_client = Arc::new(mock_typed_entity_client);
		let login_facade =
			LoginFacade::new(entity_client.clone(), typed_entity_client.clone(), |_| {
				let mut facade = MockUserFacade::default();
				facade.expect_unlock_user_group_key().returning(|_| Ok(()));
				facade
			});

		let _user_facade = login_facade
			.resume_session(&Credentials {
				login: "login@tuta.io".to_string(),
				user_id: user_id.clone(),
				access_token: access_token.clone(),
				encrypted_passphrase_key: access_key.encrypt_key(&passphrase_key.into(), iv),
				credential_type: CredentialType::Internal,
			})
			.await
			.unwrap();

		// assert!(matches!(user_facade.get_user(), ))
	}

	fn make_session(user_id: &GeneratedId, access_key: &GenericAesKey) -> Session {
		Session {
			accessKey: Some(access_key.as_bytes().to_vec()),
			user: user_id.to_owned(),
			..create_test_entity()
		}
	}

	fn make_user(
		user_id: &GeneratedId,
		salt: Vec<u8>,
		passphrase_key: Aes256Key,
		randomizer: &RandomizerFacade,
	) -> User {
		let user_group_key = Aes128Key::generate(randomizer);
		User {
			_format: 0,
			_id: user_id.to_owned(),
			_ownerGroup: None,
			_permissions: Default::default(),
			accountType: 0,
			verifier: Default::default(),
			alarmInfoList: None,
			auth: None,
			authenticatedDevices: vec![],
			userGroup: GroupMembership {
				_id: Default::default(),
				admin: false,
				capability: None,
				groupKeyVersion: 0,
				group: GeneratedId("groupId".to_string()),
				symEncGKey: GenericAesKey::Aes256(passphrase_key)
					.encrypt_key(&user_group_key.into(), Iv::generate(randomizer)),
				groupInfo: IdTuple {
					list_id: GeneratedId("groupInfoListId".to_string()),
					element_id: GeneratedId("groupInfoElId".to_string()),
				},
				groupType: None,
				symKeyVersion: 0,
				groupMember: IdTuple {
					list_id: Default::default(),
					element_id: Default::default(),
				},
			},
			kdfVersion: 1, // Argon2
			requirePasswordUpdate: false,
			externalAuthInfo: Some(UserExternalAuthInfo {
				_id: Default::default(),
				authUpdateCounter: 0,
				autoAuthenticationId: Default::default(),
				autoTransmitPassword: None,
				latestSaltHash: None,
				variableAuthInfo: Default::default(),
			}),
			failedLogins: Default::default(),
			memberships: vec![],
			pushIdentifierList: None,
			secondFactorAuthentications: Default::default(),
			enabled: false,
			salt: Some(salt),
			customer: None,
			successfulLogins: Default::default(),
		}
	}
}
