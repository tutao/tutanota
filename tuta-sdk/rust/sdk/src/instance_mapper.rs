use std::collections::HashMap;
use std::fmt::Display;

use serde::de::{
	DeserializeSeed, EnumAccess, IntoDeserializer, MapAccess, Unexpected, VariantAccess, Visitor,
};
use serde::ser::{Error, Impossible, SerializeMap, SerializeSeq, SerializeStruct};
use serde::{de, ser, Deserialize, Deserializer, Serialize, Serializer};
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
	pub fn parse_entity<'a, T: Entity + Deserialize<'a>>(
		&self,
		map: ParsedEntity,
	) -> Result<T, DeError> {
		let de = DictionaryDeserializer::from_iterable(map);
		T::deserialize(de)
	}

	pub fn serialize_entity<T: Entity + Serialize>(
		&self,
		entity: T,
	) -> Result<ParsedEntity, SerError> {
		entity
			.serialize(ElementValueSerializer)
			.map(|v| v.assert_dict())
	}
}

#[derive(Error, Debug)]
#[error("Entity serialization error: {0}")]
pub struct SerError(String);

impl ser::Error for SerError {
	fn custom<T>(msg: T) -> Self
	where
		T: Display,
	{
		SerError(msg.to_string())
	}
}

#[derive(Error, Debug)]
#[error("Entity deserialization error: {0}")]
pub struct DeError(String);

impl DeError {
	fn wrong_type(key: &str, value: &ElementValue, expected: &str) -> Self {
		Self(format!(
			"Invalid type at {key}: Expected: {expected}, got: {}",
			value.as_unexpected()
		))
	}
}

impl de::Error for DeError {
	fn custom<T>(msg: T) -> Self
	where
		T: Display,
	{
		Self(msg.to_string())
	}
}

/// (De)Serialization consist of two parts:
///  - (De)Serialize (how to write this type to an arbitrary data format)
///  - (De)Serializer (how to write arbitrary data to a specific data format)
///
/// Serde generates (De)Serialize implementations for our generated Entity's.
///
/// We implement the other half, custom "data format",
/// the same way as serde_json maps types to/from json we map them
/// to/from ParsedEntity.
///
/// This is a map/dictionary serializer.
/// It is used for the top-level (because we have a map and not ElementValue as input), for
/// nested aggregates and for "errors" map.
struct DictionaryDeserializer<I>
where
	I: Iterator<Item = (String, ElementValue)>,
{
	iter: I,
	value: Option<(String, ElementValue)>,
}

impl<I> DictionaryDeserializer<I>
where
	I: Iterator<Item = (String, ElementValue)>,
{
	// We accept iterable and not a map because we have to give iterator a specific type but we
	// need to let the compiler infer it from the signature.
	fn from_iterable<II>(iterable: II) -> DictionaryDeserializer<I>
	where
		II: IntoIterator<Item = (String, ElementValue), IntoIter = I>,
	{
		DictionaryDeserializer {
			iter: iterable.into_iter(),
			value: None,
		}
	}
}

impl<'de, I> Deserializer<'de> for DictionaryDeserializer<I>
where
	I: Iterator<Item = (String, ElementValue)>,
{
	type Error = DeError;

	serde::forward_to_deserialize_any! {
		bool i8 i16 i32 i64 u8 u16 u32 u64 f32 f64 char str string bytes
		byte_buf option unit unit_struct newtype_struct seq tuple
		tuple_struct map enum identifier ignored_any
	}

	fn deserialize_any<V>(self, _: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		Err(de::Error::custom("deserialize_any is not supported!"))
	}

	fn deserialize_struct<V>(
		self,
		_: &'static str,
		_: &'static [&'static str],
		visitor: V,
	) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		visitor.visit_map(self)
	}
}

