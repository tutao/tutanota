//! A module to be used over uniffi for low-level encryption operations.
//!
//! We implement parts of kyber differently than in crypto module to make it more FFI-friendly.

use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::crypto::rsa::{RSAPrivateKey, RSAPublicKey, SeedBufferRng};
use crate::crypto::{argon2_id, kyber};
use crate::util::{array_cast_slice, ArrayCastingError};
use base64::prelude::*;
use zeroize::Zeroizing;

/// Error occurred from trying to encapsulate/decapsulate with Kyber
/// with the simple_crypto kyber_encapsulate/kyber_decapsulate methods.
#[derive(thiserror::Error, Debug, uniffi::Error)]
#[uniffi(flat_error)]
enum KyberError {
	#[error("KeyError {reason}")]
	InvalidKey { reason: String },
	#[error("InvalidCiphertext")]
	InvalidCiphertextError,
	#[error("KyberDecapsulationError {reason}")]
	KyberDecapsulationError { reason: String },
}

impl From<kyber::KyberKeyError> for KyberError {
	fn from(value: kyber::KyberKeyError) -> Self {
		KyberError::InvalidKey {
			reason: value.reason,
		}
	}
}

impl From<kyber::KyberDecapsulationError> for KyberError {
	fn from(value: kyber::KyberDecapsulationError) -> Self {
		KyberError::KyberDecapsulationError {
			reason: value.reason,
		}
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
fn kyber_encapsulate_with_pub_key(
	public_key_bytes: Vec<u8>,
) -> Result<KyberEncapsulation, KyberError> {
	use crate::crypto::kyber;
	let encapsulation = kyber::KyberPublicKey::from_bytes(public_key_bytes.as_slice())?
		.encapsulate()
		.into();
	Ok(encapsulation)
}

/// Run kyber decapsulation algorithm
#[uniffi::export]
fn kyber_decapsulate_with_priv_key(
	private_key_bytes: Vec<u8>,
	ciphertext: Vec<u8>,
) -> Result<Vec<u8>, KyberError> {
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
	let kyber::KyberKeyPair {
		public_key,
		private_key,
	} = kyber::KyberKeyPair::generate();
	KyberKeyPair {
		public_key: public_key.as_bytes().to_vec(),
		private_key: private_key.as_bytes().to_vec(),
	}
}

impl From<kyber::KyberEncapsulation> for KyberEncapsulation {
	fn from(value: kyber::KyberEncapsulation) -> Self {
		Self {
			ciphertext: value.ciphertext.into_bytes().into(),
			shared_secret: value.shared_secret.into_bytes().into(),
		}
	}
}

/// Error occurred from trying to encrypt/decrypt with RSA with the simple_crypto
/// rsa_encrypt/rsa_decrypt methods.
#[derive(thiserror::Error, Debug, uniffi::Error)]
#[uniffi(flat_error)]
enum RSAError {
	#[error("InvalidKey {reason}")]
	InvalidKey { reason: String },
	#[error("InvalidCiphertext")]
	InvalidCiphertextError,
	#[error("RSAEncryptionError {reason}")]
	RSAEncryptionError { reason: String },
}

/// Decrypt with RSA with the given private key components.
#[uniffi::export]
fn rsa_decrypt_with_private_key_components(
	ciphertext: Vec<u8>,
	modulus: String,
	private_exponent: String,
	prime_p: String,
	prime_q: String,
) -> Result<Vec<u8>, RSAError> {
	let modulus = Zeroizing::new(modulus);
	let private_exponent = Zeroizing::new(private_exponent);
	let prime_p = Zeroizing::new(prime_p);
	let prime_q = Zeroizing::new(prime_q);

	let modulus =
		Zeroizing::new(
			BASE64_STANDARD
				.decode(modulus)
				.map_err(|_| RSAError::InvalidKey {
					reason: "modulus is not valid base64".to_owned(),
				})?,
		);
	let private_exponent =
		Zeroizing::new(BASE64_STANDARD.decode(private_exponent).map_err(|_| {
			RSAError::InvalidKey {
				reason: "private_exponent is not valid base64".to_owned(),
			}
		})?);
	let prime_p =
		Zeroizing::new(
			BASE64_STANDARD
				.decode(prime_p)
				.map_err(|_| RSAError::InvalidKey {
					reason: "prime_p is not valid base64".to_owned(),
				})?,
		);
	let prime_q =
		Zeroizing::new(
			BASE64_STANDARD
				.decode(prime_q)
				.map_err(|_| RSAError::InvalidKey {
					reason: "prime_q is not valid base64".to_owned(),
				})?,
		);

	let key = RSAPrivateKey::from_components(&modulus, &private_exponent, &prime_p, &prime_q)
		.map_err(|e| RSAError::InvalidKey {
			reason: e.to_string(),
		})?;

	key.decrypt(&ciphertext)
		.map_err(|_| RSAError::InvalidCiphertextError)
}

/// Encrypt with RSA with the given public key components.
#[uniffi::export]
fn rsa_encrypt_with_public_key_components(
	data: Vec<u8>,
	seed: Vec<u8>,
	modulus: String,
	public_exponent: u32,
) -> Result<Vec<u8>, RSAError> {
	let modulus =
		Zeroizing::new(
			BASE64_STANDARD
				.decode(modulus)
				.map_err(|_| RSAError::InvalidKey {
					reason: "modulus is not valid base64".to_owned(),
				})?,
		);
	let key = RSAPublicKey::from_components(&modulus, public_exponent).map_err(|e| {
		RSAError::InvalidKey {
			reason: e.to_string(),
		}
	})?;

	// Not very elegant to instantiate this here, but this avoids requiring external state while
	// letting us use seeded RNG, which is how RSA is presently implemented in Tuta.
	let randomizer_facade_with_seed = RandomizerFacade::from_core(SeedBufferRng::new(seed));

	key.encrypt(&randomizer_facade_with_seed, &data)
		.map_err(|e| RSAError::RSAEncryptionError {
			reason: e.to_string(),
		})
}

#[derive(thiserror::Error, Debug, uniffi::Error)]
#[uniffi(flat_error)]
enum Argon2idError {
	#[error("InvalidSaltSize: {actual_size}")]
	InvalidSaltSize { actual_size: usize },
}

/// Generate a passphrase key with the given passphrase using Argon2id
#[uniffi::export]
fn argon2id_generate_key_from_passphrase(
	passphrase: String,
	salt: Vec<u8>,
) -> Result<Vec<u8>, Argon2idError> {
	let passphrase = Zeroizing::new(passphrase);
	let salt =
		array_cast_slice(&salt, "salt").map_err(|ArrayCastingError { actual_size, .. }| {
			Argon2idError::InvalidSaltSize { actual_size }
		})?;
	let passphrase_key = argon2_id::generate_key_from_passphrase(passphrase.as_str(), salt);
	Ok(passphrase_key.as_bytes().to_vec())
}
