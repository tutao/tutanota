use zeroize::Zeroizing;
use crate::ApiCallError;
use crate::crypto::ecc::{EccKeyPair, EccPrivateKey, EccPublicKey};
use crate::crypto::key::{AsymmetricKeyPair, GenericAesKey, KeyLoadError};
use crate::crypto::kyber::{KyberKeyPair, KyberPrivateKey, KyberPublicKey};
use crate::crypto::rsa::{RSAEccKeyPair, RSAKeyPair, RSAPrivateKey, RSAPublicKey};
use crate::crypto::tuta_crypt::PQKeyPairs;
use crate::entities::sys::KeyPair;

pub fn decrypt_key_pair(encryption_key: &GenericAesKey, key_pair: &KeyPair) -> Result<AsymmetricKeyPair, KeyLoadError> {
    match key_pair.symEncPrivRsaKey {
        Some(_) => decrypt_rsa_or_rsa_ecc_key_pair(encryption_key, key_pair),
        None => decrypt_pq_key_pair(encryption_key, key_pair)
    }
}

fn mapped_error<E: std::error::Error>(e: E) -> ApiCallError {
    ApiCallError::InternalSdkError { error_message: e.to_string() }
}

fn require_field<'a>(field: &'a Option<Vec<u8>>, name: &str) -> Result<&'a [u8], KeyLoadError> {
    field
        .as_ref()
        .ok_or_else(|| KeyLoadError { reason: format!("Missing field `{name}`") })
        .map(|k| k.as_slice())
}

macro_rules! require_field {
    ($object:expr) => {
        $object
            .as_ref()
            .ok_or_else(|| KeyLoadError { reason: format!("Missing field `{}`", stringify!($object)) })
            .map(|k| k.as_slice())
    };
}

fn decrypt_pq_key_pair(encryption_key: &GenericAesKey, key_pair: &KeyPair) -> Result<AsymmetricKeyPair, KeyLoadError> {
    if !matches!(encryption_key, GenericAesKey::Aes256(_)) {
        return Err(KeyLoadError { reason: "Invalid AES key length for PQ key pair".to_owned() });
    }

    let ecc_public_key = require_field!(key_pair.pubEccKey)?;
    let ecc_private_key_enc = require_field!(key_pair.symEncPrivEccKey)?;
    let ecc_private_key = Zeroizing::new(encryption_key.decrypt_data(ecc_private_key_enc)?);

    let kyber_public_key = KyberPublicKey::deserialize(require_field!(key_pair.pubKyberKey)?).map_err(mapped_error)?;
    let kyber_private_key_enc = require_field!(key_pair.symEncPrivKyberKey)?;
    let kyber_private_key_raw = Zeroizing::new(encryption_key.decrypt_data(kyber_private_key_enc)?);
    let kyber_private_key = KyberPrivateKey::deserialize(kyber_private_key_raw.as_slice()).map_err(mapped_error)?;

    Ok(AsymmetricKeyPair::PQKeyPairs(PQKeyPairs {
        ecc_keys: EccKeyPair { public_key: EccPublicKey::from_bytes(ecc_public_key).map_err(mapped_error)?, private_key: EccPrivateKey::from_bytes(ecc_private_key.as_slice()).map_err(mapped_error)? },
        kyber_keys: KyberKeyPair { public_key: kyber_public_key, private_key: kyber_private_key },
    }))
}

fn decrypt_rsa_or_rsa_ecc_key_pair(encryption_key: &GenericAesKey, key_pair: &KeyPair) -> Result<AsymmetricKeyPair, KeyLoadError> {
    let public_key_pem = String::from_utf8(require_field!(key_pair.pubRsaKey)?.to_owned())
        .map_err(|error| KeyLoadError { reason: format!("Failed to decode pubRsaKey: {error}") })?;
    let public_key = RSAPublicKey::from_public_key_pem(public_key_pem.as_str())?;

    let sym_enc_priv_rsa_key = require_field!(key_pair.symEncPrivRsaKey)?;
    let private_key = RSAPrivateKey::from_pkcs1_der(encryption_key.decrypt_data(sym_enc_priv_rsa_key)?.as_slice())?;

    let rsa_key_pair = RSAKeyPair {
        public_key,
        private_key,
    };

    if let Some(ecc_key) = key_pair.symEncPrivEccKey.as_ref() {
        let public_ecc_key = require_field!(key_pair.pubEccKey)?;
        let private_ecc_key = Zeroizing::new(encryption_key.decrypt_data(ecc_key)?);
        Ok(AsymmetricKeyPair::RsaEccKeyPair(RSAEccKeyPair {
            rsa_key_pair,
            ecc_key_pair: EccKeyPair {
                public_key: EccPublicKey::from_bytes(public_ecc_key)?,
                private_key: EccPrivateKey::from_bytes(private_ecc_key.as_slice())?,
            },
        }))
    } else {
        Ok(AsymmetricKeyPair::RSAKeyPair(rsa_key_pair))
    }
}
