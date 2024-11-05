use crate::blobs::blob_access_token_cache::{BlobAccessTokenCache, BlobWriteTokenKey};
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::custom_id::CustomId;
use crate::date::DateProvider;
use crate::entities::generated::storage::{
	BlobAccessTokenPostIn, BlobServerAccessInfo, BlobWriteData,
};
use crate::generated_id::GeneratedId;
use crate::services::generated::storage::BlobAccessTokenService;
#[cfg_attr(test, mockall_double::double)]
use crate::services::service_executor::ResolvingServiceExecutor;
use crate::services::ExtraServiceParams;
use crate::tutanota_constants::ArchiveDataType;
use crate::ApiCallError;
use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use std::sync::Arc;

/// The BlobAccessTokenFacade requests blobAccessTokens from the BlobAccessTokenService to get
/// or post to the BlobService (binary blobs) or DefaultBlobElementResource (instances).
/// All tokens are cached.
pub(crate) struct BlobAccessTokenFacade {
	cache: BlobAccessTokenCache,
	randomizer_facade: RandomizerFacade,
	service_executor: Arc<ResolvingServiceExecutor>,
}

#[cfg_attr(test, mockall::automock)]
impl BlobAccessTokenFacade {
	pub fn new(
		randomizer_facade: RandomizerFacade,
		service_executor: Arc<ResolvingServiceExecutor>,
		date_provider: Arc<dyn DateProvider>,
	) -> Self {
		Self {
			cache: BlobAccessTokenCache::new(date_provider),
			randomizer_facade,
			service_executor,
		}
	}

	/// Requests a token that allows uploading blobs for the given ArchiveDataType and ownerGroup.
	pub async fn request_write_token(
		&self,
		archive_data_type: ArchiveDataType,
		owner_group_id: &GeneratedId,
	) -> Result<BlobServerAccessInfo, ApiCallError> {
		let archive_data_type_discriminant = archive_data_type.discriminant();
		let owner_group_id_clone = owner_group_id.clone();
		let loader = move || async move {
			let post_in: BlobAccessTokenPostIn = BlobAccessTokenPostIn {
				_format: 0,
				archiveDataType: Some(archive_data_type_discriminant),
				read: None,
				write: Some(BlobWriteData {
					_id: Some(CustomId(
						BASE64_URL_SAFE_NO_PAD
							.encode(self.randomizer_facade.generate_random_array::<4>()),
					)),
					archiveOwnerGroup: owner_group_id_clone,
				}),
			};
			self.service_executor
				.post::<BlobAccessTokenService>(post_in, ExtraServiceParams::default())
				.await
				.map(|r| r.blobAccessInfo)
		};

		self.cache
			.try_get_token(
				&BlobWriteTokenKey::new(owner_group_id, archive_data_type),
				loader,
			)
			.await
	}

	/// Remove a given write token from the cache.
	pub fn evict_access_token(&self, key: &BlobWriteTokenKey) {
		self.cache.evict(key);
	}
}
#[cfg(test)]
mod tests {
	use super::*;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::custom_id::CustomId;
	use crate::date::date_provider::stub::DateProviderStub;
	use crate::date::DateTime;
	use crate::entities::generated::storage::{BlobAccessTokenPostOut, BlobServerAccessInfo};
	use crate::services::service_executor::MockResolvingServiceExecutor;
	use crate::tutanota_constants::ArchiveDataType;
	use crate::util::test_utils::create_test_entity;
	use crate::GeneratedId;
	use std::sync::Arc;

	#[tokio::test]
	async fn request_write_token_with_uncached_and_cached() {
		let owner_group_id = GeneratedId(String::from("hallo"));
		let expected_access_info = BlobServerAccessInfo {
			_id: Some(CustomId(String::from("123"))),
			expires: DateTime::from_millis(1_000),
			..create_test_entity()
		};

		let mut executor = MockResolvingServiceExecutor::default();
		executor
			.expect_post::<BlobAccessTokenService>()
			.times(1)
			.return_const(Ok(BlobAccessTokenPostOut {
				blobAccessInfo: expected_access_info.clone(),
				..create_test_entity()
			}));
		let facade = BlobAccessTokenFacade::new(
			RandomizerFacade::from_core(rand_core::OsRng),
			Arc::new(executor),
			Arc::new(DateProviderStub::new(10)),
		);
		let actual_access_info = facade
			.request_write_token(ArchiveDataType::Attachments, &owner_group_id)
			.await
			.expect("failed to request token");

		assert_eq!(expected_access_info, actual_access_info);

		let cached_access_info = facade
			.request_write_token(ArchiveDataType::Attachments, &owner_group_id)
			.await
			.expect("failed to request token");
		assert_eq!(expected_access_info, cached_access_info);
	}
}
