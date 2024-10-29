use crate::date::DateProvider;
use crate::entities::storage::BlobServerAccessInfo;
use std::collections::HashMap;
use std::future::Future;
use std::sync::{Arc, RwLock};

pub(super) struct BlobAccessTokenCache {
	cache: RwLock<HashMap<String, BlobServerAccessInfo>>,
	date_provider: Arc<dyn DateProvider>,
}

impl BlobAccessTokenCache {
	pub fn new(date_provider: Arc<dyn DateProvider>) -> Self {
		Self {
			cache: RwLock::default(),
			date_provider,
		}
	}

	pub async fn try_get_token<F, E, Loader>(
		&self,
		key: &String,
		loader: Loader,
	) -> Result<BlobServerAccessInfo, E>
	where
		F: Future<Output = Result<BlobServerAccessInfo, E>> + Sized + Send,
		Loader: FnOnce() -> F + Send,
	{
		{
			let cache = self.cache.read().expect("poisoned lock");
			let maybe_value = cache.get(key);
			if let Some(value) = maybe_value {
				if can_be_used_for_another_request(value, self.date_provider.as_ref()) {
					return Ok(value.clone());
				}
			}
		}
		let loaded = loader().await?;
		self.insert(key, loaded.clone());
		Ok(loaded)
	}

	fn insert(&self, key: &str, value: BlobServerAccessInfo) {
		let mut cache = self.cache.write().expect("poisoned lock");
		// someone else might have inserted something while we were loading.
		// we're just replacing + dropping that value.
		let _previous = cache.insert(key.to_owned(), value);
	}

	pub fn evict(&self, key: &String) {
		let mut cache = self.cache.write().expect("poisoned lock");
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
		can_be_used_for_another_request, BlobAccessTokenCache,
	};
	use crate::date::date_provider::stub::DateProviderStub;
	use crate::date::DateTime;
	use crate::entities::storage::BlobServerAccessInfo;
	use crate::util::test_utils::create_test_entity;
	use std::sync::Arc;

	#[tokio::test]
	async fn get_cached() {
		let cache = BlobAccessTokenCache::new(Arc::new(DateProviderStub::new(0)));
		let key = "key".to_owned();
		let test_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(10),
			..create_test_entity()
		};
		cache.insert(&key, test_token.clone());
		let loaded = cache.try_get_token(&key, || async {
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
		let key = "key".to_owned();
		let test_token = BlobServerAccessInfo {
			..create_test_entity()
		};
		let test_clone = test_token.clone();
		let loaded = cache.try_get_token(&key, || async move {
			Ok(test_clone) as Result<BlobServerAccessInfo, ()>
		});
		assert_eq!(test_token, loaded.await.unwrap())
	}

	#[tokio::test]
	async fn get_expired() {
		let cache = BlobAccessTokenCache::new(Arc::new(DateProviderStub::new(20)));
		let key = "key".to_owned();
		let expired_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(10),
			..create_test_entity()
		};
		cache.insert(&key, expired_token.clone());
		let new_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(30),
			..create_test_entity()
		};
		let expected_token = new_token.clone();
		let loaded = cache.try_get_token(&key, || async move {
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
		let key = "key".to_owned();
		let expired_token = BlobServerAccessInfo {
			expires: DateTime::from_millis(10),
			..create_test_entity()
		};
		cache.insert(&key, expired_token.clone());

		cache.evict(&key);
		assert!(!cache.cache.read().unwrap().contains_key(&key));
	}
}
