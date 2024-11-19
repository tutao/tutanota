//! General purpose functions for testing various objects

use rand::random;

use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
use crate::crypto::Aes256Key;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::entity_facade::ID_FIELD;
use crate::entities::generated::sys::{
	ArchiveRef, ArchiveType, Group, GroupKeysRef, KeyPair, PubEncKeyData, TypeInfo,
};
use crate::entities::Entity;
use crate::instance_mapper::InstanceMapper;
use crate::metamodel::ElementType::Aggregated;
use crate::metamodel::{AssociationType, Cardinality, ElementType, ValueType};
use crate::tutanota_constants::CryptoProtocolVersion;
use crate::tutanota_constants::PublicKeyIdentifierType;
use crate::type_model_provider::{init_type_model_provider, TypeModelProvider};
use crate::CustomId;
use crate::GeneratedId;
use crate::{IdTupleCustom, IdTupleGenerated};

/// Generates a URL-safe random string of length `Size`.
#[must_use]
pub fn generate_random_string<const SIZE: usize>() -> String {
	use base64::engine::Engine;
	use base64::prelude::BASE64_URL_SAFE_NO_PAD;
	let random_bytes: [u8; SIZE] = make_thread_rng_facade().generate_random_array();
	BASE64_URL_SAFE_NO_PAD.encode(random_bytes)
}

pub fn generate_random_group(
	current_keys: Option<KeyPair>,
	former_keys: Option<GroupKeysRef>,
) -> Group {
	Group {
		_format: 0,
		_id: Some(GeneratedId::test_random()),
		_ownerGroup: None,
		_permissions: GeneratedId::test_random(),
		groupInfo: IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random()),
		administratedGroups: None,
		archives: vec![ArchiveType {
			_id: Some(CustomId::test_random()),
			active: ArchiveRef {
				_id: Some(CustomId::test_random()),
				archiveId: GeneratedId::test_random(),
			},
			inactive: vec![],
			r#type: TypeInfo {
				_id: Some(CustomId::test_random()),
				application: "app".to_string(),
				typeId: 1,
			},
		}],
		currentKeys: current_keys,
		customer: None,
		formerGroupKeys: former_keys,
		invitations: GeneratedId::test_random(),
		members: GeneratedId::test_random(),
		groupKeyVersion: 1,
		admin: None,
		r#type: 46,
		adminGroupEncGKey: None,
		adminGroupKeyVersion: None,
		enabled: true,
		external: false,
		pubAdminGroupEncGKey: Some(PubEncKeyData {
			_id: Some(CustomId::test_random()),
			recipientIdentifier: "adminGroupId".to_string(),
			recipientIdentifierType: PublicKeyIdentifierType::GroupId as i64,
			protocolVersion: CryptoProtocolVersion::TutaCrypt as i64,
			pubEncSymKey: vec![1, 2, 3],
			recipientKeyVersion: 0,
			senderKeyVersion: Some(0),
		}),
		storageCounter: None,
		user: None,
	}
}

pub fn random_aes256_key() -> Aes256Key {
	Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap()
}

/// Moves the object T into heap and leaks it.
#[inline(always)]
pub fn leak<T>(what: T) -> &'static T {
	Box::leak(Box::new(what))
}

/// Generate a test entity.
///
/// The values will be set to these defaults:
/// * All ZeroOrOne values will be null
/// * All Any values will be empty
/// * All One values will use default values, or random values if an ID type
///
/// # Examples
///
/// ```ignore
/// use crate::entities::generated::tutanota::Mail;
/// use crate::util::test_utils::create_test_entity;
///
/// let mail = Mail {
///     phishingStatus: 1337, // 😎
///     ..create_test_entity()
/// };
///
/// assert_eq!(1337, mail.phishingStatus);
/// ```
#[must_use]
pub fn create_test_entity<'a, T: Entity + serde::Deserialize<'a>>() -> T {
	let mapper = InstanceMapper::new();
	let entity = create_test_entity_dict::<T>();
	let type_ref = T::type_ref();
	match mapper.parse_entity(entity) {
		Ok(n) => n,
		Err(e) => panic!(
			"Failed to create test entity {app}/{type_}: parse error {e}",
			app = type_ref.app,
			type_ = type_ref.type_
		),
	}
}

