mod utils;

mod aes;
pub mod compatibility_test_utils;
pub mod ed25519;
mod hmac;
mod key;
pub mod randomizer_facade;
mod sha;
#[cfg(test)]
mod test_utils;

use ed25519::Ed25519KeyPair;
use randomizer_facade::RandomizerFacade;
use serde::{Deserialize, Serialize};
use tsify::Tsify;

use crate::aes::{Aes256Key, AesDecryptError, PlaintextAndIv};
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

#[derive(Tsify, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub enum AesDecryptErrorWasm {
	InvalidDataSizeError,
	PaddingError,
	HmacError,
}

impl From<AesDecryptError> for AesDecryptErrorWasm {
	fn from(value: AesDecryptError) -> Self {
		match value {
			AesDecryptError::InvalidDataSizeError => Self::InvalidDataSizeError,
			AesDecryptError::PaddingError(_) => Self::PaddingError,
			AesDecryptError::HmacError(_) => Self::HmacError,
		}
	}
}

#[wasm_bindgen]
pub fn aes_256_decrypt(key: Aes256Key, encrypted_bytes: &[u8]) -> Option<PlaintextAndIv> {
	aes::aes_256_decrypt(&key, encrypted_bytes).ok()
}
