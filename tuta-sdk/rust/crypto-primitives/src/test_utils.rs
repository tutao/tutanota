use crate::aes::Aes256Key;
use crate::randomizer_facade::test_util::make_thread_rng_facade;
use rand::random;
use rand_core::impls::{next_u32_via_fill, next_u64_via_fill};
use rand_core::{CryptoRng, Error, RngCore};
use zeroize::ZeroizeOnDrop;

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

/// Used for providing the same bytes from the seed over and over again.
///
/// # Panics
///
/// This will panic if not enough bytes have been passed into the random number generator.
#[derive(ZeroizeOnDrop)]
pub struct TestRng {
	buff: Vec<u8>,
}

impl TestRng {
	pub fn new(buff: Vec<u8>) -> Self {
		Self { buff }
	}
}

impl RngCore for TestRng {
	fn next_u32(&mut self) -> u32 {
		next_u32_via_fill(self)
	}

	fn next_u64(&mut self) -> u64 {
		next_u64_via_fill(self)
	}

	fn fill_bytes(&mut self, dest: &mut [u8]) {
		dest.copy_from_slice(&self.buff[..dest.len()]);
	}

	fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), Error> {
		self.fill_bytes(dest);
		Ok(())
	}
}

impl CryptoRng for TestRng {}
