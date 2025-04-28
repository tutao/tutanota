//! General purpose functions for testing various objects

use crate::bindings::rest_client::RestResponse;
use mockall::Any;
use rand::random;
use std::borrow::Cow;
use std::sync::{Arc, RwLock};
use std::vec;

use crate::bindings::file_client::MockFileClient;
use crate::bindings::rest_client::MockRestClient;
use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;
use crate::crypto::Aes256Key;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::entity_facade::ID_FIELD;
use crate::entities::generated::sys::{
	ArchiveRef, ArchiveType, Group, GroupKeysRef, KeyPair, PubEncKeyData, TypeInfo,
};
use crate::instance_mapper::InstanceMapper;
use crate::metamodel::AttributeId;
use crate::metamodel::ElementType::Aggregated;
use crate::metamodel::TypeId;
use crate::metamodel::{
	AppName, ApplicationModel, AssociationType, Cardinality, ElementType, ModelValue, ValueType,
};
use crate::tutanota_constants::CryptoProtocolVersion;
use crate::tutanota_constants::PublicKeyIdentifierType;
use crate::CustomId;
use crate::GeneratedId;
use crate::{IdTupleCustom, IdTupleGenerated};
use serde::de::DeserializeOwned;

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
	let group_id = GeneratedId::test_random();
	Group {
		_format: 0,
		_id: Some(group_id.clone()),
		_ownerGroup: None,
		_permissions: GeneratedId::test_random(),
		groupInfo: IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random()),
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
			senderIdentifier: Some(group_id.clone().to_string()),
			senderIdentifierType: Some(PublicKeyIdentifierType::GroupId as i64),
			symKeyMac: None,
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
pub fn create_test_entity<'a, T: Entity + DeserializeOwned>() -> T {
	let mapper = InstanceMapper::new(Arc::new(mock_type_model_provider()));
	let entity = create_test_entity_dict::<T>();
	let type_ref = T::type_ref();
	match mapper.parse_entity(entity) {
		Ok(n) => n,
		Err(e) => panic!(
			"Failed to create test entity {app}/{type_}: parse error {e}",
			app = type_ref.app,
			type_ = type_ref.type_name()
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
pub fn create_test_entity_dict<'a, T: Entity + DeserializeOwned>() -> ParsedEntity {
	let provider = Arc::new(mock_type_model_provider());
	let type_ref = T::type_ref();
	let entity = create_test_entity_dict_with_provider(&provider, type_ref.app, type_ref.type_id);
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
	let provider = Arc::new(mock_type_model_provider());
	let type_ref = T::type_ref();
	let entity =
		create_encrypted_test_entity_dict_with_provider(&provider, type_ref.app, type_ref.type_id);
	entity
}

/// Convert a typed entity into a raw `ParsedEntity` dictionary type.
///
/// # Panics
///
/// Panics if the resulting entity is invalid and unable to be serialized.
#[must_use]
pub fn typed_entity_to_parsed_entity<T: Entity + serde::Serialize>(entity: T) -> ParsedEntity {
	let mapper = InstanceMapper::new(Arc::new(mock_type_model_provider()));
	match mapper.serialize_entity(entity) {
		Ok(n) => n,
		Err(e) => panic!(
			"Failed to serialize {}/{:?}: {:?}",
			T::type_ref().app,
			T::type_ref().type_id,
			e
		),
	}
}

fn create_test_entity_dict_with_provider(
	provider: &TypeModelProvider,
	app: AppName,
	type_id: TypeId,
) -> ParsedEntity {
	let Some(model) = provider.resolve_client_type_ref(&TypeRef::new(app, type_id)) else {
		panic!("Failed to create test entity {app}/{type_id:?}: not in model")
	};
	let mut object = ParsedEntity::new();

	for (&value_id, value) in &model.values {
		let value_name = &value.name;
		let value_id_string = value_id.into();
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
					if value_name == ID_FIELD
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
					if value_name == ID_FIELD && (model.element_type == ElementType::ListElement) {
						ElementValue::IdTupleCustomElementId(IdTupleCustom::new(
							GeneratedId::test_random(),
							CustomId::test_random(),
						))
					} else if value_name == ID_FIELD && model.element_type == Aggregated {
						ElementValue::IdCustomId(CustomId::test_random_aggregate())
					} else {
						ElementValue::IdCustomId(CustomId::test_random())
					}
				},
			},
		};

		object.insert(value_id_string, element_value);
	}

	for (&association_id, association) in &model.associations {
		let association_id_string: String = association_id.into();
		let association_value = match association.cardinality {
			Cardinality::ZeroOrOne => ElementValue::Array(vec![]),
			Cardinality::Any => ElementValue::Array(Vec::new()),
			Cardinality::One => {
				let element_value = match association.association_type {
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
							association.dependency.unwrap_or(app),
							association.ref_type_id,
						))
					},
					AssociationType::BlobElementAssociation => {
						ElementValue::IdTupleGeneratedElementId(IdTupleGenerated::new(
							GeneratedId::test_random(),
							GeneratedId::test_random(),
						))
					},
				};
				ElementValue::Array(vec![element_value])
			},
		};
		object.insert(association_id_string, association_value);
	}

	if model.is_encrypted() {
		let empty_dict = ElementValue::Dict(Default::default());
		object.insert("_finalIvs".to_string(), empty_dict.clone());
		object.insert("_errors".to_owned(), empty_dict.clone());
	}

	object
}