impl<'de, I> MapAccess<'de> for DictionaryDeserializer<I>
where
	I: Iterator<Item = (String, ElementValue)>,
{
	type Error = DeError;

	fn next_key_seed<K>(&mut self, seed: K) -> Result<Option<K::Value>, Self::Error>
	where
		K: DeserializeSeed<'de>,
	{
		match self.iter.next() {
			Some((k, v)) => {
				let result = seed.deserialize(k.as_str().into_deserializer());
				self.value = Some((k, v));
				result.map(Some)
			},
			None => Ok(None),
		}
	}

	fn next_value_seed<V>(&mut self, seed: V) -> Result<V::Value, Self::Error>
	where
		V: DeserializeSeed<'de>,
	{
		let (key, value) = self.value.take().expect("next_key must be called first!");
		let deserializer = ElementValueDeserializer {
			key: key.as_str(),
			value,
		};
		seed.deserialize(deserializer)
	}

	fn next_entry_seed<K, V>(
		&mut self,
		kseed: K,
		vseed: V,
	) -> Result<Option<(K::Value, V::Value)>, Self::Error>
	where
		K: DeserializeSeed<'de>,
		V: DeserializeSeed<'de>,
	{
		match self.iter.next() {
			Some((key, value)) => {
				let key_result = kseed.deserialize(key.as_str().into_deserializer())?;
				let value_result = vseed.deserialize(ElementValueDeserializer {
					key: key.as_str(),
					value,
				})?;
				Ok(Some((key_result, value_result)))
			},
			None => Ok(None),
		}
	}

	fn size_hint(&self) -> Option<usize> {
		// taken from serde::de::size_hint
		match self.iter.size_hint() {
			(lower, Some(upper)) if lower == upper => Some(upper),
			_ => None,
		}
	}
}

/// Deserializer for a single ElementValue.
struct ElementValueDeserializer<'s> {
	/// Key for which we are deserializing the value. Useful for diagnostics.
	key: &'s str,
	/// The value being deserialized
	value: ElementValue,
}

impl<'s> ElementValueDeserializer<'s> {
	fn wrong_type_err(&self, expected: &str) -> DeError {
		DeError::wrong_type(self.key, &self.value, expected)
	}
}

impl<'de, 's> Deserializer<'de> for ElementValueDeserializer<'s> {
	type Error = DeError;

	serde::forward_to_deserialize_any! {
	i8 i16 i32 u8 u16 u32 f32 f64 char str bytes
			unit unit_struct newtype_struct tuple
			tuple_struct ignored_any
		}

	fn deserialize_any<V>(self, _: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		let type_name = self.value.type_variant_name();
		Err(de::Error::custom(format_args!(
			"deserialize_any is not supported! key: `{}`, value type: `{type_name}`",
			self.key
		)))
	}

