use crate::aes::{self, aes_ctr_decrypt, Aes256Key, Nonce, AES_256_KEY_SIZE, NONCE_BYTE_SIZE};
use crate::blake3;
use crate::blake3::BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES;
use crate::key::GenericAesKey;
use crate::randomizer_facade::RandomizerFacade;

/// The possible errors that can occur while decrypting an AES text
#[derive(thiserror::Error, Debug, Eq, PartialEq)]
pub enum AeadDecryptError {
	#[error("InvalidVersionError")]
	InvalidVersionError,
	#[error("DecryptionError")]
	DecryptionError,
}

/// Keys to use with AEAD
///
/// Usually these will be derived from the same key with different contexts.
/// The AEAD scheme requires 256-bit keys, so that's all we allow here.
#[derive(Clone, PartialEq)]
#[cfg_attr(any(test, feature = "test_utils"), derive(Debug))]
pub struct AeadSubKeys {
	encryption_key: Aes256Key,
	authentication_key: Aes256Key,
}

impl AeadSubKeys {
	// '\u{001f}' is the unit separator
	const AEAD_GROUP_KEY_NONCE_DERIVATION: &'static str =
		concat!("GK and nonce instanceMessageKey", "\u{001f}");
	const AEAD_SESSION_KEY_DERIVATION: &'static str = concat!("SK instanceSessionKey", "\u{001f}");

	pub fn derive_from_group_key(
		group_key: &GenericAesKey,
		kdf_nonce: &[u8],
		instance_type_id: &str,
	) -> Self {
		let key_bytes = blake3::blake3_kdf(
			&[group_key.as_bytes(), kdf_nonce],
			&format!(
				"{}{}",
				Self::AEAD_GROUP_KEY_NONCE_DERIVATION,
				instance_type_id
			),
			2 * AES_256_KEY_SIZE,
		);
		Self {
			encryption_key: Aes256Key::from_bytes(&key_bytes[..AES_256_KEY_SIZE])
				.expect("kdf should derive the correct number of bytes"),
			authentication_key: Aes256Key::from_bytes(&key_bytes[AES_256_KEY_SIZE..])
				.expect("kdf should derive the correct number of bytes"),
		}
	}

	pub fn derive_from_session_key(session_key: &Aes256Key, instance_type_id: &str) -> Self {
		let key_bytes = blake3::blake3_kdf(
			&[session_key.as_bytes()],
			&format!("{}{}", Self::AEAD_SESSION_KEY_DERIVATION, instance_type_id),
			2 * AES_256_KEY_SIZE,
		);
		Self {
			encryption_key: Aes256Key::from_bytes(&key_bytes[..AES_256_KEY_SIZE])
				.expect("kdf should derive the correct number of bytes"),
			authentication_key: Aes256Key::from_bytes(&key_bytes[AES_256_KEY_SIZE..])
				.expect("kdf should derive the correct number of bytes"),
		}
	}
}

pub struct AeadFacade {
	randomizer_facade: RandomizerFacade,
}

impl AeadFacade {
	pub fn new(randomizer_facade: RandomizerFacade) -> Self {
		Self { randomizer_facade }
	}

	const PADDING_BLOCK_SIZE_BYTES: usize = 4;
	const PADDING_BYTE: u8 = 0x80;
	const PADDING_ZERO_BYTE: u8 = 0x00;

	fn pad(plaintext: &mut Vec<u8>) {
		let bytes_to_append =
			Self::PADDING_BLOCK_SIZE_BYTES - plaintext.len() % Self::PADDING_BLOCK_SIZE_BYTES;
		plaintext.push(Self::PADDING_BYTE);
		for _ in 1..bytes_to_append {
			plaintext.push(Self::PADDING_ZERO_BYTE);
		}
	}

	fn unpad(plaintext: &mut Vec<u8>) -> Result<(), AeadDecryptError> {
		let mut zero_byte_count = 0;
		loop {
			let Some(byte) = plaintext.pop() else {
				return Err(AeadDecryptError::DecryptionError);
			};
			if byte == Self::PADDING_BYTE {
				return Ok(());
			}
			if byte != Self::PADDING_ZERO_BYTE {
				return Err(AeadDecryptError::DecryptionError);
			}
			zero_byte_count += 1;
			if zero_byte_count >= Self::PADDING_BLOCK_SIZE_BYTES {
				return Err(AeadDecryptError::DecryptionError);
			}
		}
	}

