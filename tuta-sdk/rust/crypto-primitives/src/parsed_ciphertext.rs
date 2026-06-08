use crate::aes::INITIALIZATION_VECTOR_BYTE_SIZE;
use crate::blake3::BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES;
use std::ops::Range;

// Ciphertexts come in many flavors, containing potentially many elements. Not all elements will be present in every
// flavor, but they are always laid out in the same order. The following diagram illustrates the general format:
//
// |---------------------------------------------------------|
// | V GKVL GKV |           IV            |     CT     | MAC |
// |            |                         |------------|     |
// |            |                         | ciphertext |     |
// |            |--------------------------------------|     |
// |            | initialization vector and ciphertext |     |
// |            |--------------------------------------------|
// |            |             tagged ciphertext              |
// |---------------------------------------------------------|
// |                  versioned ciphertext                   |
// |---------------------------------------------------------|
//
// V: cipher version
// GKVL: group key version length
// GKV: group key version
// IV: initialization vector
// CT: ciphertext
// MAC: message authentication code

#[derive(thiserror::Error, Debug, Eq, PartialEq)]
pub enum SymmetricCipherVersionError {
	#[error("UnknownCipherVersion")]
	UnknownCipherVersion,
}

#[derive(Debug, Eq, PartialEq, Copy, Clone)]
pub enum AesCipherVersion {
	UnusedReservedUnauthenticated,
	AesCbcThenHmac,
}

#[derive(Debug, Eq, PartialEq, Copy, Clone)]
pub enum AeadCipherVersion {
	AeadWithGroupKey,
	AeadWithSessionKey,
}

#[derive(Debug, Eq, PartialEq, Copy, Clone)]
pub enum SymmetricCipherVersion {
	UnusedReservedUnauthenticated,
	AesCbcThenHmac,
	AeadWithGroupKey,
	AeadWithSessionKey,
}

impl SymmetricCipherVersion {
	pub fn version_byte(self) -> u8 {
		match self {
			Self::UnusedReservedUnauthenticated => 0,
			Self::AesCbcThenHmac => 1,
			Self::AeadWithGroupKey => 2,
			Self::AeadWithSessionKey => 3,
		}
	}

	pub fn try_from(version_byte: u8) -> Result<Self, SymmetricCipherVersionError> {
		match version_byte {
			0 => Ok(Self::UnusedReservedUnauthenticated),
			1 => Ok(Self::AesCbcThenHmac),
			2 => Ok(Self::AeadWithGroupKey),
			3 => Ok(Self::AeadWithSessionKey),
			_ => Err(SymmetricCipherVersionError::UnknownCipherVersion),
		}
	}
}

#[derive(thiserror::Error, Debug, PartialEq, Eq)]
pub enum CiphertextParserError {
	#[error("UnknownCipherVersion")]
	UnknownCipherVersion,
	#[error("AeadWithFixedInitializationVector")]
	AeadWithFixedInitializationVector,
	#[error("NotEnoughBytesForGroupKeyVersionLength")]
	NotEnoughBytesForGroupKeyVersionLength,
	#[error("NotEnoughBytesForGroupKeyVersion")]
	NotEnoughBytesForGroupKeyVersion,
	#[error("NotEnoughBytesForInitializationVector")]
	NotEnoughBytesForInitializationVector,
	#[error("NotEnoughBytesForMacTag")]
	NotEnoughBytesForMacTag,
	#[error("UnsupportedGroupKeyVersionLength")]
	UnsupportedGroupKeyVersionLength,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum InitializationVector<'a> {
	Fixed,
	Random {
		initialization_vector: &'a [u8; INITIALIZATION_VECTOR_BYTE_SIZE],
	},
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default)]
pub enum InitializationVectorVariant {
	Fixed,
	#[default]
	Random,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
enum InitializationVectorVariantWithStart {
	Fixed,
	Random { initialization_vector_start: usize },
}

#[derive(Debug, Clone, Eq)]
pub struct ParsedCiphertextUnusedReservedUnauthenticated {
	versioned_ciphertext: Vec<u8>,
	initialization_vector_variant_with_start: InitializationVectorVariantWithStart,
	ciphertext: Range<usize>,
}

impl PartialEq for ParsedCiphertextUnusedReservedUnauthenticated {
	fn eq(&self, other: &Self) -> bool {
		self.initialization_vector() == other.initialization_vector()
			&& self.ciphertext() == other.ciphertext()
	}
}

impl ParsedCiphertextUnusedReservedUnauthenticated {
	pub fn initialization_vector(&self) -> InitializationVector {
		match self.initialization_vector_variant_with_start {
			InitializationVectorVariantWithStart::Fixed => InitializationVector::Fixed,
			InitializationVectorVariantWithStart::Random {
				initialization_vector_start,
			} => InitializationVector::Random {
				initialization_vector: <&[u8; 16]>::try_from(
					&self.versioned_ciphertext[initialization_vector_start
						..initialization_vector_start + INITIALIZATION_VECTOR_BYTE_SIZE],
				)
				.expect("There should be INITIALIZATION_VECTOR_BYTE_SIZE many bytes."),
			},
		}
	}

