///! Contains code to handle AES128/AES256 encryption and decryption

use aes::cipher::{BlockCipher, BlockSizeUser};
use aes::cipher::block_padding::Pkcs7;
use cbc::cipher::{BlockDecrypt, BlockDecryptMut, BlockEncrypt, BlockEncryptMut, KeyIvInit};
use cbc::cipher::block_padding::UnpadError;
use zeroize::ZeroizeOnDrop;

/// Denotes whether a text is/should be padded
pub enum PaddingMode {
    NoPadding,
    WithPadding,
}

/// Denotes whether a text should include a message authentication code
pub enum MacMode {
    NoMac,
    WithMac,
}


/// Denotes whether a presence of MAC authentication is enforced
#[derive(PartialEq)]
pub enum EnforceMac {
    AllowNoMac,
    EnforceMac,
}


#[derive(Clone, ZeroizeOnDrop)]
pub struct Aes128Key([u8; 16]);

impl Aes128Key {
    fn bytes_ref(&self) -> &[u8; 16] {
        &self.0
    }

    pub fn from_bytes(bytes: &[u8]) -> Result<Self, AesKeyError> {
        match bytes.try_into() {
            Ok(bytes) => { Ok(Self(bytes)) }
            Err(_) => Err(AesKeyError { actual_size: bytes.len() })
        }
    }
}

impl<const SIZE: usize> TryFrom<[u8; SIZE]> for Aes128Key {
    type Error = AesKeyError;
    fn try_from(value: [u8; SIZE]) -> Result<Self, Self::Error> {
        match arr_cast_size(value) {
            Ok(arr) => Ok(Self(arr)),
            Err(_) => Err(AesKeyError { actual_size: value.len() })
        }
    }
}

impl TryFrom<Vec<u8>> for Aes128Key {
    type Error = AesKeyError;
    fn try_from(value: Vec<u8>) -> Result<Self, Self::Error> {
        match value.len() {
            16 => Ok(Self(value.try_into().unwrap())),
            _ => Err(AesKeyError { actual_size: value.len() }),
        }
    }
}

#[derive(Clone, ZeroizeOnDrop)]
pub struct Aes256Key([u8; 32]);

impl Aes256Key {
    pub fn from_bytes(bytes: &[u8]) -> Result<Self, AesKeyError> {
        match bytes.try_into() {
            Ok(bytes) => { Ok(Self(bytes)) }
            Err(_) => Err(AesKeyError { actual_size: bytes.len() })
        }
    }
}

impl<const SIZE: usize> TryFrom<[u8; SIZE]> for Aes256Key {
    type Error = AesKeyError;
    fn try_from(value: [u8; SIZE]) -> Result<Self, Self::Error> {
        match arr_cast_size(value) {
            Ok(arr) => Ok(Self(arr)),
            Err(_) => Err(AesKeyError { actual_size: value.len() })
        }
    }
}

impl TryFrom<Vec<u8>> for Aes256Key {
    type Error = AesKeyError;
    fn try_from(value: Vec<u8>) -> Result<Self, Self::Error> {
        match value.len() {
            32 => Ok(Self(value.try_into().unwrap())),
            _ => Err(AesKeyError { actual_size: value.len() }),
        }
    }
}

trait AesKey: Clone {
    type CbcKeyType: BlockEncryptMut + BlockDecryptMut + BlockEncrypt + BlockDecrypt + BlockCipher + cbc::cipher::KeyInit;
    fn get_bytes(&self) -> &[u8];
    fn derive_subkeys(&self) -> AesSubKeys<Self>;
}

impl AesKey for Aes128Key {
    type CbcKeyType = aes::Aes128;
    fn get_bytes(&self) -> &[u8] {
        &self.0
    }

    fn derive_subkeys(&self) -> AesSubKeys<Self> {
        use sha2::{Digest, Sha256};
        use cbc::cipher::KeySizeUser;

        let mut hasher = Sha256::new();
        hasher.update(self.get_bytes());
        let hashed_key = hasher.finalize();

        let (c_key_slice, m_key_slice) = hashed_key.split_at(<Self as AesKey>::CbcKeyType::key_size());
        AesSubKeys { c_key: Self::from_bytes(c_key_slice).unwrap(), m_key: Self::from_bytes(m_key_slice).unwrap() }
    }
}

