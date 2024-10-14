//! Contains code to handle AES128/AES256 encryption and decryption

use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::join_slices;
use crate::util::{array_cast_size, array_cast_slice, ArrayCastingError};
use aes::cipher::block_padding::Pkcs7;
use aes::cipher::{BlockCipher, BlockSizeUser};
use cbc::cipher::block_padding::UnpadError;
use cbc::cipher::{BlockDecrypt, BlockDecryptMut, BlockEncrypt, BlockEncryptMut, KeyIvInit};
use zeroize::ZeroizeOnDrop;

/// Denotes whether a text is/should be padded
pub enum PaddingMode {
	/// Do not use padding; used for encrypting fixed-length values (i.e. keys).
	NoPadding,

	/// Use padding; used for variable-length encrypted data.
	WithPadding,
}

/// Denotes whether a text should include a message authentication code
pub enum MacMode {
	/// No verification will be done on the ciphertext.
	///
	/// This is only supported for legacy compatibility. You should not use this to encrypt new data.
	NoMac,

	/// Perform verification on the ciphertext by deriving subkeys from the provided AES key.
	WithMac,
}

/// Denotes whether a presence of MAC authentication is enforced
#[derive(PartialEq)]
pub enum EnforceMac {
	AllowNoMac,
	EnforceMac,
}

/// Generates a struct that implements the `AesKey` trait to represent an AES key.
///
/// Arguments:
/// - $name: The name of the generated struct.
/// - $type_name: The name of the generated struct in literal string form.
/// - $size: The size of the AES key. It should be the same as in `$cbc`.
/// - $cbc: The type from the `aes` dependency.
/// - $subkey_digest: The type of SHA hasher from the `sha2` dependency to use.
macro_rules! aes_key {
	($name:tt, $type_name:literal, $size:expr, $cbc:ty, $subkey_digest:ty) => {
		#[derive(Clone, ZeroizeOnDrop, PartialEq)]
		#[cfg_attr(test, derive(Debug))] // only allow Debug in tests because this prints the key!
		pub struct $name([u8; $size]);

		impl $name {
			/// Generate an AES key.
			#[must_use]
			pub fn generate(randomizer_facade: &RandomizerFacade) -> Self {
				let key: [u8; $size] = randomizer_facade.generate_random_array();
				Self(key)
			}

			/// Get the key represented as bytes.
			#[must_use]
			pub fn as_bytes(&self) -> &[u8; $size] {
				&self.0
			}

			/// Load the key from bytes.
			///
			/// Returns Err if the key is not the correct size.
			pub fn from_bytes(bytes: &[u8]) -> Result<Self, ArrayCastingError> {
				Ok(Self(array_cast_slice(bytes, $type_name)?))
			}
		}

		impl<const SIZE: usize> TryFrom<[u8; SIZE]> for $name {
			type Error = ArrayCastingError;
			fn try_from(value: [u8; SIZE]) -> Result<Self, Self::Error> {
				Ok(Self(array_cast_size(value, $type_name)?))
			}
		}

		impl TryFrom<Vec<u8>> for $name {
			type Error = ArrayCastingError;
			fn try_from(value: Vec<u8>) -> Result<Self, Self::Error> {
				Ok(Self(array_cast_slice(value.as_slice(), $type_name)?))
			}
		}

		impl AesKey for $name {
			type CbcKeyType = $cbc;
			fn get_bytes(&self) -> &[u8] {
				&self.0
			}

			fn derive_subkeys(&self) -> AesSubKeys<Self> {
				use cbc::cipher::KeySizeUser;
				use sha2::Digest;

				let mut hasher = <$subkey_digest>::new();
				hasher.update(self.get_bytes());
				let hashed_key = hasher.finalize();

				let (c_key_slice, m_key_slice) =
					hashed_key.split_at(<Self as AesKey>::CbcKeyType::key_size());
				AesSubKeys {
					c_key: Self::from_bytes(c_key_slice).unwrap(),
					m_key: Self::from_bytes(m_key_slice).unwrap(),
				}
			}
		}
	};
}

