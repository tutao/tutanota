use std::borrow::ToOwned;
use std::collections::HashMap;
use std::sync::{Arc, RwLock};
use base64::Engine;
use base64::prelude::BASE64_STANDARD;
use crate::{ApiCallError, LoginState};
use crate::crypto::aes::{Aes256Key, AES_256_KEY_SIZE};
use crate::crypto::hkdf::hkdf;
use crate::crypto::sha::sha256;
use crate::entities::sys::{GroupMembership, User};
use crate::key_cache::KeyCache;
use crate::key_encryption::KeyEncryption;
use crate::key_loader_facade::{GenericAesKey, VersionedKey};
use crate::util::Versioned;

pub trait AuthHeadersProvider {
    /// Gets the HTTP request headers used for authorizing REST requests
    fn create_auth_headers(&self) -> HashMap<String, String>;
    fn is_fully_logged_in(&self) -> bool;
}

const USER_GROUP_KEY_DISTRIBUTION_KEY_INFO: &str = "userGroupKeyDistributionKey";

/// FIXME: for testing unencrypted entity downloading. Remove after everything works together.
#[derive(uniffi::Object)]
pub struct UserFacade {
    user: RwLock<Arc<User>>,
    key_cache: Arc<KeyCache>,
    // entity_client: Arc<TypedEntityClient>,
}

impl UserFacade {
    pub fn new(key_cache: Arc<KeyCache>, user: User) -> Self {
        key_cache.clone().reset();
        UserFacade {
            user: RwLock::new(Arc::new(user)),
            key_cache
        }
    }

    pub fn set_user(&mut self, user: User) {
        *self.user.write().unwrap() = Arc::new(user);
    }

    pub fn unlock_user_group_key(&mut self, user_passphrase_key: GenericAesKey) -> Result<(), ApiCallError> {
        let user = self.get_user();
        let user_group_membership = &user.userGroup;
        let current_user_group_key = Versioned::new(
            KeyEncryption::decrypt_key(user_passphrase_key.as_ref(), user_group_membership.symEncGKey.clone())?,
            user_group_membership.groupKeyVersion
        );
        self.key_cache.set_current_user_group_key(current_user_group_key);
        self.set_user_group_key_distribution_key(user_passphrase_key)?;
    }

    fn set_user_group_key_distribution_key(&mut self, user_passphrase_key: GenericAesKey) -> Result<(), ApiCallError> {
        let user = self.get_user();
        let user_group_membership = &user.userGroup;
        let user_group_key_distribution_key = self.derive_user_group_key_distribution_key(&user_group_membership.group, user_passphrase_key)?;
        match user_group_key_distribution_key {
            GenericAesKey::Aes128(_) => {
                Err(ApiCallError::InternalSdkError { error_message: "invalid derived key size".to_owned() })
            }
            GenericAesKey::Aes256(key) => {
                Ok(self.key_cache.set_user_group_key_distribution_key(key))
            }
        }
    }

    // FIXME: Check uint8ArrayToBase64 is correct;
    // there is a max length in the ts version, it seems to be a js thing, can we forego it here?
    fn derive_user_group_key_distribution_key(&self, user_group_id: &str, user_passphrase_key: GenericAesKey) -> Result<GenericAesKey, ApiCallError> {
        // we prepare a key to encrypt potential user group key rotations with
        // when passwords are changed clients are logged-out of other sessions
        // this key is only needed by the logged-in clients, so it should be reliable enough to assume that userPassphraseKey is in sync
        let user_group_id_hash = sha256(user_group_id.as_bytes());
        // we bind this to userGroupId and the domain separator USER_GROUP_KEY_DISTRIBUTION_KEY_INFO
        // the hkdf salt does not have to be secret but should be unique per user and carry some additional entropy which sha256 ensures
        let aes_key =
            hkdf(user_group_id_hash.as_slice(),
                 BASE64_STANDARD.encode(user_passphrase_key).as_bytes(),
                 USER_GROUP_KEY_DISTRIBUTION_KEY_INFO.as_bytes(), AES_256_KEY_SIZE);
        return match aes_key.len() {
            AES_256_KEY_SIZE => {
                Ok(GenericAesKey::Aes256(Aes256Key::from_bytes(aes_key.as_slice()).expect("invalid derived key size")))
            }
            _ => {
                Err(ApiCallError::InternalSdkError { error_message: "invalid derived key size".to_owned() })
            }
        }
    }


    pub async fn update_user(&self, user: User) {
        let user = Arc::new(user);
        *self.user.write().unwrap() = user.clone();
        self.key_cache.remove_outdated_group_keys(user).await;
    }

    pub fn get_user(&self) -> Arc<User> {
        self.user.read().unwrap().clone()
    }
    
    pub fn get_user_group_id(&self) -> String {
        self.get_user().userGroup.group.clone()
    }

    fn get_all_group_ids(&self) -> &[String] {
        let mut groups = Vec::from_iter(
            self.get_logged_in_user().memberships.iter().map(| membership | membership.group)
        );
        groups.push(self.get_logged_in_user().userGroup.group);
        groups.as_slice()
    }

    pub fn get_current_user_group_key(&self) -> Result<VersionedKey, ApiCallError> {
        let Some(current_user_group_key) = self.key_cache.get_current_user_group_key()
        else {
            Err(ApiCallError::InternalSdkError {error_message: "userGroupKey not available".to_owned()})
        };
        Ok((*current_user_group_key).clone())
    }

    fn get_membership(&self, group_id: String) -> Result<GroupMembership, ApiCallError> {
        let Some(membership) = self.get_logged_in_user().memberships.iter().find(| g | g.group == group_id)
        else { Err(ApiCallError::InternalSdkError {error_message: format!("No group with groupId {} found!", group_id)}) };

        Ok(membership.clone())
    }


}

impl AuthHeadersProvider for UserFacade {
    fn create_auth_headers(&self) -> HashMap<String, String> {
        let Some(access_token) = self.access_token.to_owned() else { return HashMap::new() };
        HashMap::from([
            ("accessToken".to_owned(), access_token)
        ])
    }

    fn is_fully_logged_in(&self) -> bool {
        todo!()
    }
}
