use std::collections::HashMap;
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use thiserror::Error;

use crate::date::DateTime;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::entity_facade::ID_FIELD;
use crate::json_element::{JsonElement, RawEntity};
use crate::json_serializer::InstanceMapperError::InvalidValue;
use crate::metamodel::{
	AssociationType, Cardinality, ElementType, ModelValue, TypeModel, ValueType,
};
use crate::type_model_provider::TypeModelProvider;
use crate::CustomId;
use crate::GeneratedId;
use crate::{IdTupleCustom, IdTupleGenerated, TypeRef};

impl From<&TypeModel> for TypeRef {
	fn from(value: &TypeModel) -> Self {
		TypeRef {
			app: value.app,
			type_id: value.id,
		}
	}
}

/// Provides serialization and deserialization conversion between JSON representations and logical
/// types for entities.
/// It validates the schema along the way (to some degree).
pub struct JsonSerializer {
	type_model_provider: Arc<TypeModelProvider>,
}

#[derive(Error, Debug)]
pub enum InstanceMapperError {
	#[error("InstanceMapperError: Type not found: {type_ref}")]
	TypeNotFound { type_ref: TypeRef },
	#[error("InstanceMapperError: Invalid value: {type_ref} {field}")]
	InvalidValue { type_ref: TypeRef, field: String },
}

impl JsonSerializer {
	pub fn new(type_model_provider: Arc<TypeModelProvider>) -> JsonSerializer {
		JsonSerializer {
			type_model_provider,
		}
	}

	/// Creates an entity from JSON data
	pub fn parse(
		&self,
		type_ref: &TypeRef,
		mut raw_entity: RawEntity,
	) -> Result<ParsedEntity, InstanceMapperError> {
		let type_model = self.get_type_model(type_ref)?;
		let mut mapped: ParsedEntity = HashMap::new();
		for (&value_id, value_type) in &type_model.values {
			let value_id_string = &value_id.to_string();
			let value_name = &value_type.name;
			let (_value_id_string, value) =
				raw_entity
					.remove_entry(value_id_string)
					.ok_or_else(|| InvalidValue {
						type_ref: type_ref.clone(),
						field: value_name.clone(),
					})?;

			let mapped_value = match (&value_type.cardinality, value) {
				(Cardinality::ZeroOrOne, JsonElement::Null) => ElementValue::Null,
				(Cardinality::One, JsonElement::String(v)) if v.is_empty() => {
					// Empty string signifies default value for a field. This is primarily the
					// case for encrypted fields. This includes manually encrypted fields in some
					// cases.
					// When the value is encrypted we need to pass on the information about the
					// default value, so we keep it as an empty string (see entity_facade.rs).
					// Otherwise, we resolve the field to its default value.
					value_type.value_type.get_default()
				},
				(Cardinality::One | Cardinality::ZeroOrOne, JsonElement::String(s))
					if value_type.encrypted =>
				{
					ElementValue::Bytes(BASE64_STANDARD.decode(&s).map_err(|_| InvalidValue {
						type_ref: type_ref.clone(),
						field: value_name.clone(),
					})?)
				},
				(_, value) if !value_type.encrypted => {
					self.parse_value(type_model, value_name, value_type, value.clone())?
				},
				_ => {
					return Err(InvalidValue {
						type_ref: type_ref.clone(),
						field: value_name.clone(),
					})
				},
			};
			mapped.insert(value_id.to_string().clone(), mapped_value);
		}

		for (&association_id, association_type) in &type_model.associations {
			let association_id_string = &association_id.to_string();
			let association_name = &association_type.name;
			let (association_id_string, value) = raw_entity
				.remove_entry(association_id_string)
				.ok_or_else(|| InvalidValue {
					type_ref: type_ref.clone(),
					field: association_name.to_owned(),
				})?;

			let association_type_ref = TypeRef {
				app: association_type.dependency.unwrap_or(type_ref.app),
				type_id: association_type.ref_type_id,
			};
			match (
                &association_type.association_type,
                &association_type.cardinality,
                value,
            ) {
                (
					AssociationType::Aggregation,
					_,
					JsonElement::Array(elements)
				) => {
                    let parsed_aggregates = self.parse_aggregated_array(
                        association_name,
                        &association_type_ref,
                        elements,
                    )?;
                    mapped.insert(
                        association_id_string.clone(),
                        ElementValue::Array(parsed_aggregates),
                    );
                }
                (
                    AssociationType::ListElementAssociationGenerated
					| AssociationType::BlobElementAssociation,
                    _,
                    JsonElement::Array(vec),
                ) => {
                    let ids = self.parse_id_tuple_list_generated(type_ref, association_name, vec)?;
                    mapped.insert(association_id_string.clone(), ElementValue::Array(ids));
                }
                (
					AssociationType::ListElementAssociationCustom,
					_,
					JsonElement::Array(vec)
				) => {
                    let ids = self.parse_id_tuple_list_custom(type_ref, association_name, vec)?;
                    mapped.insert(association_id_string.clone(), ElementValue::Array(ids));
                }
                (
					AssociationType::ListAssociation | AssociationType::ElementAssociation,
                    _,
                    JsonElement::Array(vec),
                ) => {
                    let element_values = vec
                        .into_iter()
                        .map(|j| {
                            if let JsonElement::String(id) = j {
                                // Note: it's not always generated id, but it's fine probably
                                ElementValue::IdGeneratedId(GeneratedId(id))
                            } else {
                                panic!("id not a string? wow")
                            }
                        })
                        .collect::<Vec<ElementValue>>();
                    mapped.insert(association_id_string.clone(), ElementValue::Array(element_values), );
                }
                (_, _, value) => panic!("Unknown Association/cardinality/valueType combination: association id = {} cardinality = {:?} valueType = {:?} value {:?}", association_id, association_type.cardinality, association_type.association_type, value),
            }
		}

		Ok(mapped)
	}

