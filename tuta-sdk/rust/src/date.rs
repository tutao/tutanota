use std::fmt::Formatter;
use std::time::{Duration, SystemTime};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde::de::{Error, Visitor};

#[derive(Copy, Clone, Default, PartialEq, PartialOrd, Debug)]
pub struct Date(i64);

uniffi::custom_newtype!(Date, i64);

impl Date {
    pub fn new(timestamp: i64) -> Self {
        Self(timestamp)
    }

    pub fn get_time(self) -> i64 {
        self.0
    }

    pub fn as_system_time(&self) -> SystemTime {
        SystemTime::UNIX_EPOCH + Duration::from_millis(self.0 as u64)
    }
}

impl Serialize for Date {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: Serializer {
        serializer.serialize_newtype_struct("Date", &self.0)
    }
}

impl<'de> Deserialize<'de> for Date {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error> where D: Deserializer<'de> {
        deserializer.deserialize_i64(DateVisitor)
    }
}

struct DateVisitor;
impl Visitor<'_> for DateVisitor {
    type Value = Date;

    fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
        formatter.write_str("expecting an i64")
    }

    fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E> where E: Error {
        Ok(Date(v))
    }
}
