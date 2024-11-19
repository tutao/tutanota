use tutasdk::bindings::rest_client::RestResponse;
use tutasdk::bindings::rest_client::{HttpMethod, RestClient, RestClientOptions};
use tutasdk::net::native_rest_client::NativeRestClient;

#[tokio::main]
async fn main() {
	const URL: &str = "https://echo.free.beeceptor.com";
	let rest_client: NativeRestClient =
		NativeRestClient::try_new().expect("failed to get rest client");
	let response_pending = rest_client
		.request_binary(
			URL.to_string(),
			HttpMethod::GET,
			RestClientOptions {
				headers: Default::default(),
				body: Default::default(),
				suspension_behavior: Default::default(),
			},
		)
		.await;

	let RestResponse {
		status,
		headers: _,
		body: _,
	} = response_pending.expect("Failed to get response.");
	assert_eq!(200, status);
}
