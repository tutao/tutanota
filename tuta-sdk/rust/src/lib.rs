use std::collections::HashMap;
use std::fmt::{Debug, Display, Formatter};
use std::ops::Deref;
use std::sync::{Arc, RwLock};

use serde::{Deserialize, Serialize};
use thiserror::Error;

use rest_client::{RestClient, RestClientError};
use crate::entity_client::EntityClient;
use crate::generated_id::GeneratedId;
use crate::instance_mapper::InstanceMapper;
use crate::json_serializer::{InstanceMapperError, JsonSerializer};
use crate::mail_facade::MailFacade;
use crate::rest_error::{HttpError, ParseFailureError};
use crate::type_model_provider::{AppName, init_type_model_provider, TypeName};
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
pub struct Sdk {
    state: Arc<SdkState>,
    entity_client: Arc<EntityClient>,
    unencrypted_entity_client: Arc<TypedEntityClient>,
}

#[uniffi::export]
impl Sdk {
    #[uniffi::constructor]
    pub fn new(base_url: String, rest_client: Arc<dyn RestClient>, client_version: &str) -> Sdk {
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

    pub fn user_facade(&self) -> UserFacade {
        todo!()
    }
}

impl SdkState {
    fn auth_headers(&self, model_version: u32) -> HashMap<String, String> {
        let g = self.login_state.read().unwrap();
        match g.deref() {
            LoginState::NotLoggedIn => HashMap::new(),
            LoginState::LoggedIn { access_token } => {
                HashMap::from([
                    ("accessToken".to_owned(), access_token.as_str().to_owned()),
                    ("cv".to_owned(), self.client_version.to_owned()),
                    ("v".to_owned(), model_version.to_string())
                ])
            }
        }
    }
}

#[derive(uniffi::Enum)]
pub enum ListLoadDirection {
    ASC,
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
