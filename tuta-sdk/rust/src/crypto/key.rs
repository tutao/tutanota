use zeroize::Zeroizing;
use crate::ApiCallError;
use crate::util::ArrayCastingError;
use super::aes::*;
use super::rsa::*;
use super::tuta_crypt::*;

#[derive(Clone)]
pub enum AsymmetricKeyPair {
    RSAKeyPair(RSAKeyPair),
    RsaEccKeyPair(RSAEccKeyPair),
    PQKeyPairs(PQKeyPairs),
}

impl From<RSAKeyPair> for AsymmetricKeyPair {
    fn from(value: RSAKeyPair) -> Self {
        Self::RSAKeyPair(value)
    }
}

impl From<PQKeyPairs> for AsymmetricKeyPair {
    fn from(value: PQKeyPairs) -> Self {
        Self::PQKeyPairs(value)
    }
}

#[derive(Clone)]
pub enum GenericAesKey {
    Aes128(Aes128Key),
    Aes256(Aes256Key),
}

impl GenericAesKey {
    /// Decrypts the AES key: `encrypted_key` with this key.
    ///
    /// The returned AES key is zeroized on drop
    pub fn decrypt_aes_key(&self, encrypted_key: &[u8]) -> Result<GenericAesKey, KeyLoadError> {
        let decrypted = match self {
            Self::Aes128(key) => aes_128_decrypt_no_padding_fixed_iv(&key, encrypted_key)?,
            Self::Aes256(key) => aes_256_decrypt_no_padding(&key, encrypted_key)?,
        };

        let decrypted = Zeroizing::new(decrypted);
        Self::from_bytes(decrypted.as_slice()).map_err(|error| error.into())
    }

    /// Decrypts `ciphertext` with this key.
    ///
    /// The return decrypted data is not zeroized
    pub fn decrypt_data(&self, ciphertext: &[u8]) -> Result<Vec<u8>, AesDecryptError> {
        let decrypted = match self {
            Self::Aes128(key) => aes_128_decrypt(&key, ciphertext)?,
            Self::Aes256(key) => aes_256_decrypt(&key, ciphertext)?,
        };
        Ok(decrypted)
    }

    /// Encrypts `key_to_encrypt` with this key.
    pub fn encrypt_key(&self, key_to_encrypt: &GenericAesKey, iv: Iv) -> Vec<u8> {
        match self {
            Self::Aes128(key) => aes_128_encrypt_no_padding_fixed_iv(key, key_to_encrypt.as_bytes()).unwrap(),
            Self::Aes256(key) => aes_256_encrypt(key, key_to_encrypt.as_bytes(), &iv, PaddingMode::NoPadding).unwrap(),
        }
    }

    /// Encrypts `text` with this key.
    pub fn encrypt_data(&self, text: &[u8], iv: Iv) -> Result<Vec<u8>, AesEncryptError> {
        let ciphertext = match self {
            Self::Aes128(key) => aes_128_encrypt(&key, text, &iv, PaddingMode::WithPadding, MacMode::WithMac)?,
            Self::Aes256(key) => aes_256_encrypt(&key, text, &iv, PaddingMode::WithPadding)?,
        };
        Ok(ciphertext)
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self, ArrayCastingError> {
        match bytes.len() {
            // The unwraps here are optimised away
            AES_128_KEY_SIZE => Ok(Aes128Key::from_bytes(bytes).unwrap().into()),
            AES_256_KEY_SIZE => Ok(Aes256Key::from_bytes(bytes).unwrap().into()),
            n => Err(ArrayCastingError { type_name: "GenericAesKey", actual_size: n })
        }
    }

    pub(crate) fn as_bytes(&self) -> &[u8] {
        match self {
            Self::Aes128(n) => n.as_bytes(),
            Self::Aes256(n) => n.as_bytes()
        }
    }
}

impl From<Aes128Key> for GenericAesKey {
    fn from(value: Aes128Key) -> Self {
        Self::Aes128(value)
    }
}

impl From<Aes256Key> for GenericAesKey {
    fn from(value: Aes256Key) -> Self {
        Self::Aes256(value)
    }
}

#[derive(thiserror::Error, Debug)]
#[error("Failed to load key: {reason}")]
pub struct KeyLoadError {
    pub(crate) reason: String,
}

/// Used to convert key related error types to `KeyLoadError`
trait KeyLoadErrorSubtype: ToString {}

impl<T: KeyLoadErrorSubtype> From<T> for KeyLoadError {
    fn from(value: T) -> Self {
        Self { reason: value.to_string() }
    }
}

impl KeyLoadErrorSubtype for AesDecryptError {}

impl KeyLoadErrorSubtype for ArrayCastingError {}

impl KeyLoadErrorSubtype for RSAKeyError {}

/// Used to handle errors from the entity client
impl KeyLoadErrorSubtype for ApiCallError {}
