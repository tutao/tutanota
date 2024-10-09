use crate::client::tls_stream::TlsStream;
use crate::client::types::mail::ImapMail;
use imap_codec::decode::{Decoder, ResponseDecodeError};
use imap_codec::encode::Encoder;
use imap_codec::imap_types::core::Tag;
use imap_codec::imap_types::mailbox::Mailbox;
use imap_codec::imap_types::response::{
    CommandContinuationRequest, Data, Response, Status, StatusBody, StatusKind,
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

pub struct TutanotaImapClient {
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
impl TutanotaImapClient {
    /// Construct a new client
    /// as well as:
    /// - listen ( &discard ) the greetings & SSL messages
    /// - refresh capabilities once
    /// - perform login
    pub fn start_new_session(imaps_port: i32) -> Self {
        let tls_stream = TlsStream::new("127.0.0.1", imaps_port as u16);

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
        client.read_until_next_untagged_status().unwrap();
        client.connection_state = ConnectionState::Greeting;

        // refresh the capabilities
        client.refresh_capabilities();

        // return the updated client
        client
    }

    /// try to refresh the capability from server by executing CAPABILITIES command
    pub fn refresh_capabilities(&mut self) -> response::StatusKind {
        let capability_command = imap_types::command::Command {
            tag: self.create_tag(),
            body: imap_types::command::CommandBody::Capability,
        };
        let capability_response = self
            .execute_command_directly(capability_command)
            .unwrap()
            .unwrap();

        capability_response.kind
    }

    pub fn login(&mut self, username: &str, password: &str) -> response::StatusKind {
        let login_command = imap_types::command::Command {
            tag: self.create_tag(),
            body: imap_types::command::CommandBody::Login {
                username: username.try_into().unwrap(),
                password: Secret::new(password.try_into().unwrap()),
            },
        };
        let login_response = self
            .execute_command_directly(login_command)
            .unwrap()
            .unwrap();
        let status_kind = login_response.kind.clone();

        if status_kind == response::StatusKind::Ok {
            self.connection_state = ConnectionState::Authenticated;
        }

        status_kind
    }

    /// List all the mailbox available
    pub fn list_mailbox(&mut self) {}

    /// Select a mailbox
    ///
    /// Caller should already invoke `list_mailbox`  function before calling this
    pub fn select_mailbox(&mut self, mailbox: Mailbox) -> StatusKind {
        assert_eq!(
            ConnectionState::Authenticated,
            self.connection_state,
            "must be in authenticated state to select mailbox"
        );
        let select_command = imap_types::command::Command {
            tag: self.create_tag(),
            body: imap_types::command::CommandBody::Select { mailbox },
        };

        let select_response = self
            .execute_command_directly(select_command)
            .unwrap()
            .unwrap();
        let status_kind = select_response.kind;
        if status_kind == response::StatusKind::Ok {
            self.connection_state = ConnectionState::Selected(Mailbox::Inbox)
        }
        status_kind
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

        let search_all_command = self
            .execute_command_directly(search_all_command)
            .unwrap()
            .unwrap();
        let status_kind = search_all_command.kind;
        status_kind
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
                macro_or_item_names: imap_types::fetch::Macro::All.into(),
            },
        };

        let search_all_command = self
            .execute_command_directly(fetch_command)
            .unwrap()
            .unwrap();
        let status_kind = search_all_command.kind;
        status_kind
    }
}

/// Implement direct helper function divisions

