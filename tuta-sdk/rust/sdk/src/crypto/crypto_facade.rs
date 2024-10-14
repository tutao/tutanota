use crate::crypto::aes::Iv;
use crate::crypto::ecc::EccPublicKey;
use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError};
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::rsa::{RSAEccKeyPair, RSAEncryptionError};
use crate::crypto::tuta_crypt::{PQError, PQMessage};
use crate::crypto::Aes256Key;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::sys::BucketKey;
use crate::generated_id::GeneratedId;
use crate::instance_mapper::InstanceMapper;
#[cfg_attr(test, mockall_double::double)]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::metamodel::TypeModel;
use crate::util::ArrayCastingError;
use crate::IdTuple;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use std::sync::Arc;
use zeroize::Zeroizing;

/// The name of the field that contains the session key encrypted
/// by the owner group's key in an entity
const OWNER_ENC_SESSION_FIELD: &str = "_ownerEncSessionKey";
/// The name of the owner-encrypted session key version field in an entity
const OWNER_KEY_VERSION_FIELD: &str = "_ownerKeyVersion";
/// The name of the owner group field in an entity
const OWNER_GROUP_FIELD: &str = "_ownerGroup";
/// The name of the ID field in an entity
const ID_FIELD: &str = "_id";
/// The name of the bucket key field in an entity
const BUCKET_KEY_FIELD: &str = "bucketKey";

#[derive(uniffi::Object)]
pub struct CryptoFacade {
	key_loader_facade: Arc<KeyLoaderFacade>,
	instance_mapper: Arc<InstanceMapper>,
	randomizer_facade: RandomizerFacade,
}

/// Session key that encrypts an entity and the same key encrypted with the owner group.
/// owner_enc_session_key is stored on entities to avoid public key encryption on subsequent loads.
#[derive(Clone)]
pub struct ResolvedSessionKey {
	pub session_key: GenericAesKey,
	pub owner_enc_session_key: Vec<u8>,
}

#[cfg_attr(test, mockall::automock)]
impl CryptoFacade {
	#[must_use]
	pub fn new(
		key_loader_facade: Arc<KeyLoaderFacade>,
		instance_mapper: Arc<InstanceMapper>,
		randomizer_facade: RandomizerFacade,
	) -> Self {
		Self {
			key_loader_facade,
			instance_mapper,
			randomizer_facade,
		}
	}

	/// Returns the session key from `entity` and resolves the bucket key fields contained inside
	/// if present
	pub async fn resolve_session_key(
		&self,
		entity: &mut ParsedEntity,
		model: &TypeModel,
	) -> Result<Option<ResolvedSessionKey>, SessionKeyResolutionError> {
		if !model.marked_encrypted() {
			return Ok(None);
		}

		// Derive the session key from the bucket key
		if let Some(bucket_key_value) = entity.get(BUCKET_KEY_FIELD) {
			match bucket_key_value {
				ElementValue::Dict(_) => {
					let resolved_key = self.resolve_bucket_key(entity, model).await?;
					return Ok(Some(resolved_key));
				},
				ElementValue::Null => {},
				_ => {
					return Err(SessionKeyResolutionError {
						reason: "bucketKey is invalid!".to_string(),
					})
				},
			}
		}

		// Extract the session key data from the owner group of the entity
		let EntityOwnerKeyData {
			owner_enc_session_key: Some(owner_enc_session_key),
			owner_key_version: Some(owner_key_version),
			owner_group: Some(owner_group),
		} = EntityOwnerKeyData::extract_owner_key_data(entity)?
		else {
			return Err(SessionKeyResolutionError {
				reason: "instance missing owner key/group data".to_string(),
			});
		};

		let group_key: GenericAesKey = self
			.key_loader_facade
			.load_sym_group_key(owner_group, owner_key_version, None)
			.await?;

		let session_key = group_key.decrypt_aes_key(owner_enc_session_key)?;
		// TODO: performance: should we reuse owner_enc_session_key?
		Ok(Some(ResolvedSessionKey {
			session_key,
			owner_enc_session_key: owner_enc_session_key.clone(),
		}))
	}

