use rsa::pkcs8::DecodePublicKey;
use rsa::{RsaPrivateKey, RsaPublicKey};
use rsa::pkcs1::DecodeRsaPrivateKey;
use crate::ApiCallError;
use crate::ApiCallError::InternalSdkError;
use crate::crypto::aes::{aes_128_decrypt, aes_128_encrypt, aes_256_decrypt, aes_256_encrypt, AesEncryptError, Iv, MacMode, PaddingMode};
use crate::crypto::ecc::{EccKeyPair, EccPrivateKey, EccPublicKey};
use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey};
use crate::crypto::kyber::{KyberKeyPair, KyberPrivateKey, KyberPublicKey};
use crate::crypto::randomizer_facade::random;
use crate::crypto::rsa::{RSAEccKeyPair, RSAKeyPair, RSAPrivateKey, RSAPublicKey};
use crate::crypto::tuta_crypt::PQKeyPairs;
use crate::entities::sys::KeyPair;

pub fn decrypt_key_pair(encryption_key:&GenericAesKey, key_pair: &KeyPair) -> Result<AsymmetricKeyPair, ApiCallError> {
    return match key_pair.symEncPrivRsaKey {
        Some(_) => {
            decrypt_rsa_or_rsa_ecc_key_pair(encryption_key, key_pair)
        }
        None => {
            decrypt_pq_key_pair(encryption_key, key_pair)
        }
    }
}

fn mapped_error<E: std::error::Error>(e: E) -> ApiCallError {
    ApiCallError::InternalSdkError { error_message: e.to_string()}
}

fn decrypt_pq_key_pair(encryption_key: &GenericAesKey, key_pair: &KeyPair) -> Result<AsymmetricKeyPair,ApiCallError> {
    if let GenericAesKey::Aes256(key) = encryption_key {
        let ecc_public_key = key_pair.pubEccKey.as_ref().expect("expected pub ecc key for PQ keypair");
        let ecc_private_key = aes_decrypt(encryption_key, key_pair.symEncPrivEccKey.as_ref().expect("expected priv ecc key for PQ keypair"))?;
        let kyber_public_key = KyberPublicKey::deserialize(key_pair.pubKyberKey.as_ref().expect("expected pub kyber key for PQ keypair").as_slice()).map_err(mapped_error)?;
        let kyber_private_key = KyberPrivateKey::deserialize(
            aes_decrypt(encryption_key, key_pair.symEncPrivKyberKey.as_ref().expect("expected enc priv kyber key for PQ keypair"))?.as_slice()
        ).map_err(mapped_error)?;

        Ok(AsymmetricKeyPair::PQKeyPairs(PQKeyPairs {
            ecc_keys: EccKeyPair { public_key: EccPublicKey::from_bytes(ecc_public_key).map_err(mapped_error)?, private_key: EccPrivateKey::from_bytes(ecc_private_key.as_slice()).map_err(mapped_error)? },
            kyber_keys: KyberKeyPair { public_key: kyber_public_key, private_key: kyber_private_key },
        }))
    } else {
        Err(ApiCallError::InternalSdkError { error_message: "Invalid key length".to_string()})
    }
}

pub fn encrypt_rsa_priv_key(encryption_key: &GenericAesKey, key: RSAPrivateKey, iv: &Iv) -> Result<Vec<u8>, AesEncryptError> {
    match encryption_key {
        GenericAesKey::Aes256(aes_key) => aes_256_encrypt(aes_key, key.serialize().as_slice(), iv, PaddingMode::WithPadding),
        GenericAesKey::Aes128(aes_key) => aes_128_encrypt(aes_key, key.serialize().as_slice(), iv, PaddingMode::WithPadding, MacMode::WithMac)
    }
}

fn decrypt_rsa_or_rsa_ecc_key_pair(encryption_key: &GenericAesKey, key_pair: &KeyPair) -> Result<AsymmetricKeyPair, ApiCallError> {
    let public_key = RSAPublicKey::new(RsaPublicKey::from_public_key_pem(String::from_utf8(key_pair.pubRsaKey.as_ref().unwrap().clone()).unwrap().as_str()).map_err(|e| {
        InternalSdkError {error_message: e.to_string()}
    })?);
    let private_key = RSAPrivateKey::new(RsaPrivateKey::from_pkcs1_der(aes_decrypt(encryption_key, key_pair.symEncPrivRsaKey.as_ref().unwrap())?.as_slice())
        .map_err(|e| {
            ApiCallError::InternalSdkError { error_message: e.to_string() }
        })?);

    return match key_pair.symEncPrivEccKey.as_ref() {
        Some(ecc_key) => {
            let public_ecc_key = key_pair.pubEccKey.as_ref().unwrap();
            let private_ecc_key = aes_decrypt(encryption_key, ecc_key);
            Ok(AsymmetricKeyPair::RsaEccKeyPair(RSAEccKeyPair {
                rsa_key_pair: RSAKeyPair {
                    public_key,
                    private_key
                },
                ecc_key_pair: EccKeyPair {
                    public_key: EccPublicKey::from_bytes(public_ecc_key.as_slice()).map_err(|e| {
                        ApiCallError::InternalSdkError { error_message: e.to_string() }
                    })?,
                    private_key: EccPrivateKey::from_bytes(private_ecc_key?.as_slice()).map_err(|e| {
                        ApiCallError::InternalSdkError { error_message: e.to_string() }
                    })?
                }
            }))
        },
        None => {
            Ok(AsymmetricKeyPair::RSAKeyPair(RSAKeyPair {
                public_key,
                private_key,
            }))
        }
    }
}

fn aes_decrypt(encryption_key: &GenericAesKey, encrypted_bytes: &Vec<u8>) -> Result<Vec<u8>, ApiCallError> {
    Ok(match encryption_key {
        GenericAesKey::Aes128(key) => {
            aes_128_decrypt(key, encrypted_bytes).map_err(|e| {
                ApiCallError::InternalSdkError { error_message: e.to_string() }
            })?
        },
        GenericAesKey::Aes256(key) => {
            aes_256_decrypt(key, encrypted_bytes).map_err(|e| {
                ApiCallError::InternalSdkError { error_message: e.to_string() }
            })?
        }
    })
}