use crate::bindings::file_client::FileClient;
use crate::bindings::rest_client::{HttpMethod, RestClient, RestClientOptions};
use crate::bindings::suspendable_rest_client::SuspensionBehavior;
use crate::crypto::sha256;
use crate::entities::entity_facade::EntityFacadeImpl;
use crate::metamodel::{AppName, ApplicationModel, ApplicationModels, TypeModel};
use crate::rest_error::HttpError;
use crate::services::generated::base::ApplicationTypesService;
use crate::services::Service;
use crate::{ApiCallError, TypeRef, CLIENT_VERSION};
use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use std::borrow::{Borrow, Cow};
use std::collections::HashMap;
use std::sync::Arc;

// Reads all provided type models into a map.
// Should be able to do it without a provided list, but it's much more work.
// Another improvement could be to have more efficient representation in the binary
macro_rules! read_type_models {
    ($($app_name:literal), +) => {{
        use ::std::collections::HashMap;use crate::metamodel::TypeId;
        let mut map = HashMap::new();

        $(
            let json = include_str!(concat!("type_models/", $app_name, ".json"));
            let types = ::serde_json::from_str::<HashMap<TypeId, Arc<TypeModel>>>(&json)
                .expect(concat!("Could not parse type model ", $app_name));

			// The type_model json files (in type_models) are generated, so all typeIds of
			// a specific application always have the same version for the client type models.
			let version = if let Some((_, type_model)) = types.iter().next() {
				type_model.version
			} else if $app_name == AppName::Gossip.to_string() {
				// gossip is not guaranteed to have items, so we return zero for the version
			    // this may cause an error on the server but the other models remain correct
				0
			} else {
				panic!(concat!("No version found in type model json file for application ", $app_name));
			};

            map.insert($app_name.try_into().unwrap(), $crate::metamodel::ApplicationModel { types, version: version.to_string() , name: $app_name.try_into().expect("invalid app name") });
        )*

        $crate::metamodel::ApplicationModels {apps: map}
    }}
}

pub static CLIENT_TYPE_MODEL: std::sync::LazyLock<ApplicationModels> =
	std::sync::LazyLock::new(|| {
		read_type_models![
			"accounting",
			"base",
			"gossip",
			"monitor",
			"storage",
			"sys",
			"tutanota",
			"usage"
		]
	});

/// Contains a map between backend apps and entity/instance types within them
pub struct TypeModelProvider {
	pub client_app_models: Cow<'static, ApplicationModels>,
	pub server_app_models: std::sync::RwLock<Option<(String, Cow<'static, ApplicationModels>)>>,

	// required to fetch new server model
	file_client: Arc<dyn FileClient>,
	rest_client: Arc<dyn RestClient>,
	base_url: String,
}

impl TypeModelProvider {
	pub const SERVER_TYPE_MODEL_JSON_FILE_NAME: &'static str = "server_type_models_sdk.json";

	pub fn new(
		rest_client: Arc<dyn RestClient>,
		file_client: Arc<dyn FileClient>,
		base_url: String,
	) -> TypeModelProvider {
		TypeModelProvider {
			client_app_models: Cow::Borrowed(&CLIENT_TYPE_MODEL),
			server_app_models: std::sync::RwLock::new(None),
			rest_client,
			file_client,
			base_url,
		}
	}

	pub fn resolve_client_type_ref(&self, type_ref: &TypeRef) -> Option<&TypeModel> {
		self.client_app_models
			.apps
			.get(&type_ref.app)?
			.types
			.get(&type_ref.type_id)
			.map(Borrow::borrow)
	}

	pub fn resolve_server_type_ref(&self, type_ref: &TypeRef) -> Option<Arc<TypeModel>> {
		self.server_app_models
				.read()
				.expect("Server application model lock poisoned on read")
				.as_ref()
				.expect("Tried to resolve server type ref before initialization. Call ensure_latest_server_model first?")
				.1
				.as_ref()
				.apps
				.get(&type_ref.app)?
				.types
				.get(&type_ref.type_id)
				.map(Arc::clone)
	}

	pub async fn initialize_server_model_from_file(&self) {
		let Ok(raw_json_server_model) = self
			.file_client
			.read_content(Self::SERVER_TYPE_MODEL_JSON_FILE_NAME.to_string())
			.await
		else {
			return;
		};

		let Ok(apps) =
			serde_json::from_slice::<HashMap<AppName, ApplicationModel>>(&raw_json_server_model)
				.inspect_err(|e| {
					log::error!(
						"Can not parse ApplicationTypesService response to ApplicationModels {e:?}",
					)
				})
		else {
			return;
		};

		let mut writeable_server_models = self
			.server_app_models
			.write()
			.expect("We should have always cleared the poison before writing");

		let application_types_hash =
			TypeModelProvider::compute_application_types_hash(raw_json_server_model.as_slice());
		*writeable_server_models = Some((
			application_types_hash,
			Cow::Owned(ApplicationModels { apps }),
		));
	}

