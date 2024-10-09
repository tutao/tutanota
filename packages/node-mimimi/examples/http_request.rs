use tutasdk::net::native_rest_client::NativeRestClient;
use tutasdk::rest_client::{HttpMethod, RestClient, RestClientOptions};
fn main() -> Result<(), &'static str> {
	let mut runtime_builder = napi::tokio::runtime::Builder::new_current_thread();
	let runtime_builder = runtime_builder.enable_all();
	let Ok(runtime) = runtime_builder.build() else {
		panic!("could not initialize tokio runtime");
	};

	runtime.block_on(async_main())
}

async fn async_main() -> Result<(), &'static str> {
	println!("starting a request");

	let url = "https://echo.free.beeceptor.com";

	let rest_client: NativeRestClient =
		NativeRestClient::try_new().expect("failed to get rest client");
	let response_pending = rest_client
		.request_binary(
			url.to_string(),
			HttpMethod::GET,
			RestClientOptions {
				headers: Default::default(),
				body: Default::default(),
			},
		)
		.await;

	let response = match response_pending {
		Ok(res) => res,
		Err(err) => panic!("failed to get response: {:?}", err),
	};

	println!("response status is {:?}", response.status);
	println!(
		"response body is {:?}",
		response.body.map(|v| String::from_utf8(v))
	);

	Ok(())
}
