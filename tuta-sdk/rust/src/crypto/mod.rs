#! [allow(dead_code)]
//! Contains implementations of cryptographic algorithms and their primitives
// TODO: Remove the above allowance when starting to implement higher level functions

pub enum KeyPairType {
    RSA,
    RsaAndEcc,
    TutaCrypt,
}

pub mod aes;
pub mod sha;
pub mod hkdf;
mod argon2_id;
pub mod ecc;
pub mod kyber;
pub mod rsa;
pub mod tuta_crypt;
pub mod key_encryption;
mod key_loader_facade;
pub mod crypto_facade;
pub mod key;

#[cfg(test)]
mod compatibility_test_utils;
mod randomizer_facade;