	pub fn ciphertext(&self) -> &[u8] {
		&self.versioned_ciphertext[self.ciphertext.clone()]
	}
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedCiphertextAesCbcThenHmac {
	versioned_ciphertext: Vec<u8>,
	initialization_vector_variant_with_start: InitializationVectorVariantWithStart,
	ciphertext: Range<usize>,
	mac_tag_start: usize,
}

impl ParsedCiphertextAesCbcThenHmac {
	pub fn initialization_vector(&self) -> InitializationVector {
		match self.initialization_vector_variant_with_start {
			InitializationVectorVariantWithStart::Fixed => InitializationVector::Fixed,
			InitializationVectorVariantWithStart::Random {
				initialization_vector_start,
			} => InitializationVector::Random {
				initialization_vector: self.versioned_ciphertext[initialization_vector_start
					..initialization_vector_start + INITIALIZATION_VECTOR_BYTE_SIZE]
					.try_into()
					.expect("There should be INITIALIZATION_VECTOR_BYTE_SIZE many bytes."),
			},
		}
	}

	pub fn ciphertext(&self) -> &[u8] {
		&self.versioned_ciphertext[self.ciphertext.clone()]
	}

	pub fn mac_tag(&self) -> &[u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES] {
		self.versioned_ciphertext
			[self.mac_tag_start..self.mac_tag_start + BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES]
			.try_into()
			.expect("There should be BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES many bytes.")
	}
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedCiphertextAeadWithGroupKey {
	versioned_ciphertext: Vec<u8>,
	group_key_version: u64,
	initialization_vector_start: usize,
	ciphertext: Range<usize>,
	mac_tag_start: usize,
}

impl ParsedCiphertextAeadWithGroupKey {
	pub fn group_key_version(&self) -> u64 {
		self.group_key_version
	}

	pub fn initialization_vector(&self) -> &[u8; INITIALIZATION_VECTOR_BYTE_SIZE] {
		self.versioned_ciphertext[self.initialization_vector_start
			..self.initialization_vector_start + INITIALIZATION_VECTOR_BYTE_SIZE]
			.try_into()
			.expect("There should be INITIALIZATION_VECTOR_BYTE_SIZE many bytes.")
	}

	pub fn initialization_vector_and_ciphertext(&self) -> &[u8] {
		&self.versioned_ciphertext[self.initialization_vector_start..self.ciphertext.end]
	}

	pub fn ciphertext(&self) -> &[u8] {
		&self.versioned_ciphertext[self.ciphertext.clone()]
	}

