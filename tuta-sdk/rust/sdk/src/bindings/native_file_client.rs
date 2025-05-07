use crate::bindings::file_client::{FileClient, FileClientError};
use std::path::PathBuf;

#[derive(Default, Debug)]
pub struct NativeFileClient {
	app_dir: PathBuf,
}

impl NativeFileClient {
	pub fn try_new(app_dir: PathBuf) -> std::io::Result<Self> {
		if app_dir.is_dir() {
			Ok(Self { app_dir })
		} else {
			log::error!("Can not use given directory as app_dir");
			Err(std::io::ErrorKind::Other)?
		}
	}
}

#[async_trait::async_trait]
impl FileClient for NativeFileClient {
	async fn persist_content(&self, name: String, content: Vec<u8>) -> Result<(), FileClientError> {
		let full_path = self.app_dir.join(name);
		std::fs::write(&full_path, content).map_err(|e| {
			log::error!("Unable to write to file: {full_path:?}. Reason: {e:?}");
			FileClientError::Fatal
		})
	}

	async fn read_content(&self, name: String) -> Result<Vec<u8>, FileClientError> {
		let full_path = self.app_dir.join(name);
		std::fs::read(&full_path).map_err(|e| {
			log::error!("Unable to read from file: {full_path:?}. Reason: {e:?}");
			FileClientError::NotFound
		})
	}
}

#[cfg(test)]
mod tests {
	use crate::bindings::file_client::FileClient;
	use crate::bindings::native_file_client::NativeFileClient;
	use std::path::PathBuf;

	#[tokio::test]
	async fn save_and_read_roundtrip() {
		let file_client = NativeFileClient::try_new(PathBuf::from("/tmp")).unwrap();
		file_client
			.persist_content("test.txt".to_string(), "saved bytes".as_bytes().to_vec())
			.await
			.unwrap();

		let read_bytes = file_client
			.read_content("test.txt".to_string())
			.await
			.unwrap();
		let read_str = String::from_utf8(read_bytes).unwrap();
		assert_eq!(read_str, String::from("saved bytes"));
	}
}
