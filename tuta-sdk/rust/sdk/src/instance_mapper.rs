use std::collections::HashMap;
use std::fmt::Display;

use serde::{de, Deserialize, Deserializer, ser, Serialize, Serializer};
use serde::de::{DeserializeSeed, EnumAccess, IntoDeserializer, MapAccess, Unexpected, VariantAccess, Visitor};
use serde::de::value::{MapDeserializer, SeqDeserializer};
use serde::ser::{SerializeSeq, SerializeStruct};
use thiserror::Error;
use crate::custom_id::CustomId;
use crate::date::DateTime;

use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::Entity;
use crate::generated_id::GeneratedId;
use crate::IdTuple;

/// Converter between untyped representations of API Entities and generated structures
pub struct InstanceMapper {}

impl InstanceMapper {
    pub fn new() -> Self {
        InstanceMapper {}
    }
    pub fn parse_entity<'a, T: Entity + Deserialize<'a>>(&self, map: ParsedEntity) -> Result<T, DeError> {
        let de = ParsedEntityDeserializer::from_parsed_entity(map);
        T::deserialize(de).map_err(|e| e.into())
    }

    #[allow(unused)] // TODO: Remove this when implementing mutations for entities
    pub fn serialize_entity<T: Entity + Serialize>(&self, entity: T) -> Result<ParsedEntity, SerError> {
        entity.serialize(ElementValueSerializer).map(|v| v.assert_dict())
    }
}

#[derive(Error, Debug)]
#[error("Error while deserializing entity, {0}")]
pub struct SerError(String);

impl ser::Error for SerError {
    fn custom<T>(msg: T) -> Self where T: Display {
        SerError(msg.to_string())
    }
}

