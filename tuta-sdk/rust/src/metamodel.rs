use std::collections::HashMap;

use serde::Deserialize;

/// A kind of element that can appear in the model
#[derive(Deserialize, PartialEq)]
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

#[derive(Deserialize, Clone)]
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
#[derive(Deserialize, Clone)]
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
#[derive(Deserialize)]
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
pub struct ModelAssociation {
    pub id: u64,
    #[serde(rename = "type")]
    pub association_type: AssociationType,
    pub cardinality: Cardinality,
    /// Name of the type it is referencing
    #[serde(rename = "refType")]
    pub ref_type: String,
    /// Can it be changed
    #[serde(rename = "final")]
    pub is_final: bool,
    /// From which model we import this association from. Currently the field only exists for aggregates because they are only ones
    /// which can be imported across models.
    pub dependency: Option<String>,
}

/// Description of a single Element type
#[derive(Deserialize)]
pub struct TypeModel {
    pub id: u64,
    /// Since which model version was it introduced
    pub since: u64,
    /// App/model it belongs to
    pub app: String,
    /// Model version
    pub version: String,
    /// Name of the element
    pub name: String,
    /// Kind of the element
    #[serde(rename = "type")]
    pub element_type: ElementType,
    pub versioned: bool,
    pub encrypted: bool,
    #[serde(rename = "rootId")]
    pub root_id: String,
    pub values: HashMap<String, ModelValue>,
    pub associations: HashMap<String, ModelAssociation>,
}