impl AesKey for Aes256Key {
    type CbcKeyType = aes::Aes256;
    fn get_bytes(&self) -> &[u8] {
        &self.0
    }

    fn derive_subkeys(&self) -> AesSubKeys<Self> {
        use sha2::{Digest, Sha512};
        use cbc::cipher::KeySizeUser;

        let mut hasher = Sha512::new();
        hasher.update(self.get_bytes());
        let hashed_key = hasher.finalize();

        let (c_key_slice, m_key_slice) = hashed_key.split_at(<Self as AesKey>::CbcKeyType::key_size());
        AesSubKeys { c_key: Self::from_bytes(c_key_slice).unwrap(), m_key: Self::from_bytes(m_key_slice).unwrap() }
    }
}

/// The possible errors that can occur while casting to a `GenericAesKey`
#[derive(thiserror::Error, Debug)]
#[error("Invalid AES key size: {actual_size}")]
pub struct AesKeyError {
    actual_size: usize,
}

/// An initialisation vector for AES encryption
pub struct Iv([u8; IV_BYTE_SIZE]);

impl Iv {
    fn from_bytes(bytes: [u8; IV_BYTE_SIZE]) -> Self {
        Self(bytes)
    }

    fn from_slice(slice: &[u8]) -> Option<Self> {
        let arr = slice.try_into().ok()?;
        Some(Self(arr))
    }
}

#[derive(thiserror::Error, Debug)]
pub enum AesEncryptError {
    #[error("InvalidDataLength")]
    InvalidDataLength
}

/// Encrypts the raw string `plaintext` using AES-128-CBC with optional PKCS7 padding and optional HMAC-SHA-256
pub fn aes_128_encrypt(key: &Aes128Key, plaintext: &[u8], iv: &Iv, padding_mode: PaddingMode, mac_mode: MacMode) -> Result<Vec<u8>, AesEncryptError> {
    aes_encrypt(key, plaintext, iv, padding_mode, mac_mode)
}

/// Encrypts `plaintext` with `FIXED_IV` and without padding nor a MAC using AES128-CBC
/// Mainly used for encrypting keys
pub fn aes_128_encrypt_no_padding_fixed_iv(key: &Aes128Key, plaintext: &[u8]) -> Result<Vec<u8>, AesEncryptError> {
    let mut encryptor = cbc::Encryptor::<aes::Aes128>::new_from_slices(key.get_bytes(), &FIXED_IV).unwrap();
    let block_size = <aes::Aes128 as BlockSizeUser>::block_size();
    if plaintext.len() % block_size != 0 {
        return Err(AesEncryptError::InvalidDataLength);
    }
    Ok(encrypt_unpadded_vec_mut(&mut encryptor, plaintext))
}

/// Encrypts the raw string `plaintext` using AES-256-CBC with optional PKCS7 padding and optional HMAC-SHA-512
pub fn aes_256_encrypt(key: &Aes256Key, plaintext: &[u8], iv: &Iv, padding_mode: PaddingMode) -> Result<Vec<u8>, AesEncryptError> {
    aes_encrypt(key, plaintext, iv, padding_mode, MacMode::WithMac)
}


