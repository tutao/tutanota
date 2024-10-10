use rand_core::{CryptoRng, CryptoRngCore, Error, RngCore};
use std::sync::{Arc, Mutex};

/// Provides an interface for generating values from a `CryptoRngCore` in a thread-safe way.
pub struct RandomizerFacade {
	source: Arc<Mutex<Box<dyn CryptoRngCore + Send + Sync>>>,
}

impl RandomizerFacade {
	/// Instantiate this facade with the given core.
	pub fn from_core<C: CryptoRngCore + Send + Sync + 'static>(core: C) -> Self {
		Self {
			source: Arc::new(Mutex::new(Box::new(core))),
		}
	}

	/// Create a copy of this facade.
	///
	/// The source will be shared between both instances.
	///
	/// This is useful if you want to make a mutable version of this facade to use in functions that
	/// directly require a CryptoRngCore.
	pub(in crate::crypto) fn clone(&self) -> Self {
		Self {
			source: self.source.clone(),
		}
	}

	/// Generate a random array of a given size.
	#[must_use]
	pub fn generate_random_array<const S: usize>(&self) -> [u8; S] {
		let mut output = [0u8; S];
		self.fill_slice(&mut output);
		output
	}

	fn fill_slice(&self, output: &mut [u8]) {
		let mut source = self.source.lock().expect("how???");
		source.fill_bytes(output)
	}
}

impl CryptoRng for RandomizerFacade {}

impl RngCore for RandomizerFacade {
	fn next_u32(&mut self) -> u32 {
		rand_core::impls::next_u32_via_fill(self)
	}

	fn next_u64(&mut self) -> u64 {
		rand_core::impls::next_u64_via_fill(self)
	}

	fn fill_bytes(&mut self, dest: &mut [u8]) {
		self.fill_slice(dest)
	}

	fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), Error> {
		self.fill_slice(dest);
		Ok(())
	}
}

#[cfg(test)]
pub mod test_util {
	use super::*;

	/// Used for internal testing using OsRng.
	#[must_use]
	pub fn make_thread_rng_facade() -> RandomizerFacade {
		RandomizerFacade::from_core(rand::rngs::OsRng {})
	}

	#[derive(Clone)]
	pub struct DeterministicRng(pub u8);
	impl RngCore for DeterministicRng {
		fn next_u32(&mut self) -> u32 {
			self.0.into()
		}

		fn next_u64(&mut self) -> u64 {
			self.0.into()
		}

		fn fill_bytes(&mut self, dest: &mut [u8]) {
			dest.fill(self.0)
		}

		fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), Error> {
			self.fill_bytes(dest);
			Ok(())
		}
	}
	impl CryptoRng for DeterministicRng {}
}
