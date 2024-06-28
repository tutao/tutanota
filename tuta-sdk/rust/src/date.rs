use std::fmt::Formatter;
use std::time::{Duration, SystemTime};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde::de::{Error, Visitor};

#[derive(Copy, Clone, PartialEq, PartialOrd, Debug)]
pub struct DateTime(SystemTime);

impl DateTime {
    pub fn new(time: SystemTime) -> Self {
        Self(time)
    }

    pub fn from_millis(millis: u64) -> Self {
        Self(SystemTime::UNIX_EPOCH + Duration::from_millis(millis))
    }

    pub fn get_time(self) -> SystemTime {
        self.0
    }

    pub fn as_millis(self) -> u64 {
        self.0.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis() as u64
    }
}

uniffi::custom_newtype!(DateTime, SystemTime);

impl Default for DateTime {
    fn default() -> Self {
        Self(SystemTime::UNIX_EPOCH)
    }
}

impl Serialize for DateTime {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: Serializer {
        serializer.serialize_newtype_struct("Date", &self.as_millis())
    }
}

impl<'de> Deserialize<'de> for DateTime {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error> where D: Deserializer<'de> {
        deserializer.deserialize_u64(DateVisitor)
    }
}

struct DateVisitor;

impl Visitor<'_> for DateVisitor {
    type Value = DateTime;

    fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
        formatter.write_str("expecting an u64")
    }

    fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E> where E: Error {
        Ok(DateTime::from_millis(v))
    }
}
