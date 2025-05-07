use thiserror::Error;

#[derive(Error, Debug, uniffi::Error, Eq, PartialEq, Clone)]
pub enum FileClientError {
	#[error("File not found")]
	NotFound,
	#[error("Cannot access file system")]
	Fatal,
}

#[uniffi::export(with_foreign)]
#[cfg_attr(test, mockall::automock)]
#[async_trait::async_trait]
pub trait FileClient: Send + Sync + 'static {
	async fn persist_content(&self, name: String, content: Vec<u8>) -> Result<(), FileClientError>;

	async fn read_content(&self, name: String) -> Result<Vec<u8>, FileClientError>;
}
