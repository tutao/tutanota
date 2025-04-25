use crate::bindings::rest_client::{
	HttpMethod, RestClient, RestClientError, RestClientOptions, RestResponse,
};
use std::collections::HashMap;

pub struct TestRestClient {
	responses: HashMap<TestRestRequest, RestResponse>,
}

impl TestRestClient {
	pub fn new(base_url: &str) -> Self {
		let mut client = TestRestClient {
			responses: Default::default(),
		};

		let application_get_out = crate::type_model_provider::ApplicationTypesGetOut {
			model_types_as_string: serde_json::to_string(
				&crate::type_model_provider::CLIENT_TYPE_MODEL.apps,
			)
			.unwrap(),
			current_application_hash: "latest-applications-hash".to_string(),
		};
		let serialized_json = serde_json::to_string(&application_get_out).unwrap();
		let compressed_response = lz4_flex::compress(serialized_json.as_bytes());
		let response = RestResponse {
			status: 200,
			headers: Default::default(),
			body: Some(compressed_response),
		};
		let mocked_request = TestRestRequest {
			url: format!("{base_url}/rest/base/applicationtypesservice"),
			method: HttpMethod::GET,
		};
		client.responses.insert(mocked_request, response);

		client
	}
}

impl TestRestClient {
	pub fn insert_response(
		&mut self,
		url: &str,
		method: HttpMethod,
		status: u32,
		headers: HashMap<String, String>,
		response_body: Option<&[u8]>,
	) {
		let headers = [(
			"app-types-hash".to_string(),
			"latest-applications-hash".to_string(),
		)]
		.into_iter()
		.chain(headers.into_iter())
		.collect();

		self.responses.insert(
			TestRestRequest {
				url: url.to_owned(),
				method,
			},
			RestResponse {
				status,
				headers,
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
