use crate::id::id_tuple::{BaseIdType, IdType};
use crate::util::{array_cast_slice, BASE64_EXT};
use crate::UniffiCustomTypeConverter;
use base64::Engine;
use serde::de::{Error, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::borrow::ToOwned;
use std::fmt::{Debug, Display, Formatter};

pub const GENERATED_ID_STRUCT_NAME: &str = "GeneratedId";
pub const GENERATED_ID_BYTES_LENGTH: usize = 9;
pub const GENERATED_ID_BASE64_BYTES_LENGTH: usize = 12;

#[derive(Clone, PartialEq, PartialOrd, Eq, Hash)]
enum GeneratedIdRepresentation {
	Base64([u8; GENERATED_ID_BASE64_BYTES_LENGTH]),
	String(String),
}

/// A fixed nine byte length generated ID of an entity/instance
#[derive(Clone, PartialEq, PartialOrd, Eq, Hash)]
#[repr(transparent)]
pub struct GeneratedId(GeneratedIdRepresentation);

impl GeneratedId {
	pub const MIN_ID: &'static GeneratedId =
		&GeneratedId(GeneratedIdRepresentation::Base64(*b"------------"));
	pub const MAX_ID: &'static GeneratedId =
		&GeneratedId(GeneratedIdRepresentation::Base64(*b"zzzzzzzzzzzz"));

	#[must_use]
	pub fn as_str(&self) -> &str {
		match &self.0 {
			GeneratedIdRepresentation::Base64(base64) => std::str::from_utf8(base64.as_slice())
				.expect("GeneratedId was not encoded as UTF-8 for some reason"),
			GeneratedIdRepresentation::String(string) => string.as_str(),
		}
	}

	#[must_use]
	pub fn from_str(string: &str) -> Self {
		if let Some(b64) = Self::try_base64_ext_str(string) {
			b64
		} else {
			Self(GeneratedIdRepresentation::String(string.to_owned()))
		}
	}

	#[must_use]
	pub fn from_string(string: String) -> Self {
		if let Some(b64) = Self::try_base64_ext_str(&string) {
			b64
		} else {
			Self(GeneratedIdRepresentation::String(string))
		}
	}

	fn try_base64_ext_str(str: &str) -> Option<Self> {
		let str_bytes: [u8; GENERATED_ID_BASE64_BYTES_LENGTH] =
			array_cast_slice(str.as_bytes(), "generated id").ok()?;

		if BASE64_EXT
			.decode_slice(&str_bytes, &mut [0u8; GENERATED_ID_BYTES_LENGTH])
			.is_ok_and(|s| s == GENERATED_ID_BYTES_LENGTH)
		{
			Some(Self(GeneratedIdRepresentation::Base64(str_bytes)))
		} else {
			None
		}
	}

	/// Generates and returns a random `CustomId`
	#[cfg(test)]
	#[must_use]
	pub fn test_random() -> Self {
		use crate::util::test_utils::generate_random_string;
		// not the actual alphabet we use in real generated IDs, but we aren't dealing with parsing generated IDs yet, so it's fine
		Self(GeneratedIdRepresentation::String(
			generate_random_string::<9>(),
		))
	}

	#[cfg(test)]
	#[must_use]
	pub fn unencoded_max_id_bytes() -> [u8; GENERATED_ID_BYTES_LENGTH] {
		[255; GENERATED_ID_BYTES_LENGTH]
	}
	#[cfg(test)]
	#[must_use]
	pub fn unencoded_min_id_bytes() -> [u8; GENERATED_ID_BYTES_LENGTH] {
		[0; GENERATED_ID_BYTES_LENGTH]
	}
}

#[cfg(test)]
impl Default for GeneratedId {
	fn default() -> Self {
		Self::MIN_ID.to_owned()
	}
}

impl From<GeneratedId> for String {
	fn from(value: GeneratedId) -> Self {
		if let GeneratedId(GeneratedIdRepresentation::String(s)) = value {
			return s;
		}
		value.as_str().to_owned()
	}
}

/// does not verify that the string is actually a valid GeneratedId yet (e.g. length of bytes and
/// format is not checked).
impl From<String> for GeneratedId {
	fn from(value: String) -> Self {
		Self::from_string(value)
	}
}

impl Display for GeneratedId {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		f.write_str(self.as_str())
	}
}

impl Debug for GeneratedId {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		write!(f, "Generated ID: \"{self}\"")
	}
}

impl IdType for GeneratedId {}
impl BaseIdType for GeneratedId {}

impl UniffiCustomTypeConverter for GeneratedId {
	type Builtin = String;

	fn into_custom(val: Self::Builtin) -> uniffi::Result<Self> {
		Ok(GeneratedId::from_string(val))
	}

	fn from_custom(obj: Self) -> Self::Builtin {
		String::from(obj)
	}
}

uniffi::custom_type!(GeneratedId, String);

impl Serialize for GeneratedId {
	fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
	where
		S: Serializer,
	{
		serializer.serialize_newtype_struct(GENERATED_ID_STRUCT_NAME, self.as_str())
	}
}

impl<'de> Deserialize<'de> for GeneratedId {
	fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
	where
		D: Deserializer<'de>,
	{
		deserializer.deserialize_string(IdVisitor)
	}
}

struct IdVisitor;

impl Visitor<'_> for IdVisitor {
	type Value = GeneratedId;

	fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
		formatter.write_str("a string")
	}

	fn visit_string<E>(self, s: String) -> Result<Self::Value, E>
	where
		E: Error,
	{
		Ok(GeneratedId::from_string(s))
	}

	fn visit_str<E>(self, s: &str) -> Result<Self::Value, E>
	where
		E: Error,
	{
		Ok(GeneratedId::from_str(s))
	}
}
