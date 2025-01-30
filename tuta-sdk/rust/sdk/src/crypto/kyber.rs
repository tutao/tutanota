//! Contains code to handle Kyber-1024 encapsulation and decapsulation.

use crate::join_slices;
use crate::util::{array_cast_slice, decode_byte_arrays, encode_byte_arrays, ArrayCastingError};
use pqcrypto_mlkem::{mlkem1024_decapsulate, mlkem1024_encapsulate};
use std::fmt::Debug;
use zeroize::{Zeroize, ZeroizeOnDrop, Zeroizing};

use crate::crypto::sha;
use pqcrypto_mlkem::mlkem1024::Ciphertext as PQCryptoMlKem1024Ciphertext;
use pqcrypto_mlkem::mlkem1024::PublicKey as PQCryptoMlKem1024PublicKey;
use pqcrypto_mlkem::mlkem1024::SecretKey as PQCryptoMlKem1024SecretKey;
use pqcrypto_mlkem::mlkem1024::SharedSecret as PQCryptoMlKem1024SharedSecret;
use pqcrypto_traits::kem::{Ciphertext, PublicKey, SecretKey, SharedSecret};
use sha3::digest::{ExtendableOutput, Update, XofReader};
use sha3::Shake256;

/// The length of a Kyber-1024 encapsulation.
const KYBER_CIPHERTEXT_LEN: usize = 1568;

/// The length of a shared secret derived from a Kyber encapsulation.
const KYBER_SHARED_SECRET_LEN: usize = 32;

const KYBER_K: usize = 4;
const KYBER_POLYBYTES: usize = 384;
const KYBER_SYMBYTES: usize = 32;
const KYBER_POLYVECBYTES: usize = KYBER_K * KYBER_POLYBYTES;

pub(crate) const KYBER_PUBLIC_KEY_LEN: usize = KYBER_POLYVECBYTES + KYBER_SYMBYTES;
pub(crate) const KYBER_SECRET_KEY_LEN: usize = 2 * KYBER_POLYVECBYTES + 3 * KYBER_SYMBYTES;

const SHAKE_BYTE_LENGTH: usize = 32;

/// Key used for performing encapsulation, owned by the recipient.
#[derive(Clone, PartialEq)]
pub struct KyberPublicKey {
	public_key: PQCryptoMlKem1024PublicKey,
}

impl KyberPublicKey {
	pub fn as_bytes(&self) -> &[u8] {
		self.public_key.as_bytes()
	}
}

#[cfg(test)] // only allow Debug in tests because this prints the key!
impl Debug for KyberPublicKey {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		self.public_key.as_bytes().fmt(f)
	}
}

impl KyberPublicKey {
	/// Instantiate a public key from bytes
	pub fn from_bytes(bytes: &[u8]) -> Result<Self, KyberKeyError> {
		let public_key =
			PQCryptoMlKem1024PublicKey::from_bytes(bytes).map_err(|reason| KyberKeyError {
				reason: format!("kyber API error: {reason}"),
			})?;
		Ok(Self { public_key })
	}

	/// Instantiate a public key from encoded (length + content) byte arrays.
	///
	/// Returns `Err` if the key is invalid.
	pub fn deserialize(arrays: &[u8]) -> Result<Self, KyberKeyError> {
		use pqcrypto_traits::kem::*;

		// Extract the components
		let [t, rho] = decode_byte_arrays(arrays).map_err(|reason| KyberKeyError {
			reason: reason.to_string(),
		})?;

		if t.len() != KYBER_POLYVECBYTES {
			return Err(KyberKeyError {
				reason: "t length is incorrect".to_owned(),
			});
		}

		if rho.len() != KYBER_SYMBYTES {
			return Err(KyberKeyError {
				reason: "rho length is incorrect".to_owned(),
			});
		}

		let key_data = Zeroizing::new(join_slices!(t, rho));
		let public_key =
			PQCryptoMlKem1024PublicKey::from_bytes(key_data.as_slice()).map_err(|reason| {
				KyberKeyError {
					reason: format!("kyber API error: {reason}"),
				}
			})?;

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

		let (unbound_shared_secret, ciphertext) = mlkem1024_encapsulate(&self.public_key);

		// turn ML-KEM into Kyber (except for some randomness hashing that we do not care about)
		let shared_secret = bind_shared_secret_to_ciphertext(unbound_shared_secret, ciphertext);

		KyberEncapsulation {
			ciphertext: KyberCiphertext(ciphertext.as_bytes().try_into().unwrap()),
			shared_secret,
		}
	}
}