/// The possible errors that can occur while decrypting an AES text
#[derive(thiserror::Error, Debug)]
pub enum AesDecryptError {
    #[error("InvalidDataSizeError")]
    InvalidDataSizeError,
    #[error("PaddingError")]
    PaddingError(#[from] UnpadError),
    #[error("HmacError")]
    HmacError,
    #[error("IvSizeError")]
    IvSizeError,
}

/// Decrypt using AES-128-CBC using prepended IV with PKCS7 padding and optional HMAC-SHA-256
pub fn aes_128_decrypt(key: &Aes128Key, encrypted_bytes: &[u8]) -> Result<Vec<u8>, AesDecryptError> {
    aes_decrypt(key, encrypted_bytes, PaddingMode::WithPadding, EnforceMac::AllowNoMac)
}

/// Decrypt an encryption key with AES-128 using fixed IV, without authentication
pub fn aes_128_decrypt_no_padding_fixed_iv(key: &Aes128Key, encrypted_bytes: &[u8]) -> Result<Vec<u8>, AesDecryptError> {
    if encrypted_bytes.len() % 2 != 0 {
        return Err(AesDecryptError::InvalidDataSizeError);
    }

    let mut decryptor = cbc::Decryptor::<aes::Aes128>::new(&key.0.into(), &FIXED_IV.into());
    let plaintext_data = decrypt_unpadded_vec_mut(&mut decryptor, encrypted_bytes);

    Ok(plaintext_data)
}

/// Decrypt using AES-256-CBC using prepended IV with PKCS7 padding and HMAC-SHA-512
pub fn aes_256_decrypt(key: &Aes256Key, encrypted_bytes: &[u8]) -> Result<Vec<u8>, AesDecryptError> {
    aes_decrypt(key, encrypted_bytes, PaddingMode::WithPadding, EnforceMac::EnforceMac)
}

/// Decrypt an encryption key with AES-256-CBC using prepended IV without padding and HMAC-SHA-512
pub fn aes_256_decrypt_no_padding(key: &Aes256Key, encrypted_bytes: &[u8]) -> Result<Vec<u8>, AesDecryptError> {
    aes_decrypt(key, encrypted_bytes, PaddingMode::NoPadding, EnforceMac::EnforceMac)
}

/// Resizes an array of size `ARR_SIZE` into another array of size `SIZE`
fn arr_cast_size<const SIZE: usize, const ARR_SIZE: usize>(arr: [u8; ARR_SIZE]) -> Result<[u8; SIZE], ()> {
    // Currently we copy because we could also swap it for unsafe pointer juggle if we feel bold.
    // Ideally there will be something in std at some point to do this.
    if arr.len() == SIZE {
        let mut result: [u8; SIZE] = [0; SIZE];
        result.copy_from_slice(&arr);
        Ok(result)
    } else {
        Err(())
    }
}

impl TryFrom<Vec<u8>> for GenericAesKey {
    type Error = AesKeyError;
    fn try_from(value: Vec<u8>) -> Result<Self, Self::Error> {
        match value.len() {
            16 => Ok(Self::Aes128Key(Aes128Key(value.try_into().unwrap()))),
            32 => Ok(Self::Aes256Key(Aes256Key(value.try_into().unwrap()))),
            _ => Err(AesKeyError { actual_size: value.len() }),
        }
    }
}

const AES_128_KEY_SIZE: usize = 16;
const AES_256_KEY_SIZE: usize = 32;

/// The size of an AES initialisation vector in bytes
const IV_BYTE_SIZE: usize = 16;

/// Size of HMAC authentication added to the ciphertext
const MAC_SIZE: usize = 32;

/// Encrypts a plaintext without adding padding and returns the encrypted text as a vector
fn encrypt_unpadded_vec_mut<C: BlockCipher + BlockEncryptMut>(encryptor: &mut cbc::Encryptor<C>, plaintext: &[u8]) -> Vec<u8> {
    let mut output_buffer = vec![0; plaintext.len()];
    for (chunk, output) in plaintext.chunks(C::block_size()).zip(output_buffer.chunks_mut(C::block_size())) {
        encryptor.encrypt_block_b2b_mut(chunk.into(), output.into());
    }
    output_buffer
}

/// Keys derived for AES key to enable authentication
struct AesSubKeys<KEY: AesKey> {
    /// Key used for encrypting data
    c_key: KEY,
    /// Key used for HMAC (authentication)
    m_key: KEY,
}

type Aes128SubKeys = AesSubKeys<Aes128Key>;
type Aes256SubKeys = AesSubKeys<Aes256Key>;

impl<KEY: AesKey> AesSubKeys<KEY> {
    fn compute_mac(&self, iv: &[u8], ciphertext: &[u8]) -> [u8; 32] {
        use sha2::Sha256;
        use hmac::Mac;

        let mut hmac = hmac::Hmac::<Sha256>::new_from_slice(self.m_key.get_bytes()).unwrap();
        hmac.update(iv);
        hmac.update(ciphertext);
        hmac.finalize().into_bytes().into()
    }
}

/// Generic AES-CBC function with optional PKCS7 padding and with optional HMAC-SHA support
fn aes_encrypt<Key: AesKey>(key: &Key, plaintext: &[u8], iv: &Iv, padding_mode: PaddingMode, mac_mode: MacMode) -> Result<Vec<u8>, AesEncryptError> {
    let (mut encryptor, sub_keys) = match mac_mode {
        MacMode::NoMac => (cbc::Encryptor::<Key::CbcKeyType>::new_from_slices(key.get_bytes(), &iv.0).unwrap(), None),
        MacMode::WithMac => {
            let sub_keys = key.derive_subkeys();
            (cbc::Encryptor::<Key::CbcKeyType>::new_from_slices(sub_keys.c_key.get_bytes(), &iv.0).unwrap(), Some(sub_keys))
        }
    };
    let block_size = <Key::CbcKeyType as BlockSizeUser>::block_size();
    let encrypted_data = match padding_mode {
        PaddingMode::NoPadding => {
            if plaintext.len() % block_size != 0 {
                return Err(AesEncryptError::InvalidDataLength);
            }
            encrypt_unpadded_vec_mut(&mut encryptor, plaintext)
        }
        PaddingMode::WithPadding => encryptor.encrypt_padded_vec_mut::<Pkcs7>(plaintext),
    };

    if let Some(subkeys) = sub_keys {
        let with_auth = CiphertextWithAuthentication::compute(&encrypted_data, &iv.0, &subkeys);
        Ok(with_auth.serialize())
    } else {
        // without HMAC it is just
        // - iv
        // - encrypted data
        let vec: Vec<u8> = iv.0.as_slice().iter().chain(&encrypted_data)
            .map(|b| *b)
            .collect();
        Ok(vec)
    }
}

/// Decrypts an encrypted plain text that does not have padding using AES-CBC and returns
/// the decrypted text as a vector.
fn decrypt_unpadded_vec_mut<C: BlockCipher + BlockDecrypt>(decryptor: &mut cbc::Decryptor<C>, buf: &[u8]) -> Vec<u8> {
    let mut output_buffer = vec![0; buf.len()];
    for (chunk, output) in buf.chunks(C::block_size()).zip(output_buffer.chunks_mut(C::block_size())) {
        decryptor.decrypt_block_b2b_mut(chunk.into(), output.into());
    }
    output_buffer
}

/// The initialisation vector used when encrypting keys
const FIXED_IV: [u8; IV_BYTE_SIZE] = [0x88; IV_BYTE_SIZE];

struct CiphertextWithAuthentication<'a> {
    iv: &'a [u8],
    ciphertext: &'a [u8],
    // it's smol enough to just copy it around
    mac: [u8; MAC_SIZE],
}

