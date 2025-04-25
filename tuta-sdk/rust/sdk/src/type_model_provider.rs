use crate::bindings::file_client::FileClient;
use crate::bindings::rest_client::{HttpMethod, RestClient, RestClientOptions};
use crate::bindings::suspendable_rest_client::SuspensionBehavior;
use crate::entities::entity_facade::EntityFacadeImpl;
use crate::metamodel::{AppName, ApplicationModel, ApplicationModels, TypeModel};
use crate::rest_error::HttpError;
use crate::services::generated::base::ApplicationTypesService;
use crate::services::Service;
use crate::{ApiCallError, TypeRef};
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

            map.insert($app_name.try_into().unwrap(), $crate::metamodel::ApplicationModel { types, version: "0".to_string() , name: $app_name.try_into().expect("invalid app name") });
        )*

        $crate::metamodel::ApplicationModels {apps: map}
    }}
}

static CLIENT_TYPE_MODEL: std::sync::LazyLock<ApplicationModels> = std::sync::LazyLock::new(|| {
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
	_file_client: Arc<dyn FileClient>,
	rest_client: Arc<dyn RestClient>,
	base_url: String,
}

impl TypeModelProvider {
	pub fn new(
		rest_client: Arc<dyn RestClient>,
		file_client: Arc<dyn FileClient>,
		base_url: String,
	) -> TypeModelProvider {
		TypeModelProvider {
			client_app_models: Cow::Borrowed(&CLIENT_TYPE_MODEL),
			server_app_models: std::sync::RwLock::new(None),
			rest_client,
			_file_client: file_client,
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
			.expect("Tried to resolve server type ref before initilization. Call ensure_latest_server_model first?")
			.1
			.as_ref()
			.apps
			.get(&type_ref.app)?
			.types
			.get(&type_ref.type_id)
			.map(Arc::clone)
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
		let headers = [(String::from("cv"), String::from(crate::CLIENT_VERSION))]
			.into_iter()
			.collect();

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
								"Can not decompressed applicationTypesServiceGetOut",
							)
						})?;

				let application_types_get_out = serde_json::from_slice::<ApplicationTypesGetOut>(
					decompressed_get_out.as_slice(),
				)
				.map_err(|e| {
					ApiCallError::internal_with_err(e, "Cannot deserialize ApplicationTypesGetOut")
				})?;

				let apps = serde_json::from_str::<HashMap<AppName, ApplicationModel>>(
					&application_types_get_out.model_types_as_string,
				)
				.map_err(|e| {
					ApiCallError::internal_with_err(
						e,
						"Can not parse ApplicationTypesService response to ApplicationModels",
					)
				})?;
				let application_models = ApplicationModels { apps };
				Ok((
					application_types_get_out.current_application_hash,
					application_models,
				))
			},
			_ => {
				let precondition = response.headers.get("precondition");
				Err(ApiCallError::ServerResponseError {
					source: HttpError::from_http_response(response.status, precondition)?,
				})
			},
		}
	}
}

#[derive(serde::Serialize, serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct ApplicationTypesGetOut {
	pub current_application_hash: String,
	pub model_types_as_string: String,
}

#[cfg(test)]
mod tests {
	use super::{ApplicationTypesGetOut, Arc};
	use crate::bindings::file_client::MockFileClient;
	use crate::bindings::rest_client::{HttpMethod, MockRestClient, RestResponse};
	use crate::bindings::suspendable_rest_client::SuspensionBehavior;
	use crate::bindings::test_file_client::TestFileClient;
	use crate::bindings::test_rest_client::TestRestClient;
	use crate::entities::entity_facade::EntityFacadeImpl;
	use crate::type_model_provider::TypeModelProvider;
	use std::collections::HashMap;

	#[test]
	fn read_type_model_only_once() {
		let first_type_model = TypeModelProvider::new(
			Arc::new(TestRestClient::default()),
			Arc::new(TestFileClient::default()),
			"localhost:9000".to_string(),
		);

		let second_type_model = TypeModelProvider::new(
			Arc::new(TestRestClient::default()),
			Arc::new(TestFileClient::default()),
			"localhost:9000".to_string(),
		);

		assert!(std::ptr::eq(
			first_type_model.client_app_models.as_ref(),
			second_type_model.client_app_models.as_ref()
		));
	}

	#[tokio::test]
	async fn server_can_parse_current_type_models() {
		let mut rest_client = MockRestClient::new();
		rest_client
			.expect_request_binary()
			.return_once(|url, method, option| {
				let client_apps_models = TypeModelProvider::new(
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

				let application_get_out = ApplicationTypesGetOut {
					model_types_as_string: serde_json::to_string(&client_apps_models).unwrap(),
					current_application_hash: "latest-application-hash".to_string(),
				};
				let serialized_json = serde_json::to_string(&application_get_out).unwrap();
				let compressed_response =
					EntityFacadeImpl::lz4_compress_plain_bytes(serialized_json.as_bytes()).unwrap();
				return Ok(RestResponse {
					status: 200,
					headers: HashMap::default(),
					body: Some(compressed_response),
				});
			});

		let type_provider = Arc::new(TypeModelProvider::new(
			Arc::new(rest_client),
			Arc::new(MockFileClient::new()),
			"localhost:9000".to_string(),
		));

		let (applications_hash, updated_type_model) =
			TypeModelProvider::fetch_server_model(type_provider.clone())
				.await
				.unwrap();
		assert_eq!(applications_hash, "latest-applications-hash");
		assert_eq!(
			&updated_type_model,
			type_provider.client_app_models.as_ref()
		);
	}
}
