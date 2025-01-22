#![allow(dead_code)]
//! Contains implementations of cryptographic algorithms and their primitives
// TODO: Remove the above allowance when starting to implement higher level functions

#[allow(unused_imports)]
pub use aes::Aes128Key;
pub use aes::PlaintextAndIv;
#[allow(unused_imports)]
pub use aes::{Aes256Key, AES_256_KEY_SIZE, IV_BYTE_SIZE};
pub use argon2_id::generate_key_from_passphrase;
pub use hkdf::hkdf;
pub use sha::sha256;
#[allow(unused_imports)]
pub use tuta_crypt::PQKeyPairs;

pub mod aes;
pub mod hmac;

mod sha;

mod hkdf;

pub(crate) mod argon2_id;

mod ecc;
pub(crate) mod kyber;
pub(crate) mod rsa;

mod tuta_crypt;

pub mod asymmetric_crypto_facade;
pub mod public_key_provider;

#[cfg(test)]
pub mod compatibility_test_utils;
pub mod crypto_facade;
pub mod key;
pub mod key_encryption;
pub mod randomizer_facade;
