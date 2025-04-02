use std::fmt::Formatter;
use std::time::{Duration, SystemTime};

use serde::de::{Error, Visitor};
use serde::{Deserialize, Deserializer, Serialize, Serializer};

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
	pub fn from_seconds(seconds: u64) -> Self {
		Self(seconds * 1000)
	}

	#[must_use]
	pub fn as_system_time(self) -> SystemTime {
		SystemTime::UNIX_EPOCH + Duration::from_millis(self.as_millis())
	}

	#[must_use]
	pub fn as_millis(self) -> u64 {
		self.0
	}

	#[must_use]
	pub fn as_seconds(self) -> u64 {
		self.as_millis() / 1000
	}

	#[must_use]
	pub fn is_after(&self, other: &DateTime) -> bool {
		self.0 > other.0
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
	use std::time::{Duration, SystemTime};

	#[test]
	fn initializing_datetime_default() {
		let default = crate::date::DateTime::default();
		let epoch = crate::date::DateTime::from_system_time(SystemTime::UNIX_EPOCH);
		let zero = crate::date::DateTime::from_millis(0);
		assert_eq!(default, epoch);
		assert_eq!(default, zero);
	}

	#[test]
	fn initializing_datetime_timestamp() {
		// 18 September 2024 @ 10:09 UTC
		let timestamp = 1726654153555;
		let systemtime = crate::date::DateTime::from_system_time(
			SystemTime::UNIX_EPOCH + Duration::from_millis(timestamp),
		);
		let millis = crate::date::DateTime::from_millis(timestamp);
		assert_eq!(systemtime, millis);
	}

	#[test]
	fn is_after() {
		let first = crate::date::DateTime::from_millis(10);
		let second = crate::date::DateTime::from_millis(20);
		assert!(second.is_after(&first));
		assert!(!first.is_after(&second));
		assert!(!first.is_after(&first));
	}
}
