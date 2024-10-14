use std::collections::HashMap;

use crate::date::DateTime;
use crate::element_value::ElementValue;
use serde::Deserialize;

/// A kind of element that can appear in the model
#[derive(Deserialize, PartialEq, Clone, Debug)]
pub enum ElementType {
	/// Entity referenced by a single id
	#[serde(rename = "ELEMENT_TYPE")]
	Element,
	/// Entity referenced by IdTuple. Belongs to a list
	#[serde(rename = "LIST_ELEMENT_TYPE")]
	ListElement,
	/// Non-persistent element, used for service input/output
	#[serde(rename = "DATA_TRANSFER_TYPE")]
	DataTransfer,
	/// Structure embedded in another type
	#[serde(rename = "AGGREGATED_TYPE")]
	Aggregated,
	/// Element that is backed by blob store
	#[serde(rename = "BLOB_ELEMENT_TYPE")]
	BlobElement,
}

#[derive(Deserialize, Clone, Debug)]
pub enum ValueType {
	String,
	Number,
	Bytes,
	Date,
	Boolean,
	GeneratedId,
	CustomId,
	CompressedString,
}

impl ValueType {
	pub fn get_default(&self) -> ElementValue {
		match self {
			ValueType::String | ValueType::CompressedString => ElementValue::String(String::new()),
			ValueType::Number => ElementValue::Number(0),
			ValueType::Bytes => ElementValue::Bytes(Vec::new()),
			ValueType::Date => ElementValue::Date(DateTime::default()),
			ValueType::Boolean => ElementValue::Bool(false),
			ValueType::GeneratedId | ValueType::CustomId => {
				panic!("Can not have default value: {self:?}")
			},
		}
	}
}

/// Associations (references and aggregations) have two dimensions: the type they reference and
/// their cardinality.
#[derive(Deserialize, PartialEq, Clone)]
pub enum Cardinality {
	/// Optional
	ZeroOrOne,
	/// A list of items
	Any,
	/// Exactly one item
	One,
}

/// Relationships between elements are described as association
#[derive(Deserialize, Clone, Eq, PartialEq)]
pub enum AssociationType {
	/// References [ElementType] by id
	#[serde(rename = "ELEMENT_ASSOCIATION")]
	ElementAssociation,
	/// References List (of [ListElementType] by list id
	#[serde(rename = "LIST_ASSOCIATION")]
	ListAssociation,
	/// References List elem (of [ListElementType] by list id
	#[serde(rename = "LIST_ELEMENT_ASSOCIATION")]
	ListElementAssociation,
	/// References [Aggregation]
	#[serde(rename = "AGGREGATION")]
	Aggregation,
	/// References [BlobElement]
	#[serde(rename = "BLOB_ELEMENT_ASSOCIATION")]
	BlobElementAssociation,
}

/// Description of the value (value field of Element)
#[derive(Deserialize, Clone)]
pub struct ModelValue {
	pub id: u64,
	#[serde(rename = "type")]
	pub value_type: ValueType,
	pub cardinality: Cardinality,
	/// whether can it be changed
	#[serde(rename = "final")]
	pub is_final: bool,
	pub encrypted: bool,
}

/// Description of the association (association field of Element)
#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModelAssociation {
	pub id: u64,
	#[serde(rename = "type")]
	pub association_type: AssociationType,
	pub cardinality: Cardinality,
	/// Name of the type it is referencing
	pub ref_type: &'static str,
	/// Can it be changed
	#[serde(rename = "final")]
	pub is_final: bool,
	/// From which model we import this association from. Currently the field only exists for aggregates because they are only ones
	/// which can be imported across models.
	pub dependency: Option<&'static str>,
}

/// Description of a single Element type
#[derive(Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TypeModel {
	pub id: u64,
	/// Since which model version was it introduced
	pub since: u64,
	/// App/model it belongs to
	pub app: &'static str,
	/// Model version
	pub version: &'static str,
	/// Name of the element
	pub name: &'static str,
	/// Kind of the element
	#[serde(rename = "type")]
	pub element_type: ElementType,
	pub versioned: bool,
	encrypted: bool,
	pub root_id: &'static str,
	pub values: HashMap<&'static str, ModelValue>,
	pub associations: HashMap<&'static str, ModelAssociation>,
}

impl TypeModel {
	/// Whether entity is marked as encrypted in the metamodel.
	/// This is not the case for aggregates even though they might contain encrypted fields.
	pub fn marked_encrypted(&self) -> bool {
		self.encrypted
	}
	/// Whether it is expected that the type might contain encrypted fields.
	pub fn is_encrypted(&self) -> bool {
		if self.element_type == ElementType::Aggregated {
			// Aggregates do not track whether they are encrypted
			self.values.values().any(|v| v.encrypted)
		} else {
			self.encrypted
		}
	}
}