/// Generate a test entity as a raw `ParsedEntity` dictionary type.
///
/// The values will be set to these defaults:
/// * All ZeroOrOne values will be null
/// * All Any values will be empty
/// * All One values will use default values, or random values if an ID type
///
/// **NOTE:** The resulting dictionary is unencrypted.
#[must_use]
pub fn create_test_entity_dict<'a, T: Entity + serde::Deserialize<'a>>() -> ParsedEntity {
	let provider = init_type_model_provider();
	let type_ref = T::type_ref();
	let entity = create_test_entity_dict_with_provider(&provider, type_ref.app, type_ref.type_);
	entity
}

/// Generate a test entity as a raw `ParsedEntity` dictionary type.
///
/// The values will be set to these defaults:
/// * All ZeroOrOne values will be null
/// * All Any values will be empty
/// * All Encrypted One values will use bytes
/// * All Unencrypted One values will use default values, or random values if an ID type
///
/// **NOTE:** The resulting dictionary is encrypted.
#[must_use]
#[allow(dead_code)]
pub fn create_encrypted_test_entity_dict<'a, T: Entity + serde::Deserialize<'a>>() -> ParsedEntity {
	let provider = init_type_model_provider();
	let type_ref = T::type_ref();
	let entity =
		create_encrypted_test_entity_dict_with_provider(&provider, type_ref.app, type_ref.type_);
	entity
}

/// Convert a typed entity into a raw `ParsedEntity` dictionary type.
///
/// # Panics
///
/// Panics if the resulting entity is invalid and unable to be serialized.
#[must_use]
pub fn typed_entity_to_parsed_entity<T: Entity + serde::Serialize>(entity: T) -> ParsedEntity {
	let mapper = InstanceMapper::new();
	match mapper.serialize_entity(entity) {
		Ok(n) => n,
		Err(e) => panic!(
			"Failed to serialize {}/{}: {:?}",
			T::type_ref().app,
			T::type_ref().type_,
			e
		),
	}
}

fn create_test_entity_dict_with_provider(
	provider: &TypeModelProvider,
	app: &str,
	type_: &str,
) -> ParsedEntity {
	let Some(model) = provider.get_type_model(app, type_) else {
		panic!("Failed to create test entity {app}/{type_}: not in model")
	};
	let mut object = ParsedEntity::new();

	for (&name, value) in &model.values {
		let element_value = match value.cardinality {
			Cardinality::ZeroOrOne => ElementValue::Null,
			Cardinality::Any => ElementValue::Array(Vec::new()),
			Cardinality::One => match value.value_type {
				ValueType::String | ValueType::CompressedString => {
					ElementValue::String(Default::default())
				},
				ValueType::Number => ElementValue::Number(Default::default()),
				ValueType::Bytes => ElementValue::Bytes(Default::default()),
				ValueType::Date => ElementValue::Date(Default::default()),
				ValueType::Boolean => ElementValue::Bool(Default::default()),
				ValueType::GeneratedId => {
					if name == ID_FIELD
						&& (model.element_type == ElementType::ListElement
							|| model.element_type == ElementType::BlobElement)
					{
						ElementValue::IdTupleGeneratedElementId(IdTupleGenerated::new(
							GeneratedId::test_random(),
							GeneratedId::test_random(),
						))
					} else {
						ElementValue::IdGeneratedId(GeneratedId::test_random())
					}
				},
				ValueType::CustomId => {
					if name == ID_FIELD && (model.element_type == ElementType::ListElement) {
						ElementValue::IdTupleCustomElementId(IdTupleCustom::new(
							GeneratedId::test_random(),
							CustomId::test_random(),
						))
					} else if name == ID_FIELD && model.element_type == Aggregated {
						ElementValue::IdCustomId(CustomId::test_random_aggregate())
					} else {
						ElementValue::IdCustomId(CustomId::test_random())
					}
				},
			},
		};

		object.insert(name.to_owned(), element_value);
	}

	for (&name, value) in &model.associations {
		let association_value = match value.cardinality {
			Cardinality::ZeroOrOne => ElementValue::Null,
			Cardinality::Any => ElementValue::Array(Vec::new()),
			Cardinality::One => match value.association_type {
				AssociationType::ElementAssociation => {
					ElementValue::IdGeneratedId(GeneratedId::test_random())
				},
				AssociationType::ListAssociation => {
					ElementValue::IdGeneratedId(GeneratedId::test_random())
				},
				AssociationType::ListElementAssociationGenerated => {
					ElementValue::IdTupleGeneratedElementId(IdTupleGenerated::new(
						GeneratedId::test_random(),
						GeneratedId::test_random(),
					))
				},
				AssociationType::ListElementAssociationCustom => {
					ElementValue::IdTupleCustomElementId(IdTupleCustom::new(
						GeneratedId::test_random(),
						CustomId::test_random(),
					))
				},
				AssociationType::Aggregation => {
					ElementValue::Dict(create_test_entity_dict_with_provider(
						provider,
						value.dependency.unwrap_or(app),
						value.ref_type,
					))
				},
				AssociationType::BlobElementAssociation => ElementValue::IdTupleGeneratedElementId(
					IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random()),
				),
			},
		};
		object.insert(name.to_owned(), association_value);
	}

	if model.is_encrypted() {
		object.insert(
			"_finalIvs".to_owned(),
			ElementValue::Dict(Default::default()),
		);
	}

	object
}

