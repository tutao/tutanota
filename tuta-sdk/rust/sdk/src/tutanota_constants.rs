/*
The type of the identifier to look up the public key for a group.
 */
use num_enum::TryFromPrimitive;

#[allow(dead_code)]
#[derive(Debug, Clone)]
#[repr(i64)]
pub enum PublicKeyIdentifierType {
	MailAddress = 0, // the default to retrieve public keys. identify the group by mail address.
	GroupId = 1,     // e.g. needed if a user's needs the admin groups public key. identify by groupId.
}
#[repr(i64)]
pub enum GroupType {
	User = 0,
	Admin = 1,
	MailingList = 2,
	Customer = 3,
	External = 4,
	Mail = 5,
	Contact = 6,
	File = 7,
	LocalAdmin = 8,
	Calendar = 9,
	Template = 10,
	ContactList = 11,
}

#[allow(dead_code)]
#[repr(i64)]
#[derive(Copy, Clone, Hash, PartialEq, Eq)]
#[cfg_attr(test, derive(Debug))]
pub enum ArchiveDataType {
	AuthorityRequests = 0,
	Attachments = 1,
	MailDetails = 2,
}
impl ArchiveDataType {
	#[must_use]
	pub fn discriminant(&self) -> i64 {
		match self {
			ArchiveDataType::AuthorityRequests => 0,
			ArchiveDataType::Attachments => 1,
			ArchiveDataType::MailDetails => 2,
		}
	}
}

pub const BLOB_ENCRYPTION_OVERHEAD_BYTES: usize = 256;
pub const MAX_UNENCRYPTED_BLOB_SIZE_BYTES: usize = 1024 * 1024 * 10;
pub const MAX_BLOB_SIZE_BYTES: usize =
	MAX_UNENCRYPTED_BLOB_SIZE_BYTES + BLOB_ENCRYPTION_OVERHEAD_BYTES;
pub const MAX_BLOB_SERVICE_BYTES: usize = MAX_BLOB_SIZE_BYTES;

/// Denotes if an entity was authenticated successfully.
///
/// Not all decryption methods use authentication.
#[derive(Debug, PartialEq, Eq)]
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

/// Used for identifying the protocol version used for encrypting a session key.
#[derive(Debug, Clone, TryFromPrimitive, PartialEq, Eq)]
#[repr(i64)]
pub enum CryptoProtocolVersion {
	/// Legacy asymmetric encryption (RSA-2048)
	Rsa = 0,

	/// Secure external
	SymmetricEncryption = 1,

	/// PQ encryption (Kyber+X25519)
	TutaCrypt = 2,
}