/// This is a redundant step to bind the derived shared secret to the ciphertext.
/// It was part of the original round 3 Kyber submission specification and the reference implementation.
/// It was removed from the NIST ML-KEM draft for efficiency because the re-encryption step in decapsulation prevents any ciphertext modification attacks (IND-CCA).
/// Therefore, pqcrypto updated the implementation, and we keep this step for compatibility in order to avoid rolling out a new protocol version.
/// @return a shared_secret that is bound to the ciphertext and derived from the unbound_shared_secret: KDF(unbound_shared_secret || H(ciphertext))
fn bind_shared_secret_to_ciphertext(
	unbound_shared_secret: PQCryptoMlKem1024SharedSecret,
	ciphertext: PQCryptoMlKem1024Ciphertext,
) -> KyberSharedSecret {
	let hashed_ciphertext = sha::sha3_256(ciphertext.as_bytes());
	let kdf_input = [
		unbound_shared_secret.as_bytes(),
		hashed_ciphertext.as_slice(),
	]
	.concat();
	let shared_secret = shake256(kdf_input.as_slice());
	KyberSharedSecret(shared_secret)
}

fn shake256(input: &[u8]) -> [u8; SHAKE_BYTE_LENGTH] {
	let mut hasher = Shake256::default();
	hasher.update(input);
	let mut reader = hasher.finalize_xof();
	let mut output = [0; SHAKE_BYTE_LENGTH];
	reader.read(output.as_mut());
	output
}

impl From<PQCryptoMlKem1024PublicKey> for KyberPublicKey {
	fn from(value: PQCryptoMlKem1024PublicKey) -> Self {
		Self { public_key: value }
	}
}

/// Key used for performing decapsulation, owned by the recipient.
#[derive(Clone, PartialEq)]
pub struct KyberPrivateKey {
	private_key: PQCryptoMlKem1024SecretKey,
}

impl KyberPrivateKey {
	/// Returns this private key as a slice of bytes
	pub fn as_bytes(&self) -> &[u8] {
		self.private_key.as_bytes()
	}
}

#[cfg(test)] // only allow Debug in tests because this prints the key!
impl Debug for KyberPrivateKey {
	fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
		self.private_key.as_bytes().fmt(f)
	}
}

impl KyberPrivateKey {
	/// Instantiate a private key from bytes
	pub fn from_bytes(bytes: &[u8]) -> Result<Self, KyberKeyError> {
		let private_key =
			PQCryptoMlKem1024SecretKey::from_bytes(bytes).map_err(|reason| KyberKeyError {
				reason: format!("kyber API error: {reason}"),
			})?;

		Ok(Self { private_key })
	}

