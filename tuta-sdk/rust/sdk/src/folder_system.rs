use crate::entities::generated::tutanota::MailSet;
use num_enum::TryFromPrimitive;

pub struct FolderSystem {
	// this structure should probably change rather soon
	folders: Vec<MailSet>,
}

#[derive(Copy, Clone, PartialEq, TryFromPrimitive, Debug)]
#[repr(u64)]
pub enum MailSetKind {
	Custom = 0,
	Inbox = 1,
	Sent = 2,
	Trash = 3,
	Archive = 4,
	Spam = 5,
	Draft = 6,
	All = 7,
	Unknown = 9999,
}

impl MailSet {
	fn mail_set_kind(&self) -> MailSetKind {
		MailSetKind::try_from(self.folderType as u64).unwrap_or(MailSetKind::Unknown)
	}
}

impl FolderSystem {
	#[must_use]
	pub fn new(folders: Vec<MailSet>) -> Self {
		Self { folders }
	}

	#[must_use]
	pub fn system_folder_by_type(&self, mail_set_kind: MailSetKind) -> Option<&MailSet> {
		self.folders
			.iter()
			.find(|f| f.mail_set_kind() == mail_set_kind)
	}
}
