use crate::entities::Entity;
use serde::ser::{SerializeMap, SerializeSeq, SerializeStruct, StdError};
use serde::{ser, Serialize, Serializer};
use std::fmt::{Debug, Display, Formatter};

/// this is the length of an empty encrypted byte slice.
const MINIMUM_ENCRYPTED_SLICE_SIZE: usize = 65;

/// estimate the size of the given serializable instance when encrypted, mapped and
/// serialized to json.
/// needed for limiting the request size, therefore should prefer to overestimate.
pub fn estimate_json_size<T>(value: &T) -> usize
where
	T: Serialize + Entity,
{
	value.serialize(&mut SizeEstimatingSerializer).unwrap()
}

struct SizeEstimatingSerializer;

#[derive(Debug)]
struct SizeEstimationError(String);

impl StdError for SizeEstimationError {}

impl Display for SizeEstimationError {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		f.write_str(&self.0)
	}
}

impl ser::Error for SizeEstimationError {
	fn custom<T: Display>(msg: T) -> Self {
		Self(msg.to_string())
	}
}

/// main serializer for all entities and their field values.
/// there are some special-cased types that are serialized
/// in a non-serde way (eg IdTuple struct -> vector of strings)
/// it assumes that certain types will be encrypted and/or b64
/// encoded.
impl<'a> Serializer for &'a mut SizeEstimatingSerializer {
	type Ok = usize;
	type Error = SizeEstimationError;
	type SerializeSeq = SizeEstimatingCompoundSerializer;
	type SerializeTuple = ser::Impossible<usize, SizeEstimationError>;
	type SerializeTupleStruct = ser::Impossible<usize, SizeEstimationError>;
	type SerializeTupleVariant = ser::Impossible<usize, SizeEstimationError>;
	type SerializeMap = SizeEstimatingCompoundSerializer;
	type SerializeStruct = SizeEstimatingCompoundSerializer;
	type SerializeStructVariant = ser::Impossible<usize, SizeEstimationError>;

	fn serialize_bool(self, v: bool) -> Result<Self::Ok, Self::Error> {
		Ok(if v { 4 } else { 5 })
	}

