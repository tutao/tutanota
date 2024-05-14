use std::cmp::PartialEq;
use std::collections::HashMap;
use std::process::id;
use std::time::{Duration, SystemTime};

use base64::{engine::general_purpose::STANDARD as BASE64_STANDARD, DecodeError, Engine as _};
use serde::{Deserialize, Serialize};
use thiserror::Error;

use crate::instance_mapper::Cardinality::ZeroOrOne;
use crate::instance_mapper::InstanceMapperError::InvalidValue;
use crate::json_element::JsonElement;
use crate::{IdTuple, RawEntity, TypeRef};

#[derive(Deserialize, PartialEq)]
pub enum ElementType {
    #[serde(rename = "ELEMENT_TYPE")]
    Element,
    #[serde(rename = "LIST_ELEMENT_TYPE")]
    ListElement,
    #[serde(rename = "DATA_TRANSFER_TYPE")]
    DataTransfer,
    #[serde(rename = "AGGREGATED_TYPE")]
    Aggregated,
    #[serde(rename = "BLOB_ELEMENT_TYPE")]
    BlobElement,
}

#[derive(Deserialize)]
pub enum ValueType {
    String,
    Number,
    Bytes,
    Date,
    Boolean,
    GeneratedId,
    CustomId,
    CompressedString,
}

#[derive(Deserialize, PartialEq)]
pub enum Cardinality {
    ZeroOrOne,
    Any,
    One,
}

// 	ElementAssociation: "ELEMENT_ASSOCIATION",
// 	ListAssociation: "LIST_ASSOCIATION",
// 	ListElementAssociation: "LIST_ELEMENT_ASSOCIATION",
// 	Aggregation: "AGGREGATION",
// 	BlobElementAssociation: "BLOB_ELEMENT_ASSOCIATION",
#[derive(Deserialize)]
pub enum AssociationType {
    #[serde(rename = "ELEMENT_ASSOCIATION")]
    ElementAssociation,
    #[serde(rename = "LIST_ASSOCIATION")]
    ListAssociation,
    #[serde(rename = "LIST_ELEMENT_ASSOCIATION")]
    ListElementAssociation,
    #[serde(rename = "AGGREGATION")]
    Aggregation,
    #[serde(rename = "BLOB_ELEMENT_ASSOCIATION")]
    BlobElementAssociation,
}

#[derive(Deserialize)]
pub struct ModelValue {
    id: u64,
    #[serde(rename = "type")]
    value_type: ValueType,
    cardinality: Cardinality,
    #[serde(rename = "final")]
    is_final: bool,
    encrypted: bool,
}

#[derive(Deserialize)]
pub struct TypeModel {
    id: u64,
    since: u64,
    app: String,
    version: String,
    name: String,
    #[serde(rename = "type")]
    element_type: ElementType,
    versioned: bool,
    encrypted: bool,
    #[serde(rename = "rootId")]
    root_id: String,
    values: HashMap<String, ModelValue>,
    associations: HashMap<String, ModelAssociation>,
}

impl From<&TypeModel> for TypeRef {
    fn from(value: &TypeModel) -> Self {
        TypeRef {
            app: value.app.clone(),
            type_: value.name.clone(),
        }
    }
}

#[derive(Deserialize)]
pub struct ModelAssociation {
    id: u64,
    #[serde(rename = "type")]
    association_type: AssociationType,
    cardinality: Cardinality,
    #[serde(rename = "refType")]
    ref_type: String,
    #[serde(rename = "final")]
    is_final: bool,
    /**
     * From which model we import this association from. Currently the field only exists for aggregates because they are only ones
     * which can be imported across models.
     */
    dependency: Option<String>,
}

type AppName = String;
type TypeName = String;
pub struct TypeModelProvider {
    app_models: HashMap<AppName, HashMap<TypeName, TypeModel>>,
}

impl TypeModelProvider {
    pub fn new(app_models: HashMap<String, HashMap<String, TypeModel>>) -> TypeModelProvider {
        TypeModelProvider { app_models }
    }

    fn get_type_model<'a>(&self, app_name: &str, entity_name: &str) -> Option<&TypeModel> {
        let app_map = self.app_models.get(app_name)?;
        let entity_model = app_map.get(entity_name)?;
        Some(entity_model)
    }
}

