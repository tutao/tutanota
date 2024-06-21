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
mod entity_facade;

use crate::date::Date as Date;
use crate::id::Id as Id;

pub trait Entity {
    fn type_ref() -> TypeRef;
}

#[cfg(test)]
mod entity_facade_test_utils;
