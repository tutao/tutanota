use mail_parser::MessageParser;
use std::borrow::Cow;
use std::collections::HashMap;
use tuta_imap::client::types::mail::ImapMail;
use tutasdk::custom_id::CustomId;
use tutasdk::entities::tutanota::{DraftCreateData, DraftCreateReturn, DraftData};

/// Input data for mail import service
#[derive(Debug)]
pub struct ImportableMail {
	pub subject: String,
	pub html_bodies: String,
	/// .0: mail address,
	/// .1: sender name,
	pub first_sender: (String, String),
}

/// Output response of server if mail import is success,
pub struct ImportedMailResponse {
	pub draft_id: tutasdk::IdTuple,
}

impl From<ImportableMail> for DraftCreateData {
	fn from(importable_mail: ImportableMail) -> Self {
		let ImportableMail {
			subject,
			html_bodies,
			first_sender: (first_sender_address, first_sender_name),
		} = importable_mail;

		let draft_create_data = DraftCreateData {
			_format: 0,
			conversationType: 0,
			ownerEncSessionKey: vec![],
			ownerKeyVersion: 0,
			previousMessageId: None,
			draftData: DraftData {
				subject,
				_id: CustomId::from_custom_string("aaaa"),
				bodyText: html_bodies,
				compressedBodyText: None,
				confidential: false,
				method: 0,
				// we want to keep the actual sender mail address in original mail,
				// but draftService requires that senderMailAddress is the current user of this draft,
				senderMailAddress: first_sender_address,
				senderName: first_sender_name,
				addedAttachments: vec![],
				bccRecipients: vec![],
				ccRecipients: vec![],
				removedAttachments: vec![],
				replyTos: vec![],
				toRecipients: vec![],
				_finalIvs: HashMap::new(),
			},
			_errors: None,
			_finalIvs: HashMap::new(),
		};

		draft_create_data
	}
}

impl TryFrom<ImapMail> for ImportableMail {
	type Error = ();
	fn try_from(imap_mail: ImapMail) -> Result<Self, Self::Error> {
		let ImapMail { rfc822_full } = imap_mail;

		// parse the full mime message
		let imap_mail = MessageParser::new()
			.parse(rfc822_full.as_slice())
			.ok_or(())?;

		Self::try_from(imap_mail)
	}
}

/// allow to convert from parsed message
impl<'x> TryFrom<mail_parser::Message<'x>> for ImportableMail {
	type Error = ();

	fn try_from(parsed_message: mail_parser::Message) -> Result<Self, Self::Error> {
		// extract subject and if not tutanota always keep empty subject
		let subject = parsed_message.subject().unwrap_or("").to_string();

		// extract the bodies
		let mut html_bodies = String::new();
		for body in parsed_message.html_bodies() {
			html_bodies += body.text_contents().ok_or(())?;
		}

		// get the .from address
		let mail_parser::Addr {
			name: first_sender_name,
			address: first_sender_address,
		} = parsed_message
			.from()
			.map(|sender| sender.first())
			.flatten()
			.unwrap_or(&mail_parser::Addr {
				name: None,
				address: None,
			});
		let first_sender = (
			first_sender_address
				.as_ref()
				.unwrap_or(&Cow::Borrowed(""))
				.to_string(),
			first_sender_name
				.as_ref()
				.unwrap_or(&Cow::Borrowed(""))
				.to_string(),
		);

		Ok(Self {
			subject,
			html_bodies,
			first_sender,
		})
	}
}

/// draft response can be converted to imported mail response
impl From<DraftCreateReturn> for ImportedMailResponse {
	fn from(draft_create_return: DraftCreateReturn) -> Self {
		Self {
			draft_id: draft_create_return.draft,
		}
	}
}
