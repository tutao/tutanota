use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError, VersionedAesKey};
use crate::crypto::key_encryption::decrypt_key_pair;
use crate::entities::generated::sys::{Group, GroupKey, KeyPair};
#[cfg_attr(test, mockall_double::double)]
use crate::typed_entity_client::TypedEntityClient;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::util::Versioned;
use crate::CustomId;
use crate::GeneratedId;
use crate::IdTupleCustom;
use crate::ListLoadDirection;
use futures::future::BoxFuture;
use std::cmp::Ordering;
use std::sync::Arc;

pub struct KeyLoaderFacade {
	user_facade: Arc<UserFacade>,
	entity_client: Arc<TypedEntityClient>,
}

#[cfg_attr(test, mockall::automock)]
impl KeyLoaderFacade {
	pub fn new(user_facade: Arc<UserFacade>, entity_client: Arc<TypedEntityClient>) -> Self {
		KeyLoaderFacade {
			user_facade,
			entity_client,
		}
	}

	/// Load the symmetric group key for the groupId with the provided requestedVersion.
	/// `currentGroupKey` needs to be set if the user is not a member of the group (e.g. an admin)
	pub async fn load_sym_group_key(
		&self,
		group_id: &GeneratedId,
		version: i64,
		current_group_key: Option<VersionedAesKey>,
	) -> Result<GenericAesKey, KeyLoadError> {
		let group_key = match current_group_key {
			Some(n) => {
				let group_key_version = n.version;
				if group_key_version < version {
					// we might not have the membership for this group. so the caller needs to handle it by refreshing the cache
					return Err(KeyLoadError { reason: format!("Provided current group key is too old (${group_key_version}) to load the requested version ${version} for group ${group_id}") });
				}
				n
			},
			None => self.get_current_sym_group_key(group_id).await?,
		};

		if group_key.version == version {
			Ok(group_key.object)
		} else {
			// TODO: refresh if group_key.version < version
			let group: Group = self.entity_client.load(&group_id.to_owned()).await?;
			let FormerGroupKey {
				symmetric_group_key,
				..
			} = self
				.find_former_group_key(&group, &group_key, version)
				.await?;
			Ok(symmetric_group_key)
		}
	}

	async fn find_former_group_key(
		&self,
		group: &Group,
		// TODO: why do we take it by ref if we are cloning it anyway
		current_group_key: &VersionedAesKey,
		target_key_version: i64,
	) -> Result<FormerGroupKey, KeyLoadError> {
		let list_id = group.formerGroupKeys.clone().unwrap().list;

		let start_id = CustomId::from_custom_string(&current_group_key.version.to_string());
		let amount_of_keys_including_target =
			(current_group_key.version - target_key_version) as usize;

		let former_keys: Vec<GroupKey> = self
			.entity_client
			.load_range(
				&list_id,
				&start_id,
				amount_of_keys_including_target,
				ListLoadDirection::DESC,
			)
			.await?;

		let VersionedAesKey {
			version: mut last_version,
			object: mut last_group_key,
		} = current_group_key.to_owned();

		let mut last_group_key_instance: Option<GroupKey> = None;
		let retrieved_keys_count = former_keys.len();

		for former_key in former_keys {
			let version = self.decode_group_key_version(
				&former_key
					._id
					.as_ref()
					.expect("no id on group key!")
					.element_id,
			)?;
			let next_version = version + 1;

			match next_version.cmp(&last_version) {
				Ordering::Less => {
					return Err(KeyLoadError {
						reason: format!(
							"Unexpected group key version {version}; expected {last_version}"
						),
					})
				},
				Ordering::Greater => continue,
				Ordering::Equal => {
					last_version = version;
					last_group_key = last_group_key
						.decrypt_aes_key(&former_key.ownerEncGKey)
						.map_err(|e| KeyLoadError {
							reason: e.to_string(),
						})?;
					last_group_key_instance = Some(former_key);
					if last_version <= target_key_version {
						break;
					}
				},
			}
		}

		if last_version != target_key_version || last_group_key_instance.is_none() {
			return Err(KeyLoadError { reason: format!("Could not get last version (last version is {last_version} of {retrieved_keys_count} key(s) loaded from list {list_id}") });
		}

		Ok(FormerGroupKey {
			symmetric_group_key: last_group_key,
			group_key_instance: last_group_key_instance.unwrap(),
		})
	}

