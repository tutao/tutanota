use crate::crypto::key::VersionedAesKey;
use crate::crypto::Aes256Key;
use crate::entities::generated::sys::User;
use crate::GeneratedId;
use std::collections::HashMap;
use std::sync::atomic::{AtomicI64, Ordering};
use std::sync::RwLock;

#[allow(dead_code)]
pub struct KeyCache {
	group_keys: RwLock<HashMap<GeneratedId, HashMap<i64, VersionedAesKey>>>,
	current_user_group_key: RwLock<Option<VersionedAesKey>>,
	user_group_key_distribution_key: RwLock<Option<Aes256Key>>,
	latest_group_key_version: AtomicI64,
}

#[cfg_attr(test, mockall::automock)]
#[allow(unused)]
impl KeyCache {
	pub fn new() -> Self {
		KeyCache {
			group_keys: RwLock::new(HashMap::new()),
			current_user_group_key: RwLock::new(None),
			user_group_key_distribution_key: RwLock::new(None),
			latest_group_key_version: AtomicI64::new(-1),
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
		version: i64,
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

		let mut current_keys = lock.entry(group_id.clone()).or_default();

		let key_version = key.version as i64;

		if self.latest_group_key_version.load(Ordering::Relaxed) < key_version {
			self.latest_group_key_version
				.store(key_version, Ordering::Relaxed);
		}

		current_keys.insert(key_version, key.to_owned());
	}

	#[allow(clippy::unused_async)]
	pub async fn remove_outdated_group_keys(&self, _user: &User) {
		todo!("key cache remove_outdated_group_keys")
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::entities::generated::sys::GroupKeysRef;
	use crate::util::test_utils::{generate_random_group, random_aes256_versioned_key};

	mod get_group_key_for_version {
		use super::*;

		#[test]
		fn should_not_find_key_on_cache() {
			let group = generate_random_group(
				None,
				GroupKeysRef {
					_id: Default::default(),
					list: GeneratedId("list".to_owned()), // Refers to `former_keys`
				},
			);

			let key_cache = KeyCache::new();
			assert_eq!(
				key_cache.get_group_key_for_version(&group._id.clone().unwrap(), 0),
				None
			);
		}

		#[test]
		fn should_insert_and_retrieve_key() {
			let group = generate_random_group(
				None,
				GroupKeysRef {
					_id: Default::default(),
					list: GeneratedId("list".to_owned()), // Refers to `former_keys`
				},
			);

			let first_key_version: i64 = 0;
			let first_key = random_aes256_versioned_key(first_key_version as u64);
			let second_key = random_aes256_versioned_key(1);

			let key_cache = KeyCache::new();
			key_cache.put_group_key(&group._id.clone().unwrap(), &first_key);
			key_cache.put_group_key(&group._id.clone().unwrap(), &second_key);

			let retrieved_key = key_cache
				.get_group_key_for_version(&group._id.clone().unwrap(), first_key_version)
				.unwrap();
			assert_eq!(retrieved_key, first_key);
		}
	}

	mod get_current_group_key {
		use super::*;
		#[test]
		fn should_retrieve_latest_key() {
			let group = generate_random_group(
				None,
				GroupKeysRef {
					_id: Default::default(),
					list: GeneratedId("list".to_owned()), // Refers to `former_keys`
				},
			);

			let first_key_version = 0;
			let first_key = random_aes256_versioned_key(first_key_version);
			let second_key = random_aes256_versioned_key(1);

			let key_cache = KeyCache::new();
			key_cache.put_group_key(&group._id.clone().unwrap(), &first_key);
			key_cache.put_group_key(&group._id.clone().unwrap(), &second_key);

			let retrieved_key = key_cache
				.get_current_group_key(&group._id.clone().unwrap())
				.unwrap();
			assert_eq!(retrieved_key, second_key);
		}
	}
}
