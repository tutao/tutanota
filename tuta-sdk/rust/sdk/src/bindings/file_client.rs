use thiserror::Error;

#[derive(Error, Debug, uniffi::Error, Eq, PartialEq, Clone)]
#[repr(u8)]
pub enum FileClientError {
	#[error("File not found")]
	NotFound,
	#[error("IoError")]
	IoError,
	#[error("Unknown Error")]
	Unknown,
}

impl From<std::io::ErrorKind> for FileClientError {
	fn from(io_err_kind: std::io::ErrorKind) -> Self {
		match io_err_kind {
			std::io::ErrorKind::NotFound => FileClientError::NotFound,
			std::io::ErrorKind::Other => FileClientError::Unknown,
			_ => FileClientError::IoError,
		}
	}
}

#[uniffi::export(with_foreign)]
#[cfg_attr(test, mockall::automock)]
#[async_trait::async_trait]
pub trait FileClient: Send + Sync + 'static {
	async fn persist_content(&self, name: String, content: Vec<u8>) -> Result<(), FileClientError>;

	async fn read_content(&self, name: String) -> Result<Vec<u8>, FileClientError>;
}
