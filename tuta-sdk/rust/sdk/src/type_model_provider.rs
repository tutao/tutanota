use crate::bindings::file_client::FileClient;
use crate::bindings::rest_client::{HttpMethod, RestClient, RestClientOptions};
use crate::bindings::suspendable_rest_client::SuspensionBehavior;
use crate::entities::generated::base::ApplicationTypesGetOut;
use crate::entities::Entity;
use crate::instance_mapper::InstanceMapper;
use crate::json_element::RawEntity;
use crate::json_serializer::JsonSerializer;
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
	pub server_app_models: std::sync::RwLock<(Option<String>, Cow<'static, ApplicationModels>)>,

	// required to fetch new server model
	file_client: Arc<dyn FileClient>,
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
			server_app_models: std::sync::RwLock::new((None, Cow::Borrowed(&CLIENT_TYPE_MODEL))),
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
			.0
			.as_ref()
			.map(|old_hash| old_hash == hash_from_response)
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
				(Some(hash_from_response.to_string()), Cow::Owned(new_models));
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
				let response_entity =
					serde_json::from_slice::<RawEntity>(response_bytes.as_slice()).unwrap();

				// In order to get the latest server model, we rely on ApplicationTypesGetOut. This means that changes
				// to this type require old client to be deprecated.
				let parsed_instance = JsonSerializer::new(self.clone())
					.parse(&ApplicationTypesGetOut::type_ref(), response_entity)?;
				let application_types_get_out = InstanceMapper::new(self)
					.parse_entity::<ApplicationTypesGetOut>(parsed_instance)
					.map_err(|_e| {
						ApiCallError::internal(
							"Cannot convert ParsedEntity to valid ApplicationTypesServiceGetOut"
								.to_string(),
						)
					})?;

				let apps = serde_json::from_str::<HashMap<AppName, ApplicationModel>>(
					&application_types_get_out.applicationTypesJson,
				)
				.map_err(|e| {
					ApiCallError::internal(
								format!("Can not parse ApplicationTypesService response to ApplicationModels. error: {e:?}"
								),
							)
				})?;
				let application_models = ApplicationModels { apps };
				Ok((
					application_types_get_out.applicationTypesHash,
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

#[cfg(test)]
mod tests {
	use super::Arc;
	use crate::bindings::test_file_client::TestFileClient;
	use crate::bindings::test_rest_client::TestRestClient;
	use crate::type_model_provider::TypeModelProvider;

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
}