	/// Encrypt with AEAD.
	pub fn encrypt(
		&self,
		sub_keys: &AeadSubKeys,
		mut plaintext: Vec<u8>,
		associated_data: &[u8],
	) -> Vec<u8> {
		Self::pad(&mut plaintext);
		self.encrypt_internal(sub_keys, &plaintext, associated_data)
	}

	/// Encrypt the plaintext with AEAD. It must already be padded.
	fn encrypt_internal(
		&self,
		sub_keys: &AeadSubKeys,
		padded_plaintext: &[u8],
		associated_data: &[u8],
	) -> Vec<u8> {
		let nonce = Nonce::generate(&self.randomizer_facade);
		let ciphertext = aes::aes_ctr_encrypt(&sub_keys.encryption_key, padded_plaintext, &nonce);
		let end_of_ciphertext: u32 = NONCE_BYTE_SIZE as u32 + ciphertext.len() as u32;
		let tag = blake3::blake3_mac(
			sub_keys.authentication_key.as_bytes(),
			&[
				&end_of_ciphertext.to_be_bytes(),
				nonce.get_bytes(),
				&ciphertext,
				associated_data,
			],
		);

		let mut tagged_ciphertext = Vec::with_capacity(
			NONCE_BYTE_SIZE + ciphertext.len() + BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES,
		);
		tagged_ciphertext.extend(nonce.get_bytes());
		tagged_ciphertext.extend(&ciphertext);
		tagged_ciphertext.extend(tag);

		tagged_ciphertext
	}

	/// Decrypt with AEAD.
	pub fn decrypt(
		&self,
		sub_keys: &AeadSubKeys,
		tagged_ciphertext: &[u8],
		associated_data: &[u8],
	) -> Result<Vec<u8>, AeadDecryptError> {
		// order: version, nonce, cipher text, tag

		let ciphertext_offset = NONCE_BYTE_SIZE;
		if tagged_ciphertext.len() < ciphertext_offset + BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES {
			return Err(AeadDecryptError::DecryptionError);
		}
		let end_of_ciphertext = tagged_ciphertext.len() - BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES;

		let nonce = &tagged_ciphertext[..ciphertext_offset];
		let ciphertext = &tagged_ciphertext[ciphertext_offset..end_of_ciphertext];
		let mut tag = [0u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES];
		tag.copy_from_slice(&tagged_ciphertext[end_of_ciphertext..]);

		blake3::verify_blake3_mac(
			sub_keys.authentication_key.as_bytes(),
			&[
				&(end_of_ciphertext as u32).to_be_bytes(),
				nonce,
				ciphertext,
				associated_data,
			],
			tag,
		)
		.map_err(|_| AeadDecryptError::DecryptionError)?;

		let nonce = Nonce::try_from_slice(nonce).expect("nonce should have correct size");
		let mut plaintext = aes_ctr_decrypt(&sub_keys.encryption_key, ciphertext, &nonce);
		Self::unpad(&mut plaintext)?;

		Ok(plaintext)
	}
}

#[cfg(test)]
mod tests {
	use super::{AeadDecryptError, AeadFacade, AeadSubKeys, BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES};
	use crate::aes::{Aes256Key, NONCE_BYTE_SIZE};
	use crate::compatibility_test_utils::get_compatibility_test_data;
	use crate::key::GenericAesKey;
	use crate::randomizer_facade::{test_util::make_thread_rng_facade, RandomizerFacade};
	use crate::test_utils::TestRng;

	fn roundtrip(
		plaintext: Vec<u8>,
		encryption_associated_data: &[u8],
		decryption_associated_data: Option<&[u8]>,
	) -> Result<Vec<u8>, AeadDecryptError> {
		let randomizer_facade = make_thread_rng_facade();
		let aead_facade = AeadFacade::new(make_thread_rng_facade());
		let input_key: [u8; 32] = randomizer_facade.generate_random_array();
		let input_key = GenericAesKey::from_bytes(&input_key).unwrap();
		let kdf_nonce: [u8; NONCE_BYTE_SIZE] = randomizer_facade.generate_random_array();
		let sub_keys = AeadSubKeys::derive_from_group_key(&input_key, &kdf_nonce, "test");
		let ciphertext = aead_facade.encrypt(&sub_keys, plaintext, encryption_associated_data);
		let decryption_associated_data =
			decryption_associated_data.unwrap_or_else(|| encryption_associated_data);
		aead_facade.decrypt(&sub_keys, &ciphertext, decryption_associated_data)
	}

