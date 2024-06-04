//! Contains code to handle Kyber-1024 encapsulation and decapsulation.

use pqcrypto_kyber::{kyber1024_decapsulate, kyber1024_encapsulate};
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};
use crate::util::{decode_byte_arrays, encode_byte_arrays};
use crate::join_slices;

use pqcrypto_kyber::kyber1024::PublicKey as PQCryptoKyber1024PublicKey;
use pqcrypto_kyber::kyber1024::SecretKey as PQCryptoKyber1024SecretKey;
use pqcrypto_traits::kem::{PublicKey, SecretKey};

/// The length of a Kyber-1024 encapsulation.
const KYBER_CIPHERTEXT_LEN: usize = 1568;

/// The length of a shared secret derived from a Kyber encapsulation.
const KYBER_SHARED_SECRET_LEN: usize = 32;

const KYBER_K: usize = 4;
const KYBER_POLYBYTES: usize = 384;
const KYBER_SYMBYTES: usize = 32;
const KYBER_POLYVECBYTES: usize = KYBER_K * KYBER_POLYBYTES;

const KYBER_PUBLIC_KEY_LEN: usize = KYBER_POLYVECBYTES + KYBER_SYMBYTES;
const KYBER_SECRET_KEY_LEN: usize = 2 * KYBER_POLYVECBYTES + 3 * KYBER_SYMBYTES;

/// Key used for performing encapsulation, owned by the recipient.
pub struct KyberPublicKey {
    public_key: PQCryptoKyber1024PublicKey
}

impl KyberPublicKey {
    /// Instantiate a public key from encoded byte arrays.
    ///
    /// Returns `Err` if the key is invalid.
    pub fn deserialize(arrays: &[u8]) -> Result<Self, KyberKeyError> {
        use pqcrypto_traits::kem::*;

        // Extract the components
        let [t, rho] = decode_byte_arrays(arrays).map_err(|reason| KyberKeyError { reason: reason.to_string() })?;

        if t.len() != KYBER_POLYVECBYTES {
            return Err(KyberKeyError { reason: "t length is incorrect".to_owned() });
        }

        if rho.len() != KYBER_SYMBYTES {
            return Err(KyberKeyError { reason: "rho length is incorrect".to_owned() });
        }

        let key_data = Zeroizing::new(join_slices!(t, rho));
        let public_key = PQCryptoKyber1024PublicKey::from_bytes(key_data.as_slice()).
            map_err(|reason| KyberKeyError { reason: format!("kyber API error: {reason}") })?;

        Ok(Self { public_key })
    }

    /// Serialize into encoded byte arrays.
    pub fn serialize(&self) -> Vec<u8> {
        let (t, rho) = self.public_key.as_bytes().split_at(KYBER_POLYVECBYTES);
        encode_byte_arrays(&[t, rho]).unwrap()
    }

    /// Generate a shared secret and ciphertext with this public key.
    pub fn encapsulate(&self) -> KyberEncapsulation {
        use pqcrypto_traits::kem::*;

        let (shared_secret, ciphertext) = kyber1024_encapsulate(&self.public_key);

        KyberEncapsulation {
            ciphertext: KyberCiphertext(ciphertext.as_bytes().try_into().unwrap()),
            shared_secret: KyberSharedSecret(shared_secret.as_bytes().try_into().unwrap())
        }
    }
}

/// Key used for performing decapsulation, owned by the recipient.
pub struct KyberPrivateKey {
    private_key: PQCryptoKyber1024SecretKey
}

impl KyberPrivateKey {
    /// Instantiate a private key from encoded byte arrays.
    ///
    /// Returns `Err` if the key is invalid.
    pub fn deserialize(bytes: &[u8]) -> Result<Self, KyberKeyError> {
        use pqcrypto_traits::kem::*;

        // Extract the components.
        let [s, hpk, nonce, t, rho] = decode_byte_arrays(bytes).map_err(|reason| KyberKeyError { reason: reason.to_string() })?;

        // Ensure the lengths are correct.
        if s.len() != KYBER_POLYVECBYTES {
            return Err(KyberKeyError { reason: "s length is incorrect".to_owned() });
        }
        if hpk.len() != KYBER_SYMBYTES {
            return Err(KyberKeyError { reason: "hpk length is incorrect".to_owned() });
        }
        if nonce.len() != KYBER_SYMBYTES {
            return Err(KyberKeyError { reason: "nonce length is incorrect".to_owned() });
        }
        if t.len() != KYBER_POLYVECBYTES {
            return Err(KyberKeyError { reason: "t length is incorrect".to_owned() });
        }
        if rho.len() != KYBER_SYMBYTES {
            return Err(KyberKeyError { reason: "rho length is incorrect".to_owned() });
        }

        // IMPORTANT: We have to reorder the components, since the byte array order is not the same as liboqs's order.
        let key_data = Zeroizing::new(join_slices!(s, t, rho, hpk, nonce));
        let private_key = PQCryptoKyber1024SecretKey::from_bytes(&key_data)
            .map_err(|reason| KyberKeyError { reason: format!("kyber API error: {reason}") })?;

        Ok(Self { private_key })
    }

