use crate::bindings::rest_client::{HttpMethod, RestClient, RestClientOptions, RestResponse};
use crate::bindings::suspendable_rest_client::SuspensionBehavior;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::entity_facade::ID_FIELD;
use crate::entities::generated::base::PersistenceResourcePostReturn;
use crate::entities::Entity;
use crate::id::id_tuple::{BaseIdType, IdType};
use crate::instance_mapper::InstanceMapper;
use crate::json_element::{JsonElement, RawEntity};
use crate::json_serializer::JsonSerializer;
use crate::metamodel::ElementType::{Element, ListElement};
use crate::metamodel::{ElementType, TypeModel};
use crate::rest_error::HttpError;
use crate::type_model_provider::TypeModelProvider;
use crate::{ApiCallError, HeadersProvider, IdTupleCustom, ListLoadDirection, TypeRef};
use crate::{GeneratedId, IdTupleGenerated};
use std::sync::Arc;

/// A high level interface to manipulate **unencrypted** entities/instances via the REST API
pub struct EntityClient {
	base_url: String,
	rest_client: Arc<dyn RestClient>,
	auth_headers_provider: Arc<HeadersProvider>,
	json_serializer: Arc<JsonSerializer>,
	pub type_model_provider: Arc<TypeModelProvider>,
}

#[cfg_attr(test, mockall::automock)]
impl EntityClient {
	pub(crate) fn new(
		base_url: String,
		rest_client: Arc<dyn RestClient>,
		json_serializer: Arc<JsonSerializer>,
		auth_headers_provider: Arc<HeadersProvider>,
		type_model_provider: Arc<TypeModelProvider>,
	) -> Self {
		EntityClient {
			base_url,
			rest_client,
			json_serializer,
			auth_headers_provider,
			type_model_provider,
		}
	}

	/// Creates a single entity/instance on the server and returns its newly created id
	/// In case of a customId not id is returned yet! todo!("implement support for customIds on server")
	pub async fn create(
		&self,
		type_ref: &TypeRef,
		parsed_entity: ParsedEntity,
		instance_mapper: &InstanceMapper,
	) -> Result<Option<GeneratedId>, ApiCallError> {
		let response = self
			.prepare_and_send_post_request(type_ref, parsed_entity)
			.await?;

		assert!(
			response.status >= 200 && response.status <= 300,
			"non-ok status code"
		);

		let raw_response = response
			.body
			.as_deref()
			.and_then(|body| serde_json::from_slice(body).ok())
			.ok_or_else(|| {
				ApiCallError::internal("server did not responded with valid json".to_string())
			})?;

		let response_entity = self
			.json_serializer
			.parse(&PersistenceResourcePostReturn::type_ref(), raw_response)
			.map_err(|e| {
				ApiCallError::internal_with_err(
					e,
					"PersistenceResourcePostReturn returned by server is expected to be valid",
				)
			})?;

		let persistence_resource_instance: PersistenceResourcePostReturn = instance_mapper
			.parse_entity(response_entity)
			.map_err(|_e| {
				ApiCallError::internal(
					"Cannot convert ParsedEntity to valid PersistenceResourcePostReturn"
						.to_string(),
				)
			})?;

		Ok(persistence_resource_instance.generatedId)
	}

	/// Gets an entity/instance of type `type_ref` from the backend
	pub async fn read<Id: IdType>(
		&self,
		type_ref: &TypeRef,
		id: &Id,
	) -> Result<ParsedEntity, ApiCallError> {
		let url = format!(
			"{}/rest/{}/{}/{}",
			self.base_url, type_ref.app, type_ref.type_, id
		);
		let response_bytes = self
			.prepare_and_send_get_request(type_ref, url)
			.await?
			.expect("no body");
		let response_entity =
			serde_json::from_slice::<RawEntity>(response_bytes.as_slice()).unwrap();
		let parsed_entity = self.json_serializer.parse(type_ref, response_entity)?;
		Ok(parsed_entity)
	}

