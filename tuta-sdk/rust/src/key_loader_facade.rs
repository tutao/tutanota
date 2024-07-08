use std::sync::Arc;
use base64::Engine;
use futures::future::BoxFuture;
use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError};
use crate::crypto::key_encryption::decrypt_key_pair;
use crate::entities::sys::{Group, GroupKey};
use crate::generated_id::GeneratedId;
#[mockall_double::double]
use crate::key_cache::KeyCache;
use crate::ListLoadDirection;
#[mockall_double::double]
use crate::typed_entity_client::TypedEntityClient;
#[mockall_double::double]
use crate::user_facade::UserFacade;
use crate::util::Versioned;

pub struct KeyLoaderFacade {
    key_cache: Arc<KeyCache>,
    user_facade: Arc<UserFacade>,
    entity_client: Arc<TypedEntityClient>,
}

/// Stub for crypto entity client
/// FIXME Rebase/Merge after https://github.com/tutao/tutanota/pull/7137
#[cfg_attr(test, mockall::automock)]
impl KeyLoaderFacade {
    pub fn new(
        key_cache: Arc<KeyCache>,
        user_facade: Arc<UserFacade>,
        entity_client: Arc<TypedEntityClient>,
    ) -> Self {
        KeyLoaderFacade {
            key_cache,
            user_facade,
            entity_client,
        }
    }

    pub async fn load_sym_group_key(&self, group_id: &GeneratedId, version: i64, current_group_key: Option<VersionedAesKey>) -> Result<GenericAesKey, KeyLoadError> {
        let group_key = match current_group_key.clone() {
            Some(n) => n,
            None => self.get_current_sym_group_key(group_id).await?
        };

        return if group_key.version == version {
            Ok(group_key.object)
        } else {
            let group: Group = self.entity_client.load(&group_id.as_str().to_owned()).await?;
            let FormerGroupKey { symmetric_group_key, .. } = self.find_former_group_key(&group, &group_key, version).await?;
            Ok(symmetric_group_key)
        };
    }

    async fn find_former_group_key(&self, group: &Group, current_group_key: &VersionedAesKey, target_key_version: i64) -> Result<FormerGroupKey, KeyLoadError> {
        let list_id = group.formerGroupKeys.clone().unwrap().list;

        let start_id = GeneratedId(base64::prelude::BASE64_URL_SAFE_NO_PAD.encode(current_group_key.version.to_string()));
        let amount_of_keys_including_target = (current_group_key.version - target_key_version) as usize;

        let former_keys: Vec<GroupKey> = self.entity_client.load_range(&list_id, &start_id, amount_of_keys_including_target, ListLoadDirection::ASC).await?;

        let VersionedAesKey {
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
                last_group_key = last_group_key.decrypt_aes_key(&former_key.ownerEncGKey).map_err(|e| {
                    KeyLoadError { reason: e.to_string() }
                })?;
                last_group_key_instance = Some(former_key);
                if last_version <= target_key_version {
                    break;
                }
            } else {
                return Err(KeyLoadError { reason: format!("Unexpected group key version {version}; expected {last_version}") });
            }
        }

        if last_version != target_key_version || last_group_key_instance.is_none() {
            return Err(KeyLoadError { reason: format!("Could not get last version (last version is {last_version} of {retrieved_keys_count} key(s) loaded from list {list_id}") });
        }

