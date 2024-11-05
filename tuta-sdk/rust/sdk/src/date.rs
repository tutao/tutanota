// for exposing date_provider::stub
#[cfg(test)]
pub(crate) mod date_provider;
#[cfg(not(test))]
pub(crate) mod date_provider;
mod date_time;

pub use date_provider::DateProvider;
pub use date_time::DateTime;
pub use date_time::DATETIME_STRUCT_NAME;
