/*
The type of the identifier to look up the public key for a group.
 */
#[allow(dead_code)]
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
