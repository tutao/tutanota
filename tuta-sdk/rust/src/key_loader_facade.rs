use std::sync::Arc;
use crate::ApiCallError;
use crate::crypto::aes::{Aes128Key, Aes256Key};
use crate::entities::Entity;
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

        let group_key = match current_group_key.clone() {
            Some(n) => n,
            None => self.get_current_sym_group_key(group_id).await
        };

        if group_key.version == version {
            return Ok(group_key.object);
        }
        else if group_key.version < version {
            if attempts < 1 {
                return Err(ApiCallError::InternalSdkError { error_message: "Too many recursive attempts to load group key".to_owned() });
            }

            let logged_in_user = self.user_facade.get_logged_in_user();
            let user: User = self.entity_client.load(&User::type_ref(), &IdType::Single(group_id.to_owned())).await?;
            self.user_facade.update_user(user).await;
            return self.load_sym_group_key(group_id, version, current_group_key, Some(attempts - 1));
        }

        let group: Group = self.entity_client.load(Group::type_ref(), group_id).await?;
        let symmetric_group_key = self.find_former_group_key(&group, &group_key, version);


        todo!()

        // let group_key = current_group_key
    }

    async fn find_former_group_key(&self, group: &Group, group_id: &str, version: i64) -> FormerGroupKey {
        match group.formerGroupKeys.as_ref() {
            Some(g) => g.list.clone(),
            None => {
                let new_group: Group = self.entity_client.load(&GroupKey::type_ref(), &IdType::Single(group_id.to_owned())).await?;
            }
        }
    }

    async fn get_current_sym_group_key(&self, group_id: &str) -> VersionedKey {
        if group_id == self.user_facade.get_user_group_id() {
            return self.get_current_sym_user_group_key().expect("should have a current group key")
        }
        self.key_cache.get_current_group_key(group_id.to_owned(), |group_id| self.load_and_decrypt_current_sym_group_key())
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

struct FormerGroupKey {
    symmetric_group_key: GenericAesKey,
    group_key_instance: GroupKey
}