	/// Resolves the bucket key fields inside `entity` and returns the session key
	async fn resolve_bucket_key(
		&self,
		entity: &mut ParsedEntity,
		model: &TypeModel,
	) -> Result<ResolvedSessionKey, SessionKeyResolutionError> {
		let Some(ElementValue::Dict(bucket_key_map)) = entity.get(BUCKET_KEY_FIELD) else {
			return Err(SessionKeyResolutionError {
				reason: format!("{BUCKET_KEY_FIELD} is not a dictionary type"),
			});
		};

		let bucket_key: BucketKey =
			match self.instance_mapper.parse_entity(bucket_key_map.to_owned()) {
				Ok(n) => n,
				Err(e) => {
					return Err(SessionKeyResolutionError {
						reason: format!("{BUCKET_KEY_FIELD} could not be deserialized: {e}"),
					})
				},
			};

		let owner_key_data = EntityOwnerKeyData::extract_owner_key_data(entity)?;
		let Some(owner_group) = owner_key_data.owner_group else {
			return Err(SessionKeyResolutionError {
				reason: "entity has no ownerGroup".to_owned(),
			});
		};

		let ResolvedBucketKey {
			decrypted_bucket_key,
			sender_identity_key: _sender_identity_key, // TODO: Use when implementing authentication
		} = self
			.decrypt_bucket_key(&bucket_key, owner_group, model)
			.await?;

		let mut session_key_for_this_instance = None;

		for instance_session_key in bucket_key.bucketEncSessionKeys {
			let decrypted_session_key = decrypted_bucket_key
				.decrypt_aes_key(instance_session_key.symEncSessionKey.as_slice())?;

			let instance_id = parse_id_field(entity.get(ID_FIELD))?;

			if &instance_session_key.instanceId == instance_id {
				session_key_for_this_instance = Some(decrypted_session_key.clone());
			}
		}

		let Some(session_key) = session_key_for_this_instance else {
			return Err(SessionKeyResolutionError {
				reason: "no session key found in bucket key for this instance".to_string(),
			});
		};

		// TODO: authenticate
		let versioned_key = self
			.key_loader_facade
			.get_current_sym_group_key(owner_group)
			.await?;

		let owner_enc_session_key = versioned_key
			.object
			.encrypt_key(&session_key, Iv::generate(&self.randomizer_facade));
		Ok(ResolvedSessionKey {
			session_key,
			owner_enc_session_key,
		})
	}

	/// Decrypts a bucket key, using `owner_group` in the case of secure external.
	///
	/// `model` should be the type model of the instance being decrypted (e.g. `Mail`).
	// Remove allowance after implementing secure external resolveWithGroupReference
	#[allow(unused_variables, unused_assignments)]
	async fn decrypt_bucket_key(
		&self,
		bucket_key: &BucketKey,
		owner_group: &GeneratedId,
		model: &TypeModel,
	) -> Result<ResolvedBucketKey, SessionKeyResolutionError> {
		let mut auth_status = None;

		let resolved_key = if let (Some(key_group), Some(pub_enc_bucket_key)) =
			(&bucket_key.keyGroup, &bucket_key.pubEncBucketKey)
		{
			let keypair = self
				.key_loader_facade
				.load_key_pair(key_group, bucket_key.recipientKeyVersion)
				.await?;
			match keypair {
				AsymmetricKeyPair::PQKeyPairs(k) => {
					let decrypted_bucket_key = PQMessage::deserialize(pub_enc_bucket_key)?
						.decapsulate(&k)?
						.into();
					ResolvedBucketKey {
						decrypted_bucket_key,
						sender_identity_key: Some(k.ecc_keys.public_key),
					}
				},
				AsymmetricKeyPair::RSAEccKeyPair(RSAEccKeyPair {
					rsa_key_pair: k, ..
				})
				| AsymmetricKeyPair::RSAKeyPair(k) => {
					let bucket_key_bytes =
						Zeroizing::new(k.private_key.decrypt(pub_enc_bucket_key)?);
					let decrypted_bucket_key =
						GenericAesKey::from_bytes(bucket_key_bytes.as_slice())?;
					ResolvedBucketKey {
						decrypted_bucket_key,
						sender_identity_key: None,
					}
				},
			}
		} else if let Some(_group_enc_bucket_key) = &bucket_key.groupEncBucketKey {
			// TODO: to be used with secure external
			let _key_group = bucket_key.keyGroup.as_ref().unwrap_or(owner_group);
			auth_status = Some(EncryptionAuthStatus::AESNoAuthentication);
			todo!("secure external resolveWithGroupReference")
		} else {
			return Err(SessionKeyResolutionError {
				reason: format!(
					"encrypted bucket key not set on instance {}/{}",
					model.app, model.name
				),
			});
		};

		Ok(resolved_key)
	}
}