        Ok(FormerGroupKey { symmetric_group_key: last_group_key, group_key_instance: last_group_key_instance.unwrap() })
    }

    // TODO: Remove allowance after implementing
    #[allow(unused_variables)]
    fn decode_group_key_version(&self, element_id: &GeneratedId) -> Result<i64, KeyLoadError> {
        todo!()
    }

    pub async fn get_current_sym_group_key(&self, group_id: &GeneratedId) -> Result<VersionedAesKey, KeyLoadError> {
        if *group_id == self.user_facade.get_user_group_id() {
            return self.get_current_sym_user_group_key().ok_or_else(|| KeyLoadError { reason: "no current group key".to_owned() });
        }

        if let Some(key) = self.key_cache.get_current_group_key(group_id) {
            return Ok(key);
        }

        // The call leads to recursive calls down the chain, so BoxFuture is used to wrap the recursive async calls
        fn get_key_for_version<'a>(facade: &'a KeyLoaderFacade, group_id: &'a GeneratedId) -> BoxFuture<'a, Result<VersionedAesKey, KeyLoadError>> {
            Box::pin(facade.load_and_decrypt_current_sym_group_key(&group_id))
        }

        let key = get_key_for_version(self, &group_id).await?;
        self.key_cache.put_group_key(&group_id, &key);
        Ok(key)
    }

    async fn load_and_decrypt_current_sym_group_key(&self, group_id: &GeneratedId) -> Result<VersionedAesKey, KeyLoadError> {
        let group_membership = self.user_facade.get_membership(group_id)?;
        let required_user_group_key = self.load_sym_user_group_key(group_membership.symKeyVersion).await?;
        let version = group_membership.groupKeyVersion;
        let object = required_user_group_key.decrypt_aes_key(&group_membership.symEncGKey).map_err(|e| {
            KeyLoadError { reason: e.to_string() }
        })?;
        Ok(VersionedAesKey { version, object })
    }

    async fn load_sym_user_group_key(&self, user_group_key_version: i64) -> Result<GenericAesKey, KeyLoadError> {
        self.load_sym_group_key(
            &self.user_facade.get_user_group_id(),
            user_group_key_version,
            Some(self.user_facade.get_current_user_group_key().ok_or_else(|| KeyLoadError { reason: "No use group key loaded".to_string() })?),
        ).await
    }

    fn get_current_sym_user_group_key(&self) -> Option<VersionedAesKey> {
        self.user_facade.get_current_user_group_key()
    }

    pub async fn load_key_pair(&self, key_pair_group_id: &GeneratedId, group_key_version: i64) -> Result<AsymmetricKeyPair, KeyLoadError> {
        let group: Group = self.entity_client.load(key_pair_group_id).await?;
        let group_key = self.get_current_sym_group_key(&group._id).await?;

        if group_key.version == group_key_version {
            return self.get_and_decrypt_key_pair(&group, &group_key.object);
        }
        let FormerGroupKey { symmetric_group_key, group_key_instance: GroupKey { keyPair: key_pair, .. }, .. } = self.find_former_group_key(&group, &group_key, group_key_version).await?;
        if let Some(key) = key_pair {
            decrypt_key_pair(&symmetric_group_key, &key)
        } else {
            Err(KeyLoadError { reason: format!("key pair not found for group {key_pair_group_id} and version {group_key_version}") })
        }
    }
    fn get_and_decrypt_key_pair(&self, group: &Group, group_key: &GenericAesKey) -> Result<AsymmetricKeyPair, KeyLoadError> {
        return match &group.currentKeys {
            Some(keys) => decrypt_key_pair(group_key, keys),
            _ => Err(KeyLoadError { reason: format!("no key pair on group {}", group._id) })
        };
    }
}

pub type VersionedAesKey = Versioned<GenericAesKey>;

struct FormerGroupKey {
    symmetric_group_key: GenericAesKey,
    group_key_instance: GroupKey,
}

#[cfg(test)]
mod tests {
    use std::array::from_fn;
    use crate::IdTuple;
    use crate::crypto::{Aes256Key, PQKeyPairs};
    use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
    use crate::entities::sys::KeyPair;
    use crate::key_cache::MockKeyCache;
    use crate::typed_entity_client::MockTypedEntityClient;
    use crate::user_facade::MockUserFacade;
    use super::*;
    use crate::util::test_utils::{generate_random_group, random_aes256_key};

    fn generate_group_data() -> (Group, VersionedAesKey) {
        (
            generate_random_group(),
            VersionedAesKey { object: random_aes256_key().into(), version: 1 }
        )
    }

    const FORMER_KEYS: usize = 2;

