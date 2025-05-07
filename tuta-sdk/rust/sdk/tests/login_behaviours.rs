use std::sync::Arc;
use tutasdk::bindings::file_client::FileClient;
use tutasdk::bindings::test_file_client::TestFileClient;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::type_model_provider::TypeModelProvider;
use tutasdk::Sdk;

#[cfg_attr(
	not(feature = "test-with-local-http-server"),
	ignore = "require local `http server."
)]
#[tokio::test]
async fn logging_in_attempts_to_read_server_json_file() {
	let file_client_arc: Arc<dyn FileClient> = Arc::new(TestFileClient::default());

	let rest_client = NativeRestClient::try_new().unwrap();
	let file_client = unsafe {
		Arc::as_ptr(&file_client_arc)
			.cast::<TestFileClient>()
			.cast_mut()
			.as_mut()
			.unwrap()
	};

	Sdk::new(
		"http://localhost:9000".to_string(),
		Arc::new(rest_client),
		Arc::clone(&file_client_arc),
	)
	.create_session("map-free@tutanota.com", "map")
	.await
	.expect("Login failed");

	assert!(
		file_client
			.contains_file(TypeModelProvider::SERVER_TYPE_MODEL_JSON_FILE_NAME.to_string())
			.await
	);
}
