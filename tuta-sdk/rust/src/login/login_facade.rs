use std::sync::Arc;

use base64::{DecodeError, Engine};
use base64::prelude::{BASE64_STANDARD, BASE64_URL_SAFE_NO_PAD};
use thiserror::Error;

use crate::{ApiCallError, IdTuple};
use crate::ApiCallError::InternalSdkError;
use crate::crypto::{Aes256Key, generate_key_from_passphrase, sha256};
use crate::crypto::key::GenericAesKey;
use crate::element_value::ParsedEntity;
use crate::entities::Entity;
use crate::entities::sys::{Session, User};
#[mockall_double::double]
use crate::entity_client::EntityClient;
#[mockall_double::double]
use crate::typed_entity_client::TypedEntityClient;
use crate::generated_id::{GENERATED_ID_BYTES_LENGTH, GeneratedId};
#[mockall_double::double]
use crate::key_cache::KeyCache;
use crate::login::credentials::Credentials;
use crate::user_facade::UserFacade;
use crate::util::{array_cast_slice, BASE64_EXT};

/// Error that may occur during login and session creation
#[derive(Error, Debug, uniffi::Error)]
pub enum LoginError {
    #[error("InvalidSessionId: {error_message}")]
    InvalidSessionId {
        error_message: String,
    },
    #[error("InvalidPassphrase: {error_message}")]
    InvalidPassphrase {
        error_message: String,
    },
    #[error("InvalidKey: {error_message}")]
    InvalidKey {
        error_message: String,
    },
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

impl KdfType {
    pub fn parse(i: i64) -> Option<Self> {
        match i {
            0 => Some(KdfType::Bcrypt),
            1 => Some(KdfType::Argon2id),
            _ => None
        }
    }
}

/// Simple LoginFacade that take in an existing credential
/// and returns a UserFacade after resuming the session.
pub struct LoginFacade {
    entity_client: Arc<EntityClient>,
    typed_entity_client: Arc<TypedEntityClient>,
}

impl LoginFacade {
    pub fn new(
        entity_client: Arc<EntityClient>,
        typed_entity_client: Arc<TypedEntityClient>,
    ) -> Self {
        LoginFacade {
            entity_client,
            typed_entity_client,
        }
    }

    /// Resumes previously created session (using persisted credentials).
    pub async fn resume_session(&self, credentials: &Credentials, key_cache: Arc<KeyCache>) -> Result<UserFacade, LoginError> {
        let session_id = parse_session_id(credentials.access_token.as_str())
            .map_err(|e| LoginError::InvalidSessionId { error_message: format!("Could not decode session id: {}", e) })?;
        // Cannot use typed client because session is encrypted, and we haven't init crypto client yet
        let session: ParsedEntity = self.entity_client.load(&Session::type_ref(), &session_id).await?;

        let access_key = self.get_access_key(&session)?;
        let passphrase = self.decrypt_passphrase(&credentials, access_key)?;

        let user: User = self.typed_entity_client.load(&credentials.user_id).await?;

        let user_passphrase_key = self.load_user_passphrase_key(&user, passphrase.as_str()).await?;

        let user_facade = self.init_session(user, user_passphrase_key, key_cache).await?;

        Ok(user_facade)
    }

    async fn derive_user_passphrase_key(&self, kdf_type: KdfType, passphrase: &str, salt: [u8; 16]) -> Aes256Key {
        match kdf_type {
            KdfType::Argon2id => {
                generate_key_from_passphrase(passphrase, salt)
            }
            KdfType::Bcrypt => panic!("BCrypt not implemented")
        }
    }

    /// Derive a key given a KDF type, passphrase, and salt
    async fn load_user_passphrase_key(&self, user: &User, passphrase: &str) -> Result<Aes256Key, ApiCallError> {
        let Some(salt) = user.salt.as_ref() else {
            return Err(InternalSdkError { error_message: "Salt is missing from User!".to_string() });
        };
        let kdf_type = KdfType::parse(user.kdfVersion)
            .ok_or_else(|| InternalSdkError {
                error_message: format!("Unknown KDF type: {}", user.kdfVersion)
            })?;
        Ok(self.derive_user_passphrase_key(
            kdf_type,
            passphrase,
            array_cast_slice(salt, "Vec").map_err(|e|
            ApiCallError::internal_with_err(e, "Invalid salt")
            )?).await)
    }

    /// Initialize a session with given user id and return a new UserFacade
    async fn init_session(&self, user: User, user_passphrase_key: Aes256Key, key_cache: Arc<KeyCache>) -> Result<UserFacade, LoginError> {
        let user_facade = UserFacade::new(key_cache, user);

        user_facade.unlock_user_group_key(user_passphrase_key)
            .map_err(|e| LoginError::InvalidKey { error_message: format!("Failed to unlock user group key: {}", e.to_string()) })?;
        Ok(user_facade)
    }

    /// Decrypt user passphrase with given credentials
    fn decrypt_passphrase(&self, credentials: &Credentials, access_key: GenericAesKey) -> Result<String, LoginError> {
        String::from_utf8(
            access_key.decrypt_data(credentials.encrypted_password.as_slice())
                .map_err(|e| LoginError::InvalidPassphrase {
                    error_message: format!("Failed to decrypt user passphrase: {}, key: {}, enc_pwd: {}", e.to_string(), BASE64_STANDARD.encode(access_key.as_bytes()), String::from_utf8_lossy(credentials.encrypted_password.as_slice()))
                })?)
            .map_err(|e| LoginError::InvalidPassphrase {
                error_message: format!("Failed to decode user passphrase into plaintext: {}", e.to_string())
            })
    }

