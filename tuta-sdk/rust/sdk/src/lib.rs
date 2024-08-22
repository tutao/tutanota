use std::collections::HashMap;
use std::error::Error;
use std::fmt::{Debug, Display, Formatter};
use std::sync::Arc;

use minicbor::{Encode, Encoder};
use minicbor::encode::Write;
use serde::{Deserialize, Serialize};
use thiserror::Error;

use rest_client::{RestClient, RestClientError};

#[mockall_double::double]
use crate::crypto::crypto_facade::CryptoFacade;
#[mockall_double::double]
use crate::crypto_entity_client::CryptoEntityClient;
use crate::element_value::ElementValue;
use crate::entities::entity_facade::EntityFacade;
use crate::entities::tutanota::Mail;
#[mockall_double::double]
use crate::entity_client::EntityClient;
use crate::entity_client::IdType;
use crate::generated_id::GeneratedId;
use crate::instance_mapper::InstanceMapper;
use crate::json_serializer::{InstanceMapperError, JsonSerializer};
#[mockall_double::double]
use crate::key_cache::KeyCache;
#[mockall_double::double]
use crate::key_loader_facade::KeyLoaderFacade;
use crate::login::{Credentials, LoginError, LoginFacade};
use crate::mail_facade::MailFacade;
use crate::rest_error::{HttpError, ParseFailureError};
use crate::type_model_provider::{AppName, init_type_model_provider, TypeModelProvider, TypeName};
#[mockall_double::double]
use crate::typed_entity_client::TypedEntityClient;
#[mockall_double::double]
use crate::user_facade::UserFacade;

mod entity_client;
mod json_serializer;
mod json_element;
pub mod rest_client;
mod element_value;
mod metamodel;
mod type_model_provider;
mod mail_facade;
mod user_facade;
mod rest_error;
mod crypto;
mod util;
mod entities;
mod instance_mapper;
mod typed_entity_client;
mod key_loader_facade;
mod key_cache;
pub mod date;
pub mod generated_id;
mod custom_id;
pub mod login;
mod crypto_entity_client;
mod logging;
mod simple_crypto;

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
        let mut headers = HashMap::from([
            ("accessToken".to_string(), self.credentials.access_token.to_owned()),
        ]);
        headers.insert("cv".to_owned(), self.client_version.to_owned());
        headers.insert("v".to_owned(), model_version.to_string());
        headers
    }
}

/// Contains all the high level mutable state of the SDK
struct SdkState {
    credentials: Credentials,
    client_version: String,
}

/// The external facing interface used by the consuming code via FFI
#[derive(uniffi::Object)]
pub struct Sdk {
    state: Arc<SdkState>,
    type_model_provider: Arc<TypeModelProvider>,
    entity_client: Arc<EntityClient>,
    typed_entity_client: Arc<TypedEntityClient>,
    instance_mapper: Arc<InstanceMapper>,
}

#[uniffi::export]
impl Sdk {
    #[uniffi::constructor]
    pub fn new(base_url: String, rest_client: Arc<dyn RestClient>, credentials: Credentials, client_version: &str) -> Sdk {
        logging::init_logger();
        log::debug!("Initializing SDK...");

        let type_model_provider = Arc::new(init_type_model_provider());
        // TODO validate parameters
        let json_serializer = Arc::new(JsonSerializer::new(type_model_provider.clone()));
        let instance_mapper = Arc::new(InstanceMapper::new());
        let state = Arc::new(SdkState {
            credentials,
            client_version: client_version.to_owned(),
        });
        let entity_client = Arc::new(EntityClient::new(
            rest_client,
            json_serializer,
            &base_url,
            state.clone(),
            type_model_provider.clone(),
        ));
        let typed_entity_client: Arc<TypedEntityClient> = Arc::new(TypedEntityClient::new(
            entity_client.clone(),
            instance_mapper.clone()
        ));

        Sdk {
            state,
            type_model_provider,
            entity_client,
            typed_entity_client,
            instance_mapper
        }
    }

