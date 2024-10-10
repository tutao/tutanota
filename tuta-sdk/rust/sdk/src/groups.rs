use num_enum::TryFromPrimitive;

#[allow(dead_code)]
#[derive(PartialEq, TryFromPrimitive)]
#[repr(u64)]
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
	Unknown = 9999,
}
