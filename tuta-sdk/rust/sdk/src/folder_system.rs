use crate::entities::tutanota::MailFolder;
use num_enum::TryFromPrimitive;

pub struct FolderSystem {
	// this structure should probably change rather soon
	folders: Vec<MailFolder>,
}

#[derive(PartialEq, TryFromPrimitive)]
#[repr(u64)]
pub enum MailSetKind {
	CUSTOM = 0,
	INBOX = 1,
	SENT = 2,
	TRASH = 3,
	ARCHIVE = 4,
	SPAM = 5,
	DRAFT = 6,
	ALL = 7,
	UNKNOWN = 9999,
}

impl MailFolder {
	fn mail_set_kind(&self) -> MailSetKind {
		MailSetKind::try_from(self.folderType as u64).unwrap_or(MailSetKind::UNKNOWN)
	}
}

impl FolderSystem {
	pub fn new(folders: Vec<MailFolder>) -> Self {
		Self { folders }
	}

	pub fn system_folder_by_type(&self, mail_set_kind: MailSetKind) -> Option<&MailFolder> {
		self.folders
			.iter()
			.find(|f| f.mail_set_kind() == mail_set_kind)
	}
}
