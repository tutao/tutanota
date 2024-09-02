/*
The type of the identifier to look up the public key for a group.
 */
#[allow(dead_code)]
#[repr(i64)]
pub enum PublicKeyIdentifierType {
	MailAddress = 0, // the default to retrieve public keys. identify the group by mail address.
	GroupId = 1,     // e.g. needed if a user's needs the admin groups public key. identify by groupId.
}
