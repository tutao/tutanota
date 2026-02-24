use blake3::{Hash, Hasher};
use std::str::from_utf8_unchecked;

const DEFAULT_OUTPUT_SIZE_BYTES: usize = 32;

// TODO use this to replace HmacError
#[derive(thiserror::Error, Debug)]
#[error("MacError")]
pub struct MacError;

/// Generates a BLAKE3 hash of `data`
pub fn blake3_hash(data: &[&[u8]]) -> [u8; DEFAULT_OUTPUT_SIZE_BYTES] {
	let mut hasher = Hasher::new();
	for d in data {
		hasher.update(d);
	}
	hasher.finalize().into()
}

/// Compute a BLAKE3 tag for the given key and data
pub fn blake3_mac(key: &[u8; 32], data: &[&[u8]]) -> [u8; DEFAULT_OUTPUT_SIZE_BYTES] {
	blake3_impl(key, data).into()
}

fn blake3_impl(key: &[u8; 32], data: &[&[u8]]) -> Hash {
	let mut mac = Hasher::new_keyed(key);
	for d in data {
		mac.update(d);
	}
	mac.finalize()
}

pub fn verify_blake3_mac(
	key: &[u8; 32],
	data: &[&[u8]],
	tag: [u8; DEFAULT_OUTPUT_SIZE_BYTES],
) -> Result<(), MacError> {
	let computed_tag = blake3_impl(key, data);
	if !computed_tag.eq(&Hash::from_bytes(tag)) {
		return Err(MacError);
	}
	Ok(())
}

/// Derive the provided number of key bytes from the IKM and the context using Blake3 in KDF mode.
pub fn blake3_kdf(input_key_material: &[&[u8]], context: &[u8], length_bytes: usize) -> Vec<u8> {
	let mut hasher: Hasher;
	// SAFETY: The Hasher interface expects a &str and does not allow for arbitrary bytes as
	// context, even though the BLAKE3 spec allows them. Since we use arbitrary bytes for context,
	// we put them in a potentially invalid UTF-8 &str. This is safe to do because the first thing
	// the implementation does is getting the &str as_bytes, i.e., the bytes are never treated as a
	// string.
	unsafe {
		let context_str = from_utf8_unchecked(context);
		hasher = Hasher::new_derive_key(context_str);
	}

	for ikm in input_key_material {
		hasher.update(ikm);
	}
	let mut reader = hasher.finalize_xof();
	let mut derived_bytes = vec![0; length_bytes];
	reader.fill(derived_bytes.as_mut());
	derived_bytes
}

#[cfg(test)]
mod tests {
	use crate::blake3::{blake3_hash, blake3_kdf, blake3_mac, verify_blake3_mac};
	use crate::compatibility_test_utils::get_compatibility_test_data;
	use rand::random;

	#[test]
	pub fn hash_is_reproducible() {
		let data = "this is our data".as_bytes();
		let more_data = "this is also some data".as_bytes();
		let digest1 = blake3_hash(&[data, more_data]);
		let digest2 = blake3_hash(&[data, more_data]);
		assert_eq!(digest1, digest2);
	}

	#[test]
	pub fn hash_depends_on_input() {
		let data = "this is our data".as_bytes();
		let more_data = "this is also some data".as_bytes();
		let different_data = "wow, so much data!".as_bytes();
		let digest1 = blake3_hash(&[data, more_data]);
		let digest2 = blake3_hash(&[different_data, more_data]);
		assert_ne!(digest1, digest2);
	}

	#[test]
	pub fn mac_round_trip() {
		let data = "this is our data".as_bytes();
		let more_data = "this is also some data".as_bytes();
		let key = &random::<[u8; 32]>();
		let tag = blake3_mac(key, &[data, more_data]);
		verify_blake3_mac(key, &[data, more_data], tag).expect("should be verified successfully");
	}

	#[test]
	pub fn mac_wrong_data() {
		let key = &random::<[u8; 32]>();
		let data = "my test data".as_bytes();
		let tag = blake3_mac(key, &[data]);
		let bad_data = "wrong data".as_bytes();
		assert!(verify_blake3_mac(key, &[bad_data], tag).is_err());
	}

	#[test]
	pub fn mac_wrong_key() {
		let key1 = &random::<[u8; 32]>();
		let key2 = &random::<[u8; 32]>();
		let data = "my test data".as_bytes();
		let tag = blake3_mac(key1, &[data]);
		assert!(verify_blake3_mac(key2, &[data], tag).is_err());
	}

	#[test]
	pub fn kdf_is_reproducible() {
		let key: &[&[u8]] = &[&random::<[u8; 32]>()];
		let mut context: [u8; 256] = [0; 256];
		for i in 0..256 {
			// use every possible byte because of the unsafe utf8 str hack :-)
			context[i] = i as u8;
		}
		let derived_bytes1 = blake3_kdf(key, context.as_slice(), 64);
		assert_eq!(derived_bytes1.len(), 64);
		let derived_bytes2 = blake3_kdf(key, context.as_slice(), 64);
		assert_eq!(derived_bytes1, derived_bytes2);
	}

	#[test]
	pub fn kdf_output_depends_on_context() {
		let key: &[&[u8]] = &[&random::<[u8; 32]>()];
		let context = "my test context".as_bytes();
		let derived_bytes1 = blake3_kdf(key, context, 32);
		let another_context = "my NEW test context".as_bytes();
		let derived_bytes2 = blake3_kdf(key, another_context, 32);
		assert_ne!(derived_bytes1, derived_bytes2)
	}

	#[test]
	pub fn kdf_depends_on_key() {
		let key: &[&[u8]] = &[&random::<[u8; 32]>()];
		let context = "my test context".as_bytes();
		let derived_bytes1 = blake3_kdf(key, context, 32);
		let another_key: &[&[u8]] = &[&random::<[u8; 32]>()];
		let derived_bytes2 = blake3_kdf(another_key, context, 32);
		assert_ne!(derived_bytes1, derived_bytes2);
	}

	#[test]
	fn compatibility_test_hash() {
		for td in get_compatibility_test_data().blake3_tests {
			let data = td.data_hex.as_slice();
			let expected_result = td.digest_hex.as_slice();
			let digest = blake3_hash(&[data]);
			assert_eq!(digest, expected_result);
		}
	}

	#[test]
	fn compatibility_test_mac() {
		for td in get_compatibility_test_data().blake3_tests {
			let key: &[u8; 32] = td.key_hex.as_slice().try_into().unwrap();
			let data = td.data_hex.as_slice();
			let expected_result = td.tag_hex.as_slice();
			let computed_tag = blake3_mac(key, &[data]);
			assert_eq!(computed_tag, expected_result);
			verify_blake3_mac(key, &[data], computed_tag).expect("should be verified successfully");
		}
	}

	#[test]
	fn compatibility_test_kdf() {
		for td in get_compatibility_test_data().blake3_tests {
			let key: &[&[u8]] = &[td.key_hex.as_slice()];
			let context = td.context_hex.as_slice();
			let expected_result = td.kdf_output_hex.as_slice();
			let derived_bytes = blake3_kdf(key, context, td.length_in_bytes);
			assert_eq!(derived_bytes, expected_result);
		}
	}
}