	fn decode_group_key_version(&self, element_id: &CustomId) -> Result<i64, KeyLoadError> {
		element_id
			.to_custom_string()
			.parse()
			.map_err(|_| KeyLoadError {
				reason: format!("Failed to decode group key version: {}", element_id),
			})
	}

	pub async fn get_current_sym_group_key(
		&self,
		group_id: &GeneratedId,
	) -> Result<VersionedAesKey, KeyLoadError> {
		if *group_id == self.user_facade.get_user_group_id() {
			return self
				.get_current_sym_user_group_key()
				.ok_or_else(|| KeyLoadError {
					reason: "no current group key".to_owned(),
				});
		}

		if let Some(key) = self.user_facade.key_cache().get_current_group_key(group_id) {
			return Ok(key);
		}

		// The call leads to recursive calls down the chain, so BoxFuture is used to wrap the recursive async calls
		fn get_key_for_version<'a>(
			facade: &'a KeyLoaderFacade,
			group_id: &'a GeneratedId,
		) -> BoxFuture<'a, Result<VersionedAesKey, KeyLoadError>> {
			Box::pin(facade.load_and_decrypt_current_sym_group_key(group_id))
		}

		let key = get_key_for_version(self, group_id).await?;
		self.user_facade.key_cache().put_group_key(group_id, &key);
		Ok(key)
	}

	/// `group_id` MUST NOT be the user group id
	async fn load_and_decrypt_current_sym_group_key(
		&self,
		group_id: &GeneratedId,
	) -> Result<VersionedAesKey, KeyLoadError> {
		assert_ne!(
			&self.user_facade.get_user_group_id(),
			group_id,
			"Must not add the user group to the regular group key cache"
		);
		let group_membership = self.user_facade.get_membership(group_id)?;
		let required_user_group_key = self
			.load_sym_user_group_key(group_membership.symKeyVersion)
			.await?;
		let version = group_membership.groupKeyVersion;
		let object = required_user_group_key
			.decrypt_aes_key(&group_membership.symEncGKey)
			.map_err(|e| KeyLoadError {
				reason: e.to_string(),
			})?;
		Ok(VersionedAesKey { version, object })
	}

	async fn load_sym_user_group_key(
		&self,
		user_group_key_version: i64,
	) -> Result<GenericAesKey, KeyLoadError> {
		// TODO: check for the version and refresh cache if needed
		self.load_sym_group_key(
			&self.user_facade.get_user_group_id(),
			user_group_key_version,
			Some(
				self.user_facade
					.get_current_user_group_key()
					.ok_or_else(|| KeyLoadError {
						reason: "No use group key loaded".to_string(),
					})?,
			),
		)
		.await
	}

	fn get_current_sym_user_group_key(&self) -> Option<VersionedAesKey> {
		self.user_facade.get_current_user_group_key()
	}

	pub async fn load_key_pair(
		&self,
		key_pair_group_id: &GeneratedId,
		requested_version: i64,
	) -> Result<AsymmetricKeyPair, KeyLoadError> {
		let group: Group = self.entity_client.load(key_pair_group_id).await?;
		let current_group_key = self
			.get_current_sym_group_key(group._id.as_ref().expect("no id on group!"))
			.await?;

		if requested_version > current_group_key.version {
			// TODO when implementing cache
			// group = (await (await self.cacheManagementFacade()).refreshKeyCache(key_pair_group_id)).group
			// current_group_key = self.get_current_sym_group_key(key_pair_group_id).await?
			return Err(KeyLoadError {
				reason: "not yet implemented".to_string(),
			});
		}
		self.load_key_pair_impl(group, requested_version, current_group_key)
			.await
	}

	#[allow(unused)]
	pub async fn load_current_key_pair(
		&self,
		group_id: &GeneratedId,
	) -> Result<Versioned<AsymmetricKeyPair>, KeyLoadError> {
		let group: Group = self.entity_client.load(group_id).await?;

		let current_group_key = self.get_current_sym_group_key(group_id).await?;
		if group.groupKeyVersion != current_group_key.version {
			// There is a race condition after rotating the group key were the group entity in the cache is not in sync with current key version in the key cache.
			// group.groupKeyVersion might be newer than current_group_key.version.
			// We reload group and user and refresh entity and key cache to synchronize both caches.

			// TODO when implementing cache
			// group = (await (await self.cacheManagementFacade()).refreshKeyCache(group_id)).group;
			// current_group_key = self.get_current_sym_group_key(group_id).await?;
			// if group.groupKeyVersion != current_group_key.version {
			// we still do not have the proper state to get the current key pair
			// return Err(KeyLoadError { reason: format!("inconsistent key version state in cache and key cache for group {group_id}") });
			// }
			return Err(KeyLoadError {
				reason: "not yet implemented".to_string(),
			});
		}
		let key_pair = Self::validate_and_decrypt_key_pair(
			group.currentKeys,
			group_id,
			current_group_key.object,
		)?;
		Ok(Versioned {
			object: key_pair,
			version: group.groupKeyVersion,
		})
	}

	async fn load_key_pair_impl(
		&self,
		group: Group,
		requested_version: i64,
		current_group_key: VersionedAesKey,
	) -> Result<AsymmetricKeyPair, KeyLoadError> {
		let key_pair_group_id = &group._id.clone().unwrap();
		let key_pair: Option<KeyPair>;
		let sym_group_key: GenericAesKey;
		match requested_version.cmp(&current_group_key.version) {
			Ordering::Greater => {
				return Err(KeyLoadError{reason: format!("Not possible to get newer key version than is cached for group {key_pair_group_id}")});
			},
			Ordering::Equal => {
				sym_group_key = current_group_key.object;
				if group.groupKeyVersion == current_group_key.version {
					key_pair = group.currentKeys
				} else {
					let former_keys_list = group.formerGroupKeys.unwrap().list;
					// we load by the version and thus can be sure that we are able to decrypt this key
					let former_group_key: GroupKey = self
						.entity_client
						.load(&IdTupleCustom::new(
							former_keys_list,
							CustomId::from_custom_string(&current_group_key.version.to_string()),
						))
						.await?;
					key_pair = former_group_key.keyPair
				}
			},
			Ordering::Less => {
				// load a former key pair: groupKeyVersion < groupKey.version
				let FormerGroupKey {
					symmetric_group_key,
					group_key_instance,
				} = self
					.find_former_group_key(&group, &current_group_key, requested_version)
					.await?;
				sym_group_key = symmetric_group_key;
				key_pair = group_key_instance.keyPair;
			},
		}
		KeyLoaderFacade::validate_and_decrypt_key_pair(key_pair, key_pair_group_id, sym_group_key)
	}

	pub fn validate_and_decrypt_key_pair(
		key_pair: Option<KeyPair>,
		group_id: &GeneratedId,
		group_key: GenericAesKey,
	) -> Result<AsymmetricKeyPair, KeyLoadError> {
		match key_pair {
			None => Err(KeyLoadError {
				reason: format!("no key pair on group {group_id}"),
			}),
			Some(kp) => Ok(decrypt_key_pair(&group_key, &kp)?),
		}
	}
}