	fn serialize_i8(self, _v: i8) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_i8");
	}

	fn serialize_i16(self, _v: i16) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_i16");
	}

	fn serialize_i32(self, _v: i32) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_i32");
	}

	fn serialize_i64(self, v: i64) -> Result<Self::Ok, Self::Error> {
		Ok((v + 1).ilog10() as usize + 1)
	}

	fn serialize_u8(self, _v: u8) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize u8");
	}

	fn serialize_u16(self, _v: u16) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_u16")
	}

	fn serialize_u32(self, v: u32) -> Result<Self::Ok, Self::Error> {
		Ok((v + 1).ilog10() as usize + 1)
	}

	fn serialize_u64(self, v: u64) -> Result<Self::Ok, Self::Error> {
		Ok((v + 1).ilog10() as usize + 1)
	}

	fn serialize_f32(self, _v: f32) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_f32")
	}

	fn serialize_f64(self, _v: f64) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_f64")
	}

	fn serialize_char(self, _v: char) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_char")
	}

	fn serialize_str(self, v: &str) -> Result<Self::Ok, Self::Error> {
		self.serialize_bytes(v.as_bytes())
	}

	fn serialize_bytes(self, v: &[u8]) -> Result<Self::Ok, Self::Error> {
		// return the byte length of the resulting utf-8 string when b64-encoding the given
		// byte slice with padding, taking into account that we're probably going to encrypt the value.
		// +2 for the quotes
		Ok(enc_base64_size_with_pad(v) + 2)
	}

	fn serialize_none(self) -> Result<Self::Ok, Self::Error> {
		Ok("null".len())
	}

	fn serialize_some<T>(self, value: &T) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		value.serialize(self)
	}

	fn serialize_unit(self) -> Result<Self::Ok, Self::Error> {
		Ok("null".len())
	}

	fn serialize_unit_struct(self, _name: &'static str) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_unit_struct")
	}

	fn serialize_unit_variant(
		self,
		_name: &'static str,
		_variant_index: u32,
		_variant: &'static str,
	) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_unit_variant")
	}

	fn serialize_newtype_struct<T>(
		self,
		name: &'static str,
		value: &T,
	) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		use crate::date::DATETIME_STRUCT_NAME;
		use crate::id::custom_id::CUSTOM_ID_STRUCT_NAME;
		use crate::id::generated_id::GENERATED_ID_STRUCT_NAME;

		match name {
			DATETIME_STRUCT_NAME | GENERATED_ID_STRUCT_NAME | CUSTOM_ID_STRUCT_NAME => {
				value.serialize(self)
			},
			_ => unimplemented!("serialize_newtype_struct"),
		}
	}

	fn serialize_newtype_variant<T>(
		self,
		_name: &'static str,
		_variant_index: u32,
		_variant: &'static str,
		_value: &T,
	) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		unimplemented!("serialize_newtype_variant")
	}

	fn serialize_seq(self, len: Option<usize>) -> Result<Self::SerializeSeq, Self::Error> {
		let Some(len) = len else {
			return Err(SizeEstimationError("serialize_map".into()));
		};
		// starting with the brackets + commas
		Ok(SizeEstimatingCompoundSerializer(
			CompoundType::Seq,
			2 + len.saturating_sub(1),
		))
	}

	fn serialize_tuple(self, _len: usize) -> Result<Self::SerializeTuple, Self::Error> {
		unreachable!()
	}

	fn serialize_tuple_struct(
		self,
		_name: &'static str,
		_len: usize,
	) -> Result<Self::SerializeTupleStruct, Self::Error> {
		unreachable!()
	}

	fn serialize_tuple_variant(
		self,
		_name: &'static str,
		_variant_index: u32,
		_variant: &'static str,
		_len: usize,
	) -> Result<Self::SerializeTupleVariant, Self::Error> {
		unreachable!()
	}

	/// maps are only used for the _finalIvs field which is not encrypted.
	fn serialize_map(self, len: Option<usize>) -> Result<Self::SerializeMap, Self::Error> {
		let Some(len) = len else {
			return Err(SizeEstimationError("serialize_map".into()));
		};
		// starting with the braces + colons + one comma for each field after the first
		Ok(SizeEstimatingCompoundSerializer(
			CompoundType::Map,
			2 + (len + len).saturating_sub(1),
		))
	}

	fn serialize_struct(
		self,
		name: &'static str,
		len: usize,
	) -> Result<Self::SerializeStruct, Self::Error> {
		use crate::id::id_tuple::{ID_TUPLE_CUSTOM_NAME, ID_TUPLE_GENERATED_NAME};
		use CompoundType::*;
		match name {
			// braces + one comma
			ID_TUPLE_GENERATED_NAME | ID_TUPLE_CUSTOM_NAME => {
				Ok(SizeEstimatingCompoundSerializer(IdTuple, 3))
			},
			// braces + colons + one comma for each field after the first
			_ => Ok(SizeEstimatingCompoundSerializer(
				Struct,
				2 + (len + len).saturating_sub(1),
			)),
		}
	}

	fn serialize_struct_variant(
		self,
		_name: &'static str,
		_variant_index: u32,
		_variant: &'static str,
		_len: usize,
	) -> Result<Self::SerializeStructVariant, Self::Error> {
		unreachable!()
	}
}

struct SizeEstimatingPlaintextSerializer;

/// serializer that will not apply the encryption and encoding padding,
/// to be used for objects that we know will not be encrypted or encoded,
/// eg struct field names, ids.
impl<'a> Serializer for &'a mut SizeEstimatingPlaintextSerializer {
	type Ok = usize;
	type Error = SizeEstimationError;
	type SerializeSeq = ser::Impossible<usize, SizeEstimationError>;
	type SerializeTuple = ser::Impossible<usize, SizeEstimationError>;
	type SerializeTupleStruct = ser::Impossible<usize, SizeEstimationError>;
	type SerializeTupleVariant = ser::Impossible<usize, SizeEstimationError>;
	type SerializeMap = ser::Impossible<usize, SizeEstimationError>;
	type SerializeStruct = ser::Impossible<usize, SizeEstimationError>;
	type SerializeStructVariant = ser::Impossible<usize, SizeEstimationError>;