aes_key!(
	Aes128Key,
	"Aes128Key",
	AES_128_KEY_SIZE,
	aes::Aes128,
	sha2::Sha256
);

aes_key!(
	Aes256Key,
	"Aes256Key",
	AES_256_KEY_SIZE,
	aes::Aes256,
	sha2::Sha512
);

trait AesKey: Clone {
	/// The equivalent type in the RustCrypto packages to this key type
	type CbcKeyType: BlockEncryptMut
		+ BlockDecryptMut
		+ BlockEncrypt
		+ BlockDecrypt
		+ BlockCipher
		+ cbc::cipher::KeyInit;
	/// Returns the key in raw byte form
	fn get_bytes(&self) -> &[u8];
	/// Generates the AES (`c`) and HMAC (`m`) subkeys from the key
	fn derive_subkeys(&self) -> AesSubKeys<Self>;
}

/// An initialisation vector for AES encryption
pub struct Iv([u8; IV_BYTE_SIZE]);

impl Clone for Iv {
	/// Clone the initialization vector
	///
	/// This is implemented so that entity_facade_test_utils will work. You should never, ever, ever
	/// re-use an IV, as this can lead to information leakage.
	fn clone(&self) -> Self {
		Iv(self.0)
	}
}

impl Iv {
	/// Generate an initialisation vector.
	#[must_use]
	pub fn generate(randomizer_facade: &RandomizerFacade) -> Self {
		Self(randomizer_facade.generate_random_array())
	}

	pub fn from_bytes(bytes: &[u8]) -> Result<Self, ArrayCastingError> {
		Ok(Self(array_cast_slice(bytes, "Iv")?))
	}

	fn from_slice(slice: &[u8]) -> Option<Self> {
		Self::from_bytes(slice).ok()
	}

	#[must_use]
	pub fn get_inner(&self) -> &[u8; IV_BYTE_SIZE] {
		&self.0
	}
}

#[derive(thiserror::Error, Debug)]
pub enum AesEncryptError {
	#[error("InvalidDataLength")]
	InvalidDataLength,
}

/// Encrypts the raw string `plaintext` using AES-128-CBC with optional PKCS7 padding and optional HMAC-SHA-256
pub fn aes_128_encrypt(
	key: &Aes128Key,
	plaintext: &[u8],
	iv: &Iv,
	padding_mode: PaddingMode,
	mac_mode: MacMode,
) -> Result<Vec<u8>, AesEncryptError> {
	aes_encrypt(key, plaintext, iv, padding_mode, mac_mode)
}

/// Encrypts `plaintext` with `FIXED_IV` and without padding nor a MAC using AES128-CBC
/// Mainly used for encrypting keys
pub fn aes_128_encrypt_no_padding_fixed_iv(
	key: &Aes128Key,
	plaintext: &[u8],
) -> Result<Vec<u8>, AesEncryptError> {
	let mut encryptor =
		cbc::Encryptor::<aes::Aes128>::new_from_slices(key.get_bytes(), &FIXED_IV).unwrap();
	let block_size = <aes::Aes128 as BlockSizeUser>::block_size();
	if plaintext.len() % block_size != 0 {
		return Err(AesEncryptError::InvalidDataLength);
	}
	Ok(encrypt_unpadded_vec_mut(&mut encryptor, plaintext))
}

/// Encrypts the raw string `plaintext` using AES-256-CBC with optional PKCS7 padding and optional HMAC-SHA-512
pub fn aes_256_encrypt(
	key: &Aes256Key,
	plaintext: &[u8],
	iv: &Iv,
	padding_mode: PaddingMode,
) -> Result<Vec<u8>, AesEncryptError> {
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
}