	/// Fetches and returns a specified number (`count`) of entities/instances
	/// in a list element type starting at the index `start_id`
	#[allow(clippy::unused_async)]
	pub async fn read_range<Id: BaseIdType>(
		&self,
		type_ref: &TypeRef,
		list_id: &GeneratedId,
		start_id: &Id,
		count: usize,
		direction: ListLoadDirection,
	) -> Result<Vec<ParsedEntity>, ApiCallError> {
		let type_model = self.get_type_model(type_ref)?;

		assert_eq!(
			type_model.element_type,
			ElementType::ListElement,
			"cannot load range for non-list element"
		);

		let reverse = direction == ListLoadDirection::DESC;
		let url = format!(
			"{}/rest/{}/{}/{}?start={start_id}&count={count}&reverse={reverse}",
			self.base_url, type_ref.app, type_ref.type_, list_id
		);
		let response_bytes = self
			.prepare_and_send_get_request(type_ref, url)
			.await?
			.expect("no body");
		let response_entities = serde_json::from_slice::<Vec<RawEntity>>(response_bytes.as_slice())
			.expect("invalid response");
		let parsed_entities = response_entities
			.into_iter()
			.map(|e| self.json_serializer.parse(type_ref, e))
			.collect::<Result<Vec<_>, _>>()?;
		Ok(parsed_entities)
	}

	/// Fetches and returns all entities/instances in a list element type
	#[allow(clippy::unused_async, unused)]
	pub async fn read_all<Id: BaseIdType>(
		&self,
		type_ref: &TypeRef,
		list_id: &GeneratedId,
		start_id: &Id,
	) -> Result<Vec<ParsedEntity>, ApiCallError> {
		todo!("entity client load_all")
	}

	pub async fn update(
		&self,
		type_ref: &TypeRef,
		parsed_entity: ParsedEntity,
	) -> Result<(), ApiCallError> {
		let response = self
			.prepare_and_send_put_request(type_ref, parsed_entity)
			.await?;

		assert!(
			response.status >= 200 && response.status <= 299,
			"non-ok status code {}",
			response.status
		);

		Ok(())
	}

	/// Deletes an existing single entity/instance on the backend
	#[allow(clippy::unused_async, unused)]
	pub async fn delete<Id: IdType>(
		&self,
		_type_ref: &TypeRef,
		_id: &Id,
	) -> Result<(), ApiCallError> {
		todo!("entity client erase_element")
	}

	async fn prepare_and_send_post_request(
		&self,
		type_ref: &TypeRef,
		parsed_entity: ParsedEntity,
	) -> Result<RestResponse, ApiCallError> {
		let mut request_url = format!("{}/rest/{}/{}", self.base_url, type_ref.app, type_ref.type_);
		let type_model = self.get_type_model(type_ref)?;
		let model_version_str = type_model.version;
		let model_version = model_version_str.parse::<u32>().map_err(|_e| {
			ApiCallError::internal(format!(
				"Expected version to be u32 compatible. Found: {model_version_str}"
			))
		})?;

		let entity_id = parsed_entity
			.get(ID_FIELD)
			.ok_or_else(|| {
				ApiCallError::internal(
					"_id field have to be set while creating the instance".to_string(),
				)
			})?
			.clone();

		let (list_id, _) = Self::unzip_id(type_ref, entity_id);
		if type_model.element_type == ListElement {
			if let Some(list_id) = list_id {
				request_url.push('/');
				request_url.push_str(list_id.as_str());
			} else {
				Err(ApiCallError::internal(
					"List id must be defined for LETs".to_string(),
				))?
			}
		} else if type_model.element_type == Element {
			if list_id.is_some() {
				Err(ApiCallError::internal(
					"List id must NOT be defined for ETs".to_string(),
				))?
			}
		} else {
			Err(ApiCallError::internal(
				"Can not create instances of type other than LET or ET".to_string(),
			))?
		}

		let mut raw_entity = self.json_serializer.serialize(type_ref, parsed_entity)?;
		// todo! can we remove permission call to set to null
		raw_entity.insert("_permissions".to_string(), JsonElement::Null);
		let body = serde_json::to_vec(&raw_entity).map_err(|_| {
			ApiCallError::internal("Cannot serialize RawEntity to json".to_string())
		})?;

		let mut options = RestClientOptions {
			body: Some(body),
			headers: self.auth_headers_provider.provide_headers(model_version),
			suspension_behavior: Some(SuspensionBehavior::Suspend),
		};
		options
			.headers
			.insert("Content-Type".to_owned(), "application/json".to_owned());

		let response = self
			.rest_client
			.request_binary(request_url, HttpMethod::POST, options)
			.await?;

		Ok(response)
	}

