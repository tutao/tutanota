#[cfg_attr(test, mockall_double::double)]
use crate::blobs::blob_access_token_facade::BlobAccessTokenFacade;
use crate::crypto::aes::Iv;
use crate::crypto::key::GenericAesKey;
use crate::crypto::randomizer_facade::RandomizerFacade;
use crate::entities::storage::{BlobGetIn, BlobPostOut, BlobServerAccessInfo};
use crate::entities::sys::BlobReferenceTokenWrapper;
use crate::entities::Entity;
use crate::generated_id::GeneratedId;
use crate::instance_mapper::InstanceMapper;
use crate::json_element::RawEntity;
use crate::json_serializer::JsonSerializer;
use crate::rest_client::HttpMethod::POST;
use crate::rest_client::RestClient;
use crate::rest_client::{RestClientOptions, RestResponse};
use crate::rest_error::HttpError;
use crate::tutanota_constants::{ArchiveDataType, MAX_BLOB_SIZE_BYTES};
use crate::type_model_provider::init_type_model_provider;
use crate::{crypto, ApiCallError, HeadersProvider};
use base64::Engine;
use crypto::sha256;
use std::sync::Arc;

const BLOB_SERVICE_REST_PATH: &str = "/rest/storage/blobservice";

#[derive(uniffi::Object)]
pub struct BlobFacade {
	blob_access_token_facade: BlobAccessTokenFacade,
	rest_client: Arc<dyn RestClient>,
	randomizer_facade: RandomizerFacade,
	auth_headers_provider: Arc<HeadersProvider>,
	instance_mapper: Arc<InstanceMapper>,
	json_serializer: Arc<JsonSerializer>,
}
impl BlobFacade {
	pub(crate) fn new(
		blob_access_token_facade: BlobAccessTokenFacade,
		rest_client: Arc<dyn RestClient>,
		randomizer_facade: RandomizerFacade,
		auth_headers_provider: Arc<HeadersProvider>,

		instance_mapper: Arc<InstanceMapper>,
		json_serializer: Arc<JsonSerializer>,
	) -> Self {
		Self {
			blob_access_token_facade,
			rest_client,
			randomizer_facade,
			auth_headers_provider,
			instance_mapper,
			json_serializer,
		}
	}

	pub async fn encrypt_and_upload(
		&self,
		archive_data_type: ArchiveDataType,
		owner_group_id: &GeneratedId,
		session_key: &GenericAesKey,
		blob_data: Vec<u8>,
	) -> Result<Vec<BlobReferenceTokenWrapper>, ApiCallError> {
		let chunks = blob_data.chunks(MAX_BLOB_SIZE_BYTES);
		let mut blob_reference_token_wrappers: Vec<BlobReferenceTokenWrapper> =
			Vec::with_capacity(chunks.len());

		for chunk in chunks {
			let wrapper_result = self
				.encrypt_and_upload_chunk(archive_data_type, owner_group_id, session_key, chunk)
				.await;
			let wrapper = match wrapper_result {
				// token was probably expired, we're getting a new one and try again.
				Err(ApiCallError::ServerResponseError {
					source: HttpError::NotAuthorizedError,
				}) => {
					self.blob_access_token_facade
						.evict_write_token(archive_data_type, owner_group_id);
					self.encrypt_and_upload_chunk(
						archive_data_type,
						owner_group_id,
						session_key,
						chunk,
					)
					.await?
				},
				Err(err) => return Err(err),
				Ok(wrapper) => wrapper,
			};
			blob_reference_token_wrappers.push(wrapper)
		}

		Ok(blob_reference_token_wrappers)
	}

	async fn encrypt_and_upload_chunk(
		&self,
		archive_data_type: ArchiveDataType,
		owner_group_id: &GeneratedId,
		session_key: &GenericAesKey,
		chunk: &[u8],
	) -> Result<BlobReferenceTokenWrapper, ApiCallError> {
		let BlobServerAccessInfo {
			servers,
			blobAccessToken: blob_access_token,
			..
		} = self
			.blob_access_token_facade
			.request_write_token(archive_data_type, owner_group_id)
			.await?;

		let encrypted_chunk = session_key
			.encrypt_data(chunk, Iv::generate(&self.randomizer_facade))
			.map_err(|_e| ApiCallError::internal(String::from("failed to encrypt chunk")))?;
		let query_params = self.create_query_params(&encrypted_chunk, blob_access_token);
		let encoded_query_params = encode_query_params(query_params);

		for server in &servers {
			let maybe_response = self
				.rest_client
				.request_binary(
					format!(
						"{}{}{}",
						server.url, BLOB_SERVICE_REST_PATH, encoded_query_params
					),
					POST,
					RestClientOptions {
						headers: Default::default(),
						body: Some(encrypted_chunk.clone()),
					},
				)
				.await;

			match maybe_response {
				Ok(RestResponse {
					status: 200 | 201,
					body,
					..
				}) => {
					return self.handle_post_response(body);
				},
				Ok(RestResponse { status, .. }) => {
					match HttpError::from_http_response(status, None) {
						// token was expired, we should evict & retry on this server.
						// in these cases, we want to try the next server
						Ok(
							HttpError::ConnectionError
							| HttpError::InternalServerError
							| HttpError::NotFoundError,
						) => continue,
						// other http codes we're not going to bother trying the next server for
						Ok(error) => return Err(error.into()),
						// this case is for unknown http codes and should not happen
						Err(error) => return Err(error),
					}
				},
				// actual network error, we didn't get a response
				Err(error) => return Err(error.into()),
			}
		}

		let formatted_servers_list = servers
			.into_iter()
			.map(|blob_server_url| blob_server_url.url)
			.collect::<Vec<_>>()
			.join(", ");

		Err(ApiCallError::InternalSdkError {
			error_message: format!("no servers to invoke: {}", formatted_servers_list),
		})
	}