/// Result of decryption operation.
/// IV is usually part of the ciphertext. Returned iv is a part of the provided ciphertext.
pub struct PlaintextAndIv {
	pub data: Vec<u8>,
	// IV is small enough that a copy is the same size as a reference
	pub iv: [u8; IV_BYTE_SIZE],
}

/// Decrypt using AES-128-CBC using prepended IV with PKCS7 padding and optional HMAC-SHA-256
pub fn aes_128_decrypt(
	key: &Aes128Key,
	encrypted_bytes: &[u8],
) -> Result<PlaintextAndIv, AesDecryptError> {
	aes_decrypt(
		key,
		encrypted_bytes,
		PaddingMode::WithPadding,
		EnforceMac::AllowNoMac,
	)
}

/// Decrypt an encryption key with AES-128 using fixed IV, without authentication
pub fn aes_128_decrypt_no_padding_fixed_iv(
	key: &Aes128Key,
	encrypted_bytes: &[u8],
) -> Result<Vec<u8>, AesDecryptError> {
	if has_mac(encrypted_bytes) {
		return Err(AesDecryptError::InvalidDataSizeError);
	}

	let mut decryptor = cbc::Decryptor::<aes::Aes128>::new(&key.0.into(), &FIXED_IV.into());
	let plaintext_data = decrypt_unpadded_vec_mut(&mut decryptor, encrypted_bytes);

	Ok(plaintext_data)
}

/// Decrypt using AES-256-CBC using prepended IV with PKCS7 padding and HMAC-SHA-512
pub fn aes_256_decrypt(
	key: &Aes256Key,
	encrypted_bytes: &[u8],
) -> Result<PlaintextAndIv, AesDecryptError> {
	aes_decrypt(
		key,
		encrypted_bytes,
		PaddingMode::WithPadding,
		EnforceMac::EnforceMac,
	)
}

/// Decrypt an encryption key with AES-256-CBC using prepended IV without padding and HMAC-SHA-512
pub fn aes_256_decrypt_no_padding(
	key: &Aes256Key,
	encrypted_bytes: &[u8],
) -> Result<PlaintextAndIv, AesDecryptError> {
	aes_decrypt(
		key,
		encrypted_bytes,
		PaddingMode::NoPadding,
		EnforceMac::EnforceMac,
	)
}

pub const AES_128_KEY_SIZE: usize = 16;
pub const AES_256_KEY_SIZE: usize = 32;

/// The size of an AES initialisation vector in bytes
pub const IV_BYTE_SIZE: usize = 16;

/// Size of HMAC authentication added to the ciphertext
const MAC_SIZE: usize = 32;

/// Encrypts a plaintext without adding padding and returns the encrypted text as a vector
fn encrypt_unpadded_vec_mut<C: BlockCipher + BlockEncryptMut>(
	encryptor: &mut cbc::Encryptor<C>,
	plaintext: &[u8],
) -> Vec<u8> {
	let mut output_buffer = vec![0; plaintext.len()];
	for (chunk, output) in plaintext
		.chunks(C::block_size())
		.zip(output_buffer.chunks_mut(C::block_size()))
	{
		encryptor.encrypt_block_b2b_mut(chunk.into(), output.into());
	}
	output_buffer
}

/// Keys derived for AES key to enable authentication
struct AesSubKeys<Key: AesKey> {
	/// Key used for encrypting data
	c_key: Key,
	/// Key used for HMAC (authentication)
	m_key: Key,
}

type Aes128SubKeys = AesSubKeys<Aes128Key>;
type Aes256SubKeys = AesSubKeys<Aes256Key>;

impl<Key: AesKey> AesSubKeys<Key> {
	fn compute_mac(&self, iv: &[u8], ciphertext: &[u8]) -> [u8; MAC_SIZE] {
		use hmac::Mac;
		use sha2::Sha256;

		let mut hmac = hmac::Hmac::<Sha256>::new_from_slice(self.m_key.get_bytes()).unwrap();
		hmac.update(iv);
		hmac.update(ciphertext);
		hmac.finalize().into_bytes().into()
	}
}