    fn generate_former_keys() -> ([GroupKey; FORMER_KEYS], [PQKeyPairs; FORMER_KEYS], [Aes256Key; FORMER_KEYS]) {
        // Using `from_fn` has the same performance as using mutable vecs but less memory usage
        let former_keys_decrypted: [Aes256Key; FORMER_KEYS] = from_fn(|_| {
            random_aes256_key()
        });
        let former_key_pairs_decrypted: [PQKeyPairs; FORMER_KEYS] = from_fn(|_| {
            PQKeyPairs::generate(&make_thread_rng_facade())
        });
        let former_keys: [GroupKey; FORMER_KEYS] = from_fn(|i| {
            let pq_key_pair = &former_key_pairs_decrypted[i];
            GroupKey {
                _format: 0,
                _id: IdTuple {
                    list_id: GeneratedId("list".to_owned()),
                    element_id: GeneratedId(i.to_string()),
                },
                _ownerGroup: None,
                _permissions: Default::default(),
                adminGroupEncGKey: None,
                adminGroupKeyVersion: None,
                ownerEncGKey: Default::default(),
                ownerKeyVersion: 0,
                pubAdminGroupEncGKey: None,
                keyPair: Some(KeyPair {
                    _id: Default::default(),
                    pubEccKey: Some(pq_key_pair.ecc_keys.public_key.as_bytes().to_vec()),
                    pubKyberKey: Some(pq_key_pair.kyber_keys.public_key.as_bytes().to_vec()),
                    pubRsaKey: None,
                    symEncPrivEccKey: Some(Default::default()),
                    symEncPrivKyberKey: Some(vec![]),
                    symEncPrivRsaKey: None,
                }),
            }
        });
        (former_keys, former_key_pairs_decrypted, former_keys_decrypted)
    }

    // fn create_user_facade(user_group_key: &VersionedAesKey) -> MockUserFacade {
    //     let mut user_facade_mock = MockUserFacade::default();
    //     {
    //         let user_group_key = user_group_key.clone();
    //         user_facade_mock.expect_get_current_user_group_key()
    //             .returning(move || Some(user_group_key.clone()));
    //     }
    //     {
    //         user_facade_mock
    //     }
    //     user_facade_mock
    // }

    #[tokio::test]
    async fn get_user_group_key() {
        let (user_group, user_group_key) = generate_group_data();

        let mut key_cache_mock = MockKeyCache::default();
        {
            let user_group_key = user_group_key.clone();
            key_cache_mock.expect_get_current_user_group_key().returning(move || Some(user_group_key.clone()));
        }
        key_cache_mock.expect_put_group_key().return_const(());

        let mut user_facade_mock = MockUserFacade::default();
        {
            let user_group = user_group.clone();
            user_facade_mock.expect_get_user_group_id().returning(move || user_group._id.clone());
        }
        {
            let user_group_key = user_group_key.clone();
            user_facade_mock.expect_get_current_user_group_key()
                .returning(move || Some(user_group_key.clone()))
                .times(2);
        }

        let typed_entity_client_mock = MockTypedEntityClient::default();

        let key_loader_facade = KeyLoaderFacade::new(Arc::new(key_cache_mock), Arc::new(user_facade_mock), Arc::new(typed_entity_client_mock));

        let current_user_group_key = key_loader_facade.get_current_sym_group_key(&user_group._id).await.unwrap();
        assert_eq!(current_user_group_key.version, user_group.groupKeyVersion);
        assert_eq!(current_user_group_key.object, user_group_key.object);

        let _ = key_loader_facade.get_current_sym_group_key(&user_group._id).await;// should not be cached
    }

    #[tokio::test]
    async fn get_non_user_group_key() {
        let (group, current_group_key) = generate_group_data();

        let mut key_cache_mock = MockKeyCache::default();
        {
            let user_group_key = current_group_key.clone();
            key_cache_mock.expect_get_current_user_group_key().returning(move || Some(user_group_key.clone()));
        }
        key_cache_mock.expect_put_group_key().return_const(());

        let mut user_facade_mock = MockUserFacade::default();
        {
            let user_group = group.clone();
            user_facade_mock.expect_get_user_group_id().returning(move || user_group._id.clone());
        }
        {
            let user_group_key = current_group_key.clone();
            user_facade_mock.expect_get_current_user_group_key()
                .returning(move || Some(user_group_key.clone()));
        }

        let typed_entity_client_mock = MockTypedEntityClient::default();

        let key_loader_facade = KeyLoaderFacade::new(Arc::new(key_cache_mock), Arc::new(user_facade_mock), Arc::new(typed_entity_client_mock));

        let group_key = key_loader_facade.get_current_sym_group_key(&group._id).await.unwrap();
        assert_eq!(group_key.version, group.groupKeyVersion);
        assert_eq!(group_key.object, current_group_key.object)
    }