	/// Instantiate a private key from encoded (length + content)  byte arrays.
	///
	/// Returns `Err` if the key is invalid.
	pub fn deserialize(bytes: &[u8]) -> Result<Self, KyberKeyError> {
		use pqcrypto_traits::kem::*;

		// Extract the components.
		let [s, hpk, nonce, t, rho] =
			decode_byte_arrays(bytes).map_err(|reason| KyberKeyError {
				reason: reason.to_string(),
			})?;

		// Ensure the lengths are correct.
		if s.len() != KYBER_POLYVECBYTES {
			return Err(KyberKeyError {
				reason: "s length is incorrect".to_owned(),
			});
		}
		if hpk.len() != KYBER_SYMBYTES {
			return Err(KyberKeyError {
				reason: "hpk length is incorrect".to_owned(),
			});
		}
		if nonce.len() != KYBER_SYMBYTES {
			return Err(KyberKeyError {
				reason: "nonce length is incorrect".to_owned(),
			});
		}
		if t.len() != KYBER_POLYVECBYTES {
			return Err(KyberKeyError {
				reason: "t length is incorrect".to_owned(),
			});
		}
		if rho.len() != KYBER_SYMBYTES {
			return Err(KyberKeyError {
				reason: "rho length is incorrect".to_owned(),
			});
		}

		// IMPORTANT: We have to reorder the components, since the byte array order is not the same as liboqs's order.
		let key_data = Zeroizing::new(join_slices!(s, t, rho, hpk, nonce));
		let private_key =
			PQCryptoMlKem1024SecretKey::from_bytes(&key_data).map_err(|reason| KyberKeyError {
				reason: format!("kyber API error: {reason}"),
			})?;

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
		let t_rho = &bytes[KYBER_POLYVECBYTES..KYBER_POLYVECBYTES * 2 + KYBER_SYMBYTES];
		let public_key = PQCryptoMlKem1024PublicKey::from_bytes(t_rho).unwrap();

		KyberPublicKey { public_key }
	}

	/// Attempt to decapsulate the ciphertext with this private key, returning the shared secret.
	///
	/// Returns `Err` if the ciphertext is invalid.
	pub fn decapsulate(
		&self,
		ciphertext: &KyberCiphertext,
	) -> Result<KyberSharedSecret, KyberDecapsulationError> {
		use pqcrypto_mlkem::mlkem1024::Ciphertext as mlkem1024Ciphertext;
		use pqcrypto_traits::kem::*;

		let ciphertext = mlkem1024Ciphertext::from_bytes(&ciphertext.0).map_err(|reason| {
			KyberDecapsulationError {
				reason: format!("failed to parse ciphertext: {reason}"),
			}
		})?;
		let unbound_shared_secret = mlkem1024_decapsulate(&ciphertext, &self.private_key);

		// In case of an implicit rejection we will return a different rejection value than in the Kyber or ML-KEM specs:
		// KDF(KDF(z||c)||H(c)) instead of KDF(z||H(c)) as in the Kyber spec
		// We do this as the rejection value from ML-KEM is different, and we would have to check
		// and derive both rejection values to decide whether we have a rejection value and if so return the Kyber rejection value.
		// All of this would have to be implemented in constant time, meaning we would have to do it for every decapsulation.
		// This is redundant, and we do not leak anything with hashing kdf'ing the ML-Kem rejection again.
		Ok(bind_shared_secret_to_ciphertext(
			unbound_shared_secret,
			ciphertext,
		))
	}
}

impl From<PQCryptoMlKem1024SecretKey> for KyberPrivateKey {
	fn from(value: PQCryptoMlKem1024SecretKey) -> Self {
		Self { private_key: value }
	}
}

/// Error occurred from trying to read a Kyber public/private key.
#[derive(thiserror::Error, Debug)]
#[error("Invalid Kyber key: {reason}")]
pub struct KyberKeyError {
	pub reason: String,
}

/// Error occurred from trying to decapsulate with [`KyberPrivateKey::decapsulate`].
#[derive(thiserror::Error, Debug)]
#[error("Decapsulation failure: {reason}")]
pub struct KyberDecapsulationError {
	pub reason: String,
}

/// Can be used with [`KyberPrivateKey::decapsulate`] to get the shared secret.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct KyberCiphertext([u8; KYBER_CIPHERTEXT_LEN]);

impl KyberCiphertext {
	pub fn into_bytes(self) -> [u8; KYBER_CIPHERTEXT_LEN] {
		self.0
	}

	/// Get a reference to the underlying bytes.
	pub fn as_bytes(&self) -> &[u8] {
		self.0.as_slice()
	}
}

impl TryFrom<&[u8]> for KyberCiphertext {
	type Error = ArrayCastingError;
	fn try_from(value: &[u8]) -> Result<Self, Self::Error> {
		Ok(Self(array_cast_slice(value, "KyberCiphertext")?))
	}
}