	async fn prepare_and_send_get_request(
		&self,
		type_ref: &TypeRef,
		url: String,
	) -> Result<Option<Vec<u8>>, ApiCallError> {
		let type_model = self.get_type_model(type_ref)?;
		let model_version: u32 = type_model.version.parse().expect("invalid model_version");
		let options = RestClientOptions {
			body: None,
			headers: self.auth_headers_provider.provide_headers(model_version),
			suspension_behavior: Some(SuspensionBehavior::Suspend),
		};
		let response = self
			.rest_client
			.request_binary(url, HttpMethod::GET, options)
			.await?;

		match response.status {
			200..=299 => {
				// Ok
			},
			_ => {
				let precondition = response.headers.get("precondition");
				return Err(ApiCallError::ServerResponseError {
					source: HttpError::from_http_response(response.status, precondition)?,
				});
			},
		}
		Ok(response.body)
	}

	async fn prepare_and_send_put_request(
		&self,
		type_ref: &TypeRef,
		parsed_entity: ParsedEntity,
	) -> Result<RestResponse, ApiCallError> {
		let mut request_url = format!("{}/rest/{}/{}", self.base_url, type_ref.app, type_ref.type_);
		let type_model = self.get_type_model(type_ref)?;
		let model_version_str = type_model.version;
		let model_version = model_version_str.parse::<u32>().map_err(|_e| {
			ApiCallError::internal(format!(
				"Expected version to be u32 compatible. Found: {model_version_str}"
			))
		})?;

		let entity_id = parsed_entity
			.get(ID_FIELD)
			.filter(|id| !matches!(id, ElementValue::Null))
			.ok_or_else(|| {
				ApiCallError::internal(
					"_id field have to be set while updating the instance".to_string(),
				)
			})?
			.clone();

		let (list_id, element_id) = Self::unzip_id(type_ref, entity_id);
		if let Some(list_id) = list_id {
			request_url.push('/');
			request_url.push_str(list_id.as_str());
		}
		request_url.push('/');
		request_url.push_str(element_id.as_str());

		let raw_entity = self.json_serializer.serialize(type_ref, parsed_entity)?;
		let body = serde_json::to_vec(&raw_entity).map_err(|_| {
			ApiCallError::internal("Cannot serialize RawEntity to json".to_string())
		})?;

		let mut options = RestClientOptions {
			body: Some(body),
			headers: self.auth_headers_provider.provide_headers(model_version),
			suspension_behavior: Some(SuspensionBehavior::Suspend),
		};
		options
			.headers
			.insert("Content-Type".to_owned(), "application/json".to_owned());

		let response = self
			.rest_client
			.request_binary(request_url, HttpMethod::PUT, options)
			.await?;

		Ok(response)
	}

