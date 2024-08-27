use crate::custom_id::CustomId;
use crate::date::DateTime;
use crate::generated_id::GeneratedId;
use crate::IdTuple;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Primitive value types used by entity/instance types
#[derive(uniffi::Enum, Debug, Serialize, Deserialize, PartialEq, Clone)]
pub enum ElementValue {
	Null,
	String(String),
	Number(i64),
	Bytes(Vec<u8>),
	Date(DateTime),
	Bool(bool),
	// Names are prefixed with 'Id' to avoid name collision in Kotlin
	IdGeneratedId(GeneratedId),
	IdCustomId(CustomId),
	IdTupleId(IdTuple),
	Dict(HashMap<String, ElementValue>),
	Array(Vec<ElementValue>),
}

pub type ParsedEntity = HashMap<String, ElementValue>;

impl ElementValue {
	pub fn assert_number(&self) -> i64 {
		match self {
			ElementValue::Number(number) => *number,
			_ => panic!("Invalid type"),
		}
	}

	pub fn assert_string(&self) -> String {
		self.assert_str().to_string()
	}

	pub fn assert_array(&self) -> Vec<ElementValue> {
		match self {
			ElementValue::Array(value) => value.clone(),
			_ => panic!("Invalid type"),
		}
	}

	pub fn assert_bytes(&self) -> Vec<u8> {
		match self {
			ElementValue::Bytes(value) => value.clone(),
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

	pub fn assert_generated_id(&self) -> &GeneratedId {
		match self {
			ElementValue::IdGeneratedId(value) => value,
			_ => panic!("Invalid type"),
		}
	}
	pub fn assert_tuple_id(&self) -> &IdTuple {
		match self {
			ElementValue::IdTupleId(value) => value,
			_ => panic!("Invalid type"),
		}
	}

	pub fn assert_date(&self) -> &DateTime {
		match self {
			ElementValue::Date(value) => value,
			_ => panic!("Invalid type"),
		}
	}

	pub fn assert_bool(&self) -> bool {
		match self {
			ElementValue::Bool(value) => *value,
			_ => panic!("Invalid type"),
		}
	}

	pub(crate) fn type_variant_name(&self) -> &'static str {
		match self {
			Self::Null => "Null",
			Self::String(_) => "String",
			Self::Number(_) => "Number",
			Self::Bytes(_) => "Bytes",
			Self::Date(_) => "Date",
			Self::Bool(_) => "Bool",
			Self::IdGeneratedId(_) => "IdGeneratedId",
			Self::IdCustomId(_) => "IdCustomId",
			Self::IdTupleId(_) => "IdTupleId",
			Self::Dict(_) => "Dict",
			Self::Array(_) => "Array",
		}
	}
}
