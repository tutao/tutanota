mod utils;

mod compatibility_test_utils;
mod ed25519;
mod randomizer_facade;

use ed25519::Ed25519KeyPair;
use randomizer_facade::RandomizerFacade;

use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[wasm_bindgen]
pub fn generate_ed25519_keypair() -> Ed25519KeyPair {
	let mut randomizer_facade = RandomizerFacade::from_core(rand_core::OsRng {});
	Ed25519KeyPair::generate(&mut randomizer_facade)
}
