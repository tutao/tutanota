use crate::crypto::key::GenericAesKey;
#[cfg(test)]
use crate::id::generated_id::GENERATED_ID_BYTES_LENGTH;
use thiserror::Error;

///
/// Serializes and deserialize a list of {@link BlobWrapper}s into the following binary format
/// element [ #blobs ] [ blobId ] [ blobHash ] [blobSize] [blob]     [ . . . ]    [ blobNId ] [ blobNHash ] [blobNSize] [blobN]
/// bytes     4          9          6           4          blobSize                 9           6            4           blobSize
///
/// Also serializes and deserialize a list of {@link NewBlobWrapper}s into the following binary format
/// element [ #blobs ] [ blobHash ] [blobSize] [blob]     [ . . . ]    [ blobNHash ] [blobNSize] [blobN]
/// bytes     4          6           4          blobSize                 6            4           blobSize
///
pub const MAX_NUMBER_OF_BLOBS_IN_BINARY: usize = 200;
#[cfg(test)]
const NUMBER_OF_BLOBS_BYTES: usize = 4;
const BLOB_HASH_BYTES: usize = 6;
const BLOB_LENGTH_BYTES: usize = 4;

/// Currently only used in test, but kept here to be used to call
/// **get multiple** from BlobService in the future.
#[cfg(test)]
const BLOB_OVERHEAD_BYTES: usize = GENERATED_ID_BYTES_LENGTH + BLOB_HASH_BYTES + BLOB_LENGTH_BYTES;

/// Currently only used in test, but kept here to be used to call
/// **get multiple** from BlobService in the future.
#[cfg(test)]
#[derive(PartialEq, Debug, Clone)]
pub struct BlobWrapper {
	blob_id: Vec<u8>,
	hash: Vec<u8>,
	data: Vec<u8>,
}

pub const NEW_BLOB_OVERHEAD_BYTES: usize = BLOB_HASH_BYTES + BLOB_LENGTH_BYTES;

#[derive(PartialEq, Debug, Clone)]
pub struct NewBlobWrapper {
	pub(crate) hash: Vec<u8>,
	pub(crate) data: Vec<u8>,
}

#[derive(PartialEq, Debug, Clone)]
pub struct KeyedNewBlobWrapper {
	pub(crate) session_key: GenericAesKey,
	pub(crate) new_blob_wrapper: NewBlobWrapper,
}

#[derive(PartialEq, Debug, Clone)]
pub struct SerializedBinaryWrapper {
	pub(crate) session_keys: Vec<GenericAesKey>,
	pub(crate) binary: Vec<u8>,
}

#[derive(Error, Debug, uniffi::Error, Eq, PartialEq, Clone)]
pub enum BinaryBlobWrapperSerializationError {
	#[error("InvalidNumberOfBlobsError: expected: {expected}, actual: {actual}")]
	InvalidNumberOfBlobsError { expected: u32, actual: u32 },
}

/// Currently only used in test, but kept here to be used to call
/// **get multiple** from BlobService in the future.
#[cfg(test)]
pub fn serialize_blobs(blobs: Vec<BlobWrapper>) -> Vec<u8> {
	let mut buffer: Vec<u8> = Vec::new();
	buffer.extend((blobs.len() as u32).to_be_bytes());
	for mut blob in blobs {
		buffer.append(&mut blob.blob_id.clone());
		buffer.append(&mut blob.hash);
		buffer.extend((blob.data.len() as u32).to_be_bytes());
		buffer.append(&mut blob.data);
	}
	buffer
}

