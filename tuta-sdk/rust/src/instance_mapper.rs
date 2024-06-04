use std::sync::Arc;

use serde::{de, Deserialize, Deserializer};
use serde::de::{DeserializeSeed, IntoDeserializer, MapAccess, Visitor};
use serde::de::value::{MapDeserializer, SeqDeserializer};
use thiserror::Error;

use crate::element_value::{ElementValue, ParsedEntity};
use crate::element_value::ElementValue::IdTupleId;
use crate::entities::Entity;
use crate::IdTuple;

/// Converter between untyped representations of API Entities and generated structures
pub struct InstanceMapper {
}

impl InstanceMapper {
    fn new() -> Self {
        InstanceMapper {}
    }
}

#[derive(Error, Debug)]
#[error("Error while deserializing entity, {0}")]
pub struct DeError(#[from] de::value::Error);

impl InstanceMapper {
    pub fn parse_entity<'a, T: Entity + Deserialize<'a>>(&self, map: ParsedEntity) -> Result<T, DeError> {
        let de = ParsedEntityDeserializer::from_parsed_entity(map);
        T::deserialize(de).map_err(|e| e.into())
    }
}

/// (De)Serialization consist of two parts:
///  - (De)Serialize (how to write this type to an arbitrary data format)
///  - (De)Serializer (how to write arbitrary data to a specific data format)
/// Serde generates (De)Serialize implementations for our generated Entity's.
///
/// We implement the other half, custom "data format",
/// the same way as serde_json maps types to/from json we map them
/// to/from ParsedEntity.
///
/// This is the "outer" serializer for the Entity itself.
struct ParsedEntityDeserializer {
    input: ParsedEntity,
}

impl<'de> ParsedEntityDeserializer {
    fn from_parsed_entity(parsed_entity: ParsedEntity) -> Self {
        ParsedEntityDeserializer { input: parsed_entity }
    }
}

impl<'de> Deserializer<'de> for ParsedEntityDeserializer {
    type Error = de::value::Error;

    serde::forward_to_deserialize_any! {
                bool i8 i16 i32 i64 u8 u16 u32 u64 f32 f64 char str string bytes
                byte_buf option unit unit_struct newtype_struct seq tuple
                tuple_struct map enum identifier ignored_any
            }

    fn deserialize_any<V>(self, _: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        Err(de::Error::custom("deserialize_any is not supported!"))
    }

    fn deserialize_struct<V>(self, _: &'static str, _: &'static [&'static str], visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        visitor.visit_map(MapDeserializer::new(self.input.into_iter()))
    }
}

/// "inner" serializer for a single ElementValue
pub struct ElementValueDeserializer {
    value: ElementValue,
}

impl<'de> Deserializer<'de> for ElementValueDeserializer {
    type Error = de::value::Error;

    serde::forward_to_deserialize_any! {
        i8 i16 i32 u8 u16 u32 u64 f32 f64 char str bytes
                byte_buf unit unit_struct newtype_struct tuple
                tuple_struct map enum identifier ignored_any
            }

    fn deserialize_any<V>(self, _: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        Err(de::Error::custom("deserialize_any is not supported!"))
    }

    fn deserialize_bool<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if let ElementValue::Bool(bool) = self.value {
            visitor.visit_bool(bool)
        } else {
            Err(de::Error::custom("Expecting bool"))
        }
    }