fn create_encrypted_test_entity_dict_with_provider(
	provider: &TypeModelProvider,
	app: &str,
	type_: &str,
) -> ParsedEntity {
	let Some(model) = provider.get_type_model(app, type_) else {
		panic!("Failed to create test entity {app}/{type_}: not in model")
	};
	let mut object = ParsedEntity::new();

	for (&name, value) in &model.values {
		let element_value = match value.cardinality {
			Cardinality::ZeroOrOne => ElementValue::Null,
			Cardinality::Any => ElementValue::Array(Vec::new()),
			Cardinality::One => {
				if value.encrypted {
					ElementValue::String(Default::default())
				} else {
					match value.value_type {
						ValueType::String | ValueType::CompressedString => {
							ElementValue::String(Default::default())
						},
						ValueType::Number => ElementValue::Number(Default::default()),
						ValueType::Bytes => ElementValue::Bytes(Default::default()),
						ValueType::Date => ElementValue::Date(Default::default()),
						ValueType::Boolean => ElementValue::Bool(Default::default()),
						ValueType::GeneratedId => {
							if name == ID_FIELD
								&& (model.element_type == ElementType::ListElement
									|| model.element_type == ElementType::BlobElement)
							{
								ElementValue::IdTupleGeneratedElementId(IdTupleGenerated::new(
									GeneratedId::test_random(),
									GeneratedId::test_random(),
								))
							} else {
								ElementValue::IdGeneratedId(GeneratedId::test_random())
							}
						},
						ValueType::CustomId => {
							if name == ID_FIELD
								&& (model.element_type == ElementType::ListElement
									|| model.element_type == ElementType::BlobElement)
							{
								ElementValue::IdTupleCustomElementId(IdTupleCustom::new(
									GeneratedId::test_random(),
									CustomId::test_random(),
								))
							} else {
								ElementValue::IdCustomId(CustomId::test_random())
							}
						},
					}
				}
			},
		};

		object.insert(name.to_owned(), element_value);
	}

	for (&name, value) in &model.associations {
		let association_value = match value.cardinality {
			Cardinality::ZeroOrOne => ElementValue::Null,
			Cardinality::Any => ElementValue::Array(Vec::new()),
			Cardinality::One => match value.association_type {
				AssociationType::ElementAssociation => {
					ElementValue::IdGeneratedId(GeneratedId::test_random())
				},
				AssociationType::ListAssociation => {
					ElementValue::IdGeneratedId(GeneratedId::test_random())
				},
				AssociationType::ListElementAssociationGenerated => {
					ElementValue::IdTupleGeneratedElementId(IdTupleGenerated::new(
						GeneratedId::test_random(),
						GeneratedId::test_random(),
					))
				},
				AssociationType::ListElementAssociationCustom => {
					ElementValue::IdTupleCustomElementId(IdTupleCustom::new(
						GeneratedId::test_random(),
						CustomId::test_random(),
					))
				},
				AssociationType::Aggregation => {
					ElementValue::Dict(create_encrypted_test_entity_dict_with_provider(
						provider,
						value.dependency.unwrap_or(app),
						value.ref_type,
					))
				},
				AssociationType::BlobElementAssociation => ElementValue::IdTupleGeneratedElementId(
					IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random()),
				),
			},
		};
		object.insert(name.to_owned(), association_value);
	}

	object
}

#[macro_export]
macro_rules! str_map {
        // map-like
        ($($k:expr => $v:expr),* $(,)?) => {{
            core::convert::From::from([$(($k, $v),)*])
        }};
    }

#[macro_export]
macro_rules! collection {
        // map-like
        ($($k:expr => $v:expr),* $(,)?) => {{
            core::convert::From::from([$(($k.to_string(), $v),)*])
        }};
        // set-like
        ($($v:expr),* $(,)?) => {{
            core::convert::From::from([$($v,)*])
        }};
    }