	pub fn unzip_id(
		type_ref: &TypeRef,
		entity_id: ElementValue,
	) -> (Option<GeneratedId>, Box<dyn BaseIdType>) {
		match entity_id {
			ElementValue::IdTupleGeneratedElementId(IdTupleGenerated {
				list_id,
				element_id,
			}) => (Some(list_id), Box::new(element_id)),

			ElementValue::IdTupleCustomElementId(IdTupleCustom {
				list_id,
				element_id,
			}) => (Some(list_id), Box::new(element_id)),

			ElementValue::IdGeneratedId(element_id) => (None, Box::new(element_id)),
			ElementValue::IdCustomId(element_id) => (None, Box::new(element_id)),

			_ => panic!("Invalid type of _id for TypeRef: {type_ref}"),
		}
	}

	/// Returns the definition of an entity/instance type using the internal `TypeModelProvider`
	pub fn get_type_model(&self, type_ref: &TypeRef) -> Result<&TypeModel, ApiCallError> {
		self.type_model_provider
			.get_type_model(type_ref.app, type_ref.type_)
			.ok_or_else(|| {
				ApiCallError::internal(format!(
					"Model {} not found in app {}",
					type_ref.type_, type_ref.app
				))
			})
	}
}

#[cfg(test)]
mod tests {
	use std::collections::HashMap;

	use super::*;
	use crate::bindings::rest_client::{MockRestClient, RestResponse};
	use crate::entities::Entity;
	use crate::metamodel::{Cardinality, ModelValue, ValueType};
	use crate::CustomId;
	use crate::{collection, str_map, IdTupleCustom, IdTupleGenerated};
	use mockall::predicate::{always, eq};
	use serde::{Deserialize, Serialize};

	#[derive(Clone, Serialize, Deserialize, Debug, PartialEq)]
	struct TestListGeneratedElementIdEntity {
		_id: IdTupleGenerated,
		field: String,
	}

	#[derive(Clone, Serialize, Deserialize, Debug, PartialEq)]
	struct TestListCustomElementIdEntity {
		_id: IdTupleCustom,
		field: String,
	}

	impl Entity for TestListGeneratedElementIdEntity {
		fn type_ref() -> TypeRef {
			TypeRef {
				app: "test",
				type_: "TestListGeneratedElementIdEntity",
			}
		}
	}

	impl Entity for TestListCustomElementIdEntity {
		fn type_ref() -> TypeRef {
			TypeRef {
				app: "test",
				type_: "TestListCustomElementIdEntity",
			}
		}
	}

	#[tokio::test]
	async fn test_load_range_generated_element_id() {
		let type_model_provider = mock_type_model_provider();

		let list_id = GeneratedId("list_id".to_owned());
		let entity_map: ParsedEntity = collection! {
			ID_FIELD => ElementValue::IdTupleGeneratedElementId(IdTupleGenerated::new(list_id.clone(), GeneratedId("element_id".to_owned()))),
			"field" => ElementValue::Bytes(vec![1, 2, 3])
		};
		let mut rest_client = MockRestClient::new();
		let url = "http://test.com/rest/test/TestListGeneratedElementIdEntity/list_id?start=zzzzzzzzzzzz&count=100&reverse=true";
		let json_folder = JsonSerializer::new(type_model_provider.clone())
			.serialize(
				&TestListGeneratedElementIdEntity::type_ref(),
				entity_map.clone(),
			)
			.unwrap();
		rest_client
			.expect_request_binary()
			.with(eq(url.to_owned()), eq(HttpMethod::GET), always())
			.return_once(move |_, _, _| {
				Ok(RestResponse {
					status: 200,
					headers: HashMap::default(),
					body: Some(serde_json::to_vec(&vec![json_folder]).unwrap()),
				})
			});

		let auth_headers_provider = HeadersProvider::new(Some("123".to_owned()));
		let entity_client = EntityClient::new(
			"http://test.com".to_owned(),
			Arc::new(rest_client),
			Arc::new(InstanceMapper::new()),
			Arc::new(JsonSerializer::new(type_model_provider.clone())),
			Arc::new(auth_headers_provider),
			type_model_provider.clone(),
		);

		let result_entity = entity_client
			.read_range(
				&TestListGeneratedElementIdEntity::type_ref(),
				&list_id,
				&GeneratedId::max_id(),
				100,
				ListLoadDirection::DESC,
			)
			.await
			.expect("success");
		assert_eq!(result_entity, vec![entity_map]);
	}