    fn deserialize_i64<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if let ElementValue::Number(num) = self.value {
            visitor.visit_i64(num)
        } else {
            Err(de::Error::custom("Expecting i64"))
        }
    }

    fn deserialize_string<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        return match self.value {
            // Currently we just generate Id types as String but we could be more precise, then we would need to implement newtype
            ElementValue::String(str) | ElementValue::GeneratedId(str) | ElementValue::CustomId(str) => {
                visitor.visit_string(str)
            }
            _ => {
                Err(serde::de::Error::custom("Expecting string"))
            }
        };
    }

    fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        match self.value {
            ElementValue::Null => visitor.visit_none(),
            // We have the same value but the visitor who is driving us will proceed to inner type
            _ => visitor.visit_some(self)
        }
    }

    fn deserialize_seq<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        match self.value {
            ElementValue::Array(arr) => {
                visitor.visit_seq(SeqDeserializer::new(arr.into_iter()))
            }
            // Currently serde does not actually implement visit_bytes and friends, we would
            // need to use serde_bytes for that.
            // TODO: measure if this is very slow
            ElementValue::Bytes(vec) => {
                visitor.visit_seq(SeqDeserializer::new(vec.into_iter()))
            }
            _ => {
                Err(serde::de::Error::custom("Expecting sequence"))
            }
        }
    }

    fn deserialize_struct<V>(
        self,
        name: &'static str,
        fields: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if name == "IdTuple" {
            struct IdTupleMapAccess<I: Iterator<Item=(&'static str, String)>> {
                iter: I,
                value: Option<String>,
            }

            impl<'a, I> MapAccess<'a> for IdTupleMapAccess<I> where I: Iterator<Item=(&'static str, String)> {
                type Error = de::value::Error;

                fn next_key_seed<K>(&mut self, seed: K) -> Result<Option<K::Value>, Self::Error> where K: DeserializeSeed<'a> {
                    match self.iter.next() {
                        Some((key, value)) => {
                            self.value.replace(value);
                            seed.deserialize(key.into_deserializer()).map(Some)
                        }
                        None => Ok(None),
                    }
                }

                fn next_value_seed<V>(&mut self, seed: V) -> Result<V::Value, Self::Error> where V: DeserializeSeed<'a> {
                    match self.value.take() {
                        None => unreachable!(),
                        Some(v) => seed.deserialize(v.into_deserializer()),
                    }
                }
            }
            return if let IdTupleId(IdTuple { list_id, element_id }) = self.value {
                visitor.visit_map(IdTupleMapAccess { iter: [("list_id", list_id), ("element_id", element_id)].into_iter(), value: None })
            } else {
                Err(de::Error::custom("Expecting IdTuple"))
            };
        }
        if let ElementValue::Dict(dict) = self.value {
            let deserializer = ParsedEntityDeserializer::from_parsed_entity(dict);
            deserializer.deserialize_struct(name, fields, visitor)
        } else {
            Err(de::Error::custom("Expecting Dict"))
        }
    }
}

// This impl allows us to use blanket impl for SeqAccess/MapAccess
impl<'de> IntoDeserializer<'de> for ElementValue {
    type Deserializer = ElementValueDeserializer;

    fn into_deserializer(self) -> Self::Deserializer {
        ElementValueDeserializer { value: self }
    }
}

#[cfg(test)]
mod tests {
    use crate::entities::sys::Group;
    use crate::entities::tutanota::MailboxGroupRoot;
    use crate::json_element::RawEntity;
    use crate::json_serializer::JsonSerializer;
    use crate::type_model_provider::init_type_model_provider;

    use super::*;

    #[test]
    fn test_group() {
        let email_string = include_str!("../test_data/group_response.json");
        let parsed_entity = get_parsed_entity::<Group>(email_string);
        let mapper = InstanceMapper::new();
        let group: Group = mapper.parse_entity(parsed_entity).unwrap();
        assert_eq!(5_i64, group.r#type);
        assert_eq!(Some(0_i64), group.adminGroupKeyVersion);
        assert_eq!("LIopQQI--k-0", group.groupInfo.list_id);
    }

    #[test]
    fn test_mailbox_group_root() {
        let email_string = include_str!("../test_data/mailbox_group_root_response.json");
        let parsed_entity = get_parsed_entity::<MailboxGroupRoot>(email_string);
        let mapper = InstanceMapper::new();
        let _group_root: MailboxGroupRoot = mapper.parse_entity(parsed_entity).unwrap();
    }

    fn get_parsed_entity<T: Entity>(email_string: &str) -> ParsedEntity {
        let raw_entity: RawEntity = serde_json::from_str(email_string).unwrap();
        let type_model_provider = init_type_model_provider();
        let json_serializer = JsonSerializer::new(Arc::new(type_model_provider));
        let parsed_entity = json_serializer.parse(&T::type_ref(), raw_entity).unwrap();
        parsed_entity
    }
}