/// Generic AES-CBC function with optional PKCS7 padding and with optional HMAC-SHA support
fn aes_encrypt<Key: AesKey>(
	key: &Key,
	plaintext: &[u8],
	iv: &Iv,
	padding_mode: PaddingMode,
	mac_mode: MacMode,
) -> Result<Vec<u8>, AesEncryptError> {
	// Extract the correct key into an encryptor depending on
	// whether `c` needs to be derived for MAC s (note that no mac means no sub keys)
	let (mut encryptor, sub_keys) = match mac_mode {
		MacMode::NoMac => (
			cbc::Encryptor::<Key::CbcKeyType>::new_from_slices(key.get_bytes(), &iv.0).unwrap(),
			None,
		),
		MacMode::WithMac => {
			let sub_keys = key.derive_subkeys();
			(
				cbc::Encryptor::<Key::CbcKeyType>::new_from_slices(
					sub_keys.c_key.get_bytes(),
					&iv.0,
				)
				.unwrap(),
				Some(sub_keys),
			)
		},
	};

	// Pad/verify block size
	let block_size = <Key::CbcKeyType as BlockSizeUser>::block_size();
	let encrypted_data = match padding_mode {
		PaddingMode::NoPadding => {
			if plaintext.len() % block_size != 0 {
				return Err(AesEncryptError::InvalidDataLength);
			}
			encrypt_unpadded_vec_mut(&mut encryptor, plaintext)
		},
		PaddingMode::WithPadding => encryptor.encrypt_padded_vec_mut::<Pkcs7>(plaintext),
	};

	if let Some(subkeys) = sub_keys {
		let ciphertext_with_auth =
			CiphertextWithAuthentication::compute(&encrypted_data, &iv.0, &subkeys);
		Ok(ciphertext_with_auth.serialize())
	} else {
		// without HMAC it is just
		// - iv
		// - encrypted data
		Ok(join_slices!(iv.0.as_slice(), &encrypted_data))
	}
}

/// Decrypts an encrypted plain text that does not have padding using AES-CBC and returns
/// the decrypted text as a vector.
fn decrypt_unpadded_vec_mut<C: BlockCipher + BlockDecrypt>(
	decryptor: &mut cbc::Decryptor<C>,
	buf: &[u8],
) -> Vec<u8> {
	let mut output_buffer = vec![0; buf.len()];
	for (chunk, output) in buf
		.chunks(C::block_size())
		.zip(output_buffer.chunks_mut(C::block_size()))
	{
		decryptor.decrypt_block_b2b_mut(chunk.into(), output.into());
	}
	output_buffer
}

/// The initialisation vector used when encrypting keys
const FIXED_IV: [u8; IV_BYTE_SIZE] = [0x88; IV_BYTE_SIZE];

#[derive(Debug)]
struct CiphertextWithAuthentication<'a> {
	iv: &'a [u8],
	ciphertext: &'a [u8],
	// it's smol enough to just copy it around
	mac: [u8; MAC_SIZE],
}

