use crate::id::id_tuple::{BaseIdType, IdType};
use serde::de::{Error, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::borrow::ToOwned;
use std::fmt::{Debug, Display, Formatter};

pub const GENERATED_ID_STRUCT_NAME: &str = "GeneratedId";
pub const GENERATED_ID_BYTES_LENGTH: usize = 9;

/// A fixed nine byte length generated ID of an entity/instance
#[derive(Clone, Default, PartialEq, PartialOrd, Eq, Hash)]
#[repr(transparent)]
pub struct GeneratedId(pub String);

impl GeneratedId {
	/// Generates and returns a random `CustomId`
	#[cfg(test)]
	#[must_use]
	pub fn test_random() -> Self {
		use crate::util::test_utils::generate_random_string;
		// not the actual alphabet we use in real generated IDs, but we aren't dealing with parsing generated IDs yet, so it's fine
		Self(generate_random_string::<9>())
	}

	#[must_use]
	pub fn min_id() -> Self {
		// ideally should return a ref to a static id
		GeneratedId("------------".to_owned())
	}

	#[must_use]
	pub fn max_id() -> Self {
		// ideally should return a ref to a static id
		GeneratedId("zzzzzzzzzzzz".to_owned())
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

impl From<GeneratedId> for String {
	fn from(value: GeneratedId) -> Self {
		value.0
	}
}

/// does not verify that the string is actually a valid GeneratedId yet (e.g. length of bytes and
/// format is not checked).
impl From<String> for GeneratedId {
	fn from(value: String) -> Self {
		Self(value)
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

impl BaseIdType for GeneratedId {
	fn as_str(&self) -> &str {
		&self.0
	}
}

uniffi::custom_newtype!(GeneratedId, String);

impl Serialize for GeneratedId {
	fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
	where
		S: Serializer,
	{
		serializer.serialize_newtype_struct(GENERATED_ID_STRUCT_NAME, &self.0)
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
		Ok(GeneratedId(s))
	}

	fn visit_str<E>(self, s: &str) -> Result<Self::Value, E>
	where
		E: Error,
	{
		Ok(GeneratedId(s.to_owned()))
	}
}