	fn deserialize_u64<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		if let ElementValue::Date(date) = self.value {
			visitor.visit_u64(date.as_millis())
		} else {
			Err(self.wrong_type_err("u64"))
		}
	}

	fn deserialize_bool<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		if let ElementValue::Bool(bool) = self.value {
			visitor.visit_bool(bool)
		} else {
			Err(self.wrong_type_err("bool"))
		}
	}

	fn deserialize_i64<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		if let ElementValue::Number(num) = self.value {
			visitor.visit_i64(num)
		} else {
			Err(self.wrong_type_err("i64"))
		}
	}

	fn deserialize_string<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		return match self.value {
			ElementValue::String(str) => visitor.visit_string(str),
			ElementValue::IdGeneratedId(GeneratedId(id))
			| ElementValue::IdCustomId(CustomId(id)) => visitor.visit_string(id),
			_ => Err(self.wrong_type_err("string")),
		};
	}

	fn deserialize_byte_buf<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		if let ElementValue::Bytes(bytes) = self.value {
			visitor.visit_byte_buf(bytes)
		} else {
			Err(self.wrong_type_err("bytes"))
		}
	}

	fn deserialize_option<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		match self.value {
			ElementValue::Null => visitor.visit_none(),
			// We have the same value but the visitor who is driving us will proceed to inner type
			_ => visitor.visit_some(self),
		}
	}

	fn deserialize_seq<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		if let ElementValue::Array(arr) = self.value {
			visitor.visit_seq(ArrayDeserializer {
				key: self.key,
				iter: arr.into_iter(),
			})
		} else {
			Err(self.wrong_type_err("sequence"))
		}
	}

	fn deserialize_struct<V>(
		self,
		name: &'static str,
		fields: &'static [&'static str],
		visitor: V,
	) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		if name == "IdTuple" {
			struct IdTupleMapAccess<I: Iterator<Item = (&'static str, GeneratedId)>> {
				iter: I,
				value: Option<GeneratedId>,
			}

			impl<'a, I> MapAccess<'a> for IdTupleMapAccess<I>
			where
				I: Iterator<Item = (&'static str, GeneratedId)>,
			{
				type Error = DeError;

				fn next_key_seed<K>(&mut self, seed: K) -> Result<Option<K::Value>, Self::Error>
				where
					K: DeserializeSeed<'a>,
				{
					match self.iter.next() {
						Some((key, value)) => {
							self.value.replace(value);
							seed.deserialize(key.into_deserializer()).map(Some)
						},
						None => Ok(None),
					}
				}

				fn next_value_seed<V>(&mut self, seed: V) -> Result<V::Value, Self::Error>
				where
					V: DeserializeSeed<'a>,
				{
					match self.value.take() {
						None => unreachable!(),
						Some(v) => seed.deserialize(String::from(v).into_deserializer()),
					}
				}
			}
			return if let ElementValue::IdTupleId(IdTuple {
				list_id,
				element_id,
			}) = self.value
			{
				visitor.visit_map(IdTupleMapAccess {
					iter: [("list_id", list_id), ("element_id", element_id)].into_iter(),
					value: None,
				})
			} else {
				Err(self.wrong_type_err("IdTuple"))
			};
		}
		if let ElementValue::Dict(dict) = self.value {
			let deserializer = DictionaryDeserializer::from_iterable(dict);
			deserializer.deserialize_struct(name, fields, visitor)
		} else {
			Err(self.wrong_type_err("dict"))
		}
	}

	fn deserialize_map<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		if let ElementValue::Dict(dict) = self.value {
			let de = DictionaryDeserializer::from_iterable(dict);
			visitor.visit_map(de)
		} else {
			Err(self.wrong_type_err("dict"))
		}
	}

	fn deserialize_enum<V>(
		self,
		_: &'static str,
		_: &'static [&'static str],
		visitor: V,
	) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		visitor.visit_enum(self)
	}

	fn deserialize_identifier<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		visitor.visit_str(self.value.type_variant_name())
	}
}

impl<'de, 's> EnumAccess<'de> for ElementValueDeserializer<'s> {
	type Error = DeError;
	type Variant = Self;

	fn variant_seed<V>(self, seed: V) -> Result<(V::Value, Self::Variant), Self::Error>
	where
		V: DeserializeSeed<'de>,
	{
		let discriminator_de = self.value.type_variant_name().into_deserializer();
		let val = seed.deserialize(discriminator_de)?;
		Ok((val, self))
	}
}

impl<'de, 's> VariantAccess<'de> for ElementValueDeserializer<'s> {
	type Error = DeError;

	fn unit_variant(self) -> Result<(), Self::Error> {
		unimplemented!()
	}

	fn newtype_variant_seed<T>(self, seed: T) -> Result<T::Value, Self::Error>
	where
		T: DeserializeSeed<'de>,
	{
		seed.deserialize(self)
	}

	fn tuple_variant<V>(self, _: usize, _: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		unimplemented!()
	}

	fn struct_variant<V>(self, _: &'static [&'static str], _: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		unimplemented!()
	}
}

/// Deserializer for sequence of elements (like an array or vec).
struct ArrayDeserializer<'s, I>
where
	I: Iterator<Item = ElementValue>,
{
	/// Key under which the entities are. Will be passed to the deserializer for elements.
	key: &'s str,
	iter: I,
}

impl<'de, I> Deserializer<'de> for ArrayDeserializer<'de, I>
where
	I: Iterator<Item = ElementValue>,
{
	type Error = DeError;

	serde::forward_to_deserialize_any! {
		bool i8 i16 i32 i64 u8 u16 u32 u64 f32 f64 char str string bytes
		byte_buf option unit unit_struct newtype_struct tuple
		tuple_struct map struct enum identifier ignored_any
	}

	fn deserialize_any<V>(self, _: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		unimplemented!("not an array")
	}

	fn deserialize_seq<V>(mut self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		visitor.visit_seq(&mut self)
	}
}

