use crate::net::vec_body::{VecBody, VecBuf};
use crate::rest_client::{
	HttpMethod, RestClient, RestClientError, RestClientOptions, RestResponse,
};
use http_body_util::{BodyExt, Full};
use hyper::body::Incoming;
use hyper::http::HeaderValue;
use hyper::{HeaderMap, Request, Response};
use hyper_rustls::HttpsConnector;
use hyper_util::client::legacy::connect::HttpConnector;
use hyper_util::client::legacy::Client;
use hyper_util::rt::TokioExecutor;
use std::collections::HashMap;

pub struct NativeRestClient {
	client: Client<HttpsConnector<HttpConnector>, VecBody>,
}

impl NativeRestClient {
	pub fn try_new() -> Result<Self, std::io::Error> {
		let _ = rustls::crypto::ring::default_provider().install_default();

		let https_conn = hyper_rustls::HttpsConnectorBuilder::new()
			.with_native_roots()?
			.https_or_http()
			.enable_all_versions()
			.build();

		let client = Client::builder(TokioExecutor::new()).build(https_conn);

		Ok(NativeRestClient { client })
	}
}

#[async_trait::async_trait]
impl RestClient for NativeRestClient {
	async fn request_binary(
		&self,
		url: String,
		method: HttpMethod,
		options: RestClientOptions,
	) -> Result<RestResponse, RestClientError> {
		let RestClientOptions { headers, body } = options;
		let uri = super::uri::Uri::try_from(url.as_str())?;

		let req = Request::builder()
			.header(hyper::header::HOST, uri.authority())
			.uri(uri.inner());

		let mut req = match method {
			HttpMethod::GET => req.method("GET"),
			HttpMethod::POST => req.method("POST"),
			HttpMethod::PUT => req.method("PUT"),
			HttpMethod::DELETE => req.method("DELETE"),
		};

		for (header_name, header_value) in headers {
			req = req.header(header_name, header_value);
		}

		let req: Request<VecBody> = match body {
			Some(bytes) => req.body(VecBuf(bytes).into()),
			None => req.body(Full::default()),
		}
		.map_err(|_| RestClientError::InvalidRequest)?;

		let mut res = self
			.client
			.request(req)
			.await
			.map_err(|_| RestClientError::NetworkError)?;

		let response_body = read_body(&mut res).await?;

		Ok(RestResponse {
			status: res.status().as_u16().into(),
			headers: read_headers(res.headers())?,
			body: if response_body.is_empty() {
				None
			} else {
				Some(response_body)
			},
		})
	}
}

fn read_headers(
	header_map: &HeaderMap<HeaderValue>,
) -> Result<HashMap<String, String>, RestClientError> {
	let mut headers = HashMap::new();
	for (name, values) in header_map {
		let name_str = name.as_str();
		let value_str = values
			.to_str()
			.map_err(|_| RestClientError::InvalidResponse)?;
		headers.insert(name_str.to_string(), value_str.to_string());
	}
	Ok(headers)
}

async fn read_body(res: &mut Response<Incoming>) -> Result<Vec<u8>, RestClientError> {
	let mut body: Vec<u8> = vec![];
	while let Some(next) = res.frame().await {
		let frame = next.map_err(|_| RestClientError::InvalidResponse)?;
		if let Some(chunk) = frame.data_ref() {
			body.append(&mut chunk.to_vec());
		}
	}

	Ok(body)
}
