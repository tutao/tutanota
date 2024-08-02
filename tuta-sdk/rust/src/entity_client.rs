use std::collections::HashMap;
use std::fmt::Display;
use std::sync::Arc;

use crate::{ApiCallError, IdTuple, LoginState, ListLoadDirection, RestClient, SdkState, TypeRef};
use crate::element_value::{ElementValue, ParsedEntity};
use crate::generated_id::GeneratedId;
use crate::json_serializer::JsonSerializer;
use crate::json_element::RawEntity;
use crate::metamodel::TypeModel;
use crate::rest_client::{HttpMethod, RestClientOptions};
use crate::rest_error::{HttpError};
use crate::type_model_provider::{TypeModelProvider};
use crate::user_facade::AuthHeadersProvider;

/// Denotes an ID that can be serialised into a string
pub trait IdType: Display {}

impl IdType for String {}

impl IdType for GeneratedId {}

impl IdType for IdTuple {}


/// A high level interface to manipulate unencrypted entities/instances via the REST API
pub struct EntityClient {
    rest_client: Arc<dyn RestClient>,
    base_url: String,
    auth_headers_provider: Arc<dyn AuthHeadersProvider + Send + Sync>,
    json_serializer: Arc<JsonSerializer>,
    type_model_provider: Arc<TypeModelProvider>,
}

// TODO: Fix architecture of `AuthHeadersProvider`
impl AuthHeadersProvider for SdkState {
    /// This version has client_version in header, unlike the LoginState version
    fn create_auth_headers(&self, model_version: u32) -> HashMap<String, String> {
        let auth_state = self.login_state.read().unwrap();
        let mut headers = auth_state.create_auth_headers(model_version);
        headers.insert("cv".to_owned(), self.client_version.to_owned());
        headers.insert("v".to_owned(), model_version.to_string());
        headers
    }

    fn is_fully_logged_in(&self) -> bool {
        let auth_state = self.login_state.read().unwrap();
        auth_state.is_fully_logged_in()
    }
}

impl AuthHeadersProvider for LoginState {
    fn create_auth_headers(&self, _model_version: u32) -> HashMap<String, String> {
        match self {
            LoginState::NotLoggedIn => HashMap::new(),
            LoginState::LoggedIn { access_token } => HashMap::from([
                ("accessToken".to_string(), access_token.clone()),
            ])
        }
    }

    fn is_fully_logged_in(&self) -> bool {
        return match self {
            LoginState::NotLoggedIn => false,
            LoginState::LoggedIn { .. } => true
        };
    }
}


// TODO: remove this allowance after completing the implementation of `EntityClient`
#[allow(unused_variables)]
impl EntityClient {
    pub(crate) fn new(
        rest_client: Arc<dyn RestClient>,
        json_serializer: Arc<JsonSerializer>,
        base_url: &str,
        auth_headers_provider: Arc<dyn AuthHeadersProvider + Send + Sync>,
        type_model_provider: Arc<TypeModelProvider>,
    ) -> Self {
        EntityClient {
            rest_client,
            json_serializer,
            base_url: base_url.to_owned(),
            auth_headers_provider,
            type_model_provider,
        }
    }