impl<'de, 's, I> de::SeqAccess<'de> for ArrayDeserializer<'s, I>
where
	I: Iterator<Item = ElementValue>,
{
	type Error = DeError;

	fn next_element_seed<T>(&mut self, seed: T) -> Result<Option<T::Value>, Self::Error>
	where
		T: DeserializeSeed<'de>,
	{
		match self.iter.next() {
			Some(value) => seed
				.deserialize(ElementValueDeserializer {
					value,
					key: self.key,
				})
				.map(Some),
			None => Ok(None),
		}
	}

	fn size_hint(&self) -> Option<usize> {
		// taken from serde::de::size_hint
		match self.iter.size_hint() {
			(lower, Some(upper)) if lower == upper => Some(upper),
			_ => None,
		}
	}
}

/// Serialize Entity into ElementValue variant.
// See serde_json::value::ser for an example.
struct ElementValueSerializer;

enum ElementValueStructSerializer {
	Struct {
		map: HashMap<String, ElementValue>,
	},
	IdTuple {
		list_id: Option<GeneratedId>,
		element_id: Option<GeneratedId>,
	},
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
	type SerializeMap = ElementValueMapSerializer;
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

	fn serialize_some<T>(self, value: &T) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		value.serialize(self)
	}

	fn serialize_unit(self) -> Result<Self::Ok, Self::Error> {
		unsupported("unit")
	}

	fn serialize_unit_struct(self, _: &'static str) -> Result<Self::Ok, Self::Error> {
		unsupported("unit_struct")
	}

	fn serialize_unit_variant(
		self,
		_: &'static str,
		_: u32,
		_: &'static str,
	) -> Result<Self::Ok, Self::Error> {
		unsupported("serialize_unit_variant")
	}

	fn serialize_newtype_struct<T>(
		self,
		name: &'static str,
		value: &T,
	) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		match name {
			crate::generated_id::GENERATED_ID_STRUCT_NAME => {
				let Ok(ElementValue::String(id_string)) = value.serialize(self) else {
					unreachable!("should've serialized GeneratedId as a string");
				};
				Ok(ElementValue::IdGeneratedId(GeneratedId(id_string)))
			},
			crate::custom_id::CUSTOM_ID_STRUCT_NAME => {
				let Ok(ElementValue::String(id_string)) = value.serialize(self) else {
					unreachable!("should've serialized CustomId as a string");
				};
				Ok(ElementValue::IdCustomId(CustomId(id_string)))
			},
			crate::date::DATETIME_STRUCT_NAME => {
				let Ok(ElementValue::Number(timestamp)) = value.serialize(self) else {
					unreachable!("should've serialized DateTime as a number");
				};
				// converting signed to unsigned can have strange results if negative
				let Ok(timestamp) = u64::try_from(timestamp) else {
					return Err(Self::Error::custom(format_args!(
						"timestamp {timestamp} was negative"
					)));
				};
				Ok(ElementValue::Date(DateTime::from_millis(timestamp)))
			},
			other => unsupported(other),
		}
	}

	fn serialize_newtype_variant<T>(
		self,
		_: &'static str,
		_: u32,
		_: &'static str,
		_: &T,
	) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
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

	fn serialize_tuple_struct(
		self,
		_: &'static str,
		_: usize,
	) -> Result<Self::SerializeTupleStruct, Self::Error> {
		unsupported("tuple_struct")
	}

	fn serialize_tuple_variant(
		self,
		_: &'static str,
		_: u32,
		_: &'static str,
		_: usize,
	) -> Result<Self::SerializeTupleVariant, Self::Error> {
		unsupported("tuple_variant")
	}

	fn serialize_map(self, _: Option<usize>) -> Result<Self::SerializeMap, Self::Error> {
		Ok(ElementValueMapSerializer {
			map: HashMap::new(),
			next_key: None,
		})
	}

	fn serialize_struct(
		self,
		name: &'static str,
		len: usize,
	) -> Result<Self::SerializeStruct, Self::Error> {
		if name == "IdTuple" {
			Ok(ElementValueStructSerializer::IdTuple {
				list_id: None,
				element_id: None,
			})
		} else {
			Ok(ElementValueStructSerializer::Struct {
				map: HashMap::with_capacity(len),
			})
		}
	}

	fn serialize_struct_variant(
		self,
		_: &'static str,
		_: u32,
		_: &'static str,
		_: usize,
	) -> Result<Self::SerializeStructVariant, Self::Error> {
		unsupported("struct_variant")
	}
}

