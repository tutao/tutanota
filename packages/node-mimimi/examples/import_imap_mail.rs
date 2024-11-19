use std::sync::Mutex;

/// How to: Import IMAP mail from Greenmail to TutaMail
///
///
/// 1. Start GreenMail server
/// 	* A greenmail version >= 2.1 is required
/// 	`java -Dgreenmail.setup.test.all -Dgreenmail.verbose -jar ./greenmail-standalone-2.1.0.jar`
///
/// 2. Create default user
/// 	```
/// 	curl -X POST "http://localhost:8080/api/user" -H 'accept: application/json' -H 'content-type: application/json' -d '{"email":"sug@localhost","login":"sug@localhost","password":"sug"}'
/// 	```
///
/// 3. Add account in Thunderbird with manual configuration (type in user credentials and then click on "configure manually").
/// 	* IMAP: with host: .localhost, port: 3143, connection security: None, authentication method: Normal password,  (imap_reader without SSL)
/// 	* SMTP with host: .localhost, port: 3025, connection security: None, authentication method: Normal password (smtp without SSL)
///
/// 4. Send Some Mail (by creating another account following step 2) to sug@localhost
/// 	* We can use HTML and all kinds of formatting.
/// 	* This example will always try to import the first mail. Importing multiple mails is not implemented yet.
///
/// 5. Start tutadb server on `http://localhost:9000` which should have this user `map-premium@tutanota.de:map`
///
/// 6. Check the list of mails in the `Draft` folder and run this example.
/// 	* Now the mail you wrote in step 4 should appear in draft folder.
/// 	* Running this example multiple times will always import first mail retrieved by the imap_reader `SEARCH` command.
///
/// 7. Smile :)
#[cfg(not(feature = "javascript"))]
#[tokio::main]
async fn main() {
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
	let imap_import_config = ImapImportConfig {
		root_import_mail_folder_name: "/".to_string(),
		credentials: ImapCredentials {
			host: "127.0.0.1".to_string(),
			port: 3993,
			login_mechanism: LoginMechanism::Plain {
				username: "sug@localhost".to_string(),
				password: "sug".to_string(),
			},
		},
	};

	let import_source = ImportSource::RemoteImap {
		imap_import_client: ImapImport::new(imap_import_config),
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
	panic!("Can not run this example in javascript environment");
}