	fn compute_application_types_hash(raw_json_server_model: &[u8]) -> String {
		let application_types_hash = sha256(raw_json_server_model);
		BASE64_STANDARD.encode(&application_types_hash[0..5])
	}

	pub async fn write_server_model_to_file(&self, raw_json_server_model: Vec<u8>) {
		let file_client = Arc::clone(&self.file_client);
		file_client
			.persist_content(
				Self::SERVER_TYPE_MODEL_JSON_FILE_NAME.to_string(),
				raw_json_server_model,
			)
			.await
			.ok();
	}

	pub async fn ensure_latest_server_model(
		self: Arc<Self>,
		hash_from_response: &str,
	) -> Result<(), ApiCallError> {
		self.server_app_models.clear_poison();

		let is_same_hash = self
			.server_app_models
			.read()
			.expect("server_app_models lock is poisoned")
			.as_ref()
			.map(|(current_hash, _)| current_hash == hash_from_response)
			.unwrap_or_default();
		if !is_same_hash {
			// we do not use service executer here, because this service should also be callable from non-loggedin sdk
			let (new_hash, new_models) = self.clone().fetch_server_model().await?;

			// this should not happen,
			// but is safe to ignore if we always trust ApplicationModelService
			if new_hash != hash_from_response {
				log::warn!("Server application hash changed. Expected from previous response: {hash_from_response}. Hash from ApplicationTypesService: {new_hash}");
			}

			let mut writeable_server_models = self
				.server_app_models
				.write()
				.expect("We should have always cleared the poision before writing");

			*writeable_server_models =
				Some((hash_from_response.to_string(), Cow::Owned(new_models)));
		}
		Ok(())
	}

	async fn fetch_server_model(
		self: Arc<Self>,
	) -> Result<(String, ApplicationModels), ApiCallError> {
		let service_path = ApplicationTypesService::PATH;
		let url = format!("{}/rest/{}", self.base_url, service_path);

		println!(
			"Attempting to get base model version?  {}",
			CLIENT_TYPE_MODEL
				.apps
				.get(&AppName::Base)
				.expect("base application not found")
				.version
				.clone()
		);
		let headers = HashMap::from([
			("cv".to_owned(), CLIENT_VERSION.to_string()),
			(
				"v".to_owned(),
				CLIENT_TYPE_MODEL
					.apps
					.get(&AppName::Base)
					.expect("base application not found")
					.version
					.clone(),
			),
		]);

		let options = RestClientOptions {
			headers,
			body: None,
			suspension_behavior: Some(SuspensionBehavior::Suspend),
		};
		let response = self
			.rest_client
			.request_binary(url, HttpMethod::GET, options)
			.await?;
		let response_body = response.body;

		match (response.status, response_body) {
			(200..=299, Some(response_bytes)) => {
				let decompressed_get_out =
					EntityFacadeImpl::lz4_decompress_decrypted_bytes(response_bytes.as_slice())
						.map_err(|d| {
							ApiCallError::internal_with_err(
								d,
								"Could not decompress applicationTypesServiceGetOut",
							)
						})?;

				let application_types_get_out = serde_json::from_slice::<ApplicationTypesGetOut>(
					decompressed_get_out.as_slice(),
				)
				.map_err(|e| {
					ApiCallError::internal_with_err(e, "Cannot deserialize ApplicationTypesGetOut")
				})?;

				let apps = serde_json::from_str::<HashMap<AppName, ApplicationModel>>(
					&application_types_get_out.application_types_json,
				)
				.map_err(|e| {
					ApiCallError::internal_with_err(
						e,
						"Can not parse ApplicationTypesService response to ApplicationModels",
					)
				})?;

				self.write_server_model_to_file(
					application_types_get_out
						.application_types_json
						.into_bytes(),
				)
				.await;

				let application_models = ApplicationModels { apps };
				Ok((
					application_types_get_out.application_types_hash,
					application_models,
				))
			},
			_ => Err(ApiCallError::ServerResponseError {
				source: HttpError::from_http_response(response.status, &response.headers)?,
			}),
		}
	}
}

/// Do **NOT** change the names of these attributes, they need to match the record found on the
/// server at ApplicationTypesService#ApplicationTypesGetOut. This is to make sure we can update the
/// format of the service output in the future. With general schema definitions this would not be
/// possible as schemas returned by this service are required to read the schemas themselves.
#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ApplicationTypesGetOut {
	pub application_types_hash: String,
	pub application_types_json: String,
}

#[cfg(test)]
mod tests {
	use crate::bindings::file_client::{FileClient, MockFileClient};
	use crate::bindings::rest_client::{HttpMethod, MockRestClient, RestClient, RestResponse};
	use crate::bindings::suspendable_rest_client::SuspensionBehavior;
	use crate::type_model_provider::{ApplicationTypesGetOut, TypeModelProvider};
	use crate::util::test_utils;
	use mockall::predicate::{always, eq};
	use std::sync::Arc;
	use std::sync::RwLock;

