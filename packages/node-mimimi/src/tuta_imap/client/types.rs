use imap_codec::imap_types::core::Vec1;
use imap_codec::imap_types::fetch::MessageDataItem;

#[derive(Eq, PartialEq, Debug)]
pub struct ImapMail {
	pub rfc822_full: Vec<u8>,
}

impl ImapMail {
	pub fn new(items: Vec1<MessageDataItem>) -> Self {
		let mut imap_mail = ImapMail {
			rfc822_full: Vec::new(),
		};

		for item in items {
			match item {
				MessageDataItem::Rfc822(rfc822_text) => {
					imap_mail.rfc822_full = rfc822_text.0.unwrap().into_inner().to_vec();
				},

				MessageDataItem::Envelope(_envelope) => {},
				MessageDataItem::Body(_) => {},
				MessageDataItem::BodyExt { .. } => {},
				MessageDataItem::BodyStructure(_) => {},
				MessageDataItem::Flags(_) => {},
				MessageDataItem::InternalDate(_) => {},
				MessageDataItem::Rfc822Text(_) => {},
				MessageDataItem::Rfc822Header(_) => {},
				MessageDataItem::Rfc822Size(_) => {},
				MessageDataItem::Uid(_) => {},
				MessageDataItem::Binary { .. } => {},
				MessageDataItem::BinarySize { .. } => {},
			}
		}
		imap_mail
	}
}