	fn serialize_bool(self, _v: bool) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_bool")
	}

	fn serialize_i8(self, _v: i8) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_i8")
	}

	fn serialize_i16(self, _v: i16) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_i16")
	}

	fn serialize_i32(self, _v: i32) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_i32")
	}

	fn serialize_i64(self, _v: i64) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_i64")
	}

	fn serialize_u8(self, _v: u8) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_u8")
	}

	fn serialize_u16(self, _v: u16) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_u16")
	}

	fn serialize_u32(self, _v: u32) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_iu32")
	}

	fn serialize_u64(self, _v: u64) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_u64")
	}

	fn serialize_f32(self, _v: f32) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_f32")
	}

	fn serialize_f64(self, _v: f64) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_f64")
	}

	fn serialize_char(self, _v: char) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_char")
	}

	fn serialize_str(self, v: &str) -> Result<Self::Ok, Self::Error> {
		Ok(v.len() + 2)
	}

	fn serialize_bytes(self, v: &[u8]) -> Result<Self::Ok, Self::Error> {
		Ok(plain_base64_size_with_pad(v) + 2)
	}

	fn serialize_none(self) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_none")
	}

	fn serialize_some<T>(self, _value: &T) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		unimplemented!("serialize_some")
	}

	fn serialize_unit(self) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_unit")
	}

	fn serialize_unit_struct(self, _name: &'static str) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_unit_struct")
	}

	fn serialize_unit_variant(
		self,
		_name: &'static str,
		_variant_index: u32,
		_variant: &'static str,
	) -> Result<Self::Ok, Self::Error> {
		unimplemented!("serialize_unit_variant")
	}

	fn serialize_newtype_struct<T>(
		self,
		_name: &'static str,
		value: &T,
	) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		value.serialize(self)
	}

	fn serialize_newtype_variant<T>(
		self,
		_name: &'static str,
		_variant_index: u32,
		_variant: &'static str,
		_value: &T,
	) -> Result<Self::Ok, Self::Error>
	where
		T: ?Sized + Serialize,
	{
		unimplemented!("serialize_newtype_variant")
	}

	fn serialize_seq(self, _len: Option<usize>) -> Result<Self::SerializeSeq, Self::Error> {
		unimplemented!("serialize_seq")
	}

	fn serialize_tuple(self, _len: usize) -> Result<Self::SerializeTuple, Self::Error> {
		unimplemented!("serialize_tuple")
	}

	fn serialize_tuple_struct(
		self,
		_name: &'static str,
		_len: usize,
	) -> Result<Self::SerializeTupleStruct, Self::Error> {
		unimplemented!("serialize_tuple_struct")
	}

	fn serialize_tuple_variant(
		self,
		_name: &'static str,
		_variant_index: u32,
		_variant: &'static str,
		_len: usize,
	) -> Result<Self::SerializeTupleVariant, Self::Error> {
		unimplemented!("serialize_tuple_variant")
	}

	fn serialize_map(self, _len: Option<usize>) -> Result<Self::SerializeMap, Self::Error> {
		unimplemented!("serialize_map")
	}

	fn serialize_struct(
		self,
		_name: &'static str,
		_len: usize,
	) -> Result<Self::SerializeStruct, Self::Error> {
		unimplemented!("serialize_struct")
	}

	fn serialize_struct_variant(
		self,
		_name: &'static str,
		_variant_index: u32,
		_variant: &'static str,
		_len: usize,
	) -> Result<Self::SerializeStructVariant, Self::Error> {
		unimplemented!("serialize_struct_variant")
	}
}

/// the compound types that are handled by the serialization.
/// some types are special-cased.
enum CompoundType {
	/// id tuples are strings, but serialize as a sequence.
	IdTuple,
	Struct,
	Map,
	Seq,
}

struct SizeEstimatingCompoundSerializer(CompoundType, usize);

impl<'a> SerializeSeq for SizeEstimatingCompoundSerializer {
	type Ok = usize;
	type Error = SizeEstimationError;

	fn serialize_element<T>(&mut self, value: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		self.1 += value.serialize(&mut SizeEstimatingSerializer)?;
		Ok(())
	}

	fn end(self) -> Result<Self::Ok, Self::Error> {
		Ok(self.1)
	}
}