/// Resolves the id field of an entity into a generated id
fn parse_id_field(
	id_field: Option<&ElementValue>,
) -> Result<&GeneratedId, SessionKeyResolutionError> {
	match id_field {
		Some(ElementValue::IdGeneratedId(id)) => Ok(id),
		Some(ElementValue::IdTupleId(IdTuple { element_id, .. })) => Ok(element_id),
		None => Err(SessionKeyResolutionError {
			reason: "no id present on instance".to_string(),
		}),
		Some(actual) => Err(SessionKeyResolutionError {
			reason: format!(
				"unexpected {} type for id on instance",
				actual.type_variant_name()
			),
		}),
	}
}

/// Denotes if an entity was authenticated successfully.
///
/// Not all decryption methods use authentication.
pub enum EncryptionAuthStatus {
	/// The entity was decrypted with RSA which does not use authentication.
	RSANoAuthentication = 0,

	/// The entity was decrypted with Tutacrypt (PQ) and successfully authenticated.
	TutacryptAuthenticationSucceeded = 1,

	/// The entity was decrypted with Tutacrypt (PQ), but authentication failed.
	TutacryptAuthenticationFailed = 2,

	/// The entity was decrypted symmetrically (i.e. secure external) which does not use authentication.
	AESNoAuthentication = 3,

	/// The entity was sent by the user and doesn't need authenticated.
	TutacryptSender = 4,
}

/// Used for identifying the protocol version used for encrypting a session key.
#[repr(i64)]
pub enum CryptoProtocolVersion {
	/// Legacy asymmetric encryption (RSA-2048)
	Rsa = 0,

	/// Secure external
	SymmetricEncryption = 1,

	/// PQ encryption (Kyber+X25519)
	Tutacrypt = 2,
}

struct ResolvedBucketKey {
	decrypted_bucket_key: GenericAesKey,
	sender_identity_key: Option<EccPublicKey>,
}

struct EntityOwnerKeyData<'a> {
	owner_enc_session_key: Option<&'a Vec<u8>>,
	owner_key_version: Option<i64>,
	owner_group: Option<&'a GeneratedId>,
}

impl<'a> EntityOwnerKeyData<'a> {
	fn extract_owner_key_data(
		entity: &'a ParsedEntity,
	) -> Result<EntityOwnerKeyData<'a>, SessionKeyResolutionError> {
		macro_rules! get_nullable_field {
			($entity:expr, $field:expr, $type:tt) => {
				match $entity.get($field) {
					Some(ElementValue::$type(q)) => Ok(Some(q)),
					None | Some(ElementValue::Null) => Ok(None), // none = not present on type, null = present on type but null
					Some(actual) => Err(SessionKeyResolutionError { reason: format!("field `{}` is not the expected type, got {} instead", $field, actual.type_variant_name()) }),
				}
			};
		}

		let owner_enc_session_key = get_nullable_field!(entity, OWNER_ENC_SESSION_FIELD, Bytes)?;
		let owner_key_version =
			get_nullable_field!(entity, OWNER_KEY_VERSION_FIELD, Number)?.copied();
		let owner_group = get_nullable_field!(entity, OWNER_GROUP_FIELD, IdGeneratedId)?;

		Ok(EntityOwnerKeyData {
			owner_enc_session_key,
			owner_key_version,
			owner_group,
		})
	}
}

#[derive(thiserror::Error, Debug, Clone)]
#[error("Session key resolution failure: {reason}")]
pub struct SessionKeyResolutionError {
	reason: String,
}

/// Used to map various errors to `SessionKeyResolutionError`
trait SessionKeyResolutionErrorSubtype: ToString {}

impl<T: SessionKeyResolutionErrorSubtype> From<T> for SessionKeyResolutionError {
	fn from(value: T) -> Self {
		Self {
			reason: value.to_string(),
		}
	}
}

impl SessionKeyResolutionErrorSubtype for KeyLoadError {}

impl SessionKeyResolutionErrorSubtype for ArrayCastingError {}

impl SessionKeyResolutionErrorSubtype for PQError {}

impl SessionKeyResolutionErrorSubtype for RSAEncryptionError {}

#[must_use]
pub fn create_auth_verifier(user_passphrase_key: Aes256Key) -> String {
	let sha_user_passphrase = crate::crypto::sha::sha256(user_passphrase_key.as_bytes());
	BASE64_URL_SAFE_NO_PAD.encode(sha_user_passphrase)
}

// FIXME: check for returned owner_enc_session_key
#[cfg(test)]
mod test {
	use std::sync::Arc;