    /// Serialize into encoded byte arrays.
    pub fn serialize(&self) -> Vec<u8> {
        let bytes = self.private_key.as_bytes();

        let (s, bytes) = bytes.split_at(KYBER_POLYVECBYTES);
        let (t, bytes) = bytes.split_at(KYBER_POLYVECBYTES);
        let (rho, bytes) = bytes.split_at(KYBER_SYMBYTES);
        let (hpk, nonce) = bytes.split_at(KYBER_SYMBYTES);

        encode_byte_arrays(&[s, hpk, nonce, t, rho]).unwrap()
    }

    /// Derive the public key.
    pub fn get_public_key(&self) -> KyberPublicKey {
        let bytes = self.private_key.as_bytes();
        let t_rho = &bytes[KYBER_POLYVECBYTES..KYBER_POLYVECBYTES*2 + KYBER_SYMBYTES];
        let public_key = PQCryptoKyber1024PublicKey::from_bytes(t_rho).unwrap();

        KyberPublicKey { public_key }
    }

    /// Attempt to decapsulate the ciphertext with this private key, returning the shared secret.
    ///
    /// Returns `Err` if the ciphertext is invalid.
    pub fn decapsulate(&self, ciphertext: &KyberCiphertext) -> Result<KyberSharedSecret, KyberDecapsulationError> {
        use pqcrypto_kyber::kyber1024::Ciphertext as Kyber1024Ciphertext;
        use pqcrypto_traits::kem::*;

        let ciphertext = Kyber1024Ciphertext::from_bytes(&ciphertext.0)
            .map_err(|reason| KyberDecapsulationError { reason: format!("failed to parse ciphertext: {reason}") })?;
        let encapsulation = kyber1024_decapsulate(&ciphertext, &self.private_key).as_bytes().try_into()
            .map_err(|reason| KyberDecapsulationError { reason: format!("failed to parse ciphertext: {reason}") })?;
        Ok(KyberSharedSecret(encapsulation))
    }
}

/// Error occurred from trying to read a Kyber public/private key.
#[derive(thiserror::Error, Debug)]
#[error("Invalid Kyber key: {reason}")]
pub struct KyberKeyError {
    reason: String
}

/// Error occurred from trying to decapsulate with [`KyberPrivateKey::decapsulate`].
#[derive(thiserror::Error, Debug)]
#[error("Decapsulation failure: {reason}")]
pub struct KyberDecapsulationError {
    reason: String
}

/// Can be used with [`KyberPrivateKey::decapsulate`] to get the shared secret.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct KyberCiphertext([u8; KYBER_CIPHERTEXT_LEN]);

/// Shared secret generated from either [`KyberPublicKey::encapsulate`] or [`KyberPrivateKey::decapsulate`].
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct KyberSharedSecret([u8; KYBER_SHARED_SECRET_LEN]);

/// Denotes a ciphertext and shared secret from [`KyberPublicKey::encapsulate`].
///
/// The ciphertext can be used with [`KyberPrivateKey::decapsulate`] to get the shared secret.
pub struct KyberEncapsulation {
    ciphertext: KyberCiphertext,
    shared_secret: KyberSharedSecret
}

#[cfg(test)]
mod tests {
    use crate::crypto::compatibility_test_utils::get_test_data;
    use super::*;

    #[test]
    fn test_kyber() {
        let test_data = get_test_data();
        for i in test_data.kyber_encryption_tests {
            let shared_secret = KyberSharedSecret(i.shared_secret.as_slice().try_into().unwrap());
            let ciphertext = KyberCiphertext(i.cipher_text.as_slice().try_into().unwrap());
            let private_key = KyberPrivateKey::deserialize(i.private_key.as_slice()).unwrap();
            let public_key = KyberPublicKey::deserialize(i.public_key.as_slice()).unwrap();
            assert_eq!(shared_secret.0, private_key.decapsulate(&ciphertext).unwrap().0);

            // NOTE: We cannot do compatibility tests for encapsulation with this library, only decapsulation, since we cannot inject randomness.
            //
            // As such, we'll just test round-trip. Since we test decapsulation, if round-trip is correct, then encapsulation SHOULD be correct.
            let encapsulated = public_key.encapsulate();
            let decapsulated = private_key.decapsulate(&encapsulated.ciphertext);
            assert_eq!(encapsulated.shared_secret.0, decapsulated.unwrap().0);

            // Test serialization
            let serialized_pub = public_key.serialize();
            let serialized_priv = private_key.serialize();
            assert_eq!(i.public_key, serialized_pub);
            assert_eq!(i.private_key, serialized_priv);

            // Test getting the public key
            assert_eq!(public_key.public_key.as_bytes(), private_key.get_public_key().public_key.as_bytes());
        }
    }
}