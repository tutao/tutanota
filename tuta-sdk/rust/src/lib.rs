use std::collections::HashMap;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter};
use std::sync::{Arc, RwLock};

use serde::{Deserialize, Serialize};
use thiserror::Error;

use rest_client::{RestClient, RestClientError};
#[mockall_double::double]
use crate::entity_client::EntityClient;
use crate::generated_id::GeneratedId;
use crate::instance_mapper::InstanceMapper;
use crate::json_serializer::{InstanceMapperError, JsonSerializer};
use crate::mail_facade::MailFacade;
use crate::rest_error::{HttpError, ParseFailureError};
use crate::type_model_provider::{AppName, init_type_model_provider, TypeName};
#[mockall_double::double]
use crate::typed_entity_client::TypedEntityClient;
use crate::user_facade::UserFacade;

mod entity_client;
mod json_serializer;
mod json_element;
mod rest_client;
mod element_value;
mod metamodel;
mod type_model_provider;
mod mail_facade;
mod user_facade;
mod rest_error;
mod crypto;
mod util;
mod owner_enc_session_keys_update_queue;
mod entities;
mod instance_mapper;
mod typed_entity_client;
mod key_loader_facade;
mod key_cache;
pub mod date;
pub mod generated_id;
mod custom_id;
mod login;
mod crypto_entity_client;
mod logging;

uniffi::setup_scaffolding!();

/// A type for an instance/entity from the backend
/// Definitions for them can be found inside the type model JSON files under `/test_data`
#[derive(Debug, PartialEq, Clone)]
pub struct TypeRef {
    pub app: AppName,
    pub type_: TypeName,
}

// Option 1:
// metamodel -> Rust struct -> Kotlin/Swift classes
// need to be able to covert from ParsedEntity -> Rust struct
// will generate a bit more code but we need to write the conversion only once
// might or might not work for WASM

// Option 2:
// metamodel -> Kotlin/Swift classes
// need to be able to covert from ParsedEntity -> Kotlin/Swift class
// will generate a bit less code but we need to write the conversion for every platform
// will work for WASM for sure

impl Display for TypeRef {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "TypeRef({}, {})", self.app, self.type_)
    }
}

pub trait AuthHeadersProvider: Send + Sync {
    /// Gets the HTTP request headers used for authorizing REST requests
    fn create_auth_headers(&self, model_version: u32) -> HashMap<String, String>;
}

impl AuthHeadersProvider for SdkState {
    /// This version has client_version in header, unlike the LoginState version
    fn create_auth_headers(&self, model_version: u32) -> HashMap<String, String> {
        let auth_state = self.login_state.read().unwrap();
        let mut headers = auth_state.create_auth_headers(model_version);
        headers.insert("cv".to_owned(), self.client_version.to_owned());
        headers.insert("v".to_owned(), model_version.to_string());
        headers
    }
}

impl AuthHeadersProvider for LoginState {
    fn create_auth_headers(&self, _: u32) -> HashMap<String, String> {
        match self {
            LoginState::NotLoggedIn => HashMap::new(),
            LoginState::LoggedIn { access_token } => HashMap::from([
                ("accessToken".to_string(), access_token.clone()),
            ])
        }
    }
}

/// The authorization status and credentials of the SDK
enum LoginState {
    NotLoggedIn,
    LoggedIn { access_token: String },
}

/// Contains all the high level mutable state of the SDK
struct SdkState {
    login_state: RwLock<LoginState>,
    client_version: String,
}


/// The external facing interface used by the consuming code via FFI
#[derive(uniffi::Object)]
#[allow(unused_attributes)] // Avoid warnings about `unencrypted_entity_client` being unused
pub struct Sdk {
    state: Arc<SdkState>,
    entity_client: Arc<EntityClient>,
    unencrypted_entity_client: Arc<TypedEntityClient>,
}

#[uniffi::export]
impl Sdk {
    #[uniffi::constructor]
    pub fn new(base_url: String, rest_client: Arc<dyn RestClient>, client_version: &str) -> Sdk {
        logging::init_logger();
        log::debug!("Initializing SDK...");

        let type_model_provider = Arc::new(init_type_model_provider());
        // TODO validate parameters
        let json_serializer = Arc::new(JsonSerializer::new(Arc::clone(&type_model_provider)));
        let instance_mapper = Arc::new(InstanceMapper::new());
        let state = Arc::new(SdkState {
            login_state: RwLock::new(LoginState::NotLoggedIn),
            client_version: client_version.to_owned(),
        });
        let entity_client = Arc::new(EntityClient::new(
            rest_client,
            json_serializer,
            &base_url,
            state.clone(),
            Arc::clone(&type_model_provider),
        ));
        Sdk {
            state: state.clone(),
            entity_client: Arc::clone(&entity_client),
            unencrypted_entity_client: Arc::new(TypedEntityClient::new(
                entity_client,
                instance_mapper,
            )),
        }
    }

    /// Authorizes the SDK's REST requests via inserting `access_token` into the HTTP headers
    pub fn login(&self, access_token: &str) {
        let mut login_state = self.state.login_state.write().unwrap();
        if let LoginState::LoggedIn { .. } = *login_state {
            panic!("Already logged in!")
        }
        *login_state = LoginState::LoggedIn {
            access_token: access_token.to_owned(),
        }
    }


    /// Generates a new interface to operate on mail entities
    pub fn mail_facade(&self) -> MailFacade {
        MailFacade::new(self.entity_client.clone())
    }
}


#[derive(uniffi::Enum, Debug, PartialEq)]
pub enum ListLoadDirection {
    ASC,
    /// Reverse order
    DESC,
}

/// A set of keys used to identify an element within a List Element Type
#[derive(uniffi::Record, Debug, PartialEq, Clone, Serialize, Deserialize)]
pub struct IdTuple {
    pub list_id: GeneratedId,
    pub element_id: GeneratedId,
}

impl IdTuple {
    pub fn new(list_id: GeneratedId, element_id: GeneratedId) -> Self {
        Self { list_id, element_id }
    }
}

impl Display for IdTuple {
    fn fmt(&self, f: &mut Formatter) -> std::fmt::Result {
        write!(f, "{}/{}", self.list_id, self.element_id)
    }
}

/// Contains an error from the SDK to be handled by the consuming code over the FFI
#[derive(Error, Debug, uniffi::Error)]
pub enum ApiCallError {
    #[error("Rest client error, source: {source}")]
    RestClient {
        #[from]
        source: RestClientError,
    },
    #[error("ServerResponseError: {source}")]
    ServerResponseError {
        #[from]
        source: HttpError
    },
    #[error("InternalSdkError: {error_message}")]
    InternalSdkError {
        error_message: String,
    },
}

impl ApiCallError {
    fn internal_with_err<E: Error>(error: E, message: &str) -> ApiCallError {
        ApiCallError::InternalSdkError { error_message: format!("{}: {}", error, message) }
    }
}

impl From<InstanceMapperError> for ApiCallError {
    fn from(value: InstanceMapperError) -> Self {
        ApiCallError::InternalSdkError { error_message: value.to_string() }
    }
}

impl From<ParseFailureError> for ApiCallError {
    fn from(_value: ParseFailureError) -> Self {
        ApiCallError::InternalSdkError { error_message: "Parse error".to_owned() }
    }
}
