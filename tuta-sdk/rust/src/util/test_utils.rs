//! General purpose functions for testing various objects

use rand::thread_rng;
use crate::util::generate_random_bytes;

/// Generates a URL-safe random string of length `Size`.
pub fn generate_random_string<const SIZE: usize>() -> String {
    use base64::engine::Engine;
    let mut random_number_generator = thread_rng();
    let random_bytes: [u8; SIZE] = generate_random_bytes(&mut random_number_generator);
    base64::engine::general_purpose::URL_SAFE.encode(random_bytes)
}
