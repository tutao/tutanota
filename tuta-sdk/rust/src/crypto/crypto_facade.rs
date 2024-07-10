use std::sync::Arc;
use zeroize::Zeroizing;
use crate::crypto::ecc::EccPublicKey;
use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError};
use crate::crypto::rsa::RSAEncryptionError;
use crate::crypto::tuta_crypt::{PQError, PQMessage};
use crate::generated_id::GeneratedId;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::sys::BucketKey;
use crate::IdTuple;
#[mockall_double::double]
use crate::instance_mapper::InstanceMapper;
#[mockall_double::double]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::key_loader_facade::VersionedAesKey;
use crate::metamodel::TypeModel;
use crate::util::ArrayCastingError;

/// The name of the field that contains the session key encrypted
/// by the owner group's key in an entity
const OWNER_ENC_SESSION_FIELD: &'static str = "_ownerEncSessionKey";
/// The name of the owner-encrypted session key version field in an entity
const OWNER_KEY_VERSION_FIELD: &'static str = "_ownerKeyVersion";
/// The name of the owner group field in an entity
const OWNER_GROUP_FIELD: &'static str = "_ownerGroup";
/// The name of the ID field in an entity
const ID_FIELD: &'static str = "_id";
/// The name of the bucket key field in an entity
const BUCKET_KEY_FIELD: &'static str = "bucketKey";

#[derive(uniffi::Object)]
pub struct CryptoFacade {
    key_loader_facade: Arc<KeyLoaderFacade>,
    instance_mapper: Arc<InstanceMapper>,
}

#[cfg_attr(test, mockall::automock)]
impl CryptoFacade {
    pub fn new(
        key_loader_facade: Arc<KeyLoaderFacade>,
        instance_mapper: Arc<InstanceMapper>
    ) -> Self {
        Self {
            key_loader_facade,
            instance_mapper,
        }
    }

    /// Returns the session key from `entity` and resolves the bucket key fields contained inside
    /// if present
    pub async fn resolve_session_key(&self, entity: &mut ParsedEntity, model: &TypeModel) -> Result<Option<GenericAesKey>, SessionKeyResolutionError> {
        if !model.encrypted {
            return Ok(None);
        }

        // Derive the session key from the bucket key
        if let Some(bucket_key_value) = entity.get(BUCKET_KEY_FIELD) {
            match bucket_key_value {
                ElementValue::Dict(_) =>  {
                    let resolved_key = self.resolve_bucket_key(entity, model).await?;
                    return Ok(Some(resolved_key));
                },
                ElementValue::Null => {},
                _ => return Err(SessionKeyResolutionError { reason: "bucketKey is invalid!".to_string() })
            }
        }

        // Extract the session key data from the owner group of the entity
        let EntityOwnerKeyData {
            owner_enc_session_key: Some(owner_enc_session_key),
            owner_key_version: Some(owner_key_version),
            owner_group: Some(owner_group)
        } = EntityOwnerKeyData::extract_owner_key_data(entity)? else {
            return Err(SessionKeyResolutionError { reason: "instance missing owner key/group data".to_string() });
        };

        let group_key: GenericAesKey = self.key_loader_facade.load_sym_group_key(owner_group, owner_key_version, None).await?;

        Ok(group_key.decrypt_aes_key(owner_enc_session_key).map(|k| Some(k))?)
    }

