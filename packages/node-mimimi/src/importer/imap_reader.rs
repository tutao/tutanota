use crate::importer::importable_mail::{ImportableMail, MailParseError};
use crate::tuta_imap::client::TutaImapClient;
use imap_codec::imap_types::mailbox::Mailbox;
use imap_codec::imap_types::response::StatusKind;
use std::num::NonZeroU32;

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

pub struct ImapImport {
	import_config: ImapImportConfig,
	imap_client: TutaImapClient,

	import_state: ImapImportState,
}

pub struct ImapImportState {
	done_fetched_mailbox: Vec<Mailbox<'static>>,
	current_mailbox: Option<Mailbox<'static>>,
	next_target_mailbox: Vec<Mailbox<'static>>,

	/// List of mail id that have been fetched from current_mailbox,
	fetched_from_current_mailbox: Vec<NonZeroU32>,
}

impl ImapImportState {
	/// add currently selected mailbox to done,
	/// and pop one from next target mailbox
	pub fn finish_current_mailbox(&mut self) {
		let current_mailbox = self.current_mailbox.as_mut().expect("No current mailbox");
		self.done_fetched_mailbox.push(current_mailbox.clone());
		self.current_mailbox = self.next_target_mailbox.pop();
		self.fetched_from_current_mailbox.clear();
	}

	/// this id of current mailbox was fetched
	pub fn fetched_from_current_mailbox(&mut self, id: NonZeroU32) {
		assert!(self.current_mailbox.is_some(), "No current mailbox");
		self.fetched_from_current_mailbox.push(id);
	}
}

#[derive(Debug, PartialEq, Clone)]
pub enum ImapIterationError {
	/// All mail form remote server have been visited at least once,
	SourceEnd,

	/// when executing a command, received a non-ok status,
	NonOkCommandStatus,

	/// Can not convert ImapMail to ConvertableMail
	MailParseError(MailParseError),

	/// Can not login to imap server
	NoLogin,
}

impl ImapImport {
	pub fn new(import_config: ImapImportConfig) -> Self {
		let imap_client = TutaImapClient::new(
			import_config.credentials.host.as_str(),
			import_config.credentials.port,
		);

		Self {
			imap_client,
			import_config,

			import_state: ImapImportState {
				done_fetched_mailbox: vec![],
				next_target_mailbox: vec![Mailbox::Inbox],
				current_mailbox: None,
				fetched_from_current_mailbox: vec![],
			},
		}
	}

	/// High level abstraction to read next mail from imap,
	/// will switch to next mailbox, if everything from current mailbox is fetched,
	pub fn fetch_next_mail(&mut self) -> Result<ImportableMail, ImapIterationError> {
		self.ensure_logged_in()?;

		while self.imap_client.latest_search_results.is_empty() {
			if self.import_state.current_mailbox.is_some() {
				self.import_state.finish_current_mailbox();
			}

			// select next mailbox
			// and search for all available mails
			self.ensure_mailbox_selected()?;

			self.imap_client
				.search_all_uid()
				.eq(&StatusKind::Ok)
				.then_some(())
				.ok_or(ImapIterationError::NonOkCommandStatus)?;
		}

		// search for the last ( oldest ? ) mail
		let next_mail_id = self.imap_client.latest_search_results.pop().unwrap();
		self.imap_client
			.fetch_mail_by_uid(next_mail_id)
			.eq(&StatusKind::Ok)
			.then_some(())
			.ok_or(ImapIterationError::NonOkCommandStatus)?;
		let next_mail_imap = self.imap_client.latest_mails.remove(&next_mail_id).unwrap();

		// mark this id have been fetched
		self.import_state.fetched_from_current_mailbox(next_mail_id);

		ImportableMail::try_from(next_mail_imap).map_err(ImapIterationError::MailParseError)
	}

	fn ensure_mailbox_selected(&mut self) -> Result<(), ImapIterationError> {
		if self.import_state.current_mailbox.is_none() {
			let next_mailbox_to_select = self
				.import_state
				.next_target_mailbox
				.pop()
				.ok_or(ImapIterationError::SourceEnd)?;
			self.import_state.current_mailbox = Some(next_mailbox_to_select);
			self.import_state.fetched_from_current_mailbox = vec![];
		}

		// if something from current mailbox is selected, it means we are already in selected state
		if !self.import_state.fetched_from_current_mailbox.is_empty() {
			return Ok(());
		}

		let target_mailbox = self
			.import_state
			.current_mailbox
			.as_ref()
			.ok_or(ImapIterationError::SourceEnd)?;
		self.imap_client
			.select_mailbox(target_mailbox.clone())
			.eq(&StatusKind::Ok)
			.then_some(())
			.ok_or(ImapIterationError::NonOkCommandStatus)
	}

	fn ensure_logged_in(&mut self) -> Result<(), ImapIterationError> {
		if self.imap_client.is_logged_in() {
			return Ok(());
		}

		match &self.import_config.credentials.login_mechanism {
			LoginMechanism::Plain { username, password } => self
				.imap_client
				.plain_login(username.as_str(), password.as_str())
				.eq(&StatusKind::Ok)
				.then_some(())
				.ok_or(ImapIterationError::NoLogin),

			LoginMechanism::OAuth { access_token: _ } => {
				unimplemented!()
			},
		}
	}
}