impl<'a> CiphertextWithAuthentication<'a> {
    fn parse(bytes: &'a [u8]) -> Option<CiphertextWithAuthentication<'a>> {
        if bytes.len() % 2 == 1 && bytes[0] == 1 {
            let encrypted_bytes_without_marker = &bytes[1..];
            let (ciphertext_without_mac, provided_mac_bytes) = encrypted_bytes_without_marker.split_at(encrypted_bytes_without_marker.len() - MAC_SIZE);
            let (iv, ciphertext) = ciphertext_without_mac.split_at(IV_BYTE_SIZE);
            Some(CiphertextWithAuthentication {
                iv,
                ciphertext,
                mac: provided_mac_bytes.try_into().unwrap(),
            }
            )
        } else {
            None
        }
    }

    fn compute<KEY: AesKey>(ciphertext: &'a [u8], iv: &'a [u8], subkeys: &AesSubKeys<KEY>) -> CiphertextWithAuthentication<'a> {
        CiphertextWithAuthentication {
            iv,
            ciphertext,
            mac: subkeys.compute_mac(iv, ciphertext),
        }
    }

    fn matches<KEY: AesKey>(&self, subkeys: &AesSubKeys<KEY>) -> bool {
        self.mac == subkeys.compute_mac(self.iv, self.ciphertext)
    }

