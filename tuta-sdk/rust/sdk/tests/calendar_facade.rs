use std::sync::Arc;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::Sdk;

#[tokio::test]
async fn load_user_calendars() {
	const HOST: &str = "http://localhost:9000";

	let rest_client = NativeRestClient::try_new().unwrap();
	let sdk = Sdk::new(HOST.to_owned(), Arc::new(rest_client));
	let session = sdk
		.create_session("map-free@tutanota.de", "map")
		.await
		.unwrap();

	let calendar_facade = session.calendar_facade();
	let calendars = calendar_facade.fetch_calendars_data().await.unwrap();

	// FIXME The user wont have a calendar before the first login on the client
	// FIXME Birthdays calendar wont show up since its generated and managed client side only
	assert_eq!(calendars.len(), 0);
}