#[derive(Error, Debug)]
#[error("Error while deserializing entity, {0}")]
pub struct DeError(#[from] de::value::Error);

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
        i8 i16 i32 u8 u16 u32 f32 f64 char str bytes
                unit unit_struct newtype_struct tuple
                tuple_struct ignored_any
            }

    fn deserialize_any<V>(self, _: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        Err(de::Error::custom("deserialize_any is not supported!"))
    }

    fn deserialize_u64<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if let ElementValue::Date(date) = self.value {
            visitor.visit_u64(date.as_millis())
        } else {
            Err(de::Error::invalid_type(self.value.as_unexpected(), &"bool"))
        }
    }

    fn deserialize_bool<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if let ElementValue::Bool(bool) = self.value {
            visitor.visit_bool(bool)
        } else {
            Err(de::Error::invalid_type(self.value.as_unexpected(), &"bool"))
        }
    }

    fn deserialize_i64<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if let ElementValue::Number(num) = self.value {
            visitor.visit_i64(num)
        } else {
            Err(de::Error::invalid_type(self.value.as_unexpected(), &"i64"))
        }
    }

    fn deserialize_string<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        return match self.value {
            ElementValue::String(str) => {
                visitor.visit_string(str)
            }
            ElementValue::IdGeneratedId(GeneratedId(id)) | ElementValue::IdCustomId(CustomId(id)) => {
                visitor.visit_string(id)
            }
            _ => {
                Err(de::Error::invalid_type(self.value.as_unexpected(), &"string"))
            }
        };
    }

    fn deserialize_byte_buf<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if let ElementValue::Bytes(bytes) = self.value {
            visitor.visit_byte_buf(bytes)
        } else {
            Err(de::Error::invalid_type(self.value.as_unexpected(), &"bytes"))
        }
    }

    fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        match self.value {
            ElementValue::Null => visitor.visit_none(),
            // We have the same value but the visitor who is driving us will proceed to inner type
            _ => visitor.visit_some(self)
        }
    }

    fn deserialize_seq<V>(self, visitor: V) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if let ElementValue::Array(arr) = self.value {
            visitor.visit_seq(SeqDeserializer::new(arr.into_iter()))
        } else {
            Err(de::Error::invalid_type(self.value.as_unexpected(), &"sequence"))
        }
    }

    fn deserialize_struct<V>(
        self,
        name: &'static str,
        fields: &'static [&'static str],
        visitor: V,
    ) -> Result<V::Value, Self::Error> where V: Visitor<'de> {
        if name == "IdTuple" {
            struct IdTupleMapAccess<I: Iterator<Item=(&'static str, GeneratedId)>> {
                iter: I,
                value: Option<GeneratedId>,
            }

            impl<'a, I> MapAccess<'a> for IdTupleMapAccess<I> where I: Iterator<Item=(&'static str, GeneratedId)> {
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
                        Some(v) => seed.deserialize(String::from(v).into_deserializer()),
                    }
                }
            }
            return if let ElementValue::IdTupleId(IdTuple { list_id, element_id }) = self.value {
                visitor.visit_map(IdTupleMapAccess { iter: [("list_id", list_id), ("element_id", element_id)].into_iter(), value: None })
            } else {
                Err(de::Error::invalid_type(self.value.as_unexpected(), &"idTuple"))
            };
        }
        if let ElementValue::Dict(dict) = self.value {
            let deserializer = ParsedEntityDeserializer::from_parsed_entity(dict);
            deserializer.deserialize_struct(name, fields, visitor)
        } else {
            Err(de::Error::invalid_type(self.value.as_unexpected(), &"dict"))
        }
    }

    fn deserialize_map<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>
    {
        if let ElementValue::Dict(dict) = self.value {
            let deserializer = MapDeserializer::new(dict.into_iter());
            visitor.visit_map(deserializer)
        } else {
            Err(de::Error::invalid_type(self.value.as_unexpected(), &"dict"))
        }
    }

    fn deserialize_enum<V>(self, _: &'static str, _: &'static [&'static str], visitor: V) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>
    {
        visitor.visit_enum(self.value)
    }

    fn deserialize_identifier<V>(self, visitor: V) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>
    {
        visitor.visit_string(self.value.get_type_variant_name().to_owned())
    }
}


impl<'de> EnumAccess<'de> for ElementValue {
    type Error = de::value::Error;
    type Variant = Self;

    fn variant_seed<V>(self, seed: V) -> Result<(V::Value, Self::Variant), Self::Error>
    where
        V: DeserializeSeed<'de>
    {
        let val = seed.deserialize(ElementValueDeserializer { value: self.clone() })?;
        Ok((val, self))
    }
}

impl<'de> VariantAccess<'de> for ElementValue {
    type Error = de::value::Error;

    fn unit_variant(self) -> Result<(), Self::Error> {
        panic!()
    }

    fn newtype_variant_seed<T>(self, seed: T) -> Result<T::Value, Self::Error>
    where
        T: DeserializeSeed<'de>
    {
        seed.deserialize(ElementValueDeserializer { value: self })
    }

    fn tuple_variant<V>(self, _: usize, _: V) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>
    {
        panic!()
    }

    fn struct_variant<V>(self, _: &'static [&'static str], _: V) -> Result<V::Value, Self::Error>
    where
        V: Visitor<'de>
    {
        panic!()
    }
}


// This impl allows us to use blanket impl for SeqAccess/MapAccess
impl<'de> IntoDeserializer<'de> for ElementValue {
    type Deserializer = ElementValueDeserializer;

    fn into_deserializer(self) -> Self::Deserializer {
        ElementValueDeserializer { value: self }
    }
}

/// Serialize Entity into ElementValue variant.
// See serde_json::value::ser for an example.
struct ElementValueSerializer;

enum ElementValueStructSerializer {
    Struct { map: HashMap<String, ElementValue> },
    IdTuple { list_id: Option<GeneratedId>, element_id: Option<GeneratedId> },
}

struct ElementValueSeqSerializer {
    vec: Vec<ElementValue>,
}

impl Serializer for ElementValueSerializer {
    type Ok = ElementValue;
    type Error = SerError;
    type SerializeSeq = ElementValueSeqSerializer;
    type SerializeTuple = ser::Impossible<ElementValue, SerError>;
    type SerializeTupleStruct = ser::Impossible<ElementValue, SerError>;
    type SerializeTupleVariant = ser::Impossible<ElementValue, SerError>;
    type SerializeMap = ser::Impossible<ElementValue, SerError>;
    type SerializeStruct = ElementValueStructSerializer;
    type SerializeStructVariant = ser::Impossible<ElementValue, SerError>;

    fn serialize_bool(self, v: bool) -> Result<Self::Ok, Self::Error> {
        Ok(ElementValue::Bool(v))
    }

