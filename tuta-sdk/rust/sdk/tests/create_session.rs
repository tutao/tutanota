use std::error::Error;
use std::sync::Arc;
use tutasdk::bindings::rest_client::{encode_query_params, HttpMethod};
use tutasdk::bindings::test_file_client::TestFileClient;
use tutasdk::bindings::test_rest_client::TestRestClient;
use tutasdk::login::LoginError;
use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::rest_error::HttpError;
use tutasdk::{ApiCallError, Sdk};

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

#[tokio::test]
async fn create_session_rejects_bcrypt() {
	let result = sdk_with_kdf(0)
		.create_session("map-free@tutanota.de", "map")
		.await;

	assert_eq!(
		result.err(),
		Some(LoginError::ApiCall {
			source: ApiCallError::internal("Bcrypt passphrase keys are not implemented".to_owned()),
		})
	);
}

#[tokio::test]
async fn create_session_rejects_unknown_kdf() {
	let result = sdk_with_kdf(2)
		.create_session("map-free@tutanota.de", "map")
		.await;

	assert_eq!(
		result.err(),
		Some(LoginError::ApiCall {
			source: ApiCallError::internal("Failed to convert int 2 into KdfType".to_owned()),
		})
	);
}

#[tokio::test]
async fn create_session_with_argon2id_calls_session_service() {
	let result = sdk_with_kdf(1)
		.create_session("map-free@tutanota.de", "map")
		.await;

	assert_eq!(
		result.err(),
		Some(LoginError::ApiCall {
			source: ApiCallError::ServerResponseError {
				source: HttpError::NotFoundError,
			},
		})
	);
}

fn sdk_with_kdf(kdf_version: i64) -> Sdk {
	let mut client = TestRestClient::new("http://localhost:9000");
	let salt = serde_json::json!({
		"421": "0",
		"422": "BwcHBwcHBwcHBwcHBwcHBw==",
		"2133": kdf_version.to_string(),
	});
	// Entity fields are serialized from a HashMap, in either order.
	for body in [
		r#"{"418":"0","419":"map-free@tutanota.de"}"#,
		r#"{"419":"map-free@tutanota.de","418":"0"}"#,
	] {
		let url = format!(
			"http://localhost:9000/rest/sys/saltservice{}",
			encode_query_params([("_body", body)])
		);
		client.insert_response(
			&url,
			HttpMethod::GET,
			200,
			Default::default(),
			Some(&serde_json::to_vec(&salt).unwrap()),
		);
	}
	// Any session request for an unsupported KDF fails in TestRestClient.
	if kdf_version == 1 {
		client.insert_response(
			"http://localhost:9000/rest/sys/sessionservice",
			HttpMethod::POST,
			404,
			Default::default(),
			None,
		);
	}
	Sdk::new(
		"http://localhost:9000".to_string(),
		Arc::new(client),
		Arc::new(TestFileClient::default()),
	)
}
