use crate::tuta_imap::client::tls_stream::TlsStream;
use crate::tuta_imap::client::types::ImapMail;
use imap_codec::decode::{Decoder, ResponseDecodeError};
use imap_codec::encode::Encoder;
use imap_codec::imap_types::core::Tag;
use imap_codec::imap_types::fetch::MessageDataItemName;
use imap_codec::imap_types::mailbox::Mailbox;
use imap_codec::imap_types::response::{
	CommandContinuationRequest, Data, Response, Status, StatusBody, StatusKind, Tagged,
};
use imap_codec::imap_types::secret::Secret;
use imap_codec::imap_types::{response, ToStatic};
use imap_codec::{imap_types, CommandCodec, ResponseCodec};
use imap_types::state::State as ConnectionState;
use std::collections::HashMap;
use std::num::NonZeroU32;

// todo:
// what is the intention for this commit:
// https://github.com/duesee/imap-codec/commit/998fa15456fb0b2006c88ba5d523b5e2e115ae86
pub mod tls_stream;
pub mod types;

// todo: make a PR for this type alias?
pub type CapabilitiesList<'a> = imap_types::core::Vec1<response::Capability<'a>>;

/// Always return a pre-formatted/sanitised error to client and not the execution details
pub type ApiError = String;
pub type ApiResult<O> = Result<O, ApiError>;

pub struct TutaImapClient {
	pub capabilities: Option<CapabilitiesList<'static>>,
	pub latest_search_results: Vec<NonZeroU32>,
	pub latest_mails: HashMap<NonZeroU32, ImapMail>,
	pub unreceived_status: HashMap<Tag<'static>, StatusBody<'static>>,

	connection_state: ConnectionState<'static>,

	command_codec: CommandCodec,
	response_codec: ResponseCodec,
	tls_stream: TlsStream,
}

/// Implement the exposed api
impl TutaImapClient {
	/// Construct a new client
	/// as well as:
	/// - listen ( &discard ) the greetings & SSL messages
	/// - refresh capabilities once
	/// - perform login
	pub fn new(imaps_host: &str, imaps_port: u16) -> Self {
		let tls_stream = TlsStream::new(imaps_host, imaps_port);

		let mut client = Self {
			tls_stream,
			capabilities: None,
			latest_mails: HashMap::new(),
			latest_search_results: Vec::new(),
			command_codec: CommandCodec::new(),
			response_codec: ResponseCodec::new(),
			unreceived_status: HashMap::new(),
			connection_state: ConnectionState::NotAuthenticated,
		};

		// start the tls handshake process
		client.start_tls().unwrap();

		// discard any tls & greetings messages
		client.read_until_next_status(None).unwrap();
		client.connection_state = ConnectionState::Greeting;

		// refresh the capabilities
		client.refresh_capabilities();

		// return the updated client
		client
	}

	pub fn is_logged_in(&self) -> bool {
		matches!(
			self.connection_state,
			ConnectionState::Selected(_)
				| ConnectionState::Authenticated
				| ConnectionState::IdleAuthenticated(_)
				| ConnectionState::IdleSelected(_, _)
		)
	}

	/// try to refresh the capability from server by executing CAPABILITIES command
	pub fn refresh_capabilities(&mut self) -> response::StatusKind {
		let capability_command = imap_types::command::Command {
			tag: self.create_tag(),
			body: imap_types::command::CommandBody::Capability,
		};
		let capability_response = self.execute_command_directly(capability_command).unwrap();

		capability_response.kind
	}

	pub fn plain_login(&mut self, username: &str, password: &str) -> response::StatusKind {
		let login_command = imap_types::command::Command {
			tag: self.create_tag(),
			body: imap_types::command::CommandBody::Login {
				username: username.try_into().unwrap(),
				password: Secret::new(password.try_into().unwrap()),
			},
		};
		let login_response = self.execute_command_directly(login_command).unwrap();
		let status_kind = login_response.kind;

		if status_kind == response::StatusKind::Ok {
			self.connection_state = ConnectionState::Authenticated;
		}

		status_kind
	}

	/// List all the mailboxes (i.e. folders) available inside the imap account.
	pub fn list_mailboxes(&mut self) -> StatusKind {
		assert_eq!(
			ConnectionState::Authenticated,
			self.connection_state,
			"must be in authenticated state to list mailboxes. Current state:"
		);
		// TODO check values for mailbox_wildcard and reference
		/* let list_command = imap_types::command::Command {
			tag: self.create_tag(),
			body: imap_types::command::CommandBody::List {
				mailbox_wildcard: ListMailbox::String("*".into()),
				reference: Mailbox::Other("".into()),
			},
		};
		let list_response = self.execute_command_directly(list_command).unwrap();
		let status_kind = list_response.kind;
		if status_kind == response::StatusKind::Ok {
			self.connection_state = ConnectionState::Authenticated;
		}
		status_kind*/
		StatusKind::Ok
	}

