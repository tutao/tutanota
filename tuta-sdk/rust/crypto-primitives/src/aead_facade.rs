use crate::aes::{self, aes_ctr_decrypt, Aes256Key, Nonce, AES_256_KEY_SIZE, NONCE_BYTE_SIZE};
use crate::blake3;
use crate::key::GenericAesKey;
use crate::randomizer_facade::RandomizerFacade;
use ::blake3::OUT_LEN;

/// The possible errors that can occur while decrypting an AES text
#[derive(thiserror::Error, Debug)]
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
#[derive(Clone)]
#[cfg_attr(any(test, feature = "test_utils"), derive(Debug))]
pub struct AeadSubKeys {
	encryption_key: Aes256Key,
	authentication_key: Aes256Key,
}

impl AeadSubKeys {
	pub fn derive(input_key: &GenericAesKey, kdf_nonce: &[u8], instance_type_id: &str) -> Self {
		const UNIT_SEPARATOR: char = '\u{001f}';
		let key_bytes = blake3::blake3_kdf(
			&[input_key.as_bytes(), kdf_nonce],
			&format!("GK and nonce instanceMessageKey{UNIT_SEPARATOR}{instance_type_id}"),
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

const AEAD_VERSION: u8 = 2;

pub struct AeadFacade {
	randomizer_facade: RandomizerFacade,
}

impl AeadFacade {
	pub fn new(randomizer_facade: RandomizerFacade) -> Self {
		Self { randomizer_facade }
	}

	pub fn encrypt(
		&self,
		sub_keys: &AeadSubKeys,
		plaintext: &[u8],
		associated_data: &[u8],
	) -> Vec<u8> {
		let nonce = Nonce::generate(&self.randomizer_facade);
		let ciphertext = aes::aes_ctr_encrypt(&sub_keys.encryption_key, plaintext, &nonce);
		let end_of_ciphertext: u32 = 1 + NONCE_BYTE_SIZE as u32 + ciphertext.len() as u32;
		let tag = blake3::blake3_mac(
			sub_keys.authentication_key.as_bytes(),
			&[
				&end_of_ciphertext.to_be_bytes(),
				&[AEAD_VERSION],
				nonce.get_bytes(),
				&ciphertext,
				associated_data,
			],
		);

		let mut tagged_ciphertext = vec![AEAD_VERSION];
		tagged_ciphertext.extend(nonce.get_bytes());
		tagged_ciphertext.extend(&ciphertext);
		tagged_ciphertext.extend(tag);

		tagged_ciphertext
	}

	pub fn decrypt(
		&self,
		sub_keys: &AeadSubKeys,
		tagged_ciphertext: &[u8],
		associated_data: &[u8],
	) -> Result<Vec<u8>, AeadDecryptError> {
		// order: version, nonce, cipher text, tag

		let nonce_offset = 1;
		let ciphertext_offset = nonce_offset + NONCE_BYTE_SIZE;
		if tagged_ciphertext.len() < ciphertext_offset + OUT_LEN {
			return Err(AeadDecryptError::DecryptionError);
		}
		let end_of_ciphertext = tagged_ciphertext.len() - OUT_LEN;

		let version = &tagged_ciphertext[..nonce_offset];
		if version != [AEAD_VERSION] {
			return Err(AeadDecryptError::InvalidVersionError);
		}
		let nonce = &tagged_ciphertext[nonce_offset..ciphertext_offset];
		let ciphertext = &tagged_ciphertext[ciphertext_offset..end_of_ciphertext];
		let mut tag = [0u8; OUT_LEN];
		tag.copy_from_slice(&tagged_ciphertext[end_of_ciphertext..]);

		blake3::verify_blake3_mac(
			sub_keys.authentication_key.as_bytes(),
			&[
				&(end_of_ciphertext as u32).to_be_bytes(),
				&[AEAD_VERSION],
				nonce,
				ciphertext,
				associated_data,
			],
			tag,
		)
		.map_err(|_| AeadDecryptError::DecryptionError)?;

		let nonce = Nonce::try_from_slice(nonce).expect("nonce should have correct size");
		let plaintext = aes_ctr_decrypt(&sub_keys.encryption_key, ciphertext, &nonce);

		Ok(plaintext)
	}
}

#[cfg(test)]
mod tests {
	use crate::aead_facade::{AeadFacade, AeadSubKeys};
	use crate::aes::{Aes256Key, NONCE_BYTE_SIZE};
	use crate::compatibility_test_utils::get_compatibility_test_data;
	use crate::key::GenericAesKey;
	use crate::randomizer_facade::{test_util::make_thread_rng_facade, RandomizerFacade};
	use crate::test_utils::TestRng;

	#[test]
	fn test_aead_round_trip() {
		let randomizer_facade = make_thread_rng_facade();
		let aead_facade = AeadFacade::new(make_thread_rng_facade());
		let input_key: [u8; 32] = randomizer_facade.generate_random_array();
		let input_key = GenericAesKey::from_bytes(&input_key).unwrap();
		let kdf_nonce: [u8; NONCE_BYTE_SIZE] = randomizer_facade.generate_random_array();
		let sub_keys = AeadSubKeys::derive(&input_key, &kdf_nonce, "test");
		let associated_data = b"test";
		let plaintext = b"plaintext";
		let ciphertext = aead_facade.encrypt(&sub_keys, plaintext, associated_data);
		let decrypted = aead_facade
			.decrypt(&sub_keys, &ciphertext, associated_data)
			.unwrap();
		assert_eq!(plaintext, decrypted.as_slice());
	}

	#[test]
	fn compatibility_test() {
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
			let plaintext = &aead_test.plain_text_base64;
			let associated_data = &aead_test.associated_data;
			let ciphertext = &aead_test.cipher_text_base64;
			let plaintext_key = &aead_test.plaintext_key;
			let encrypted_key = &aead_test.encrypted_key;

			// encrypt data
			let encrypted_bytes = aead_facade.encrypt(&keys, plaintext, associated_data);
			assert_eq!(ciphertext, &encrypted_bytes);
			let decrypted_bytes = aead_facade
				.decrypt(&keys, &encrypted_bytes, associated_data)
				.unwrap();
			assert_eq!(plaintext, &decrypted_bytes);

			//encrypt key
			let re_encrypted_key = aead_facade.encrypt(&keys, plaintext_key, associated_data);
			assert_eq!(encrypted_key, &re_encrypted_key);
			let decrypted_key = aead_facade
				.decrypt(&keys, &re_encrypted_key, associated_data)
				.unwrap();
			assert_eq!(plaintext_key, &decrypted_key);
		}
	}
}
