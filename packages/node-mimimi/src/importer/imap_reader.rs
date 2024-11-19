pub mod import_client;

#[derive(Clone, PartialEq)]
/// passed in from js before being validated and used for logging into the imap_reader server
pub struct ImapCredentials {
	/// hostname of the imap_reader server to import mail from
	pub host: String,
	/// imap_reader port of the imap_reader server to import mail from
	pub port: u16,
	/// Login method
	pub login_mechanism: LoginMechanism,
}

#[derive(Clone, PartialEq)]
pub enum LoginMechanism {
	Plain { username: String, password: String },
	OAuth { access_token: String },
}

#[derive(Clone, PartialEq)]
pub struct ImapImportConfig {
	pub root_import_mail_folder_name: String,
	pub credentials: ImapCredentials,
}