	pub fn mac_tag(&self) -> &[u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES] {
		self.versioned_ciphertext
			[self.mac_tag_start..self.mac_tag_start + BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES]
			.try_into()
			.expect("There should be BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES many bytes.")
	}
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ParsedCiphertextAeadWithSessionKey {
	versioned_ciphertext: Vec<u8>,
	initialization_vector_start: usize,
	ciphertext: Range<usize>,
	mac_tag_start: usize,
}

impl ParsedCiphertextAeadWithSessionKey {
	pub fn initialization_vector(&self) -> &[u8; INITIALIZATION_VECTOR_BYTE_SIZE] {
		self.versioned_ciphertext[self.initialization_vector_start
			..self.initialization_vector_start + INITIALIZATION_VECTOR_BYTE_SIZE]
			.try_into()
			.expect("There should be INITIALIZATION_VECTOR_BYTE_SIZE many bytes.")
	}

	pub fn initialization_vector_and_ciphertext(&self) -> &[u8] {
		&self.versioned_ciphertext[self.initialization_vector_start..self.ciphertext.end]
	}

	pub fn ciphertext(&self) -> &[u8] {
		&self.versioned_ciphertext[self.ciphertext.clone()]
	}

	pub fn mac_tag(&self) -> &[u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES] {
		self.versioned_ciphertext
			[self.mac_tag_start..self.mac_tag_start + BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES]
			.try_into()
			.expect("There should be BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES many bytes.")
	}
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParsedCiphertextAesCbc {
	UnusedReservedUnauthenticated(ParsedCiphertextUnusedReservedUnauthenticated),
	AesCbcThenHmac(ParsedCiphertextAesCbcThenHmac),
}

impl ParsedCiphertextAesCbc {
	pub fn initialization_vector(&self) -> InitializationVector {
		match self {
			Self::UnusedReservedUnauthenticated(parsed_ciphertext) => {
				parsed_ciphertext.initialization_vector()
			},
			Self::AesCbcThenHmac(parsed_ciphertext) => parsed_ciphertext.initialization_vector(),
		}
	}

	pub fn ciphertext(&self) -> &[u8] {
		match self {
			Self::UnusedReservedUnauthenticated(parsed_ciphertext) => {
				parsed_ciphertext.ciphertext()
			},
			Self::AesCbcThenHmac(parsed_ciphertext) => parsed_ciphertext.ciphertext(),
		}
	}

	pub fn cipher_version(&self) -> AesCipherVersion {
		match self {
			Self::UnusedReservedUnauthenticated(..) => {
				AesCipherVersion::UnusedReservedUnauthenticated
			},
			Self::AesCbcThenHmac(..) => AesCipherVersion::AesCbcThenHmac,
		}
	}
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParsedCiphertextAead {
	AeadWithGroupKey(ParsedCiphertextAeadWithGroupKey),
	AeadWithSessionKey(ParsedCiphertextAeadWithSessionKey),
}

impl ParsedCiphertextAead {
	pub fn initialization_vector(&self) -> &[u8; INITIALIZATION_VECTOR_BYTE_SIZE] {
		match self {
			Self::AeadWithGroupKey(parsed_ciphertext) => parsed_ciphertext.initialization_vector(),
			Self::AeadWithSessionKey(parsed_ciphertext) => {
				parsed_ciphertext.initialization_vector()
			},
		}
	}

	pub fn initialization_vector_and_ciphertext(&self) -> &[u8] {
		match self {
			Self::AeadWithGroupKey(parsed_ciphertext) => {
				parsed_ciphertext.initialization_vector_and_ciphertext()
			},
			Self::AeadWithSessionKey(parsed_ciphertext) => {
				parsed_ciphertext.initialization_vector_and_ciphertext()
			},
		}
	}

	pub fn ciphertext(&self) -> &[u8] {
		match self {
			Self::AeadWithGroupKey(parsed_ciphertext) => parsed_ciphertext.ciphertext(),
			Self::AeadWithSessionKey(parsed_ciphertext) => parsed_ciphertext.ciphertext(),
		}
	}

	pub fn mac_tag(&self) -> &[u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES] {
		match self {
			Self::AeadWithGroupKey(parsed_ciphertext) => parsed_ciphertext.mac_tag(),
			Self::AeadWithSessionKey(parsed_ciphertext) => parsed_ciphertext.mac_tag(),
		}
	}