    /// Resolves the bucket key fields inside `entity` and returns the session key
    async fn resolve_bucket_key(&self, entity: &mut ParsedEntity, model: &TypeModel) -> Result<GenericAesKey, SessionKeyResolutionError> {
        let Some(ElementValue::Dict(bucket_key_map)) = entity.get(BUCKET_KEY_FIELD) else {
            return Err(SessionKeyResolutionError { reason: format!("{BUCKET_KEY_FIELD} is not a dictionary type") });
        };

        let bucket_key: BucketKey = match self.instance_mapper.parse_entity(bucket_key_map.to_owned()) {
            Ok(n) => n,
            Err(e) => return Err(SessionKeyResolutionError { reason: format!("{BUCKET_KEY_FIELD} could not be deserialized: {e}") })
        };

        let owner_key_data = EntityOwnerKeyData::extract_owner_key_data(entity)?;
        let Some(owner_group) = owner_key_data.owner_group else {
            return Err(SessionKeyResolutionError { reason: "entity has no ownerGroup".to_owned() });
        };

        let VersionedAesKey { version, .. } = self.key_loader_facade.get_current_sym_group_key(owner_group).await?;

        let ResolvedBucketKey {
            decrypted_bucket_key,
            sender_identity_key: _sender_identity_key // TODO: Use when implementing authentication
        } = self.decrypt_bucket_key(&bucket_key, owner_group, model).await?;

        let mut session_key_for_this_instance = None;

        for instance_session_key in bucket_key.bucketEncSessionKeys {
            let decrypted_session_key = decrypted_bucket_key.decrypt_aes_key(instance_session_key.symEncSessionKey.as_slice())?;

            let instance_id = parse_id_field(entity.get(ID_FIELD))?;

            if &instance_session_key.instanceId == instance_id {
                session_key_for_this_instance = Some(decrypted_session_key.clone());
            }
        }

        let Some(session_key) = session_key_for_this_instance else {
            return Err(SessionKeyResolutionError { reason: "no session key found in bucket key for this instance".to_string() });
        };

        // TODO: authenticate

        Ok(session_key)
    }

    /// Decrypts a bucket key, using `owner_group` in the case of secure external.
    ///
    /// `model` should be the type model of the instance being decrypted (e.g. `Mail`).
    async fn decrypt_bucket_key(&self, bucket_key: &BucketKey, owner_group: &GeneratedId, model: &TypeModel) -> Result<ResolvedBucketKey, SessionKeyResolutionError> {
        let mut auth_status = None;

        let resolved_key = if let (Some(key_group), Some(pub_enc_bucket_key)) = (&bucket_key.keyGroup, &bucket_key.pubEncBucketKey) {
            let keypair = self.key_loader_facade.load_key_pair(key_group, bucket_key.recipientKeyVersion).await?;
            match keypair {
                AsymmetricKeyPair::PQKeyPairs(k) => {
                    let decrypted_bucket_key = PQMessage::deserialize(pub_enc_bucket_key)?.decapsulate(&k)?.into();
                    ResolvedBucketKey {
                        decrypted_bucket_key,
                        sender_identity_key: Some(k.ecc_keys.public_key),
                    }
                }
                AsymmetricKeyPair::RSAKeyPair(k) => {
                    let bucket_key_bytes = Zeroizing::new(k.private_key.decrypt(pub_enc_bucket_key)?);
                    let decrypted_bucket_key = GenericAesKey::from_bytes(bucket_key_bytes.as_slice())?.into();
                    ResolvedBucketKey {
                        decrypted_bucket_key,
                        sender_identity_key: None,
                    }
                }
                AsymmetricKeyPair::RsaEccKeyPair(_) => { todo!() }
            }
        } else if let Some(_group_enc_bucket_key) = &bucket_key.groupEncBucketKey {
            // TODO: to be used with secure external
            let _key_group = bucket_key.keyGroup.as_ref().unwrap_or_else(|| owner_group);
            auth_status = Some(EncryptionAuthStatus::AESNoAuthentication);
            todo!("secure external resolveWithGroupReference")
        } else {
            return Err(SessionKeyResolutionError { reason: format!("encrypted bucket key not set on instance {}/{}", model.app, model.name) });
        };

        Ok(resolved_key)
    }
}

