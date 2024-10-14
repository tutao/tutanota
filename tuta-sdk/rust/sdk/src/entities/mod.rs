use std::collections::HashMap;

use serde::{Deserialize, Serialize};

use crate::custom_id::CustomId;
use crate::date::DateTime;
use crate::element_value::ElementValue;
use crate::generated_id::GeneratedId;
pub use crate::IdTuple;
use crate::TypeRef;

pub mod accounting;
pub mod base;
pub mod entity_facade;
pub mod gossip;
pub mod monitor;
pub mod storage;
pub mod sys;
pub mod tutanota;
pub mod usage;

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