fn create_encrypted_test_entity_dict_with_provider(
	provider: &TypeModelProvider,
	app: AppName,
	type_id: TypeId,
) -> ParsedEntity {
	let type_ref = TypeRef::new(app, type_id);
	let Some(model) = provider.resolve_client_type_ref(&type_ref) else {
		panic!("Failed to create test entity {app}/{type_id:?}: not in model")
	};
	let mut object = ParsedEntity::new();

	for (&value_id, value) in &model.values {
		let value_name = &value.name;
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
							if value_name == ID_FIELD
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
							if value_name == ID_FIELD
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

		object.insert(String::from(value_id), element_value);
	}

	for (&association_id, association) in &model.associations {
		let association_value = match association.cardinality {
			Cardinality::ZeroOrOne => ElementValue::Null,
			Cardinality::Any => ElementValue::Array(Vec::new()),
			Cardinality::One => match association.association_type {
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
						association.dependency.unwrap_or(app),
						association.ref_type_id,
					))
				},
				AssociationType::BlobElementAssociation => ElementValue::IdTupleGeneratedElementId(
					IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random()),
				),
			},
		};
		object.insert(String::from(association_id), association_value);
	}

	object
}

#[macro_export]
macro_rules! str_map {
        // map-like
        ($($k:expr => $v:expr),* $(,)?) => {{
            core::convert::From::from([$((core::convert::From::from($k), $v),)*])
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

use crate::date::DateTime;
use crate::entities::{Entity, FinalIv};
use crate::metamodel::TypeModel;
use crate::type_model_provider::TypeModelProvider;
use crate::TypeRef;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

pub const APP_NAME: &str = "test";
pub const APP_VERSION_NUMBER: u64 = 75;
pub const APP_VERSION_STR: &str = "75";

pub const HELLO_OUTPUT_ENCRYPTED: &str = r#"{
		"name": "HelloEncOutput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 458,
		"rootId": "CHR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": true,
		"values": {
			"459": {
				"final": false,
				"name": "answer",
				"id": 459,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			},
			"460": {
				"final": false,
				"name": "timestamp",
				"id": 460,
				"since": 7,
				"type": "Date",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {},
		"app": "test",
		"version": 75
	}"#;
impl Entity for HelloEncOutput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Test,
			type_id: TypeId::from(458),
		}
	}
}
pub const HELLO_INPUT_ENCRYPTED: &str = r#"{
		"name": "HelloEncInput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 358,
		"rootId": "RDR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": true,
		"values": {
			"359": {
				"final": false,
				"name": "message",
				"id": 359,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": true
			}
		},
		"associations": {},
		"app": "test",
		"version": 75
	}"#;