#[derive(uniffi::Enum, Debug, PartialEq, Clone)]
pub enum ElementValue {
    Null,
    String(String),
    Number(i64),
    Bytes(Vec<u8>),
    Date(SystemTime),
    Bool(bool),
    GeneratedId(String),
    CustomId(String),
    IdTupleId(IdTuple),
    Dict(HashMap<String, ElementValue>),
    Array(Vec<HashMap<String, ElementValue>>),
}

pub type ParsedEntity = HashMap<String, ElementValue>;

pub struct InstanceMapper {
    type_model_provider: TypeModelProvider,
}

#[derive(Error, Debug, uniffi::Error)]
pub enum InstanceMapperError {
    #[error("Type not found: {type_ref}")]
    TypeNotFound { type_ref: TypeRef },
    #[error("Invalid value not found: {type_ref} {field}")]
    InvalidValue { type_ref: TypeRef, field: String },
}

impl InstanceMapper {
    pub fn new(type_model_provider: TypeModelProvider) -> InstanceMapper {
        InstanceMapper {
            type_model_provider,
        }
    }

    pub fn parse(
        &self,
        type_ref: &TypeRef,
        mut raw_entity: RawEntity,
    ) -> Result<ParsedEntity, InstanceMapperError> {
        let type_model = self.get_type_model(&type_ref)?;
        let mut mapped: HashMap<String, ElementValue> = HashMap::new();
        for (value_name, value_type) in &type_model.values {
            // reuse the name
            let (value_name, value) =
                raw_entity
                    .remove_entry(value_name)
                    .ok_or_else(|| InvalidValue {
                        type_ref: type_ref.clone(),
                        field: value_name.to_owned(),
                    })?;

            if !value_type.encrypted {
                let parsed_value =
                    self.parse_value(&type_model, &value_name, &value_type, value)?;
                mapped.insert(value_name, parsed_value);
            } else if let JsonElement::String(v) = value {
                // FIXME we should check cardinality
                mapped.insert(value_name, ElementValue::String(v));
                continue;
            } else if let JsonElement::Null = value {
                // FIXME we should check cardinality
                mapped.insert(value_name, ElementValue::Null);
                continue;
            } else {
                panic!("It's not a string!! {}", value_name)
            }
        }

        for (association_name, association_type) in &type_model.associations {
            // reuse the name
            let (association_name, value) =
                raw_entity
                    .remove_entry(association_name)
                    .ok_or_else(|| InvalidValue {
                        type_ref: type_ref.clone(),
                        field: association_name.to_owned(),
                    })?;
            let association_type_ref = TypeRef {
                app: type_ref.app.to_owned(),
                type_: association_type.ref_type.clone(),
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
                    let mut parsed_aggregates = Vec::new();
                    for element in elements {
                        let aggregate_dict = match element {
                            JsonElement::Dict(a) => a,
                            _ => {
                                return Err(InvalidValue {
                                    type_ref: association_type_ref,
                                    field: association_name,
                                })
                            }
                        };
                        let parsed = self.parse(&association_type_ref, aggregate_dict)?;
                        parsed_aggregates.push(parsed);
                    }
                    mapped.insert(association_name, ElementValue::Array(parsed_aggregates));
                }
                (AssociationType::Aggregation, Cardinality::ZeroOrOne, JsonElement::Null) => {
                    mapped.insert(association_name, ElementValue::Null);
                }
                (
                    AssociationType::ElementAssociation | AssociationType::ListAssociation,
                    Cardinality::One | Cardinality::ZeroOrOne,
                    JsonElement::String(id),
                ) => {
                    // FIXME it's not always generated id but it's fine probably
                    mapped.insert(association_name, ElementValue::GeneratedId(id));
                }
                (
                    AssociationType::ElementAssociation | AssociationType::ListElementAssociation,
                    Cardinality::ZeroOrOne,
                    JsonElement::Null,
                ) => {
                    mapped.insert(association_name, ElementValue::Null);
                }
                (
                    AssociationType::ListElementAssociation,
                    Cardinality::One,
                    JsonElement::Array(vec),
                ) => {
                    let id_tuple = match Self::parse_id_tuple(vec) {
                        None => {
                            return Err(InvalidValue {
                                type_ref: association_type_ref,
                                field: association_name,
                            })
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

    pub fn serialize(
        &self,
        type_ref: &TypeRef,
        mut entity: ParsedEntity,
    ) -> Result<RawEntity, InstanceMapperError> {
        let type_model = self.get_type_model(&type_ref)?;
        let mut mapped: RawEntity = HashMap::new();
        for (value_name, value_type) in &type_model.values {
            // reuse the name
            let (value_name, value) =
                entity
                    .remove_entry(value_name)
                    .ok_or_else(|| InvalidValue {
                        type_ref: type_ref.clone(),
                        field: value_name.to_owned(),
                    })?;

            if !value_type.encrypted {
                let serialized_value =
                    self.serialize_value(&type_model, &value_name, &value_type, value)?;
                mapped.insert(value_name, serialized_value);
            }
        }

        Ok(mapped)
    }

    fn get_type_model(&self, type_ref: &TypeRef) -> Result<&TypeModel, InstanceMapperError> {
        self.type_model_provider
            .get_type_model(&type_ref.app, &type_ref.type_)
            .ok_or_else(|| InstanceMapperError::TypeNotFound {
                type_ref: type_ref.clone(),
            })
    }

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
        if model_value.cardinality == ZeroOrOne && element_value == ElementValue::Null {
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
                    JsonElement::String(arr.list_id),
                    JsonElement::String(arr.element_id),
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
                let num = v
                    .duration_since(SystemTime::UNIX_EPOCH)
                    .unwrap()
                    .as_millis();
                Ok(JsonElement::String(num.to_string()))
            }
            (ValueType::Boolean, ElementValue::Bool(v)) => {
                Ok(JsonElement::String(if v { "1" } else { "0" }.to_owned()))
            }
            (ValueType::GeneratedId, ElementValue::GeneratedId(v)) => Ok(JsonElement::String(v)),
            (ValueType::CustomId, ElementValue::CustomId(v)) => Ok(JsonElement::String(v)),
            (ValueType::CompressedString, ElementValue::String(_)) => {
                unimplemented!("compressed string")
            }
            _ => invalid_value(),
        }
    }

    fn parse_id_tuple(vec: Vec<JsonElement>) -> Option<IdTuple> {
        let mut it = vec.into_iter();
        match (it.next(), it.next(), it.next()) {
            (Some(JsonElement::String(list_id)), Some(JsonElement::String(element_id)), None) => {
                // would like to consume the array here but oh well
                Some(IdTuple::new(list_id, element_id))
            }
            _ => None,
        }
    }

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
        if model_value.cardinality == ZeroOrOne && json_value == JsonElement::Null {
            return Ok(ElementValue::Null);
        }

        // Type models for id's are special.
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
                let num = v.parse::<u64>().map_err(|_| InvalidValue {
                    type_ref: type_model.into(),
                    field: value_name.to_owned(),
                })?;
                let system_time = SystemTime::UNIX_EPOCH + Duration::from_millis(num);
                Ok(ElementValue::Date(system_time))
            }
            (ValueType::Boolean, JsonElement::String(v)) => match v.as_str() {
                "0" => Ok(ElementValue::Bool(false)),
                "1" => Ok(ElementValue::Bool(true)),
                _ => invalid_value(),
            },
            (ValueType::GeneratedId, JsonElement::String(v)) => Ok(ElementValue::GeneratedId(v)),
            (ValueType::CustomId, JsonElement::String(v)) => Ok(ElementValue::CustomId(v)),
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

    #[test]
    fn test_parse_mail() {
        let type_model_provider = init_type_model_provider();
        let mapper = InstanceMapper {
            type_model_provider,
        };
        let email_json = include_str!("../test_data/email_response.json");
        let raw_entity = serde_json::from_str::<RawEntity>(email_json).unwrap();
        let type_ref = TypeRef {
            app: "tutanota".to_owned(),
            type_: "Mail".to_owned(),
        };
        mapper.parse(&type_ref, raw_entity).unwrap();
    }

    fn init_type_model_provider() -> TypeModelProvider {
        let tutanota_type_model_str = include_str!("../test_data/tutanota_type_model.json");
        let tutanota_type_model =
            serde_json::from_str::<HashMap<String, TypeModel>>(&tutanota_type_model_str)
                .expect("Could not parse type model :(");
        let type_model_provider = TypeModelProvider::new(HashMap::from([(
            "tutanota".to_owned(),
            tutanota_type_model,
        )]));
        type_model_provider
    }
}