	pub fn cipher_version(&self) -> AeadCipherVersion {
		match self {
			Self::AeadWithGroupKey(..) => AeadCipherVersion::AeadWithGroupKey,
			Self::AeadWithSessionKey(..) => AeadCipherVersion::AeadWithSessionKey,
		}
	}
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ParsedCiphertext {
	UnusedReservedUnauthenticated(ParsedCiphertextUnusedReservedUnauthenticated),
	AesCbcThenHmac(ParsedCiphertextAesCbcThenHmac),
	AeadWithGroupKey(ParsedCiphertextAeadWithGroupKey),
	AeadWithSessionKey(ParsedCiphertextAeadWithSessionKey),
}

impl ParsedCiphertext {
	pub fn parse_versioned_ciphertext(
		versioned_ciphertext: Vec<u8>,
		initialization_vector_variant: InitializationVectorVariant,
	) -> Result<ParsedCiphertext, CiphertextParserError> {
		let versioned_ciphertext_len = versioned_ciphertext.len();
		let mut ciphertext = 0..versioned_ciphertext_len;
		if versioned_ciphertext_len % 2 == 0 {
			return Ok(ParsedCiphertext::UnusedReservedUnauthenticated(
				Self::parse_versioned_cipher_text_unused_reserved_unauthenticated(
					versioned_ciphertext,
					ciphertext,
					initialization_vector_variant,
				)?,
			));
		}

		let version_byte = *versioned_ciphertext
			.get(ciphertext.start)
			.expect("The length is odd, so there should be a byte.");
		ciphertext.start += 1;
		let cipher_version = SymmetricCipherVersion::try_from(version_byte)
			.map_err(|_| CiphertextParserError::UnknownCipherVersion)?;

		if cipher_version == SymmetricCipherVersion::UnusedReservedUnauthenticated {
			return Ok(ParsedCiphertext::UnusedReservedUnauthenticated(
				Self::parse_versioned_cipher_text_unused_reserved_unauthenticated(
					versioned_ciphertext,
					ciphertext,
					initialization_vector_variant,
				)?,
			));
		}

		let group_key_version = match cipher_version {
			SymmetricCipherVersion::AeadWithGroupKey => Some(Self::extract_group_key_version(
				&versioned_ciphertext,
				&mut ciphertext,
			)?),
			_ => None,
		};

		let mac_tag_start = Self::extract_mac_tag(&mut ciphertext)?;

		let initialization_vector_variant_with_start = match initialization_vector_variant {
			InitializationVectorVariant::Fixed => InitializationVectorVariantWithStart::Fixed,
			InitializationVectorVariant::Random => InitializationVectorVariantWithStart::Random {
				initialization_vector_start: Self::extract_initialization_vector(&mut ciphertext)?,
			},
		};

		match cipher_version {
			SymmetricCipherVersion::AesCbcThenHmac => Ok(ParsedCiphertext::AesCbcThenHmac(
				ParsedCiphertextAesCbcThenHmac {
					versioned_ciphertext,
					initialization_vector_variant_with_start,
					ciphertext,
					mac_tag_start,
				},
			)),
			SymmetricCipherVersion::AeadWithGroupKey => Ok(ParsedCiphertext::AeadWithGroupKey(
				ParsedCiphertextAeadWithGroupKey {
					versioned_ciphertext,
					group_key_version: group_key_version
						.expect("There should be a group key version."),
					initialization_vector_start: match initialization_vector_variant_with_start {
						InitializationVectorVariantWithStart::Fixed => {
							return Err(CiphertextParserError::AeadWithFixedInitializationVector)
						},
						InitializationVectorVariantWithStart::Random {
							initialization_vector_start,
						} => initialization_vector_start,
					},
					ciphertext,
					mac_tag_start,
				},
			)),
			SymmetricCipherVersion::AeadWithSessionKey => Ok(ParsedCiphertext::AeadWithSessionKey(
				ParsedCiphertextAeadWithSessionKey {
					versioned_ciphertext,
					initialization_vector_start: match initialization_vector_variant_with_start {
						InitializationVectorVariantWithStart::Fixed => {
							return Err(CiphertextParserError::AeadWithFixedInitializationVector)
						},
						InitializationVectorVariantWithStart::Random {
							initialization_vector_start,
						} => initialization_vector_start,
					},
					ciphertext,
					mac_tag_start,
				},
			)),
			_ => Err(CiphertextParserError::UnknownCipherVersion),
		}
	}

