/*
The type of the identifier to look up the public key for a group.
 */
#[allow(dead_code)]
#[repr(i64)]
pub enum PublicKeyIdentifierType {
	MailAddress = 0, // the default to retrieve public keys. identify the group by mail address.
	GroupId = 1,     // e.g. needed if a user's needs the admin groups public key. identify by groupId.
}

impl Into<i64> for PublicKeyIdentifierType {
	fn into(self) -> i64 {
		match self {
			PublicKeyIdentifierType::MailAddress => 0,
			PublicKeyIdentifierType::GroupId => 1,
		}
	}
}

/// Denotes if an entity was authenticated successfully.
///
/// Not all decryption methods use authentication.
pub enum EncryptionAuthStatus {
	/// The entity was decrypted with RSA which does not use authentication.
	RSANoAuthentication = 0,

	/// The entity was decrypted with Tutacrypt (PQ) and successfully authenticated.
	TutacryptAuthenticationSucceeded = 1,

	/// The entity was decrypted with Tutacrypt (PQ), but authentication failed.
	TutacryptAuthenticationFailed = 2,

	/// The entity was decrypted symmetrically (i.e. secure external) which does not use authentication.
	AESNoAuthentication = 3,

	/// The entity was sent by the user and doesn't need authenticated.
	TutacryptSender = 4,
}
