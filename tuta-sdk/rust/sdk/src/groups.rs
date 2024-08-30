#[allow(dead_code)]
pub enum GroupType {
	User,
	Admin,
	MailingList,
	Customer,
	External,
	Mail,
	Contact,
	File,
	LocalAdmin,
	Calendar,
	Template,
	ContactList,
}

impl GroupType {
	pub fn raw_value(&self) -> u64 {
		match self {
			GroupType::User => 0,
			GroupType::Admin => 1,
			GroupType::MailingList => 2,
			GroupType::Customer => 3,
			GroupType::External => 4,
			GroupType::Mail => 5,
			GroupType::Contact => 6,
			GroupType::File => 7,
			GroupType::LocalAdmin => 8,
			GroupType::Calendar => 9,
			GroupType::Template => 10,
			GroupType::ContactList => 11,
		}
	}
}