	/// Parses an aggregated array from a value of a JSON object containing an entity/instance
	fn parse_aggregated_array(
		&self,
		association_name: &str,
		association_type_ref: &TypeRef,
		elements: Vec<JsonElement>,
	) -> Result<Vec<ElementValue>, InstanceMapperError> {
		let mut parsed_aggregates = Vec::new();
		for element in elements {
			match element {
				JsonElement::Dict(dict) => {
					let parsed = self.parse(association_type_ref, dict)?;
					parsed_aggregates.push(ElementValue::Dict(parsed));
				},
				_ => {
					return Err(InvalidValue {
						type_ref: association_type_ref.clone(),
						field: association_name.to_owned(),
					});
				},
			};
		}
		Ok(parsed_aggregates)
	}

	fn parse_id_tuple_list_generated(
		&self,
		outer_type_ref: &TypeRef,
		association_name: &str,
		elements: Vec<JsonElement>,
	) -> Result<Vec<ElementValue>, InstanceMapperError> {
		elements
			.into_iter()
			.map(|json_element| {
				let JsonElement::Array(id_vec) = json_element else {
					return Err(InvalidValue {
						field: association_name.to_owned(),
						type_ref: outer_type_ref.clone(),
					});
				};
				let id_tuple =
					Self::parse_id_tuple_generated(id_vec).ok_or_else(|| InvalidValue {
						field: association_name.to_owned(),
						type_ref: outer_type_ref.clone(),
					})?;
				Ok(ElementValue::IdTupleGeneratedElementId(id_tuple))
			})
			.collect()
	}

	fn parse_id_tuple_list_custom(
		&self,
		outer_type_ref: &TypeRef,
		association_name: &str,
		elements: Vec<JsonElement>,
	) -> Result<Vec<ElementValue>, InstanceMapperError> {
		elements
			.into_iter()
			.map(|json_element| {
				let JsonElement::Array(id_vec) = json_element else {
					return Err(InvalidValue {
						field: association_name.to_owned(),
						type_ref: outer_type_ref.clone(),
					});
				};
				let id_tuple = Self::parse_id_tuple_custom(id_vec).ok_or_else(|| InvalidValue {
					field: association_name.to_owned(),
					type_ref: outer_type_ref.clone(),
				})?;
				Ok(ElementValue::IdTupleCustomElementId(id_tuple))
			})
			.collect()
	}

