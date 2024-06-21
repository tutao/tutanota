use std::sync::Arc;
use base64::Engine;
use futures::future::BoxFuture;
use crate::ApiCallError;
use crate::crypto::aes::{Aes128Key, Aes256Key, aes_128_decrypt_no_padding_fixed_iv, aes_256_decrypt_no_padding, AesKey};
use crate::entities::sys::{Group, GroupKey, User};
use crate::entity_client::IdType;
use crate::key_cache::KeyCache;
use crate::typed_entity_client::TypedEntityClient;
use crate::user_facade::UserFacade;
use crate::util::Versioned;

pub struct KeyLoaderFacade {
    key_cache: KeyCache,
    user_facade: Arc<UserFacade>,
    entity_client: Arc<TypedEntityClient>
}

impl KeyLoaderFacade {
    pub fn new(
        key_cache: KeyCache,
        user_facade: Arc<UserFacade>,
        entity_client: Arc<TypedEntityClient>
    ) -> Self {
        KeyLoaderFacade {
            key_cache,
            user_facade,
            entity_client
        }
    }

    pub async fn load_sym_group_key(&self, group_id: &str, version: i64, current_group_key: Option<VersionedKey>, attempts: Option<i64>) -> Result<GenericAesKey, ApiCallError> {
        let attempts = attempts.unwrap_or(1);

        for _ in 0..attempts {
            let group_key = match current_group_key.clone() {
                Some(n) => n,
                None => self.get_current_sym_group_key(group_id).await?
            };

            if group_key.version == version {
                return Ok(group_key.object);
            }
            else if group_key.version < version {
                let logged_in_user = self.user_facade.get_user();
                let user: User = self.entity_client.load(&IdType::Single(logged_in_user._id.clone())).await?;
                self.user_facade.update_user(user).await;
                continue;
            }

            let group: Group = self.entity_client.load(&IdType::Single(group_id.to_owned())).await?;
            let symmetric_group_key = self.find_former_group_key(&group, &group_key, version).await;

            todo!()
        }

        Err(ApiCallError::InternalSdkError { error_message: "Too many recursive attempts to load group key".to_owned() })
    }

    async fn find_former_group_key(&self, group: &Group, current_group_key: &VersionedKey, target_key_version: i64) -> Result<FormerGroupKey, ApiCallError> {
        let list_id = match group.formerGroupKeys.as_ref() {
            Some(g) => g.list.clone(),
            None => {
                let new_group: Group = self.entity_client.load(&IdType::Single(group._id.to_owned())).await?;
                new_group.formerGroupKeys
                    .map(|k| k.list)
                    .ok_or_else(|| ApiCallError::InternalSdkError { error_message: "No formerGroupKeys in freshly downloaded group!".to_owned() })?
            }
        };

        let start_id = base64::prelude::BASE64_URL_SAFE_NO_PAD.encode(current_group_key.version.to_string().as_bytes());
        let amount_of_keys_including_target = (current_group_key.version - target_key_version) as usize;

        let former_keys: Vec<GroupKey> = self.entity_client.load_range(&list_id, &start_id, amount_of_keys_including_target, true).await?;

        let VersionedKey {
            version: mut last_version,
            object: mut last_group_key
        } = current_group_key.to_owned();

        let mut last_group_key_instance: Option<GroupKey> = None;
        let retrieved_keys_count = former_keys.len();

        for former_key in former_keys {
            let version = self.decode_group_key_version(&former_key._id.element_id)?;
            let next_version = version + 1;

            if next_version > last_version {
                continue;
            } else if next_version == last_version {
                last_version = version;
                last_group_key = last_group_key.decrypt_key(&former_key.ownerEncGKey)?;
                last_group_key_instance = Some(former_key);
                if last_version <= target_key_version {
                    break;
                }
            } else {
                return Err(ApiCallError::InternalSdkError { error_message: format!("Unexpected group key version {version}; expected {last_version}") })
            }
        }

        if last_version != target_key_version || last_group_key_instance.is_none() {
            return Err(ApiCallError::InternalSdkError { error_message: format!("Could not get last version (last version is {last_version} of {retrieved_keys_count} key(s) loaded from list {list_id}") })
        }

        Ok(FormerGroupKey { symmetric_group_key: last_group_key, group_key_instance: last_group_key_instance.unwrap() })
    }