fn unsupported(data_type: &str) -> ! {
	panic!("Unsupported data type: {}", data_type)
}

impl SerializeSeq for ElementValueSeqSerializer {
	type Ok = ElementValue;
	type Error = SerError;

	fn serialize_element<T>(&mut self, value: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
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

	fn serialize_field<T>(&mut self, key: &'static str, value: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		match self {
			Self::Struct { map } => {
				if key == "_errors" {
					// Throw decryption errors away since they are not part of the actual type.
					return Ok(());
				}
				map.insert(key.to_string(), value.serialize(ElementValueSerializer)?);
			},
			Self::IdTuple {
				list_id,
				element_id,
			} => match key {
				"list_id" => {
					*list_id = Some(
						value
							.serialize(ElementValueSerializer)?
							.assert_generated_id()
							.to_owned(),
					)
				},
				"element_id" => {
					*element_id = Some(
						value
							.serialize(ElementValueSerializer)?
							.assert_generated_id()
							.to_owned(),
					)
				},
				_ => unreachable!("unexpected key {key} for IdTuple", key = key),
			},
		};
		Ok(())
	}

	fn end(self) -> Result<Self::Ok, Self::Error> {
		match self {
			Self::Struct { map } => Ok(ElementValue::Dict(map)),
			Self::IdTuple {
				list_id,
				element_id,
			} => Ok(ElementValue::IdTupleId(IdTuple {
				list_id: list_id.unwrap(),
				element_id: element_id.unwrap(),
			})),
		}
	}
}

/// Yet Another Serializer, this one serializes a map with dynamic keys.
struct ElementValueMapSerializer {
	next_key: Option<String>,
	map: HashMap<String, ElementValue>,
}

impl SerializeMap for ElementValueMapSerializer {
	type Ok = ElementValue;
	type Error = SerError;

	fn serialize_key<T>(&mut self, key: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		self.next_key = Some(key.serialize(MapKeySerializer)?);
		Ok(())
	}

	fn serialize_value<T>(&mut self, value: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		let key = self.next_key.take().expect("key must be serialized first");
		self.map
			.insert(key, value.serialize(ElementValueSerializer)?);
		Ok(())
	}

	fn end(self) -> Result<Self::Ok, Self::Error> {
		Ok(ElementValue::Dict(self.map))
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
			ElementValue::Array(_) => Unexpected::Seq,
		}
	}
}

/// Yet Another Serializer, this one serializes a single string
struct MapKeySerializer;

impl Serializer for MapKeySerializer {
	type Ok = String;
	type Error = SerError;
	type SerializeSeq = Impossible<String, SerError>;
	type SerializeTuple = Impossible<String, SerError>;
	type SerializeTupleStruct = Impossible<String, SerError>;
	type SerializeTupleVariant = Impossible<String, SerError>;
	type SerializeMap = Impossible<String, SerError>;
	type SerializeStruct = Impossible<String, SerError>;
	type SerializeStructVariant = Impossible<String, SerError>;

	fn serialize_bool(self, _: bool) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_i8(self, _: i8) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_i16(self, _: i16) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_i32(self, _: i32) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_i64(self, _: i64) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_u8(self, _: u8) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_u16(self, _: u16) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_u32(self, _: u32) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_u64(self, _: u64) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_f32(self, _: f32) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_f64(self, _: f64) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_char(self, _: char) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_str(self, v: &str) -> Result<Self::Ok, Self::Error> {
		Ok(v.to_owned())
	}