	/// Transforms an entity/instance into JSON data
	pub fn serialize(
		&self,
		type_ref: &TypeRef,
		mut entity: ParsedEntity,
	) -> Result<RawEntity, InstanceMapperError> {
		let type_model = self.get_type_model(type_ref)?;
		let mut mapped: RawEntity = HashMap::new();
		for (&value_id, value_type) in &type_model.values {
			let value_id_string = value_id.to_string();
			let value_name = &value_type.name;
			// we take out of the map to reuse the values
			let (value_id_string, value) =
				entity
					.remove_entry(&value_id_string)
					.ok_or_else(|| InvalidValue {
						type_ref: type_ref.clone(),
						field: value_name.to_owned(),
					})?;

			let serialized_value =
				self.serialize_value(type_model, value_name, value_type, value)?;
			mapped.insert(value_id_string, serialized_value);
		}

		for (&association_id, association_type) in &type_model.associations {
			let association_name = &association_type.name;
			let association_id_string = association_id.to_string();
			let (association_id_string, association) = entity
				.remove_entry(&association_id_string)
				.ok_or_else(|| InvalidValue {
					type_ref: type_ref.clone(),
					field: association_name.to_owned(),
				})?;

			let serialized_association = match association {
				// all associations are wrapped in ElementValue:Array,
				// ignoring actual cardinalities up to the instance layer
				// i.e. for ParsedEntity and RawEntity associations are always arrays
				ElementValue::Array(elements) => {
					let association_type_ref = TypeRef {
						// aggregates can be imported across app (e.g. SystemModel, etc.)
						app: association_type.dependency.unwrap_or(type_ref.app),
						type_id: association_type.ref_type_id,
					};
					let serialized_associations = self.make_serialized_array(
						association_name,
						&association_type_ref,
						elements,
					)?;
					JsonElement::Array(serialized_associations)
				},
				_ => {
					debug_assert!(false, "associations are not wrapped in an array");
					continue;
				},
			};

			mapped.insert(association_id_string, serialized_association);
		}

		Ok(mapped)
	}

	/// Creates a serialized JSON array from an association array
	fn make_serialized_array(
		&self,
		association_name: &String,
		association_type_ref: &TypeRef,
		elements: Vec<ElementValue>,
	) -> Result<Vec<JsonElement>, InstanceMapperError> {
		let mut serialized_elements: Vec<JsonElement> = Vec::new();
		for element in elements {
			match element {
				ElementValue::Dict(a) => {
					let serialized = self.serialize(association_type_ref, a)?;
					serialized_elements.push(JsonElement::Dict(serialized));
				},
				ElementValue::IdGeneratedId(id) => {
					// Note: it's not always generated id, but it's fine probably
					serialized_elements.push(JsonElement::String(id.into()));
				},
				ElementValue::String(v) => {
					serialized_elements.push(JsonElement::String(v));
				},
				ElementValue::IdTupleGeneratedElementId(id_tuple) => {
					serialized_elements.push(JsonElement::Array(vec![
						JsonElement::String(id_tuple.list_id.into()),
						JsonElement::String(id_tuple.element_id.into()),
					]))
				},
				ElementValue::IdTupleCustomElementId(id_tuple) => {
					serialized_elements.push(JsonElement::Array(vec![
						JsonElement::String(id_tuple.list_id.into()),
						JsonElement::String(id_tuple.element_id.into()),
					]))
				},
				_ => {
					return Err(InvalidValue {
						type_ref: association_type_ref.clone(),
						field: association_name.to_owned(),
					});
				},
			};
		}
		Ok(serialized_elements)
	}

	/// Returns the type model referenced by a `TypeRef`
	/// from the `InstanceMapper`'s `TypeModelProvider`
	fn get_type_model(&self, type_ref: &TypeRef) -> Result<&TypeModel, InstanceMapperError> {
		self.type_model_provider
			.get_type_model(type_ref.app, type_ref.type_id)
			.ok_or_else(|| InstanceMapperError::TypeNotFound {
				type_ref: type_ref.clone(),
			})
	}