struct FormerGroupKey {
	symmetric_group_key: GenericAesKey,
	group_key_instance: GroupKey,
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::crypto::{aes::Iv, Aes256Key, PQKeyPairs};
	use crate::entities::generated::sys::{GroupKeysRef, GroupMembership, KeyPair};
	use crate::key_cache::MockKeyCache;
	use crate::typed_entity_client::MockTypedEntityClient;
	use crate::user_facade::MockUserFacade;
	use crate::util::get_vec_reversed;
	use crate::util::test_utils::{generate_random_group, random_aes256_key};
	use crate::CustomId;
	use crate::{IdTupleCustom, IdTupleGenerated};
	use mockall::predicate;
	use std::array::from_fn;

	fn generate_group_key(version: i64) -> VersionedAesKey {
		VersionedAesKey {
			object: random_aes256_key().into(),
			version,
		}
	}

	fn generate_group_data() -> (Group, VersionedAesKey) {
		(generate_random_group(None, None), generate_group_key(1))
	}

	fn generate_group_with_keys(
		current_key_pair: &PQKeyPairs,
		current_group_key: &VersionedAesKey,
		randomizer_facade: &RandomizerFacade,
	) -> Group {
		let PQKeyPairs {
			ecc_keys,
			kyber_keys,
		} = current_key_pair;
		let group_key = &current_group_key.object;
		let sym_enc_priv_ecc_key = group_key
			.encrypt_data(
				ecc_keys.private_key.as_bytes(),
				Iv::generate(randomizer_facade),
			)
			.unwrap();
		let sync_enc_priv_kyber_key = group_key
			.encrypt_data(
				&kyber_keys.private_key.serialize(),
				Iv::generate(randomizer_facade),
			)
			.unwrap();
		generate_random_group(
			Some(KeyPair {
				_id: Default::default(),
				pubEccKey: Some(ecc_keys.public_key.as_bytes().to_vec()),
				pubKyberKey: Some(kyber_keys.public_key.serialize()),
				pubRsaKey: None,
				symEncPrivEccKey: Some(sym_enc_priv_ecc_key),
				symEncPrivKyberKey: Some(sync_enc_priv_kyber_key),
				symEncPrivRsaKey: None,
			}),
			Some(GroupKeysRef {
				_id: Default::default(),
				list: GeneratedId("list".to_owned()), // Refers to `former_keys`
			}),
		)
	}