	fn handle_post_response(
		&self,
		body: Option<Vec<u8>>,
	) -> Result<BlobReferenceTokenWrapper, ApiCallError> {
		let response_bytes = body.expect("no body");
		let response_entity = serde_json::from_slice::<RawEntity>(response_bytes.as_slice())
			.map_err(|e| ApiCallError::internal_with_err(e, "Failed to serialize instance"))?;
		let output_type_ref = &BlobPostOut::type_ref();
		let parsed_entity = self
			.json_serializer
			.parse(output_type_ref, response_entity)?;

		let blob_post_out = self
			.instance_mapper
			.parse_entity::<BlobPostOut>(parsed_entity)
			.map_err(|error| {
				ApiCallError::internal_with_err(
					error,
					"Failed to parse unencrypted entity into proper types",
				)
			})?;
		Ok(BlobReferenceTokenWrapper {
			_id: None,
			blobReferenceToken: blob_post_out.blobReferenceToken,
		})
	}

	fn create_query_params(
		&self,
		encrypted_chunk: &[u8],
		blob_access_token: String,
	) -> Vec<(String, String)> {
		let short_hash: Vec<u8> = sha256(encrypted_chunk).into_iter().take(6).collect();
		let blob_hash_b64 = base64::prelude::BASE64_STANDARD.encode(short_hash.as_slice());
		let model_version = init_type_model_provider()
			.resolve_type_ref(&BlobGetIn::type_ref())
			.expect("no type model for BlobGetIn?")
			.version;
		let model_version = model_version
			.parse()
			.expect("could not parse model version");
		let mut query_params: Vec<(String, String)> = vec![
			("blobHash".into(), blob_hash_b64),
			("blobAccessToken".into(), blob_access_token),
		];
		let auth_headers = self.auth_headers_provider.provide_headers(model_version);
		query_params.extend(auth_headers);
		query_params
	}
}

/// URL-encode some query params for appending them to some URL.
/// all the keys and values must be non-empty.
///
/// only used for blob store requests atm, should be moved to the rest client trait
/// or a wrapper that prepares the URL for the native impls once it's needed somewhere else.
fn encode_query_params<Pairs, Keys, Values>(params: Pairs) -> String
where
	Pairs: IntoIterator<Item = (Keys, Values)>,
	Keys: AsRef<[u8]>,
	Values: AsRef<[u8]>,
{
	let encode = |slice: &[u8]| form_urlencoded::byte_serialize(slice).collect::<String>();

	let pairs = params
		.into_iter()
		.filter(|(k, v)| !k.as_ref().is_empty() && !v.as_ref().is_empty())
		.map(|(k, v)| (encode(k.as_ref()), encode(v.as_ref())))
		.map(|(k, v)| format!("{}={}", k, v))
		.collect::<Vec<_>>();

	if pairs.is_empty() {
		String::new()
	} else {
		format!("?{}", pairs.join("&"))
	}
}

#[cfg(test)]
mod tests {
	use super::*;
	use crate::blobs::blob_access_token_facade::MockBlobAccessTokenFacade;
	use crate::crypto::randomizer_facade::test_util::DeterministicRng;
	use crate::crypto::randomizer_facade::RandomizerFacade;
	use crate::custom_id::CustomId;
	use crate::entities::storage::BlobPostOut;
	use crate::entities::storage::{BlobServerAccessInfo, BlobServerUrl};
	use crate::entities::sys::BlobReferenceTokenWrapper;
	use crate::generated_id::GeneratedId;
	use crate::rest_client::MockRestClient;
	use crate::rest_client::RestClientOptions;
	use crate::rest_client::RestResponse;
	use crate::tutanota_constants::ArchiveDataType;
	use crate::type_model_provider::init_type_model_provider;
	use crate::util::test_utils::create_test_entity;
	use crate::GenericAesKey;
	use crate::HeadersProvider;
	use crate::InstanceMapper;
	use crate::JsonSerializer;
	use hyper::Uri;
	use mockall::predicate;
	use std::collections::HashMap;
	use std::sync::Arc;

