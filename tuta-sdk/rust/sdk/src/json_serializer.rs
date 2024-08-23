use std::collections::HashMap;
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, Engine as _};
use thiserror::Error;

use crate::custom_id::CustomId;
use crate::date::DateTime;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::generated_id::GeneratedId;
use crate::json_element::{JsonElement, RawEntity};
use crate::json_serializer::InstanceMapperError::InvalidValue;
use crate::metamodel::{
    AssociationType, Cardinality, ElementType, ModelValue, TypeModel, ValueType,
};
use crate::type_model_provider::TypeModelProvider;
use crate::{IdTuple, TypeRef};

impl From<&TypeModel> for TypeRef {
    fn from(value: &TypeModel) -> Self {
        TypeRef {
            app: value.app,
            type_: value.name,
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
        let mut mapped: HashMap<String, ElementValue> = HashMap::new();
        for (&value_name, value_type) in &type_model.values {
            // reuse the name
            let (value_name, value) =
                raw_entity
                    .remove_entry(value_name)
                    .ok_or_else(|| InvalidValue {
                        type_ref: type_ref.clone(),
                        field: value_name.to_owned(),
                    })?;

            let mapped_value = match (&value_type.cardinality, value) {
                (Cardinality::ZeroOrOne, JsonElement::Null) => ElementValue::Null,
                (Cardinality::One, JsonElement::String(v)) if v.is_empty() => {
                    ElementValue::String(String::new())
                }
                (Cardinality::One | Cardinality::ZeroOrOne, JsonElement::String(s))
                    if value_type.encrypted =>
                {
                    ElementValue::Bytes(BASE64_STANDARD.decode(s).map_err(|_| InvalidValue {
                        type_ref: type_ref.clone(),
                        field: value_name.clone(),
                    })?)
                }
                (_, value) if !value_type.encrypted => {
                    self.parse_value(type_model, &value_name, value_type, value)?
                }
                _ => {
                    return Err(InvalidValue {
                        type_ref: type_ref.clone(),
                        field: value_name.clone(),
                    })
                }
            };
            mapped.insert(value_name, mapped_value);
        }

        for (&association_name, association_type) in &type_model.associations {
            // reuse the name
            let (association_name, value) =
                raw_entity
                    .remove_entry(association_name)
                    .ok_or_else(|| InvalidValue {
                        type_ref: type_ref.clone(),
                        field: association_name.to_owned(),
                    })?;
            let association_type_ref = TypeRef {
                app: association_type.dependency.unwrap_or(type_ref.app),
                type_: association_type.ref_type,
            };
            match (
                &association_type.association_type,
                &association_type.cardinality,
                value,
            ) {
                (
                    AssociationType::Aggregation,
                    Cardinality::One | Cardinality::ZeroOrOne,
                    JsonElement::Dict(dict),
                ) => {
                    let parsed = self.parse(&association_type_ref, dict)?;
                    mapped.insert(association_name, ElementValue::Dict(parsed));
                }
                (AssociationType::Aggregation, Cardinality::Any, JsonElement::Array(elements)) => {
                    let parsed_aggregates = self.parse_aggregated_array(
                        &association_name,
                        &association_type_ref,
                        elements,
                    )?;
                    mapped.insert(association_name, ElementValue::Array(parsed_aggregates));
                }
                (_, Cardinality::ZeroOrOne, JsonElement::Null) => {
                    mapped.insert(association_name, ElementValue::Null);
                }
                (
                    AssociationType::ElementAssociation | AssociationType::ListAssociation,
                    Cardinality::One | Cardinality::ZeroOrOne,
                    JsonElement::String(id),
                ) => {
                    // FIXME it's not always generated id but it's fine probably
                    mapped.insert(
                        association_name,
                        ElementValue::IdGeneratedId(GeneratedId(id)),
                    );
                }
                (
                    AssociationType::ListElementAssociation,
                    Cardinality::One | Cardinality::ZeroOrOne,
                    JsonElement::Array(vec),
                ) => {
                    let id_tuple = match Self::parse_id_tuple(vec) {
                        None => {
                            return Err(InvalidValue {
                                type_ref: association_type_ref,
                                field: association_name,
                            });
                        }
                        Some(id_tuple) => id_tuple,
                    };
                    mapped.insert(association_name, ElementValue::IdTupleId(id_tuple));
                }
                (
                    AssociationType::ListElementAssociation,
                    Cardinality::Any,
                    JsonElement::Array(vec),
                ) => {
                    let ids = self.parse_id_tuple_list(type_ref, &association_name, vec)?;

                    mapped.insert(association_name, ElementValue::Array(ids));
                }
                (
                    AssociationType::BlobElementAssociation,
                    Cardinality::One | Cardinality::ZeroOrOne,
                    JsonElement::Array(vec),
                ) => {
                    let id_tuple = match Self::parse_id_tuple(vec) {
                        None => {
                            return Err(InvalidValue {
                                type_ref: association_type_ref,
                                field: association_name,
                            });
                        }
                        Some(id_tuple) => id_tuple,
                    };
                    mapped.insert(association_name, ElementValue::IdTupleId(id_tuple));
                }
                _ => {}
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
                JsonElement::Dict(a) => {
                    let parsed = self.parse(association_type_ref, a)?;
                    parsed_aggregates.push(ElementValue::Dict(parsed));
                }
                _ => {
                    return Err(InvalidValue {
                        type_ref: association_type_ref.clone(),
                        field: association_name.to_owned(),
                    });
                }
            };
        }
        Ok(parsed_aggregates)
    }

    fn parse_id_tuple_list(
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
                let id_tuple = Self::parse_id_tuple(id_vec).ok_or_else(|| InvalidValue {
                    field: association_name.to_owned(),
                    type_ref: outer_type_ref.clone(),
                })?;
                Ok(ElementValue::IdTupleId(id_tuple))
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
        for (&value_name, value_type) in &type_model.values {
            // we take out of the map to reuse the names/values
            let (value_name, value) =
                entity
                    .remove_entry(value_name)
                    .ok_or_else(|| InvalidValue {
                        type_ref: type_ref.clone(),
                        field: value_name.to_owned(),
                    })?;

            if !value_type.encrypted {
                let serialized_value =
                    self.serialize_value(type_model, &value_name, value_type, value)?;
                mapped.insert(value_name, serialized_value);
            } else if let ElementValue::Null = value {
                mapped.insert(value_name, JsonElement::Null);
                continue;
            } else if let (ElementValue::String(v), true) = (value, value_type.encrypted) {
                mapped.insert(value_name, JsonElement::String(v));
                continue;
            } else {
                panic!("Unknown entity elements!! {}", value_name)
            }
        }

        for (&association_name, association_type) in &type_model.associations {
            let (association_name, value) =
                entity
                    .remove_entry(association_name)
                    .ok_or_else(|| InvalidValue {
                        type_ref: type_ref.clone(),
                        field: association_name.to_owned(),
                    })?;
            let association_type_ref = TypeRef {
                app: type_ref.app,
                type_: association_type.ref_type,
            };
            match (
                &association_type.association_type,
                &association_type.cardinality,
                value,
            ) {
                (
                    AssociationType::Aggregation,
                    Cardinality::One | Cardinality::ZeroOrOne,
                    ElementValue::Dict(dict),
                ) => {
                    let serialized = self.serialize(&association_type_ref, dict)?;
                    mapped.insert(association_name, JsonElement::Dict(serialized));
                }
                (
                    AssociationType::Aggregation | AssociationType::ListElementAssociation,
                    Cardinality::Any,
                    ElementValue::Array(elements),
                ) => {
                    let serialized_aggregates = self.make_serialized_aggregated_array(
                        &association_name,
                        &association_type_ref,
                        elements,
                    )?;
                    mapped.insert(association_name, JsonElement::Array(serialized_aggregates));
                }
                (_, Cardinality::ZeroOrOne, ElementValue::Null) => {
                    mapped.insert(association_name, JsonElement::Null);
                }
                (
                    AssociationType::ElementAssociation | AssociationType::ListAssociation,
                    Cardinality::One | Cardinality::ZeroOrOne,
                    ElementValue::IdGeneratedId(id),
                ) => {
                    // FIXME it's not always generated id but it's fine probably
                    mapped.insert(association_name, JsonElement::String(id.into()));
                }
                (
                    AssociationType::ListElementAssociation,
                    Cardinality::One,
                    ElementValue::IdTupleId(id_tuple),
                ) => {
                    mapped.insert(
                        association_name,
                        JsonElement::Array(vec![
                            JsonElement::String(id_tuple.list_id.into()),
                            JsonElement::String(id_tuple.element_id.into()),
                        ]),
                    );
                }
                (AssociationType::BlobElementAssociation, _, ElementValue::Array(elements)) => {
                    // Blobs ate copied as-is for now
                    let serialized_aggregates = self.make_serialized_aggregated_array(
                        &association_name,
                        &association_type_ref,
                        elements,
                    )?;
                    mapped.insert(association_name, JsonElement::Array(serialized_aggregates));
                }
                _ => {}
            }
        }

        Ok(mapped)
    }

    /// Creates a JSON array from an aggregated array
    fn make_serialized_aggregated_array(
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
                }
                ElementValue::String(v) => {
                    serialized_elements.push(JsonElement::String(v));
                }
                _ => {
                    return Err(InvalidValue {
                        type_ref: association_type_ref.clone(),
                        field: association_name.to_owned(),
                    });
                }
            };
        }
        Ok(serialized_elements)
    }

    /// Returns the type model referenced by a `TypeRef`
    /// from the `InstanceMapper`'s `TypeModelProvider`
    fn get_type_model(&self, type_ref: &TypeRef) -> Result<&TypeModel, InstanceMapperError> {
        self.type_model_provider
            .get_type_model(type_ref.app, type_ref.type_)
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

        // FIXME there are more null/empty cases we need to take care of
        if model_value.cardinality == Cardinality::ZeroOrOne && element_value == ElementValue::Null
        {
            return Ok(JsonElement::Null);
        }

        if value_name == "_id" {
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
                    ValueType::GeneratedId | ValueType::CustomId,
                    ElementValue::IdTupleId(arr),
                    ElementType::ListElement,
                ) => Ok(JsonElement::Array(vec![
                    JsonElement::String(arr.list_id.into()),
                    JsonElement::String(arr.element_id.into()),
                ])),
                _ => invalid_value(),
            };
        }

        match (&model_value.value_type, element_value) {
            (ValueType::String, ElementValue::String(v)) => Ok(JsonElement::String(v)),
            (ValueType::Number, ElementValue::Number(v)) => Ok(JsonElement::String(v.to_string())),
            (ValueType::Bytes, ElementValue::Bytes(v)) => {
                let str = BASE64_STANDARD.encode(v);
                Ok(JsonElement::String(str))
            }
            (ValueType::Date, ElementValue::Date(v)) => {
                Ok(JsonElement::String(v.as_millis().to_string()))
            }
            (ValueType::Boolean, ElementValue::Bool(v)) => {
                Ok(JsonElement::String(if v { "1" } else { "0" }.to_owned()))
            }
            (ValueType::GeneratedId, ElementValue::IdGeneratedId(v)) => {
                Ok(JsonElement::String(v.into()))
            }
            (ValueType::CustomId, ElementValue::IdCustomId(v)) => Ok(JsonElement::String(v.into())),
            (ValueType::CompressedString, ElementValue::String(_)) => {
                unimplemented!("compressed string")
            }
            _ => invalid_value(),
        }
    }

    /// Transforms a JSON array into an `IdTuple`
    fn parse_id_tuple(vec: Vec<JsonElement>) -> Option<IdTuple> {
        let mut it = vec.into_iter();
        match (it.next(), it.next(), it.next()) {
            (Some(JsonElement::String(list_id)), Some(JsonElement::String(element_id)), None) => {
                // would like to consume the array here but oh well
                Some(IdTuple::new(GeneratedId(list_id), GeneratedId(element_id)))
            }
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

        // FIXME there are more null/empty cases we need to take care of
        if model_value.cardinality == Cardinality::ZeroOrOne && json_value == JsonElement::Null {
            return Ok(ElementValue::Null);
        }

        // Type models for ids are special.
        // The actual type depends on the type of the Element.
        // e.g. for ListElementType the GeneratedId actually means IdTuple.-
        if value_name == "_id" {
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
                    ValueType::GeneratedId | ValueType::CustomId,
                    JsonElement::Array(arr),
                    ElementType::ListElement,
                ) if arr.len() == 2 => match Self::parse_id_tuple(arr) {
                    None => invalid_value(),
                    Some(id_tuple) => Ok(ElementValue::IdTupleId(id_tuple)),
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
            }
            (ValueType::Date, JsonElement::String(v)) => {
                let system_time = v.parse::<u64>().map_err(|_| InvalidValue {
                    type_ref: type_model.into(),
                    field: value_name.to_owned(),
                })?;
                Ok(ElementValue::Date(DateTime::from_millis(system_time)))
            }
            (ValueType::Boolean, JsonElement::String(v)) => match v.as_str() {
                "0" => Ok(ElementValue::Bool(false)),
                "1" => Ok(ElementValue::Bool(true)),
                _ => invalid_value(),
            },
            (ValueType::GeneratedId, JsonElement::String(v)) => {
                Ok(ElementValue::IdGeneratedId(GeneratedId(v)))
            }
            (ValueType::CustomId, JsonElement::String(v)) => {
                Ok(ElementValue::IdCustomId(CustomId(v)))
            }
            (ValueType::CompressedString, JsonElement::String(_)) => {
                unimplemented!("compressed string")
            }
            _ => invalid_value(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::type_model_provider::init_type_model_provider;

    #[test]
    fn test_parse_mail() {
        let type_model_provider = Arc::new(init_type_model_provider());
        let mapper = JsonSerializer {
            type_model_provider,
        };
        // TODO: Expand this test to cover bucket keys in mail
        let email_json = include_str!("../test_data/email_response.json");
        let raw_entity = serde_json::from_str::<RawEntity>(email_json).unwrap();
        let type_ref = TypeRef {
            app: "tutanota",
            type_: "Mail",
        };
        mapper.parse(&type_ref, raw_entity).unwrap();
    }

    #[test]
    fn test_parse_mail_with_attachments() {
        let type_model_provider = Arc::new(init_type_model_provider());
        let mapper = JsonSerializer {
            type_model_provider,
        };
        let email_json = include_str!("../test_data/email_response_attachments.json");
        let raw_entity = serde_json::from_str::<RawEntity>(email_json).unwrap();
        let type_ref = TypeRef {
            app: "tutanota",
            type_: "Mail",
        };
        let parsed = mapper.parse(&type_ref, raw_entity).unwrap();
        assert_eq!(
            &ElementValue::Array(vec![ElementValue::IdTupleId(IdTuple::new(
                GeneratedId("O3lYN71--J-0".to_owned()),
                GeneratedId("O3lYUQI----0".to_owned()),
            ))]),
            parsed.get("attachments").expect("has attachments")
        )
    }
}
