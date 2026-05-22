use crate::date::DateProvider;
use crate::entities::generated::storage::BlobServerAccessInfo;
use crate::tutanota_constants::ArchiveDataType;
use crate::GeneratedId;
use std::collections::HashMap;
use std::future::Future;
use std::sync::{Arc, RwLock};

#[derive(Clone, Hash, PartialEq, Eq)]
#[cfg_attr(test, derive(Debug))]
pub(crate) struct BlobWriteTokenKey(String, ArchiveDataType);

impl BlobWriteTokenKey {
	pub fn new(id: &GeneratedId, data_type: ArchiveDataType) -> Self {
		Self(id.to_string(), data_type)
	}
}

#[derive(Clone, Hash, PartialEq, Eq)]
#[cfg_attr(test, derive(Debug))]
pub(crate) struct BlobReadArchiveTokenKey(String);

impl BlobReadArchiveTokenKey {
	pub fn new(archive_id: &GeneratedId) -> Self {
		Self(archive_id.to_string())
	}
}

pub(super) struct BlobAccessTokenCache {
	write_cache: RwLock<HashMap<BlobWriteTokenKey, BlobServerAccessInfo>>,
	read_cache: RwLock<HashMap<BlobReadArchiveTokenKey, BlobServerAccessInfo>>,
	date_provider: Arc<dyn DateProvider>,
}

impl BlobAccessTokenCache {
	pub fn new(date_provider: Arc<dyn DateProvider>) -> Self {
		Self {
			write_cache: RwLock::default(),
			read_cache: RwLock::default(),
			date_provider,
		}
	}

	pub async fn try_get_write_token<F, E, Loader>(
		&self,
		key: &BlobWriteTokenKey,
		loader: Loader,
	) -> Result<BlobServerAccessInfo, E>
	where
		F: Future<Output = Result<BlobServerAccessInfo, E>> + Sized + Send,
		Loader: FnOnce() -> F + Send,
	{
		{
			let cache = self.write_cache.read().expect("poisoned lock");
			if let Some(value) = cache.get(key) {
				if can_be_used_for_another_request(value, self.date_provider.as_ref()) {
					return Ok(value.clone());
				}
			}
		}
		let loaded = loader().await?;
		self.insert_write(key.to_owned(), loaded.clone());
		Ok(loaded)
	}

	pub async fn try_get_read_token<F, E, Loader>(
		&self,
		key: &BlobReadArchiveTokenKey,
		loader: Loader,
	) -> Result<BlobServerAccessInfo, E>
	where
		F: Future<Output = Result<BlobServerAccessInfo, E>> + Sized + Send,
		Loader: FnOnce() -> F + Send,
	{
		{
			let cache = self.read_cache.read().expect("poisoned lock");
			if let Some(value) = cache.get(key) {
				if can_be_used_for_another_request(value, self.date_provider.as_ref()) {
					return Ok(value.clone());
				}
			}
		}
		let loaded = loader().await?;
		self.insert_read(key.to_owned(), loaded.clone());
		Ok(loaded)
	}

	fn insert_write(&self, key: BlobWriteTokenKey, value: BlobServerAccessInfo) {
		let mut cache = self.write_cache.write().expect("poisoned lock");
		let _previous = cache.insert(key, value);
	}

	fn insert_read(&self, key: BlobReadArchiveTokenKey, value: BlobServerAccessInfo) {
		let mut cache = self.read_cache.write().expect("poisoned lock");
		let _previous = cache.insert(key, value);
	}

	pub fn evict_write(&self, key: &BlobWriteTokenKey) {
		let mut cache = self.write_cache.write().expect("poisoned lock");
		cache.remove(key);
	}

	pub fn evict_read(&self, key: &BlobReadArchiveTokenKey) {
		let mut cache = self.read_cache.write().expect("poisoned lock");
		cache.remove(key);
	}
}

fn can_be_used_for_another_request(
	blob_server_access_info: &BlobServerAccessInfo,
	date_provider: &dyn DateProvider,
) -> bool {
	blob_server_access_info
		.expires
		.is_after(&date_provider.now())
}