/// Currently only used in test, but kept here to be used to call
/// **get multiple** from BlobService in the future.
#[cfg(test)]
pub fn deserialize_blobs(
	mut binary_buffer: Vec<u8>,
) -> Result<Vec<BlobWrapper>, BinaryBlobWrapperSerializationError> {
	let mut blob_wrappers: Vec<BlobWrapper> = Vec::new();

	let number_of_blobs_bytes: [u8; NUMBER_OF_BLOBS_BYTES] = binary_buffer
		.drain(0..NUMBER_OF_BLOBS_BYTES)
		.as_slice()
		.try_into()
		.unwrap();
	let number_of_blobs = u32::from_be_bytes(number_of_blobs_bytes);

	while binary_buffer.len() > BLOB_OVERHEAD_BYTES {
		if blob_wrappers.len() > number_of_blobs as usize {
			return Err(
				BinaryBlobWrapperSerializationError::InvalidNumberOfBlobsError {
					expected: number_of_blobs,
					actual: blob_wrappers.len() as u32,
				},
			);
		}

		let blob_id_bytes = binary_buffer
			.drain(0..GENERATED_ID_BYTES_LENGTH)
			.as_slice()
			.to_vec();
		let hash = binary_buffer.drain(0..BLOB_HASH_BYTES).as_slice().to_vec();
		let data_length_bytes: [u8; BLOB_LENGTH_BYTES] = binary_buffer
			.drain(0..BLOB_LENGTH_BYTES)
			.as_slice()
			.try_into()
			.unwrap();
		let data_length = u32::from_be_bytes(data_length_bytes);
		let data = binary_buffer
			.drain(0..data_length as usize)
			.as_slice()
			.to_vec();

		blob_wrappers.push(BlobWrapper {
			blob_id: blob_id_bytes,
			hash,
			data,
		});
	}
	if blob_wrappers.len() != number_of_blobs as usize {
		return Err(
			BinaryBlobWrapperSerializationError::InvalidNumberOfBlobsError {
				expected: number_of_blobs,
				actual: blob_wrappers.len() as u32,
			},
		);
	}
	Ok(blob_wrappers)
}

pub fn serialize_new_blobs(blobs: Vec<NewBlobWrapper>) -> Vec<u8> {
	let mut buffer: Vec<u8> = Vec::new();
	buffer.extend((blobs.len() as u32).to_be_bytes());
	for mut blob in blobs {
		buffer.append(&mut blob.hash);
		buffer.extend((blob.data.len() as u32).to_be_bytes());
		buffer.append(&mut blob.data);
	}
	buffer
}

#[cfg(test)]
pub fn deserialize_new_blobs(
	mut binary_buffer: Vec<u8>,
) -> Result<Vec<NewBlobWrapper>, BinaryBlobWrapperSerializationError> {
	let mut new_blob_wrappers: Vec<NewBlobWrapper> = Vec::new();

	let number_of_blobs_bytes: [u8; NUMBER_OF_BLOBS_BYTES] = binary_buffer
		.drain(0..NUMBER_OF_BLOBS_BYTES)
		.as_slice()
		.try_into()
		.unwrap();
	let number_of_blobs = u32::from_be_bytes(number_of_blobs_bytes);

	while binary_buffer.len() > NEW_BLOB_OVERHEAD_BYTES {
		if new_blob_wrappers.len() > number_of_blobs as usize {
			return Err(
				BinaryBlobWrapperSerializationError::InvalidNumberOfBlobsError {
					expected: number_of_blobs,
					actual: new_blob_wrappers.len() as u32,
				},
			);
		}
		let hash = binary_buffer.drain(0..BLOB_HASH_BYTES).as_slice().to_vec();
		let data_length_bytes: [u8; BLOB_LENGTH_BYTES] = binary_buffer
			.drain(0..BLOB_LENGTH_BYTES)
			.as_slice()
			.try_into()
			.unwrap();
		let data_length = u32::from_be_bytes(data_length_bytes);
		let data = binary_buffer
			.drain(0..data_length as usize)
			.as_slice()
			.to_vec();

		new_blob_wrappers.push(NewBlobWrapper { hash, data });
	}
	if new_blob_wrappers.len() != number_of_blobs as usize {
		return Err(
			BinaryBlobWrapperSerializationError::InvalidNumberOfBlobsError {
				expected: number_of_blobs,
				actual: new_blob_wrappers.len() as u32,
			},
		);
	}
	Ok(new_blob_wrappers)
}

