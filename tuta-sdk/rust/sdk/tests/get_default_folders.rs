use std::error::Error;
use std::sync::Arc;
use tutasdk::folder_system::MailSetKind;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::Sdk;

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error>> {
	// replace with real values
	let host = "http://localhost:9000";

	let rest_client = NativeRestClient::try_new().unwrap();
	let sdk = Sdk::new(host.to_owned(), Arc::new(rest_client));
	let session = sdk.create_session("map-free@tutanota.de", "map").await?;
	let mail_facade = session.mail_facade();

	let mailbox = mail_facade.load_user_mailbox().await?;

	let folders = mail_facade.load_folders_for_mailbox(&mailbox).await?;
	let inbox = folders
		.system_folder_by_type(MailSetKind::Inbox)
		.expect("inbox exists");

	println!("Inbox exists");
	Ok(())
}
