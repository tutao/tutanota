use std::time::Duration;

pub(crate) mod accounting;
pub(crate) mod base;
pub(crate) mod gossip;
pub(crate) mod monitor;
pub(crate) mod storage;
pub(crate) mod sys;
pub(crate) mod tutanota;
pub(crate) mod usage;

pub type Id = String;

pub use crate::IdTuple;

// TODO we should see if it's a good idea
pub type Date = Duration;