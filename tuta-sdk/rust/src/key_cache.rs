use std::cell::RefCell;
use std::collections::HashMap;
use std::sync::{Arc, Mutex, RwLock};
use crate::crypto::aes::Aes256Key;
use crate::entities::sys::User;
use crate::key_loader_facade::VersionedKey;

pub struct KeyCache {
    current_group_keys: RwLock<HashMap<String, VersionedKey>>,
    current_user_group_key: RwLock<Option<VersionedKey>>,
    user_group_key_distribution_key: RwLock<Option<Aes256Key>>
}

fn test_mut() -> impl Sync {
    let key_cache: KeyCache = KeyCache::new();
    let key_cache_ref: Arc<KeyCache> = Arc::new(key_cache);
    key_cache_ref
}

impl KeyCache {
    pub fn new () -> Self {
        KeyCache {
            current_group_keys: RwLock::new(HashMap::new()),
            current_user_group_key: RwLock::new(None),
            user_group_key_distribution_key: RwLock::new(None)
        }
    }

    pub fn set_current_user_group_key(&self, new_user_group_key: VersionedKey) {
        let mut current_user_group_key_lock = self.current_user_group_key.write().unwrap();
        if current_user_group_key_lock.as_ref().is_some_and(|k| k.version > new_user_group_key.version) {
            // FIXME: add logging
            return
        }
        *current_user_group_key_lock = Some(new_user_group_key);
    }

    pub fn get_current_user_group_key(&self) -> Option<VersionedKey> {
        let referenced = self.current_user_group_key.read().unwrap();
        referenced.clone()
    }

    pub fn set_user_group_key_distribution_key(&self, user_group_key_distribution_key: Aes256Key) {
        *self.user_group_key_distribution_key.write().unwrap() = Some(user_group_key_distribution_key);
    }

    pub fn get_current_group_key<F: FnOnce(&String) -> VersionedKey>(&self, group_id: String, key_loader: F) -> VersionedKey {
        let mut lock = self.current_group_keys.write().unwrap();
        lock.entry(group_id).or_insert_with_key(|key| key_loader(key)).clone()
    }

    pub async fn remove_outdated_group_keys(user: &User) {
        todo!()
    }
}

// FIXME: test Arc clone