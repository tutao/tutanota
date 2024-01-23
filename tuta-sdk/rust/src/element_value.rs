use std::collections::HashMap;
use std::time::SystemTime;
use crate::IdTuple;

/// Primitive value types used by entity/instance types
#[derive(uniffi::Enum, Debug, PartialEq, Clone)]
pub enum ElementValue {
    Null,
    String(String),
    Number(i64),
    Bytes(Vec<u8>),
    Date(SystemTime),
    Bool(bool),
    GeneratedId(String),
    CustomId(String),
    IdTupleId(IdTuple),
    Dict(HashMap<String, ElementValue>),
    Array(Vec<ElementValue>),
}

pub type ParsedEntity = HashMap<String, ElementValue>;


impl ElementValue {
    pub fn assert_number(&self) -> i64 {
        match self {
            ElementValue::Number(number) => number.clone(),
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_string(&self) -> String {
        self.assert_str().to_string()
    }

    pub fn assert_array(&self) -> Vec<ElementValue> {
        match self {
            ElementValue::Array(value) => value.to_vec(),
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_dict(&self) -> HashMap<String, ElementValue> {
        match self {
            ElementValue::Dict(value) => value.clone(),
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_array_ref(&self) -> &Vec<ElementValue> {
        match self {
            ElementValue::Array(value) => value,
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_dict_ref(&self) -> &HashMap<String, ElementValue> {
        match self {
            ElementValue::Dict(value) => value,
            _ => panic!("Invalid type"),
        }
    }

    pub fn assert_str(&self) -> &str {
        match self {
            ElementValue::String(value) => value,
            _ => panic!("Invalid type"),
        }
    }
}
