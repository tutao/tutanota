use crate::entity_client::EntityClient;
use crate::instance_mapper::{InstanceMapper, InstanceMapperError, TypeModel, TypeModelProvider};
use crate::json_element::JsonElement;
use rest_client::{RestClient, RestClientError};
use std::collections::HashMap;
use std::fmt::{Debug, Display, Formatter};
use std::ops::Deref;
use std::sync::{Arc, RwLock};
use thiserror::Error;
use wasm_bindgen::prelude::wasm_bindgen;

mod entity_client;
mod instance_mapper;
mod json_element;
mod rest_client;

uniffi::setup_scaffolding!();

#[derive(uniffi::Record, Debug, Clone)]
#[wasm_bindgen(getter_with_clone)]
pub struct TypeRef {
    pub app: String,
    pub type_: String,
}

impl Display for TypeRef {
    fn fmt(&self, f: &mut Formatter<'_>) -> std::fmt::Result {
        write!(f, "TypeRef({}, {})", self.app, self.type_)
    }
}

#[cfg(target_family = "wasm")]
#[wasm_bindgen]
impl TypeRef {
    #[wasm_bindgen(constructor)]
    pub fn new(app: String, type_: String) -> TypeRef {
        TypeRef { app, type_ }
    }
}

trait AuthHeadersProvider {
    fn auth_headers(&self) -> HashMap<String, String>;
}

enum LoginState {
    NotLoggedIn,
    LoggedIn { access_token: String },
}

struct SdkState {
    login_state: RwLock<LoginState>,
}

#[derive(uniffi::Object)]
pub struct Sdk {
    state: Arc<SdkState>,
    base_url: String,
    rest_client: Arc<dyn RestClient>,
    instance_mapper: Arc<InstanceMapper>,
}

fn init_type_model_provider() -> TypeModelProvider {
    let tutanota_type_model_str = include_str!("../test_data/tutanota_type_model.json");
    let tutanota_type_model =
        serde_json::from_str::<HashMap<String, TypeModel>>(&tutanota_type_model_str)
            .expect("Could not parse type model :(");
    let type_model_provider = TypeModelProvider::new(HashMap::from([(
        "tutanota".to_owned(),
        tutanota_type_model,
    )]));
    type_model_provider
}

#[uniffi::export]
impl Sdk {
    // TODO: will add type models
    #[uniffi::constructor]
    pub fn new(base_url: String, rest_client: Arc<dyn RestClient>) -> Sdk {
        let type_model_provider = init_type_model_provider();
        // TODO validate parameters
        Sdk {
            state: Arc::new(SdkState {
                login_state: RwLock::new(LoginState::NotLoggedIn),
            }),
            instance_mapper: Arc::new(InstanceMapper::new(type_model_provider)),
            base_url,
            rest_client,
        }
    }

    pub fn login(&self, access_token: &str) {
        let mut login_state = self.state.login_state.write().unwrap();
        if let LoginState::LoggedIn { .. } = *login_state {
            panic!("Already logged in!")
        }
        *login_state = LoginState::LoggedIn {
            access_token: access_token.to_owned(),
        }
    }

    pub fn entity_client(&self) -> Arc<EntityClient> {
        Arc::new(EntityClient::new(
            self.rest_client.clone(),
            self.instance_mapper.clone(),
            &self.base_url,
            self.state.clone(),
        ))
    }
}

impl AuthHeadersProvider for SdkState {
    fn auth_headers(&self) -> HashMap<String, String> {
        let g = self.login_state.read().unwrap();
        match g.deref() {
            LoginState::NotLoggedIn => HashMap::new(),
            LoginState::LoggedIn { access_token } => {
                HashMap::from([("accessToken".to_owned(), access_token.as_str().to_owned())])
            }
        }
    }
}

pub type RawEntity = HashMap<String, JsonElement>;

#[derive(uniffi::Enum)]
pub enum ListLoadDirection {
    ASC,
    DESC,
}

#[derive(uniffi::Record, Debug, PartialEq, Clone)]
pub struct IdTuple {
    pub list_id: String,
    pub element_id: String,
}

impl IdTuple {
    pub fn new(list_id: String, element_id: String) -> Self {
        Self { list_id, element_id }
    }
}

#[derive(Error, Debug, uniffi::Error)]
pub enum ApiCallError {
    #[error("Rest client error, source: {source}")]
    RestClient {
        #[from]
        source: RestClientError,
    },
    #[error("ServerResponseError, status: {status}")]
    ServerResponseError { status: u32 },
    #[error("InstanceMapperError, source: {source}")]
    InstanceMappingError {
        #[from]
        source: InstanceMapperError,
    },
}