	#[test]
	fn test_aead_round_trip() {
		let plaintext = b"plaintext".to_vec();
		let decrypted = roundtrip(plaintext.to_owned(), b"test", None);
		assert_eq!(plaintext, decrypted.unwrap());
	}

	#[test]
	fn test_empty_plaintext() {
		let plaintext = b"".to_vec();
		let decrypted = roundtrip(plaintext.to_owned(), b"test", None);
		assert_eq!(plaintext, decrypted.unwrap());
	}

	#[test]
	fn test_empty_associated_data() {
		let plaintext = b"plaintext".to_vec();
		let decrypted = roundtrip(plaintext.to_owned(), b"", None);
		assert_eq!(plaintext, decrypted.unwrap());
	}

	#[test]
	fn test_wrong_associated_data() {
		let plaintext = b"plaintext".to_vec();
		let decrypted = roundtrip(plaintext, b"test", Some(b"wrong"));
		assert_eq!(decrypted, Err(AeadDecryptError::DecryptionError));
	}

	#[test]
	fn test_wrong_mac() {
		let plaintext = b"plaintext".to_vec();
		let associated_data = b"test";
		let randomizer_facade = make_thread_rng_facade();
		let aead_facade = AeadFacade::new(make_thread_rng_facade());
		let input_key: [u8; 32] = randomizer_facade.generate_random_array();
		let input_key = GenericAesKey::from_bytes(&input_key).unwrap();
		let kdf_nonce: [u8; NONCE_BYTE_SIZE] = randomizer_facade.generate_random_array();
		let sub_keys = AeadSubKeys::derive_from_group_key(&input_key, &kdf_nonce, "test");
		let mut ciphertext = aead_facade.encrypt(&sub_keys, plaintext, associated_data);
		let ciphertext_len = ciphertext.len();
		*ciphertext.get_mut(ciphertext_len - 1).unwrap() += 1;
		let decrypted = aead_facade.decrypt(&sub_keys, &ciphertext, associated_data);
		assert_eq!(decrypted, Err(AeadDecryptError::DecryptionError));
	}

	fn test_encrypt(plaintext: &[u8]) -> Vec<u8> {
		let randomizer_facade = make_thread_rng_facade();
		let aead_facade = AeadFacade::new(make_thread_rng_facade());
		let input_key: [u8; 32] = randomizer_facade.generate_random_array();
		let input_key = GenericAesKey::from_bytes(&input_key).unwrap();
		let kdf_nonce: [u8; NONCE_BYTE_SIZE] = randomizer_facade.generate_random_array();
		let sub_keys = AeadSubKeys::derive_from_group_key(&input_key, &kdf_nonce, "test");
		let associated_data = b"test";
		aead_facade.encrypt(&sub_keys, plaintext.to_vec(), associated_data)
	}

	#[test]
	fn test_padding() {
		const OVERHEAD: usize = NONCE_BYTE_SIZE + BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES;
		assert_eq!(test_encrypt(b"").len(), 4 + OVERHEAD);
		assert_eq!(test_encrypt(b"1").len(), 4 + OVERHEAD);
		assert_eq!(test_encrypt(b"22").len(), 4 + OVERHEAD);
		assert_eq!(test_encrypt(b"333").len(), 4 + OVERHEAD);
		assert_eq!(test_encrypt(b"4444").len(), 8 + OVERHEAD);
		assert_eq!(test_encrypt(b"55555").len(), 8 + OVERHEAD);
	}

	fn test_decrypt(wrongly_padded_plaintext: &[u8]) -> Result<Vec<u8>, AeadDecryptError> {
		let randomizer_facade = make_thread_rng_facade();
		let aead_facade = AeadFacade::new(make_thread_rng_facade());
		let input_key: [u8; 32] = randomizer_facade.generate_random_array();
		let input_key = GenericAesKey::from_bytes(&input_key).unwrap();
		let kdf_nonce: [u8; NONCE_BYTE_SIZE] = randomizer_facade.generate_random_array();
		let sub_keys = AeadSubKeys::derive_from_group_key(&input_key, &kdf_nonce, "test");
		let associated_data = b"test";
		let ciphertext =
			aead_facade.encrypt_internal(&sub_keys, wrongly_padded_plaintext, associated_data);
		aead_facade.decrypt(&sub_keys, &ciphertext, associated_data)
	}