	fn parse_versioned_cipher_text_unused_reserved_unauthenticated(
		versioned_ciphertext: Vec<u8>,
		ciphertext: Range<usize>,
		initialization_vector_variant: InitializationVectorVariant,
	) -> Result<ParsedCiphertextUnusedReservedUnauthenticated, CiphertextParserError> {
		let mut ciphertext = ciphertext;
		let initialization_vector_variant_with_start = match initialization_vector_variant {
			InitializationVectorVariant::Fixed => InitializationVectorVariantWithStart::Fixed,
			InitializationVectorVariant::Random => InitializationVectorVariantWithStart::Random {
				initialization_vector_start: Self::extract_initialization_vector(&mut ciphertext)?,
			},
		};
		Ok(ParsedCiphertextUnusedReservedUnauthenticated {
			versioned_ciphertext,
			initialization_vector_variant_with_start,
			ciphertext,
		})
	}

	fn extract_initialization_vector(
		ciphertext: &mut Range<usize>,
	) -> Result<usize, CiphertextParserError> {
		if ciphertext.len() < INITIALIZATION_VECTOR_BYTE_SIZE {
			return Err(CiphertextParserError::NotEnoughBytesForInitializationVector);
		}
		let initialization_vector_start = ciphertext.start;
		ciphertext.start += INITIALIZATION_VECTOR_BYTE_SIZE;
		Ok(initialization_vector_start)
	}

	fn extract_mac_tag(ciphertext: &mut Range<usize>) -> Result<usize, CiphertextParserError> {
		if ciphertext.len() < BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES {
			return Err(CiphertextParserError::NotEnoughBytesForMacTag);
		}
		ciphertext.end -= BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES;
		Ok(ciphertext.end)
	}

	fn extract_group_key_version(
		versioned_ciphertext: &[u8],
		ciphertext: &mut Range<usize>,
	) -> Result<u64, CiphertextParserError> {
		let key_version_length_byte = *versioned_ciphertext
			.get(ciphertext.start)
			.ok_or(CiphertextParserError::NotEnoughBytesForGroupKeyVersionLength)?;
		ciphertext.start += 1;
		if key_version_length_byte != 0 {
			return Err(CiphertextParserError::UnsupportedGroupKeyVersionLength);
		}
		let group_key_version_byte = *versioned_ciphertext
			.get(ciphertext.start)
			.ok_or(CiphertextParserError::NotEnoughBytesForGroupKeyVersion)?;
		ciphertext.start += 1;
		Ok(group_key_version_byte.into())
	}

