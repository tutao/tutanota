use serde::de::{
	DeserializeOwned, DeserializeSeed, EnumAccess, IntoDeserializer, MapAccess, Unexpected,
	VariantAccess, Visitor,
};
use serde::ser::{Error, Impossible, SerializeMap, SerializeSeq, SerializeStruct};
use serde::{de, ser, Deserializer, Serialize, Serializer};
use std::collections::HashMap;
use std::fmt::Display;
use std::sync::Arc;
use thiserror::Error;

use crate::date::DateTime;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::Entity;
use crate::metamodel::{AssociationType, AttributeId, Cardinality, ModelAssociation, TypeModel};
use crate::type_model_provider::TypeModelProvider;
use crate::{CustomId, GeneratedId, IdTupleCustom, IdTupleGenerated, TypeRef};

/// Converter between untyped representations of API Entities and generated structures
pub struct InstanceMapper {
	type_model_provider: Arc<TypeModelProvider>,
}

impl InstanceMapper {
	pub fn new(type_model_provider: Arc<TypeModelProvider>) -> Self {
		InstanceMapper {
			type_model_provider,
		}
	}

	pub fn parse_entity<E: Entity + DeserializeOwned>(
		&self,
		map: ParsedEntity,
	) -> Result<E, DeError> {
		let type_model = self
			.type_model_provider
			.resolve_server_type_ref(&E::type_ref())
			.ok_or_else(|| DeError(format!("server type not found: {:?}", E::type_ref())))?;
		let de = DictionaryDeserializer::<'_, _>::from_iterable(
			map,
			type_model,
			self.type_model_provider.as_ref(),
		);
		E::deserialize(de)
	}

	pub fn serialize_entity<E: Entity + Serialize>(
		&self,
		entity: E,
	) -> Result<ParsedEntity, SerError> {
		let type_model = self
			.type_model_provider
			.resolve_client_type_ref(&E::type_ref())
			.ok_or_else(|| SerError(format!("client type not found: {:?}", E::type_ref())))?;
		entity
			.serialize(ElementValueSerializer::new(Some((
				type_model,
				self.type_model_provider.as_ref(),
			))))
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
		let m = msg.to_string();
		Self(m)
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
struct DictionaryDeserializer<'t, I>
where
	I: Iterator<Item = (String, ElementValue)>,
{
	iter: I,
	value: Option<(String, ElementValue)>,
	type_model: Arc<TypeModel>,
	type_model_provider: &'t TypeModelProvider,
}

impl<'t, I> DictionaryDeserializer<'t, I>
where
	I: Iterator<Item = (String, ElementValue)>,
{
	// We accept iterable and not a map because we have to give iterator a specific type, but we
	// need to let the compiler infer it from the signature.
	fn from_iterable<II>(
		iterable: II,
		type_model: Arc<TypeModel>,
		type_model_provider: &'t TypeModelProvider,
	) -> DictionaryDeserializer<'t, I>
	where
		II: IntoIterator<Item = (String, ElementValue), IntoIter = I>,
	{
		DictionaryDeserializer {
			iter: iterable.into_iter(),
			value: None,
			type_model,
			type_model_provider,
		}
	}
}

impl<'de, I> Deserializer<'de> for DictionaryDeserializer<'de, I>
where
	I: Iterator<Item = (String, ElementValue)>,
{
	type Error = DeError;

	serde::forward_to_deserialize_any! {
		bool i8 i16 i32 i64 u8 u16 u32 u64 f32 f64 char str string bytes
		byte_buf option unit unit_struct newtype_struct seq tuple
		tuple_struct enum identifier ignored_any
	}

	fn deserialize_map<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		visitor.visit_map(self)
	}

	fn deserialize_any<V>(self, _value: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		let type_name = &self.type_model.name;
		let key = self.value.map(|(k, _)| k).unwrap_or("NO KEY".to_string());
		Err(de::Error::custom(format_args!(
			"deserialize_any is not supported! key: `{key}`, value type: `{type_name}`",
		)))
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

impl<'de, I> MapAccess<'de> for DictionaryDeserializer<'de, I>
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
			attribute_id: ElementValueKey::new(key),
			value,
			type_model: Arc::clone(&self.type_model),
			type_model_provider: self.type_model_provider,
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
					attribute_id: ElementValueKey::new(key),
					type_model: Arc::clone(&self.type_model),
					type_model_provider: self.type_model_provider,
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
struct ElementValueDeserializer<'t> {
	/// attribute_id for which we are deserializing the value. Useful for diagnostics.
	attribute_id: ElementValueKey,
	/// The value being deserialized
	value: ElementValue,
	type_model: Arc<TypeModel>,
	type_model_provider: &'t TypeModelProvider,
}

#[derive(Debug, Clone, Eq, PartialEq)]
pub enum ElementValueKey {
	AttributeId(AttributeId),
	MaybeErrorKeyseys(String),
	FinalIvs,
	Errors,
}

impl ElementValueKey {
	fn new(key_str: String) -> Self {
		if let Ok(number) = key_str.parse::<u64>() {
			Self::AttributeId(AttributeId::from(number))
		} else if key_str == "_errors" {
			Self::Errors
		} else if key_str == "_finalIvs" {
			Self::FinalIvs
		} else {
			Self::MaybeErrorKeyseys(key_str)
		}
	}

	pub fn get_attribute_id(&self) -> Option<&AttributeId> {
		if let Self::AttributeId(id) = self {
			Some(id)
		} else {
			None
		}
	}
}

impl ElementValueDeserializer<'_> {
	fn wrong_type_err(&self, expected: &str) -> DeError {
		DeError::wrong_type(&format!("{:?}", self.attribute_id), &self.value, expected)
	}
}

