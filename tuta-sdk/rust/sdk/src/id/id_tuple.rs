use crate::id::custom_id::CustomId;
use crate::GeneratedId;
use serde::{Deserialize, Serialize};
use std::fmt::{Display, Formatter};

pub const ID_TUPLE_GENERATED_NAME: &str = "IdTupleGenerated";
pub const ID_TUPLE_CUSTOM_NAME: &str = "IdTupleCustom";

/// Denotes an ID that can be serialised into a string and used to access resources
pub trait IdType: Display + 'static {}

/// Denotes a basic ID type such as GeneratedId or CustomID that can be serialised into a string and used to access resources
pub trait BaseIdType: Display + IdType + 'static {}
pub trait IdTupleType: Display + IdType + 'static {}

/// A set of keys used to identify an element within a List Element Type
#[derive(uniffi::Record, Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
pub struct IdTupleGenerated {
	pub list_id: GeneratedId,
	pub element_id: GeneratedId,
}

/// A set of keys used to identify an element within a List Element Type
#[derive(uniffi::Record, Debug, Eq, PartialEq, Clone, Serialize, Deserialize)]
pub struct IdTupleCustom {
	pub list_id: GeneratedId,
	pub element_id: CustomId,
}

impl IdTupleGenerated {
	#[must_use]
	pub fn new(list_id: GeneratedId, element_id: GeneratedId) -> Self {
		Self {
			list_id,
			element_id,
		}
	}
}

impl IdTupleCustom {
	#[must_use]
	pub fn new(list_id: GeneratedId, element_id: CustomId) -> Self {
		Self {
			list_id,
			element_id,
		}
	}
}
impl IdType for IdTupleGenerated {}
impl IdTupleType for IdTupleGenerated {}
impl IdType for IdTupleCustom {}
impl IdTupleType for IdTupleCustom {}

impl Display for IdTupleGenerated {
	fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
		write!(f, "{}/{}", self.list_id, self.element_id)
	}
}

impl Display for IdTupleCustom {
	fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
		write!(f, "{}/{}", self.list_id, self.element_id)
	}
}
