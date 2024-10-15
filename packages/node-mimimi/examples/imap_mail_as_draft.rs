use std::sync::Arc;
use tutao_node_mimimi::imap::credentials::ImapCredentials;
use tutao_node_mimimi::imap::import_client::{ImapImport, ImapImportConfig};
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::{Sdk, CLIENT_VERSION};

/// 1. Start greenmail server
/// 	* Greenmail version atleast 2.1 is required earlier version had a bug of sending invalid `\*` flag
/// `java -Dgreenmail.setup.test.all -Dgreenmail.verbose -jar ./greenmail-standalone-2.1.0.jar`
///
/// 2. create default user
/// ```bash
/// curl -X POST "http://localhost:8080/api/user" \
///  -H 'accept: application/json'\
///  -H 'content-type: application/json' \
///  -d '{"email":"sug@localhost","login":"sug@localhost","password":"sug"}'
/// ```
///
/// 3. Add account in thunderbird with manual configuration.
/// 	* SMTP with host: .localhost, port: 3025 ( is smtp without ssl )
/// 	* IMAP: with host: .localhost, port: 3993 ( is imap with ssl i.e imaps )
///
/// 4. Send some mail ( by creating another account following step 2 ) or to sug@localhost
/// 	Can use html and all formatting
/// 	This example will always try to import the first mail. importing multiple is not implemented yet
///
/// 5. Start tutadb server on `http://localhost:9000` which should have this user `map-free@tutanota.de:map`
///
/// 6. Check the list of mails in `Draft` folder and run this example. Now the mail you wrote in step 4
/// 	should appear in draft folder.
/// 	* running this example multiple times will always import first mail of imap `SEARCH` command
///	6.1 in case of error, say "oops"
///
/// 7. smile :)
#[tokio::main]
async fn main() {
	let sdk = Sdk::new(
		"http://localhost:9000".to_string(),
		Arc::new(NativeRestClient::try_new().unwrap()),
		CLIENT_VERSION.to_string(),
	);
	let logged_in_sdk = sdk
		.create_session("map-free@tutanota.de", "map")
		.await
		.unwrap();
	let imap_import_config = ImapImportConfig {
		root_import_mail_folder_name: "/".to_string(),
		credentials: ImapCredentials {
			host: "127.0.0.1".to_string(),
			port: 3993.to_string(),
			username: Some("sug@localhost".to_string()),
			password: Some("sug".to_string()),
			access_token: None,
		},
		import_target_address: "map-free@tutanota.de".to_string(),
	};
	let mut importer = ImapImport::new(imap_import_config, logged_in_sdk);

	importer.continue_import().await;
}
