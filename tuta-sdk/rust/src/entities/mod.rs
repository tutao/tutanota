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

pub trait Entity: 'static {
    fn type_ref() -> TypeRef;
}