    fn decode_group_key_version(&self, element_id: &str) -> Result<i64, ApiCallError> {
        todo!()
    }

    async fn get_current_sym_group_key(&self, group_id: &str) -> Result<VersionedKey, ApiCallError> {
        if group_id == self.user_facade.get_user_group_id() {
            return self.get_current_sym_user_group_key().ok_or_else(|| ApiCallError::InternalSdkError { error_message: "no current group key".to_owned() })
        }

        if let Some(key) = self.key_cache.get_current_group_key(group_id) {
            return Ok(key)
        }

		// The call leads to recursive calls down the chain, so BoxFuture is used to wrap the recursive async calls
        fn get_key_for_version<'a>(facade: &'a KeyLoaderFacade, group_id: &'a str) -> BoxFuture<'a, Result<VersionedKey, ApiCallError>> {
            Box::pin(facade.load_and_decrypt_current_sym_group_key(&group_id))
        }

        let key = get_key_for_version(self, &group_id).await?;
        self.key_cache.put_group_key(&group_id, &key);
        Ok(key)
    }

    async fn load_and_decrypt_current_sym_group_key(&self, group_id: &str) -> Result<VersionedKey, ApiCallError> {
        let group_membership = self.user_facade.get_membership(group_id)?;
        let required_user_group_key = self.load_sym_user_group_key(group_membership.symKeyVersion).await?;
        let version = group_membership.groupKeyVersion;
        let object = required_user_group_key.decrypt_key(&group_membership.symEncGKey)?;
        Ok(VersionedKey { version, object })
    }

    async fn load_sym_user_group_key(&self, user_group_key_version: i64) -> Result<GenericAesKey, ApiCallError> {
        self.load_sym_group_key(
            &self.user_facade.get_user_group_id(),
            user_group_key_version,
            Some(self.user_facade.get_current_user_group_key()?),
            None
        ).await
    }

    fn get_current_sym_user_group_key(&self) -> Option<VersionedKey> {
        self.user_facade.get_current_user_group_key().ok()
    }
}

pub type VersionedKey = Versioned<GenericAesKey>;

#[derive(Clone)]
pub enum GenericAesKey {
    Aes128(Aes128Key),
    Aes256(Aes256Key),
}

impl GenericAesKey {
    pub fn decrypt_key(&self, key_to_decrypt: &[u8]) -> Result<GenericAesKey, ApiCallError> {
        let decrypted_key = match self {
            Self::Aes128(k) => aes_128_decrypt_no_padding_fixed_iv(k, key_to_decrypt),
            Self::Aes256(k) => aes_256_decrypt_no_padding(k, key_to_decrypt)
        }.map_err(|e| ApiCallError::InternalSdkError { error_message: format!("Failed to decrypt: {e}") })?;

        Self::from_vec(decrypted_key)
            .ok_or_else(|| ApiCallError::InternalSdkError { error_message: "Bad output key size".to_string() })
    }

    pub(crate) fn as_bytes(&self) -> &[u8] {
        match self {
            Self::Aes128(k) => k.get_bytes(),
            Self::Aes256(k) => k.get_bytes()
        }
    }

    fn from_vec(bytes: Vec<u8>) -> Option<Self> {
        match bytes.len() {
            16 => Some(Self::Aes128(Aes128Key::from_bytes(&bytes).unwrap())),
            32 => Some(Self::Aes256(Aes256Key::from_bytes(&bytes).unwrap())),
            _ => None
        }
    }
}

struct FormerGroupKey {
    symmetric_group_key: GenericAesKey,
    group_key_instance: GroupKey
}