	/// Transforms an `ElementValue` into a JSON Value
	fn serialize_value(
		&self,
		type_model: &TypeModel,
		value_name: &str,
		model_value: &ModelValue,
		element_value: ElementValue,
	) -> Result<JsonElement, InstanceMapperError> {
		let invalid_value = || {
			Err(InvalidValue {
				type_ref: type_model.into(),
				field: value_name.to_owned(),
			})
		};

		// NOTE: there are more null/empty cases we need to take care of
		if model_value.cardinality == Cardinality::ZeroOrOne && element_value == ElementValue::Null
		{
			Ok(JsonElement::Null)
		} else if value_name == ID_FIELD {
			return match (
				&model_value.value_type,
				element_value,
				&type_model.element_type,
			) {
				(
					ValueType::GeneratedId | ValueType::CustomId,
					ElementValue::String(v),
					ElementType::Element | ElementType::Aggregated,
				) => Ok(JsonElement::String(v)),
				(
					ValueType::GeneratedId,
					ElementValue::IdGeneratedId(v),
					ElementType::Element | ElementType::Aggregated,
				) => Ok(JsonElement::String(v.to_string())),
				(
					ValueType::CustomId,
					ElementValue::IdCustomId(v),
					ElementType::Element | ElementType::Aggregated,
				) => Ok(JsonElement::String(v.to_string())),
				(
					ValueType::GeneratedId,
					ElementValue::IdTupleGeneratedElementId(arr),
					ElementType::ListElement,
				) => Ok(JsonElement::Array(vec![
					JsonElement::String(arr.list_id.into()),
					JsonElement::String(arr.element_id.into()),
				])),
				(
					ValueType::CustomId,
					ElementValue::IdTupleCustomElementId(arr),
					ElementType::ListElement,
				) => Ok(JsonElement::Array(vec![
					JsonElement::String(arr.list_id.into()),
					JsonElement::String(arr.element_id.into()),
				])),

				_ => invalid_value(),
			};
		} else {
			Self::map_element_value_to_json_element(model_value, element_value).ok_or_else(|| {
				InvalidValue {
					type_ref: type_model.into(),
					field: value_name.to_owned(),
				}
			})
		}
	}

	fn map_element_value_to_json_element(
		model_value: &ModelValue,
		element_value: ElementValue,
	) -> Option<JsonElement> {
		match (&model_value.value_type, element_value) {
			(_, ElementValue::String(v))
				if model_value.encrypted
                // the model value is not a string - this field was added as the default value marker for
                // some other model type
                && v.is_empty() && !matches!(model_value.value_type, ValueType::String) =>
			{
				Some(JsonElement::String(v))
			},

			(_, ElementValue::Bytes(v)) if model_value.encrypted => {
				let str = BASE64_STANDARD.encode(v);
				Some(JsonElement::String(str))
			},
			(ValueType::String, ElementValue::String(v)) => Some(JsonElement::String(v)),
			(ValueType::Number, ElementValue::Number(v)) => {
				Some(JsonElement::String(v.to_string()))
			},
			(ValueType::Bytes, ElementValue::Bytes(v)) => {
				let str = BASE64_STANDARD.encode(v);
				Some(JsonElement::String(str))
			},
			(ValueType::Date, ElementValue::Date(v)) => {
				Some(JsonElement::String(v.as_millis().to_string()))
			},
			(ValueType::Boolean, ElementValue::Bool(v)) => {
				Some(JsonElement::String(if v { "1" } else { "0" }.to_owned()))
			},
			(ValueType::GeneratedId, ElementValue::IdGeneratedId(v)) => {
				Some(JsonElement::String(v.into()))
			},
			(ValueType::CustomId, ElementValue::IdCustomId(v)) => {
				Some(JsonElement::String(v.into()))
			},
			(ValueType::CompressedString, ElementValue::String(_)) => {
				unimplemented!("compressed string")
			},
			_ => None,
		}
	}

	/// Transforms a JSON array into an `IdTupleGenerated`
	fn parse_id_tuple_generated(vec: Vec<JsonElement>) -> Option<IdTupleGenerated> {
		let mut it = vec.into_iter();
		match (it.next(), it.next(), it.next()) {
			(Some(JsonElement::String(list_id)), Some(JsonElement::String(element_id)), None) => {
				// would like to consume the array here but oh well
				Some(IdTupleGenerated::new(
					GeneratedId(list_id),
					GeneratedId(element_id),
				))
			},
			_ => None,
		}
	}