    /// Authorizes the SDK's REST requests via inserting `access_token` into the HTTP headers
    pub async fn login(&self) -> Result<Arc<LoggedInSdk>, LoginError> {
        // Try to resume session
        let login_facade = LoginFacade::new(
            self.entity_client.clone(),
            self.typed_entity_client.clone(),
            |user| UserFacade::new(Arc::new(KeyCache::new()), user)
        );
        let user_facade = Arc::new(login_facade.resume_session(&self.state.credentials).await?);

        let key_loader = Arc::new(KeyLoaderFacade::new(
            user_facade.clone(),
            self.typed_entity_client.clone()
        ));
        let crypto_facade = Arc::new(CryptoFacade::new(
            key_loader.clone(),
            self.instance_mapper.clone(),
        ));
        let entity_facade = Arc::new(EntityFacade::new(self.type_model_provider.clone()));
        let crypto_entity_client: Arc<CryptoEntityClient> = Arc::new(CryptoEntityClient::new(
            self.entity_client.clone(),
            entity_facade,
            crypto_facade,
            self.instance_mapper.clone()
        ));

        Ok(Arc::new(LoggedInSdk {
            user_facade,
            typed_entity_client: self.typed_entity_client.clone(),
            crypto_entity_client,
        }))
    }
}

#[allow(dead_code)]
#[derive(uniffi::Object)]
pub struct LoggedInSdk {
    user_facade: Arc<UserFacade>,
    typed_entity_client: Arc<TypedEntityClient>,
    crypto_entity_client: Arc<CryptoEntityClient>
}

#[uniffi::export]
impl LoggedInSdk {
    /// Generates a new interface to operate on mail entities
    pub fn mail_facade(&self) -> MailFacade {
        MailFacade::new(self.crypto_entity_client.clone())
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

impl IdType for IdTuple {}

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

#[uniffi::export]
pub fn serialize_mail(mail: Mail) -> Vec<u8> {
    let entity_map = InstanceMapper::new().serialize_entity(mail).unwrap();
    let mut vec = Vec::new();
    let mut encoder = Encoder::new(&mut vec);
    encoder.encode(&entity_map).unwrap();
    vec
}

impl<C> Encode<C> for ElementValue {
    fn encode<W: Write>(
        &self,
        e: &mut Encoder<W>,
        _: &mut C,
    ) -> Result<(), minicbor::encode::Error<W::Error>> {
        match self {
            ElementValue::Null => e.null()?,
            ElementValue::String(s) => e.str(s)?,
            // JS-specific: some numbers might be big, so we encode them as strings
            ElementValue::Number(n) => e.str(n.to_string().as_str())?,
            ElementValue::Bytes(b) => e.bytes(b)?,
            // See OfflineStorage dateEncoder for this tag
            ElementValue::Date(d) => e.tag(minicbor::data::Tag::new(100))?.u64(d.as_millis())?,
            ElementValue::Bool(b) => e.bool(b.clone())?,
            ElementValue::IdGeneratedId(s) => e.str(s.as_str())?,
            ElementValue::IdCustomId(s) => e.str(s.as_str())?,
            ElementValue::IdTupleId(id) => e
                .array(2)?
                .str(id.list_id.as_str())?
                .str(id.element_id.as_str())?,
            ElementValue::Dict(d) => {
                e.map(d.len() as u64)?;
                for (k, v) in d {
                    e.str(k)?;
                    e.encode(v)?;
                }
                e
            }
            ElementValue::Array(a) => {
                e.array(a.len() as u64)?;
                for v in a {
                    e.encode(v)?;
                }
                e
            }
        };
        Ok(())
    }

    fn is_nil(&self) -> bool {
        return if let ElementValue::Null = self {
            true
        } else {
            false
        };
    }
}
#[cfg(test)]
mod tests {
    use crate::util::test_utils::create_test_entity;

    use super::*;

    #[test]
    fn test_serialize_mail_does_not_panic() {
        let mail = create_test_entity::<Mail>();
        serialize_mail(mail);
    }
}
