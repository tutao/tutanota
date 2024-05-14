use std::collections::HashMap;
use serde::{Deserialize, Deserializer, Serialize};
use serde::de::{Error, MapAccess, SeqAccess, Visitor};
use std::fmt::Formatter;

#[derive(uniffi::Enum, Debug, PartialEq, Serialize, Clone)]
#[serde(untagged)]
pub enum JsonElement {
    Null,
    String(String),
    Number(i32),
    Dict(HashMap<String, JsonElement>),
    Array(Vec<JsonElement>),
    Bool(bool),
}

impl JsonElement {
    pub fn assert_number(&self) -> i32 {
        match self {
            JsonElement::Number(number) => number.clone(),
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_string(&self) -> String {
        self.assert_str().to_string()
    }

    pub fn assert_array(&self) -> Vec<JsonElement> {
        match self {
            JsonElement::Array(value) => value.to_vec(),
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_dict(&self) -> HashMap<String, JsonElement> {
        match self {
            JsonElement::Dict(value) => value.clone(),
            _ => panic!("Invalid type"),
        }
    }
}

impl JsonElement {
    pub fn assert_array_ref(&self) -> &Vec<JsonElement> {
        match self {
            JsonElement::Array(value) => value,
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_dict_ref(&self) -> &HashMap<String, JsonElement> {
        match self {
            JsonElement::Dict(value) => value,
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_str(&self) -> &str {
        match self {
            JsonElement::String(value) => value,
            _ => panic!("Invalid type"),
        }
    }
}

struct JsonElementVisitor;

impl<'de> Visitor<'de> for JsonElementVisitor {
    type Value = JsonElement;

    fn expecting(&self, formatter: &mut Formatter) -> std::fmt::Result {
        formatter.write_str("A json element")
    }

    fn visit_unit<E>(self) -> Result<Self::Value, E> where E: Error {
        Ok(JsonElement::Null)
    }

    fn visit_none<E>(self) -> Result<Self::Value, E> where E: Error {
        Ok(JsonElement::Null)
    }

    fn visit_str<E>(self, v: &str) -> Result<Self::Value, E> where E: Error {
        Ok(JsonElement::String(v.to_owned()))
    }

    fn visit_string<E>(self, v: String) -> Result<Self::Value, E> where E: Error {
        Ok(JsonElement::String(v))
    }

    fn visit_i32<E>(self, v: i32) -> Result<Self::Value, E> where E: Error {
        Ok(JsonElement::Number(v))
    }

    fn visit_u32<E>(self, v: u32) -> Result<Self::Value, E> where E: Error {
        Ok(JsonElement::Number(i32::try_from(v).unwrap()))
    }

    fn visit_i64<E>(self, v: i64) -> Result<Self::Value, E> where E: Error {
        Ok(JsonElement::Number(i32::try_from(v).unwrap()))
    }

    fn visit_u64<E>(self, v: u64) -> Result<Self::Value, E> where E: Error {
        Ok(JsonElement::Number(i32::try_from(v).unwrap()))
    }

    fn visit_seq<A>(self, mut seq: A) -> Result<Self::Value, A::Error> where A: SeqAccess<'de> {
        let mut elements = Vec::new();
        while let Some(elem) = seq.next_element()? {
            elements.push(elem);
        }
        Ok(JsonElement::Array(elements))
    }

    fn visit_map<A>(self, mut map: A) -> Result<Self::Value, A::Error> where A: MapAccess<'de> {
        let mut elements = HashMap::new();
        while let Some((key, value)) = map.next_entry::<String, JsonElement>()? {
            elements.insert(key, value);
        }
        Ok(JsonElement::Dict(elements))
    }
}

impl<'de> Deserialize<'de> for JsonElement {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error> where D: Deserializer<'de> {
        deserializer.deserialize_any(JsonElementVisitor {})
    }
}

#[cfg(test)]
mod tests {
    use crate::json_element;
    use super::*;

    #[test]
    fn can_deserialize_null() {
        let json = "null";
        assert_eq!(serde_json::from_str::<json_element::JsonElement>(json).unwrap(), json_element::JsonElement::Null);
    }

    #[test]
    fn can_deserialize_number() {
        let json = "42";
        assert_eq!(serde_json::from_str::<json_element::JsonElement>(json).unwrap(), json_element::JsonElement::Number(42));
    }

    #[test]
    fn can_deserialize_map() {
        let json = r#"{"number": 42}"#;
        assert_eq!(serde_json::from_str::<HashMap<String, JsonElement>>(json).unwrap(), HashMap::from([("number".to_owned(), json_element::JsonElement::Number(42))]));
    }

    #[test]
    fn can_deserialize_email() {
        let json = include_str!("../test_data/email_response.json");
        let parsed = serde_json::from_str::<HashMap<String, JsonElement>>(json).unwrap();
        let address_map = match parsed.get("firstRecipient").unwrap() {
            JsonElement::Dict(map) => map,
            _ => panic!("Not a map!")
        };
        let address = match address_map.get("address").unwrap() {
            JsonElement::String(address) => address,
            _ => panic!("Not a string")
        };
        assert_eq!("bed-free@tutanota.de", address);
    }

    #[test]
    fn can_serialize_map() {
        let hashMap = HashMap::from([
            ("number".to_owned(), JsonElement::Number(42)),
            ("string".to_owned(), JsonElement::String("a string".to_owned())),
            ("dict".to_owned(), JsonElement::Dict(HashMap::from([("nested".to_owned(), JsonElement::String("value".to_owned()))])))
        ]);
        let map = JsonElement::Dict(hashMap);
        assert_eq!(map, serde_json::from_str(&serde_json::to_string(&map).unwrap()).unwrap());
    }
}