impl<'a> CiphertextWithAuthentication<'a> {
	fn parse(bytes: &'a [u8]) -> Result<Option<CiphertextWithAuthentication<'a>>, AesDecryptError> {
		// No MAC
		if !has_mac(bytes) {
			return Ok(None);
		}

		// Incorrect size for Hmac
		if bytes.len() <= IV_BYTE_SIZE + MAC_SIZE {
			return Err(AesDecryptError::HmacError);
		}

		// Split `bytes` into the MAC and combined ciphertext with iv
		let encrypted_bytes_without_marker = &bytes[1..];
		let end_of_ciphertext = encrypted_bytes_without_marker.len() - MAC_SIZE;
		let (ciphertext_without_mac, provided_mac_bytes) =
			encrypted_bytes_without_marker.split_at(end_of_ciphertext);

		// Extract the iv from the ciphertext and return the extracted components
		let (iv, ciphertext) = ciphertext_without_mac.split_at(IV_BYTE_SIZE);
		let mac: [u8; MAC_SIZE] =
			array_cast_slice(provided_mac_bytes, "MAC").map_err(|_| AesDecryptError::HmacError)?;
		Ok(Some(CiphertextWithAuthentication {
			iv,
			ciphertext,
			mac,
		}))
	}

	fn compute<Key: AesKey>(
		ciphertext: &'a [u8],
		iv: &'a [u8],
		subkeys: &AesSubKeys<Key>,
	) -> CiphertextWithAuthentication<'a> {
		CiphertextWithAuthentication {
			iv,
			ciphertext,
			mac: subkeys.compute_mac(iv, ciphertext),
		}
	}

	fn matches<Key: AesKey>(&self, subkeys: &AesSubKeys<Key>) -> bool {
		self.mac == subkeys.compute_mac(self.iv, self.ciphertext)
	}

	fn serialize(&self) -> Vec<u8> {
		// - marker that HMAC is there (a single byte with "1" in the front, this makes the length
		//   un-even)
		// - iv
		// - encrypted data
		// - HMAC bytes

		join_slices!(&[1u8; 1], self.iv, self.ciphertext, &self.mac)
	}
}

/// Returns whether the raw ciphertext `bytes` has a MAC included.
fn has_mac(bytes: &[u8]) -> bool {
	bytes.len() % 2 == 1 && bytes[0] == 1
}

/// Decrypts the AES-encrypted raw string `encrypted_bytes` into a plain text raw string
/// using AES using prepended IV with optional PKCS7 padding and optional HMAC-SHA
fn aes_decrypt<Key: AesKey>(
	key: &Key,
	encrypted_bytes: &[u8],
	padding_mode: PaddingMode,
	enforce_mac: EnforceMac,
) -> Result<PlaintextAndIv, AesDecryptError> {
	if encrypted_bytes.len() < IV_BYTE_SIZE {
		return Err(AesDecryptError::InvalidDataSizeError);
	}

	// Split `encrypted_bytes` into the key for the ciphertext, the iv and the ciphertext itself
	let (key, iv_bytes, encrypted_bytes) =
		if let Some(ciphertext_with_auth) = CiphertextWithAuthentication::parse(encrypted_bytes)? {
			let subkeys = key.derive_subkeys();
			if !ciphertext_with_auth.matches(&subkeys) {
				return Err(AesDecryptError::HmacError);
			}

			(
				subkeys.c_key,
				ciphertext_with_auth.iv,
				ciphertext_with_auth.ciphertext,
			)
		} else if enforce_mac == EnforceMac::EnforceMac {
			return Err(AesDecryptError::HmacError);
		} else {
			// Separate and check both the initialisation vector
			let (iv_bytes, cipher_text) = encrypted_bytes.split_at(IV_BYTE_SIZE);
			(key.clone(), iv_bytes, cipher_text)
		};

	// Return early if there is nothing to decrypt
	if encrypted_bytes.is_empty() {
		return Ok(PlaintextAndIv {
			data: vec![],
			iv: iv_bytes.try_into().expect("iv is correct size"),
		});
	}

	let mut decryptor =
		cbc::Decryptor::<Key::CbcKeyType>::new_from_slices(key.get_bytes(), iv_bytes).unwrap();
	let plaintext_data = match padding_mode {
		// Unpadded encrypted texts do not include the IV
		PaddingMode::NoPadding => decrypt_unpadded_vec_mut(&mut decryptor, encrypted_bytes),
		PaddingMode::WithPadding => decryptor.decrypt_padded_vec_mut::<Pkcs7>(encrypted_bytes)?,
	};

	Ok(PlaintextAndIv {
		data: plaintext_data,
		iv: iv_bytes.try_into().expect("iv is correct size"),
	})
}

