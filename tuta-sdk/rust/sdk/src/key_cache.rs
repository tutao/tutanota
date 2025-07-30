use crate::crypto::key::VersionedAesKey;
use crate::crypto::Aes256Key;
use crate::entities::generated::sys::User;
use crate::GeneratedId;
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::RwLock;

#[allow(dead_code)]
pub struct KeyCache {
	group_keys: RwLock<HashMap<GeneratedId, HashMap<u64, VersionedAesKey>>>,
	current_user_group_key: RwLock<Option<VersionedAesKey>>,
	user_group_key_distribution_key: RwLock<Option<Aes256Key>>,
	latest_group_key_version: AtomicU64,
}

#[cfg_attr(test, mockall::automock)]
#[allow(unused)]
impl KeyCache {
	pub fn new() -> Self {
		KeyCache {
			group_keys: RwLock::new(HashMap::new()),
			current_user_group_key: RwLock::new(None),
			user_group_key_distribution_key: RwLock::new(None),
			latest_group_key_version: AtomicU64::new(0),
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

	pub fn get_group_key_for_version(
		&self,
		group_id: &GeneratedId,
		version: u64,
	) -> Option<VersionedAesKey> {
		let lock = self.group_keys.read().unwrap();
		lock.get(group_id)?.get(&version).cloned()
	}

	pub fn get_current_group_key(&self, group_id: &GeneratedId) -> Option<VersionedAesKey> {
		self.get_group_key_for_version(
			group_id,
			self.latest_group_key_version.load(Ordering::Relaxed),
		)
	}

	pub fn put_group_key(&self, group_id: &GeneratedId, key: &VersionedAesKey) {
		let mut lock = self.group_keys.write().unwrap();
		let mut current_keys: &mut HashMap<u64, VersionedAesKey> = match lock.get_mut(group_id) {
			Some(map) => map,
			_ => &mut HashMap::new(),
		};

		if self.latest_group_key_version.load(Ordering::Relaxed) < key.version {
			self.latest_group_key_version
				.store(key.version, Ordering::Relaxed);
		}

		current_keys.insert(key.version, key.to_owned());
	}

	#[allow(clippy::unused_async)]
	pub async fn remove_outdated_group_keys(&self, _user: &User) {
		todo!("key cache remove_outdated_group_keys")
	}
}
