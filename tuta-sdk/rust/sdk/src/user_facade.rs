use crate::crypto::hkdf;
use crate::crypto::key::GenericAesKey;
use crate::crypto::key::VersionedAesKey;
use crate::crypto::sha256;
use crate::crypto::{Aes256Key, AES_256_KEY_SIZE};
use crate::entities::generated::sys::{GroupMembership, User};
use crate::groups::GroupType;
#[cfg_attr(test, mockall_double::double)]
use crate::key_cache::KeyCache;
use crate::util::{convert_version_to_u64, Versioned};
use crate::ApiCallError;
use crate::GeneratedId;
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use std::borrow::ToOwned;
use std::sync::{Arc, RwLock};

#[allow(unused)]
const USER_GROUP_KEY_DISTRIBUTION_KEY_INFO: &[u8] = b"userGroupKeyDistributionKey";

pub struct UserFacade {
	user: RwLock<Arc<User>>,
	#[allow(unused)]
	key_cache: Arc<KeyCache>,
}

/// UserFacade is tied to a logged in user.
#[cfg_attr(test, mockall::automock)]
#[allow(unused)]
impl UserFacade {
	#[allow(unused)]
	pub fn new(key_cache: Arc<KeyCache>, user: User) -> Self {
		UserFacade {
			user: RwLock::new(Arc::new(user)),
			key_cache,
		}
	}

	pub fn set_user(&self, user: User) {
		*self.user.write().unwrap() = Arc::new(user);
	}

	pub fn unlock_user_group_key(
		&self,
		user_passphrase_key: GenericAesKey,
	) -> Result<(), ApiCallError> {
		let user = self.get_user();
		let user_group_membership = &user.userGroup;
		let current_user_group_key = Versioned::new(
			user_passphrase_key
				.decrypt_aes_key(&user_group_membership.symEncGKey)
				.map_err(|e| ApiCallError::InternalSdkError {
					error_message: e.to_string(),
				})?,
			convert_version_to_u64(user_group_membership.groupKeyVersion),
		);
		self.key_cache
			.set_current_user_group_key(current_user_group_key);
		self.set_user_group_key_distribution_key(user_passphrase_key);
		Ok(())
	}

	pub fn key_cache(&self) -> Arc<KeyCache> {
		self.key_cache.clone()
	}

	fn set_user_group_key_distribution_key(&self, user_passphrase_key: GenericAesKey) {
		let user = self.get_user();
		let user_group_membership = &user.userGroup;
		let user_group_key_distribution_key = self.derive_user_group_key_distribution_key(
			&user_group_membership.group,
			user_passphrase_key,
		);
		self.key_cache
			.set_user_group_key_distribution_key(user_group_key_distribution_key)
	}

	// TODO: Add a test to check uint8ArrayToBase64 is correct;
	// there is a max length in the ts version, it seems to be a js thing, can we forego it here?
	fn derive_user_group_key_distribution_key(
		&self,
		user_group_id: &GeneratedId,
		user_passphrase_key: GenericAesKey,
	) -> Aes256Key {
		// we prepare a key to encrypt potential user group key rotations with
		// when passwords are changed clients are logged-out of other sessions
		// this key is only needed by the logged-in clients, so it should be reliable enough to assume that userPassphraseKey is in sync
		let user_group_id_hash = sha256(user_group_id.as_str().as_bytes());
		// we bind this to userGroupId and the domain separator USER_GROUP_KEY_DISTRIBUTION_KEY_INFO
		// the hkdf salt does not have to be secret but should be unique per user and carry some additional entropy which sha256 ensures
		let aes_key = hkdf(
			user_group_id_hash.as_slice(),
			BASE64_STANDARD
				.encode(user_passphrase_key.as_bytes())
				.as_bytes(),
			USER_GROUP_KEY_DISTRIBUTION_KEY_INFO,
			AES_256_KEY_SIZE,
		);

		Aes256Key::from_bytes(aes_key.as_slice()).expect("invalid derived key size")
	}

	pub async fn update_user(&self, user: User) {
		let user = Arc::new(user);
		*self.user.write().unwrap() = user.clone();
		self.key_cache
			.remove_outdated_group_keys(user.as_ref())
			.await;
	}

	pub fn get_user(&self) -> Arc<User> {
		self.user.read().unwrap().clone()
	}

	pub fn get_user_group_id(&self) -> GeneratedId {
		self.get_user().userGroup.group.clone()
	}

	#[allow(dead_code)] // Remove when implementing `generateUserAreaGroupData()`
	fn get_all_group_ids(&self) -> Vec<GeneratedId> {
		let mut groups: Vec<GeneratedId> = self
			.get_user()
			.memberships
			.iter()
			.map(|membership| membership.group.clone())
			.collect();
		groups.push(self.get_user().userGroup.group.clone());
		groups
	}

	pub fn get_current_user_group_key(&self) -> Option<VersionedAesKey> {
		self.key_cache.get_current_user_group_key()
	}

	pub fn get_membership_by_group_type(
		&self,
		group_type: GroupType,
	) -> Result<GroupMembership, ApiCallError> {
		let memberships = &self.get_user().memberships;
		let group_type = group_type as i64;
		memberships
			.iter()
			.find(|g| g.groupType == Some(group_type))
			.map(|m| m.to_owned())
			.ok_or_else(|| ApiCallError::InternalSdkError {
				error_message: format!("No group with groupType {} found!", group_type),
			})
	}

	pub fn has_group(&self, group_id: &GeneratedId) -> bool {
		&self.get_user().userGroup.group == group_id
			|| (self.get_user().memberships)
				.iter()
				.any(|m| group_id == &m.group)
	}

	#[allow(unused)]
	pub(crate) fn get_membership(
		&self,
		group_id: &GeneratedId,
	) -> Result<GroupMembership, ApiCallError> {
		let memberships = &self.get_user().memberships;
		memberships
			.iter()
			.find(|g| g.group == *group_id)
			.map(|m| m.to_owned())
			.ok_or_else(|| ApiCallError::InternalSdkError {
				error_message: format!("No group with groupId {} found!", group_id),
			})
	}
}

impl GroupMembership {
	#[must_use]
	pub fn group_type(&self) -> GroupType {
		match self.groupType {
			None => GroupType::Unknown,
			Some(group_type) => {
				GroupType::try_from(group_type as u64).unwrap_or(GroupType::Unknown)
			},
		}
	}
}
