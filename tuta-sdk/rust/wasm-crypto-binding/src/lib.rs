mod utils;

use tutasdk::crypto::ed25519::Ed25519KeyPair;
use tutasdk::crypto::randomizer_facade::RandomizerFacade;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn generate_ed25519_keypair() -> Result<JsValue, JsValue> {
	let mut randomizer_facade = RandomizerFacade::from_core(rand::rngs::OsRng {});
	let generated_key_pair = Ed25519KeyPair::generate(&mut randomizer_facade);
	Ok(serde_wasm_bindgen::to_value(&generated_key_pair)?)
}
