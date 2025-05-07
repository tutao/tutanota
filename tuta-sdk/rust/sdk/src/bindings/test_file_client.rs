use crate::bindings::file_client::{FileClient, FileClientError};
use std::collections::HashMap;
use std::sync::Mutex;

#[derive(Default, Debug)]
pub struct TestFileClient {
	data: Mutex<HashMap<String, Vec<u8>>>,
}

impl TestFileClient {
	pub async fn contains_file(&self, file_name: String) -> bool {
		self.read_content(file_name).await.is_ok()
	}
}

#[async_trait::async_trait]
impl FileClient for TestFileClient {
	async fn persist_content(&self, name: String, content: Vec<u8>) -> Result<(), FileClientError> {
		let mut data_lock = self.data.lock().map_err(|_e| FileClientError::Fatal)?;
		data_lock.insert(name, content);
		Ok(())
	}

	async fn read_content(&self, name: String) -> Result<Vec<u8>, FileClientError> {
		let data_lock = self.data.lock().map_err(|_e| FileClientError::Fatal)?;
		data_lock
			.get(&name)
			.cloned()
			.ok_or(FileClientError::NotFound)
	}
}