    #[tokio::test]
    async fn load_former_key_pairs() {
        let group = generate_random_group();

        let mut key_cache_mock = MockKeyCache::default();
        {
            let current_group_key = VersionedAesKey { object: random_aes256_key().into(), version: 0 };
            key_cache_mock.expect_get_current_group_key().returning(move |_| Some(current_group_key.clone()));
        }
        let mut user_facade_mock = MockUserFacade::default();
        {
            user_facade_mock.expect_get_user_group_id().returning(|| GeneratedId::test_random());
        }
        let mut typed_entity_client_mock = MockTypedEntityClient::default();
        {
            let group = group.clone();
            let former_keys = vec![
                GroupKey {
                    _format: 0,
                    _id: IdTuple { list_id: Default::default(), element_id: Default::default() },
                    _ownerGroup: None,
                    _permissions: Default::default(),
                    adminGroupEncGKey: None,
                    adminGroupKeyVersion: None,
                    ownerEncGKey: vec![],
                    ownerKeyVersion: 0,
                    pubAdminGroupEncGKey: None,
                    keyPair: None,
                },
                GroupKey {
                    _format: 0,
                    _id: IdTuple { list_id: Default::default(), element_id: Default::default() },
                    _ownerGroup: None,
                    _permissions: Default::default(),
                    adminGroupEncGKey: None,
                    adminGroupKeyVersion: None,
                    ownerEncGKey: vec![],
                    ownerKeyVersion: 0,
                    pubAdminGroupEncGKey: None,
                    keyPair: None,
                },
            ];
            typed_entity_client_mock.expect_load::<Group, GeneratedId>().returning(move |_| Ok(group.clone()));
            typed_entity_client_mock.expect_load_range().returning(move |_, _, _, _| Ok(former_keys.clone())).times(1);
        }

        let key_loader_facade = KeyLoaderFacade::new(Arc::new(key_cache_mock), Arc::new(user_facade_mock), Arc::new(typed_entity_client_mock));

        let (former_keys, former_key_pairs_decrypted, former_keys_decrypted) = generate_former_keys();

        for i in 0..FORMER_KEYS {
            let keypair = key_loader_facade.load_key_pair(&group._id, i as i64).await.unwrap();
            // assert_eq!(keypair, former_keys_decrypted[i])
        }
    }

    // #[tokio::test]
    // async fn load_current_key_pair() {
    //     let user_group = generate_random_group();
    //
    //     let mut key_cache_mock = MockKeyCache::default();
    //     {
    //         let user_group_key = user_group_key.clone();
    //         key_cache_mock.expect_get_current_user_group_key().returning(move || Some(user_group_key.clone()));
    //     }
    //     key_cache_mock.expect_put_group_key().return_const(());
    //
    //     let mut user_facade_mock = MockUserFacade::default();
    //     {
    //         let user_group = user_group.clone();
    //         user_facade_mock.expect_get_user_group_id().returning(move || user_group._id.clone());
    //     }
    //     {
    //         let user_group_key = user_group_key.clone();
    //         user_facade_mock.expect_get_current_user_group_key()
    //             .returning(move || Some(user_group_key.clone()))
    //     }
    //
    //     let typed_entity_client_mock = MockTypedEntityClient::default();
    //
    //     let key_loader_facade = KeyLoaderFacade::new(Arc::new(key_cache_mock), Arc::new(user_facade_mock), Arc::new(typed_entity_client_mock));
    //
    //     let loaded_current_key_pair = key_loader_facade.load_key_pair(user_group._id, user_group.groupKeyVersion)
    //         .await
    //         .unwrap();
    //
    //     let current_key_pair = AsymmetricKeyPair::from(PQKeyPairs::generate());
    //     assert_eq!(loaded_current_key_pair, current_key_pair);
    //     assert_eq!(loaded_current_key_pair, current_key_pair)
    // }
}