    /// Get access key from session
    fn get_access_key(&self, session: &ParsedEntity) -> Result<GenericAesKey, LoginError> {
        let access_key_raw = session.get("accessKey")
            .ok_or_else(|| LoginError::ApiCall {
                source: InternalSdkError{ error_message: "no access key on session!".to_owned() }
        })?.assert_bytes();
        let access_key = GenericAesKey::from_bytes(access_key_raw.as_slice())
            .map_err(|e| LoginError::ApiCall {
                source: InternalSdkError {
                    error_message: format!("Failed to create AES key from access key string: {}", e.to_string())
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
    Ok(IdTuple { list_id, element_id })
}

#[cfg(test)]
mod tests {
    use std::sync::Arc;
    use base64::Engine;
    use base64::prelude::BASE64_STANDARD;
    use mockall::predicate::eq;
    use crate::login::credentials::{Credentials, CredentialType};
    use crate::login::login_facade::LoginFacade;
    use crate::IdTuple;
    use crate::crypto::{Aes256Key, Iv};
    use crate::crypto::key::GenericAesKey;
    use crate::crypto::randomizer_facade::RandomizerFacade;
    use crate::entities::sys::{GroupMembership, Session, User, UserExternalAuthInfo};
    use crate::entity_client::MockEntityClient;
    use crate::generated_id::GeneratedId;
    use crate::key_cache::MockKeyCache;

    use crate::typed_entity_client::MockTypedEntityClient;

    #[tokio::test]
    async fn test_resume_session() {
        let randomizer = RandomizerFacade::from_core(rand::rngs::OsRng {});
        let user_id = "userId".to_string();
        let access_token = "ZB-VPZfACMABhx-jUBZ91wyBWLlaJ6AIzg".to_string();
        let passphrase = "passphrase2";
        let salt: Option<Vec<u8>> = Some(vec![0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
        let iv = Iv::generate(&randomizer);
        let access_key = GenericAesKey::from(Aes256Key::generate(&randomizer));
        let user = make_user(&user_id, salt);
        let session = make_session(&user_id, &access_key);
        let session_id = IdTuple {
            list_id: GeneratedId("O0yKEOU-1B-0".to_owned()),
            element_id: GeneratedId("jlv3AEmnv8rvtZe38u2dk-U1kzxpkMXWNusNz-NhnMI".to_owned()),
        };
        let mut mock_entity_client = MockEntityClient::default();
        let mut mock_typed_entity_client = MockTypedEntityClient::default();

        mock_typed_entity_client.expect_load::<User, GeneratedId>()
            .with(eq(GeneratedId(user_id.clone())))
            .returning(move |_| { Ok(user.clone()) });

        mock_typed_entity_client.expect_load::<Session, IdTuple>()
            .with(eq(session_id.clone()))
            .returning(move |_| { Ok(session.clone()) });

        let login_facade = LoginFacade::new(
            Arc::new(mock_entity_client),
            Arc::new(mock_typed_entity_client),
        );
        let key_cache = Arc::new(MockKeyCache::default());

        let user_facade = login_facade.resume_session(&Credentials {
            login: "login@tuta.io".to_string(),
            user_id: user_id.clone(),
            access_token: access_token.clone(),
            encrypted_password: access_key.encrypt_data(passphrase.as_bytes(), iv).unwrap(),
            credential_type: CredentialType::Internal,
        }, key_cache).await.unwrap();

        // assert!(matches!(user_facade.get_user(), ))
    }

    fn make_session(user_id: &String, access_key: &GenericAesKey) -> Session {
        Session {
            _format: 0,
            _id: IdTuple { list_id: Default::default(), element_id: Default::default() },
            _ownerEncSessionKey: None,
            _ownerGroup: None,
            _ownerKeyVersion: None,
            _permissions: Default::default(),
            accessKey: Some(BASE64_STANDARD.encode(access_key.as_bytes()).into()),
            clientIdentifier: "".to_string(),
            lastAccessTime: Default::default(),
            loginIpAddress: None,
            loginTime: Default::default(),
            state: 0,
            challenges: vec![],
            user: GeneratedId(user_id.clone()),
        }
    }

    fn make_user(user_id: &String, salt: Option<Vec<u8>>) -> User {
        User {
            _format: 0,
            _id: GeneratedId(user_id.to_string()),
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
                symEncGKey: Default::default(),
                groupInfo: IdTuple {
                    list_id: GeneratedId("groupInfoListId".to_string()),
                    element_id: GeneratedId("groupInfoElId".to_string()),
                },
                groupType: None,
                symKeyVersion: 0,
                groupMember: IdTuple { list_id: Default::default(), element_id: Default::default() },
            },
            kdfVersion: 1,
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
            phoneNumbers: vec![],
            pushIdentifierList: None,
            secondFactorAuthentications: Default::default(),
            enabled: false,
            salt,
            customer: None,
            successfulLogins: Default::default(),
        }
    }
}