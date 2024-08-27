use crate::crypto::ecc::EccKeyPair;
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::join_slices;
use rand_core::impls::{next_u32_via_fill, next_u64_via_fill};
use rand_core::{CryptoRng, Error, RngCore};
use rsa::traits::{PrivateKeyParts, PublicKeyParts};
use rsa::{BigUint, Oaep};
use sha2::Sha256;
use std::ops::Deref;
use zeroize::{ZeroizeOnDrop, Zeroizing};

#[cfg(test)]
const RSA_KEY_BIT_SIZE: usize = 2048;

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct RSAPublicKey(rsa::RsaPublicKey);

impl RSAPublicKey {
	pub fn new(public_key: rsa::RsaPublicKey) -> Self {
		Self(public_key)
	}

	/// Create a key from a PEM-encoded ASN.1 SPKI
	pub fn from_public_key_pem(s: &str) -> Result<Self, RSAKeyError> {
		use rsa as rsa_package;
		use rsa_package::pkcs8::DecodePublicKey;
		let new_key =
			rsa_package::RsaPublicKey::from_public_key_pem(s).map_err(|error| RSAKeyError {
				reason: error.to_string(),
			})?;
		Ok(Self(new_key))
	}
}

const RSA_PUBLIC_EXPONENT: u32 = 65537;

impl RSAPublicKey {
	/// Instantiate an RSAPublicKey from a modulus.
	///
	/// Returns `Err` if the modulus is the wrong size.
	pub fn from_components(modulus: &[u8], public_exponent: u32) -> Result<Self, RSAKeyError> {
		rsa::RsaPublicKey::new(BigUint::from_bytes_be(modulus), public_exponent.into())
			.map(Self)
			.map_err(|e| RSAKeyError {
				reason: format!("rsa public key parse error: {e}"),
			})
	}

	/// Parse from encoded form.
	pub fn deserialize(bytes: &[u8]) -> Result<Self, RSAKeyError> {
		let [modulus] = decode_nibble_arrays(bytes)?;
		Self::from_components(modulus, RSA_PUBLIC_EXPONENT)
	}

	/// Convert to encoded form.
	pub fn serialize(&self) -> Vec<u8> {
		let modulus = Zeroizing::new(self.0.n().to_bytes_be());
		let encoded = encode_nibble_arrays(&[modulus.as_slice()]).unwrap();
		encoded
	}

	/// Encrypt with the given RNG provider.
	///
	/// Returns `Err` if an error occurs.
	pub fn encrypt(
		&self,
		randomizer_facade: &RandomizerFacade,
		data: &[u8],
	) -> Result<Vec<u8>, RSAEncryptionError> {
		let padding = Oaep::new::<Sha256>();
		let mut rng = randomizer_facade.clone();

		self.0
			.encrypt(&mut rng, padding, data)
			.map_err(|e| RSAEncryptionError {
				reason: format!("encrypt error: {e}"),
			})
	}
}

#[derive(Clone, ZeroizeOnDrop, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct RSAPrivateKey(rsa::RsaPrivateKey);

impl RSAPrivateKey {
	pub fn new(private_key: rsa::RsaPrivateKey) -> Self {
		Self(private_key)
	}
	/// Derives an PKCS1 RSA private key from an ASN.1-DER encoded private key
	pub fn from_pkcs1_der(private_key: &[u8]) -> Result<Self, RSAKeyError> {
		use rsa as rsa_package;
		use rsa_package::pkcs1::DecodeRsaPrivateKey;

		let derived_key =
			rsa_package::RsaPrivateKey::from_pkcs1_der(private_key).map_err(|error| {
				RSAKeyError {
					reason: error.to_string(),
				}
			})?;
		Ok(Self(derived_key))
	}
}

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct RSAKeyPair {
	pub public_key: RSAPublicKey,
	pub private_key: RSAPrivateKey,
}

impl RSAKeyPair {
	/// Generate an RSA keypair.
	///
	/// We do not generate RSA keys anymore, so this is only visible in test code.
	#[cfg(test)]
	pub fn generate(randomizer_facade: &RandomizerFacade) -> Self {
		let private_key =
			rsa::RsaPrivateKey::new(&mut randomizer_facade.clone(), RSA_KEY_BIT_SIZE).unwrap();
		let public_key = private_key.to_public_key();
		Self {
			public_key: RSAPublicKey::new(public_key),
			private_key: RSAPrivateKey::new(private_key),
		}
	}
}

#[derive(Clone, PartialEq)]
#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
pub struct RSAEccKeyPair {
	pub rsa_key_pair: RSAKeyPair,
	pub ecc_key_pair: EccKeyPair,
}

