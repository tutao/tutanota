use std::collections::HashMap;
use tutasdk::rest_client::{
	HttpMethod, RestClient, RestClientError, RestClientOptions, RestResponse,
};

#[derive(Default)]
pub struct TestRestClient {
	pub responses: HashMap<TestRestRequest, RestResponse>,
}

impl TestRestClient {
	pub fn insert_response(
		&mut self,
		url: &str,
		method: HttpMethod,
		status: u32,
		response_body: Option<&[u8]>,
	) {
		self.responses.insert(
			TestRestRequest {
				url: url.to_owned(),
				method,
			},
			RestResponse {
				status,
				headers: HashMap::new(),
				body: response_body.map(|v| v.to_vec()),
			},
		);
	}
}

#[derive(Hash, PartialEq, Eq)]
pub struct TestRestRequest {
	pub url: String,
	pub method: HttpMethod,
}

#[async_trait::async_trait]
impl RestClient for TestRestClient {
	async fn request_binary(
		&self,
		url: String,
		method: HttpMethod,
		_options: RestClientOptions,
	) -> Result<RestResponse, RestClientError> {
		for i in &self.responses {
			if i.0.url == url && i.0.method == method {
				return Ok(i.1.to_owned());
			}
		}
		panic!("TestRestClient - NOT IMPLEMENTED: {url}@{method:?}");
	}
}