    fn serialize(&self) -> Vec<u8> {
        // - marker that HMAC is there (a single byte with "1" in the front, this makes the length
        //   un-even)
        // - iv
        // - encrypted data
        // - HMAC bytes
        (&[1u8; 1]).iter().chain(self.iv).chain(self.ciphertext).chain(self.mac.as_ref())
            .map(|b| *b)
            .collect()
    }
}

/// Decrypts the AES-encrypted raw string `encrypted_bytes` into a plain text raw string
/// using AES using prepended IV with optional PKCS7 padding and optional HMAC-SHA
fn aes_decrypt<Key: AesKey>(key: &Key, encrypted_bytes: &[u8], padding_mode: PaddingMode, enforce_mac: EnforceMac) -> Result<Vec<u8>, AesDecryptError> {
    let (key, iv_bytes, encrypted_bytes) = if let Some(ciphertext_with_auth) = CiphertextWithAuthentication::parse(encrypted_bytes) {
        let subkeys = key.derive_subkeys();
        if !ciphertext_with_auth.matches(&subkeys) {
            return Err(AesDecryptError::HmacError);
        }

        (subkeys.c_key, ciphertext_with_auth.iv, ciphertext_with_auth.ciphertext)
    } else if enforce_mac == EnforceMac::EnforceMac {
        return Err(AesDecryptError::HmacError);
    } else {
        // Separate and check both the initialisation vector
        let (iv_bytes, cipher_text) = encrypted_bytes.split_at(IV_BYTE_SIZE);
        (key.clone(), iv_bytes, cipher_text)
    };

    // Return early if there is nothing to decrypt
    if encrypted_bytes.is_empty() {
        return Ok(vec!());
    }

    let mut decryptor = cbc::Decryptor::<Key::CbcKeyType>::new_from_slices(key.get_bytes(), iv_bytes).unwrap();
    let plaintext_data = match padding_mode {
        // Unpadded encrypted texts do not include the IV
        PaddingMode::NoPadding => decrypt_unpadded_vec_mut(&mut decryptor, encrypted_bytes),
        PaddingMode::WithPadding => decryptor.decrypt_padded_vec_mut::<Pkcs7>(encrypted_bytes)?
    };

    Ok(plaintext_data)
}

#[cfg(test)]
mod tests {
    use base64::engine::{Engine, general_purpose::STANDARD as BASE64};
    use base64::prelude::BASE64_STANDARD;
    use serde::{Deserialize, Deserializer, Serializer};

    use super::*;

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct AesTest {
        #[serde(with = "Base64")]
        plain_text_base64: Vec<u8>,
        #[serde(with = "Base64")]
        iv_base64: Vec<u8>,
        #[serde(with = "Base64")]
        cipher_text_base64: Vec<u8>,
        #[serde(with = "const_hex")]
        hex_key: Vec<u8>,
        #[serde(with = "const_hex")]
        key_to_encrypt256: Vec<u8>,
        #[serde(with = "const_hex")]
        key_to_encrypt128: Vec<u8>,
        #[serde(with = "Base64")]
        encrypted_key256: Vec<u8>,
        #[serde(with = "Base64")]
        encrypted_key128: Vec<u8>,
    }

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct Aes128MacTest {
        #[serde(with = "Base64")]
        plain_text_base64: Vec<u8>,
        #[serde(with = "Base64")]
        iv_base64: Vec<u8>,
        #[serde(with = "Base64")]
        cipher_text_base64: Vec<u8>,
        #[serde(with = "const_hex")]
        hex_key: Vec<u8>,
    }

    #[derive(Deserialize)]
    #[serde(rename_all = "camelCase")]
    struct CompatibilityTestData {
        aes128_tests: Vec<AesTest>,
        aes128_mac_tests: Vec<Aes128MacTest>,
        aes256_tests: Vec<AesTest>,
    }


    struct Base64;

    impl Base64 {
        fn serialize<S: Serializer>(data: &[u8], serializer: S) -> Result<S::Ok, S::Error> {
            serializer.serialize_str(&BASE64.encode(data))
        }

