use std::collections::HashMap;
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

type Errors = HashMap<String, ElementValue>;