	const FORMER_KEYS: usize = 2;

	/// Returns `(former_keys, former_key_pairs_decrypted, former_keys_decrypted)`
	fn generate_former_keys(
		current_group_key: &VersionedAesKey,
		randomizer_facade: &RandomizerFacade,
	) -> (
		[GroupKey; FORMER_KEYS],
		[PQKeyPairs; FORMER_KEYS],
		[Aes256Key; FORMER_KEYS],
	) {
		// Using `from_fn` has the same performance as using mutable vecs but less memory usage
		let former_keys_decrypted: [Aes256Key; FORMER_KEYS] = from_fn(|_| random_aes256_key());
		let former_key_pairs_decrypted: [PQKeyPairs; FORMER_KEYS] =
			from_fn(|_| PQKeyPairs::generate(&make_thread_rng_facade()));

		let mut former_keys = Vec::with_capacity(FORMER_KEYS);
		let mut last_key = current_group_key.object.clone();

		for (i, current_key) in former_keys_decrypted.iter().enumerate().rev() {
			let pq_key_pair = &former_key_pairs_decrypted[i];
			// Get the previous key to use as the owner key
			let current_key: &GenericAesKey = &current_key.clone().into();

			let owner_enc_g_key = last_key
				.encrypt_key(current_key, Iv::generate(randomizer_facade))
				.as_slice()
				.to_vec();
			let sym_enc_priv_ecc_key = current_key
				.encrypt_data(
					pq_key_pair.ecc_keys.private_key.clone().as_bytes(),
					Iv::generate(randomizer_facade),
				)
				.unwrap();

			former_keys.insert(
				0,
				GroupKey {
					_format: 0,
					_id: Some(IdTupleCustom {
						list_id: GeneratedId("list".to_owned()),
						element_id: CustomId::from_custom_string(&i.to_string()),
					}),
					_ownerGroup: None,
					_permissions: Default::default(),
					adminGroupEncGKey: None,
					adminGroupKeyVersion: None,
					ownerEncGKey: owner_enc_g_key,
					ownerKeyVersion: 0,
					pubAdminGroupEncGKey: None,
					keyPair: Some(KeyPair {
						_id: Default::default(),
						pubEccKey: Some(pq_key_pair.ecc_keys.public_key.as_bytes().to_vec()),
						pubKyberKey: Some(pq_key_pair.kyber_keys.public_key.serialize()),
						pubRsaKey: None,
						symEncPrivEccKey: Some(sym_enc_priv_ecc_key),
						symEncPrivKyberKey: Some(
							current_key
								.encrypt_data(
									pq_key_pair.kyber_keys.private_key.serialize().as_slice(),
									Iv::generate(randomizer_facade),
								)
								.unwrap(),
						),
						symEncPrivRsaKey: None,
					}),
				},
			);
			last_key = current_key.clone();
		}

		(
			former_keys.try_into().unwrap_or_else(|_| panic!()),
			former_key_pairs_decrypted,
			former_keys_decrypted,
		)
	}