	/// Select a single mailbox (i.e. folder)
	///
	/// Caller should already invoke `list_mailboxes`  function before calling this function.
	pub fn select_mailbox(&mut self, mailbox: Mailbox) -> StatusKind {
		assert!(
			matches!(
				self.connection_state,
				ConnectionState::Authenticated | ConnectionState::Selected(_)
			),
			"must be in authenticated/selected state to select mailbox"
		);
		let select_command = imap_types::command::Command {
			tag: self.create_tag(),
			body: imap_types::command::CommandBody::Select {
				mailbox: mailbox.clone(),
			},
		};

		let select_response = self.execute_command_directly(select_command).unwrap();
		let status_kind = select_response.kind;
		if status_kind == StatusKind::Ok {
			self.connection_state = ConnectionState::Selected(mailbox.to_static());
		}
		status_kind
	}

	// TODO implement imap commands exposing the complete syntax?
	pub fn fetch(&mut self, command_body: imap_types::command::CommandBody) -> StatusKind {
		assert_eq!(
			ConnectionState::Selected(Mailbox::Inbox),
			self.connection_state,
			"must be in selected state to fetch mailbox UID"
		);
		let fetch_command = imap_types::command::Command {
			tag: self.create_tag(),
			body: command_body,
		};

		let search_all_command = self.execute_command_directly(fetch_command).unwrap();

		search_all_command.kind
	}

	/// perform a UID search command
	pub fn search_all_uid(&mut self) -> StatusKind {
		assert_eq!(
			ConnectionState::Selected(Mailbox::Inbox),
			self.connection_state,
			"must be in selected state to search mailbox UIDs"
		);
		let search_all_command = imap_types::command::Command {
			tag: self.create_tag(),
			body: imap_types::command::CommandBody::Search {
				charset: None,
				uid: true,
				criteria: [imap_types::search::SearchKey::All].into(),
			},
		};

		let search_all_command = self.execute_command_directly(search_all_command).unwrap();

		search_all_command.kind
	}

	/// fetch mail with given uid
	// todo:
	/// & given uidValidity
	pub fn fetch_mail_by_uid(&mut self, uid: NonZeroU32) -> StatusKind {
		assert_eq!(
			ConnectionState::Selected(Mailbox::Inbox),
			self.connection_state,
			"must be in selected state to fetch mailbox UID"
		);
		let fetch_command = imap_types::command::Command {
			tag: self.create_tag(),
			body: imap_types::command::CommandBody::Fetch {
				uid: true,
				sequence_set: imap_types::sequence::Sequence::Single(uid.into()).into(),
				macro_or_item_names: vec![MessageDataItemName::Rfc822].into(),
			},
		};

		let search_all_command = self.execute_command_directly(fetch_command).unwrap();

		search_all_command.kind
	}
}

/// Implement direct helper function divisions

