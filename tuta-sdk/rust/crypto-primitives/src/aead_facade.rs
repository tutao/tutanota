use crate::aes::{self, aes_ctr_decrypt, Aes256Key, Nonce, AES_256_KEY_SIZE, NONCE_BYTE_SIZE};
use crate::blake3;
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

struct AeadSubKeys {
	encryption_key: Aes256Key,
	authentication_key: Aes256Key,
}

impl AeadSubKeys {
	fn derive(input_key: &[u8], kdf_nonce: &[u8], instance_type_id: &str) -> Self {
		const UNIT_SEPARATOR: char = '\u{001f}';
		let key_bytes = blake3::blake3_kdf(
			&[input_key, kdf_nonce],
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

struct AeadFacade {
	randomizer_facade: RandomizerFacade,
}

impl AeadFacade {
	fn new(randomizer_facade: RandomizerFacade) -> Self {
		Self { randomizer_facade }
	}

	fn encrypt(&self, sub_keys: &AeadSubKeys, plaintext: &[u8], associated_data: &[u8]) -> Vec<u8> {
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

	fn decrypt(
		&self,
		sub_keys: &AeadSubKeys,
		tagged_ciphertext: &[u8],
		associated_data: &[u8],
	) -> Result<Vec<u8>, AeadDecryptError> {
		let version = &tagged_ciphertext[..1];
		if version != [AEAD_VERSION] {
			return Err(AeadDecryptError::InvalidVersionError);
		}
		// order: version, nonce, cipher text, tag
		if tagged_ciphertext.len() < 1 + NONCE_BYTE_SIZE + OUT_LEN {
			return Err(AeadDecryptError::DecryptionError);
		}

		let nonce_offset = 1;
		let ciphertext_offset = nonce_offset + NONCE_BYTE_SIZE;
		let end_of_ciphertext = tagged_ciphertext.len() - OUT_LEN;

		let nonce = &tagged_ciphertext[nonce_offset..ciphertext_offset];
		let ciphertext = &tagged_ciphertext[ciphertext_offset..end_of_ciphertext];
		let tag = &tagged_ciphertext[end_of_ciphertext..];
		let mut tag_array = [0u8; OUT_LEN];
		tag_array.copy_from_slice(tag);

		blake3::verify_blake3_mac(
			sub_keys.authentication_key.as_bytes(),
			&[
				&(end_of_ciphertext as u32).to_be_bytes(),
				&[AEAD_VERSION],
				nonce,
				&ciphertext,
				associated_data,
			],
			tag_array,
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
	use crate::aes::NONCE_BYTE_SIZE;
	use crate::randomizer_facade::test_util::make_thread_rng_facade;

	#[test]
	fn test_aead_round_trip() {
		let randomizer_facade = make_thread_rng_facade();
		let aead_facade = AeadFacade::new(make_thread_rng_facade());
		let input_key: [u8; 32] = randomizer_facade.generate_random_array();
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
}
