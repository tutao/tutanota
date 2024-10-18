use napi::bindgen_prelude::*;

pub(crate) mod console;
mod logger;

/// todo: plumb through SDK's log messages? it's currently using simple_logger when not compiled
/// todo: for ios or android.
pub use crate::logging::console::Console;
