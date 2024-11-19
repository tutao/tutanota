use std::sync::Arc;

use crate::bindings::rest_client::{HttpMethod, RestClient, RestClientOptions};
use crate::bindings::suspendable_rest_client::SuspensionBehavior;
use crate::element_value::{ElementValue, ParsedEntity};
use crate::entities::entity_facade::ID_FIELD;
use crate::id::id_tuple::{BaseIdType, IdTupleType, IdType};
use crate::json_element::RawEntity;
use crate::json_serializer::JsonSerializer;
use crate::metamodel::{ElementType, TypeModel};
use crate::rest_error::HttpError;
use crate::type_model_provider::TypeModelProvider;
use crate::GeneratedId;
use crate::{ApiCallError, HeadersProvider, ListLoadDirection, TypeRef};

/// A high level interface to manipulate unencrypted entities/instances via the REST API
pub struct EntityClient {
	rest_client: Arc<dyn RestClient>,
	base_url: String,
	auth_headers_provider: Arc<HeadersProvider>,
	json_serializer: Arc<JsonSerializer>,
	type_model_provider: Arc<TypeModelProvider>,
}

impl EntityClient {
	#[allow(dead_code)]
	pub(crate) fn new(
		rest_client: Arc<dyn RestClient>,
		json_serializer: Arc<JsonSerializer>,
		base_url: String,
		auth_headers_provider: Arc<HeadersProvider>,
		type_model_provider: Arc<TypeModelProvider>,
	) -> Self {
		EntityClient {
			rest_client,
			json_serializer,
			base_url,
			auth_headers_provider,
			type_model_provider,
		}
	}

	/// Gets an entity/instance of type `type_ref` from the backend
	#[allow(unused)]
	pub async fn load<Id: IdType>(
		&self,
		type_ref: &TypeRef,
		id: &Id,
	) -> Result<ParsedEntity, ApiCallError> {
		let url = format!(
			"{}/rest/{}/{}/{}",
			self.base_url, type_ref.app, type_ref.type_, id
		);
		let response_bytes = self
			.prepare_and_fire(type_ref, url)
			.await?
			.expect("no body");
		let response_entity =
			serde_json::from_slice::<RawEntity>(response_bytes.as_slice()).unwrap();
		let parsed_entity = self.json_serializer.parse(type_ref, response_entity)?;
		Ok(parsed_entity)
	}

	/// Returns the definition of an entity/instance type using the internal `TypeModelProvider`
	pub fn get_type_model(&self, type_ref: &TypeRef) -> Result<&TypeModel, ApiCallError> {
		self.type_model_provider
			.get_type_model(type_ref.app, type_ref.type_)
			.ok_or_else(|| {
				let message = format!("Model {} not found in app {}", type_ref.type_, type_ref.app);
				ApiCallError::InternalSdkError {
					error_message: message,
				}
			})
	}

	/// Fetches and returns all entities/instances in a list element type
	#[allow(clippy::unused_async, unused)]
	pub async fn load_all(
		&self,
		_type_ref: &TypeRef,
		_list_id: &GeneratedId,
		_start: Option<String>,
	) -> Result<Vec<ParsedEntity>, ApiCallError> {
		todo!("entity client load_all")
	}

