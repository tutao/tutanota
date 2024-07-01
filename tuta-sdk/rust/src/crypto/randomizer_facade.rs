use std::sync::{Arc, Mutex};
use rand_core::CryptoRngCore;

pub trait RandomizerFacade: Send + Sync {
    fn get_rng_core(&self) -> Arc<Mutex<Box<dyn CryptoRngCore + Send + Sync>>>;
}

/// Convenience function for getting a thread-safe randomizer and doing something with it.
pub fn random<T, R: RandomizerFacade + ?Sized, F: FnMut(&mut dyn CryptoRngCore) -> T>(
    randomizer_facade: &R,
    mut what: F
) -> T {
    what(randomizer_facade.get_rng_core().lock().unwrap().as_mut())
}

#[cfg(test)]
pub mod test_util {
    use std::sync::{Arc, Mutex};
    use rand_core::CryptoRngCore;
    use super::*;

    /// Used for internal testing using OsRng.
    pub struct TestRandomizerFacade {
        randomizer: Arc<Mutex<Box<dyn CryptoRngCore + Send + Sync>>>
    }

    impl TestRandomizerFacade {
        pub fn new() -> Self {
            Self {
                randomizer: Arc::new(Mutex::new(Box::new(rand::rngs::OsRng {})))
            }
        }
    }

    impl RandomizerFacade for TestRandomizerFacade {
        fn get_rng_core(&self) -> Arc<Mutex<Box<dyn CryptoRngCore + Send + Sync>>> {
            self.randomizer.clone()
        }
    }
}
