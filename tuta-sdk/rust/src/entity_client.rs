use std::sync::Arc;

use crate::{ApiCallError, AuthHeadersProvider, IdTuple, RestClient, TypeRef};
use crate::element_value::{ElementValue, ParsedEntity};
use crate::json_serializer::JsonSerializer;
use crate::json_element::RawEntity;
use crate::rest_client::{HttpMethod, RestClientOptions};
use crate::rest_error::{HttpError};
use crate::type_model_provider::{TypeModelProvider};

/// The value used to identify an entity/instance within the backend
pub enum IdType {
    Single(String),
    Tuple(IdTuple),
}

/// A high level interface to manipulate entities/instances via the REST API
pub struct EntityClient {
    rest_client: Arc<dyn RestClient>,
    base_url: String,
    auth_headers_provider: Arc<dyn AuthHeadersProvider + Send + Sync>,
    instance_mapper: Arc<JsonSerializer>,
    type_model_provider: Arc<TypeModelProvider>,
}

impl EntityClient {
    pub(crate) fn new(
        rest_client: Arc<dyn RestClient>,
        instance_mapper: Arc<JsonSerializer>,
        base_url: &str,
        auth_headers_provider: Arc<dyn AuthHeadersProvider + Send + Sync>,
        type_model_provider: Arc<TypeModelProvider>,
    ) -> Self {
        EntityClient {
            rest_client,
            instance_mapper,
            base_url: base_url.to_owned(),
            auth_headers_provider,
            type_model_provider,
        }
    }
}

impl EntityClient {
    /// Gets an entity/instance of type `type_ref` from the backend
    pub async fn load_element(
        &self,
        type_ref: &TypeRef,
        id: &IdType,
    ) -> Result<ParsedEntity, ApiCallError> {
        let type_model = match self.type_model_provider.get_type_model(&type_ref.app, &type_ref.type_) {
            Some(value) => value,
            None => {
                let message = format!("Model {} not found in app {}", type_ref.type_, type_ref.app);
                return Err(ApiCallError::InternalSdkError { error_message: message });
            }
        };
        let url;
        match id {
            IdType::Single(value) => {
                url = format!(
                    "{}/rest/{}/{}/{}",
                    self.base_url, type_ref.app, type_ref.type_, value.to_owned()
                );
            }
            IdType::Tuple(value) => {
                url = format!(
                    "{}/rest/{}/{}/{}/{}",
                    self.base_url, type_ref.app, type_ref.type_, value.list_id, value.element_id
                );
            }
        }
        let model_version: u32 = type_model.version.parse().map_err(|_| {
            let message = format!("Tried to parse invalid model_version {}", type_model.version);
            ApiCallError::InternalSdkError { error_message: message }
        })?;
        let options = RestClientOptions {
            body: None,
            headers: self.auth_headers_provider.auth_headers(model_version),
        };
        let response = self
            .rest_client
            .request_binary(url, HttpMethod::GET, options)
            .await?;
        let precondition = response.headers.get("precondition");
        match response.status {
            200..=299 => {
                // Ok
            }
            _ => return Err(ApiCallError::ServerResponseError { source: HttpError::from_http_response(response.status, precondition)? })
        }
        let response_bytes = response.body.expect("no body");
        let response_entity = serde_json::from_slice::<RawEntity>(response_bytes.as_slice()).unwrap();
        let parsed_entity = self.instance_mapper.parse(type_ref, response_entity)?;
        Ok(parsed_entity)
    }
    //
    // pub async fn load_all(
    //     &self,
    //     type_ref: &TypeRef,
    //     list_id: String,
    //     start: Option<String>,
    // ) -> Vec<RawEntity> {
    //     unimplemented!()
    // }
    //
    // pub async fn load_range(
    //     &self,
    //     type_ref: &TypeRef,
    //     list_id: &str,
    //     start_id: &str,
    //     count: &str,
    //     list_load_direction: ListLoadDirection,
    // ) -> Vec<RawEntity> {
    //     unimplemented!()
    // }
    //
    // pub async fn setup_element(&self, type_ref: &TypeRef, entity: RawEntity) -> Vec<String> {
    //     unimplemented!()
    // }
    //
    // pub async fn setup_list_element(
    //     &self,
    //     type_ref: &TypeRef,
    //     list_id: &str,
    //     entity: RawEntity,
    // ) -> Vec<String> {
    //     unimplemented!()
    // }
    //
    /// Updates an entity/instance in the backend
    pub async fn update(&self, type_ref: &TypeRef, entity: ParsedEntity,
                        model_version: u32) -> Result<(), ApiCallError> {
        let id = match &entity.get("_id").unwrap() {
            ElementValue::IdTupleId(ref id_tuple) => {
                format!("{}/{}", &id_tuple.list_id, &id_tuple.element_id)
            }
            _ => panic!("id is not string or array"),
        };
        let raw_entity = self.instance_mapper.serialize(type_ref, entity)?;
        let body = serde_json::to_vec(&raw_entity).unwrap();
        let options = RestClientOptions {
            body: Some(body),
            headers: self.auth_headers_provider.auth_headers(model_version),
        };
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
    //
    // pub async fn erase_element(&self, type_ref: &TypeRef, id: &str) {
    //     unimplemented!()
    // }
    //
    // pub async fn erase_list_element(&self, type_ref: &TypeRef, id: IdTuple) {}
}