	/// Fetches and returns a specified number (`count`) of entities/instances
	/// in a list element type starting at the index `start_id`
	#[allow(clippy::unused_async)]
	pub async fn load_range<Id: BaseIdType>(
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
			.prepare_and_fire(type_ref, url)
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

	/// Stores a newly created entity/instance as a single element on the backend
	#[allow(clippy::unused_async, unused)]
	pub async fn setup_element(&self, _type_ref: &TypeRef, _entity: RawEntity) -> Vec<String> {
		todo!("entity client setup_element")
	}

	/// Stores a newly created entity/instance as a part of a list element on the backend
	#[allow(clippy::unused_async, unused)]
	pub async fn setup_list_element(
		&self,
		_type_ref: &TypeRef,
		_list_id: &GeneratedId,
		_entity: RawEntity,
	) -> Vec<String> {
		todo!("entity client setup_list_element")
	}

	/// Updates an entity/instance in the backend
	#[allow(unused)]
	pub async fn update(
		&self,
		type_ref: &TypeRef,
		entity: ParsedEntity,
		model_version: u32,
	) -> Result<(), ApiCallError> {
		let id = match &entity.get(ID_FIELD).unwrap() {
			ElementValue::IdTupleGeneratedElementId(ref id_tuple) => id_tuple.to_string(),
			ElementValue::IdTupleCustomElementId(ref id_tuple) => id_tuple.to_string(),
			_ => panic!("id is not string or array"),
		};
		let raw_entity = self.json_serializer.serialize(type_ref, entity)?;
		let body = serde_json::to_vec(&raw_entity).unwrap();
		let mut options = RestClientOptions {
			body: Some(body),
			headers: self.auth_headers_provider.provide_headers(model_version),
			suspension_behavior: Some(SuspensionBehavior::Suspend),
		};
		options
			.headers
			.insert("Content-Type".to_owned(), "application/json".to_owned());
		// FIXME we should look at type model whether it is ET or LET
		let url = format!(
			"{}/rest/{}/{}/{}",
			self.base_url, type_ref.app, type_ref.type_, id
		);
		self.rest_client
			.request_binary(url, HttpMethod::PUT, options)
			.await?;
		Ok(())
	}

	/// Deletes an existing single entity/instance on the backend
	#[allow(clippy::unused_async, unused)]
	pub async fn erase_element(
		&self,
		_type_ref: &TypeRef,
		_id: &GeneratedId,
	) -> Result<(), ApiCallError> {
		todo!("entity client erase_element")
	}

	/// Deletes an existing entity/instance of a list element type on the backend
	#[allow(clippy::unused_async, unused)]
	pub async fn erase_list_element<Id: IdTupleType>(
		&self,
		_type_ref: &TypeRef,
		_id: Id,
	) -> Result<(), ApiCallError> {
		todo!("entity client erase_list_element")
	}

	async fn prepare_and_fire(
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
		let precondition = response.headers.get("precondition");
		match response.status {
			200..=299 => {
				// Ok
			},
			_ => {
				return Err(ApiCallError::ServerResponseError {
					source: HttpError::from_http_response(response.status, precondition)?,
				})
			},
		}
		Ok(response.body)
	}
}

#[cfg(test)]
mockall::mock! {
	pub EntityClient {
		pub fn new(
			rest_client: Arc<dyn RestClient>,
			json_serializer: Arc<JsonSerializer>,
			base_url: String,
			auth_headers_provider: Arc<HeadersProvider>,
			type_model_provider: Arc<TypeModelProvider>,
		) -> Self;
		pub fn get_type_model(&self, type_ref: &TypeRef) -> Result<&'static TypeModel, ApiCallError>;
		pub async fn load<Id: IdType>(
			&self,
			type_ref: &TypeRef,
			id: &Id,
		 ) -> Result<ParsedEntity, ApiCallError>;
		pub async fn load_all(
			&self,
			type_ref: &TypeRef,
			list_id: &GeneratedId,
			start: Option<String>,
		) -> Result<Vec<ParsedEntity>, ApiCallError>;
		pub async fn load_range<Id: BaseIdType>(
			&self,
			type_ref: &TypeRef,
			list_id: &GeneratedId,
			start_id: &Id,
			count: usize,
			list_load_direction: ListLoadDirection,
		) -> Result<Vec<ParsedEntity>, ApiCallError>;
		pub async fn setup_element(&self, type_ref: &TypeRef, entity: RawEntity) -> Vec<String>;
		pub async fn setup_list_element(
			&self,
			type_ref: &TypeRef,
			list_id: &GeneratedId,
			entity: RawEntity,
		) -> Vec<String>;
		pub async fn update(&self, type_ref: &TypeRef, entity: ParsedEntity, model_version: u32)
						-> Result<(), ApiCallError>;
		pub async fn erase_element(&self, type_ref: &TypeRef, id: &GeneratedId) -> Result<(), ApiCallError>;
		pub async fn erase_list_element<Id: IdTupleType>(&self, type_ref: &TypeRef, id: Id) -> Result<(), ApiCallError>;
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
			Arc::new(rest_client),
			Arc::new(JsonSerializer::new(type_model_provider.clone())),
			"http://test.com".to_owned(),
			Arc::new(auth_headers_provider),
			type_model_provider.clone(),
		);

		let result_entity = entity_client
			.load_range(
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
			Arc::new(rest_client),
			Arc::new(JsonSerializer::new(type_model_provider.clone())),
			"http://test.com".to_owned(),
			Arc::new(auth_headers_provider),
			type_model_provider.clone(),
		);

		let result_entity = entity_client
			.load_range(
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
			Arc::new(rest_client),
			Arc::new(JsonSerializer::new(type_model_provider.clone())),
			"http://test.com".to_owned(),
			Arc::new(auth_headers_provider),
			type_model_provider.clone(),
		);

		let result_entity = entity_client
			.load_range(
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
			Arc::new(rest_client),
			Arc::new(JsonSerializer::new(type_model_provider.clone())),
			"http://test.com".to_owned(),
			Arc::new(auth_headers_provider),
			type_model_provider.clone(),
		);

		let result_entity = entity_client
			.load_range(
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
