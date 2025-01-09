use hmac::Mac;
use sha2::Sha256;

/// Size of HMAC authentication added to the ciphertext
pub const MAC_SIZE: usize = 32;

#[derive(thiserror::Error, Debug)]
#[error("HmacError")]
pub struct HmacError;

#[must_use]
pub fn hmac_sha256(key: &[u8], data: &[u8]) -> [u8; MAC_SIZE] {
	let mut hmac = hmac::Hmac::<Sha256>::new_from_slice(key).unwrap();
	hmac.update(data);
	hmac.finalize().into_bytes().into()
}

pub fn verify_hmac_sha256(key: &[u8], data: &[u8], tag: [u8; MAC_SIZE]) -> Result<(), HmacError> {
	if tag != hmac_sha256(key, data) {
		Err(HmacError)
	} else {
		Ok(())
	}
}

#[cfg(test)]
mod tests {
	use crate::crypto::compatibility_test_utils::get_compatibility_test_data;
	use crate::crypto::hmac::verify_hmac_sha256;
	use crate::crypto::hmac::{hmac_sha256, MAC_SIZE};

	#[test]
	fn compatibility_test() {
		for td in get_compatibility_test_data().hmac_sha256_tests {
			let result = hmac_sha256(&td.key_hex, &td.data_hex);
			assert_eq!(td.hmac_sha256_tag_hex, result);
			let tag: [u8; MAC_SIZE] = td.hmac_sha256_tag_hex.as_slice().try_into().unwrap();
			verify_hmac_sha256(&td.key_hex, &td.data_hex, tag).unwrap();
		}
	}
}
