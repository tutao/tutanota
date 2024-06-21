use std::fmt::Formatter;
use std::time::{Duration, SystemTime};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde::de::{Error, Visitor};
use uniffi::{FfiConverter, Lift, Lower, MetadataBuffer, RustBuffer};

#[derive(Copy, Clone, PartialEq, PartialOrd, Debug)]
pub struct Date(SystemTime);

impl Date {
    pub fn new(time: SystemTime) -> Self {
        Self(time)
    }

    pub fn from_millis(millis: u64) -> Self {
        Self(SystemTime::UNIX_EPOCH + Duration::from_millis(millis))
    }

    pub fn get_time(self) -> SystemTime {
        self.0
    }

    pub fn as_millis(self) -> i64 {
        self.0.duration_since(SystemTime::UNIX_EPOCH).unwrap().as_millis() as i64
    }
}

// Have to do all of this dancing because this isn't quite enough for what we want:
//
// uniffi::custom_newtype!(Date, SystemTime);
//
// Basically, we want to serialize dates as i64 but let them be passed as native Instant types in FFI

unsafe impl<UT> Lower<UT> for Date {
    type FfiType = RustBuffer;

    fn lower(obj: Self) -> Self::FfiType {
        <SystemTime as FfiConverter<UT>>::lower(obj.0)
    }

    fn write(obj: Self, buf: &mut Vec<u8>) {
        <SystemTime as FfiConverter<UT>>::write(obj.0, buf)
    }
}

unsafe impl<UT> Lift<UT> for Date {
    type FfiType = SystemTime;

    fn try_lift(v: Self::FfiType) -> uniffi::Result<Self> {
        Ok(Self(v))
    }

    fn try_read(buf: &mut &[u8]) -> uniffi::Result<Self> {
        <SystemTime as FfiConverter<UT>>::try_read(buf).map(|v| Self(v))
    }
}

impl<UT> uniffi::TypeId<UT> for Date {
    const TYPE_ID_META: MetadataBuffer = <i64 as FfiConverter<UT>>::TYPE_ID_META;
}

impl Default for Date {
    fn default() -> Self {
        Self(SystemTime::UNIX_EPOCH)
    }
}

impl Serialize for Date {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: Serializer {
        serializer.serialize_newtype_struct("Date", &self.as_millis())
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
        Ok(Date::from_millis(v as u64))
    }
}
