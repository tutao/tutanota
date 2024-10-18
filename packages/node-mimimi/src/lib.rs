#![deny(clippy::all)]

#[cfg(feature = "javascript")]
#[macro_use]
extern crate napi_derive;
#[macro_use]
extern crate tutasdk;

pub mod imap;
pub mod tuta;

#[cfg(feature = "javascript")]
pub mod importer;
#[cfg(feature = "javascript")]
pub mod logging;
