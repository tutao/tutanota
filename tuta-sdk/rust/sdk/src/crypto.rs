#![allow(dead_code)]
//! Contains implementations of cryptographic algorithms and their primitives
// TODO: Remove the above allowance when starting to implement higher level functions

pub use argon2_id::generate_key_from_passphrase;
#[allow(unused_imports)]
pub use crypto_primitives::aes::Aes128Key;
#[allow(unused_imports)]
pub use crypto_primitives::aes::{Aes256Key, AES_256_KEY_SIZE, IV_BYTE_SIZE};
pub use crypto_primitives::sha::sha256;
pub use hkdf::hkdf;
#[allow(unused_imports)]
pub use tuta_crypt::TutaCryptKeyPairs;
pub use x25519::X25519PublicKey;

mod hkdf;

pub(crate) mod argon2_id;

pub(crate) mod kyber;
pub(crate) mod rsa;
mod x25519;

mod tuta_crypt;

pub mod asymmetric_crypto_facade;
pub mod public_key_provider;

pub mod crypto_facade;
pub mod key;
pub mod key_encryption;
