use imap_codec::imap_types::core::Vec1;
use imap_codec::imap_types::fetch::MessageDataItem;

#[derive(Eq, PartialEq, Debug)]
pub struct ImapMail {
    pub subject: String,
}

impl ImapMail {
    pub fn new(items: Vec1<MessageDataItem>) -> Self {
        let mut imap_mail = ImapMail {
            subject: String::new(),
        };

        for item in items {
            match item {
                MessageDataItem::Envelope(envelope) => {
                    imap_mail.subject =
                        String::from_utf8(envelope.subject.0.unwrap().into_inner().to_vec())
                            .unwrap()
                }

                _ => (),
            }
        }
        imap_mail
    }
}