impl TutaImapClient {
	fn create_tag(&mut self) -> Tag<'static> {
		Tag::try_from("tag").unwrap()
	}

	fn start_tls(&mut self) -> Result<(), ()> {
		Ok(())
	}

	// Use any untagged data response to update the state
	fn process_data_response(&mut self, data_response: Data) {
		match data_response {
			Data::Capability(list) => self.capabilities = Some(list.to_static()),
			Data::Search(list) => self.latest_search_results = list.to_static(),
			Data::Fetch { seq, items } => {
				self.latest_mails.insert(seq, ImapMail::new(items));
			},

			anything_else => {
				log::warn!("Do not know yet how to handle: {anything_else:?}")
			},
		}
	}

	// command continuation request
	fn process_cmd_continutation_response(
		&self,
		_cmd_continutation_response: CommandContinuationRequest,
	) -> Result<(), ()> {
		Ok(())
	}

	/// Process any response parsed.
	fn process_response(&mut self, response: Response) {
		match response {
			Response::Data(untagged_data) => {
				self.process_data_response(untagged_data);
			},
			Response::Status(status) => match status {
				Status::Untagged(untagged_status) => {
					log::warn!("Received untagged status: {:?}", untagged_status);
				},
				Status::Tagged(response::Tagged { tag, body }) => {
					self.unreceived_status
						.insert(tag.to_static(), body.to_static());
				},
				Status::Bye(_response_bye) => {
					log::warn!("Received bye from server. byeeeee.");
					self.connection_state = ConnectionState::Logout;
				},
			},
			Response::CommandContinuationRequest(cmd_continuation) => {
				self.process_cmd_continutation_response(cmd_continuation)
					.unwrap();
			},
		}
	}

	/// returns if response bytes is incomplete
	fn parse_response(
		&mut self,
		response_bytes: &mut Vec<u8>,
	) -> Result<Response, ResponseDecodeError> {
		if response_bytes.is_empty() {
			Err(ResponseDecodeError::Failed)?;
		}

		let response = self.response_codec.decode(response_bytes.as_ref());
		match response {
			Ok((_left_over, response)) => {
				log::info!("Got response to be: `{:?}`", response);
				Ok(response.to_static())
			},

			Err(ResponseDecodeError::LiteralFound { length }) => {
				log::warn!(
					"Literal found for response: {}",
					String::from_utf8(response_bytes.to_vec()).unwrap()
				);

				// read everything remaining
				let mut remaining_literal = vec![0u8; length.try_into().unwrap()];
				self.tls_stream.read_exact(&mut remaining_literal).unwrap();
				response_bytes.append(&mut remaining_literal);

				// try again
				self.parse_response(response_bytes)
			},

			// if this is incomplete/Failed ,
			// save this might have to re-read again once we get remaining of response
			Err(ResponseDecodeError::Incomplete) | Err(ResponseDecodeError::Failed) => {
				log::warn!(
					"Got an {response:?} response from server. Saving it: `{}`",
					String::from_utf8(response_bytes.to_vec()).unwrap()
				);
				Err(response.unwrap_err())
			},
		}
	}

	// execute a command in imap
	//
	// this api is allowed to cache or delay the execution given command:
	// example: some other non-overridden-able command is in progress
	// example: LOGIN command is in progress. it's better to wait for such command to finish
	//          so that we can execute following command in correct state context
	//
	// this api is allowed to block the execution for so reason. If the waiting is not desired,
	// todo:
	// call another async function which will received the command and put it to queue,
	// once the command is executed and the response with tag of this command is received,
	// the response ( only the tagged one ) will be passed to the receiving channel

	fn execute_command_directly(
		&mut self,
		command: imap_types::command::Command,
	) -> Result<StatusBody, ()> {
		// only check for logout state,
		// calling function should make sure to check for other state
		// if that action expects client to be in certain state
		assert_ne!(
			ConnectionState::Logout,
			self.connection_state,
			"Cannot execute command after being logged out"
		);
		log::info!("Start Executing command: {command:?}");

		// write the command
		let encoded_command = self.command_codec.encode(&command);
		self.tls_stream
			.write_imap_command(encoded_command.dump().as_slice())
			.unwrap();

		log::info!("Command written...");

		self.read_until_next_status(Some(&command.tag))
	}

	/// Read until we get next StatusCode ( Ok, Bye, Bad, PreAuth )
	///
	/// If expected_tag is Some(), we always make sure the status match this tag,
	/// if not, we return on first tagged/untagged status
	fn read_until_next_status(&mut self, expected_tag: Option<&Tag>) -> Result<StatusBody, ()> {
		let mut next_line: Vec<u8> = Vec::new();
		loop {
			// we assume we get at least one line of response with every command
			// otherwise we will wait here forever,
			// unless we get any other response ( which is still not ok because we check for this tag later on)
			next_line.append(&mut self.tls_stream.read_until_crlf().unwrap());

			let maybe_cmd_status = self.parse_response(&mut next_line).map(|r| r.to_static());
			return match maybe_cmd_status {
				// if it's the tagged response
				// with the same tag as of command
				Ok(Response::Status(some_status)) => match some_status {
					Status::Tagged(Tagged { tag, body })
						if Some(&tag) == expected_tag || expected_tag.is_none() =>
					{
						Ok(body.to_static())
					},
					Status::Untagged(body) if expected_tag.is_none() => Ok(body.to_static()),

					Status::Tagged(_) | Status::Untagged(_) | Status::Bye(_) => {
						next_line.clear();
						self.process_response(Response::Status(some_status));
						continue;
					},
				},

				Ok(response) => {
					next_line.clear();
					self.process_response(response);
					continue;
				},

				Err(ResponseDecodeError::Incomplete) => {
					// read one more line and try again
					continue;
				},

				Err(ResponseDecodeError::LiteralFound { .. }) => {
					unreachable!("Expect literal found to be handled inside parse response")
				},

				// response was literalFound? Incomplete?
				Err(ResponseDecodeError::Failed) => {
					log::warn!(
						"Cannot get the tagged response from server for {:?} What to do now?",
						expected_tag
					);
					Err(())
				},
			};
		}
	}
}

