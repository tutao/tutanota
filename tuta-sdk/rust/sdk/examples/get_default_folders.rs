use std::error::Error;
use std::sync::Arc;
use tutasdk::folder_system::MailSetKind;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::GeneratedId;
use tutasdk::Sdk;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	use base64::prelude::*;

	// replace with real values
	let host = "http://localhost:9000";
	let credentials = Credentials {
		login: "bed-free@tutanota.de".to_owned(),
		access_token: "access_token".to_owned(),
		credential_type: CredentialType::Internal,
		user_id: GeneratedId("user_id".to_owned()),
		encrypted_passphrase_key: BASE64_STANDARD.decode("encrypted_passphrase_key").unwrap(),
	};

	let rest_client = NativeRestClient::try_new().unwrap();
	let sdk = Sdk::new(host.to_owned(), Arc::new(rest_client));
	let session = sdk.login(credentials).await?;
	let mail_facade = session.mail_facade();

	let mailbox = mail_facade.load_user_mailbox().await?;

	let folders = mail_facade.load_folders_for_mailbox(&mailbox).await?;
	let inbox = folders
		.system_folder_by_type(MailSetKind::Inbox)
		.expect("inbox exists");
	let inbox_mails = mail_facade.load_mails_in_folder(inbox).await?;

	println!("Inbox:");
	for mail in inbox_mails {
		let sender_arg = if mail.sender.name.is_empty() {
			format!("<{}>", mail.sender.address)
		} else {
			format!("{} <{}>", mail.sender.name, mail.sender.address)
		};
		println!("{0: <40}\t{1: <40}", sender_arg, mail.subject)
	}
	Ok(())
}
