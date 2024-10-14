use base64::Engine;
use serde::de::{Error, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt::{Debug, Display, Formatter};

pub const CUSTOM_ID_STRUCT_NAME: &str = "CustomId";

/// An ID that uses arbitrary data encoded in base64
#[derive(Clone, Default, Eq, PartialEq, PartialOrd)]
#[repr(transparent)]
pub struct CustomId(pub String);

impl CustomId {
	#[must_use]
	pub fn as_str(&self) -> &str {
		&self.0
	}

	/// Create a CustomId from an arbitrary (unencoded) string
	#[must_use]
	pub fn from_custom_string(custom_string: &str) -> Self {
		Self(base64::prelude::BASE64_URL_SAFE_NO_PAD.encode(custom_string))
	}

	/// Generates and returns a random `CustomId`
	#[cfg(test)]
	#[must_use]
	pub fn test_random() -> Self {
		use crate::util::test_utils::generate_random_string;
		Self(generate_random_string::<9>())
	}
}

impl From<CustomId> for String {
	fn from(value: CustomId) -> Self {
		value.0
	}
}

impl Display for CustomId {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		f.write_str(self.as_str())
	}
}

impl Debug for CustomId {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		write!(f, "Custom ID: \"{self}\"")
	}
}

uniffi::custom_newtype!(CustomId, String);

impl Serialize for CustomId {
	fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
	where
		S: Serializer,
	{
		serializer.serialize_newtype_struct(CUSTOM_ID_STRUCT_NAME, &self.0)
	}
}

impl<'de> Deserialize<'de> for CustomId {
	fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
	where
		D: Deserializer<'de>,
	{
		deserializer.deserialize_string(IdVisitor)
	}
}

struct IdVisitor;

impl Visitor<'_> for IdVisitor {
	type Value = CustomId;

	fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
		formatter.write_str("a string")
	}

	fn visit_string<E>(self, s: String) -> Result<Self::Value, E>
	where
		E: Error,
	{
		Ok(CustomId(s))
	}

	fn visit_str<E>(self, s: &str) -> Result<Self::Value, E>
	where
		E: Error,
	{
		Ok(CustomId(s.to_owned()))
	}
}