///
/// Serialize new blobs in multiple binary chunks,
/// with each single binary chunk:
/// * not exceeding [max_binary_chunk_size]
/// * and not exceeding [max_number_of_blobs_in_chunk].
///
/// When uploading multiple files (e.g. attachments) to the BlobService, this functions
/// combines multiple blobs (each max [MAX_UNENCRYPTED_BLOB_SIZE_BYTES]) into
/// one or multiple serialized binary chunks.
///
pub fn serialize_new_blobs_in_binary_chunks(
	keyed_new_blob_wrappers: Vec<KeyedNewBlobWrapper>,
	max_binary_chunk_size: usize,
	max_number_of_blobs_in_chunk: usize,
) -> Vec<SerializedBinaryWrapper> {
	let mut chunks: Vec<Vec<KeyedNewBlobWrapper>> = Vec::new();
	let mut current_chunk: Vec<KeyedNewBlobWrapper> = Vec::new();
	let mut current_chunk_size = 0;
	for keyed_blob in keyed_new_blob_wrappers {
		let wrapper_size = NEW_BLOB_OVERHEAD_BYTES + keyed_blob.new_blob_wrapper.data.len();
		current_chunk_size += wrapper_size;
		if current_chunk_size <= max_binary_chunk_size
			&& current_chunk.len() < max_number_of_blobs_in_chunk
		{
			current_chunk.push(keyed_blob)
		} else {
			chunks.push(current_chunk);
			current_chunk = vec![keyed_blob];
			current_chunk_size = wrapper_size;
		}
	}
	// push remaining current chunk
	chunks.push(current_chunk);
	chunks
		.into_iter()
		.map(|chunk| {
			let session_keys = chunk.iter().map(|c| c.session_key.clone()).collect();
			let new_blob_wrappers = chunk.into_iter().map(|c| c.new_blob_wrapper).collect();
			SerializedBinaryWrapper {
				session_keys,
				binary: serialize_new_blobs(new_blob_wrappers),
			}
		})
		.collect()
}

#[cfg(test)]
mod tests {
	use crate::blobs::binary_blob_wrapper_serializer::{
		deserialize_blobs, deserialize_new_blobs, serialize_blobs, serialize_new_blobs,
		serialize_new_blobs_in_binary_chunks, BinaryBlobWrapperSerializationError, BlobWrapper,
		KeyedNewBlobWrapper, NewBlobWrapper, MAX_NUMBER_OF_BLOBS_IN_BINARY,
	};
	use crate::crypto::key::GenericAesKey;
	use crate::crypto::randomizer_facade::test_util::DeterministicRng;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::tutanota_constants::MAX_BLOB_SERVICE_BYTES;
	use crate::{crypto, GeneratedId};