	#[tokio::test]
	async fn test_load_range_custom_element_id() {
		let type_model_provider = mock_type_model_provider();

		let list_id = GeneratedId("list_id".to_owned());
		let entity_map: ParsedEntity = collection! {
			ID_FIELD => ElementValue::IdTupleCustomElementId(IdTupleCustom::new(list_id.clone(), CustomId("element_id".to_owned()))),
			"field" => ElementValue::Bytes(vec![1, 2, 3])
		};
		let mut rest_client = MockRestClient::new();
		let url = "http://test.com/rest/test/TestListCustomElementIdEntity/list_id?start=zzzzzzzzzzzz&count=100&reverse=true";
		let json_folder = JsonSerializer::new(type_model_provider.clone())
			.serialize(
				&TestListCustomElementIdEntity::type_ref(),
				entity_map.clone(),
			)
			.unwrap();
		rest_client
			.expect_request_binary()
			.with(eq(url.to_owned()), eq(HttpMethod::GET), always())
			.return_once(move |_, _, _| {
				Ok(RestResponse {
					status: 200,
					headers: HashMap::default(),
					body: Some(serde_json::to_vec(&vec![json_folder]).unwrap()),
				})
			});

		let auth_headers_provider = HeadersProvider::new(Some("123".to_owned()));
		let entity_client = EntityClient::new(
			"http://test.com".to_owned(),
			Arc::new(rest_client),
			Arc::new(InstanceMapper::new()),
			Arc::new(JsonSerializer::new(type_model_provider.clone())),
			Arc::new(auth_headers_provider),
			type_model_provider.clone(),
		);

		let result_entity = entity_client
			.read_range(
				&TestListCustomElementIdEntity::type_ref(),
				&list_id,
				&CustomId("zzzzzzzzzzzz".to_owned()),
				100,
				ListLoadDirection::DESC,
			)
			.await
			.expect("success");
		assert_eq!(result_entity, vec![entity_map]);
	}

	#[tokio::test]
	async fn test_load_range_asc_generated_element_id() {
		let type_model_provider = mock_type_model_provider();

		let list_id = GeneratedId("list_id".to_owned());
		let entity_map: ParsedEntity = collection! {
			ID_FIELD => ElementValue::IdTupleGeneratedElementId(IdTupleGenerated::new(list_id.clone(), GeneratedId("element_id".to_owned()))),
			"field" => ElementValue::Bytes(vec![1, 2, 3])
		};
		let mut rest_client = MockRestClient::new();
		let url = "http://test.com/rest/test/TestListGeneratedElementIdEntity/list_id?start=------------&count=100&reverse=false";
		let json_folder = JsonSerializer::new(type_model_provider.clone())
			.serialize(
				&TestListGeneratedElementIdEntity::type_ref(),
				entity_map.clone(),
			)
			.unwrap();
		rest_client
			.expect_request_binary()
			.with(eq(url.to_owned()), eq(HttpMethod::GET), always())
			.return_once(move |_, _, _| {
				Ok(RestResponse {
					status: 200,
					headers: HashMap::default(),
					body: Some(serde_json::to_vec(&vec![json_folder]).unwrap()),
				})
			});

		let auth_headers_provider = HeadersProvider::new(Some("123".to_owned()));
		let entity_client = EntityClient::new(
			"http://test.com".to_owned(),
			Arc::new(rest_client),
			Arc::new(InstanceMapper::new()),
			Arc::new(JsonSerializer::new(type_model_provider.clone())),
			Arc::new(auth_headers_provider),
			type_model_provider.clone(),
		);

		let result_entity = entity_client
			.read_range(
				&TestListGeneratedElementIdEntity::type_ref(),
				&list_id,
				&GeneratedId::min_id(),
				100,
				ListLoadDirection::ASC,
			)
			.await
			.expect("success");
		assert_eq!(result_entity, vec![entity_map]);
	}

