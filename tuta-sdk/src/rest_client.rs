use std::collections::HashMap;
use thiserror::Error;

#[derive(uniffi::Enum)]
pub enum HttpMethod {
    GET,
    POST,
    PUT,
    DELETE,
}

#[derive(uniffi::Record)]
pub struct RestClientOptions {
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
}

#[derive(Error, Debug, uniffi::Error)]
pub enum RestClientError {
    #[error("Network error")]
    NetworkError,
}

#[derive(uniffi::Record)]
pub struct RestResponse {
    pub status: u32,
    pub body: Option<Vec<u8>>
}

#[uniffi::export(with_foreign)]
#[async_trait::async_trait]
pub trait RestClient: Send + Sync {
    async fn request_binary(
        &self,
        url: String,
        method: HttpMethod,
        options: RestClientOptions,
    ) -> Result<RestResponse, RestClientError>;
}