	fn make_mocks_with_former_keys(
		group: &Group,
		current_group_key: &VersionedAesKey,
		randomizer: &RandomizerFacade,
		former_keys: &[GroupKey; FORMER_KEYS],
	) -> KeyLoaderFacade {
		let (user_facade_mock, mut typed_entity_client_mock) =
			make_mocks(group, current_group_key, randomizer);
		{
			for i in 0..FORMER_KEYS {
				let group = group.clone();
				let former_keys = former_keys.clone();

				let returned_keys = get_vec_reversed(former_keys[i..].to_vec());
				typed_entity_client_mock
					.expect_load_range::<GroupKey, CustomId>()
					.with(
						predicate::eq(group.formerGroupKeys.unwrap().list),
						predicate::eq(CustomId::from_custom_string(
							&current_group_key.version.to_string(),
						)),
						predicate::eq(FORMER_KEYS - i),
						predicate::eq(ListLoadDirection::DESC),
					)
					.returning(move |_, _, _, _| Ok(returned_keys.clone()))
					.times(1);
			}
		}
		KeyLoaderFacade::new(
			Arc::new(user_facade_mock),
			Arc::new(typed_entity_client_mock),
		)
	}

	fn make_mocks(
		group: &Group,
		current_group_key: &VersionedAesKey,
		randomizer: &RandomizerFacade,
	) -> (MockUserFacade, MockTypedEntityClient) {
		let user_group_key = generate_group_key(0);
		let user_group = generate_random_group(None, None);

		let mut user_facade_mock = MockUserFacade::default();
		{
			let user_group_key = user_group_key.clone();
			user_facade_mock
				.expect_get_current_user_group_key()
				.returning(move || Some(user_group_key.clone()));
		}
		{
			let current_group_key = current_group_key.clone();
			let mut key_cache_mock = MockKeyCache::default();
			key_cache_mock
				.expect_get_current_group_key()
				.returning(move |_| Some(current_group_key.clone()));
			let key_cache = Arc::new(key_cache_mock);
			user_facade_mock
				.expect_key_cache()
				.returning(move || key_cache.clone());
		}
		{
			let user_group_id = user_group._id.clone();
			let sym_enc_g_key = user_group_key
				.object
				.encrypt_key(&current_group_key.object, Iv::generate(randomizer));
			let current_group_key = current_group_key.clone();
			user_facade_mock
				.expect_get_membership()
				.with(predicate::eq(user_group_id.clone().unwrap()))
				.returning(move |_| {
					Ok(GroupMembership {
						_id: Some(CustomId(user_group_id.clone().unwrap().to_string())),
						admin: false,
						capability: None,
						groupKeyVersion: current_group_key.clone().version,
						groupType: None,
						symEncGKey: sym_enc_g_key.clone(),
						symKeyVersion: user_group_key.version,
						group: user_group_id.clone().unwrap(),
						groupInfo: IdTupleGenerated {
							list_id: Default::default(),
							element_id: Default::default(),
						},
						groupMember: IdTupleGenerated {
							list_id: Default::default(),
							element_id: Default::default(),
						},
					})
				});
		}
		{
			let user_group_id = user_group._id.clone();
			user_facade_mock
				.expect_get_user_group_id()
				.returning(move || user_group_id.clone().unwrap());
		}

		let mut typed_entity_client_mock = MockTypedEntityClient::default();
		{
			let group = group.clone();
			typed_entity_client_mock
				.expect_load::<Group, GeneratedId>()
				.with(predicate::eq(group._id.clone().unwrap()))
				.returning(move |_| Ok(group.clone()));
		}
		(user_facade_mock, typed_entity_client_mock)
	}

	#[tokio::test]
	async fn get_user_group_key() {
		let (user_group, user_group_key) = generate_group_data();

		let mut user_facade_mock = MockUserFacade::default();
		{
			let user_group = user_group.clone();
			user_facade_mock
				.expect_get_user_group_id()
				.returning(move || user_group._id.clone().unwrap());
		}
		{
			let user_group_key = user_group_key.clone();
			user_facade_mock
				.expect_get_current_user_group_key()
				.returning(move || Some(user_group_key.clone()))
				.times(2);
		}

		let typed_entity_client_mock = MockTypedEntityClient::default();

		let key_loader_facade = KeyLoaderFacade::new(
			Arc::new(user_facade_mock),
			Arc::new(typed_entity_client_mock),
		);

		let current_user_group_key = key_loader_facade
			.get_current_sym_group_key(user_group._id.as_ref().unwrap())
			.await
			.unwrap();
		assert_eq!(current_user_group_key.version, user_group.groupKeyVersion);
		assert_eq!(current_user_group_key.object, user_group_key.object);

		let _ = key_loader_facade
			.get_current_sym_group_key(user_group._id.as_ref().unwrap())
			.await; // should not be cached
	}

