use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError, VersionedAesKey};
use crate::crypto::key_encryption::decrypt_key_pair;
use crate::entities::generated::sys::{Group, GroupKey, KeyPair};
#[cfg_attr(test, mockall_double::double)]
use crate::key_cache::KeyCache;
#[cfg_attr(test, mockall_double::double)]
use crate::typed_entity_client::TypedEntityClient;
#[cfg_attr(test, mockall_double::double)]
use crate::user_facade::UserFacade;
use crate::util::{convert_version_to_u64, Versioned};
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
	key_cache: Arc<KeyCache>,
}

#[cfg_attr(test, mockall::automock)]
impl KeyLoaderFacade {
	pub fn new(
		user_facade: Arc<UserFacade>,
		entity_client: Arc<TypedEntityClient>,
		key_cache: Arc<KeyCache>,
	) -> Self {
		KeyLoaderFacade {
			user_facade,
			entity_client,
			key_cache,
		}
	}

	/// Load the symmetric group key for the groupId with the provided requestedVersion.
	/// `currentGroupKey` needs to be set if the user is not a member of the group (e.g. an admin)
	pub async fn load_sym_group_key(
		&self,
		group_id: &GeneratedId,
		version: u64,
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
			let symmetric_group_key = self
				.get_former_versioned_group_key(group_id, &group_key, version)
				.await?;
			Ok(symmetric_group_key.object)
		}
	}

	async fn get_former_versioned_group_key(
		&self,
		group_id: &GeneratedId,
		group_key: &VersionedAesKey,
		target_key_version: u64,
	) -> Result<VersionedAesKey, KeyLoadError> {
		let stored_former_key: Option<VersionedAesKey> = self
			.key_cache
			.get_group_key_for_version(group_id, target_key_version as i64);
		if let Some(former_key) = stored_former_key {
			return Ok(former_key);
		}

		let group: Group = self.entity_client.load(&group_id.to_owned()).await?;
		let group_key: GenericAesKey = match self
			.find_former_group_key(&group, group_key, target_key_version)
			.await
		{
			Ok(former_key) => former_key.symmetric_group_key,
			Err(e) => return Err(e),
		};

		Ok(VersionedAesKey::new(group_key, target_key_version))
	}

	async fn find_former_group_key(
		&self,
		group: &Group,
		// TODO: why do we take it by ref if we are cloning it anyway
		current_group_key: &VersionedAesKey,
		target_key_version: u64,
	) -> Result<FormerGroupKey, KeyLoadError> {
		let list_id = group.formerGroupKeys.clone().list;

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

		self.key_cache.put_group_key(
			&(group._id.clone().unwrap()),
			&VersionedAesKey {
				object: last_group_key.clone(),
				version: last_version,
			},
		);

		Ok(FormerGroupKey {
			symmetric_group_key: last_group_key,
			group_key_instance: last_group_key_instance.unwrap(),
		})
	}

	fn decode_group_key_version(&self, element_id: &CustomId) -> Result<u64, KeyLoadError> {
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

		if let Some(key) = self.key_cache.get_current_group_key(group_id) {
			return Ok(key);
		}

		// The call leads to recursive calls down the chain, so BoxFuture is used to wrap the recursive async calls
		fn load_current_group_key_helper<'a>(
			facade: &'a KeyLoaderFacade,
			group_id: &'a GeneratedId,
		) -> BoxFuture<'a, Result<VersionedAesKey, KeyLoadError>> {
			Box::pin(facade.load_and_decrypt_current_sym_group_key(group_id))
		}

		let key = load_current_group_key_helper(self, group_id).await?;
		self.key_cache.put_group_key(group_id, &key);
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
			.load_sym_user_group_key(convert_version_to_u64(group_membership.symKeyVersion))
			.await?;
		let version = convert_version_to_u64(group_membership.groupKeyVersion);
		let object = required_user_group_key
			.decrypt_aes_key(&group_membership.symEncGKey)
			.map_err(|e| KeyLoadError {
				reason: e.to_string(),
			})?;
		Ok(VersionedAesKey { version, object })
	}

	async fn load_sym_user_group_key(
		&self,
		user_group_key_version: u64,
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
		requested_version: u64,
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
		if convert_version_to_u64(group.groupKeyVersion) != current_group_key.version {
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
		let key_pair =
			Self::validate_and_decrypt_key_pair(group.currentKeys, group_id, &current_group_key)?;
		Ok(Versioned {
			object: key_pair,
			version: convert_version_to_u64(group.groupKeyVersion),
		})
	}

	async fn load_key_pair_impl(
		&self,
		group: Group,
		requested_version: u64,
		current_group_key: VersionedAesKey,
	) -> Result<AsymmetricKeyPair, KeyLoadError> {
		let key_pair_group_id = &group._id.clone().unwrap();
		let key_pair: Option<KeyPair>;
		let sym_group_key: VersionedAesKey;
		match requested_version.cmp(&current_group_key.version) {
			Ordering::Greater => {
				return Err(KeyLoadError { reason: format!("Not possible to get newer key version than is cached for group {key_pair_group_id}") });
			},
			Ordering::Equal => {
				sym_group_key = current_group_key;
				if convert_version_to_u64(group.groupKeyVersion) == sym_group_key.version {
					key_pair = group.currentKeys
				} else {
					let former_keys_list = group.formerGroupKeys.list;
					// we load by the version and thus can be sure that we are able to decrypt this key
					let former_group_key: GroupKey = self
						.entity_client
						.load(&IdTupleCustom::new(
							former_keys_list,
							CustomId::from_custom_string(&sym_group_key.version.to_string()),
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
				sym_group_key = VersionedAesKey {
					object: symmetric_group_key,
					version: requested_version,
				};
				key_pair = group_key_instance.keyPair;
			},
		}
		KeyLoaderFacade::validate_and_decrypt_key_pair(key_pair, key_pair_group_id, &sym_group_key)
	}

	pub fn validate_and_decrypt_key_pair(
		key_pair: Option<KeyPair>,
		group_id: &GeneratedId,
		group_key: &VersionedAesKey,
	) -> Result<AsymmetricKeyPair, KeyLoadError> {
		match key_pair {
			None => Err(KeyLoadError {
				reason: format!("no key pair on group {group_id}"),
			}),
			Some(kp) => {
				let decrypted_key_pair = decrypt_key_pair(&group_key.object, &kp)?;
				match decrypted_key_pair {
					AsymmetricKeyPair::RSAX25519KeyPair(_) | AsymmetricKeyPair::RSAKeyPair(_) => {
						if group_key.version != 0 {
							return Err(KeyLoadError {
								reason: format!(
									"received an rsa key pair in a version other than 0: {}",
									group_key.version
								),
							});
						}
					},
					AsymmetricKeyPair::TutaCryptKeyPairs(_) => {},
				}
				Ok(decrypted_key_pair)
			},
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
	use crate::crypto::rsa::RSAKeyPair;
	use crate::crypto::{aes::Iv, TutaCryptKeyPairs};
	use crate::entities::generated::sys::{GroupKeysRef, GroupMembership};
	use crate::key_cache::MockKeyCache;
	use crate::typed_entity_client::MockTypedEntityClient;
	use crate::user_facade::MockUserFacade;
	use crate::util::test_utils::{
		generate_former_keys, generate_group_with_keys, generate_random_group,
		random_aes256_versioned_key, FORMER_KEYS,
	};
	use crate::util::{convert_version_to_i64, get_vec_reversed};
	use crate::CustomId;
	use crate::IdTupleGenerated;
	use crypto_primitives::randomizer_facade::test_util::make_thread_rng_facade;
	use crypto_primitives::randomizer_facade::RandomizerFacade;
	use mockall::predicate;

	fn generate_group_data() -> (Group, VersionedAesKey) {
		(
			generate_random_group(
				None,
				GroupKeysRef {
					_id: Some(CustomId::test_random()),
					list: GeneratedId::test_random(),
				},
			),
			random_aes256_versioned_key(1),
		)
	}

	fn make_mocks_with_former_keys(
		group: &Group,
		current_group_key: &VersionedAesKey,
		randomizer: &RandomizerFacade,
		former_keys: Option<&[GroupKey; FORMER_KEYS]>, // Non-cached keys to be retrieved from entity client
		key_cache: Arc<MockKeyCache>,
	) -> KeyLoaderFacade {
		let (user_facade_mock, mut typed_entity_client_mock) =
			make_mocks(group, current_group_key, randomizer, None, None);

		if former_keys.is_some() {
			for i in 0..FORMER_KEYS {
				let group = group.clone();
				let former_keys = former_keys.clone().unwrap();

				let returned_keys = get_vec_reversed(former_keys[i..].to_vec());
				typed_entity_client_mock
					.expect_load_range::<GroupKey, CustomId>()
					.with(
						predicate::eq(group.formerGroupKeys.list),
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
			key_cache,
		)
	}

	fn make_key_cache_mock(
		group: &Group,
		current_group_key: &VersionedAesKey,
		cached_keys: Vec<VersionedAesKey>,
	) -> Arc<MockKeyCache> {
		let mut key_cache_mock = MockKeyCache::default();
		let group_key = current_group_key.clone();

		key_cache_mock
			.expect_get_current_group_key()
			.returning(move |_| Some(group_key.clone()));

		key_cache_mock
			.expect_get_group_key_for_version()
			.with(
				predicate::eq(group._id.clone().unwrap()),
				predicate::in_iter::<Vec<i64>, i64>((0..FORMER_KEYS as i64).collect()),
			)
			.return_const(None);

		cached_keys.iter().for_each(|key| {
			key_cache_mock
				.expect_get_group_key_for_version()
				.with(
					predicate::eq(group._id.clone().unwrap()),
					predicate::eq(key.version as i64),
				)
				.return_const(key.clone());

			key_cache_mock
				.expect_put_group_key()
				.with(
					predicate::eq(group._id.clone().unwrap()),
					predicate::eq(key.clone()),
				)
				.times(0);
		});

		Arc::new(key_cache_mock)
	}

	fn make_mocks(
		group: &Group,
		current_group_key: &VersionedAesKey,
		randomizer: &RandomizerFacade,
		user_group: Option<Group>,
		user_group_key: Option<VersionedAesKey>,
	) -> (MockUserFacade, MockTypedEntityClient) {
		let user_group_key = match user_group_key {
			Some(group_key) => group_key,
			_ => random_aes256_versioned_key(0),
		};

		let user_group = match user_group {
			Some(group) => group,
			_ => generate_random_group(
				None,
				GroupKeysRef {
					_id: Some(CustomId::test_random()),
					list: GeneratedId::test_random(),
				},
			),
		};

		let mut user_facade_mock = MockUserFacade::default();
		{
			let user_group_key = user_group_key.clone();
			user_facade_mock
				.expect_get_current_user_group_key()
				.returning(move || Some(user_group_key.clone()));
		}

		{
			let user_group_id = user_group._id.clone();
			let sym_enc_g_key = user_group_key
				.object
				.encrypt_key(&current_group_key.object, Iv::generate(randomizer));
			let sym_enc_g_key_clone = sym_enc_g_key.clone();

			let current_group_key = current_group_key.clone();
			let current_group_key_clone = current_group_key.clone();
			user_facade_mock
				.expect_get_membership()
				.with(predicate::eq(user_group_id.clone().unwrap()))
				.returning(move |_| {
					Ok(GroupMembership {
						_id: Some(CustomId(user_group_id.clone().unwrap().to_string())),
						admin: false,
						capability: None,
						groupKeyVersion: convert_version_to_i64(current_group_key.clone().version),
						groupType: None,
						symEncGKey: sym_enc_g_key.clone(),
						symKeyVersion: convert_version_to_i64(user_group_key.version),
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

			user_facade_mock
				.expect_get_membership()
				.with(predicate::eq(group._id.clone().unwrap()))
				.return_const(Ok(GroupMembership {
					_id: Some(CustomId(group._id.clone().unwrap().to_string())),
					admin: false,
					capability: None,
					groupKeyVersion: convert_version_to_i64(
						current_group_key_clone.clone().version,
					),
					groupType: None,
					symEncGKey: sym_enc_g_key_clone,
					symKeyVersion: convert_version_to_i64(user_group_key.version),
					group: group._id.clone().unwrap(),
					groupInfo: IdTupleGenerated {
						list_id: Default::default(),
						element_id: Default::default(),
					},
					groupMember: IdTupleGenerated {
						list_id: Default::default(),
						element_id: Default::default(),
					},
				}));
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

	mod get_current_sym_group_key {
		use super::*;

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
				Arc::new(MockKeyCache::default()),
			);

			let current_user_group_key = key_loader_facade
				.get_current_sym_group_key(user_group._id.as_ref().unwrap())
				.await
				.unwrap();
			assert_eq!(
				current_user_group_key.version,
				convert_version_to_u64(user_group.groupKeyVersion)
			);
			assert_eq!(current_user_group_key.object, user_group_key.object);

			let _ = key_loader_facade
				.get_current_sym_group_key(user_group._id.as_ref().unwrap())
				.await; // should not be cached
		}

		#[tokio::test]
		async fn get_non_user_group_key() {
			let randomizer = make_thread_rng_facade();

			let (user_group, user_current_group_key) = generate_group_data();
			let (gp, gp_key) = generate_group_data();

			let (a, b) = make_mocks(
				&gp,
				&gp_key,
				&randomizer.clone(),
				Some(user_group.clone()),
				Some(user_current_group_key.clone()),
			);

			let non_user_group_id = gp._id.clone().unwrap();

			let mut key_cache_mock = MockKeyCache::default();
			key_cache_mock
				.expect_get_current_group_key()
				.with(predicate::eq(non_user_group_id.clone()))
				.return_const(None);
			key_cache_mock
				.expect_put_group_key()
				.with(
					predicate::eq(non_user_group_id.clone()),
					predicate::eq(gp_key.clone()),
				)
				.return_const(());

			let key_loader_facade =
				KeyLoaderFacade::new(Arc::new(a), Arc::new(b), Arc::new(key_cache_mock));

			let group_key = key_loader_facade
				.get_current_sym_group_key(&non_user_group_id)
				.await
				.unwrap();

			assert_eq!(
				group_key.version,
				convert_version_to_u64(gp.groupKeyVersion)
			);
			assert_eq!(group_key.object, gp_key.object)
		}
	}

	mod load_key_pair {
		use super::*;

		#[tokio::test]
		async fn load_former_key_pairs() {
			let randomizer = make_thread_rng_facade();

			// Same as the length of former_keys_deprecated
			let current_group_key_version = FORMER_KEYS as u64;
			let current_group_key = random_aes256_versioned_key(current_group_key_version);
			let current_key_pair = TutaCryptKeyPairs::generate(&randomizer);

			let group = generate_group_with_keys(
				&AsymmetricKeyPair::TutaCryptKeyPairs(current_key_pair),
				&current_group_key,
				&randomizer,
			);

			let (former_keys, former_key_pairs_decrypted, _) =
				generate_former_keys(&current_group_key, &randomizer);

			let mut key_cache_mock = MockKeyCache::default();
			key_cache_mock
				.expect_get_current_group_key()
				.return_const(Some(current_group_key.clone()));

			key_cache_mock
				.expect_get_group_key_for_version()
				.with(
					predicate::eq(group._id.clone().unwrap()),
					predicate::in_iter::<Vec<i64>, i64>((0..FORMER_KEYS as i64).collect()),
				)
				.return_const(None);

			key_cache_mock.expect_put_group_key().return_const(());

			let key_loader_facade = make_mocks_with_former_keys(
				&group,
				&current_group_key,
				&randomizer,
				Some(&former_keys),
				Arc::new(key_cache_mock),
			);

			for i in 0..FORMER_KEYS {
				let keypair = key_loader_facade
					.load_key_pair(group._id.as_ref().unwrap(), i as u64)
					.await
					.unwrap();
				match keypair {
                    AsymmetricKeyPair::RSAKeyPair(_) => panic!("key_loader_facade.load_key_pair() returned an RSAKeyPair! Expected TutaCryptKeyPairs."),
                    AsymmetricKeyPair::RSAX25519KeyPair(_) => panic!("key_loader_facade.load_key_pair() returned an RSAX25519KeyPair! Expected TutaCryptKeyPairs."),
                    AsymmetricKeyPair::TutaCryptKeyPairs(tuta_crypt_key_pairs) => {
                        assert_eq!(tuta_crypt_key_pairs, *former_key_pairs_decrypted.get(i).expect("former_key_pairs_decrypted should have FORMER_KEYS keys"))
                    }
                }
			}
		}

		#[tokio::test]
		async fn load_current_key_pair() {
			let user_group_key = random_aes256_versioned_key(1);
			let randomizer = make_thread_rng_facade();
			let current_key_pair = TutaCryptKeyPairs::generate(&randomizer);
			let asymmetric_key_pair =
				AsymmetricKeyPair::TutaCryptKeyPairs(current_key_pair.clone());
			let user_group =
				generate_group_with_keys(&asymmetric_key_pair, &user_group_key, &randomizer);

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
				Arc::new(MockKeyCache::default()),
			);

			let loaded_current_key_pair = key_loader_facade
				.load_key_pair(
					&user_group._id.unwrap(),
					convert_version_to_u64(user_group.groupKeyVersion),
				)
				.await
				.unwrap();

			match loaded_current_key_pair {
				AsymmetricKeyPair::RSAKeyPair(_) => panic!("Expected TutaCrypt key pair!"),
				AsymmetricKeyPair::RSAX25519KeyPair(_) => panic!("Expected TutaCrypt key pair!"),
				AsymmetricKeyPair::TutaCryptKeyPairs(loaded_current_key_pair) => {
					assert_eq!(loaded_current_key_pair, current_key_pair);
				},
			}
		}

		#[tokio::test]
		async fn rejects_rsa_key_not_0() {
			let user_group_key = random_aes256_versioned_key(1);
			let randomizer = make_thread_rng_facade();
			let current_key_pair = RSAKeyPair::generate(&randomizer);
			let user_group = generate_group_with_keys(
				&AsymmetricKeyPair::RSAKeyPair(current_key_pair),
				&user_group_key,
				&randomizer,
			);

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
				Arc::new(MockKeyCache::default()),
			);

			let result = key_loader_facade
				.load_key_pair(&user_group._id.unwrap(), user_group_key.version)
				.await;
			assert!(result.is_err());
			let err = result.err().unwrap();
			assert!(matches!(err, KeyLoadError { .. }));
			assert_eq!(
				err.reason,
				"received an rsa key pair in a version other than 0: 1"
			);
		}
	}

	mod load_current_key_pair {
		use super::*;

		#[tokio::test]
		async fn accepts_rsa_key_version_0() {
			let user_group_key = random_aes256_versioned_key(0);
			let randomizer = make_thread_rng_facade();
			let current_key_pair = RSAKeyPair::generate(&randomizer);
			let user_group = generate_group_with_keys(
				&AsymmetricKeyPair::RSAKeyPair(current_key_pair.clone()),
				&user_group_key,
				&randomizer,
			);

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
				Arc::new(MockKeyCache::default()),
			);

			let result = key_loader_facade
				.load_current_key_pair(&user_group._id.unwrap())
				.await
				.unwrap();
			assert_eq!(result.version, user_group_key.version);
			match result.object {
				AsymmetricKeyPair::RSAKeyPair(loaded_current_key_pair) => {
					assert_eq!(loaded_current_key_pair, current_key_pair);
				},
				AsymmetricKeyPair::RSAX25519KeyPair(_)
				| AsymmetricKeyPair::TutaCryptKeyPairs(_) => {
					panic!("Expected RSA key pair!")
				},
			}
		}

		#[tokio::test]
		async fn rejects_rsa_key_not_0() {
			let user_group_key = random_aes256_versioned_key(1);
			let randomizer = make_thread_rng_facade();
			let current_key_pair = RSAKeyPair::generate(&randomizer);
			let user_group = generate_group_with_keys(
				&AsymmetricKeyPair::RSAKeyPair(current_key_pair),
				&user_group_key,
				&randomizer,
			);

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
				Arc::new(MockKeyCache::default()),
			);

			let result = key_loader_facade
				.load_current_key_pair(&user_group._id.unwrap())
				.await;
			assert!(result.is_err());
			let err = result.err().unwrap();
			assert!(matches!(err, KeyLoadError { .. }));
			assert_eq!(
				err.reason,
				"received an rsa key pair in a version other than 0: 1"
			);
		}
	}

	mod load_sym_group_key {
		use super::*;
		#[tokio::test]
		async fn load_current_user_group_key() {
			let current_group_key_version = 1;
			let current_group_key = random_aes256_versioned_key(current_group_key_version);
			let group_id = GeneratedId::test_random();

			let mut user_facade_mock = MockUserFacade::default();
			let mut typed_entity_client_mock = MockTypedEntityClient::default();
			let key_cache_mock = MockKeyCache::default();

			user_facade_mock
				.expect_get_user_group_id()
				.return_const(group_id.clone());

			user_facade_mock
				.expect_get_current_user_group_key()
				.times(1)
				.return_const(current_group_key.clone());

			typed_entity_client_mock
				.expect_load::<Group, GeneratedId>()
				.never();

			let key_loader_facade = KeyLoaderFacade::new(
				Arc::new(user_facade_mock),
				Arc::new(typed_entity_client_mock),
				Arc::new(key_cache_mock),
			);

			let returned_key = key_loader_facade
				.load_sym_group_key(&group_id, current_group_key_version, None)
				.await
				.unwrap();

			assert_eq!(returned_key, current_group_key.object)
		}

		#[tokio::test]
		async fn load_and_decrypt_former_group_key() {
			let randomizer = make_thread_rng_facade();

			// Same as the length of former_keys_deprecated
			let current_group_key_version = FORMER_KEYS as u64;
			let current_group_key = random_aes256_versioned_key(current_group_key_version);
			let (former_keys, _, former_keys_decrypted) =
				generate_former_keys(&current_group_key, &randomizer);

			let current_key_pair = TutaCryptKeyPairs::generate(&randomizer);
			let group = generate_group_with_keys(
				&AsymmetricKeyPair::TutaCryptKeyPairs(current_key_pair),
				&current_group_key,
				&randomizer,
			);

			let mut key_cache_mock = MockKeyCache::default();
			key_cache_mock
				.expect_get_group_key_for_version()
				.return_const(None)
				.times(2);
			key_cache_mock
				.expect_get_current_group_key()
				.with(predicate::eq(group._id.clone().unwrap()))
				.return_const(None);
			key_cache_mock
				.expect_put_group_key()
				.return_const(())
				.times(4); // Two times for each key (1 for key, 1 for current user key)

			let key_loader_facade = make_mocks_with_former_keys(
				&group,
				&current_group_key,
				&randomizer,
				Some(&former_keys),
				Arc::new(key_cache_mock),
			);

			for i in 0..FORMER_KEYS {
				let keypair = key_loader_facade
					.load_sym_group_key(
						group._id.as_ref().expect("no id on group!"),
						i as u64,
						None,
					)
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
		async fn load_and_decrypt_former_group_key_from_cache() {
			let randomizer = make_thread_rng_facade();

			// Same as the length of former_keys_deprecated
			let current_group_key_version = FORMER_KEYS as u64;
			let current_group_key = random_aes256_versioned_key(current_group_key_version);
			let (_, _, former_keys_decrypted) =
				generate_former_keys(&current_group_key, &randomizer);

			let current_key_pair = TutaCryptKeyPairs::generate(&randomizer);
			let group = generate_group_with_keys(
				&AsymmetricKeyPair::TutaCryptKeyPairs(current_key_pair),
				&current_group_key,
				&randomizer,
			);

			let mut key_cache_mock = MockKeyCache::default();
			for i in 0..FORMER_KEYS {
				key_cache_mock
					.expect_get_group_key_for_version()
					.with(
						predicate::eq(group._id.clone().unwrap()),
						predicate::eq(i as i64),
					)
					.return_const(VersionedAesKey {
						object: GenericAesKey::Aes256(former_keys_decrypted[i].clone()),
						version: i as u64,
					});
			}
			key_cache_mock
				.expect_get_current_group_key()
				.with(predicate::eq(group._id.clone().unwrap()))
				.return_const(current_group_key.clone());

			let key_loader_facade = make_mocks_with_former_keys(
				&group,
				&current_group_key,
				&randomizer,
				None,
				Arc::new(key_cache_mock),
			);

			for i in 0..FORMER_KEYS {
				let keypair = key_loader_facade
					.load_sym_group_key(
						group._id.as_ref().expect("no id on group!"),
						i as u64,
						None,
					)
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
		async fn outdated_current_group_key_errors() {
			let randomizer = make_thread_rng_facade();

			// Same as the length of former_keys_deprecated
			let current_group_key_version = FORMER_KEYS as u64;
			let current_group_key = random_aes256_versioned_key(current_group_key_version);

			let current_key_pair = TutaCryptKeyPairs::generate(&randomizer);
			let group = generate_group_with_keys(
				&AsymmetricKeyPair::TutaCryptKeyPairs(current_key_pair),
				&current_group_key,
				&randomizer,
			);

			let (_, _, former_keys_decrypted) =
				generate_former_keys(&current_group_key, &randomizer);

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
				Arc::new(MockKeyCache::default()),
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
}