	pub fn cipher_version(&self) -> SymmetricCipherVersion {
		match self {
			Self::UnusedReservedUnauthenticated(..) => {
				SymmetricCipherVersion::UnusedReservedUnauthenticated
			},
			Self::AesCbcThenHmac(..) => SymmetricCipherVersion::AesCbcThenHmac,
			Self::AeadWithGroupKey(..) => SymmetricCipherVersion::AeadWithGroupKey,
			Self::AeadWithSessionKey(..) => SymmetricCipherVersion::AeadWithSessionKey,
		}
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::randomizer_facade::test_util::make_thread_rng_facade;

	const BLOCK_SIZE_BYTES: usize = 16;

	#[test]
	fn can_parse_unused_reserved_unauthenticated_with_fixed_initialization_vector() {
		let randomizer_facade = make_thread_rng_facade();

		let symmetric_cipher_version = SymmetricCipherVersion::UnusedReservedUnauthenticated;
		let ciphertext: [u8; BLOCK_SIZE_BYTES] = randomizer_facade.generate_random_array();
		let mut versioned_ciphertext = vec![symmetric_cipher_version.version_byte()];
		versioned_ciphertext.extend_from_slice(&ciphertext);
		let parsed_ciphertext = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::Fixed,
		)
		.unwrap();
		let parsed_ciphertext_unused_reserved_unauthenticated = match &parsed_ciphertext {
			ParsedCiphertext::UnusedReservedUnauthenticated(parsed_ciphertext) => parsed_ciphertext,
			_ => panic!("wrong cipher version"),
		};
		assert_eq!(
			parsed_ciphertext_unused_reserved_unauthenticated.initialization_vector(),
			InitializationVector::Fixed
		);
		assert_eq!(
			parsed_ciphertext_unused_reserved_unauthenticated.ciphertext(),
			ciphertext
		);
		let parsed_ciphertext_no_version_byte = ParsedCiphertext::parse_versioned_ciphertext(
			ciphertext.to_vec(),
			InitializationVectorVariant::Fixed,
		)
		.unwrap();
		assert_eq!(parsed_ciphertext_no_version_byte, parsed_ciphertext);
	}

	#[test]
	fn can_parse_unused_reserved_unauthenticated_with_random_initialization_vector() {
		let randomizer_facade = make_thread_rng_facade();

		let symmetric_cipher_version = SymmetricCipherVersion::UnusedReservedUnauthenticated;
		let initialization_vector: [u8; INITIALIZATION_VECTOR_BYTE_SIZE] =
			randomizer_facade.generate_random_array();
		let ciphertext: [u8; BLOCK_SIZE_BYTES] = randomizer_facade.generate_random_array();
		let mut versioned_ciphertext = vec![symmetric_cipher_version.version_byte()];
		versioned_ciphertext.extend_from_slice(&initialization_vector);
		versioned_ciphertext.extend_from_slice(&ciphertext);
		let parsed_ciphertext = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::Random,
		)
		.unwrap();
		let parsed_ciphertext_unused_reserved_unauthenticated = match &parsed_ciphertext {
			ParsedCiphertext::UnusedReservedUnauthenticated(parsed_ciphertext) => parsed_ciphertext,
			_ => panic!("wrong cipher version"),
		};
		assert_eq!(
			parsed_ciphertext_unused_reserved_unauthenticated.initialization_vector(),
			InitializationVector::Random {
				initialization_vector: &initialization_vector
			}
		);
		assert_eq!(
			parsed_ciphertext_unused_reserved_unauthenticated.ciphertext(),
			ciphertext
		);
		let mut initial_vector_and_ciphertext = initialization_vector.to_vec();
		initial_vector_and_ciphertext.extend_from_slice(&ciphertext);
		let parsed_ciphertext_no_version_byte = ParsedCiphertext::parse_versioned_ciphertext(
			initial_vector_and_ciphertext,
			InitializationVectorVariant::Random,
		)
		.unwrap();
		assert_eq!(parsed_ciphertext_no_version_byte, parsed_ciphertext);
	}

	#[test]
	fn can_parse_aes_cbc_then_hmac_with_fixed_initialization_vector() {
		let randomizer_facade = make_thread_rng_facade();

		let symmetric_cipher_version = SymmetricCipherVersion::AesCbcThenHmac;
		let ciphertext: [u8; BLOCK_SIZE_BYTES] = randomizer_facade.generate_random_array();
		let mac_tag: [u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES] =
			randomizer_facade.generate_random_array();
		let mut versioned_ciphertext = vec![symmetric_cipher_version.version_byte()];
		versioned_ciphertext.extend_from_slice(&ciphertext);
		versioned_ciphertext.extend_from_slice(&mac_tag);
		let parsed_ciphertext = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::Fixed,
		)
		.unwrap();
		let parsed_ciphertext_aes_cbc_then_hmac = match &parsed_ciphertext {
			ParsedCiphertext::AesCbcThenHmac(parsed_ciphertext) => parsed_ciphertext,
			_ => panic!("wrong cipher version"),
		};
		assert_eq!(
			parsed_ciphertext_aes_cbc_then_hmac.initialization_vector(),
			InitializationVector::Fixed
		);
		assert_eq!(parsed_ciphertext_aes_cbc_then_hmac.ciphertext(), ciphertext);
		assert_eq!(*parsed_ciphertext_aes_cbc_then_hmac.mac_tag(), mac_tag);
	}