	#[tokio::test]
	async fn encrypt_and_upload_single_blob() {
		let blob_access_info = BlobServerAccessInfo {
			blobAccessToken: "123".to_string(),
			servers: Vec::from([BlobServerUrl {
				url: "https://w1.api.tuta.com".to_string(),
				..create_test_entity()
			}]),
			..create_test_entity()
		};
		let owner_group_id = GeneratedId(String::from("ownerGroupId"));
		let blob_data: Vec<u8> = Vec::from([1, 2, 3]);
		let type_model_provider = Arc::new(init_type_model_provider());
		let randomizer_facade = RandomizerFacade::from_core(DeterministicRng(20));
		let session_key = GenericAesKey::from_bytes(
			randomizer_facade
				.generate_random_array::<{ crypto::aes::AES_256_KEY_SIZE }>()
				.as_slice(),
		)
		.unwrap();
		let mut blob_access_token_facade = MockBlobAccessTokenFacade::default();
		blob_access_token_facade
			.expect_request_write_token()
			.with(
				predicate::eq(ArchiveDataType::Attachments),
				predicate::eq(owner_group_id.clone()),
			)
			.return_const(Ok(blob_access_info));
		let mut rest_client = MockRestClient::default();
		let blob_data_matcher = blob_data.clone();
		let session_key_matcher = session_key.clone();

		let expected_reference_tokens = vec![BlobReferenceTokenWrapper {
			blobReferenceToken: "blobRefToken".to_string(),
			_id: Some(CustomId("hello_aggregate".to_owned())),
		}];
		let blob_service_response = BlobPostOut {
			blobReferenceToken: expected_reference_tokens[0].blobReferenceToken.clone(),
			..create_test_entity()
		};
		let parsed = InstanceMapper::new()
			.serialize_entity(blob_service_response)
			.unwrap();
		let raw = JsonSerializer::new(type_model_provider.clone())
			.serialize(&BlobPostOut::type_ref(), parsed)
			.unwrap();

		let binary: Vec<u8> = serde_json::to_vec::<RawEntity>(&raw).unwrap();

		rest_client
			.expect_request_binary()
			.withf(move |path, method, options| {
				let RestClientOptions { body, .. } = options;
				let decrypted_body = body.clone().unwrap();
				let decrypted_body = session_key_matcher
					.decrypt_data(decrypted_body.as_slice())
					.unwrap();
				let uri = path.parse::<Uri>().unwrap();
				assert_eq!("w1.api.tuta.com", uri.host().unwrap());
				assert_eq!(BLOB_SERVICE_REST_PATH, uri.path_and_query().unwrap().path());
				assert_eq!(blob_data_matcher, decrypted_body);
				assert_eq!(&POST, method);
				true
			})
			.return_const(Ok(RestResponse {
				status: 200,
				headers: HashMap::new(),
				body: Some(binary),
			}));

		let blob_facade = BlobFacade {
			blob_access_token_facade,
			rest_client: Arc::new(rest_client),
			randomizer_facade: randomizer_facade.clone(),
			auth_headers_provider: Arc::new(HeadersProvider { access_token: None }),
			instance_mapper: Arc::new(InstanceMapper::new()),
			json_serializer: Arc::new(JsonSerializer::new(type_model_provider)),
		};

		let reference_tokens = blob_facade
			.encrypt_and_upload(
				ArchiveDataType::Attachments,
				&owner_group_id,
				&session_key,
				blob_data.clone(),
			)
			.await
			.unwrap();
		assert_eq!(
			expected_reference_tokens
				.into_iter()
				.map(|rt| BlobReferenceTokenWrapper {
					_id: None,
					blobReferenceToken: rt.blobReferenceToken
				})
				.collect::<Vec<_>>(),
			reference_tokens
		);
	}

	#[test]
	fn encode_query_params_works() {
		assert_eq!("", encode_query_params([] as [(&str, &str); 0]));
		assert_eq!("", encode_query_params([("", "b"), ("c", "")]));
		assert_eq!("?c=d+d+d", encode_query_params([("", "b"), ("c", "d d d")]));
		assert_eq!(
			"?%26%25%3D_%3A=%26%25%3D_%3A%3F",
			encode_query_params([("&%=_:", "&%=_:?")])
		);

		// vec as input
		assert_eq!("?a=b", encode_query_params(vec![("a", "b")]));

		// owned keys
		assert_eq!(
			"?c=d",
			encode_query_params([("".to_owned(), "b"), ("c".to_owned(), "d")])
		);

		// byte array values
		assert_eq!("?a=b&c=d", encode_query_params([("a", b"b"), ("c", b"d")]));

		// a hash map as input
		assert_eq!(
			"",
			encode_query_params(HashMap::default() as HashMap<String, &[u8]>)
		)
	}
}
