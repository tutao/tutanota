use hmac::Mac;
use sha2::Sha256;

/// Size of HMAC authentication added to the ciphertext
pub const HMAC_SHA256_SIZE: usize = 32;

#[derive(thiserror::Error, Debug)]
#[error("HmacError")]
pub struct HmacError;

#[must_use]
pub fn hmac_sha256(key: &[u8], data: &[u8]) -> [u8; HMAC_SHA256_SIZE] {
	let mut hmac = hmac::Hmac::<Sha256>::new_from_slice(key).unwrap();
	hmac.update(data);
	hmac.finalize().into_bytes().into()
}

pub fn verify_hmac_sha256(
	key: &[u8],
	data: &[u8],
	tag: [u8; HMAC_SHA256_SIZE],
) -> Result<(), HmacError> {
	if tag != hmac_sha256(key, data) {
		Err(HmacError)
	} else {
		Ok(())
	}
}

#[cfg(test)]
mod tests {
	use crate::crypto::compatibility_test_utils::get_compatibility_test_data;
	use crate::crypto::hmac::hmac_sha256;
	use crate::crypto::hmac::{verify_hmac_sha256, HMAC_SHA256_SIZE};

	#[test]
	fn compatibility_test() {
		for td in get_compatibility_test_data().hmac_sha256_tests {
			let key = td.key_hex;
			let data = td.data_hex;
			let tag: [u8; HMAC_SHA256_SIZE] = td.hmac_sha256_tag_hex.as_slice().try_into().unwrap();
			let result = hmac_sha256(&key, &data);
			assert_eq!(tag, result);
			verify_hmac_sha256(&key, &data, tag).unwrap();
		}
	}
}