	fn serialize_bytes(self, _: &[u8]) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_none(self) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_some<T>(self, _: &T) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		unreachable!()
	}

	fn serialize_unit(self) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_unit_struct(self, _: &'static str) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_unit_variant(
		self,
		_: &'static str,
		_: u32,
		_: &'static str,
	) -> Result<Self::Ok, Self::Error> {
		unreachable!()
	}

	fn serialize_newtype_struct<T>(self, _: &'static str, _: &T) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		unreachable!()
	}

	fn serialize_newtype_variant<T>(
		self,
		_: &'static str,
		_: u32,
		_: &'static str,
		_: &T,
	) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		unreachable!()
	}

	fn serialize_seq(self, _: Option<usize>) -> Result<Self::SerializeSeq, Self::Error> {
		unreachable!()
	}

	fn serialize_tuple(self, _: usize) -> Result<Self::SerializeTuple, Self::Error> {
		unreachable!()
	}

	fn serialize_tuple_struct(
		self,
		_: &'static str,
		_: usize,
	) -> Result<Self::SerializeTupleStruct, Self::Error> {
		unreachable!()
	}

	fn serialize_tuple_variant(
		self,
		_: &'static str,
		_: u32,
		_: &'static str,
		_: usize,
	) -> Result<Self::SerializeTupleVariant, Self::Error> {
		unreachable!()
	}

	fn serialize_map(self, _: Option<usize>) -> Result<Self::SerializeMap, Self::Error> {
		unreachable!()
	}

	fn serialize_struct(
		self,
		_: &'static str,
		_: usize,
	) -> Result<Self::SerializeStruct, Self::Error> {
		unreachable!()
	}

	fn serialize_struct_variant(
		self,
		_: &'static str,
		_: u32,
		_: &'static str,
		_: usize,
	) -> Result<Self::SerializeStructVariant, Self::Error> {
		unreachable!()
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::crypto_facade::CryptoProtocolVersion;
	use crate::entities::sys::{Group, GroupInfo};
	use crate::entities::tutanota::{
		Mail, MailboxGroupRoot, OutOfOfficeNotification, OutOfOfficeNotificationRecipientList,
	};
	use crate::generated_id::GeneratedId;
	use crate::json_element::RawEntity;
	use crate::json_serializer::JsonSerializer;
	use crate::tutanota_constants::PublicKeyIdentifierType;
	use crate::type_model_provider::init_type_model_provider;
	use crate::util::test_utils::{create_test_entity, generate_random_group};
	use crate::TypeRef;
	use std::sync::Arc;

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
		parsed_entity.insert(
			"name".to_owned(),
			ElementValue::String("some string".to_owned()),
		);
		let mapper = InstanceMapper::new();
		let group_info: GroupInfo = mapper.parse_entity(parsed_entity).unwrap();
		assert_eq!(DateTime::from_millis(1533116004052), group_info.created);
	}

	#[test]
	fn test_de_error_wrong_type() {
		let parsed_entity = [("_id".to_owned(), ElementValue::Number(2))].into();
		let mapper = InstanceMapper::new();
		let group_result = mapper.parse_entity::<Group>(parsed_entity);
		let err = group_result.unwrap_err();
		assert!(
			err.to_string().contains("_id"),
			"error message should contain _id"
		)
	}

	#[test]
	fn test_de_error_missing_key() {
		let parsed_entity = [(
			"_id".to_owned(),
			ElementValue::IdGeneratedId(GeneratedId("id".to_owned())),
		)]
		.into();
		let mapper = InstanceMapper::new();
		let group_result = mapper.parse_entity::<Group>(parsed_entity);
		assert!(group_result.is_err(), "result is an err");
		let e = group_result.unwrap_err().to_string();
		assert!(
			e.contains("missing field"),
			"error message should contain missing field"
		);
	}

	#[test]
	fn test_de_mailbox_group_root() {
		let json = include_str!("../test_data/mailbox_group_root_response.json");
		let parsed_entity = get_parsed_entity::<MailboxGroupRoot>(json);
		let mapper = InstanceMapper::new();
		let _group_root: MailboxGroupRoot = mapper.parse_entity(parsed_entity).unwrap();
	}

	#[test]
	fn test_de_out_of_office_notification() {
		let parsed_entity: ParsedEntity = HashMap::from_iter(
			[
				("_format", ElementValue::Number(0)),
				(
					"_id",
					ElementValue::IdGeneratedId(GeneratedId("id".to_owned())),
				),
				("_ownerGroup", ElementValue::Null),
				(
					"_permissions",
					ElementValue::IdGeneratedId(GeneratedId("permissions".to_owned())),
				),
				("enabled", ElementValue::Bool(true)),
				(
					"endDate",
					ElementValue::Date(DateTime::from_millis(1723193495816)),
				),
				("startDate", ElementValue::Null),
				("notifications", ElementValue::Array(vec![])),
			]
			.into_iter()
			.map(|(k, v)| (k.to_owned(), v)),
		);
		let result: OutOfOfficeNotification =
			InstanceMapper::new().parse_entity(parsed_entity).unwrap();
		assert_eq!(Some(DateTime::from_millis(1723193495816)), result.endDate)
	}

	#[test]
	fn test_de_map() {
		#[allow(dead_code)]
		#[derive(Deserialize)]
		struct StructWithErrors {
			_errors: HashMap<String, ElementValue>,
		}

		impl Entity for StructWithErrors {
			fn type_ref() -> TypeRef {
				unimplemented!("type_ref")
			}
		}

		let data = HashMap::from_iter([(
			"_errors".to_owned(),
			ElementValue::Dict(HashMap::from_iter([
				(
					"first".to_owned(),
					ElementValue::String("Outer error".to_owned()),
				),
				(
					"second".to_owned(),
					ElementValue::Dict(HashMap::from_iter([(
						"nested".to_owned(),
						ElementValue::String("Nested error".to_string()),
					)])),
				),
			])),
		)]);
		let _deserialized: StructWithErrors = InstanceMapper::new().parse_entity(data).unwrap();
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
		assert_eq!(
			&ElementValue::Bytes(vec![1, 2, 3]),
			result
				.get("pubAdminGroupEncGKey")
				.unwrap()
				.assert_dict()
				.get("pubEncSymKey")
				.expect("has_pubEncSymKey")
		);
		assert_eq!(
			&ElementValue::Number(PublicKeyIdentifierType::GroupId as i64),
			result
				.get("pubAdminGroupEncGKey")
				.unwrap()
				.assert_dict()
				.get("recipientIdentifierType")
				.expect("has_recipientIdentifierType")
		);
		assert_eq!(
			&ElementValue::Number(CryptoProtocolVersion::Tutacrypt as i64),
			result
				.get("pubAdminGroupEncGKey")
				.unwrap()
				.assert_dict()
				.get("protocolVersion")
				.expect("has_protocolVersion")
		)
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
			_errors: Default::default(),
			_finalIvs: Default::default(),
		};
		let mapper = InstanceMapper::new();
		let parsed_entity = mapper.serialize_entity(group_info).unwrap();

		assert_eq!(
			ElementValue::Date(DateTime::from_millis(1533116004052)),
			*parsed_entity.get("created").unwrap()
		);
	}

	#[test]
	fn test_ser_mail() {
		let mut mail = create_test_entity::<Mail>();
		mail.sender = create_test_entity();
		let sender_name = "Sender name".to_owned();
		mail.sender.name = sender_name.clone();
		let serialized = InstanceMapper::new().serialize_entity(mail).unwrap();
		assert_eq!(
			sender_name,
			serialized
				.get("sender")
				.unwrap()
				.assert_dict()
				.get("name")
				.unwrap()
				.assert_str()
		)
	}

	fn get_parsed_entity<T: Entity>(email_string: &str) -> ParsedEntity {
		let raw_entity: RawEntity = serde_json::from_str(email_string).unwrap();
		let type_model_provider = Arc::new(init_type_model_provider());
		let json_serializer = JsonSerializer::new(type_model_provider.clone());
		let type_ref = T::type_ref();
		let mut parsed_entity = json_serializer.parse(&type_ref, raw_entity).unwrap();
		let type_model = type_model_provider
			.get_type_model(type_ref.app, type_ref.type_)
			.unwrap();
		if type_model.is_encrypted() {
			parsed_entity.insert(
				"_finalIvs".to_owned(),
				ElementValue::Dict(Default::default()),
			);
		}
		parsed_entity
	}
}
