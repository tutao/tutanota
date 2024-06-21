use std::fmt::{Display, Formatter};
use serde::{Deserialize, Deserializer, Serialize, Serializer};
use serde::de::{Error, Visitor};

#[derive(Clone, Default, PartialEq, PartialOrd, Debug)]
#[repr(transparent)]
pub struct Id(String);

impl Id {
    pub fn new(id: String) -> Self {
        Self(id)
    }

    pub fn as_str(&self) -> &str {
        &self.0
    }

    #[cfg(test)]
    pub fn test_random() -> Self {
        use base64::engine::Engine;

        // not the actual alphabet we use in real generated IDs, but we aren't dealing with parsing generated IDs yet, so it's fine
        let random_bytes: [u8; 9] = rand::random();
        Self(base64::engine::general_purpose::URL_SAFE.encode(random_bytes))
    }
}

impl From<Id> for String {
    fn from(value: Id) -> Self {
        value.0
    }
}

impl Display for Id {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.as_str())
    }
}

uniffi::custom_newtype!(Id, String);

impl Serialize for Id {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error> where S: Serializer {
        serializer.serialize_newtype_struct("Id", &self.0)
    }
}

impl<'de> Deserialize<'de> for Id {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error> where D: Deserializer<'de> {
        deserializer.deserialize_string(IdVisitor)
    }
}

struct IdVisitor;
impl Visitor<'_> for IdVisitor {
    type Value = Id;

    fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
        formatter.write_str("a string")
    }

    fn visit_string<E>(self, s: String) -> Result<Self::Value, E> where E: Error {
        Ok(Id(s))
    }

    fn visit_str<E>(self, s: &str) -> Result<Self::Value, E> where E: Error {
        Ok(Id(s.to_owned()))
    }
}

