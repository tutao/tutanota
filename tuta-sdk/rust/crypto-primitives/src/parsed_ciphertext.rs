use crate::aes::INITIALIZATION_VECTOR_BYTE_SIZE;
use crate::blake3::BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES;
use std::ops::Range;

#[derive(thiserror::Error, Debug, Eq, PartialEq)]
pub enum CiphertextParserError {
	#[error("CiphertextParserError")]
	CiphertextParserError,
}

#[derive(Debug)]
pub enum InitializationVectorVariant {
	Fixed,
	Random,
}

#[derive(Debug)]
enum InitializationVectorVariantWithStart {
	Fixed,
	Random { initialization_vector_start: usize },
}

#[derive(Debug)]
pub struct ParsedCiphertextUnusedReservedUnauthenticated {
	versioned_ciphertext: Vec<u8>,
	initialization_vector_variant_with_start: InitializationVectorVariantWithStart,
	ciphertext: Range<usize>,
}

#[derive(Debug)]
pub struct ParsedCiphertextAesCbcThenHmac {
	versioned_ciphertext: Vec<u8>,
	initialization_vector_variant_with_start: InitializationVectorVariantWithStart,
	ciphertext: Range<usize>,
	mac_tag_start: usize,
}

#[derive(Debug)]
pub struct ParsedCiphertextAeadWithGroupKey {
	versioned_ciphertext: Vec<u8>,
	initialization_vector_start: usize,
	ciphertext: Range<usize>,
	mac_tag_start: usize,
}

#[derive(Debug)]
pub struct ParsedCiphertextAeadWithSessionKey {
	versioned_ciphertext: Vec<u8>,
	initialization_vector_start: usize,
	ciphertext: Range<usize>,
	mac_tag_start: usize,
}

#[derive(Debug)]
pub enum ParsedCiphertextAesCbc {
	UnusedReservedUnauthenticated(ParsedCiphertextUnusedReservedUnauthenticated),
	AesCbcThenHmac(ParsedCiphertextAesCbcThenHmac),
}

#[derive(Debug)]
pub enum ParsedCiphertextAead {
	AeadWithGroupKey(ParsedCiphertextAeadWithGroupKey),
	AeadWithSessionKey(ParsedCiphertextAeadWithSessionKey),
}

#[derive(Debug)]
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
		if versioned_ciphertext_len % 2 == 0 {
			return Self::parse_versioned_cipher_text_unused_reserved_unauthenticated(
				versioned_ciphertext,
				0..versioned_ciphertext_len,
				initialization_vector_variant,
			);
		}

		Err(CiphertextParserError::CiphertextParserError)
	}
	fn parse_versioned_cipher_text_unused_reserved_unauthenticated(
		versioned_ciphertext: Vec<u8>,
		ciphertext: Range<usize>,
		initialization_vector_variant: InitializationVectorVariant,
	) -> Result<ParsedCiphertext, CiphertextParserError> {
		let mut ciphertext = ciphertext;
		let initialization_vector_variant_with_start = match initialization_vector_variant {
			InitializationVectorVariant::Fixed => InitializationVectorVariantWithStart::Fixed,
			InitializationVectorVariant::Random => InitializationVectorVariantWithStart::Random {
				initialization_vector_start: Self::extract_initialization_vector(&mut ciphertext)?,
			},
		};

		Err(CiphertextParserError::CiphertextParserError)
	}

	fn extract_initialization_vector(
		ciphertext: &mut Range<usize>,
	) -> Result<usize, CiphertextParserError> {
		if ciphertext.len() < INITIALIZATION_VECTOR_BYTE_SIZE {
			return Err(CiphertextParserError::CiphertextParserError);
		}
		let initialization_vector_start = ciphertext.start;
		ciphertext.start += INITIALIZATION_VECTOR_BYTE_SIZE;
		Ok(initialization_vector_start)
	}

	fn extract_mac_tag(ciphertext: &mut Range<usize>) -> Result<usize, CiphertextParserError> {
		if ciphertext.len() < BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES {
			return Err(CiphertextParserError::CiphertextParserError);
		}
		ciphertext.end -= BLAKE3_DEFAULT_OUTPUT_SIZE_BYTES;
		Ok(ciphertext.end)
	}
}