impl Entity for HelloEncInput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Test,
			type_id: TypeId::from(358),
		}
	}
}

pub const HELLO_OUTPUT_UNENCRYPTED: &str = r#"{
		"name": "HelloUnEncOutput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 248,
		"rootId": "CHR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": false,
		"values": {
			"159": {
				"final": false,
				"name": "answer",
				"id": 159,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			},
			"160": {
				"final": false,
				"name": "timestamp",
				"id": 160,
				"since": 7,
				"type": "Date",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "test",
		"version": 75
	}"#;

impl Entity for HelloUnEncOutput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Test,
			type_id: TypeId::from(248),
		}
	}
}
pub const HELLO_INPUT_UNENCRYPTED: &str = r#"{
		"name": "HelloUnEncInput",
		"since": 7,
		"type": "DATA_TRANSFER_TYPE",
		"id": 148,
		"rootId": "RDR1dGFub3RhAAHK",
		"versioned": false,
		"encrypted": false,
		"values": {
			"149": {
				"final": false,
				"name": "message",
				"id": 149,
				"since": 7,
				"type": "String",
				"cardinality": "One",
				"encrypted": false
			}
		},
		"associations": {},
		"app": "test",
		"version": 75
	}"#;

impl Entity for HelloUnEncInput {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Test,
			type_id: TypeId::from(148),
		}
	}
}
pub struct HelloEncryptedService;
pub struct HelloUnEncryptedService;

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloEncInput {
	#[serde(rename = "359")]
	pub message: String,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
#[allow(non_snake_case)]
pub struct HelloEncOutput {
	#[serde(rename = "459")]
	pub answer: String,
	#[serde(rename = "460")]
	pub timestamp: DateTime,
	pub _finalIvs: HashMap<String, FinalIv>,
}

#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloUnEncInput {
	#[serde(rename = "149")]
	pub message: String,
	pub _errors: crate::entities::Errors,
}
#[derive(Serialize, Deserialize, Clone, Debug, PartialEq)]
pub struct HelloUnEncOutput {
	#[serde(rename = "159")]
	pub answer: String,
	#[serde(rename = "160")]
	pub timestamp: DateTime,
}