        fn deserialize<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Vec<u8>, D::Error> {
            let base64_str = <&str>::deserialize(deserializer)?;
            BASE64.decode(base64_str).map_err(serde::de::Error::custom)
        }
    }

    fn get_test_data() -> CompatibilityTestData {
        let data_json = include_str!("../../test_data/CompatibilityTestData.json");
        serde_json::from_str(data_json).unwrap()
    }

    #[test]
    fn test_aes_128_encrypt_with_padding_no_mac() {
        for td in get_test_data().aes128_tests {
            let key: Aes128Key = td.hex_key.try_into().unwrap();
            let plaintext = td.plain_text_base64;
            let iv = &Iv(td.iv_base64.try_into().unwrap());
            let encrypted_bytes = aes_128_encrypt(
                &key,
                &plaintext,
                iv,
                PaddingMode::WithPadding,
                MacMode::NoMac,
            ).unwrap();
            let expected_ciphertext = td.cipher_text_base64;
            assert_eq!(expected_ciphertext, encrypted_bytes);
        }
    }

    #[test]
    fn test_aes_128_encrypt_with_padding_mac() {
        for td in get_test_data().aes128_mac_tests {
            let key: Aes128Key = td.hex_key.try_into().unwrap();
            let plaintext = td.plain_text_base64;
            let iv = &Iv(td.iv_base64.try_into().unwrap());
            let encrypted_bytes = aes_128_encrypt(
                &key,
                &plaintext,
                iv,
                PaddingMode::WithPadding,
                MacMode::WithMac,
            ).unwrap();
            let expected_ciphertext = td.cipher_text_base64;
            assert_eq!(expected_ciphertext, encrypted_bytes);
        }
    }

    #[test]
    fn test_aes_128_encrypt_128_key() {
        for td in get_test_data().aes128_tests {
            let key: Aes128Key = td.hex_key.try_into().unwrap();
            let plain_key = td.key_to_encrypt128;
            let encrypted_bytes = aes_128_encrypt_no_padding_fixed_iv(
                &key,
                &plain_key,
            ).unwrap();
            let expected_encrypted_key = td.encrypted_key128;
            assert_eq!(expected_encrypted_key, encrypted_bytes);
        }
    }

    #[test]
    fn test_aes_128_encrypt_256_key() {
        for td in get_test_data().aes128_tests {
            let key: Aes128Key = td.hex_key.try_into().unwrap();
            let plain_key = td.key_to_encrypt256;
            let encrypted_bytes = aes_128_encrypt_no_padding_fixed_iv(
                &key,
                &plain_key,
            ).unwrap();
            let expected_encrypted_key = td.encrypted_key256;
            assert_eq!(expected_encrypted_key, encrypted_bytes);
        }
    }

    #[test]
    fn test_aes_128_decrypt_no_mac() {
        for td in get_test_data().aes128_tests {
            let key: Aes128Key = td.hex_key.try_into().unwrap();
            let ciphertext = td.cipher_text_base64;

            let decrypted_bytes = aes_128_decrypt(
                &key,
                &ciphertext,
            ).unwrap();

            let expected_plaintext = td.plain_text_base64;
            assert_eq!(expected_plaintext, decrypted_bytes);
        }
    }

    #[test]
    fn test_aes_128_decrypt_128_key() {
        for td in get_test_data().aes128_tests {
            let key: Aes128Key = td.hex_key.try_into().unwrap();
            let encrypted_key = td.encrypted_key128;

            let decrypted_bytes = aes_128_decrypt_no_padding_fixed_iv(
                &key,
                encrypted_key.as_slice(),
            ).unwrap();

            let expected_plain_key = td.key_to_encrypt128;
            assert_eq!(expected_plain_key, decrypted_bytes);
        }
    }

    #[test]
    fn test_aes_128_decrypt_256_key() {
        for td in get_test_data().aes128_tests {
            let key: Aes128Key = td.hex_key.try_into().unwrap();
            let encrypted_key = td.encrypted_key256;

            let decrypted_bytes = aes_128_decrypt_no_padding_fixed_iv(
                &key,
                encrypted_key.as_slice(),
            ).unwrap();

            let expected_plain_key = td.key_to_encrypt256;
            assert_eq!(expected_plain_key, decrypted_bytes);
        }
    }

