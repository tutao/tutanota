pub mod mail;

pub mod reexports {
    pub use imap_codec::imap_types::mailbox::Mailbox;
    pub use imap_codec::imap_types::response::StatusKind;
}
