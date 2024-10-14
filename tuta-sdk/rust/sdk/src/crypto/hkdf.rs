/// Derives a key of a defined length from `salt`, `input_key_material` and `info`.
#[must_use]
pub fn hkdf(salt: &[u8], input_key_material: &[u8], info: &[u8], length_bytes: usize) -> Vec<u8> {
	let generator = hkdf::Hkdf::<sha2::Sha256>::new(Some(salt), input_key_material);
	let mut output_buffer = vec![0u8; length_bytes];
	generator.expand(info, &mut output_buffer).unwrap();
	output_buffer
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::compatibility_test_utils::*;

	#[test]
	fn test_hkdf() {
		for test_data in get_test_data().hkdf_tests {
			let result = hkdf(
				&test_data.salt_hex,
				&test_data.input_key_material_hex,
				&test_data.info_hex,
				test_data.length_in_bytes,
			);
			assert_eq!(test_data.hkdf_hex, result);
		}
	}
}
