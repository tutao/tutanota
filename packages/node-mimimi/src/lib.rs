#![deny(clippy::all)]
#[macro_use]
extern crate napi_derive;
extern crate tutasdk;

#[cfg(not(feature = "rust"))]
pub mod importer;

#[cfg(not(feature = "rust"))]
pub mod tuta;

#[cfg(not(feature = "rust"))]
pub mod imap;

#[cfg(not(feature = "rust"))]
pub mod logging;
