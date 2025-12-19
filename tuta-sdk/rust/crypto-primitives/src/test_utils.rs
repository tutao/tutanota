use crate::aes::Aes256Key;
use crate::randomizer_facade::test_util::make_thread_rng_facade;
use rand::random;

#[must_use]
pub fn random_aes256_key() -> Aes256Key {
	Aes256Key::from_bytes(&random::<[u8; 32]>()).unwrap()
}

/// Generates a URL-safe random string of length `Size`.
#[must_use]
pub fn generate_random_string<const SIZE: usize>() -> String {
	use base64::engine::Engine;
	use base64::prelude::BASE64_URL_SAFE_NO_PAD;
	let random_bytes: [u8; SIZE] = make_thread_rng_facade().generate_random_array();
	BASE64_URL_SAFE_NO_PAD.encode(random_bytes)
}