const SERVER_TYPES_JSON_HASH: &str = "default-server-type-model-hash";
pub fn mock_type_model_provider() -> TypeModelProvider {
	let mut type_model_provider = TypeModelProvider::new_test(
		Arc::new(MockRestClient::new()),
		Arc::new(MockFileClient::new()),
		"localhost:9000".to_string(),
	);
	let list_entity_generated_type_model: TypeModel = TypeModel {
		id: TypeId::from(10),
		since: 1,
		app: AppName::EntityClientTestApp,
		version: 1,
		name: "TestListGeneratedElementIdEntity".to_string(),
		element_type: ElementType::ListElement,
		versioned: false,
		encrypted: true,
		values: str_map! {
			101 => ModelValue {
					id: AttributeId::from(101),
					name: "_id".to_string(),
					value_type: ValueType::GeneratedId,
					cardinality: Cardinality::One,
					is_final: true,
					encrypted: false,
				},
			102 =>
				ModelValue {
					id: AttributeId::from(102),
					name: "field".to_string(),
					value_type: ValueType::String,
					cardinality: Cardinality::One,
					is_final: false,
					encrypted: true,
				},
		},
		associations: HashMap::default(),
	};

	let list_entity_custom_type_model: TypeModel = TypeModel {
		id: TypeId::from(20),
		since: 1,
		app: AppName::EntityClientTestApp,
		version: 1,
		name: "TestListCustomElementIdEntity".to_string(),
		element_type: ElementType::ListElement,
		versioned: false,
		encrypted: true,
		values: str_map! {
			201 => ModelValue {
					id: AttributeId::from(201),
					name: "_id".to_string(),
					value_type: ValueType::CustomId,
					cardinality: Cardinality::One,
					is_final: true,
					encrypted: false,
				},
			202 =>
				ModelValue {
					id: AttributeId::from(202),
					name: "field".to_string(),
					value_type: ValueType::String,
					cardinality: Cardinality::One,
					is_final: false,
					encrypted: true,
				},
		},
		associations: HashMap::default(),
	};

	let enc_input_type_model = serde_json::from_str::<TypeModel>(HELLO_INPUT_ENCRYPTED).unwrap();
	let enc_output_type_model = serde_json::from_str::<TypeModel>(HELLO_OUTPUT_ENCRYPTED).unwrap();
	let unenc_input_type_model =
		serde_json::from_str::<TypeModel>(HELLO_INPUT_UNENCRYPTED).unwrap();
	let unenc_output_type_model =
		serde_json::from_str::<TypeModel>(HELLO_OUTPUT_UNENCRYPTED).unwrap();

	let test_types_hello = [
		(
			HelloEncInput::type_ref().type_id,
			Arc::new(enc_input_type_model),
		),
		(
			HelloEncOutput::type_ref().type_id,
			Arc::new(enc_output_type_model),
		),
		(
			HelloUnEncInput::type_ref().type_id,
			Arc::new(unenc_input_type_model),
		),
		(
			HelloUnEncOutput::type_ref().type_id,
			Arc::new(unenc_output_type_model),
		),
	]
	.into_iter()
	.collect::<HashMap<_, _>>();

	let test_types_hello = ApplicationModel {
		name: AppName::Test,
		version: "0".to_string(),
		types: test_types_hello,
	};

	let test_types_entity_client = [
		(
			list_entity_generated_type_model.id,
			Arc::new(list_entity_generated_type_model),
		),
		(
			list_entity_custom_type_model.id,
			Arc::new(list_entity_custom_type_model),
		),
	]
	.into_iter()
	.collect::<HashMap<_, _>>();

	let test_types_entity_client = ApplicationModel {
		name: AppName::EntityClientTestApp,
		version: "0".to_string(),
		types: test_types_entity_client,
	};

	let mut default_models = type_model_provider.client_app_models.into_owned();
	default_models.apps.insert(
		AppName::EntityClientTestApp,
		test_types_entity_client.clone(),
	);
	default_models
		.apps
		.insert(AppName::Test, test_types_hello.clone());
	type_model_provider.client_app_models = Cow::Owned(default_models.clone());
	type_model_provider.server_app_models = RwLock::new(Some((
		SERVER_TYPES_JSON_HASH.to_string(),
		Cow::Owned(default_models.clone()),
	)));

	type_model_provider
}

pub fn server_types_hash_header() -> HashMap<String, String> {
	let mut hash_map = HashMap::new();
	hash_map.insert(
		"app-types-hash".to_string(),
		SERVER_TYPES_JSON_HASH.to_string(),
	);
	hash_map
}

pub fn application_types_response_with_client_model() -> RestResponse {
	let application_get_out = crate::type_model_provider::ApplicationTypesGetOut {
		application_types_json: serde_json::to_string(
			&crate::type_model_provider::CLIENT_TYPE_MODEL.apps,
		)
		.unwrap(),
		application_types_hash: "latest-applications-hash".to_string(),
	};
	let serialized_json = serde_json::to_string(&application_get_out).unwrap();
	let compressed_response = lz4_flex::compress(serialized_json.as_bytes());
	RestResponse {
		status: 200,
		headers: HashMap::default(),
		body: Some(compressed_response),
	}
}