	#[test]
	fn can_parse_aes_cbc_then_hmac_with_random_initialization_vector() {
		let randomizer_facade = make_thread_rng_facade();

		let symmetric_cipher_version = SymmetricCipherVersion::AesCbcThenHmac;
		let initialization_vector: [u8; INITIALIZATION_VECTOR_BYTE_SIZE] =
			randomizer_facade.generate_random_array();
		let ciphertext: [u8; BLOCK_SIZE_BYTES] = randomizer_facade.generate_random_array();
		let mac_tag: [u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES] =
			randomizer_facade.generate_random_array();
		let mut versioned_ciphertext = vec![symmetric_cipher_version.version_byte()];
		versioned_ciphertext.extend_from_slice(&initialization_vector);
		versioned_ciphertext.extend_from_slice(&ciphertext);
		versioned_ciphertext.extend_from_slice(&mac_tag);
		let parsed_ciphertext = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::Random,
		)
		.unwrap();
		let parsed_ciphertext_aes_cbc_then_hmac = match &parsed_ciphertext {
			ParsedCiphertext::AesCbcThenHmac(parsed_ciphertext) => parsed_ciphertext,
			_ => panic!("wrong cipher version"),
		};
		assert_eq!(
			parsed_ciphertext_aes_cbc_then_hmac.initialization_vector(),
			InitializationVector::Random {
				initialization_vector: &initialization_vector
			}
		);
		assert_eq!(parsed_ciphertext_aes_cbc_then_hmac.ciphertext(), ciphertext);
		assert_eq!(*parsed_ciphertext_aes_cbc_then_hmac.mac_tag(), mac_tag);
	}

	#[test]
	fn can_parse_aead_with_session_key() {
		let randomizer_facade = make_thread_rng_facade();

		let symmetric_cipher_version = SymmetricCipherVersion::AeadWithSessionKey;
		let initialization_vector: [u8; INITIALIZATION_VECTOR_BYTE_SIZE] =
			randomizer_facade.generate_random_array();
		let ciphertext: [u8; BLOCK_SIZE_BYTES] = randomizer_facade.generate_random_array();
		let mac_tag: [u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES] =
			randomizer_facade.generate_random_array();
		let mut versioned_ciphertext = vec![symmetric_cipher_version.version_byte()];
		versioned_ciphertext.extend_from_slice(&initialization_vector);
		versioned_ciphertext.extend_from_slice(&ciphertext);
		versioned_ciphertext.extend_from_slice(&mac_tag);
		let parsed_ciphertext = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::Random,
		)
		.unwrap();
		let parsed_ciphertext_aead_with_session_key = match &parsed_ciphertext {
			ParsedCiphertext::AeadWithSessionKey(parsed_ciphertext) => parsed_ciphertext,
			_ => panic!("wrong cipher version"),
		};
		assert_eq!(
			*parsed_ciphertext_aead_with_session_key.initialization_vector(),
			initialization_vector
		);
		assert_eq!(
			parsed_ciphertext_aead_with_session_key.ciphertext(),
			ciphertext
		);
		assert_eq!(*parsed_ciphertext_aead_with_session_key.mac_tag(), mac_tag);
	}