/// Shared secret generated from either [`KyberPublicKey::encapsulate`] or [`KyberPrivateKey::decapsulate`].
#[derive(Zeroize, ZeroizeOnDrop, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the secret!
pub struct KyberSharedSecret([u8; KYBER_SHARED_SECRET_LEN]);

impl KyberSharedSecret {
	pub fn into_bytes(self) -> [u8; KYBER_SHARED_SECRET_LEN] {
		self.0
	}

	pub fn as_bytes(&self) -> &[u8] {
		self.0.as_slice()
	}
}

/// Denotes a ciphertext and shared secret from [`KyberPublicKey::encapsulate`].
///
/// The ciphertext can be used with [`KyberPrivateKey::decapsulate`] to get the shared secret.
pub struct KyberEncapsulation {
	pub ciphertext: KyberCiphertext,
	pub shared_secret: KyberSharedSecret,
}

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct KyberKeyPair {
	pub public_key: KyberPublicKey,
	pub private_key: KyberPrivateKey,
}

impl KyberKeyPair {
	/// Generate a keypair.
	pub fn generate() -> Self {
		use pqcrypto_mlkem::mlkem1024_keypair;
		let (kyber_public_key, kyber_private_key) = mlkem1024_keypair();
		Self {
			public_key: kyber_public_key.into(),
			private_key: kyber_private_key.into(),
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::compatibility_test_utils::get_compatibility_test_data;

	#[test]
	fn test_kyber() {
		let test_data = get_compatibility_test_data();
		for td in test_data.kyber_encryption_tests {
			let shared_secret = KyberSharedSecret(td.shared_secret.as_slice().try_into().unwrap());
			let ciphertext = KyberCiphertext(td.cipher_text.as_slice().try_into().unwrap());
			let private_key = KyberPrivateKey::deserialize(td.private_key.as_slice()).unwrap();
			let public_key = KyberPublicKey::deserialize(td.public_key.as_slice()).unwrap();
			assert_eq!(
				shared_secret.0,
				private_key.decapsulate(&ciphertext).unwrap().0
			);

			// NOTE: We cannot do compatibility tests for encapsulation with this library, only decapsulation, since we cannot inject randomness.
			//
			// As such, we'll just test round-trip. Since we test decapsulation, if round-trip is correct, then encapsulation SHOULD be correct.
			// assert_eq!(ciphertext.0, public_key.encapsulate().ciphertext.0);
			let encapsulated = public_key.encapsulate();
			let decapsulated = private_key.decapsulate(&encapsulated.ciphertext);
			assert_eq!(encapsulated.shared_secret.0, decapsulated.unwrap().0);

			// Test serialization
			let serialized_pub = public_key.serialize();
			let serialized_priv = private_key.serialize();
			assert_eq!(td.public_key, serialized_pub);
			assert_eq!(td.private_key, serialized_priv);

			// Test getting the public key
			assert_eq!(
				public_key.public_key.as_bytes(),
				private_key.get_public_key().public_key.as_bytes()
			);
		}
	}

	#[test]
	fn test_kyber_encoding_roundtrip() {
		// Generate some raw unencoded kyber keys
		let KyberKeyPair {
			public_key,
			private_key,
		} = KyberKeyPair::generate();

		// Encode the kyber keys
		let encoded_public_key = public_key.serialize();
		let encoded_private_key = private_key.serialize();

		// Decode the encoded kyber keys which should give us the raw kyber keys back
		let decoded_public_key =
			KyberPublicKey::deserialize(encoded_public_key.as_slice()).unwrap();
		let decoded_private_key =
			KyberPrivateKey::deserialize(encoded_private_key.as_slice()).unwrap();

		assert_eq!(public_key, decoded_public_key);
		assert_eq!(private_key, decoded_private_key);
	}

	#[test]
	fn test_kyber_encryption_roundtrip() {
		let key_pair = KyberKeyPair::generate();
		let encapsulated = key_pair.public_key.encapsulate();
		let shared_secret_alice = encapsulated.shared_secret;
		let shared_secret_bob = key_pair
			.private_key
			.decapsulate(&encapsulated.ciphertext)
			.unwrap();
		assert_eq!(shared_secret_alice, shared_secret_bob)
	}
}
