use std::sync::Arc;
use tutasdk::bindings::test_file_client::TestFileClient;
use tutasdk::contacts::contact_facade::ContactFacade;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::Sdk;

async fn create_contact_facade() -> Arc<ContactFacade> {
	const HOST: &str = "http://localhost:9000";

	let rest_client = NativeRestClient::try_new().unwrap();
	let file_client = TestFileClient::default();

	let sdk = Sdk::new(
		HOST.to_owned(),
		Arc::new(rest_client),
		Arc::new(file_client),
	);
	let session = sdk
		.create_session("arm-free@tutanota.de", "arm")
		.await
		.unwrap();

	session.contact_facade()
}

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn load_user_contacts() {
	let contact_facade = create_contact_facade().await;
	let contacts = contact_facade.load_all_user_contacts().await;

	assert_eq!(contacts.unwrap().iter().count(), 3);
	log::info!("Test::Loaded user contacts correctly!");
}