	#[tokio::test]
	async fn get_non_user_group_key() {
		let (group, current_group_key) = generate_group_data();

		let mut user_facade_mock = MockUserFacade::default();
		{
			let user_group = group.clone();
			user_facade_mock
				.expect_get_user_group_id()
				.returning(move || user_group._id.clone().unwrap());
		}
		{
			let user_group_key = current_group_key.clone();
			user_facade_mock
				.expect_get_current_user_group_key()
				.returning(move || Some(user_group_key.clone()));
		}

		let typed_entity_client_mock = MockTypedEntityClient::default();

		let key_loader_facade = KeyLoaderFacade::new(
			Arc::new(user_facade_mock),
			Arc::new(typed_entity_client_mock),
		);

		let group_key = key_loader_facade
			.get_current_sym_group_key(group._id.as_ref().unwrap())
			.await
			.unwrap();
		assert_eq!(group_key.version, group.groupKeyVersion);
		assert_eq!(group_key.object, current_group_key.object)
	}

	#[tokio::test]
	async fn load_former_key_pairs() {
		let randomizer = make_thread_rng_facade();

		// Same as the length of former_keys_deprecated
		let current_group_key_version = FORMER_KEYS as i64;
		let current_group_key = generate_group_key(current_group_key_version);
		let current_key_pair = PQKeyPairs::generate(&randomizer);

		let group = generate_group_with_keys(&current_key_pair, &current_group_key, &randomizer);

		let (former_keys, former_key_pairs_decrypted, _) =
			generate_former_keys(&current_group_key, &randomizer);

		let key_loader_facade =
			make_mocks_with_former_keys(&group, &current_group_key, &randomizer, &former_keys);

		for i in 0..FORMER_KEYS {
			let keypair = key_loader_facade
				.load_key_pair(group._id.as_ref().unwrap(), i as i64)
				.await
				.unwrap();
			match keypair {
                AsymmetricKeyPair::RSAKeyPair(_) => panic!("key_loader_facade.load_key_pair() returned an RSAKeyPair! Expected PQKeyPairs."),
                AsymmetricKeyPair::RSAEccKeyPair(_) => panic!("key_loader_facade.load_key_pair() returned an RSAEccKeyPair! Expected PQKeyPairs."),
                AsymmetricKeyPair::PQKeyPairs(pq_key_pair) => {
                    assert_eq!(pq_key_pair, *former_key_pairs_decrypted.get(i).expect("former_key_pairs_decrypted should have FORMER_KEYS keys"))
                }
            }
		}
	}

	#[tokio::test]
	async fn load_current_key_pair() {
		let user_group_key = generate_group_key(1);
		let randomizer = make_thread_rng_facade();
		let current_key_pair = PQKeyPairs::generate(&randomizer);
		let user_group = generate_group_with_keys(&current_key_pair, &user_group_key, &randomizer);

		let mut user_facade_mock = MockUserFacade::default();
		{
			let user_group_id = user_group._id.clone();
			user_facade_mock
				.expect_get_user_group_id()
				.returning(move || user_group_id.clone().unwrap());
		}
		{
			let user_group_key = user_group_key.clone();
			user_facade_mock
				.expect_get_current_user_group_key()
				.returning(move || Some(user_group_key.clone()));
		}

		let mut typed_entity_client_mock = MockTypedEntityClient::default();
		{
			let user_group = user_group.clone();
			let group_id = user_group._id.clone();
			typed_entity_client_mock
				.expect_load::<Group, GeneratedId>()
				.withf(move |id| *id == group_id.clone().unwrap())
				.returning(move |_| Ok(user_group.clone()));
		}

		let key_loader_facade = KeyLoaderFacade::new(
			Arc::new(user_facade_mock),
			Arc::new(typed_entity_client_mock),
		);

		let loaded_current_key_pair = key_loader_facade
			.load_key_pair(&user_group._id.unwrap(), user_group.groupKeyVersion)
			.await
			.unwrap();

		match loaded_current_key_pair {
			AsymmetricKeyPair::RSAKeyPair(_) => panic!("Expected PQ key pair!"),
			AsymmetricKeyPair::RSAEccKeyPair(_) => panic!("Expected PQ key pair!"),
			AsymmetricKeyPair::PQKeyPairs(loaded_current_key_pair) => {
				assert_eq!(loaded_current_key_pair, current_key_pair);
			},
		}
	}

