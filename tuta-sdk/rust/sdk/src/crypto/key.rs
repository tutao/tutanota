use super::rsa::*;
use super::tuta_crypt::*;
use crate::crypto::X25519PublicKey;
use crate::util::Versioned;
use crate::ApiCallError;
use crypto_primitives::aes::*;
use crypto_primitives::key::*;
use std::fmt::{Debug, Formatter};
use util::array::ArrayCastingError;

#[derive(Clone, PartialEq)]
#[allow(clippy::large_enum_variant)]
pub enum AsymmetricKeyPair {
	RSAKeyPair(RSAKeyPair),
	RSAX25519KeyPair(RSAX25519KeyPair),
	TutaCryptKeyPairs(TutaCryptKeyPairs),
}

#[derive(Clone, PartialEq)]
pub struct RsaX25519PublicKeys {
	pub rsa_public_key: RSAPublicKey,
	pub x25519_public_key: X25519PublicKey,
}

#[cfg_attr(test, derive(Clone, PartialEq))]
#[allow(clippy::large_enum_variant)]
pub enum PublicKey {
	Rsa(RSAPublicKey),
	RsaX25519(RsaX25519PublicKeys),
	TutaCrypt(TutaCryptPublicKeys),
}

// we implement this ourselves to make sure we do not leak anything
impl Debug for PublicKey {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		match self {
			PublicKey::Rsa(_) => f.debug_struct("RsaPublicKey").finish(),
			PublicKey::TutaCrypt(_) => f.debug_struct("TutaCryptPublicKeys").finish(),
			PublicKey::RsaX25519(_) => f.debug_struct("RsaX25519PublicKey").finish(),
		}
	}
}

impl From<RSAKeyPair> for AsymmetricKeyPair {
	fn from(value: RSAKeyPair) -> Self {
		Self::RSAKeyPair(value)
	}
}

impl From<RSAX25519KeyPair> for AsymmetricKeyPair {
	fn from(value: RSAX25519KeyPair) -> Self {
		Self::RSAX25519KeyPair(value)
	}
}

impl From<TutaCryptKeyPairs> for AsymmetricKeyPair {
	fn from(value: TutaCryptKeyPairs) -> Self {
		Self::TutaCryptKeyPairs(value)
	}
}

// we implement this ourselves to make sure we do not leak anything
impl Debug for AsymmetricKeyPair {
	fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
		match self {
			AsymmetricKeyPair::RSAKeyPair(_) => f.debug_struct("RSAKeyPair").finish(),
			AsymmetricKeyPair::RSAX25519KeyPair(_) => f.debug_struct("RSAX25519KeyPair").finish(),
			AsymmetricKeyPair::TutaCryptKeyPairs(_) => f.debug_struct("TutaCryptKeyPairs").finish(),
		}
	}
}

#[derive(thiserror::Error, Debug)]
#[error("Failed to load key: {reason}")]
pub struct KeyLoadError {
	pub(crate) reason: String,
}

/// Used to convert key related error types to `KeyLoadError`
trait KeyLoadErrorSubtype: ToString {}

impl<T: KeyLoadErrorSubtype> From<T> for KeyLoadError {
	fn from(value: T) -> Self {
		Self {
			reason: value.to_string(),
		}
	}
}

impl KeyLoadErrorSubtype for AesDecryptError {}

impl KeyLoadErrorSubtype for ArrayCastingError {}

impl KeyLoadErrorSubtype for RSAKeyError {}

/// Used to handle errors from the entity client
impl KeyLoadErrorSubtype for ApiCallError {}

pub type VersionedAesKey = Versioned<GenericAesKey>;

impl Versioned<GenericAesKey> {
	#[must_use]
	pub fn encrypt_key(&self, key_to_encrypt: &GenericAesKey, iv: Iv) -> Versioned<Vec<u8>> {
		let encrypted_key = self.object.encrypt_key(key_to_encrypt, iv);
		// todo: this looks like the vec<u8> has the version which is not true
		Versioned::new(encrypted_key, self.version)
	}
}