	use crate::crypto::aes::{Aes256Key, Iv};
	use crate::crypto::crypto_facade::{CryptoFacade, CryptoProtocolVersion};
	use crate::crypto::ecc::EccKeyPair;
	use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey};
	use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::crypto::rsa::{RSAEccKeyPair, RSAKeyPair};
	use crate::crypto::tuta_crypt::{PQKeyPairs, PQMessage};
	use crate::element_value::ParsedEntity;
	use crate::entities::sys::{BucketKey, InstanceSessionKey};
	use crate::entities::tutanota::Mail;
	use crate::entities::Entity;
	use crate::generated_id::GeneratedId;
	use crate::instance_mapper::InstanceMapper;
	use crate::key_loader_facade::{MockKeyLoaderFacade, VersionedAesKey};
	use crate::metamodel::TypeModel;
	use crate::type_model_provider::init_type_model_provider;
	use crate::util::test_utils::{create_test_entity, typed_entity_to_parsed_entity};
	use crate::IdTuple;

	#[tokio::test]
	async fn test_pq_bucket_key_resolves() {
		let randomizer_facade = make_thread_rng_facade();
		let constants = BucketKeyConstants::new(&randomizer_facade);

		let ephemeral_keys = EccKeyPair::generate(&randomizer_facade);
		let asymmetric_keypair = PQKeyPairs::generate(&randomizer_facade);
		let crypto_facade = make_crypto_facade(
			randomizer_facade.clone(),
			constants.group_key.clone(),
			constants.sender_key_version,
			asymmetric_keypair.clone(),
		);

		let encapsulation_iv = Iv::generate(&randomizer_facade);
		let encapsulation = PQMessage::encapsulate(
			&asymmetric_keypair.ecc_keys,
			&ephemeral_keys,
			&asymmetric_keypair.ecc_keys.public_key,
			&asymmetric_keypair.kyber_keys.public_key,
			&constants.bucket_key,
			encapsulation_iv,
		)
		.unwrap();

		let mut raw_mail = make_raw_mail(
			&constants,
			encapsulation.serialize(),
			CryptoProtocolVersion::Tutacrypt as i64,
		);
		let mail_type_model = get_mail_type_model();

		let key = crypto_facade
			.resolve_session_key(&mut raw_mail, &mail_type_model)
			.await
			.expect("should not have errored")
			.expect("where is the key");

		assert_eq!(
			constants.mail_session_key.as_bytes(),
			key.session_key.as_bytes()
		);
	}

	#[tokio::test]
	async fn test_rsa_bucket_key_resolves() {
		let randomizer_facade = make_thread_rng_facade();

		let constants = BucketKeyConstants::new(&randomizer_facade);
		let asymmetric_keypair = RSAKeyPair::generate(&randomizer_facade);
		let crypto_facade = make_crypto_facade(
			randomizer_facade.clone(),
			constants.group_key.clone(),
			constants.sender_key_version,
			asymmetric_keypair.clone(),
		);
		let pub_enc_bucket_key = asymmetric_keypair
			.public_key
			.encrypt(&randomizer_facade, constants.bucket_key.as_bytes())
			.unwrap();

		let mut raw_mail = make_raw_mail(
			&constants,
			pub_enc_bucket_key,
			CryptoProtocolVersion::Rsa as i64,
		);
		let mail_type_model = get_mail_type_model();
		let key = crypto_facade
			.resolve_session_key(&mut raw_mail, &mail_type_model)
			.await
			.expect("should not have errored")
			.expect("where is the key");

		assert_eq!(
			constants.mail_session_key.as_bytes(),
			key.session_key.as_bytes()
		);
	}

	#[tokio::test]
	async fn test_rsa_ecc_bucket_key_resolves() {
		let randomizer_facade = make_thread_rng_facade();

		let constants = BucketKeyConstants::new(&randomizer_facade);
		let asymmetric_keypair = RSAEccKeyPair::generate(&randomizer_facade);
		let crypto_facade = make_crypto_facade(
			randomizer_facade.clone(),
			constants.group_key.clone(),
			constants.sender_key_version,
			asymmetric_keypair.clone(),
		);
		let pub_enc_bucket_key = asymmetric_keypair
			.rsa_key_pair
			.public_key
			.encrypt(&randomizer_facade, constants.bucket_key.as_bytes())
			.unwrap();

		let mut raw_mail = make_raw_mail(
			&constants,
			pub_enc_bucket_key,
			CryptoProtocolVersion::Rsa as i64,
		);
		let mail_type_model = get_mail_type_model();
		let key = crypto_facade
			.resolve_session_key(&mut raw_mail, &mail_type_model)
			.await
			.expect("should not have errored")
			.expect("where is the key");

		assert_eq!(
			constants.mail_session_key.as_bytes(),
			key.session_key.as_bytes()
		);
	}

	fn get_mail_type_model() -> TypeModel {
		let provider = init_type_model_provider();
		let mail_type_ref = Mail::type_ref();
		provider
			.get_type_model(mail_type_ref.app, mail_type_ref.type_)
			.unwrap()
			.to_owned()
	}

	fn make_raw_mail(
		constants: &BucketKeyConstants,
		pub_enc_bucket_key: Vec<u8>,
		protocol_version: i64,
	) -> ParsedEntity {
		let bucket_key_data = make_bucket_key(
			constants.recipient_key_version,
			pub_enc_bucket_key,
			&constants.instance_id,
			&constants.instance_list,
			&constants.key_group,
			constants.bucket_enc_session_key.clone(),
			protocol_version,
		);

		let mail = Mail {
			_id: IdTuple {
				list_id: constants.instance_list.clone(),
				element_id: constants.instance_id.clone(),
			},
			_ownerGroup: Some(constants.key_group.clone()),
			bucketKey: Some(bucket_key_data),
			..create_test_entity()
		};

		typed_entity_to_parsed_entity(mail)
	}

	struct BucketKeyConstants {
		group_key: GenericAesKey,
		mail_session_key: GenericAesKey,
		instance_id: GeneratedId,
		instance_list: GeneratedId,
		key_group: GeneratedId,
		bucket_key: Aes256Key,
		bucket_key_generic: GenericAesKey,
		bucket_enc_session_key: Vec<u8>,
		sender_key_version: i64,
		recipient_key_version: i64,
	}

	impl BucketKeyConstants {
		fn new(randomizer_facade: &RandomizerFacade) -> Self {
			let group_key = GenericAesKey::from(Aes256Key::generate(randomizer_facade));
			let bucket_key = Aes256Key::generate(randomizer_facade);
			let mail_session_key = GenericAesKey::from(Aes256Key::generate(randomizer_facade));
			let instance_id = GeneratedId::test_random();
			let instance_list = GeneratedId::test_random();
			let key_group = GeneratedId::test_random();
			let bucket_key_generic = GenericAesKey::from(bucket_key.clone());

			let bucket_enc_session_key_iv = Iv::generate(randomizer_facade);
			let bucket_enc_session_key =
				bucket_key_generic.encrypt_key(&mail_session_key, bucket_enc_session_key_iv);
			let sender_key_version = 1;
			let recipient_key_version = sender_key_version;

			Self {
				group_key,
				bucket_key,
				mail_session_key,
				instance_id,
				instance_list,
				key_group,
				bucket_key_generic,
				bucket_enc_session_key,
				sender_key_version,
				recipient_key_version,
			}
		}
	}

	fn make_crypto_facade<T: Into<AsymmetricKeyPair> + Clone + Send + Sync + 'static>(
		randomizer_facade: RandomizerFacade,
		group_key: GenericAesKey,
		sender_key_version: i64,
		asymmetric_keypair: T,
	) -> CryptoFacade {
		let group_key = group_key.clone();

		let mut key_loader = MockKeyLoaderFacade::default();
		key_loader
			.expect_get_current_sym_group_key()
			.returning(move |_| {
				Ok(VersionedAesKey {
					version: sender_key_version,
					object: group_key.clone(),
				})
			})
			.once();
		key_loader
			.expect_load_key_pair()
			.returning(move |_, _| Ok(asymmetric_keypair.clone().into()))
			.once();

		CryptoFacade {
			key_loader_facade: Arc::new(key_loader),
			instance_mapper: Arc::new(InstanceMapper::new()),
			randomizer_facade,
		}
	}

	fn make_bucket_key(
		recipient_key_version: i64,
		pub_enc_bucket_key: Vec<u8>,
		instance_id: &GeneratedId,
		instance_list: &GeneratedId,
		key_group: &GeneratedId,
		bucket_enc_session_key: Vec<u8>,
		protocol_version: i64,
	) -> BucketKey {
		BucketKey {
			groupEncBucketKey: None,
			protocolVersion: protocol_version,
			pubEncBucketKey: Some(pub_enc_bucket_key),
			recipientKeyVersion: recipient_key_version,
			senderKeyVersion: None,
			bucketEncSessionKeys: vec![InstanceSessionKey {
				encryptionAuthStatus: None,
				instanceId: instance_id.clone(),
				instanceList: instance_list.clone(),
				symEncSessionKey: bucket_enc_session_key.clone(),
				symKeyVersion: recipient_key_version,
				..create_test_entity()
			}],
			keyGroup: Some(key_group.clone()),
			..create_test_entity()
		}
	}
}
