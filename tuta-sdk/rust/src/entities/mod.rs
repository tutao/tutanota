pub(crate) mod accounting;
pub(crate) mod base;
pub(crate) mod gossip;
pub(crate) mod monitor;
pub(crate) mod storage;
pub(crate) mod sys;
pub(crate) mod tutanota;
pub(crate) mod usage;

use crate::date::Date as Date;
use crate::id::Id as Id;

pub use crate::IdTuple;
use crate::TypeRef;

pub trait Entity {
    fn type_ref() -> TypeRef;
}