	#[tokio::test]
	async fn test_load_range_asc_custom_element_id() {
		let type_model_provider = mock_type_model_provider();

		let list_id = GeneratedId("list_id".to_owned());
		let entity_map: ParsedEntity = collection! {
			ID_FIELD => ElementValue::IdTupleCustomElementId(IdTupleCustom::new(list_id.clone(), CustomId("element_id".to_owned()))),
			"field" => ElementValue::Bytes(vec![1, 2, 3])
		};
		let mut rest_client = MockRestClient::new();
		let url = "http://test.com/rest/test/TestListCustomElementIdEntity/list_id?start=------------&count=100&reverse=false";
		let json_folder = JsonSerializer::new(type_model_provider.clone())
			.serialize(
				&TestListCustomElementIdEntity::type_ref(),
				entity_map.clone(),
			)
			.unwrap();
		rest_client
			.expect_request_binary()
			.with(eq(url.to_owned()), eq(HttpMethod::GET), always())
			.return_once(move |_, _, _| {
				Ok(RestResponse {
					status: 200,
					headers: HashMap::default(),
					body: Some(serde_json::to_vec(&vec![json_folder]).unwrap()),
				})
			});

		let auth_headers_provider = HeadersProvider::new(Some("123".to_owned()));
		let entity_client = EntityClient::new(
			"http://test.com".to_owned(),
			Arc::new(rest_client),
			Arc::new(InstanceMapper::new()),
			Arc::new(JsonSerializer::new(type_model_provider.clone())),
			Arc::new(auth_headers_provider),
			type_model_provider.clone(),
		);

		let result_entity = entity_client
			.read_range(
				&TestListCustomElementIdEntity::type_ref(),
				&list_id,
				&CustomId("------------".to_owned()),
				100,
				ListLoadDirection::ASC,
			)
			.await
			.expect("success");
		assert_eq!(result_entity, vec![entity_map]);
	}

	fn mock_type_model_provider() -> Arc<TypeModelProvider> {
		let list_entity_generated_type_model: TypeModel = TypeModel {
			id: 1,
			since: 1,
			app: "test",
			version: "1",
			name: "TestListGeneratedElementIdEntity",
			element_type: ElementType::ListElement,
			versioned: false,
			encrypted: true,
			root_id: "",
			values: str_map! {
				ID_FIELD => ModelValue {
						id: 1,
						value_type: ValueType::GeneratedId,
						cardinality: Cardinality::One,
						is_final: true,
						encrypted: false,
					},
				"field" =>
					ModelValue {
						id: 2,
						value_type: ValueType::String,
						cardinality: Cardinality::One,
						is_final: false,
						encrypted: true,
					},
			},
			associations: HashMap::default(),
		};

		let list_entity_custom_type_model: TypeModel = TypeModel {
			id: 1,
			since: 1,
			app: "test",
			version: "1",
			name: "TestListCustomElementIdEntity",
			element_type: ElementType::ListElement,
			versioned: false,
			encrypted: true,
			root_id: "",
			values: str_map! {
				ID_FIELD => ModelValue {
						id: 1,
						value_type: ValueType::CustomId,
						cardinality: Cardinality::One,
						is_final: true,
						encrypted: false,
					},
				"field" =>
					ModelValue {
						id: 2,
						value_type: ValueType::String,
						cardinality: Cardinality::One,
						is_final: false,
						encrypted: true,
					},
			},
			associations: HashMap::default(),
		};

		let type_model_provider = Arc::new(TypeModelProvider::new(str_map! {
			"test" => str_map! {
				"TestListGeneratedElementIdEntity" => list_entity_generated_type_model,
				"TestListCustomElementIdEntity" => list_entity_custom_type_model,
			}
		}));
		type_model_provider
	}
}