    /// Gets an entity/instance of type `type_ref` from the backend
    pub async fn load<T: IdType>(
        &self,
        type_ref: &TypeRef,
        id: &T,
    ) -> Result<ParsedEntity, ApiCallError> {
        let type_model = self.get_type_model(&type_ref)?;
        let url = format!("{}/rest/{}/{}/{}", self.base_url, type_ref.app, type_ref.type_, id);
        let model_version: u32 = type_model.version.parse().map_err(|_| {
            let message = format!("Tried to parse invalid model_version {}", type_model.version);
            ApiCallError::InternalSdkError { error_message: message }
        })?;
        let options = RestClientOptions {
            body: None,
            headers: self.auth_headers_provider.create_auth_headers(model_version),
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
        let parsed_entity = self.json_serializer.parse(type_ref, response_entity)?;
        Ok(parsed_entity)
    }

    /// Returns the definition of an entity/instance type using the internal `TypeModelProvider`
    pub fn get_type_model(&self, type_ref: &TypeRef) -> Result<&TypeModel, ApiCallError> {
        let type_model = match self.type_model_provider.get_type_model(&type_ref.app, &type_ref.type_) {
            Some(value) => value,
            None => {
                let message = format!("Model {} not found in app {}", type_ref.type_, type_ref.app);
                return Err(ApiCallError::InternalSdkError { error_message: message });
            }
        };
        Ok(type_model)
    }

    /// Fetches and returns all entities/instances in a list element type
    pub async fn load_all(
        &self,
        type_ref: &TypeRef,
        list_id: &IdTuple,
        start: Option<String>,
    ) -> Result<Vec<ParsedEntity>, ApiCallError> {
        todo!()
    }

    /// Fetches and returns a specified number (`count`) of entities/instances
    /// in a list element type starting at the index `start_id`
    pub async fn load_range(
        &self,
        type_ref: &TypeRef,
        list_id: &IdTuple,
        start_id: &str,
        count: &str,
        list_load_direction: ListLoadDirection,
    ) -> Result<Vec<ParsedEntity>, ApiCallError> {
        todo!()
    }

    /// Stores a newly created entity/instance as a single element on the backend
    pub async fn setup_element(&self, type_ref: &TypeRef, entity: RawEntity) -> Vec<String> {
        todo!()
    }

    /// Stores a newly created entity/instance as a part of a list element on the backend
    pub async fn setup_list_element(
        &self,
        type_ref: &TypeRef,
        list_id: &IdTuple,
        entity: RawEntity,
    ) -> Vec<String> {
        todo!()
    }

    /// Updates an entity/instance in the backend
    pub async fn update(&self, type_ref: &TypeRef, entity: ParsedEntity,
                        model_version: u32) -> Result<(), ApiCallError> {
        let id = match &entity.get("_id").unwrap() {
            ElementValue::IdTupleId(ref id_tuple) => id_tuple.to_string(),
            _ => panic!("id is not string or array"),
        };
        let raw_entity = self.json_serializer.serialize(type_ref, entity)?;
        let body = serde_json::to_vec(&raw_entity).unwrap();
        let options = RestClientOptions {
            body: Some(body),
            headers: self.auth_headers_provider.create_auth_headers(model_version),
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

    /// Deletes an existing single entity/instance on the backend
    pub async fn erase_element(&self, type_ref: &TypeRef, id: &GeneratedId) -> Result<(), ApiCallError> {
        todo!()
    }

    /// Deletes an existing entity/instance of a list element type on the backend
    pub async fn erase_list_element(&self, type_ref: &TypeRef, id: IdTuple) -> Result<(), ApiCallError> {
        todo!()
    }
}

#[cfg(test)]
mockall::mock! {
    pub EntityClient {
        pub async fn load<T: IdType  + 'static>(
            &self,
            type_ref: &TypeRef,
            id: &T,
        ) -> Result<ParsedEntity, ApiCallError>;
        pub fn get_type_model(&self, type_ref: &TypeRef) -> Result<&'static TypeModel, ApiCallError>;
        pub async fn load_all(
            &self,
            type_ref: &TypeRef,
            list_id: &IdTuple,
            start: Option<String>,
        ) -> Result<Vec<ParsedEntity>, ApiCallError>;
        pub async fn load_range(
            &self,
            type_ref: &TypeRef,
            list_id: &IdTuple,
            start_id: &str,
            count: &str,
            list_load_direction: ListLoadDirection,
        ) -> Result<Vec<ParsedEntity>, ApiCallError>;
        pub async fn setup_element(&self, type_ref: &TypeRef, entity: RawEntity) -> Vec<String>;
        pub async fn setup_list_element(
            &self,
            type_ref: &TypeRef,
            list_id: &IdTuple,
            entity: RawEntity,
        ) -> Vec<String>;
        pub async fn update(&self, type_ref: &TypeRef, entity: ParsedEntity, model_version: u32)
                        -> Result<(), ApiCallError>;
        pub async fn erase_element(&self, type_ref: &TypeRef, id: &GeneratedId) -> Result<(), ApiCallError>;
        pub async fn erase_list_element(&self, type_ref: &TypeRef, id: IdTuple) -> Result<(), ApiCallError>;
    }
}
