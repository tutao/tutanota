use crate::crypto::key::VersionedAesKey;
use crate::crypto::Aes256Key;
use crate::entities::generated::sys::User;
use crate::GeneratedId;
use std::collections::{BTreeMap, HashMap};
use std::sync::RwLock;

/// `KeyCache` is responsible for storing and managing AES encryption keys in memory.
/// It handles:
/// - The current user's group encryption key
/// - A key used to distribute group keys
/// - A map of group keys indexed by group ID and key version
///
/// Internally, it uses `RwLock` to allow concurrent read access and synchronized write access.
#[allow(dead_code)]
pub struct KeyCache {
	/// Stores versioned group keys mapped by their `GeneratedId` and `KeyVersion`.
	group_keys: RwLock<HashMap<GeneratedId, BTreeMap<i64, VersionedAesKey>>>,

	/// Stores the latest version of the user's group key.
	current_user_group_key: RwLock<Option<VersionedAesKey>>,

	/// Stores the AES key used to distribute group keys to users.
	user_group_key_distribution_key: RwLock<Option<Aes256Key>>,
}

#[cfg_attr(test, mockall::automock)]
#[allow(unused)]
impl KeyCache {
	pub fn new() -> Self {
		KeyCache {
			group_keys: RwLock::new(HashMap::new()),
			current_user_group_key: RwLock::new(None),
			user_group_key_distribution_key: RwLock::new(None),
		}
	}

	/// Sets the current user group key if it's newer or equal to the current one.
	/// Logs a warning if an outdated key is attempted to be set.
	///
	/// # Arguments
	/// * `new_user_group_key` - The new group key to set for the current user.
	pub fn set_current_user_group_key(&self, new_user_group_key: VersionedAesKey) {
		let mut current_user_group_key_lock = self.current_user_group_key.write().unwrap();
		match current_user_group_key_lock.as_ref() {
			Some(current_user_group_key)
				if current_user_group_key.version > new_user_group_key.version =>
			{
				log::warn!(
                    "Tried to set an outdated user group key with version {}; current user group key version: {}",
                    new_user_group_key.version,
                    current_user_group_key.version
                );
			},
			_ => *current_user_group_key_lock = Some(new_user_group_key),
		};
	}

	/// Retrieves the current user group key, if any.
	pub fn get_current_user_group_key(&self) -> Option<VersionedAesKey> {
		let referenced = self.current_user_group_key.read().unwrap();
		referenced.clone()
	}

	/// Sets the key used to distribute user group keys.
	///
	/// # Arguments
	/// * `user_group_key_distribution_key` - A 256-bit AES key used for key distribution.
	pub fn set_user_group_key_distribution_key(&self, user_group_key_distribution_key: Aes256Key) {
		*self.user_group_key_distribution_key.write().unwrap() =
			Some(user_group_key_distribution_key);
	}

	/// Retrieves a specific group key by `group_id` and `version`.
	///
	/// # Arguments
	/// * `group_id` - The identifier for the group.
	/// * `version` - The version of the key to retrieve.
	///
	/// # Returns
	/// The `VersionedAesKey` if found, otherwise `None`.
	pub fn get_group_key_for_version(
		&self,
		group_id: &GeneratedId,
		version: i64,
	) -> Option<VersionedAesKey> {
		let lock = self.group_keys.read().unwrap();
		lock.get(group_id)?.get(&version).cloned()
	}

	/// Retrieves the latest (highest version) key for the given group.
	///
	/// # Arguments
	/// * `group_id` - The identifier for the group.
	///
	/// # Returns
	/// The most recent `VersionedAesKey` if available, otherwise `None`.
	pub fn get_current_group_key(&self, group_id: &GeneratedId) -> Option<VersionedAesKey> {
		let lock = self.group_keys.read().unwrap();
		lock.get(group_id)?
			.iter()
			.last()
			.map(|entry| entry.1.clone())
	}

	/// Inserts a new versioned group key into the cache for the given `group_id`.
	///
	/// # Arguments
	/// * `group_id` - The identifier for the group.
	/// * `key` - The versioned AES key to insert.
	pub fn put_group_key(&self, group_id: &GeneratedId, key: &VersionedAesKey) {
		let mut lock = self.group_keys.write().unwrap();
		let current_keys = lock.entry(group_id.clone()).or_default();
		let key_version = key.version as i64;

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
		fn no_saved_key_for_requested_group() {
			let group_a = generate_random_group(
				None,
				GroupKeysRef {
					_id: Default::default(),
					list: GeneratedId("list".to_owned()), // Refers to `former_keys`
				},
			);

			let group_b = generate_random_group(
				None,
				GroupKeysRef {
					_id: Default::default(),
					list: GeneratedId("list".to_owned()), // Refers to `former_keys`
				},
			);

			let key_cache = KeyCache::new();
			let group_a_key = random_aes256_versioned_key(0);
			key_cache.put_group_key(&group_a._id.clone().unwrap(), &group_a_key);

			let retrieved_key = key_cache.get_current_group_key(&group_b._id.clone().unwrap());
			assert_eq!(retrieved_key, None);
		}

		#[test]
		fn should_retrieve_latest_key_of_each_group() {
			let group_a = generate_random_group(
				None,
				GroupKeysRef {
					_id: Default::default(),
					list: GeneratedId("list".to_owned()), // Refers to `former_keys`
				},
			);

			let group_b = generate_random_group(
				None,
				GroupKeysRef {
					_id: Default::default(),
					list: GeneratedId("list".to_owned()), // Refers to `former_keys`
				},
			);

			let key_cache = KeyCache::new();
			let group_a_key_old = random_aes256_versioned_key(0);
			let group_a_key_latest = random_aes256_versioned_key(1);
			let group_b_key_old = random_aes256_versioned_key(0);
			let group_b_key_latest = random_aes256_versioned_key(1);

			key_cache.put_group_key(&group_a._id.clone().unwrap(), &group_a_key_old);
			key_cache.put_group_key(&group_a._id.clone().unwrap(), &group_a_key_latest);
			key_cache.put_group_key(&group_b._id.clone().unwrap(), &group_b_key_old);
			key_cache.put_group_key(&group_b._id.clone().unwrap(), &group_b_key_latest);

			let retrieved_key = key_cache
				.get_current_group_key(&group_a._id.clone().unwrap())
				.unwrap();
			assert_eq!(retrieved_key, group_a_key_latest);

			let retrieved_key = key_cache
				.get_current_group_key(&group_b._id.clone().unwrap())
				.unwrap();
			assert_eq!(retrieved_key, group_b_key_latest);
		}

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
			let third_key = random_aes256_versioned_key(2);
			let fourth_key = random_aes256_versioned_key(3);

			let key_cache = KeyCache::new();
			key_cache.put_group_key(&group._id.clone().unwrap(), &second_key);
			key_cache.put_group_key(&group._id.clone().unwrap(), &first_key);
			key_cache.put_group_key(&group._id.clone().unwrap(), &fourth_key);
			key_cache.put_group_key(&group._id.clone().unwrap(), &third_key);

			let retrieved_key = key_cache
				.get_current_group_key(&group._id.clone().unwrap())
				.unwrap();
			assert_eq!(retrieved_key, fourth_key);
		}
	}
}
