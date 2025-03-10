use std::error::Error;
use std::sync::Arc;
use tutasdk::bindings::test_file_client::TestFileClient;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::Sdk;

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local http server."
)]
#[tokio::test]
async fn sdk_can_create_new_session() -> Result<(), Box<dyn Error>> {
	let rest_client = Arc::new(NativeRestClient::try_new().unwrap());
	let file_client = Arc::new(TestFileClient::default());

	// this test expect local server with matching model versions to be live at: http://localhost:9000
	let sdk = Sdk::new(
		"http://localhost:9000".to_string(),
		rest_client.clone(),
		file_client,
	);

	sdk.create_session("map-free@tutanota.de", "map")
		.await
		.map(|_| ())?;

	Ok(())
}
