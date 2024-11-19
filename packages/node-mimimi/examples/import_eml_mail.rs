#[cfg(not(feature = "javascript"))]
#[tokio::main]
async fn main() {
	use std::sync::Mutex;
	use tutao_node_mimimi::importer::file_reader::import_client::FileImport;

	use std::sync::Arc;
	use tutao_node_mimimi::importer::imap_reader::{
		import_client::ImapImport, ImapCredentials, ImapImportConfig, LoginMechanism,
	};
	use tutao_node_mimimi::importer::{ImportSource, ImportStatus, ImporterApi};
	use tutasdk::folder_system::MailSetKind;
	use tutasdk::net::native_rest_client::NativeRestClient;
	use tutasdk::Sdk;

	let sdk = Sdk::new(
		"http://localhost:9000".to_string(),
		Arc::new(NativeRestClient::try_new().unwrap()),
	);
	let logged_in_sdk = sdk
		.create_session("map-premium@tutanota.de", "map")
		.await
		.unwrap();
	let import_source = ImportSource::LocalFile {
		fs_email_client: FileImport::new(get_file_paths()).unwrap(),
	};

	let mail_facade = logged_in_sdk.mail_facade();
	let mailbox = mail_facade.load_user_mailbox().await.unwrap();
	let folders = mail_facade
		.load_folders_for_mailbox(&mailbox)
		.await
		.unwrap();
	let inbox_folder = folders
		.system_folder_by_type(MailSetKind::Inbox)
		.expect("inbox should exist");

	let id = logged_in_sdk
		.mail_facade()
		.get_group_id_for_mail_address("map-premium@tutanota.de")
		.await
		.unwrap();
	let mut importer = ImporterApi::new(
		logged_in_sdk,
		id,
		inbox_folder._id.clone().unwrap(),
		Arc::new(Mutex::new(import_source)),
	);

	let import_status = importer
		.continue_import_inner()
		.await
		.expect("Cannot complete import");
	assert!(ImportState::Finished == import_status.state,);
	assert!(import_status.imported_mails > 0);
}

#[cfg(feature = "javascript")]
fn main() {
	panic!("Only runnable without javascript feature ");
}

fn get_file_paths() -> Vec<String> {
	let Ok(paths) = std::fs::read_dir("./examples/testmail") else {
		panic!("could not load test mail files names, are you in the node-mimimi project root?")
	};
	paths
		.map(|path| path.unwrap().path().to_str().unwrap().to_owned())
		.collect()
}
