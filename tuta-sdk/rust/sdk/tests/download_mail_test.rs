use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use std::collections::HashMap;
use std::sync::Arc;
use tutasdk::bindings::rest_client::{HttpMethod, RestClient};
use tutasdk::bindings::test_file_client::TestFileClient;
use tutasdk::bindings::test_rest_client::TestRestClient;
use tutasdk::entities::generated::tutanota::Mail;
use tutasdk::login::{CredentialType, Credentials};
use tutasdk::GeneratedId;
use tutasdk::{IdTupleGenerated, Sdk};

#[tokio::test]
async fn download_mail_with_logged_in_client() {
	let rest_client = make_rest_client();
	let file_client = Arc::new(TestFileClient::default());

	// password is qawsedrftgyh
	let encrypted_passphrase_key = BASE64_STANDARD.decode("AZWEA/KTrHu0bW52CsctsBTTV4U3jrU51TadSxf6Nqs3xbEs3WfoOpPtxUDCNjHNppt6LHCfgTioejjGUJ2cCsXosZAysUiau5Nvyi8mtjLz").unwrap();

	let credentials = Credentials {
		login: "bed-free@tutanota.de".to_string(),
		user_id: GeneratedId::from_str("O1qC700----0"),
		access_token: "ZC2NIBDACUABAdJhibIwclzaPU3fEu-NzQ".to_string(),
		encrypted_passphrase_key,
		credential_type: CredentialType::Internal,
	};
	let sdk = Sdk::new(
		"http://localhost:9000".to_string(),
		rest_client,
		file_client,
	);
	let logged_in_sdk = sdk.login(credentials).await.unwrap();
	let mail_facade = logged_in_sdk.mail_facade();
	let mail: Mail = mail_facade
		.load_untyped_mail(&IdTupleGenerated {
			list_id: GeneratedId::from_str("O1qC705-17-0"),
			element_id: GeneratedId::from_str("O1qC7an--3-0"),
		})
		.await
		.map(|decrypted| {
			logged_in_sdk
				.instance_mapper
				.parse_entity(decrypted)
				.unwrap()
		})
		.unwrap();

	assert_eq!("Html email features", mail.subject);
	assert_eq!(1, mail.recipientCount);
	assert_eq!("bed-free@tutanota.de", mail.firstRecipient.unwrap().address);
	assert_eq!("map-free@tutanota.de", mail.sender.address);
	assert_eq!("Matthias", mail.sender.name);
	assert_eq!(1721043814832, mail.receivedDate.as_millis());
}

fn make_rest_client() -> Arc<dyn RestClient> {
	let mut client = TestRestClient::new("http://localhost:9000");

	client.insert_response(
			"http://localhost:9000/rest/sys/Session/O1qC702-1J-0/3u3i8Lr9_7TnDDdAVw7w3TypTD2k1L00vIUTMF0SIPY",
							   HttpMethod::GET,
							   200,
			HashMap::default(),
							   Some(include_bytes!("download_mail_test/session.json"))
		);

	client.insert_response(
		"http://localhost:9000/rest/sys/User/O1qC700----0",
		HttpMethod::GET,
		200,
		HashMap::default(),
		Some(include_bytes!("download_mail_test/session.json")),
	);

	client.insert_response(
		"http://localhost:9000/rest/sys/User/O1qC700----0",
		HttpMethod::GET,
		200,
		HashMap::default(),
		Some(include_bytes!("download_mail_test/user.json")),
	);

	client.insert_response(
		"http://localhost:9000/rest/tutanota/Mail/O1qC705-17-0/O1qC7an--3-0",
		HttpMethod::GET,
		200,
		HashMap::default(),
		Some(include_bytes!("download_mail_test/mail.json")),
	);

	Arc::new(client)
}