    fn serialize_i8(self, _: i8) -> Result<Self::Ok, Self::Error> {
        unsupported("i8")
    }

    fn serialize_i16(self, _: i16) -> Result<Self::Ok, Self::Error> {
        unsupported("i16")
    }

    fn serialize_i32(self, _: i32) -> Result<Self::Ok, Self::Error> {
        unsupported("i32")
    }

    fn serialize_i64(self, v: i64) -> Result<Self::Ok, Self::Error> {
        Ok(ElementValue::Number(v))
    }

    fn serialize_u8(self, _: u8) -> Result<Self::Ok, Self::Error> {
        unsupported("u8")
    }

    fn serialize_u16(self, _: u16) -> Result<Self::Ok, Self::Error> {
        unsupported("u16")
    }

    fn serialize_u32(self, v: u32) -> Result<Self::Ok, Self::Error> {
        Ok(ElementValue::Number(v as i64))
    }

    fn serialize_u64(self, v: u64) -> Result<Self::Ok, Self::Error> {
        Ok(ElementValue::Number(v as i64))
    }

    fn serialize_f32(self, _: f32) -> Result<Self::Ok, Self::Error> {
        unsupported("f32")
    }

    fn serialize_f64(self, _: f64) -> Result<Self::Ok, Self::Error> {
        unsupported("f64")
    }

    fn serialize_char(self, _: char) -> Result<Self::Ok, Self::Error> {
        unsupported("char")
    }

    fn serialize_str(self, v: &str) -> Result<Self::Ok, Self::Error> {
        Ok(ElementValue::String(v.to_string()))
    }

    fn serialize_bytes(self, v: &[u8]) -> Result<Self::Ok, Self::Error> {
        Ok(ElementValue::Bytes(v.into()))
    }

    fn serialize_none(self) -> Result<Self::Ok, Self::Error> {
        Ok(ElementValue::Null)
    }

    fn serialize_some<T>(self, value: &T) -> Result<Self::Ok, Self::Error> where T: ?Sized + Serialize {
        value.serialize(self)
    }

    fn serialize_unit(self) -> Result<Self::Ok, Self::Error> {
        unsupported("unit")
    }

    fn serialize_unit_struct(self, _: &'static str) -> Result<Self::Ok, Self::Error> {
        unsupported("unit_struct")
    }

    fn serialize_unit_variant(self, _: &'static str, _: u32, _: &'static str) -> Result<Self::Ok, Self::Error> {
        unsupported("serialize_unit_variant")
    }

    fn serialize_newtype_struct<T>(self, name: &'static str, value: &T) -> Result<Self::Ok, Self::Error> where T: ?Sized + Serialize {
        match name {
            "GeneratedId" => {
                let Ok(ElementValue::String(id_string)) = value.serialize(self) else {
                    unreachable!();
                };
                Ok(ElementValue::IdGeneratedId(GeneratedId(id_string)))
            }
            "CustomId" => {
                let Ok(ElementValue::String(id_string)) = value.serialize(self) else {
                    unreachable!();
                };
                Ok(ElementValue::IdCustomId(CustomId(id_string)))
            }
            "Date" => {
                let Ok(ElementValue::Number(timestamp)) = value.serialize(self) else {
                    unreachable!();
                };
                Ok(ElementValue::Date(DateTime::from_millis(timestamp as u64)))
            }
            other => unsupported(other)
        }
    }

    fn serialize_newtype_variant<T>(self, _: &'static str, _: u32, _: &'static str, _: &T) -> Result<Self::Ok, Self::Error> where T: ?Sized + Serialize {
        unsupported("newtype_variant")
    }

    fn serialize_seq(self, len: Option<usize>) -> Result<Self::SerializeSeq, Self::Error> {
        let vec = match len {
            None => Vec::new(),
            Some(l) => Vec::with_capacity(l),
        };
        Ok(ElementValueSeqSerializer { vec })
    }

    fn serialize_tuple(self, _: usize) -> Result<Self::SerializeTuple, Self::Error> {
        unsupported("len")
    }

    fn serialize_tuple_struct(self, _: &'static str, _: usize) -> Result<Self::SerializeTupleStruct, Self::Error> {
        unsupported("tuple_struct")
    }