	#[test]
	fn test_unpadding_errors() {
		assert_eq!(test_decrypt(b""), Err(AeadDecryptError::DecryptionError));
		assert_eq!(
			test_decrypt(b"text"),
			Err(AeadDecryptError::DecryptionError)
		);
		assert_eq!(
			test_decrypt(b"text\0\0"),
			Err(AeadDecryptError::DecryptionError)
		);
		let mut plaintext = b"tex".to_vec();
		plaintext.push(AeadFacade::PADDING_BYTE);
		for _ in 0..AeadFacade::PADDING_BLOCK_SIZE_BYTES {
			plaintext.push(AeadFacade::PADDING_ZERO_BYTE);
		}
		assert_eq!(
			test_decrypt(plaintext.as_slice()),
			Err(AeadDecryptError::DecryptionError)
		);
	}

	#[test]
	fn compatibility_test_aead() {
		let test_data = get_compatibility_test_data();
		for aead_test in test_data.aead_tests {
			let randomizer = RandomizerFacade::from_core(TestRng::new(aead_test.seed));
			let aead_facade = AeadFacade::new(randomizer);
			let encryption_key: Aes256Key =
				Aes256Key::from_bytes(&aead_test.encryption_key).unwrap();
			let authentication_key: Aes256Key =
				Aes256Key::from_bytes(&aead_test.authentication_key).unwrap();
			let keys = AeadSubKeys {
				encryption_key,
				authentication_key,
			};
			let plaintext = aead_test.plaintext_base64;
			let associated_data = &aead_test.associated_data;
			let ciphertext = &aead_test.ciphertext_base64;
			let plaintext_key = aead_test.plaintext_key;
			let encrypted_key = &aead_test.encrypted_key;

			// encrypt data
			let encrypted_bytes = aead_facade.encrypt(&keys, plaintext.to_owned(), associated_data);
			assert_eq!(ciphertext, &encrypted_bytes);
			let decrypted_bytes = aead_facade
				.decrypt(&keys, &encrypted_bytes, associated_data)
				.unwrap();
			assert_eq!(&plaintext, &decrypted_bytes);

			//encrypt key
			let re_encrypted_key =
				aead_facade.encrypt(&keys, plaintext_key.to_owned(), associated_data);
			assert_eq!(encrypted_key, &re_encrypted_key);
			let decrypted_key = aead_facade
				.decrypt(&keys, &re_encrypted_key, associated_data)
				.unwrap();
			assert_eq!(&plaintext_key, &decrypted_key);
		}
	}

	mod key_derivation {
		use crate::aead_facade::AeadSubKeys;
		use crate::aes::{Aes128Key, Aes256Key};
		use crate::compatibility_test_utils::get_compatibility_test_data;
		use crate::key::GenericAesKey;
		use crate::randomizer_facade::test_util::make_thread_rng_facade;
		const GLOBAL_MAIL_TYPE_ID: &str = "tutanota/97";

		fn make_test_keys() -> ([u8; 32], Aes256Key, Aes128Key) {
			let randomizer_facade = make_thread_rng_facade();
			let kdf_nonce: [u8; 32] = randomizer_facade.generate_random_array();
			let aes_256_key =
				Aes256Key::from_bytes(&randomizer_facade.generate_random_array::<32>()).unwrap();
			let aes_128_key =
				Aes128Key::from_bytes(&randomizer_facade.generate_random_array::<16>()).unwrap();
			(kdf_nonce, aes_256_key, aes_128_key)
		}

		#[test]
		fn derive_from_group_key_and_nonce_is_reproducible() {
			let (kdf_nonce, aes_256_key, _) = make_test_keys();
			let derived_keys = AeadSubKeys::derive_from_group_key(
				&GenericAesKey::Aes256(aes_256_key.clone()),
				&kdf_nonce,
				GLOBAL_MAIL_TYPE_ID,
			);
			let derived_keys_second = AeadSubKeys::derive_from_group_key(
				&GenericAesKey::Aes256(aes_256_key),
				&kdf_nonce,
				GLOBAL_MAIL_TYPE_ID,
			);
			assert_eq!(derived_keys, derived_keys_second)
		}

