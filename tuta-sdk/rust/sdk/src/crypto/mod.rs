#![allow(dead_code)]
//! Contains implementations of cryptographic algorithms and their primitives
// TODO: Remove the above allowance when starting to implement higher level functions


mod aes;

#[cfg(test)]
pub use aes::Iv;
#[allow(unused_imports)]
pub use aes::Aes128Key;
pub use aes::{Aes256Key, AES_256_KEY_SIZE, IV_BYTE_SIZE};

mod sha;

pub use sha::sha256;

mod hkdf;

pub use hkdf::hkdf;

mod argon2_id;

pub use argon2_id::generate_key_from_passphrase;

mod ecc;
pub(crate) mod kyber;
pub(crate) mod rsa;

mod tuta_crypt;

#[allow(unused_imports)]
pub use tuta_crypt::PQKeyPairs;

pub mod key_encryption;
pub mod crypto_facade;
pub mod key;
pub mod randomizer_facade;
#[cfg(test)]
mod compatibility_test_utils;
