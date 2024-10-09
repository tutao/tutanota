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
			_ => panic!(
				"Invalid type, expected bytes, got: {}",
				self.type_variant_name()
			),
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

	pub fn assert_dict_mut_ref(&mut self) -> &mut HashMap<String, ElementValue> {
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

	pub fn assert_custom_id(&self) -> &CustomId {
		match self {
			ElementValue::IdCustomId(value) => value,
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

impl From<()> for ElementValue {
	fn from(_: ()) -> Self {
		Self::Null
	}
}

impl From<String> for ElementValue {
	fn from(value: String) -> Self {
		Self::String(value)
	}
}

impl From<i64> for ElementValue {
	fn from(value: i64) -> Self {
		Self::Number(value)
	}
}

impl From<Vec<u8>> for ElementValue {
	fn from(value: Vec<u8>) -> Self {
		Self::Bytes(value)
	}
}

impl From<DateTime> for ElementValue {
	fn from(value: DateTime) -> Self {
		Self::Date(value)
	}
}

impl From<bool> for ElementValue {
	fn from(value: bool) -> Self {
		Self::Bool(value)
	}
}

impl From<GeneratedId> for ElementValue {
	fn from(value: GeneratedId) -> Self {
		Self::IdGeneratedId(value)
	}
}

impl From<CustomId> for ElementValue {
	fn from(value: CustomId) -> Self {
		Self::IdCustomId(value)
	}
}

impl From<IdTuple> for ElementValue {
	fn from(value: IdTuple) -> Self {
		Self::IdTupleId(value)
	}
}

impl From<HashMap<String, ElementValue>> for ElementValue {
	fn from(value: HashMap<String, ElementValue>) -> Self {
		Self::Dict(value)
	}
}

impl From<Vec<ElementValue>> for ElementValue {
	fn from(value: Vec<ElementValue>) -> Self {
		Self::Array(value)
	}
}