	impl TypeModelProvider {
		pub fn new_test(
			rest_client: Arc<dyn RestClient>,
			file_client: Arc<dyn FileClient>,
			base_url: String,
		) -> Self {
			let without_server_models = Self::new(rest_client, file_client, base_url);
			TypeModelProvider {
				server_app_models: RwLock::new(Some((
					"current-server-hash".to_string(),
					without_server_models.client_app_models.clone(),
				))),
				..without_server_models
			}
		}
	}

	fn setup_application_types_response(rest_client: &mut MockRestClient, types_json: String) {
		rest_client
			.expect_request_binary()
			.with(
				eq("http://localhost:9000/rest/base/applicationtypesservice".to_string()),
				eq(HttpMethod::GET),
				always(),
			)
			.return_once(|_path, _method, _options| {
				let get_out = ApplicationTypesGetOut {
					application_types_hash: "some_hash".to_string(),
					application_types_json: types_json,
				};
				let response_bytes =
					lz4_flex::compress(serde_json::to_string_pretty(&get_out).unwrap().as_bytes());
				Ok(RestResponse {
					status: 200,
					headers: Default::default(),
					body: Some(response_bytes),
				})
			});
	}

	#[test]
	fn read_type_model_only_once() {
		let first_type_model = TypeModelProvider::new_test(
			Arc::new(MockRestClient::default()),
			Arc::new(MockFileClient::default()),
			"localhost:9000".to_string(),
		);

		let second_type_model = TypeModelProvider::new_test(
			Arc::new(MockRestClient::default()),
			Arc::new(MockFileClient::default()),
			"localhost:9000".to_string(),
		);

		assert!(std::ptr::eq(
			first_type_model.client_app_models.as_ref(),
			second_type_model.client_app_models.as_ref()
		));
	}

	#[tokio::test]
	async fn server_attempts_to_persist_json_after_fetch() {
		let file_client: Arc<dyn FileClient> = Arc::new(MockFileClient::default());
		let rest_client: Arc<dyn RestClient> = Arc::new(MockRestClient::default());

		let mock_rest_client = unsafe {
			Arc::as_ptr(&rest_client)
				.cast::<MockRestClient>()
				.cast_mut()
				.as_mut()
				.unwrap()
		};
		setup_application_types_response(mock_rest_client, "{}".to_string());

		let file_client_mock = unsafe {
			Arc::as_ptr(&file_client)
				.cast::<MockFileClient>()
				.cast_mut()
				.as_mut()
				.unwrap()
		};

		file_client_mock
			.expect_persist_content()
			.with(
				eq(TypeModelProvider::SERVER_TYPE_MODEL_JSON_FILE_NAME.to_string()),
				eq(b"{}".to_vec()),
			)
			.times(1)
			.returning(|_, _| Ok(()));

		let (_hash, _models) = Arc::new(TypeModelProvider::new(
			Arc::clone(&rest_client),
			Arc::clone(&file_client),
			"http://localhost:9000".to_string(),
		))
		.fetch_server_model()
		.await
		.unwrap();
	}

	#[tokio::test]
	async fn server_can_parse_current_type_models() {
		let mut rest_client = MockRestClient::new();
		rest_client
			.expect_request_binary()
			.return_once(|url, method, option| {
				let _client_apps_models = TypeModelProvider::new_test(
					Arc::new(MockRestClient::new()),
					Arc::new(MockFileClient::new()),
					Default::default(),
				)
				.client_app_models
				.apps
				.clone();

				assert_eq!(url, "localhost:9000/rest/base/applicationtypesservice");
				assert_eq!(method, HttpMethod::GET);
				assert_eq!(
					option.headers.get("cv"),
					Some(&crate::CLIENT_VERSION.to_string())
				);
				assert_eq!(option.body, None);
				assert_eq!(
					option.suspension_behavior,
					Some(SuspensionBehavior::Suspend)
				);

				Ok(test_utils::application_types_response_with_client_model())
			});

		let mut file_client = MockFileClient::new();
		file_client
			.expect_persist_content()
			.times(1)
			.returning(|_, _| Ok(()));

		let type_provider = Arc::new(TypeModelProvider::new_test(
			Arc::new(rest_client),
			Arc::new(file_client),
			"localhost:9000".to_string(),
		));

		let (applications_hash, updated_type_model) =
			TypeModelProvider::fetch_server_model(type_provider.clone())
				.await
				.unwrap();
		assert_eq!(applications_hash, "latest-applications-hash");
		let expected_type_model = type_provider.client_app_models.as_ref();
		assert_eq!(&updated_type_model, expected_type_model);
	}
}