	#[tokio::test]
	async fn load_and_decrypt_former_group_key() {
		let randomizer = make_thread_rng_facade();

		// Same as the length of former_keys_deprecated
		let current_group_key_version = FORMER_KEYS as i64;
		let current_group_key = generate_group_key(current_group_key_version);
		let (former_keys, _, former_keys_decrypted) =
			generate_former_keys(&current_group_key, &randomizer);

		let current_key_pair = PQKeyPairs::generate(&randomizer);
		let group = generate_group_with_keys(&current_key_pair, &current_group_key, &randomizer);

		let key_loader_facade =
			make_mocks_with_former_keys(&group, &current_group_key, &randomizer, &former_keys);
		for i in 0..FORMER_KEYS {
			let keypair = key_loader_facade
				.load_sym_group_key(group._id.as_ref().expect("no id on group!"), i as i64, None)
				.await
				.unwrap();
			match keypair {
                GenericAesKey::Aes128(_) => panic!("key_loader_facade.load_sym_group_key() returned an AES128 key! Expected an AES256 key."),
                GenericAesKey::Aes256(returned_group_key) => {
                    assert_eq!(returned_group_key, *former_keys_decrypted.get(i).expect("former_keys_decrypted should have FORMER_KEYS keys"))
                }
            }
		}
	}

	#[tokio::test]
	async fn load_and_decrypt_current_group_key() {
		let randomizer = make_thread_rng_facade();

		// Same as the length of former_keys_deprecated
		let current_group_key_version = FORMER_KEYS as i64;
		let current_group_key = generate_group_key(current_group_key_version);

		let current_key_pair = PQKeyPairs::generate(&randomizer);
		let group = generate_group_with_keys(&current_key_pair, &current_group_key, &randomizer);

		let (user_facade_mock, typed_entity_client_mock) =
			make_mocks(&group, &current_group_key, &randomizer);
		let key_loader_facade = KeyLoaderFacade::new(
			Arc::new(user_facade_mock),
			Arc::new(typed_entity_client_mock),
		);

		let returned_key = key_loader_facade
			.load_sym_group_key(
				group._id.as_ref().expect("no id on group!"),
				current_group_key_version,
				None,
			)
			.await
			.unwrap();

		assert_eq!(returned_key, current_group_key.object)
	}

	#[tokio::test]
	async fn outdated_current_group_key_errors() {
		let randomizer = make_thread_rng_facade();

		// Same as the length of former_keys_deprecated
		let current_group_key_version = FORMER_KEYS as i64;
		let current_group_key = generate_group_key(current_group_key_version);

		let current_key_pair = PQKeyPairs::generate(&randomizer);
		let group = generate_group_with_keys(&current_key_pair, &current_group_key, &randomizer);

		let (_, _, former_keys_decrypted) = generate_former_keys(&current_group_key, &randomizer);

		let outdated_current_group_key_version = current_group_key_version - 1;
		let outdated_current_group_key = VersionedAesKey {
			object: former_keys_decrypted[outdated_current_group_key_version as usize]
				.clone()
				.into(),
			version: outdated_current_group_key_version,
		};

		let user_facade_mock = MockUserFacade::default();
		let typed_entity_client_mock = MockTypedEntityClient::default();

		let key_loader_facade = KeyLoaderFacade::new(
			Arc::new(user_facade_mock),
			Arc::new(typed_entity_client_mock),
		);

		key_loader_facade
			.load_sym_group_key(
				group._id.as_ref().expect("no id on group!"),
				current_group_key_version,
				Some(outdated_current_group_key),
			)
			.await
			.expect_err("Did not error with outdated group key");
	}
}
