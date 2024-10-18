use napi::bindgen_prelude::*;

mod logger;
pub(crate) mod console;

/// todo: plumb through SDK's log messages? it's currently using simple_logger when not compiled
/// todo: for ios or android.

pub use crate::logging::console::Console;