impl RSAEccKeyPair {
	/// Generate an RSA-ECC keypair.
	///
	/// This is only intended to be used for testing, as new RSA keys should not be generated.
	#[cfg(test)]
	pub fn generate(randomizer_facade: &RandomizerFacade) -> Self {
		Self {
			rsa_key_pair: RSAKeyPair::generate(randomizer_facade),
			ecc_key_pair: EccKeyPair::generate(randomizer_facade),
		}
	}
}

impl RSAPrivateKey {
	/// Instantiate an RSAPrivateKey from its components.
	///
	/// Returns `Err` if any components are not correct.
	pub fn from_components(
		modulus: &[u8],
		private_exponent: &[u8],
		prime_p: &[u8],
		prime_q: &[u8],
	) -> Result<Self, RSAKeyError> {
		rsa::RsaPrivateKey::from_components(
			BigUint::from_bytes_be(modulus),
			RSA_PUBLIC_EXPONENT.into(),
			BigUint::from_bytes_be(private_exponent),
			vec![
				BigUint::from_bytes_be(prime_p),
				BigUint::from_bytes_be(prime_q),
			],
		)
		.and_then(|v| {
			v.validate()?;
			Ok(Self(v))
		})
		.map_err(|e| RSAKeyError {
			reason: format!("rsa private key parse error: {e}"),
		})
	}

	/// Convert to encoded form.
	pub fn serialize(&self) -> Vec<u8> {
		let one = BigUint::from(1u32);
		let crt_coefficient = self.0.crt_coefficient().unwrap();
		let [prime_p, prime_q] = self.0.primes() else {
			unreachable!()
		};
		let modulus = self.0.n();
		let private_exponent = self.0.d();

		// Note: We have to store p-1 and q-1 to ensure we zeroize them later
		let p1 = Zeroizing::new(prime_p - &one);
		let q1 = Zeroizing::new(prime_q - &one);
		let exponent_p = Zeroizing::new(private_exponent % p1.deref());
		let exponent_q = Zeroizing::new(private_exponent % q1.deref());

		// For efficiently padding to 256 bytes
		let mut zeroes = Vec::with_capacity(256);
		let mut resize = |bytes: Vec<u8>| -> Vec<u8> {
			if bytes.len() < 256 {
				let bytes = Zeroizing::new(bytes);
				zeroes.resize(256 - bytes.len(), 0); // resize the same byte array so we don't have to re-allocate
				let new_val = join_slices!(&zeroes, bytes.as_slice());
				new_val
			} else {
				bytes
			}
		};

		let modulus_bytes = Zeroizing::new(modulus.to_bytes_be());
		let private_exponent_bytes = Zeroizing::new(private_exponent.to_bytes_be());
		let prime_p_bytes = Zeroizing::new(resize(prime_p.to_bytes_be()));
		let prime_q_bytes = Zeroizing::new(resize(prime_q.to_bytes_be()));
		let exponent_p_bytes = Zeroizing::new(resize(exponent_p.to_bytes_be()));
		let exponent_q_bytes = Zeroizing::new(resize(exponent_q.to_bytes_be()));
		let crt_coefficient_bytes = Zeroizing::new(resize(crt_coefficient.to_bytes_be()));

		encode_nibble_arrays(&[
			modulus_bytes.as_slice(),
			private_exponent_bytes.as_slice(),
			prime_p_bytes.as_slice(),
			prime_q_bytes.as_slice(),
			exponent_p_bytes.as_slice(),
			exponent_q_bytes.as_slice(),
			crt_coefficient_bytes.as_slice(),
		])
		.unwrap()
	}

	/// Parse from encoded form.
	pub fn deserialize(bytes: &[u8]) -> Result<Self, RSAKeyError> {
		let [modulus, private_exponent, prime_p, prime_q, _exponent_p, _exponent_q, _crt_coefficient] =
			decode_nibble_arrays(bytes).unwrap();
		Self::from_components(modulus, private_exponent, prime_p, prime_q)
	}

	/// Decrypt the ciphertext.
	///
	/// Returns `Err` if an error occurs.
	pub fn decrypt(&self, ciphertext: &[u8]) -> Result<Vec<u8>, RSAEncryptionError> {
		let padding = Oaep::new::<Sha256>();
		self.0
			.decrypt(padding, ciphertext)
			.map_err(|e| RSAEncryptionError {
				reason: format!("decrypt error: {e}"),
			})
	}
}