	#[test]
	fn test_serialize_blobs() {
		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = BlobWrapper {
			blob_id: GeneratedId::unencoded_min_id_bytes().to_vec(),
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = BlobWrapper {
			blob_id: GeneratedId::unencoded_min_id_bytes().to_vec(),
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};

		let mut expected_binary: Vec<u8> = Vec::new();
		expected_binary.append(&mut 2u32.to_be_bytes().to_vec());
		//append first blob
		expected_binary.append(&mut first_blob_wrapper.blob_id.clone());
		expected_binary.append(&mut first_blob_wrapper.hash.clone());
		expected_binary.append(
			&mut (first_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		expected_binary.append(&mut first_blob_wrapper.data.clone());
		//append second blob
		expected_binary.append(&mut second_blob_wrapper.blob_id.clone());
		expected_binary.append(&mut second_blob_wrapper.hash.clone());
		expected_binary.append(
			&mut (second_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		expected_binary.append(&mut second_blob_wrapper.data.clone());

		assert_eq!(51, expected_binary.len());
		assert_eq!(
			expected_binary,
			serialize_blobs(vec![first_blob_wrapper, second_blob_wrapper])
		);
	}

	#[test]
	fn test_serialize_deserialize_blobs() {
		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = BlobWrapper {
			blob_id: GeneratedId::unencoded_min_id_bytes().to_vec(),
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = BlobWrapper {
			blob_id: GeneratedId::unencoded_max_id_bytes().to_vec(),
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};

		let serialized_blobs = serialize_blobs(vec![
			first_blob_wrapper.clone(),
			second_blob_wrapper.clone(),
		]);
		assert_eq!(51, serialized_blobs.len());
		let deserialized_blobs = deserialize_blobs(serialized_blobs).unwrap();
		assert_eq!(
			deserialized_blobs,
			vec![first_blob_wrapper, second_blob_wrapper]
		);
	}

	#[test]
	fn test_deserialize_blobs_with_invalid_number_of_blobs_larger() {
		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = BlobWrapper {
			blob_id: GeneratedId::unencoded_min_id_bytes().to_vec(),
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = BlobWrapper {
			blob_id: GeneratedId::unencoded_min_id_bytes().to_vec(),
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};

		let mut faulty_binary: Vec<u8> = Vec::new();
		faulty_binary.append(&mut 5u32.to_be_bytes().to_vec());
		//append first blob
		faulty_binary.append(&mut first_blob_wrapper.blob_id.clone());
		faulty_binary.append(&mut first_blob_wrapper.hash.clone());
		faulty_binary.append(
			&mut (first_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		faulty_binary.append(&mut first_blob_wrapper.data.clone());
		//append second blob
		faulty_binary.append(&mut second_blob_wrapper.blob_id.clone());
		faulty_binary.append(&mut second_blob_wrapper.hash.clone());
		faulty_binary.append(
			&mut (second_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		faulty_binary.append(&mut second_blob_wrapper.data.clone());

		let deserialized_blobs_error = deserialize_blobs(faulty_binary);
		assert_eq!(
			deserialized_blobs_error,
			Err(
				BinaryBlobWrapperSerializationError::InvalidNumberOfBlobsError {
					expected: 5,
					actual: 2
				}
			)
		);
	}

	#[test]
	fn test_deserialize_blobs_with_invalid_number_of_blobs_fewer() {
		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = BlobWrapper {
			blob_id: GeneratedId::unencoded_min_id_bytes().to_vec(),
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = BlobWrapper {
			blob_id: GeneratedId::unencoded_min_id_bytes().to_vec(),
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};

		let mut faulty_binary: Vec<u8> = Vec::new();
		faulty_binary.append(&mut 1u32.to_be_bytes().to_vec());
		//append first blob
		faulty_binary.append(&mut first_blob_wrapper.blob_id.clone());
		faulty_binary.append(&mut first_blob_wrapper.hash.clone());
		faulty_binary.append(
			&mut (first_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		faulty_binary.append(&mut first_blob_wrapper.data.clone());
		//append second blob
		faulty_binary.append(&mut second_blob_wrapper.blob_id.clone());
		faulty_binary.append(&mut second_blob_wrapper.hash.clone());
		faulty_binary.append(
			&mut (second_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		faulty_binary.append(&mut second_blob_wrapper.data.clone());

		let deserialized_blobs_error = deserialize_blobs(faulty_binary);
		assert_eq!(
			deserialized_blobs_error,
			Err(
				BinaryBlobWrapperSerializationError::InvalidNumberOfBlobsError {
					expected: 1,
					actual: 2
				}
			)
		);
	}

	#[test]
	fn test_serialize_new_blobs() {
		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = NewBlobWrapper {
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = NewBlobWrapper {
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};

		let mut expected_binary: Vec<u8> = Vec::new();
		//append first blob
		expected_binary.append(&mut 2u32.to_be_bytes().to_vec());
		expected_binary.append(&mut first_blob_wrapper.hash.clone());
		expected_binary.append(
			&mut (first_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		expected_binary.append(&mut first_blob_wrapper.data.clone());
		//append second blob
		expected_binary.append(&mut second_blob_wrapper.hash.clone());
		expected_binary.append(
			&mut (second_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		expected_binary.append(&mut second_blob_wrapper.data.clone());

		assert_eq!(33, expected_binary.len());
		assert_eq!(
			expected_binary,
			serialize_new_blobs(vec![first_blob_wrapper, second_blob_wrapper])
		);
	}

	#[test]
	fn test_serialize_deserialize_new_blobs() {
		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = NewBlobWrapper {
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = NewBlobWrapper {
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};

		let serialized_new_blobs = serialize_new_blobs(vec![
			first_blob_wrapper.clone(),
			second_blob_wrapper.clone(),
		]);
		assert_eq!(33, serialized_new_blobs.len());
		let deserialized_new_blobs = deserialize_new_blobs(serialized_new_blobs).unwrap();
		assert_eq!(
			deserialized_new_blobs,
			vec![first_blob_wrapper, second_blob_wrapper]
		);
	}

	#[test]
	fn test_deserialize_new_blobs_with_invalid_number_of_blobs_larger() {
		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = NewBlobWrapper {
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = NewBlobWrapper {
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};

		let mut faulty_binary: Vec<u8> = Vec::new();
		faulty_binary.append(&mut 5u32.to_be_bytes().to_vec());
		//append first blob
		faulty_binary.append(&mut first_blob_wrapper.hash.clone());
		faulty_binary.append(
			&mut (first_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		faulty_binary.append(&mut first_blob_wrapper.data.clone());
		//append second blob
		faulty_binary.append(&mut second_blob_wrapper.hash.clone());
		faulty_binary.append(
			&mut (second_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		faulty_binary.append(&mut second_blob_wrapper.data.clone());

		let deserialized_new_blobs_error = deserialize_new_blobs(faulty_binary);
		assert_eq!(
			deserialized_new_blobs_error,
			Err(
				BinaryBlobWrapperSerializationError::InvalidNumberOfBlobsError {
					expected: 5,
					actual: 2
				}
			)
		);
	}

	#[test]
	fn test_deserialize_new_blobs_with_invalid_number_of_blobs_fewer() {
		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = NewBlobWrapper {
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = NewBlobWrapper {
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};

		let mut faulty_binary: Vec<u8> = Vec::new();
		faulty_binary.append(&mut 1u32.to_be_bytes().to_vec());
		//append first blob
		faulty_binary.append(&mut first_blob_wrapper.hash.clone());
		faulty_binary.append(
			&mut (first_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		faulty_binary.append(&mut first_blob_wrapper.data.clone());
		//append second blob
		faulty_binary.append(&mut second_blob_wrapper.hash.clone());
		faulty_binary.append(
			&mut (second_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		faulty_binary.append(&mut second_blob_wrapper.data.clone());

		let deserialized_new_blobs_error = deserialize_new_blobs(faulty_binary);
		assert_eq!(
			deserialized_new_blobs_error,
			Err(
				BinaryBlobWrapperSerializationError::InvalidNumberOfBlobsError {
					expected: 1,
					actual: 2
				}
			)
		);
	}

	#[test]
	fn test_serialize_new_blobs_in_chunks() {
		let randomizer_facade = RandomizerFacade::from_core(DeterministicRng(20));
		let first_session_key = GenericAesKey::from_bytes(
			randomizer_facade
				.generate_random_array::<{ crypto::aes::AES_256_KEY_SIZE }>()
				.as_slice(),
		)
		.unwrap();
		let second_session_key = GenericAesKey::from_bytes(
			randomizer_facade
				.generate_random_array::<{ crypto::aes::AES_256_KEY_SIZE }>()
				.as_slice(),
		)
		.unwrap();

		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = NewBlobWrapper {
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};
		let first_keyed_blob_wrapper = KeyedNewBlobWrapper {
			session_key: first_session_key,
			new_blob_wrapper: first_blob_wrapper.clone(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = NewBlobWrapper {
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};
		let second_keyed_blob_wrapper = KeyedNewBlobWrapper {
			session_key: second_session_key,
			new_blob_wrapper: second_blob_wrapper.clone(),
		};

		let mut expected_binary1: Vec<u8> = Vec::new();
		expected_binary1.append(&mut 1u32.to_be_bytes().to_vec());
		// first blob in first chunk
		expected_binary1.append(&mut first_blob_wrapper.hash.clone());
		expected_binary1.append(
			&mut (first_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		expected_binary1.append(&mut first_blob_wrapper.data.clone());

		let mut expected_binary2: Vec<u8> = Vec::new();
		expected_binary2.append(&mut 1u32.to_be_bytes().to_vec());
		// second blob in second chunk
		expected_binary2.append(&mut second_blob_wrapper.hash.clone());
		expected_binary2.append(
			&mut (second_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		expected_binary2.append(&mut second_blob_wrapper.data.clone());

		assert_eq!(17, expected_binary1.len());
		assert_eq!(20, expected_binary2.len());
		let actual: Vec<Vec<u8>> = serialize_new_blobs_in_binary_chunks(
			vec![first_keyed_blob_wrapper, second_keyed_blob_wrapper],
			13,
			MAX_NUMBER_OF_BLOBS_IN_BINARY,
		)
		.into_iter()
		.map(|sbw| sbw.binary)
		.collect();
		assert_eq!(vec![expected_binary1, expected_binary2], actual);
	}

	#[test]
	fn test_serialize_new_blobs_in_chunks_do_not_exceed_max_number_of_blobs_in_binary() {
		let randomizer_facade = RandomizerFacade::from_core(DeterministicRng(20));
		let first_session_key = GenericAesKey::from_bytes(
			randomizer_facade
				.generate_random_array::<{ crypto::aes::AES_256_KEY_SIZE }>()
				.as_slice(),
		)
		.unwrap();
		let second_session_key = GenericAesKey::from_bytes(
			randomizer_facade
				.generate_random_array::<{ crypto::aes::AES_256_KEY_SIZE }>()
				.as_slice(),
		)
		.unwrap();

		// first blob
		let first_blob_data: [u8; 3] = [1, 2, 3];
		let first_blob_wrapper = NewBlobWrapper {
			hash: vec![1, 2, 3, 4, 5, 6],
			data: first_blob_data.to_vec(),
		};
		let first_keyed_blob_wrapper = KeyedNewBlobWrapper {
			session_key: first_session_key,
			new_blob_wrapper: first_blob_wrapper.clone(),
		};

		//second blob
		let second_blob_data: [u8; 6] = [1, 2, 3, 4, 5, 6];
		let second_blob_wrapper = NewBlobWrapper {
			hash: vec![4, 5, 6, 2, 3, 5],
			data: second_blob_data.to_vec(),
		};
		let second_keyed_blob_wrapper = KeyedNewBlobWrapper {
			session_key: second_session_key,
			new_blob_wrapper: second_blob_wrapper.clone(),
		};

		let mut expected_binary1: Vec<u8> = Vec::new();
		expected_binary1.append(&mut 1u32.to_be_bytes().to_vec());
		// first blob in first chunk
		expected_binary1.append(&mut first_blob_wrapper.hash.clone());
		expected_binary1.append(
			&mut (first_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		expected_binary1.append(&mut first_blob_wrapper.data.clone());

		let mut expected_binary2: Vec<u8> = Vec::new();
		expected_binary2.append(&mut 1u32.to_be_bytes().to_vec());
		// second blob in second chunk
		expected_binary2.append(&mut second_blob_wrapper.hash.clone());
		expected_binary2.append(
			&mut (second_blob_wrapper.data.len() as u32)
				.to_be_bytes()
				.to_vec(),
		);
		expected_binary2.append(&mut second_blob_wrapper.data.clone());

		assert_eq!(17, expected_binary1.len());
		assert_eq!(20, expected_binary2.len());
		let actual: Vec<Vec<u8>> = serialize_new_blobs_in_binary_chunks(
			vec![first_keyed_blob_wrapper, second_keyed_blob_wrapper],
			MAX_BLOB_SERVICE_BYTES,
			1,
		)
		.into_iter()
		.map(|sbw| sbw.binary)
		.collect();
		assert_eq!(vec![expected_binary1, expected_binary2], actual);
	}
}