#[cfg(test)]
mod tests {
	use base64::engine::Engine;
	use base64::prelude::BASE64_STANDARD;

	use crate::crypto::compatibility_test_utils::*;
	use crate::crypto::randomizer_facade::test_util::make_thread_rng_facade;

	use super::*;

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
			)
			.unwrap();
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
			)
			.unwrap();
			let expected_ciphertext = td.cipher_text_base64;
			assert_eq!(expected_ciphertext, encrypted_bytes);
		}
	}

	#[test]
	fn test_aes_128_encrypt_128_key() {
		for td in get_test_data().aes128_tests {
			let key: Aes128Key = td.hex_key.try_into().unwrap();
			let plain_key = td.key_to_encrypt128;
			let encrypted_bytes = aes_128_encrypt_no_padding_fixed_iv(&key, &plain_key).unwrap();
			let expected_encrypted_key = td.encrypted_key128;
			assert_eq!(expected_encrypted_key, encrypted_bytes);
		}
	}

	#[test]
	fn test_aes_128_encrypt_256_key() {
		for td in get_test_data().aes128_tests {
			let key: Aes128Key = td.hex_key.try_into().unwrap();
			let plain_key = td.key_to_encrypt256;
			let encrypted_bytes = aes_128_encrypt_no_padding_fixed_iv(&key, &plain_key).unwrap();
			let expected_encrypted_key = td.encrypted_key256;
			assert_eq!(expected_encrypted_key, encrypted_bytes);
		}
	}

	#[test]
	fn test_aes_128_decrypt_no_mac() {
		for td in get_test_data().aes128_tests {
			let key: Aes128Key = td.hex_key.try_into().unwrap();
			let ciphertext = td.cipher_text_base64;

			let decrypted_bytes = aes_128_decrypt(&key, &ciphertext).unwrap().data;

			let expected_plaintext = td.plain_text_base64;
			assert_eq!(expected_plaintext, decrypted_bytes);
		}
	}

	#[test]
	fn test_aes_128_decrypt_128_key() {
		for td in get_test_data().aes128_tests {
			let key: Aes128Key = td.hex_key.try_into().unwrap();
			let encrypted_key = td.encrypted_key128;

			let decrypted_bytes =
				aes_128_decrypt_no_padding_fixed_iv(&key, encrypted_key.as_slice()).unwrap();

			let expected_plain_key = td.key_to_encrypt128;
			assert_eq!(expected_plain_key, decrypted_bytes);
		}
	}

	#[test]
	fn test_aes_128_decrypt_256_key() {
		for td in get_test_data().aes128_tests {
			let key: Aes128Key = td.hex_key.try_into().unwrap();
			let encrypted_key = td.encrypted_key256;

			let decrypted_bytes =
				aes_128_decrypt_no_padding_fixed_iv(&key, encrypted_key.as_slice()).unwrap();

			let expected_plain_key = td.key_to_encrypt256;
			assert_eq!(expected_plain_key, decrypted_bytes);
		}
	}

	#[test]
	fn test_aes_128_decrypt_mac() {
		for td in get_test_data().aes128_mac_tests {
			let key: Aes128Key = td.hex_key.try_into().unwrap();
			let ciphertext = td.cipher_text_base64;

			let decrypted_bytes = aes_128_decrypt(&key, &ciphertext).unwrap().data;

			let expected_plaintext = td.plain_text_base64;
			assert_eq!(
				expected_plaintext,
				decrypted_bytes,
				"failed test: {}",
				BASE64_STANDARD.encode(&ciphertext)
			);
		}
	}

	#[test]
	fn test_aes_256_encrypt_with_padding_mac() {
		for td in get_test_data().aes256_tests {
			let key: Aes256Key = td.hex_key.try_into().unwrap();
			let plaintext = td.plain_text_base64;
			let iv = &Iv(td.iv_base64.try_into().unwrap());
			let encrypted_bytes =
				aes_256_encrypt(&key, &plaintext, iv, PaddingMode::WithPadding).unwrap();
			let expected_ciphertext = td.cipher_text_base64;
			assert_eq!(expected_ciphertext, encrypted_bytes);
		}
	}

	#[test]
	fn test_aes_256_decrypt_mac() {
		for td in get_test_data().aes256_tests {
			let key: Aes256Key = td.hex_key.try_into().unwrap();
			let ciphertext = td.cipher_text_base64;

			let decrypted_bytes = aes_256_decrypt(&key, &ciphertext).unwrap().data;

			let expected_plaintext = td.plain_text_base64;
			assert_eq!(
				expected_plaintext,
				decrypted_bytes,
				"failed test: {}",
				BASE64_STANDARD.encode(&ciphertext)
			);
		}
	}

	#[test]
	fn test_aes_256_encrypt_256_key() {
		for td in get_test_data().aes256_tests {
			let key: Aes256Key = td.hex_key.try_into().unwrap();
			let plain_key = td.key_to_encrypt256;
			let iv = &Iv(td.iv_base64.try_into().unwrap());
			let encrypted_bytes =
				aes_256_encrypt(&key, &plain_key, iv, PaddingMode::NoPadding).unwrap();
			let expected_encrypted_key = td.encrypted_key256;
			assert_eq!(expected_encrypted_key, encrypted_bytes);
		}
	}

	#[test]
	fn test_aes_256_decrypt_256_key() {
		for td in get_test_data().aes256_tests {
			let key: Aes256Key = td.hex_key.try_into().unwrap();
			let encrypted_key = td.encrypted_key256;

			let decrypted_bytes = aes_256_decrypt_no_padding(&key, encrypted_key.as_slice())
				.unwrap()
				.data;

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
			let encrypted_bytes =
				aes_256_encrypt(&key, &plain_key, iv, PaddingMode::NoPadding).unwrap();
			let expected_encrypted_key = td.encrypted_key128;
			assert_eq!(expected_encrypted_key, encrypted_bytes);
		}
	}

	#[test]
	fn test_aes_256_decrypt_128_key() {
		for td in get_test_data().aes256_tests {
			let key: Aes256Key = td.hex_key.try_into().unwrap();
			let encrypted_key = td.encrypted_key128;

			let decrypted_bytes = aes_256_decrypt_no_padding(&key, encrypted_key.as_slice())
				.unwrap()
				.data;

			let expected_plain_key = td.key_to_encrypt128;
			assert_eq!(expected_plain_key, decrypted_bytes);
		}
	}

	#[test]
	fn test_aes_decrypt_does_not_panic_with_invalid_data() {
		let randomizer = make_thread_rng_facade();
		let key_128 = Aes128Key::generate(&randomizer);
		let key_256 = Aes256Key::generate(&randomizer);

		let mut v = Vec::with_capacity(256);
		for length in 0..256 {
			v.resize(length, 0);
			let o = aes_decrypt(
				&key_128,
				v.as_slice(),
				PaddingMode::WithPadding,
				EnforceMac::EnforceMac,
			)
			.is_err();
			assert!(o);
			let o = aes_decrypt(
				&key_128,
				v.as_slice(),
				PaddingMode::NoPadding,
				EnforceMac::EnforceMac,
			)
			.is_err();
			assert!(o);
			let o = aes_decrypt(
				&key_256,
				v.as_slice(),
				PaddingMode::WithPadding,
				EnforceMac::EnforceMac,
			)
			.is_err();
			assert!(o);
			let o = aes_decrypt(
				&key_256,
				v.as_slice(),
				PaddingMode::NoPadding,
				EnforceMac::EnforceMac,
			)
			.is_err();
			assert!(o);
		}
	}
}