/// Decode the encoded byte arrays.
///
/// We encode multiple byte arrays into one by prefixing each byte array with the length as a 16-bit integer (in big endian byte order).
///
/// Returns `Err` if this is invalid.
fn decode_nibble_arrays<const SIZE: usize>(arrays: &[u8]) -> Result<[&[u8]; SIZE], RSAKeyError> {
	let mut result = [[0u8; 0].as_slice(); SIZE];
	let mut remaining = arrays;

	for (array_index, array_result) in result.iter_mut().enumerate() {
		if remaining.len() < 2 {
			return Err(RSAKeyError {
				reason: format!(
					"invalid encoded RSA key (only got {array_index} array(s), expected {SIZE})"
				),
			});
		}
		let (len_bytes, after) = remaining.split_at(2);

		let length = (u16::from_be_bytes(len_bytes.try_into().unwrap()) as usize) / 2;
		if after.len() < length {
			return Err(RSAKeyError {
				reason: format!("invalid encoded RSA key (size {length} is too large)"),
			});
		}
		let (arr, new_remaining) = after.split_at(length);

		*array_result = arr;
		remaining = new_remaining;
	}

	if !remaining.is_empty() {
		return Err(RSAKeyError {
			reason: format!(
				"extraneous {} byte(s) detected - incorrect size?",
				remaining.len()
			),
		});
	}

	Ok(result)
}

/// Encode the byte arrays into one.
///
/// We encode multiple byte arrays into one by prefixing each byte array with the length as a 16-bit integer (in big endian byte order).
///
/// Returns `Err` if anything is bigger than a 16-bit integer.
fn encode_nibble_arrays<const SIZE: usize>(arrays: &[&[u8]; SIZE]) -> Result<Vec<u8>, RSAKeyError> {
	let mut expected_size = 0usize;
	for &i in arrays {
		let len = i.len() * 2;
		if len > u16::MAX as usize {
			return Err(RSAKeyError {
				reason: format!("nibble array length {len} exceeds 16-bit limit"),
			});
		}
		expected_size += 2 + i.len();
	}

	let mut v = Vec::with_capacity(expected_size);
	for &i in arrays {
		v.extend_from_slice(&((i.len() * 2) as u16).to_be_bytes());
		v.extend_from_slice(i);
	}

	Ok(v)
}

/// Error that occurs when parsing RSA keys.
#[derive(thiserror::Error, Debug)]
#[error("RSA error: {reason}")]
pub struct RSAKeyError {
	reason: String,
}

/// Error that occurs when using rsa encrypt/decrypt.
#[derive(thiserror::Error, Debug)]
#[error("RSA error: {reason}")]
pub struct RSAEncryptionError {
	reason: String,
}

/// Used for providing a string of bytes as a random number generator.
///
/// # Panics
///
/// This will panic if not enough bytes have been passed into the random number generator.
#[derive(ZeroizeOnDrop)]
pub(crate) struct SeedBufferRng {
	buff: Vec<u8>,
}

impl SeedBufferRng {
	pub fn new(buff: Vec<u8>) -> SeedBufferRng {
		SeedBufferRng { buff }
	}
}

impl RngCore for SeedBufferRng {
	fn next_u32(&mut self) -> u32 {
		next_u32_via_fill(self)
	}

	fn next_u64(&mut self) -> u64 {
		next_u64_via_fill(self)
	}

	fn fill_bytes(&mut self, dest: &mut [u8]) {
		let (copied, remaining) = self.buff.split_at(dest.len());
		dest.copy_from_slice(copied);
		self.buff = remaining.to_owned();
	}

	fn try_fill_bytes(&mut self, dest: &mut [u8]) -> Result<(), Error> {
		self.fill_bytes(dest);
		Ok(())
	}
}

impl CryptoRng for SeedBufferRng {}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::compatibility_test_utils::get_test_data;

	#[test]
	fn test_rsa_encryption() {
		let test_data = get_test_data();
		for i in test_data.rsa_encryption_tests {
			let public_key = RSAPublicKey::deserialize(&i.public_key).unwrap();
			let randomizer = RandomizerFacade::from_core(SeedBufferRng::new(i.seed));
			let ciphertext = public_key.encrypt(&randomizer, &i.input).unwrap();
			assert_eq!(i.result, ciphertext);
		}
	}

	#[test]
	fn test_rsa_decryption() {
		let test_data = get_test_data();
		for i in test_data.rsa_encryption_tests {
			let private_key = RSAPrivateKey::deserialize(&i.private_key).unwrap();
			let data = private_key.decrypt(&i.result).unwrap();
			assert_eq!(i.input, data);
		}
	}

	#[test]
	fn test_rsa_serialize_roundtrip() {
		let test_data = get_test_data();
		for i in test_data.rsa_encryption_tests {
			let public_key = RSAPublicKey::deserialize(&i.public_key).unwrap();
			assert_eq!(i.public_key, public_key.serialize());
			let private_key = RSAPrivateKey::deserialize(&i.private_key).unwrap();
			assert_eq!(i.private_key, private_key.serialize());
		}
	}
}
