mod utils;

pub mod compatibility_test_utils;
mod ed25519;
pub mod randomizer_facade;

use ed25519::Ed25519KeyPair;
use randomizer_facade::RandomizerFacade;

use crate::ed25519::{Ed25519PrivateKey, Ed25519PublicKey, Ed25519Signature};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn ed25519_generate_keypair() -> Ed25519KeyPair {
	let mut randomizer_facade = RandomizerFacade::from_core(rand_core::OsRng {});
	Ed25519KeyPair::generate(&mut randomizer_facade)
}

#[wasm_bindgen]
pub fn ed25519_sign(private_key: Ed25519PrivateKey, message: &[u8]) -> Ed25519Signature {
	private_key.sign(message)
}

#[wasm_bindgen]
pub fn ed25519_verify(
	public_key: Ed25519PublicKey,
	message: &[u8],
	signature: Ed25519Signature,
) -> bool {
	public_key.verify(message, &signature).is_ok()
}