    fn serialize_tuple_variant(self, _: &'static str, _: u32, _: &'static str, _: usize) -> Result<Self::SerializeTupleVariant, Self::Error> {
        unsupported("tuple_variant")
    }

    fn serialize_map(self, _: Option<usize>) -> Result<Self::SerializeMap, Self::Error> {
        unsupported("map")
    }

    fn serialize_struct(self, name: &'static str, len: usize) -> Result<Self::SerializeStruct, Self::Error> {
        if name == "IdTuple" {
            Ok(ElementValueStructSerializer::IdTuple { list_id: None, element_id: None })
        } else {
            Ok(ElementValueStructSerializer::Struct { map: HashMap::with_capacity(len) })
        }
    }

    fn serialize_struct_variant(self, _: &'static str, _: u32, _: &'static str, _: usize) -> Result<Self::SerializeStructVariant, Self::Error> {
        unsupported("struct_variant")
    }
}

fn unsupported(data_type: &str) -> ! {
    panic!("Unsupported data type: {}", data_type)
}

impl SerializeSeq for ElementValueSeqSerializer {
    type Ok = ElementValue;
    type Error = SerError;

    fn serialize_element<T>(&mut self, value: &T) -> Result<(), Self::Error> where T: ?Sized + Serialize {
        self.vec.push(value.serialize(ElementValueSerializer)?);
        Ok(())
    }

    fn end(self) -> Result<Self::Ok, Self::Error> {
        Ok(ElementValue::Array(self.vec))
    }
}

impl SerializeStruct for ElementValueStructSerializer {
    type Ok = ElementValue;
    type Error = SerError;

    fn serialize_field<T>(&mut self, key: &'static str, value: &T) -> Result<(), Self::Error> where T: ?Sized + Serialize {
        match self {
            Self::Struct { map } => {
                if key == "errors" {
                    // Throw decryption errors away since they are not part of the actual type.
                    return Ok(())
                }
                map.insert(key.to_string(), value.serialize(ElementValueSerializer)?);
            }
            Self::IdTuple { list_id, element_id } => match key {
                "list_id" => *list_id = Some(value.serialize(ElementValueSerializer)?.assert_generated_id().to_owned()),
                "element_id" => *element_id = Some(value.serialize(ElementValueSerializer)?.assert_generated_id().to_owned()),
                _ => unreachable!("unexpected key {key} for IdTuple", key = key)
            },
        };
        Ok(())
    }

    fn end(self) -> Result<Self::Ok, Self::Error> {
        match self {
            Self::Struct { map } => Ok(ElementValue::Dict(map)),
            Self::IdTuple { list_id, element_id } => {
                Ok(ElementValue::IdTupleId(IdTuple { list_id: list_id.unwrap(), element_id: element_id.unwrap() }))
            }
        }
    }
}

impl ElementValue {
    fn as_unexpected(&self) -> Unexpected {
        match self {
            ElementValue::Null => Unexpected::Other("null"),
            ElementValue::String(v) => Unexpected::Str(v),
            ElementValue::Number(v) => Unexpected::Signed(*v),
            ElementValue::Bytes(v) => Unexpected::Bytes(v.as_slice()),
            ElementValue::Date(_) => Unexpected::Other("Date"),
            ElementValue::Bool(v) => Unexpected::Bool(*v),
            ElementValue::IdGeneratedId(_) => Unexpected::Other("GeneratedId"),
            ElementValue::IdCustomId(_) => Unexpected::Other("CustomId"),
            ElementValue::IdTupleId(_) => Unexpected::Other("IdTuple"),
            ElementValue::Dict(_) => Unexpected::Map,
            ElementValue::Array(_) => Unexpected::Seq
        }
    }
}

#[cfg(test)]
mod tests {
    use crate::entities::sys::{Group, GroupInfo};
    use crate::entities::tutanota::{MailboxGroupRoot, OutOfOfficeNotificationRecipientList};
    use crate::json_element::RawEntity;
    use crate::json_serializer::JsonSerializer;
    use crate::type_model_provider::init_type_model_provider;
    use std::sync::Arc;
    use crate::generated_id::GeneratedId;
    use crate::util::test_utils::generate_random_group;

    use super::*;

