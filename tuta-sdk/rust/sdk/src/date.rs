use serde::de::{Error, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use std::fmt::Formatter;
use std::time::{Duration, SystemTime};

/// A wrapper around `SystemTime` so we can change how it is serialised by serde.
#[derive(Copy, Clone, PartialEq, PartialOrd, Debug, Default)]
pub struct DateTime(u64);

pub const DATETIME_STRUCT_NAME: &str = "DateTime";

impl DateTime {
	#[must_use]
	pub fn from_system_time(time: SystemTime) -> Self {
		Self(
			time.duration_since(SystemTime::UNIX_EPOCH)
				.unwrap()
				.as_millis() as u64,
		)
	}

	#[must_use]
	pub fn from_millis(millis: u64) -> Self {
		Self(millis)
	}

	#[must_use]
	pub fn as_system_time(self) -> SystemTime {
		SystemTime::UNIX_EPOCH + Duration::from_millis(self.as_millis())
	}

	#[must_use]
	pub fn as_millis(self) -> u64 {
		self.0
	}
}

uniffi::custom_newtype!(DateTime, u64);

impl Serialize for DateTime {
	fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
	where
		S: Serializer,
	{
		serializer.serialize_newtype_struct(DATETIME_STRUCT_NAME, &self.as_millis())
	}
}

impl<'de> Deserialize<'de> for DateTime {
	fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
	where
		D: Deserializer<'de>,
	{
		deserializer.deserialize_u64(DateVisitor)
	}
}

struct DateVisitor;

impl Visitor<'_> for DateVisitor {
	type Value = DateTime;

	fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
		formatter.write_str("expecting an u64")
	}

	fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E>
	where
		E: Error,
	{
		Ok(DateTime::from_millis(v))
	}
}

#[cfg(test)]
mod tests {
	use crate::date::DateTime;
	use std::time::{Duration, SystemTime};

	#[test]
	fn initializing_datetime_default() {
		let default = DateTime::default();
		let epoch = DateTime::from_system_time(SystemTime::UNIX_EPOCH);
		let zero = DateTime::from_millis(0);
		assert_eq!(default, epoch);
		assert_eq!(default, zero);
	}

	#[test]
	fn initializing_datetime_timestamp() {
		// 18 September 2024 @ 10:09 UTC
		let timestamp = 1726654153555;
		let systemtime =
			DateTime::from_system_time(SystemTime::UNIX_EPOCH + Duration::from_millis(timestamp));
		let millis = DateTime::from_millis(timestamp);
		assert_eq!(systemtime, millis);
	}
}
