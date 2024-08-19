use std::collections::HashMap;
use serde::{Deserialize, Serialize};
pub use crate::IdTuple;
use crate::TypeRef;

pub(crate) mod accounting;
pub(crate) mod base;
pub(crate) mod gossip;
pub(crate) mod monitor;
pub(crate) mod storage;
pub(crate) mod sys;
pub(crate) mod tutanota;
pub(crate) mod usage;
pub(crate) mod entity_facade;

use crate::date::DateTime;
use crate::generated_id::GeneratedId;
use crate::custom_id::CustomId;
use crate::element_value::ElementValue;

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
#[derive(Clone, Serialize, Deserialize, Debug)]
#[serde(transparent)]
pub struct FinalIv(
    #[serde(with = "serde_bytes")]
    Vec<u8>
);

uniffi::custom_newtype!(FinalIv, Vec<u8>);

type Errors = HashMap<String, ElementValue>;