    #[test]
    fn test_de_group() {
        let json = include_str!("../test_data/group_response.json");
        let parsed_entity = get_parsed_entity::<Group>(json);
        let mapper = InstanceMapper::new();
        let group: Group = mapper.parse_entity(parsed_entity).unwrap();
        assert_eq!(5_i64, group.r#type);
        assert_eq!(Some(0_i64), group.adminGroupKeyVersion);
        assert_eq!("LIopQQI--k-0", group.groupInfo.list_id.as_str());
    }

    #[test]
    fn test_de_group_info() {
        let json = include_str!("../test_data/group_info_response.json");
        let mut parsed_entity = get_parsed_entity::<GroupInfo>(json);
        // this is encrypted, so we can't actually deserialize it without replacing it with a decrypted version
        parsed_entity.insert("name".to_owned(), ElementValue::String("some string".to_owned()));
        let mapper = InstanceMapper::new();
        let group_info: GroupInfo = mapper.parse_entity(parsed_entity).unwrap();
        assert_eq!(DateTime::from_millis(1533116004052), group_info.created);
    }

    #[test]
    fn test_de_error() {
        let parsed_entity = [("_id".to_owned(), ElementValue::Number(2))].into();
        let mapper = InstanceMapper::new();
        let group = mapper.parse_entity::<Group>(parsed_entity);
        assert_eq!(true, group.is_err());
    }

    #[test]
    fn test_de_mailbox_group_root() {
        let json = include_str!("../test_data/mailbox_group_root_response.json");
        let parsed_entity = get_parsed_entity::<MailboxGroupRoot>(json);
        let mapper = InstanceMapper::new();
        let _group_root: MailboxGroupRoot = mapper.parse_entity(parsed_entity).unwrap();
    }

    #[test]
    fn test_ser_mailbox_group_root() {
        let group_root = MailboxGroupRoot {
            _format: 0,
            _id: GeneratedId::test_random(),
            _ownerGroup: None,
            _permissions: GeneratedId::test_random(),
            calendarEventUpdates: None,
            mailbox: GeneratedId::test_random(),
            mailboxProperties: None,
            outOfOfficeNotification: None,
            outOfOfficeNotificationRecipientList: Some(OutOfOfficeNotificationRecipientList {
                _id: CustomId::test_random(),
                list: GeneratedId::test_random(),
            }),
            serverProperties: GeneratedId::test_random(),
            whitelistRequests: GeneratedId::test_random(),
        };
        let mapper = InstanceMapper::new();
        let result = mapper.serialize_entity(group_root.clone()).unwrap();
        assert_eq!(&ElementValue::Number(0), result.get("_format").unwrap());
    }

    #[test]
    fn test_ser_group() {
        let group_root = generate_random_group(None, None);
        let mapper = InstanceMapper::new();
        let result = mapper.serialize_entity(group_root.clone()).unwrap();
        assert_eq!(&ElementValue::Number(0), result.get("_format").unwrap());
        assert_eq!(&ElementValue::Bytes(vec![1, 2, 3]), result.get("pubAdminGroupEncGKey").unwrap())
    }

    #[test]
    fn test_ser_group_info() {
        let group_info = GroupInfo {
            _format: 0,
            _id: IdTuple::new(GeneratedId::test_random(), GeneratedId::test_random()),
            _ownerEncSessionKey: None,
            _listEncSessionKey: None,
            _ownerGroup: None,
            _ownerKeyVersion: None,
            _permissions: GeneratedId::test_random(),
            created: DateTime::from_millis(1533116004052),
            deleted: None,
            groupType: None,
            mailAddress: None,
            name: "encName".to_owned(),
            group: GeneratedId::test_random(),
            localAdmin: None,
            mailAddressAliases: vec![],
            errors: Default::default(),
        };
        let mapper = InstanceMapper::new();
        let parsed_entity = mapper.serialize_entity(group_info).unwrap();

        assert_eq!(ElementValue::Date(DateTime::from_millis(1533116004052)), *parsed_entity.get("created").unwrap());
    }

    fn get_parsed_entity<T: Entity>(email_string: &str) -> ParsedEntity {
        let raw_entity: RawEntity = serde_json::from_str(email_string).unwrap();
        let type_model_provider = init_type_model_provider();
        let json_serializer = JsonSerializer::new(Arc::new(type_model_provider));
        let parsed_entity = json_serializer.parse(&T::type_ref(), raw_entity).unwrap();
        parsed_entity
    }
}