	/// Transforms a JSON array into an `IdTupleCustom`
	fn parse_id_tuple_custom(vec: Vec<JsonElement>) -> Option<IdTupleCustom> {
		let mut it = vec.into_iter();
		match (it.next(), it.next(), it.next()) {
			(Some(JsonElement::String(list_id)), Some(JsonElement::String(element_id)), None) => {
				// would like to consume the array here but oh well
				Some(IdTupleCustom::new(
					GeneratedId(list_id),
					CustomId(element_id),
				))
			},
			_ => None,
		}
	}

	/// Transforms a JSON value into an `ElementValue`
	fn parse_value(
		&self,
		type_model: &TypeModel,
		value_name: &str,
		model_value: &ModelValue,
		json_value: JsonElement,
	) -> Result<ElementValue, InstanceMapperError> {
		let invalid_value = || {
			Err(InvalidValue {
				type_ref: type_model.into(),
				field: value_name.to_owned(),
			})
		};

		// NOTE there are more null/empty cases we need to take care of
		if model_value.cardinality == Cardinality::ZeroOrOne && json_value == JsonElement::Null {
			return Ok(ElementValue::Null);
		}

		// Type models for ids are special.
		// The actual type depends on the type of the Element.
		// e.g. for ListElementType the GeneratedId actually means IdTuple.-
		if value_name == ID_FIELD {
			return match (
				&model_value.value_type,
				json_value,
				&type_model.element_type,
			) {
				(
					ValueType::GeneratedId | ValueType::CustomId,
					JsonElement::String(v),
					ElementType::Element | ElementType::Aggregated,
				) => Ok(ElementValue::String(v)),
				(
					ValueType::GeneratedId,
					JsonElement::Array(arr),
					ElementType::ListElement | ElementType::BlobElement,
				) if arr.len() == 2 => match Self::parse_id_tuple_generated(arr) {
					None => invalid_value(),
					Some(id_tuple) => Ok(ElementValue::IdTupleGeneratedElementId(id_tuple)),
				},
				(ValueType::CustomId, JsonElement::Array(arr), ElementType::ListElement)
					if arr.len() == 2 =>
				{
					match Self::parse_id_tuple_custom(arr) {
						None => invalid_value(),
						Some(id_tuple) => Ok(ElementValue::IdTupleCustomElementId(id_tuple)),
					}
				},
				_ => invalid_value(),
			};
		}

		match (&model_value.value_type, json_value) {
			(ValueType::String, JsonElement::String(v)) => Ok(ElementValue::String(v)),
			(ValueType::Number, JsonElement::String(v)) => match v.parse::<i64>() {
				Ok(num) => Ok(ElementValue::Number(num)),
				Err(_) => invalid_value(),
			},
			(ValueType::Bytes, JsonElement::String(v)) => {
				let vec = match BASE64_STANDARD.decode(v) {
					Ok(v) => Ok(v),
					Err(_) => Err(InvalidValue {
						type_ref: type_model.into(),
						field: value_name.to_owned(),
					}),
				}?;
				Ok(ElementValue::Bytes(vec))
			},
			(ValueType::Date, JsonElement::String(v)) => {
				let system_time = v.parse::<u64>().map_err(|_| InvalidValue {
					type_ref: type_model.into(),
					field: value_name.to_owned(),
				})?;
				Ok(ElementValue::Date(DateTime::from_millis(system_time)))
			},
			(ValueType::Boolean, JsonElement::String(v)) => match v.as_str() {
				"0" => Ok(ElementValue::Bool(false)),
				"1" => Ok(ElementValue::Bool(true)),
				_ => invalid_value(),
			},
			(ValueType::GeneratedId, JsonElement::String(v)) => {
				Ok(ElementValue::IdGeneratedId(GeneratedId(v)))
			},
			(ValueType::CustomId, JsonElement::String(v)) => {
				Ok(ElementValue::IdCustomId(CustomId(v)))
			},
			(ValueType::CompressedString, JsonElement::String(_)) => {
				unimplemented!("compressed string")
			},
			_ => invalid_value(),
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::key::GenericAesKey;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::entities::entity_facade::EntityFacadeImpl;
	use crate::entities::generated::sys::{GroupMembership, User};
	use crate::entities::generated::tutanota::Mail;
	use crate::entities::Entity;
	use crate::instance_mapper::InstanceMapper;
	use crate::services::test_services::{extend_model_resolver, HelloEncOutput};
	use crate::util::get_attribute_id_by_attribute_name;

	#[test]
	fn test_parse_mail() {
		// TODO: Expand this test to cover bucket keys in mail
		let type_model_provider = Arc::new(TypeModelProvider::new());
		let json_serializer = JsonSerializer {
			type_model_provider,
		};
		let email_json = include_str!("../test_data/email_response.json");
		let raw_entity = serde_json::from_str::<RawEntity>(email_json).unwrap();
		json_serializer
			.parse(&Mail::type_ref(), raw_entity)
			.unwrap();
	}

	#[test]
	fn test_parse_mail_empty_encrypted_boolean_defaults_to_false() {
		let type_model_provider = Arc::new(TypeModelProvider::new());
		let json_serializer = JsonSerializer {
			type_model_provider,
		};
		let email_json = include_str!(
			"../test_data/email_response_empty_encrypted_boolean_defaults_to_false.json"
		);
		let raw_entity = serde_json::from_str::<RawEntity>(email_json).unwrap();
		json_serializer
			.parse(&Mail::type_ref(), raw_entity)
			.unwrap();
	}

	#[test]
	fn test_parse_mail_with_attachments() {
		let type_model_provider = Arc::new(TypeModelProvider::new());
		let json_serializer = JsonSerializer {
			type_model_provider,
		};
		let email_json = include_str!("../test_data/email_response_attachments.json");
		let raw_entity = serde_json::from_str::<RawEntity>(email_json).unwrap();
		let type_ref = Mail::type_ref();
		let parsed = json_serializer.parse(&type_ref, raw_entity).unwrap();
		assert_eq!(
			&ElementValue::Array(vec![ElementValue::IdTupleGeneratedElementId(
				IdTupleGenerated::new(
					GeneratedId("O3lYN71--J-0".to_owned()),
					GeneratedId("O3lYUQI----0".to_owned()),
				)
			)]),
			parsed
				.get(&get_attribute_id_by_attribute_name(Mail::type_ref(), "attachments").unwrap())
				.expect("has attachments")
		)
	}

	#[test]
	fn test_parse_user() {
		let type_model_provider = Arc::new(TypeModelProvider::new());
		let json_serializer = JsonSerializer {
			type_model_provider,
		};
		let user_json = include_str!("../test_data/user_response.json");
		let raw_entity = serde_json::from_str::<RawEntity>(user_json).unwrap();
		let type_ref = User::type_ref();
		let parsed = json_serializer.parse(&type_ref, raw_entity).unwrap();
		let ship = parsed
			.get(&get_attribute_id_by_attribute_name(User::type_ref(), "memberships").unwrap())
			.unwrap()
			.assert_array()
			.iter()
			.find(|m| {
				m.assert_dict()
					.get(
						&get_attribute_id_by_attribute_name(
							GroupMembership::type_ref(),
							"groupType",
						)
						.unwrap(),
					)
					.unwrap()
					.assert_number()
					== 3
			})
			.unwrap()
			.assert_dict();
		assert!(!ship
			.get(
				&get_attribute_id_by_attribute_name(GroupMembership::type_ref(), "symEncGKey")
					.unwrap()
			)
			.unwrap()
			.assert_bytes()
			.is_empty());
	}

	#[test]
	fn test_parse_user_with_empty_group_key() {
		let type_model_provider = Arc::new(TypeModelProvider::new());
		let json_serializer = JsonSerializer {
			type_model_provider,
		};
		let user_json = include_str!("../test_data/user_response_empty_group_key.json");
		let raw_entity = serde_json::from_str::<RawEntity>(user_json).unwrap();
		let type_ref = User::type_ref();
		let parsed = json_serializer.parse(&type_ref, raw_entity).unwrap();
		let ship = parsed
			.get(&get_attribute_id_by_attribute_name(User::type_ref(), "memberships").unwrap())
			.unwrap()
			.assert_array()
			.iter()
			.find(|m| {
				m.assert_dict()
					.get(
						&get_attribute_id_by_attribute_name(
							GroupMembership::type_ref(),
							"groupType",
						)
						.unwrap(),
					)
					.unwrap()
					.assert_number()
					== 2
			})
			.unwrap()
			.assert_dict();
		assert_eq!(
			ship.get(
				&get_attribute_id_by_attribute_name(GroupMembership::type_ref(), "symEncGKey")
					.unwrap()
			)
			.unwrap()
			.assert_bytes(),
			&Vec::<u8>::new()
		);
	}

	#[test]
	fn serialization_for_encrypted_works() {
		use crate::entities::entity_facade::EntityFacade;

		let mut type_provider = TypeModelProvider::new();
		let _ok_if_overwritten = extend_model_resolver(&mut type_provider);
		let type_provider = Arc::new(type_provider);

		let entity_to_serialize = HelloEncOutput {
			answer: "".to_string(),
			timestamp: Default::default(),
			_finalIvs: Default::default(),
		};

		let instance_mapper = InstanceMapper::new();
		let parsed_unencrypted = instance_mapper
			.serialize_entity(entity_to_serialize)
			.unwrap();
		let entity_facade = EntityFacadeImpl::new(
			type_provider.clone(),
			RandomizerFacade::from_core(rand_core::OsRng),
		);
		let type_model = type_provider
			.get_type_model(
				HelloEncOutput::type_ref().app,
				HelloEncOutput::type_ref().type_id,
			)
			.unwrap();
		let session_key = GenericAesKey::from_bytes(&[rand::random(); 32]).unwrap();
		let parsed_encrypted = entity_facade
			.encrypt_and_map(type_model, &parsed_unencrypted, &session_key)
			.unwrap();

		let json_serializer = JsonSerializer::new(type_provider);
		json_serializer
			.serialize(&HelloEncOutput::type_ref(), parsed_encrypted)
			.unwrap();
	}

	/// test json_serializer deserialization => serialization complete round trip
	/// 1. Reading test data: json -> serde@from_str => RawEntity
	/// 2. Deserialize: RawEntity -> jsonSerializer@parse => ParsedEntity
	/// 3. Serialize: ParsedEntity -> jsonSerializer@serialize => RawEntity
	#[test]
	fn deserialize_serialize_round_trip_works() {
		let type_model_provider = Arc::new(TypeModelProvider::new());
		let json_serializer = JsonSerializer {
			type_model_provider,
		};

		let email_json = include_str!("../test_data/email_response.json");

		let raw_entity_original = serde_json::from_str::<RawEntity>(email_json).unwrap();
		let parsed_entity = json_serializer
			.parse(&Mail::type_ref(), raw_entity_original.clone())
			.unwrap();
		let raw_entity_new = json_serializer
			.serialize(&Mail::type_ref(), parsed_entity)
			.unwrap();

		assert_raw_entities_deep_equals(raw_entity_original.clone(), raw_entity_new.clone());
	}

	/// assert that two RawEntities are deep equals, while not dependent on the order of fields
	fn assert_raw_entities_deep_equals(
		raw_entity_expected: RawEntity,
		raw_entity_actual: RawEntity,
	) {
		raw_entity_expected
			.into_iter()
			.for_each(|(name_expected, value_expected)| {
				let value_actual = raw_entity_actual.get(&name_expected).unwrap().to_owned();
				match value_expected {
					JsonElement::Dict(dict_expected) => {
						let dict_new = match value_actual {
							JsonElement::Dict(dict_actual) => dict_actual,
							_ => panic!("aggregation on raw entities is not equals, expected {:?} , actual: {:?} !", dict_expected, value_actual),
						};
						assert_raw_entities_deep_equals(dict_expected, dict_new);
					}
					// edge case, where an encrypted boolean value is empty ("") but defaults to false ("0")
					JsonElement::String(string_expected) if string_expected == "" => {
						match value_actual {
							JsonElement::String(string_actual) if string_actual == "0" => string_actual,
							_ => panic!("string value on raw entities is not equals, expected {:?} , actual: {:?} !", string_expected, value_actual),
						};
					}
					_ => assert_eq!(value_expected, value_actual),
				};
			});
	}
}