impl<'de> Deserializer<'de> for ElementValueDeserializer<'de> {
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
			"deserialize_any is not supported! key: `{:?}`, value type: `{type_name}`",
			self.type_model.name
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
		match self.value {
			ElementValue::String(str) => visitor.visit_string(str),
			ElementValue::IdGeneratedId(GeneratedId(id))
			| ElementValue::IdCustomId(CustomId(id)) => visitor.visit_string(id),

			// associated ids will be wrapped around by an array for all cardinalities
			ElementValue::Array(ref arr) => match arr.first() {
				Some(ElementValue::String(str)) => visitor.visit_string(str.clone()),
				Some(ElementValue::IdGeneratedId(GeneratedId(id)))
				| Some(ElementValue::IdCustomId(CustomId(id))) => visitor.visit_string(id.clone()),

				_ => Err(self.wrong_type_err("string")),
			},
			_ => Err(self.wrong_type_err("string")),
		}
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
		match &self.value {
			ElementValue::Null => visitor.visit_none(),
			// Associations do not have ElementValue::Null values anymore,
			// but empty arrays vec![] in case of Zero with cardinality ZeroOrOne
			// i.e. all associations are now wrapped in an ElementValue::Array
			ElementValue::Array(array) if array.is_empty() => {
				let is_association = self
					.attribute_id
					.get_attribute_id()
					.map(|attr_id| self.type_model.is_attribute_id_association(attr_id))
					.unwrap_or_default();
				if is_association {
					visitor.visit_none()
				} else {
					visitor.visit_some(self)
				}
			},
			// We have the same value but the visitor who is driving us will proceed to inner type
			_ => visitor.visit_some(self),
		}
	}

	fn deserialize_seq<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		let ElementValueKey::AttributeId(attribute_id) = self.attribute_id else {
			todo!()
		};

		if let ElementValue::Array(arr) = self.value {
			let array_deserializer = ArrayDeserializer {
				attribute_id,
				iter: arr.into_iter(),
				type_model: self.type_model,
				type_model_provider: self.type_model_provider,
			};
			visitor.visit_seq(array_deserializer)
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
		struct IdTupleMapAccess<I: Iterator<Item = (&'static str, String)>> {
			iter: I,
			value: Option<String>,
		}

		impl<'a, I> MapAccess<'a> for IdTupleMapAccess<I>
		where
			I: Iterator<Item = (&'static str, String)>,
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
					Some(v) => seed.deserialize(v.into_deserializer()),
				}
			}
		}

		let attribute_id = match self.attribute_id {
			ElementValueKey::AttributeId(attribute_id) => attribute_id,
			ElementValueKey::MaybeErrorKeyseys(_)
			| ElementValueKey::Errors
			| ElementValueKey::FinalIvs => {
				todo!()
			},
		};

		let is_association = self.type_model.is_attribute_id_association(&attribute_id);

		if name == crate::id::id_tuple::ID_TUPLE_GENERATED_NAME {
			match self.value {
				ElementValue::Array(mut arr) if is_association => {
					if let Some(ElementValue::IdTupleGeneratedElementId(IdTupleGenerated {
						list_id: GeneratedId(list_id_str),
						element_id: GeneratedId(element_id_str),
					})) = arr.pop()
					{
						visitor.visit_map(IdTupleMapAccess {
							iter: [("list_id", list_id_str), ("element_id", element_id_str)]
								.into_iter(),
							value: None,
						})
					} else {
						Err(DeError("empty generated id tuple association".to_string()))
					}
				},

				ElementValue::IdTupleGeneratedElementId(IdTupleGenerated {
					list_id: GeneratedId(list_id_str),
					element_id: GeneratedId(element_id_str),
				}) => visitor.visit_map(IdTupleMapAccess {
					iter: [("list_id", list_id_str), ("element_id", element_id_str)].into_iter(),
					value: None,
				}),

				_ => Err(self.wrong_type_err(crate::id::id_tuple::ID_TUPLE_GENERATED_NAME)),
			}
		} else if name == crate::id::id_tuple::ID_TUPLE_CUSTOM_NAME {
			match self.value {
				ElementValue::Array(mut array) if is_association => {
					if let Some(ElementValue::IdTupleCustomElementId(IdTupleCustom {
						list_id: GeneratedId(list_id_str),
						element_id: CustomId(element_id_str),
					})) = array.pop()
					{
						visitor.visit_map(IdTupleMapAccess {
							iter: [("list_id", list_id_str), ("element_id", element_id_str)]
								.into_iter(),
							value: None,
						})
					} else {
						Err(DeError("empty custom id tuple association".to_string()))
					}
				},

				ElementValue::IdTupleCustomElementId(IdTupleCustom {
					list_id: GeneratedId(list_id_str),
					element_id: CustomId(element_id_str),
				}) => visitor.visit_map(IdTupleMapAccess {
					iter: [("list_id", list_id_str), ("element_id", element_id_str)].into_iter(),
					value: None,
				}),

				_ => Err(self.wrong_type_err(crate::id::id_tuple::ID_TUPLE_CUSTOM_NAME)),
			}
		} else if let ElementValue::Dict(dict) = self.value {
			let attr_assoc = self
				.type_model
				.get_association_by_attribute_id(&attribute_id)
				.map_err(|err| {
					DeError(format!(
							"association for attribute id {:?} does not exist on type model with typeId {:?} {:?}",
							self.attribute_id,
							self.type_model.id,
							err
						))
				})?;
			let ref_type_ref = TypeRef {
				app: attr_assoc.dependency.unwrap_or(self.type_model.app),
				type_id: attr_assoc.ref_type_id,
			};
			let ref_type_model = self
				.type_model_provider
				.resolve_server_type_ref(&ref_type_ref)
				.ok_or_else(|| {
					DeError(format!(
						"unmet dependency: {:?} -> {:?}",
						self.type_model.type_ref(),
						ref_type_ref
					))
				})?;
			let deserializer = DictionaryDeserializer::<'de, _>::from_iterable(
				dict,
				ref_type_model,
				self.type_model_provider,
			);
			deserializer.deserialize_struct(name, fields, visitor)
		} else if let ElementValue::Array(arr) = self.value {
			let cardinality = self
				.type_model
				.associations
				.get(&attribute_id)
				.ok_or_else(|| {
					DeError(format!(
							"association for attribute id {:?} does not exist on type model with typeId {:?}",
							self.attribute_id,
							self.type_model.id
						))
				})?
				.cardinality;

			let attr_assoc = self
				.type_model
				.get_association_by_attribute_id(&attribute_id)
				.map_err(|err| {
					DeError(format!(
							"association for attribute id {:?} does not exist on type model with typeId {:?} {err:?}",
							self.attribute_id,
							self.type_model.id,
						))
				})?;
			let ref_type_ref = TypeRef {
				app: attr_assoc.dependency.unwrap_or(self.type_model.app),
				type_id: attr_assoc.ref_type_id,
			};

			let ref_type_model = self
				.type_model_provider
				.resolve_server_type_ref(&ref_type_ref)
				.ok_or_else(|| {
					DeError(format!(
						"unmet dependency: {:?} -> {:?}",
						self.type_model.type_ref(),
						ref_type_ref
					))
				})?;

			match cardinality {
				Cardinality::One if arr.is_empty() => {
					return Err(DeError(
						"None value for association with Cardinality One".to_string(),
					))
				},
				Cardinality::ZeroOrOne if arr.is_empty() => visitor.visit_none(),
				Cardinality::ZeroOrOne | Cardinality::One => {
					let element_value = arr
						.first()
						.expect("there should be an element in the array")
						.clone();
					if let ElementValue::Dict(aggregated_entity) = element_value {
						let deserializer = DictionaryDeserializer::from_iterable(
							aggregated_entity,
							ref_type_model,
							self.type_model_provider,
						);
						visitor.visit_map(deserializer)
					} else {
						unreachable!(
							"ElementValue should be a ParsedEntity for One or ZeroOrOne aggregates"
						)
					}
				},
				Cardinality::Any => {
					let array_deserializer = ArrayDeserializer {
						attribute_id,
						iter: arr.into_iter(),
						type_model: ref_type_model,
						type_model_provider: self.type_model_provider,
					};
					visitor.visit_seq(array_deserializer)
				},
			}
		} else {
			Err(self.wrong_type_err("dict or sequence"))
		}
	}

	/// Only used for _finalIvs
	fn deserialize_map<V>(self, visitor: V) -> Result<V::Value, Self::Error>
	where
		V: Visitor<'de>,
	{
		if let ElementValue::Dict(dict) = self.value {
			let de = DictionaryDeserializer::from_iterable(
				dict,
				self.type_model,
				self.type_model_provider,
			);
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

impl<'de> EnumAccess<'de> for ElementValueDeserializer<'de> {
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

impl<'de> VariantAccess<'de> for ElementValueDeserializer<'de> {
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
struct ArrayDeserializer<'t, I>
where
	I: Iterator<Item = ElementValue>,
{
	/// key under which the entities are. Will be passed to the deserializer for elements.
	attribute_id: AttributeId,
	iter: I,
	type_model: Arc<TypeModel>,
	type_model_provider: &'t TypeModelProvider,
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

impl<'de, I> de::SeqAccess<'de> for ArrayDeserializer<'de, I>
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
					attribute_id: ElementValueKey::AttributeId(self.attribute_id),
					type_model: Arc::clone(&self.type_model),
					type_model_provider: self.type_model_provider,
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
struct ElementValueSerializer<'t> {
	type_model: Option<(&'t TypeModel, &'t TypeModelProvider)>,
}

impl<'t> ElementValueSerializer<'t> {
	pub fn new(type_model: Option<(&'t TypeModel, &'t TypeModelProvider)>) -> Self {
		Self { type_model }
	}
}

enum ElementValueStructSerializer<'t> {
	Struct {
		map: ParsedEntity,
		type_model: &'t TypeModel,
		type_model_provider: &'t TypeModelProvider,
	},
	IdTupleGenerated {
		list_id: Option<GeneratedId>,
		element_id: Option<GeneratedId>,
	},
	IdTupleCustom {
		list_id: Option<GeneratedId>,
		element_id: Option<CustomId>,
	},
}

struct ElementValueSeqSerializer<'t> {
	vec: Vec<ElementValue>,
	type_model: Option<(&'t TypeModel, &'t TypeModelProvider)>,
}

