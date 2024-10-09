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