/// Credentials mechanism to use for authenticating the client
///
/// LOGIN command will be available in all imap server,
/// but this is the least secure way to authenticate. and simplest.
///
/// According to server capabilities, we can choose to perform login via any
/// SASL* (RFC 4422)  authentication mechanism.
///
/// Example:
/// Gmail IMAP server support OAUTH2,
/// and provides a custom `Authenticate` Command to do so.
/// this will require CommandContinuationRequests and hence is less
/// simple than LOGIN but this mechanism will be more "secured"
///
/// todo:
/// For now only care for PLAIN mechanism.
pub enum CredentialsMechanism {
	Plain,
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::tuta_imap::testing::utils::to_non_zero_u32;
	use crate::tuta_imap::testing::GreenMailTestServer;
	use imap_codec::imap_types::response::{Capability, StatusKind};

	#[test]
	fn can_refresh_capabilities() {
		let greenmail = GreenMailTestServer::new();
		let mut import_client = TutaImapClient::new("127.0.0.1", greenmail.imaps_port as u16);

		// refreshing multiple times should still result in same
		for _ in 0..3 {
			assert_eq!(StatusKind::Ok, import_client.refresh_capabilities());
			assert_eq!(
				Some(vec![
					Capability::Imap4Rev1,
					Capability::LiteralPlus,
					Capability::UidPlus,
					Capability::Sort(None),
					Capability::Idle,
					Capability::Move,
					Capability::Quota,
				]),
				import_client
					.capabilities
					.clone()
					.map(CapabilitiesList::into_inner)
			);
		}
	}

	#[test]
	fn can_login() {
		let greenmail = GreenMailTestServer::new();
		let mut import_client = TutaImapClient::new("127.0.0.1", greenmail.imaps_port as u16);

		// refreshing multiple times should still result in same
		assert_eq!(
			StatusKind::Ok,
			import_client.plain_login("sug@example.org", "sug")
		);
		assert_eq!(
			import_client.connection_state,
			ConnectionState::Authenticated
		);
	}

	#[test]
	fn select_inbox() {
		let greenmail = GreenMailTestServer::new();
		let mut import_client = TutaImapClient::new("127.0.0.1", greenmail.imaps_port as u16);

		import_client.plain_login("sug@example.org", "sug");

		// refreshing multiple times should still result in same
		assert_eq!(StatusKind::Ok, import_client.select_mailbox(Mailbox::Inbox));
		assert_eq!(
			import_client.connection_state,
			ConnectionState::Selected(Mailbox::Inbox)
		);
	}

	#[test]
	fn search_all_mail() {
		let greenmail = GreenMailTestServer::new();
		let mut import_client = TutaImapClient::new("127.0.0.1", greenmail.imaps_port as u16);

		// should find these two `sug` mails
		greenmail.store_mail("sug@example.org", "");
		greenmail.store_mail("sug@example.org", "");
		// should not find this `map` mail
		greenmail.store_mail("map@example.org", "");

		import_client.plain_login("sug@example.org", "sug");
		import_client.select_mailbox(Mailbox::Inbox);
		assert_eq!(StatusKind::Ok, import_client.search_all_uid());
		assert_eq!(
			to_non_zero_u32(&[1, 2]),
			import_client.latest_search_results
		);
	}

	#[test]
	fn fetch_mail() {
		let greenmail = GreenMailTestServer::new();
		let mut import_client = TutaImapClient::new("127.0.0.1", greenmail.imaps_port as u16);

		greenmail.store_mail("map@example.org", "Subject: =?UTF-8?B?bWEgdXRmLTgg4oKs?=");
		greenmail.store_mail("map@example.org", "Subject: Find me if you can");

		import_client.plain_login("map@example.org", "map");
		import_client.select_mailbox(Mailbox::Inbox);
		import_client.search_all_uid();

		let message_id = NonZeroU32::new(1).unwrap();
		assert_eq!(StatusKind::Ok, import_client.fetch_mail_by_uid(message_id));

		let imap_mail = import_client.latest_mails.get(&message_id).unwrap();
		let _parsed_mail = mail_parser::MessageParser::new()
			.parse(imap_mail.rfc822_full.as_slice())
			.unwrap();
		// assert_eq!(
		// 	&ImapMail {
		// 		subject: "=?UTF-8?B?bWEgdXRmLTgg4oKs?=".to_string()
		// 	},
		// 	import_client.latest_mails.get(&message_id).unwrap(),
		// );
	}
}
