use crate::crypto::aes::{Aes128Key, Aes256Key, aes_128_decrypt_no_padding_fixed_iv, aes_256_decrypt_no_padding, AesDecryptError};
use crate::key_loader_facade::GenericAesKey;

pub struct KeyEncryption {}

impl KeyEncryption {
    pub fn decrypt_key(encryption_key: GenericAesKey, key_to_be_decrypted: Vec<u8>) -> Result<GenericAesKey, AesDecryptError> {
        return match encryption_key {
            GenericAesKey::Aes128(key) => {
                let decrypted_key = aes_128_decrypt_no_padding_fixed_iv(&key, key_to_be_decrypted.as_slice())?;
                Ok(GenericAesKey::Aes128(Aes128Key::from_bytes(decrypted_key.as_slice())?))
            }
            GenericAesKey::Aes256(key) => {
                let decrypted_key = aes_256_decrypt_no_padding(&key, key_to_be_decrypted.as_slice())?;
                Ok(GenericAesKey::Aes256(Aes256Key::from_bytes(decrypted_key.as_slice())?))
            }
        }
    }
}