impl TutanotaImapClient {
    fn create_tag(&mut self) -> Tag<'static> {
        Tag::try_from("tag").unwrap()
    }

    fn start_tls(&mut self) -> Result<(), ()> {
        Ok(())
    }

    fn read_until_next_untagged_status(&mut self) -> Result<StatusBody, ()> {
        loop {
            let mut response_bytes = self.tls_stream.read_until_crlf().unwrap();

            let response = self
                .parse_response(&mut response_bytes)
                .unwrap()
                .to_static();

            match &response {
                Response::Status(Status::Untagged(status_body))
                | Response::Status(Status::Tagged(response::Tagged {
                    tag: _,
                    body: status_body,
                })) => return Ok(status_body.to_owned()),

                Response::Status(_)
                | Response::Data(_)
                | Response::CommandContinuationRequest(_) => todo!(),
            }
        }
    }

    // Use any untagged data response to update the state
    fn process_data_response(&mut self, data_response: Data) {
        match data_response {
            Data::Capability(list) => self.capabilities = Some(list.to_static()),
            Data::Search(list) => self.latest_search_results = list.to_static(),
            Data::Fetch { seq, items } => {
                self.latest_mails.insert(seq, ImapMail::new(items));
            }

            anything_else => {
                log::warn!("Do not know yet how to handle: {anything_else:?}")
            }
        }
    }

    // command continuation request
    fn process_cmd_continutation_response(
        &self,
        cmd_continutation_response: CommandContinuationRequest,
    ) -> Result<(), ()> {
        Ok(())
    }

    /// Process any response parsed.
    fn process_response(&mut self, response: Response) {
        match response {
            Response::Data(untagged_data) => {
                self.process_data_response(untagged_data);
            }
            Response::Status(status) => match status {
                Status::Untagged(untagged_status) => {
                    log::warn!("Received untagged status: {:?}", untagged_status);
                }
                Status::Tagged(response::Tagged { tag, body }) => {
                    self.unreceived_status
                        .insert(tag.to_static(), body.to_static());
                }
                Status::Bye(response_bye) => {
                    log::warn!("Received bye from server. byeeeee.");
                    self.connection_state = ConnectionState::Logout;
                }
            },
            Response::CommandContinuationRequest(cmd_continuation) => {
                self.process_cmd_continutation_response(cmd_continuation)
                    .unwrap();
            }
        }
    }

    /// returns if response bytes is incomplete
    fn parse_response(&mut self, response_bytes: &mut Vec<u8>) -> Option<Response> {
        if response_bytes.is_empty() {
            None?;
        }

        let response = self.response_codec.decode(response_bytes.as_ref());
        match response {
            Ok((_left_over, response)) => {
                log::info!("Got response to be: `{:?}`", response);
                Some(response.to_static())
            }

            // if this is incomplete,
            // save this might have to re-read again once we get remaining of response
            Err(ResponseDecodeError::Incomplete) => {
                log::warn!(
                    "Got an incomplete response from server. Saving it: `{}`",
                    String::from_utf8(response_bytes.to_vec()).unwrap()
                );
                None
            }
            Err(ResponseDecodeError::Failed) => {
                log::error!(
                    "Found a response: {}. But failed to decode. Ignoring...",
                    String::from_utf8(response_bytes.to_vec()).unwrap()
                );
                None
            }
            Err(ResponseDecodeError::LiteralFound { length }) => {
                log::warn!(
                    "Literal found for response: {}",
                    String::from_utf8(response_bytes.to_vec()).unwrap()
                );

                // read everything remaining
                let mut remaining_literal = Vec::with_capacity(length as usize);
                self.tls_stream.read_exact(&mut remaining_literal).unwrap();
                response_bytes.append(&mut remaining_literal);

                // try again
                self.parse_response(response_bytes)
            }
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
    ) -> Result<Option<StatusBody>, ()> {
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

        loop {
            // we assume we get at least one line of response with every command
            // otherwise we will wait here forever,
            // unless we get any other response ( which is still not ok because we check for this tag later on)
            let mut next_line = self.tls_stream.read_until_crlf().unwrap();
            if next_line.is_empty() {
                return Ok(None);
            }

            let maybe_cmd_status = self.parse_response(&mut next_line).map(|r| r.to_static());
            match maybe_cmd_status {
                // if it's the tagged response
                // with the same tag as of command
                Some(Response::Status(Status::Tagged(response::Tagged { tag, body })))
                    if &tag == &command.tag =>
                {
                    return Ok(Some(body.to_owned()))
                }

                // if response is something else,
                // process the command and loop back
                Some(response) => self.process_response(response),

                // response was literalFound? Incomplete?
                None => {
                    log::warn!("Cannot get the tagged response from server for.. What to do now?")
                }
            }
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
    use crate::client::{CapabilitiesList, TutanotaImapClient};
    use crate::testing::utils::toNonZeroU32;
    use crate::testing::GreenMailTestServer;
    use imap_codec::imap_types::response::{Capability, StatusKind};

    #[test]
    fn can_refresh_capabilities() {
        let greenmail = GreenMailTestServer::new();
        let mut import_client = TutanotaImapClient::start_new_session(greenmail.imaps_port);

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
        let mut import_client = TutanotaImapClient::start_new_session(greenmail.imaps_port);

        // refreshing multiple times should still result in same
        assert_eq!(
            StatusKind::Ok,
            import_client.login("sug@example.org", "sug")
        );
        assert_eq!(
            import_client.connection_state,
            ConnectionState::Authenticated
        );
    }

    #[test]
    fn select_inbox() {
        let greenmail = GreenMailTestServer::new();
        let mut import_client = TutanotaImapClient::start_new_session(greenmail.imaps_port);

        import_client.login("sug@example.org", "sug");

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
        let mut import_client = TutanotaImapClient::start_new_session(greenmail.imaps_port);

        // should find these two `sug` mails
        greenmail.store_mail("sug@example.org", "");
        greenmail.store_mail("sug@example.org", "");
        // should not find this `map` mail
        greenmail.store_mail("map@example.org", "");

        import_client.login("sug@example.org", "sug");
        import_client.select_mailbox(Mailbox::Inbox);
        assert_eq!(StatusKind::Ok, import_client.search_all_uid());
        assert_eq!(toNonZeroU32(&[1, 2]), import_client.latest_search_results);
    }

    #[test]
    fn fetch_mail() {
        let greenmail = GreenMailTestServer::new();
        let mut import_client = TutanotaImapClient::start_new_session(greenmail.imaps_port);

        greenmail.store_mail("map@example.org", "Subject: =?UTF-8?B?bWEgdXRmLTgg4oKs?=");
        greenmail.store_mail("map@example.org", "Subject: Find me if you can");

        import_client.login("map@example.org", "map");
        import_client.select_mailbox(Mailbox::Inbox);
        import_client.search_all_uid();

        let message_id = NonZeroU32::new(1).unwrap();
        assert_eq!(StatusKind::Ok, import_client.fetch_mail_by_uid(message_id));
        assert_eq!(
            &ImapMail {
                subject: "=?UTF-8?B?bWEgdXRmLTgg4oKs?=".to_string()
            },
            import_client.latest_mails.get(&message_id).unwrap(),
        );
    }
}
