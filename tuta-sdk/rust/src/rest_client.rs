use std::collections::HashMap;

use mockall::automock;
use thiserror::Error;

#[derive(uniffi::Enum)]
pub enum HttpMethod {
    GET,
    POST,
    PUT,
    DELETE,
}

/// HTTP(S) data inserted by the `RestClient` in its REST requests
#[derive(uniffi::Record)]
pub struct RestClientOptions {
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
}

/// An error thrown by the `RestClient` (the injected HTTP client Kotlin/Swift/JavaScript)
#[derive(Error, Debug, uniffi::Error)]
pub enum RestClientError {
    #[error("Network error")]
    NetworkError,
}

/// HTTP(S) data contained within a response from the backend
#[derive(uniffi::Record)]
pub struct RestResponse {
    pub status: u32,
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
}

/// Provides a Rust SDK level interface for performing REST requests
/// using the HTTP client injected by calling code (Kotlin/Swift/JavaScript)
#[uniffi::export(with_foreign)]
#[automock]
#[async_trait::async_trait]
pub trait RestClient: Send + Sync {
    /// Performs an HTTP request with binary data in its body using the injected HTTP client
    async fn request_binary(
        &self,
        url: String,
        method: HttpMethod,
        options: RestClientOptions,
    ) -> Result<RestResponse, RestClientError>;
}