impl<'t> Serializer for ElementValueSerializer<'t> {
	type Ok = ElementValue;
	type Error = SerError;
	type SerializeSeq = ElementValueSeqSerializer<'t>;
	type SerializeTuple = ser::Impossible<ElementValue, SerError>;
	type SerializeTupleStruct = ser::Impossible<ElementValue, SerError>;
	type SerializeTupleVariant = ser::Impossible<ElementValue, SerError>;
	type SerializeMap = ElementValueMapSerializer<'t>;
	type SerializeStruct = ElementValueStructSerializer<'t>;
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
			crate::id::generated_id::GENERATED_ID_STRUCT_NAME => {
				let Ok(ElementValue::String(id_string)) = value.serialize(self) else {
					unreachable!("should've serialized GeneratedId as a string");
				};
				Ok(ElementValue::IdGeneratedId(GeneratedId(id_string)))
			},
			crate::id::custom_id::CUSTOM_ID_STRUCT_NAME => {
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

		Ok(ElementValueSeqSerializer {
			vec,
			type_model: self.type_model,
		})
	}

	fn serialize_tuple(self, _: usize) -> Result<Self::SerializeTuple, Self::Error> {
		unsupported("unsupported: tuple")
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
		let (model, provider) = self.type_model.expect("should have type model");
		Ok(ElementValueMapSerializer {
			map: HashMap::new(),
			next_key: None,
			type_model: model,
			type_model_provider: provider,
		})
	}

