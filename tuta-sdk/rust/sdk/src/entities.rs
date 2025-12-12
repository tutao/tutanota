use std::collections::HashMap;

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

pub type Errors = HashMap<String, ElementValue>;
