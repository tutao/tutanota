/*
The type of the identifier to look up the public key for a group.
 */
#[allow(dead_code)]
#[repr(i64)]
pub enum PublicKeyIdentifierType {
	MailAddress = 0, // the default to retrieve public keys. identify the group by mail address.
	GroupId = 1,     // e.g. needed if a user's needs the admin groups public key. identify by groupId.
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
pub const MAX_BLOB_SIZE_BYTES: usize = 1024 * 1024 * 10;
