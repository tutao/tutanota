use crate::date::DateTime;
use crate::element_value::ElementValue;
use crate::{ApiCallError, CustomId, TypeRef};
use serde::{Deserialize, Deserializer, Serialize};
use std::collections::HashMap;
use std::fmt::{Display, Formatter};
use std::sync::Arc;
use thiserror::Error;

/// A kind of element that can appear in the model
#[derive(Deserialize, Serialize, PartialEq, Clone, Debug)]
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

#[derive(Deserialize, Serialize, Clone, Debug)]
#[cfg_attr(test, derive(PartialEq))]
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
#[derive(Deserialize, Serialize, PartialEq, Clone, Copy, Debug)]
#[repr(u8)]
pub enum Cardinality {
	/// Optional
	ZeroOrOne,
	/// A list of items
	Any,
	/// Exactly one item
	One,
}

/// Relationships between elements are described as association
#[derive(Deserialize, Serialize, Clone, Eq, PartialEq, Debug)]
pub enum AssociationType {
	/// References [ElementType] by id
	#[serde(rename = "ELEMENT_ASSOCIATION")]
	ElementAssociation,
	/// References List (of [ListElementType] by list id
	#[serde(rename = "LIST_ASSOCIATION")]
	ListAssociation,
	/// References List elem (of [ListElementType] by list id
	#[serde(rename = "LIST_ELEMENT_ASSOCIATION_GENERATED")]
	ListElementAssociationGenerated,
	/// References [Aggregation]
	#[serde(rename = "AGGREGATION")]
	Aggregation,
	/// References [BlobElement]
	#[serde(rename = "BLOB_ELEMENT_ASSOCIATION")]
	BlobElementAssociation,
	#[serde(rename = "LIST_ELEMENT_ASSOCIATION_CUSTOM")]
	ListElementAssociationCustom,
}

/// Description of the value (value field of Element)
#[derive(Deserialize, Serialize, Clone)]
#[cfg_attr(test, derive(Debug, PartialEq))]
pub struct ModelValue {
	#[serde(with = "as_number")]
	pub id: AttributeId,
	pub name: String,
	#[serde(rename = "type")]
	pub value_type: ValueType,
	pub cardinality: Cardinality,
	/// whether can it be changed
	#[serde(rename = "final")]
	pub is_final: bool,
	pub encrypted: bool,
}

/// Description of the association (association field of Element)
#[derive(Deserialize, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(test, derive(Debug, PartialEq))]
pub struct ModelAssociation {
	#[serde(with = "as_number")]
	pub id: AttributeId,
	pub name: String,
	#[serde(rename = "type")]
	pub association_type: AssociationType,
	pub cardinality: Cardinality,
	/// typeId of the type it is referencing
	#[serde(with = "as_number_t")]
	pub ref_type_id: TypeId,
	/// Can it be changed
	#[serde(rename = "final")]
	pub is_final: bool,
	/// From which model we import this association from. Currently, the field only exists for aggregates because they are only ones
	/// which can be imported across models.
	pub dependency: Option<AppName>,
}

mod as_number {
	use super::*;

	pub fn deserialize<'de, D>(d: D) -> Result<AttributeId, D::Error>
	where
		D: Deserializer<'de>,
	{
		<u64 as Deserialize>::deserialize(d).map(From::from)
	}

	pub fn serialize<S>(id: &AttributeId, serializer: S) -> Result<S::Ok, S::Error>
	where
		S: serde::Serializer,
	{
		<u64 as serde::Serialize>::serialize(&id.0, serializer)
	}
}

mod as_number_t {
	use super::*;

	pub fn deserialize<'de, D>(d: D) -> Result<TypeId, D::Error>
	where
		D: Deserializer<'de>,
	{
		<u64 as Deserialize>::deserialize(d).map(From::from)
	}

	pub fn serialize<S>(id: &TypeId, serializer: S) -> Result<S::Ok, S::Error>
	where
		S: serde::Serializer,
	{
		<u64 as serde::Serialize>::serialize(&id.0, serializer)
	}
}

#[derive(Deserialize, Serialize, Clone)]
#[cfg_attr(test, derive(Debug, PartialEq))]
pub struct ApplicationModel {
	pub name: AppName,
	pub version: String,
	pub types: HashMap<TypeId, Arc<TypeModel>>,
}

#[derive(Deserialize, Serialize, Clone)]
#[cfg_attr(test, derive(Debug, PartialEq))]
pub struct ApplicationModels {
	pub apps: HashMap<AppName, ApplicationModel>,
}

/// Description of a single Element type
#[derive(Deserialize, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
#[cfg_attr(test, derive(Debug, PartialEq))]
pub struct TypeModel {
	#[serde(with = "as_number_t")]
	pub id: TypeId,
	/// Since which model version was it introduced
	pub since: u64,
	/// App/model it belongs to
	pub app: AppName,
	/// Model version
	pub version: u64,
	/// Name of the element
	pub name: String,
	/// Kind of the element
	#[serde(rename = "type")]
	pub element_type: ElementType,
	pub versioned: bool,
	pub encrypted: bool,
	pub values: HashMap<AttributeId, ModelValue>,
	pub associations: HashMap<AttributeId, ModelAssociation>,
	pub root_id: CustomId,
}

#[derive(Error, Debug)]
#[error("Error when accessing type model: {0}")]
pub struct TypeModelError(String);

impl From<TypeModelError> for ApiCallError {
	fn from(type_model_err: TypeModelError) -> Self {
		ApiCallError::internal(format!("{type_model_err}"))
	}
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

	pub fn is_attribute_id_association(&self, attribute_id: &AttributeId) -> bool {
		self.associations.contains_key(attribute_id)
	}

