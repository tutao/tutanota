use crate::id::id_tuple::{BaseIdType, IdType};
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

	/// Create an unencoded String from a base64 encoded CustomId string
	#[must_use]
	pub fn to_custom_string(&self) -> String {
		String::from_utf8(
			base64::prelude::BASE64_URL_SAFE_NO_PAD
				.decode(&self.0)
				.unwrap(),
		)
		.unwrap()
	}

	/// Generates and returns a random `CustomId`
	#[cfg(test)]
	#[must_use]
	pub fn test_random() -> Self {
		use crate::util::test_utils::generate_random_string;
		Self(generate_random_string::<9>())
	}

	/// Generates and returns a random `CustomId` of 4 bytes (only to be used for random)
	#[cfg(test)]
	#[must_use]
	pub fn test_random_aggregate() -> Self {
		use crate::util::test_utils::generate_random_string;
		Self(generate_random_string::<4>())
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

impl IdType for CustomId {}
impl BaseIdType for CustomId {}

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

#[cfg(test)]
mod tests {
	use crate::CustomId;

	#[tokio::test]
	async fn base64_round_trip_custom_id_custom_string() {
		let custom_string = "my custom string";
		let custom_string_as_custom_id = CustomId::from_custom_string(custom_string);
		assert_eq!(
			"bXkgY3VzdG9tIHN0cmluZw",
			custom_string_as_custom_id.as_str()
		);
		assert_eq!(custom_string, custom_string_as_custom_id.to_custom_string());
	}

	#[tokio::test]
	async fn base64_round_trip_custom_id_number() {
		let number_0 = 0i64;
		let number_0_as_custom_id = CustomId::from_custom_string(number_0.to_string().as_str());
		assert_eq!("MA", number_0_as_custom_id.as_str());
		assert_eq!(
			number_0,
			number_0_as_custom_id
				.to_custom_string()
				.parse::<i64>()
				.unwrap()
		);
	}
}
