use crate::crypto::Aes256Key;
use crate::entities::sys::User;
use crate::generated_id::GeneratedId;
use crate::key_loader_facade::VersionedAesKey;
use std::collections::HashMap;
use std::sync::RwLock;

pub struct KeyCache {
	current_group_keys: RwLock<HashMap<GeneratedId, VersionedAesKey>>,
	current_user_group_key: RwLock<Option<VersionedAesKey>>,
	user_group_key_distribution_key: RwLock<Option<Aes256Key>>,
}

#[cfg_attr(test, mockall::automock)]
impl KeyCache {
	pub fn new() -> Self {
		KeyCache {
			current_group_keys: RwLock::new(HashMap::new()),
			current_user_group_key: RwLock::new(None),
			user_group_key_distribution_key: RwLock::new(None),
		}
	}

	pub fn set_current_user_group_key(&self, new_user_group_key: VersionedAesKey) {
		let mut current_user_group_key_lock = self.current_user_group_key.write().unwrap();
		match current_user_group_key_lock.as_ref() {
			Some(current_user_group_key)
				if current_user_group_key.version > new_user_group_key.version =>
			{
				log::warn!("Tried to set an outdated user group key with version {}; current user group key version: {}", new_user_group_key.version, current_user_group_key.version);
			},
			_ => *current_user_group_key_lock = Some(new_user_group_key),
		};
	}

	pub fn get_current_user_group_key(&self) -> Option<VersionedAesKey> {
		let referenced = self.current_user_group_key.read().unwrap();
		referenced.clone()
	}

	pub fn set_user_group_key_distribution_key(&self, user_group_key_distribution_key: Aes256Key) {
		*self.user_group_key_distribution_key.write().unwrap() =
			Some(user_group_key_distribution_key);
	}

	pub fn get_current_group_key(&self, group_id: &GeneratedId) -> Option<VersionedAesKey> {
		let lock = self.current_group_keys.read().unwrap();
		lock.get(group_id).cloned()
	}

	pub fn put_group_key(&self, group_id: &GeneratedId, key: &VersionedAesKey) {
		let mut lock = self.current_group_keys.write().unwrap();
		lock.insert(group_id.to_owned(), key.to_owned());
	}

	#[allow(clippy::unused_async)]
	pub async fn remove_outdated_group_keys(&self, _user: &User) {
		todo!("key cache remove_outdated_group_keys")
	}
}
