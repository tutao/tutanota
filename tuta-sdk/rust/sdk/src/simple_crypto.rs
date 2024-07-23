/// A module to be used over uniffi for low-level encryption operations.
///
/// We implement parts of kyber differently than in crypto module to make it more FFI-friendly.

use crate::crypto::kyber;

/// Error occurred from trying to read a Kyber public/private key.
#[derive(thiserror::Error, Debug, uniffi::Error)]
#[uniffi(flat_error)]
pub enum KyberError {
    #[error("KeyError {reason}")]
    InvalidKey {
        reason: String,
    },
    #[error("InvalidCiphertext")]
    InvalidCiphertextError,
    #[error("KyberDecapsulationError {reason}")]
    KyberDecapsulationError {
        reason: String,
    },
}

impl From<kyber::KyberKeyError> for KyberError {
    fn from(value: kyber::KyberKeyError) -> Self {
        KyberError::InvalidKey { reason: value.reason }
    }
}

impl From<kyber::KyberDecapsulationError> for KyberError {
    fn from(value: kyber::KyberDecapsulationError) -> Self {
        KyberError::KyberDecapsulationError { reason: value.reason }
    }
}


/// Result of kyber encapsulation
#[derive(uniffi::Record)]
struct KyberEncapsulation {
    ciphertext: Vec<u8>,
    shared_secret: Vec<u8>,
}

/// Run kyber encapsulation algorithm
#[uniffi::export]
fn kyber_encapsulate_with_pub_key(public_key_bytes: Vec<u8>) -> Result<KyberEncapsulation, KyberError> {
    use crate::crypto::kyber;
    let encapsulation = kyber::KyberPublicKey::from_bytes(public_key_bytes.as_slice())?
        .encapsulate()
        .into();
    Ok(encapsulation)
}

/// Run kyber decapsulation algorithm
#[uniffi::export]
fn kyber_decapsulate_with_priv_key(private_key_bytes: Vec<u8>, ciphertext: Vec<u8>) -> Result<Vec<u8>, KyberError> {
    use crate::crypto::kyber;
    let kyber_ciphertext = kyber::KyberCiphertext::try_from(ciphertext.as_slice())
        .map_err(|_| KyberError::InvalidCiphertextError)?;
    let plaintext = kyber::KyberPrivateKey::from_bytes(private_key_bytes.as_slice())?
        .decapsulate(&kyber_ciphertext)?
        .as_bytes()
        .to_vec();
    Ok(plaintext)
}

#[derive(uniffi::Record)]
struct KyberKeyPair {
    public_key: Vec<u8>,
    private_key: Vec<u8>,
}

/// Generate new kyber keypair
#[uniffi::export]
fn generate_kyber_keypair() -> KyberKeyPair {
    let kyber::KyberKeyPair { public_key, private_key } = kyber::KyberKeyPair::generate();
    KyberKeyPair { public_key: public_key.as_bytes().to_vec(), private_key: private_key.as_bytes().to_vec() }
}

impl From<kyber::KyberEncapsulation> for KyberEncapsulation {
    fn from(value: kyber::KyberEncapsulation) -> Self {
        Self {
            ciphertext: value.ciphertext.into_bytes().into(),
            shared_secret: value.shared_secret.into_bytes().into(),
        }
    }
}