/// maps are only used for the _finalIvs fields which are not encrypted.
impl<'a> SerializeMap for SizeEstimatingCompoundSerializer {
	type Ok = usize;
	type Error = SizeEstimationError;

	fn serialize_key<T>(&mut self, key: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		self.1 += key.serialize(&mut SizeEstimatingPlaintextSerializer)?;
		Ok(())
	}

	fn serialize_value<T>(&mut self, value: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		self.1 += value.serialize(&mut SizeEstimatingPlaintextSerializer)?;
		Ok(())
	}

	fn end(self) -> Result<Self::Ok, Self::Error> {
		Ok(self.1)
	}
}

impl<'a> SerializeStruct for SizeEstimatingCompoundSerializer {
	type Ok = usize;
	type Error = SizeEstimationError;

	fn serialize_field<T>(&mut self, key: &'static str, value: &T) -> Result<(), Self::Error>
	where
		T: ?Sized + Serialize,
	{
		match self.0 {
            CompoundType::IdTuple => {
                match key {
                    "list_id" | "element_id" => self.1 += value.serialize(&mut SizeEstimatingPlaintextSerializer)?,
                    _ => unreachable!("should not serialize unknown field with CompoundType::IdTuple ")
                }
            }
            CompoundType::Struct => self.1 += key.serialize(&mut SizeEstimatingPlaintextSerializer)? + value.serialize(&mut SizeEstimatingSerializer)?,
            _ => unreachable!("shouldn't call SerializeStruct::serialize_field while not serializing an IdTuple or struct")
        }

		Ok(())
	}

	fn end(self) -> Result<Self::Ok, Self::Error> {
		Ok(self.1)
	}
}

fn enc_base64_size_with_pad(bytes: &[u8]) -> usize {
	// b64 encodes 3 bytes with 4 ascii chars, rounded up.
	// since we're encrypting and padding to the block size,
	// we also need to add more overhead for that.
	(bytes.len() + MINIMUM_ENCRYPTED_SLICE_SIZE)
		.div_ceil(3)
		.saturating_mul(4)
}

fn plain_base64_size_with_pad(bytes: &[u8]) -> usize {
	// b64 encodes 3 bytes with 4 ascii chars, rounded up.
	// since we're padding to the block size, we also need to add more overhead for that.
	bytes.len().div_ceil(3).saturating_mul(4)
}

#[cfg(test)]
mod tests {
	use super::{enc_base64_size_with_pad, estimate_json_size, SizeEstimatingSerializer};
	use crate::date::DateTime;
	use crate::entities::FinalIv;
	use crate::{CustomId, GeneratedId, IdTupleCustom, IdTupleGenerated, TypeRef};
	use serde::Serialize;
	use std::collections::HashMap;

	#[derive(Serialize)]
	struct FooBarBaz<A, B, C> {
		pub field_a: A,
		pub field_b: B,
		pub field_c: C,
	}

