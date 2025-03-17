use crate::bindings::suspendable_rest_client::SuspensionBehavior;
use std::collections::HashMap;
use thiserror::Error;

#[derive(uniffi::Enum, Debug, PartialEq, Hash, Eq)]
pub enum HttpMethod {
	GET,
	POST,
	PUT,
	DELETE,
}

/// HTTP(S) data inserted by the `RestClient` in its REST requests
#[derive(uniffi::Record, Debug, Eq, PartialEq)]
pub struct RestClientOptions {
	pub headers: HashMap<String, String>,
	pub body: Option<Vec<u8>>,
	pub suspension_behavior: Option<SuspensionBehavior>,
}

/// An error thrown by the `RestClient` (the injected HTTP client Kotlin/Swift/JavaScript)
#[derive(Error, Debug, uniffi::Error, Eq, PartialEq, Clone)]
pub enum RestClientError {
	#[error("Network error")]
	NetworkError,
	#[error("Invalid URL")]
	InvalidURL,
	#[error("Failed handshake")]
	FailedHandshake,
	#[error("Invalid request")]
	InvalidRequest,
	#[error("Invalid response")]
	InvalidResponse,
	#[error("failed tls setup")]
	FailedTlsSetup,
	#[error("suspended")]
	Suspended,
}

/// Provides a Rust SDK level interface for performing REST requests
/// using the HTTP client injected by calling code (Kotlin/Swift/JavaScript)
#[uniffi::export(with_foreign)]
#[cfg_attr(test, mockall::automock)]
#[async_trait::async_trait]
pub trait RestClient: Send + Sync + 'static {
	/// Performs an HTTP request with binary data in its body using the injected HTTP client
	async fn request_binary(
		&self,
		url: String,
		method: HttpMethod,
		options: RestClientOptions,
	) -> Result<RestResponse, RestClientError>;
}

/// HTTP(S) data contained within a response from the backend
#[derive(uniffi::Record, Clone)]
pub struct RestResponse {
	pub status: u32,
	pub headers: HashMap<String, String>,
	pub body: Option<Vec<u8>>,
}

/// URL-encode some query params for appending them to the URL.
/// all the keys and values must be non-empty.
///
/// @return a full encoded query param string with leading '?' and '&' separated key value pairs
pub fn encode_query_params<Pairs, Keys, Values>(params: Pairs) -> String
where
	Pairs: IntoIterator<Item = (Keys, Values)>,
	Keys: AsRef<[u8]>,
	Values: AsRef<[u8]>,
{
	let encode = |slice: &[u8]| form_urlencoded::byte_serialize(slice).collect::<String>();

	let pairs = params
		.into_iter()
		.filter(|(k, v)| !k.as_ref().is_empty() && !v.as_ref().is_empty())
		.map(|(k, v)| (encode(k.as_ref()), encode(v.as_ref())))
		.map(|(k, v)| format!("{}={}", k, v))
		.collect::<Vec<_>>();

	if pairs.is_empty() {
		String::new()
	} else {
		format!("?{}", pairs.join("&"))
	}
}
