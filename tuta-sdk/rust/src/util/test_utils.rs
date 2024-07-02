//! General purpose functions for testing various objects

use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;

/// Generates a URL-safe random string of length `Size`.
pub fn generate_random_string<const SIZE: usize>() -> String {
    use base64::engine::Engine;
    let random_bytes: [u8; SIZE] = make_thread_rng_facade().generate_random_array();
    base64::engine::general_purpose::URL_SAFE.encode(random_bytes)
}