/// Resolves the id field of an entity into a generated id
fn parse_id_field(id_field: Option<&ElementValue>) -> Result<&GeneratedId, SessionKeyResolutionError> {
    match id_field {
        Some(ElementValue::IdGeneratedId(id)) => Ok(id),
        Some(ElementValue::IdTupleId(IdTuple { element_id, .. })) => Ok(element_id),
        None => Err(SessionKeyResolutionError {
            reason: "no id present on instance".to_string()
        }),
        Some(actual) => Err(SessionKeyResolutionError {
            reason: format!("unexpected {} type for id on instance", actual.get_type_variant_name())
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
    fn extract_owner_key_data(entity: &'a ParsedEntity) -> Result<EntityOwnerKeyData<'a>, SessionKeyResolutionError> {
        macro_rules! get_nullable_field {
            ($entity:expr, $field:expr, $type:tt) => {
                match $entity.get($field) {
                    Some(ElementValue::$type(q)) => Ok(Some(q)),
                    None | Some(ElementValue::Null) => Ok(None), // none = not present on type, null = present on type but null
                    Some(actual) => Err(SessionKeyResolutionError { reason: format!("field `{}` is not the expected type, got {} instead", $field, actual.get_type_variant_name()) })
                }
            };
        }

        let owner_enc_session_key = get_nullable_field!(entity, OWNER_ENC_SESSION_FIELD, Bytes)?;
        let owner_key_version = get_nullable_field!(entity, OWNER_KEY_VERSION_FIELD, Number)?.map(|v| *v);
        let owner_group = get_nullable_field!(entity, OWNER_GROUP_FIELD, IdGeneratedId)?;

        Ok(EntityOwnerKeyData {
            owner_enc_session_key,
            owner_key_version,
            owner_group,
        })
    }
}

#[derive(thiserror::Error, Debug)]
#[error("Session key resolution failure: {reason}")]
pub struct SessionKeyResolutionError {
    reason: String,
}

/// Used to map various errors to `SessionKeyResolutionError`
trait SessionKeyResolutionErrorSubtype: ToString {}

impl<T: SessionKeyResolutionErrorSubtype> From<T> for SessionKeyResolutionError {
    fn from(value: T) -> Self {
        Self { reason: value.to_string() }
    }
}

impl SessionKeyResolutionErrorSubtype for KeyLoadError {}

impl SessionKeyResolutionErrorSubtype for ArrayCastingError {}

impl SessionKeyResolutionErrorSubtype for PQError {}

impl SessionKeyResolutionErrorSubtype for RSAEncryptionError {}

// #[cfg(test)]
// mod test {
//     use std::sync::{Arc, Mutex};
//     use crate::crypto::aes::{Aes256Key, Iv};
//     use crate::crypto::crypto_facade::CryptoFacade;
//     use crate::crypto::ecc::EccKeyPair;
//     use crate::crypto::key::GenericAesKey;
//     use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
//     use crate::crypto::tuta_crypt::{PQKeyPairs, PQMessage};
//     use crate::entities::Entity;
//     use crate::entities::sys::{BucketKey, InstanceSessionKey, TypeInfo};
//     use crate::entities::tutanota::{Mail, MailAddress};
//     use crate::generated_id::GeneratedId;
//     use crate::custom_id::CustomId;
//     use crate::IdTuple;
//     use crate::instance_mapper::InstanceMapper;
//     use crate::key_loader_facade::MockKeyLoaderFacade;
//     use crate::owner_enc_session_keys_update_queue::MockOwnerEncSessionKeysUpdateQueue;
//     use crate::type_model_provider::init_type_model_provider;
//
//     #[test]
//     fn test_bucket_key_resolves() {
//         let randomizer_facade = Arc::new(make_thread_rng_facade());
//
//         let group_key = GenericAesKey::from(Aes256Key::generate(randomizer_facade.as_ref()));
//         let asymmetric_keypair = PQKeyPairs::generate(randomizer_facade.as_ref());
//         let ephemeral_keys = EccKeyPair::generate(randomizer_facade.as_ref());
//         let encapsulation_iv = Iv::generate(randomizer_facade.as_ref());
//         let bucket_enc_session_key_iv = Iv::generate(randomizer_facade.as_ref());
//         let bucket_key = Aes256Key::generate(randomizer_facade.as_ref());
//         let mail_session_key = GenericAesKey::from(Aes256Key::generate(randomizer_facade.as_ref()));
//
//         let sender_key_version = 1;
//         let recipient_key_version = sender_key_version;
//
//         let key_loader = {
//             let group_key = group_key.clone();
//             let asymmetric_keypair_versioned = asymmetric_keypair.clone();
//
//             let mut key_loader = MockKeyLoaderFacade::new(Arc::new(()), Arc::new(()));
//             key_loader.expect_get_current_group_key()
//                 .returning(move |_| Ok(VersionedAesKey { version: sender_key_version, key: group_key.clone().into() }))
//                 .once();
//             key_loader.expect_get_asymmetric_key_pair()
//                 .returning(move |_, _| Ok(asymmetric_keypair_versioned.clone().into()))
//                 .once();
//             key_loader
//         };
//
//         let encapsulation = PQMessage::encapsulate(
//             &asymmetric_keypair.ecc_keys,
//             &ephemeral_keys,
//             &asymmetric_keypair.ecc_keys.public_key,
//             &asymmetric_keypair.kyber_keys.public_key,
//             &bucket_key,
//             encapsulation_iv,
//         ).unwrap();
//
//         let instance_mapper = Arc::new(InstanceMapper::new());
//
//         let crypto_facade = CryptoFacade {
//             key_loader_facade: Arc::new(key_loader),
//             instance_mapper: instance_mapper.clone(),
//         };
//
//         let bucket_key_generic = GenericAesKey::from(bucket_key.clone());
//         let bucket_enc_session_key = bucket_key_generic.encrypt_key(&mail_session_key, bucket_enc_session_key_iv);
//
//         let instance_id = GeneratedId::test_random();
//         let instance_list = GeneratedId::test_random();
//         let key_group = GeneratedId::test_random();
//
//         let bucket_key_data = BucketKey {
//             _id: CustomId::test_random(),
//             groupEncBucketKey: None,
//             protocolVersion: 2,
//             pubEncBucketKey: Some(encapsulation.serialize()),
//             recipientKeyVersion: recipient_key_version,
//             senderKeyVersion: None,
//             bucketEncSessionKeys: vec![
//                 InstanceSessionKey {
//                     _id: CustomId::test_random(),
//                     encryptionAuthStatus: None,
//                     instanceId: instance_id.clone(),
//                     instanceList: instance_list.clone(),
//                     symEncSessionKey: bucket_enc_session_key.clone(),
//                     symKeyVersion: recipient_key_version,
//                     typeInfo: TypeInfo {
//                         _id: CustomId::test_random(),
//                         application: String::new(),
//                         typeId: 0,
//                     },
//                 }
//             ],
//             keyGroup: Some(key_group.clone()),
//         };
//
//         let mail = Mail {
//             _format: 0,
//             _id: IdTuple { list_id: instance_list, element_id: instance_id },
//             _ownerEncSessionKey: None,
//             _ownerGroup: Some(key_group.clone()),
//             _ownerKeyVersion: None,
//             _permissions: GeneratedId::test_random(),
//             authStatus: None,
//             confidential: false,
//             differentEnvelopeSender: None,
//             encryptionAuthStatus: None,
//             listUnsubscribe: false,
//             method: 0,
//             movedTime: None,
//             phishingStatus: 0,
//             receivedDate: Default::default(),
//             recipientCount: 0,
//             replyType: 0,
//             sentDate: None,
//             state: 0,
//             subject: "".to_string(),
//             unread: false,
//             attachments: vec![],
//             bccRecipients: vec![],
//             body: None,
//             bucketKey: Some(bucket_key_data),
//             ccRecipients: vec![],
//             conversationEntry: IdTuple { list_id: GeneratedId::test_random(), element_id: GeneratedId::test_random() },
//             firstRecipient: None,
//             headers: None,
//             mailDetails: None,
//             mailDetailsDraft: None,
//             replyTos: vec![],
//             sender: MailAddress {
//                 _id: CustomId::test_random(),
//                 address: "".to_string(),
//                 name: "".to_string(),
//                 contact: None,
//             },
//             toRecipients: vec![],
//         };
//
//         let mut raw_mail = instance_mapper.serialize_entity(mail).unwrap();
//
//         let provider = init_type_model_provider();
//         let mail_type_ref = Mail::type_ref();
//         let mail_type_model = provider.get_type_model(&mail_type_ref.app, &mail_type_ref.type_).unwrap();
//
//         let key = crypto_facade.resolve_session_key(&mut raw_mail, &mail_type_model)
//             .expect("should not have errored")
//             .expect("where is the key");
//
//         assert_eq!(mail_session_key.as_bytes(), key.as_bytes());
//     }
// }