		#[test]
		fn derive_from_group_key_and_nonce_is_reproducible_for_legacy_128bit_group_key() {
			let (kdf_nonce, _, aes_128_key) = make_test_keys();
			let derived_keys = AeadSubKeys::derive_from_group_key(
				&GenericAesKey::Aes128(aes_128_key.clone()),
				&kdf_nonce,
				GLOBAL_MAIL_TYPE_ID,
			);
			let derived_keys_second = AeadSubKeys::derive_from_group_key(
				&GenericAesKey::Aes128(aes_128_key),
				&kdf_nonce,
				GLOBAL_MAIL_TYPE_ID,
			);
			assert_eq!(derived_keys, derived_keys_second)
		}

		#[test]
		fn derive_from_session_key_is_reproducible() {
			let (_, session_key, _) = make_test_keys();
			let derived_keys =
				AeadSubKeys::derive_from_session_key(&session_key, GLOBAL_MAIL_TYPE_ID);
			let derived_keys_second =
				AeadSubKeys::derive_from_session_key(&session_key, GLOBAL_MAIL_TYPE_ID);
			assert_eq!(derived_keys, derived_keys_second)
		}

		#[test]
		fn domain_separation_between_key_derivations() {
			let (kdf_nonce, aes_256_key, _) = make_test_keys();
			let derived_keys_group_key = AeadSubKeys::derive_from_group_key(
				&GenericAesKey::Aes256(aes_256_key.clone()),
				&kdf_nonce,
				GLOBAL_MAIL_TYPE_ID,
			);
			let derived_keys_session_key =
				AeadSubKeys::derive_from_session_key(&aes_256_key, GLOBAL_MAIL_TYPE_ID);
			assert_ne!(
				derived_keys_group_key.encryption_key,
				derived_keys_session_key.encryption_key
			);
			assert_ne!(
				derived_keys_group_key.authentication_key,
				derived_keys_session_key.authentication_key
			)
		}

		#[test]
		fn compatibility_test_aead_key_derivation() {
			let test_data = get_compatibility_test_data();
			for test in test_data.aead_key_derivation_tests {
				let group_key_256 = GenericAesKey::from_bytes(&test.group_key256_hex).unwrap();
				let encryption_key_from_256 =
					Aes256Key::from_bytes(&test.encryption_key_from256_hex).unwrap();
				let authentication_key_from_256 =
					Aes256Key::from_bytes(&test.authentication_key_from256_hex).unwrap();

				let keys_from_256 = AeadSubKeys::derive_from_group_key(
					&group_key_256,
					&test.kdf_nonce_hex,
					&test.global_instance_type_id,
				);
				assert_eq!(
					keys_from_256,
					AeadSubKeys {
						encryption_key: encryption_key_from_256,
						authentication_key: authentication_key_from_256
					}
				);

				let group_key_128 = GenericAesKey::from_bytes(&test.group_key128_hex).unwrap();
				let encryption_key_from_128 =
					Aes256Key::from_bytes(&test.encryption_key_from128_hex).unwrap();
				let authentication_key_from_128 =
					Aes256Key::from_bytes(&test.authentication_key_from128_hex).unwrap();

				let keys_from_128 = AeadSubKeys::derive_from_group_key(
					&group_key_128,
					&test.kdf_nonce_hex,
					&test.global_instance_type_id,
				);
				assert_eq!(
					keys_from_128,
					AeadSubKeys {
						encryption_key: encryption_key_from_128,
						authentication_key: authentication_key_from_128
					}
				);

				let session_key = Aes256Key::from_bytes(&test.session_key_hex).unwrap();
				let encryption_key_from_session_key =
					Aes256Key::from_bytes(&test.encryption_key_from_session_key_hex).unwrap();
				let authentication_key_from_session_key =
					Aes256Key::from_bytes(&test.authentication_key_from_session_key_hex).unwrap();

				let keys_from_session_key = AeadSubKeys::derive_from_session_key(
					&session_key,
					&test.global_instance_type_id,
				);
				assert_eq!(
					keys_from_session_key,
					AeadSubKeys {
						encryption_key: encryption_key_from_session_key,
						authentication_key: authentication_key_from_session_key
					}
				);
			}
		}
	}
}