#[cfg(test)]
mod tests {
	use crate::blobs::blob_access_token_cache::{
		can_be_used_for_another_request, BlobAccessTokenCache, BlobReadArchiveTokenKey,
		BlobWriteTokenKey,
	};
	use crate::date::date_provider::stub::DateProviderStub;
	use crate::date::DateTime;
	use crate::entities::generated::storage::BlobServerAccessInfo;
	use crate::tutanota_constants::ArchiveDataType;
	use crate::util::test_utils::create_test_entity;
	use crate::GeneratedId;
	use std::sync::Arc;

	#[tokio::test]
	async fn get_cached() {
		let cache = BlobAccessTokenCache::new(Arc::new(DateProviderStub::new(0)));
		let key = BlobWriteTokenKey::new(
			&GeneratedId("group".to_owned()),
			ArchiveDataType::Attachments,
		);
		let test_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(10),
			..create_test_entity()
		};
		cache.insert_write(key.clone(), test_token.clone());
		let loaded = cache.try_get_write_token(&key, || async {
			// helps type inference
			if true {
				panic!("should be in cache");
			}
			Err(())
		});
		assert_eq!(test_token, loaded.await.unwrap())
	}

	#[tokio::test]
	async fn get_uncached() {
		let cache = BlobAccessTokenCache::new(Arc::new(DateProviderStub::new(0)));
		let key = BlobWriteTokenKey::new(
			&GeneratedId("group".to_owned()),
			ArchiveDataType::Attachments,
		);
		let test_token = BlobServerAccessInfo {
			..create_test_entity()
		};
		let test_clone = test_token.clone();
		let loaded = cache.try_get_write_token(&key, || async move {
			Ok(test_clone) as Result<BlobServerAccessInfo, ()>
		});
		assert_eq!(test_token, loaded.await.unwrap())
	}

	#[tokio::test]
	async fn get_expired() {
		let cache = BlobAccessTokenCache::new(Arc::new(DateProviderStub::new(20)));
		let key = BlobWriteTokenKey::new(
			&GeneratedId("group".to_owned()),
			ArchiveDataType::Attachments,
		);
		let expired_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(10),
			..create_test_entity()
		};
		cache.insert_write(key.clone(), expired_token.clone());
		let new_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(30),
			..create_test_entity()
		};
		let expected_token = new_token.clone();
		let loaded = cache.try_get_write_token(&key, || async move {
			Ok(new_token) as Result<BlobServerAccessInfo, ()>
		});
		assert_eq!(expected_token, loaded.await.unwrap())
	}

	#[test]
	fn can_be_used_for_another_request_expired_token() {
		let date_provider = DateProviderStub::new(10);
		assert!(!can_be_used_for_another_request(
			&BlobServerAccessInfo {
				expires: DateTime::from_millis(10),
				..create_test_entity()
			},
			&date_provider
		));
		assert!(can_be_used_for_another_request(
			&BlobServerAccessInfo {
				expires: DateTime::from_millis(11),
				..create_test_entity()
			},
			&date_provider
		));
	}

	#[test]
	fn evict() {
		let cache = BlobAccessTokenCache::new(Arc::new(DateProviderStub::new(20)));
		let key = BlobWriteTokenKey::new(
			&GeneratedId("group".to_owned()),
			ArchiveDataType::Attachments,
		);
		let expired_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(10),
			..create_test_entity()
		};
		cache.insert_write(key.clone(), expired_token.clone());

		cache.evict_write(&key);
		assert!(!cache.write_cache.read().unwrap().contains_key(&key));
	}

	#[tokio::test]
	async fn get_read_cached() {
		let cache = BlobAccessTokenCache::new(Arc::new(DateProviderStub::new(0)));
		let key = BlobReadArchiveTokenKey::new(&GeneratedId("archive1".to_owned()));
		let test_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(10),
			..create_test_entity()
		};
		cache.insert_read(key.clone(), test_token.clone());
		let loaded = cache.try_get_read_token(&key, || async {
			if true {
				panic!("should be in cache");
			}
			Err(())
		});
		assert_eq!(test_token, loaded.await.unwrap())
	}

	#[test]
	fn evict_read() {
		let cache = BlobAccessTokenCache::new(Arc::new(DateProviderStub::new(20)));
		let key = BlobReadArchiveTokenKey::new(&GeneratedId("archive1".to_owned()));
		let token = BlobServerAccessInfo {
			expires: DateTime::from_millis(10),
			..create_test_entity()
		};
		cache.insert_read(key.clone(), token);

		cache.evict_read(&key);
		assert!(!cache.read_cache.read().unwrap().contains_key(&key));
	}
}