	pub fn get_attribute_id_cardinality(
		&self,
		attribute_id: &AttributeId,
	) -> Result<&Cardinality, TypeModelError> {
		if let Some(cardinality) = self.associations.get(attribute_id).map(|a| &a.cardinality) {
			Ok(cardinality)
		} else {
			Err(TypeModelError(format!(
				"did not find association with attributeId {attribute_id:?}"
			)))
		}
	}

	pub fn get_association_by_attribute_id(
		&self,
		attribute_id: &AttributeId,
	) -> Result<&ModelAssociation, TypeModelError> {
		self.associations.get(attribute_id).ok_or_else(|| {
			TypeModelError(format!(
				"no association found with attribute_id '{attribute_id:?}' int type: {}",
				self.name
			))
		})
	}

	pub fn get_attribute_id_by_attribute_name(
		&self,
		attribute_name: &str,
	) -> Result<String, TypeModelError> {
		if let Some((attr_id, _model_value)) = self
			.values
			.iter()
			.find(|(_, value)| value.name == attribute_name)
		{
			return Ok(String::from(*attr_id));
		}

		if let Some((attr_id, _model_association)) = self
			.associations
			.iter()
			.find(|(_, association)| association.name == attribute_name)
		{
			return Ok(String::from(*attr_id));
		}

		Err(TypeModelError(format!(
			"did not find attribute with name '{attribute_name}' in values or associations in type: {}",
			 self.name
		)))
	}

	pub fn is_same_type(&self, type_ref: &TypeRef) -> bool {
		self.app == type_ref.app && self.id == type_ref.type_id
	}

	pub fn is_same_type_by_attr_name(&self, app: AppName, name: &str) -> bool {
		self.app == app && self.name == name
	}

	pub fn type_ref(&self) -> TypeRef {
		TypeRef::new(self.app, self.id)
	}
}

/// The name of an app in the backend
#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "lowercase")]
#[derive(Debug, Clone, Copy, Eq, PartialEq, Hash)]
#[repr(u8)]
pub enum AppName {
	Accounting,
	Base,
	Gossip,
	Monitor,
	Storage,
	Sys,
	Tutanota,
	Usage,
	#[cfg(test)]
	Test,
	#[cfg(test)]
	EntityClientTestApp,
}

impl TryFrom<&str> for AppName {
	type Error = String;
	fn try_from(value: &str) -> Result<Self, Self::Error> {
		match value {
			"accounting" => Ok(AppName::Accounting),
			"base" => Ok(AppName::Base),
			"gossip" => Ok(AppName::Gossip),
			"monitor" => Ok(AppName::Monitor),
			"storage" => Ok(AppName::Storage),
			"sys" => Ok(AppName::Sys),
			"tutanota" => Ok(AppName::Tutanota),
			"usage" => Ok(AppName::Usage),
			#[cfg(test)]
			"entityclienttestapp" => Ok(AppName::EntityClientTestApp),
			#[cfg(test)]
			"test" => Ok(AppName::Test),
			a => Err(format!("Unknown AppName: {a}")),
		}
	}
}

impl Display for AppName {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		match self {
			AppName::Accounting => write!(f, "accounting"),
			AppName::Base => write!(f, "base"),
			AppName::Gossip => write!(f, "gossip"),
			AppName::Monitor => write!(f, "monitor"),
			AppName::Storage => write!(f, "storage"),
			AppName::Sys => write!(f, "sys"),
			AppName::Tutanota => write!(f, "tutanota"),
			AppName::Usage => write!(f, "usage"),
			#[cfg(test)]
			AppName::Test => write!(f, "test"),
			#[cfg(test)]
			AppName::EntityClientTestApp => write!(f, "entityclienttestapp"),
		}
	}
}

#[repr(transparent)]
#[derive(Debug, serde::Deserialize, serde::Serialize, Hash, Clone, Copy, PartialEq, Eq)]
#[serde(try_from = "&'de str")]
#[serde(into = "String")]
pub struct TypeId(u64);

#[repr(transparent)]
#[derive(Debug, serde::Deserialize, serde::Serialize, Hash, Clone, Copy, PartialEq, Eq)]
#[serde(try_from = "&'de str")]
#[serde(into = "String")]
pub struct AttributeId(u64);

impl TryFrom<&str> for TypeId {
	type Error = <u64 as std::str::FromStr>::Err;
	fn try_from(value: &str) -> Result<Self, Self::Error> {
		value.parse::<u64>().map(Self)
	}
}

impl TryFrom<&str> for AttributeId {
	type Error = <u64 as std::str::FromStr>::Err;
	fn try_from(value: &str) -> Result<Self, Self::Error> {
		value.parse::<u64>().map(Self)
	}
}

impl TryFrom<String> for TypeId {
	type Error = <u64 as std::str::FromStr>::Err;
	fn try_from(value: String) -> Result<Self, Self::Error> {
		value.as_str().try_into()
	}
}

impl TryFrom<String> for AttributeId {
	type Error = <u64 as std::str::FromStr>::Err;
	fn try_from(value: String) -> Result<Self, Self::Error> {
		Self::try_from(value.as_str())
	}
}

impl From<AttributeId> for String {
	fn from(value: AttributeId) -> Self {
		value.0.to_string()
	}
}

impl From<TypeId> for String {
	fn from(value: TypeId) -> Self {
		value.0.to_string()
	}
}

impl From<u64> for AttributeId {
	fn from(value: u64) -> Self {
		Self(value)
	}
}

impl From<u64> for TypeId {
	fn from(value: u64) -> Self {
		Self(value)
	}
}

#[cfg(test)]
mod tests {
	use crate::metamodel::ApplicationModels;

	#[test]
	pub fn can_deserialize_empty_application() {
		let _models: ApplicationModels = serde_json::from_str("{\"apps\": {}}").unwrap();
	}
}