	fn serialize_struct(
		self,
		name: &'static str,
		len: usize,
	) -> Result<Self::SerializeStruct, Self::Error> {
		if name == crate::id::id_tuple::ID_TUPLE_GENERATED_NAME {
			Ok(ElementValueStructSerializer::IdTupleGenerated {
				list_id: None,
				element_id: None,
			})
		} else if name == crate::id::id_tuple::ID_TUPLE_CUSTOM_NAME {
			Ok(ElementValueStructSerializer::IdTupleCustom {
				list_id: None,
				element_id: None,
			})
		} else {
			let (model, provider) = self.type_model.expect("should have type model");
			Ok(ElementValueStructSerializer::Struct {
				map: HashMap::with_capacity(len),
				type_model: model,
				type_model_provider: provider,
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

impl SerializeSeq for ElementValueSeqSerializer<'_> {
	type Ok = ElementValue;
	type Error = SerError;

	fn serialize_element<T>(&mut self, value: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		let serialized = value.serialize(ElementValueSerializer::new(self.type_model))?;
		self.vec.push(serialized);
		Ok(())
	}

	fn end(self) -> Result<Self::Ok, Self::Error> {
		Ok(ElementValue::Array(self.vec))
	}
}

impl SerializeStruct for ElementValueStructSerializer<'_> {
	type Ok = ElementValue;
	type Error = SerError;

	fn serialize_field<T>(&mut self, key: &'static str, value: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		match self {
			Self::Struct {
				map,
				type_model,
				type_model_provider,
			} => {
				if key == "_errors" {
					// Throw decryption errors and saved Ivs away since
					// they are not part of the actual type.
					return Ok(());
				}

				let association_info: Option<&ModelAssociation> = AttributeId::try_from(key)
					.ok()
					.and_then(|attr_id| type_model.get_association_by_attribute_id(&attr_id).ok());
				if let Some(association_info) = association_info {
					let ModelAssociation {
						cardinality,
						association_type,
						..
					} = association_info;

					let serialized_value = match association_type {
						AssociationType::Aggregation => {
							let aggregation_type_ref = TypeRef {
								app: association_info.dependency.unwrap_or(type_model.app),
								type_id: association_info.ref_type_id,
							};

							let aggregation_type_model = type_model_provider
								.resolve_client_type_ref(&aggregation_type_ref)
								.ok_or_else(|| {
									SerError(format!("Type not found: {:?}", aggregation_type_ref))
								})?;

							value.serialize(ElementValueSerializer::new(Some((
								aggregation_type_model,
								type_model_provider,
							))))?
						},

						AssociationType::ElementAssociation
						| AssociationType::ListAssociation
						| AssociationType::ListElementAssociationGenerated
						| AssociationType::BlobElementAssociation
						| AssociationType::ListElementAssociationCustom => {
							value.serialize(ElementValueSerializer::new(None))?
						},
					};

					match (cardinality, serialized_value) {
						(Cardinality::One, ElementValue::Null) => {
							return Err(SerError(format!(
								"null value for association with cardinality One for type {}",
								type_model.name
							)));
						},

						(Cardinality::ZeroOrOne, ElementValue::Null) => {
							map.insert(key.to_string(), ElementValue::Array(vec![]));
						},

						// nom-null value with all cardinality
						(Cardinality::One | Cardinality::ZeroOrOne, element_value) => {
							map.insert(key.to_string(), ElementValue::Array(vec![element_value]));
						},

						// nom-null value with all cardinality
						(Cardinality::Any, element_value) => {
							map.insert(key.to_string(), element_value);
						},
					}
				} else {
					let serialized_value = value.serialize(ElementValueSerializer::new(Some((
						type_model,
						type_model_provider,
					))))?;
					map.insert(key.to_string(), serialized_value);
				}
			},
			Self::IdTupleGenerated {
				list_id,
				element_id,
			} => match key {
				"list_id" => {
					*list_id = Some(
						value
							.serialize(ElementValueSerializer::new(None))?
							.assert_generated_id()
							.to_owned(),
					)
				},
				"element_id" => {
					*element_id = Some(
						value
							.serialize(ElementValueSerializer::new(None))?
							.assert_generated_id()
							.to_owned(),
					)
				},
				_ => unreachable!("unexpected key {key} for IdTuple", key = key),
			},
			Self::IdTupleCustom {
				list_id,
				element_id,
			} => match key {
				"list_id" => {
					*list_id = Some(
						value
							.serialize(ElementValueSerializer::new(None))?
							.assert_generated_id()
							.to_owned(),
					)
				},
				"element_id" => {
					*element_id = Some(
						value
							.serialize(ElementValueSerializer::new(None))?
							.assert_custom_id()
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
			Self::Struct {
				map,
				type_model: _,
				type_model_provider: _,
			} => Ok(ElementValue::Dict(map)),
			Self::IdTupleGenerated {
				list_id,
				element_id,
			} => Ok(ElementValue::IdTupleGeneratedElementId(IdTupleGenerated {
				list_id: list_id.unwrap(),
				element_id: element_id.unwrap(),
			})),
			Self::IdTupleCustom {
				list_id,
				element_id,
			} => Ok(ElementValue::IdTupleCustomElementId(IdTupleCustom {
				list_id: list_id.unwrap(),
				element_id: element_id.unwrap(),
			})),
		}
	}
}

/// Yet Another Serializer, this one serializes a map with dynamic keys.
struct ElementValueMapSerializer<'t> {
	next_key: Option<String>,
	map: ParsedEntity,
	type_model: &'t TypeModel,
	type_model_provider: &'t TypeModelProvider,
}

impl SerializeMap for ElementValueMapSerializer<'_> {
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
		self.map.insert(
			key,
			value.serialize(ElementValueSerializer::new(Some((
				self.type_model,
				self.type_model_provider,
			))))?,
		);
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
			ElementValue::IdTupleGeneratedElementId(_) => {
				Unexpected::Other(crate::id::id_tuple::ID_TUPLE_GENERATED_NAME)
			},
			ElementValue::Dict(_) => Unexpected::Map,
			ElementValue::Array(_) => Unexpected::Seq,
			ElementValue::IdTupleCustomElementId(_) => {
				Unexpected::Other(crate::id::id_tuple::ID_TUPLE_CUSTOM_NAME)
			},
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
	use crate::bindings::file_client::MockFileClient;
	use crate::bindings::rest_client::MockRestClient;
	use crate::entities::entity_facade::{
		FORMAT_FIELD, ID_FIELD, OWNER_GROUP_FIELD, PERMISSIONS_FIELD,
	};
	use crate::entities::generated::sys;
	use crate::entities::generated::sys::{BucketKey, Group, GroupInfo, GroupKeysRef, InstanceSessionKey};
	use crate::entities::generated::tutanota::{
		CalendarEventUidIndex, Mail, MailAddress, MailDetailsBlob, MailboxGroupRoot,
		OutOfOfficeNotification, OutOfOfficeNotificationRecipientList,
	};
	use crate::json_element::RawEntity;
	use crate::json_serializer::JsonSerializer;
	use crate::tutanota_constants::CryptoProtocolVersion;
	use crate::tutanota_constants::PublicKeyIdentifierType;
	use crate::util::test_utils::{
		create_test_entity, generate_random_group, mock_type_model_provider, HelloUnEncInput,
	};
	use crate::GeneratedId;
	use std::sync::Arc;
	use ElementValue::Array;

	#[test]
	fn test_de_group() {
		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::new()),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));
		let json = include_str!("../test_data/group_response.json");
		let parsed_entity = get_parsed_entity::<Group>(json);
		let mapper = InstanceMapper::new(type_model_provider);
		let group: Group = mapper.parse_entity(parsed_entity).unwrap();
		assert_eq!(5_i64, group.r#type);
		assert_eq!(Some(0_i64), group.adminGroupKeyVersion);
		assert_eq!(
			IdTupleGenerated {
				list_id: GeneratedId("LIopQQI--k-0".to_owned()),
				element_id: GeneratedId("LIopQQN--c-0".to_owned())
			},
			group.groupInfo
		);
		assert_eq!("LIopQQI--k-0", group.groupInfo.list_id.as_str());
	}

	/// Test for IdTupleCustom as LET reference (not as id)
	#[test]
	fn test_de_calendar_event_uid_index() {
		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::new()),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));
		let json = include_str!("../test_data/calendar_event_uid_index_response.json");
		let parsed_entity = get_parsed_entity::<CalendarEventUidIndex>(json);
		let mapper = InstanceMapper::new(type_model_provider);
		let uid_index: CalendarEventUidIndex = mapper.parse_entity(parsed_entity).unwrap();
		assert_eq!(
			Some(IdTupleCustom {
				list_id: GeneratedId("O9AJe4k--w-0".to_string()),
				element_id: CustomId("K-DUa41Th796YcV5RwMBtonQBn04PmCaSBSSfmeMUoE".to_string())
			}),
			uid_index._id
		);
		assert_eq!(
			Some(IdTupleCustom {
				list_id: GeneratedId("O9AJe4l--3-0".to_string()),
				element_id: CustomId("MTcyODI4NjMwNTMwMA".to_string())
			}),
			uid_index.progenitor
		);
	}

	#[test]
	fn test_de_group_info() {
		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::new()),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));
		let json = include_str!("../test_data/group_info_response.json");
		let mut parsed_entity = get_parsed_entity::<GroupInfo>(json);
		// this is encrypted, so we can't actually deserialize it without replacing it with a decrypted version
		parsed_entity.insert(
			type_model_provider
				.resolve_server_type_ref(&GroupInfo::type_ref())
				.unwrap()
				.get_attribute_id_by_attribute_name("name")
				.unwrap(),
			ElementValue::String("some string".to_owned()),
		);
		let mapper = InstanceMapper::new(type_model_provider);
		let group_info: GroupInfo = mapper.parse_entity(parsed_entity).unwrap();
		assert_eq!(DateTime::from_millis(1533116004052), group_info.created);
	}

	#[test]
	fn test_de_error_wrong_type() {
		let type_model_provider = Arc::new(mock_type_model_provider());
		let group_type_model = type_model_provider
			.resolve_server_type_ref(&Group::type_ref())
			.unwrap();
		let parsed_entity = [(
			group_type_model
				.get_attribute_id_by_attribute_name(ID_FIELD)
				.unwrap(),
			ElementValue::Number(2),
		)]
		.into();
		let mapper = InstanceMapper::new(type_model_provider);
		let group_result = mapper.parse_entity::<Group>(parsed_entity);
		let err = group_result.unwrap_err();
		assert!(
			err.to_string().contains("7"), //Group._id
			"error message should contain the attribute id for Group"
		)
	}

	#[test]
	fn test_de_error_missing_key() {
		let type_model_provider = Arc::new(mock_type_model_provider());
		let group_type_model = type_model_provider
			.resolve_server_type_ref(&Group::type_ref())
			.unwrap();
		let parsed_entity = [(
			group_type_model
				.get_attribute_id_by_attribute_name("_id")
				.unwrap(),
			ElementValue::IdGeneratedId(GeneratedId("id".to_owned())),
		)]
		.into();
		let mapper = InstanceMapper::new(type_model_provider);
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
		let mapper = InstanceMapper::new(Arc::new(mock_type_model_provider()));
		let _group_root: MailboxGroupRoot = mapper.parse_entity(parsed_entity).unwrap();
	}

	#[test]
	fn test_de_out_of_office_notification() {
		let type_model_provider = Arc::new(mock_type_model_provider());
		let oofn_type_model = type_model_provider
			.resolve_server_type_ref(&OutOfOfficeNotification::type_ref())
			.unwrap();

		let parsed_entity: ParsedEntity = HashMap::from_iter(
			[
				(
					oofn_type_model
						.get_attribute_id_by_attribute_name(FORMAT_FIELD)
						.unwrap(),
					ElementValue::Number(0),
				),
				(
					oofn_type_model
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap(),
					ElementValue::IdGeneratedId(GeneratedId("id".to_owned())),
				),
				(
					oofn_type_model
						.get_attribute_id_by_attribute_name(OWNER_GROUP_FIELD)
						.unwrap(),
					ElementValue::Null,
				),
				(
					oofn_type_model
						.get_attribute_id_by_attribute_name(PERMISSIONS_FIELD)
						.unwrap(),
					ElementValue::IdGeneratedId(GeneratedId("permissions".to_owned())),
				),
				(
					oofn_type_model
						.get_attribute_id_by_attribute_name("enabled")
						.unwrap(),
					ElementValue::Bool(true),
				),
				(
					oofn_type_model
						.get_attribute_id_by_attribute_name("endDate")
						.unwrap(),
					ElementValue::Date(DateTime::from_millis(1723193495816)),
				),
				(
					oofn_type_model
						.get_attribute_id_by_attribute_name("startDate")
						.unwrap(),
					ElementValue::Null,
				),
				(
					oofn_type_model
						.get_attribute_id_by_attribute_name("notifications")
						.unwrap(),
					ElementValue::Array(vec![]),
				),
			]
			.into_iter()
			.map(|(k, v)| (k.clone(), v)),
		);
		let result: OutOfOfficeNotification = InstanceMapper::new(type_model_provider)
			.parse_entity(parsed_entity)
			.unwrap();
		assert_eq!(Some(DateTime::from_millis(1723193495816)), result.endDate)
	}

	#[test]
	fn test_de_map() {
		let data = HashMap::from_iter([
			(
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
			),
			(
				"149".to_owned(),
				ElementValue::String("a message".to_string()),
			),
		]);
		let hello_input: HelloUnEncInput =
			InstanceMapper::new(Arc::new(mock_type_model_provider()))
				.parse_entity(data)
				.unwrap();

		assert_eq!(hello_input.message, "a message");
	}

	#[test]
	fn test_ser_mailbox_group_root() {
		let type_model_provider = Arc::new(mock_type_model_provider());
		let mapper = InstanceMapper::new(type_model_provider.clone());
		let mbgr_type_model = type_model_provider
			.resolve_server_type_ref(&MailboxGroupRoot::type_ref())
			.unwrap();
		let group_root = MailboxGroupRoot {
			_format: 0,
			_id: Some(GeneratedId::test_random()),
			_ownerGroup: None,
			_permissions: GeneratedId::test_random(),
			calendarEventUpdates: None,
			mailbox: GeneratedId::test_random(),
			mailboxProperties: None,
			outOfOfficeNotification: None,
			outOfOfficeNotificationRecipientList: Some(OutOfOfficeNotificationRecipientList {
				_id: Some(CustomId::test_random()),
				list: GeneratedId::test_random(),
			}),
			serverProperties: GeneratedId::test_random(),
		};
		let result = mapper.serialize_entity(group_root.clone()).unwrap();
		assert_eq!(
			&ElementValue::Number(0),
			result
				.get(
					&mbgr_type_model
						.get_attribute_id_by_attribute_name(FORMAT_FIELD)
						.unwrap()
				)
				.unwrap()
		);
	}

	#[test]
	fn test_ser_group() {
		let type_model_provider = Arc::new(mock_type_model_provider());
		let mapper = InstanceMapper::new(type_model_provider.clone());
		let group_type_model = type_model_provider
			.resolve_server_type_ref(&Group::type_ref())
			.unwrap();

		let pub_enc_key_data_typemodel = type_model_provider
			.resolve_server_type_ref(&sys::PubEncKeyData::type_ref())
			.unwrap();

		let group = generate_random_group(
			None,
			GroupKeysRef {
				_id: Some(CustomId::test_random()),
				list: GeneratedId::test_random(),
			},
		);
		let result = mapper.serialize_entity(group.clone()).unwrap();
		assert_eq!(
			&group.groupInfo,
			result
				.get(
					&group_type_model
						.get_attribute_id_by_attribute_name("groupInfo")
						.unwrap()
				)
				.unwrap()
				.assert_array()[0]
				.assert_tuple_id_generated()
		);
		assert_eq!(
			&ElementValue::Number(0),
			result
				.get(
					&group_type_model
						.get_attribute_id_by_attribute_name(FORMAT_FIELD)
						.unwrap()
				)
				.unwrap()
		);
		assert_eq!(
			&ElementValue::Bytes(vec![1, 2, 3]),
			result
				.get(
					&group_type_model
						.get_attribute_id_by_attribute_name("pubAdminGroupEncGKey")
						.unwrap()
				)
				.unwrap()
				.assert_array()[0]
				.assert_dict()
				.get(
					&pub_enc_key_data_typemodel
						.get_attribute_id_by_attribute_name("pubEncSymKey")
						.unwrap()
				)
				.expect("has_pubEncSymKey")
		);
		assert_eq!(
			&ElementValue::Number(PublicKeyIdentifierType::GroupId as i64),
			result
				.get(
					&group_type_model
						.get_attribute_id_by_attribute_name("pubAdminGroupEncGKey")
						.unwrap()
				)
				.unwrap()
				.assert_array()[0]
				.assert_dict()
				.get(
					&pub_enc_key_data_typemodel
						.get_attribute_id_by_attribute_name("recipientIdentifierType")
						.unwrap()
				)
				.expect("has_recipientIdentifierType")
		);
		assert_eq!(
			&ElementValue::Number(CryptoProtocolVersion::TutaCrypt as i64),
			result
				.get(
					&group_type_model
						.get_attribute_id_by_attribute_name("pubAdminGroupEncGKey")
						.unwrap()
				)
				.unwrap()
				.assert_array()[0]
				.assert_dict()
				.get(
					&pub_enc_key_data_typemodel
						.get_attribute_id_by_attribute_name("protocolVersion")
						.unwrap()
				)
				.expect("has_protocolVersion")
		)
	}

	#[test]
	fn test_ser_calendar_event_uid_index() {
		let type_model_provider = Arc::new(mock_type_model_provider());
		let mapper = InstanceMapper::new(type_model_provider.clone());
		let ceui_type_model = type_model_provider
			.resolve_client_type_ref(&CalendarEventUidIndex::type_ref())
			.unwrap();
		let _id = IdTupleCustom::new(GeneratedId::test_random(), CustomId::test_random());
		let progenitor = IdTupleCustom::new(GeneratedId::test_random(), CustomId::test_random());
		let calendar_event_uid_index = CalendarEventUidIndex {
			_format: 0,
			_id: Some(_id.clone()),
			_ownerGroup: None,
			_permissions: GeneratedId::test_random(),
			alteredInstances: vec![],
			progenitor: Some(progenitor.clone()),
		};
		let parsed_entity = mapper.serialize_entity(calendar_event_uid_index).unwrap();

		assert_eq!(
			ElementValue::IdTupleCustomElementId(_id),
			*parsed_entity
				.get(
					&ceui_type_model
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap()
				)
				.unwrap()
		);
		assert_eq!(
			Array(vec![ElementValue::IdTupleCustomElementId(progenitor)]),
			*parsed_entity
				.get(
					&ceui_type_model
						.get_attribute_id_by_attribute_name("progenitor")
						.unwrap()
				)
				.unwrap()
		);
	}

	#[test]
	fn test_ser_group_info() {
		let _id = IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random());
		let group_info = GroupInfo {
			_format: 0,
			_id: Some(_id.clone()),
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
			mailAddressAliases: vec![],
			_errors: Default::default(),
			_finalIvs: Default::default(),
		};

		let type_model_provider = Arc::new(mock_type_model_provider());
		let mapper = InstanceMapper::new(type_model_provider.clone());
		let gi_type_model = type_model_provider
			.resolve_client_type_ref(&GroupInfo::type_ref())
			.unwrap();
		let parsed_entity = mapper.serialize_entity(group_info).unwrap();

		assert_eq!(
			ElementValue::IdTupleGeneratedElementId(_id),
			*parsed_entity
				.get(
					&gi_type_model
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap()
				)
				.unwrap()
		);
		assert_eq!(
			ElementValue::Date(DateTime::from_millis(1533116004052)),
			*parsed_entity
				.get(
					&gi_type_model
						.get_attribute_id_by_attribute_name("created")
						.unwrap()
				)
				.unwrap()
		);
	}

	#[test]
	fn test_serde_mail() {
		let type_model_provider = Arc::new(mock_type_model_provider());
		let mail_type_model = type_model_provider
			.resolve_server_type_ref(&Mail::type_ref())
			.unwrap();
		let mail_address_type_model = type_model_provider
			.resolve_server_type_ref(&MailAddress::type_ref())
			.unwrap();
		let mapper = InstanceMapper::new(type_model_provider.clone());
		let mut mail = create_test_entity::<Mail>();
		let mut bucket_key = create_test_entity::<BucketKey>();
		let instance_session_key = create_test_entity::<InstanceSessionKey>();
		bucket_key.bucketEncSessionKeys.push(instance_session_key);
		mail.bucketKey = Some(bucket_key);
		let _id = IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random());
		let mail_details_id =
			IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random());
		let attachment_id =
			IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random());
		mail._id = Some(_id.clone());
		mail.mailDetails = Some(mail_details_id.clone());
		mail.attachments = vec![attachment_id.clone()];
		mail.sender = create_test_entity();
		let sender_name = "Sender name".to_owned();
		mail.sender.name = sender_name.clone();
		let serialized = mapper.serialize_entity(mail).unwrap();
		assert_eq!(
			&_id,
			serialized
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap()
				)
				.unwrap()
				.assert_tuple_id_generated()
		);
		assert_eq!(
			&mail_details_id,
			serialized
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("mailDetails")
						.unwrap()
				)
				.unwrap()
				.assert_array()[0]
				.assert_tuple_id_generated()
		);
		assert_eq!(
			&attachment_id,
			serialized
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("attachments")
						.unwrap()
				)
				.unwrap()
				.assert_array()[0]
				.assert_tuple_id_generated()
		);
		assert_eq!(
			sender_name,
			serialized
				.get(
					&mail_type_model
						.get_attribute_id_by_attribute_name("sender")
						.unwrap()
				)
				.unwrap()
				.assert_array()[0]
				.assert_dict()
				.get(
					&mail_address_type_model
						.get_attribute_id_by_attribute_name("name")
						.unwrap()
				)
				.unwrap()
				.assert_str()
		);

		let deserialized: Mail = mapper.parse_entity(serialized).unwrap();

		assert_eq!(Some(_id), deserialized._id);
		assert_eq!(mail_details_id, deserialized.mailDetails.unwrap());
	}

	#[test]
	fn test_serde_mail_details_blob() {
		let mut mail_details_blob = create_test_entity::<MailDetailsBlob>();
		let _id = IdTupleGenerated::new(GeneratedId::test_random(), GeneratedId::test_random());
		mail_details_blob._id = Some(_id.clone());

		let type_model_provider = Arc::new(mock_type_model_provider());
		let mapper = InstanceMapper::new(type_model_provider.clone());
		let serialized = mapper.serialize_entity(mail_details_blob).unwrap();
		assert_eq!(
			&_id,
			serialized
				.get(
					&type_model_provider
						.resolve_server_type_ref(&MailDetailsBlob::type_ref())
						.unwrap()
						.get_attribute_id_by_attribute_name(ID_FIELD)
						.unwrap()
				)
				.unwrap()
				.assert_tuple_id_generated()
		);

		let deserialized: MailDetailsBlob = mapper.parse_entity(serialized).unwrap();
		assert_eq!(_id, deserialized._id.unwrap());
	}

	fn get_parsed_entity<T: Entity>(email_string: &str) -> ParsedEntity {
		let raw_entity: RawEntity = serde_json::from_str(email_string).unwrap();
		let type_model_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(MockRestClient::default()),
			Arc::new(MockFileClient::default()),
			"localhost:9000".to_string(),
		));
		let json_serializer = JsonSerializer::new(type_model_provider.clone());
		let type_ref = T::type_ref();
		let mut parsed_entity = json_serializer.parse(&type_ref, raw_entity).unwrap();
		let type_model = type_model_provider
			.resolve_server_type_ref(&type_ref)
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