	#[test]
	fn can_parse_aead_with_group_key() {
		let randomizer_facade = make_thread_rng_facade();

		let symmetric_cipher_version = SymmetricCipherVersion::AeadWithGroupKey;
		let group_key_version_length = 0u8;
		let group_key_version = 42u64;
		let initialization_vector: [u8; INITIALIZATION_VECTOR_BYTE_SIZE] =
			randomizer_facade.generate_random_array();
		let ciphertext: [u8; BLOCK_SIZE_BYTES] = randomizer_facade.generate_random_array();
		let mac_tag: [u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES] =
			randomizer_facade.generate_random_array();
		let mut versioned_ciphertext = vec![
			symmetric_cipher_version.version_byte(),
			group_key_version_length,
			group_key_version.try_into().unwrap(),
		];
		versioned_ciphertext.extend_from_slice(&initialization_vector);
		versioned_ciphertext.extend_from_slice(&ciphertext);
		versioned_ciphertext.extend_from_slice(&mac_tag);
		let parsed_ciphertext = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::Random,
		)
		.unwrap();
		let parsed_ciphertext_aead_with_group_key = match &parsed_ciphertext {
			ParsedCiphertext::AeadWithGroupKey(parsed_ciphertext) => parsed_ciphertext,
			_ => panic!("wrong cipher version"),
		};
		assert_eq!(
			parsed_ciphertext_aead_with_group_key.group_key_version(),
			group_key_version
		);
		assert_eq!(
			*parsed_ciphertext_aead_with_group_key.initialization_vector(),
			initialization_vector
		);
		assert_eq!(
			parsed_ciphertext_aead_with_group_key.ciphertext(),
			ciphertext
		);
		assert_eq!(*parsed_ciphertext_aead_with_group_key.mac_tag(), mac_tag);
	}

	#[test]
	fn ensures_there_are_enough_bytes_for_the_initialization_vector() {
		let randomizer_facade = make_thread_rng_facade();

		let symmetric_cipher_version = SymmetricCipherVersion::UnusedReservedUnauthenticated;
		// subtract an even number of bytes in order to keep the parity
		let initialization_vector: [u8; INITIALIZATION_VECTOR_BYTE_SIZE - 2] =
			randomizer_facade.generate_random_array();
		// empty ciphertext
		let mut versioned_ciphertext = vec![symmetric_cipher_version.version_byte()];
		versioned_ciphertext.extend_from_slice(&initialization_vector);
		let error = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::default(),
		);
		assert_eq!(
			error,
			Err(CiphertextParserError::NotEnoughBytesForInitializationVector)
		);
	}

	#[test]
	fn ensures_there_are_enough_bytes_for_the_authentication_tag() {
		let randomizer_facade = make_thread_rng_facade();

		let symmetric_cipher_version = SymmetricCipherVersion::AesCbcThenHmac;
		// subtract an even number of bytes in order to keep the parity
		let mac_tag: [u8; BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES - 2] =
			randomizer_facade.generate_random_array();
		// empty ciphertext
		let mut versioned_ciphertext = vec![symmetric_cipher_version.version_byte()];
		versioned_ciphertext.extend_from_slice(&mac_tag);
		let error = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::default(),
		);
		assert_eq!(error, Err(CiphertextParserError::NotEnoughBytesForMacTag));
	}

	#[test]
	fn ensures_there_are_enough_bytes_for_the_group_key_version_length() {
		let symmetric_cipher_version = SymmetricCipherVersion::AeadWithGroupKey;
		// empty initialization vector, ciphertext and mac tag
		let versioned_ciphertext = vec![symmetric_cipher_version.version_byte()];
		let error = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::default(),
		);
		assert_eq!(
			error,
			Err(CiphertextParserError::NotEnoughBytesForGroupKeyVersionLength)
		);
	}

	#[test]
	fn only_supports_0_byte_for_key_version_length() {
		let symmetric_cipher_version = SymmetricCipherVersion::AeadWithGroupKey;
		let group_key_version_length = 1u8;
		let group_key_version = 42u64;
		// empty initialization vector, ciphertext and mac tag
		let versioned_ciphertext = vec![
			symmetric_cipher_version.version_byte(),
			group_key_version_length,
			group_key_version.try_into().unwrap(),
		];
		let error = ParsedCiphertext::parse_versioned_ciphertext(
			versioned_ciphertext,
			InitializationVectorVariant::default(),
		);
		assert_eq!(
			error,
			Err(CiphertextParserError::UnsupportedGroupKeyVersionLength)
		);
	}
}
