use crate::crypto::aes::Aes256Key;
use argon2::{Algorithm, Argon2, Params, Version};
use zeroize::Zeroizing;

const ARGON2ID_ITERATIONS: u32 = 4;
const ARGON2ID_MEMORY_IN_KIB: u32 = 32 * 1024;
const ARGON2ID_PARALLELISM: u32 = 1;
const ARGON2ID_KEY_LENGTH: usize = 32;

/// Create a 256-bit symmetric key from the given passphrase.
/// `pass` The passphrase to use for key generation as utf8 string.
/// `salt` 16 bytes of random data
/// returns resolved with the key
#[must_use]
pub fn generate_key_from_passphrase(password: &str, salt: [u8; 16]) -> Aes256Key {
	let params = Params::new(
		ARGON2ID_MEMORY_IN_KIB,
		ARGON2ID_ITERATIONS,
		ARGON2ID_PARALLELISM,
		Some(ARGON2ID_KEY_LENGTH),
	)
	.unwrap();
	let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
	let mut output = Zeroizing::new([0u8; ARGON2ID_KEY_LENGTH]);
	argon2
		.hash_password_into(password.as_bytes(), salt.as_ref(), output.as_mut())
		.unwrap();
	Aes256Key::from_bytes(output.as_ref()).unwrap()
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::compatibility_test_utils::get_test_data;

	#[test]
	fn test_argon2() {
		for test_data in get_test_data().argon2id_tests {
			let key = generate_key_from_passphrase(
				&test_data.password,
				test_data.salt_hex.as_slice().try_into().unwrap(),
			);
			assert_eq!(test_data.key_hex.as_slice(), key.as_bytes());
		}
	}
}