    #[test]
    fn test_aes_128_decrypt_mac() {
        for td in get_test_data().aes128_mac_tests {
            let key: Aes128Key = td.hex_key.try_into().unwrap();
            let ciphertext = td.cipher_text_base64;

            let decrypted_bytes = aes_128_decrypt(
                &key,
                &ciphertext,
            ).unwrap();

            let expected_plaintext = td.plain_text_base64;
            assert_eq!(expected_plaintext, decrypted_bytes, "failed test: {}", BASE64_STANDARD.encode(&ciphertext));
        }
    }

    #[test]
    fn test_aes_256_encrypt_with_padding_mac() {
        for td in get_test_data().aes256_tests {
            let key: Aes256Key = td.hex_key.try_into().unwrap();
            let plaintext = td.plain_text_base64;
            let iv = &Iv(td.iv_base64.try_into().unwrap());
            let encrypted_bytes = aes_256_encrypt(
                &key,
                &plaintext,
                iv,
                PaddingMode::WithPadding,
            ).unwrap();
            let expected_ciphertext = td.cipher_text_base64;
            assert_eq!(expected_ciphertext, encrypted_bytes);
        }
    }


    #[test]
    fn test_aes_256_decrypt_mac() {
        for td in get_test_data().aes256_tests {
            let key: Aes256Key = td.hex_key.try_into().unwrap();
            let ciphertext = td.cipher_text_base64;

            let decrypted_bytes = aes_256_decrypt(
                &key,
                &ciphertext,
            ).unwrap();

            let expected_plaintext = td.plain_text_base64;
            assert_eq!(expected_plaintext, decrypted_bytes, "failed test: {}", BASE64_STANDARD.encode(&ciphertext));
        }
    }

    #[test]
    fn test_aes_256_encrypt_256_key() {
        for td in get_test_data().aes256_tests {
            let key: Aes256Key = td.hex_key.try_into().unwrap();
            let plain_key = td.key_to_encrypt256;
            let iv = &Iv(td.iv_base64.try_into().unwrap());
            let encrypted_bytes = aes_256_encrypt(
                &key,
                &plain_key,
                iv,
                PaddingMode::NoPadding,
            ).unwrap();
            let expected_encrypted_key = td.encrypted_key256;
            assert_eq!(expected_encrypted_key, encrypted_bytes);
        }
    }

    #[test]
    fn test_aes_256_decrypt_256_key() {
        for td in get_test_data().aes256_tests {
            let key: Aes256Key = td.hex_key.try_into().unwrap();
            let encrypted_key = td.encrypted_key256;

            let decrypted_bytes = aes_256_decrypt_no_padding(
                &key,
                encrypted_key.as_slice(),
            ).unwrap();

            let expected_plain_key = td.key_to_encrypt256;
            assert_eq!(expected_plain_key, decrypted_bytes);
        }
    }

    #[test]
    fn test_aes_256_encrypt_128_key() {
        for td in get_test_data().aes256_tests {
            let key: Aes256Key = td.hex_key.try_into().unwrap();
            let plain_key = td.key_to_encrypt128;
            let iv = &Iv(td.iv_base64.try_into().unwrap());
            let encrypted_bytes = aes_256_encrypt(
                &key,
                &plain_key,
                iv,
                PaddingMode::NoPadding,
            ).unwrap();
            let expected_encrypted_key = td.encrypted_key128;
            assert_eq!(expected_encrypted_key, encrypted_bytes);
        }
    }

    #[test]
    fn test_aes_256_decrypt_128_key() {
        for td in get_test_data().aes256_tests {
            let key: Aes256Key = td.hex_key.try_into().unwrap();
            let encrypted_key = td.encrypted_key128;

            let decrypted_bytes = aes_256_decrypt_no_padding(
                &key,
                encrypted_key.as_slice(),
            ).unwrap();

            let expected_plain_key = td.key_to_encrypt128;
            assert_eq!(expected_plain_key, decrypted_bytes);
        }
    }
}