	impl<A: 'static, B: 'static, C: 'static> crate::entities::Entity for FooBarBaz<A, B, C> {
		fn type_ref() -> TypeRef {
			unreachable!()
		}
	}

	#[test]
	fn estimate_struct_size() {
		let foo: FooBarBaz<u32, u64, bool> = FooBarBaz {
			field_a: 0,
			field_b: 234,
			field_c: true,
		};
		assert_eq!(
			r#"{"field_a":0,"field_b":234,"field_c":true}"#.len(),
			estimate_json_size(&foo)
		);

		let foo2: FooBarBaz<IdTupleGenerated, IdTupleCustom, DateTime> = FooBarBaz {
			field_a: IdTupleGenerated {
				list_id: GeneratedId("moo".to_string()),
				element_id: GeneratedId("wuff".to_string()),
			},
			field_b: IdTupleCustom {
				list_id: GeneratedId("meow".to_string()),
				element_id: CustomId("123".to_string()),
			},
			field_c: DateTime::from_millis(1753355555555),
		};

		assert_eq!(
			r#"{"field_a":["moo","wuff"],"field_b":["meow","123"],"field_c":1753355555555}"#.len(),
			estimate_json_size(&foo2)
		);

		let foo3: FooBarBaz<Option<String>, Option<()>, ()> = FooBarBaz {
			field_a: None,
			field_b: Some(()),
			field_c: (),
		};
		assert_eq!(
			r#"{"field_a":null,"field_b":null,"field_c":null}"#.len(),
			estimate_json_size(&foo3)
		);
	}

	#[test]
	fn estimate_map_size() {
		let value = HashMap::from([
			("some", FinalIv(Vec::from(b"0"))),
			("other", FinalIv(Vec::from(b"234"))),
		]);
		assert_eq!(
			r#"{"some":"MAo=","other":"===="}"#.len(),
			// maps are only used for the _finalIvs fields which are not encrypted.
			value.serialize(&mut SizeEstimatingSerializer).unwrap()
		);
	}

	#[test]
	fn estimate_bool_size() {
		assert_eq!(4, true.serialize(&mut SizeEstimatingSerializer).unwrap());
		assert_eq!(5, false.serialize(&mut SizeEstimatingSerializer).unwrap());
	}

	#[test]
	fn estimate_str_size() {
		assert_eq!(
			enc_base64_size_with_pad(b"foo") + 2,
			"foo".serialize(&mut SizeEstimatingSerializer).unwrap()
		);
		assert_eq!(
			enc_base64_size_with_pad(b"") + 2,
			"".serialize(&mut SizeEstimatingSerializer).unwrap()
		);
	}

	#[test]
	fn estimate_num_size() {
		assert_eq!(1, 0_u32.serialize(&mut SizeEstimatingSerializer).unwrap());
		assert_eq!(2, 10_u32.serialize(&mut SizeEstimatingSerializer).unwrap());
	}

	#[test]
	fn estimate_vec_size() {
		assert_eq!(
			2,
			Vec::<u32>::new()
				.serialize(&mut SizeEstimatingSerializer)
				.unwrap()
		);
		assert_eq!(
			"[0,10]".len(),
			vec![0_u32, 10_u32]
				.serialize(&mut SizeEstimatingSerializer)
				.unwrap()
		);
		assert_eq!(
			"[true,false]".len(),
			vec![true, false]
				.serialize(&mut SizeEstimatingSerializer)
				.unwrap()
		);
		assert_eq!(
			"[true]".len(),
			vec![true].serialize(&mut SizeEstimatingSerializer).unwrap()
		);
		assert_eq!(
			r#"["",""]"#.len() + enc_base64_size_with_pad(b"0") + enc_base64_size_with_pad(b"10"),
			vec!["0", "10"]
				.serialize(&mut SizeEstimatingSerializer)
				.unwrap()
		);
	}

	#[test]
	fn estimate_bytes_size() {
		// using FinalIv because it's annotated to use serde_bytes for the byte vector serialization.
		// serde serializes a bare &[u8] as a sequence or tuple by default
		assert_eq!(
			enc_base64_size_with_pad(b"") + 2,
			FinalIv(b"".as_slice().to_owned())
				.serialize(&mut SizeEstimatingSerializer)
				.unwrap()
		);
		assert_eq!(
			enc_base64_size_with_pad(b"0") + 2,
			FinalIv(b"0".as_slice().to_owned())
				.serialize(&mut SizeEstimatingSerializer)
				.unwrap()
		);
		assert_eq!(
			enc_base64_size_with_pad(b"hello") + 2,
			FinalIv(b"hello".as_slice().to_owned())
				.serialize(&mut SizeEstimatingSerializer)
				.unwrap()
		);
	}

	#[test]
	fn estimate_date_size() {
		assert_eq!(
			"123456".len(),
			DateTime::from_millis(123456)
				.serialize(&mut SizeEstimatingSerializer)
				.unwrap()
		);
	}

	#[test]
	fn estimate_id_tuple() {
		let id = IdTupleGenerated::new(
			GeneratedId("abc".to_string()),
			GeneratedId("defg".to_string()),
		);
		assert_eq!(
			r#"["abc","defg"]"#.len(),
			id.serialize(&mut SizeEstimatingSerializer).unwrap()
		);
	}
}
