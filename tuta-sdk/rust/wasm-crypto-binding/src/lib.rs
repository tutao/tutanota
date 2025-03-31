extern crate wasm_bindgen;
mod utils;

mod ed25519;
mod randomizer_facade;

use ed25519::{Ed25519KeyPair, Ed25519PublicKey};
use randomizer_facade::RandomizerFacade;
use wasm_bindgen::prelude::*;

// When the `wee_alloc` feature is enabled, use `wee_alloc` as the global
// allocator.
#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;

#[wasm_bindgen]
pub fn generate_ed25519_keypair() -> Ed25519PublicKey {
	let mut randomizer_facade = RandomizerFacade::from_core(rand::rngs::OsRng {});
	let generated_key_pair = Ed25519KeyPair::generate(&mut randomizer_facade);
	generated_key_pair.public_key.clone()
}

#[wasm_bindgen]
pub fn return_boxed_js_value_slice() -> Box<[JsValue]> {
	vec![JsValue::NULL, JsValue::UNDEFINED].into_boxed_slice()
}

#[wasm_bindgen]
pub fn return_string() -> JsValue {
	JsValue::from("Hello, World!")
}
