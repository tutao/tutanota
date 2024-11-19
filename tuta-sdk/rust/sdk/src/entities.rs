use std::collections::HashMap;

use serde::{Deserialize, Serialize};

pub use crate::date::DateTime;
use crate::element_value::ElementValue;
pub use crate::IdTupleCustom;
pub use crate::IdTupleGenerated;
use crate::TypeRef;

pub mod entity_facade;
#[rustfmt::skip]
pub mod generated;
pub mod json_size_estimator;

/// `'static` on trait bound is fine here because Entity does not contain any non-static references.
/// See https://doc.rust-lang.org/rust-by-example/scope/lifetime/static_lifetime.html#trait-bound
pub trait Entity: 'static {
	fn type_ref() -> TypeRef;
}

/// A wrapper for the value in _finalIvs map on entities.
/// Once we decrypt a final field we want to be able to re-encrypt it
/// to the same exact value. For that we need to use the same initialization
/// vector.
/// FinalIv holds such an IV for a specific field.
#[derive(Clone, Serialize, Deserialize, Debug, PartialEq)]
#[serde(transparent)]
pub struct FinalIv(#[serde(with = "serde_bytes")] Vec<u8>);

uniffi::custom_newtype!(FinalIv, Vec<u8>);

type Errors = HashMap<String, ElementValue>;
