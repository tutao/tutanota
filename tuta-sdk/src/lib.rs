use std::collections::HashMap;
use std::fmt::{Debug};
use std::ops::Deref;
use std::sync::{Arc, RwLock};
use thiserror::Error;
use wasm_bindgen::prelude::wasm_bindgen;
use crate::json_element::JsonElement;

mod json_element;

uniffi::setup_scaffolding!();

#[derive(uniffi::Record, Debug)]
#[wasm_bindgen(getter_with_clone)]
pub struct TypeRef {
    pub app: String,
    pub type_: String,
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
}

#[uniffi::export]
impl Sdk {
    // TODO: will add type models
    #[uniffi::constructor]
    pub fn new(base_url: String, rest_client: Arc<dyn RestClient>) -> Sdk {
        // TODO validate parameters
        Sdk {
            state: Arc::new(SdkState {
                login_state: RwLock::new(LoginState::NotLoggedIn),
            }),
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

// It is kind of not ideal that this structure is public as it needs some references and also
// exposes some internal fields that we have. Might be better to have an EntityClient that is our
// actual impl and that can make take advantage of some lifetime stuff and then expose a wrapper
// around it.
#[derive(uniffi::Object)]
#[wasm_bindgen]
pub struct EntityClient {
    rest_client: Arc<dyn RestClient>,
    base_url: String,
    auth_headers_provider: Arc<dyn AuthHeadersProvider + Send + Sync>,
}

#[cfg(not(any(target_family = "wasm")))]
impl EntityClient {
    fn new<'a>(
        rest_client: Arc<dyn RestClient>,
        base_url: &str,
        auth_headers_provider: Arc<dyn AuthHeadersProvider + Send + Sync>,
    ) -> Self {
        EntityClient {
            rest_client,
            base_url: base_url.to_owned(),
            auth_headers_provider,
        }
    }
}

#[cfg(target_family = "wasm")]
#[wasm_bindgen]
impl EntityClient {
    #[wasm_bindgen(constructor)]
    pub fn wasm_new(rest_client: &dyn RestClient) -> EntityClient {
        EntityClient {
            rest_client: Arc::new(rest_client),
        }
    }
}

pub type RawEntity = HashMap<String, json_element::JsonElement>;

#[derive(uniffi::Enum)]
pub enum ListLoadDirection {
    ASC,
    DESC,
}

#[derive(uniffi::Record, Debug)]
pub struct IdTuple {
    pub list_id: String,
    pub element_id: String,
}

#[derive(Error, Debug, uniffi::Error)]
pub enum ApiCallError {
    #[error("Rest client error")]
    RestClient {
        #[from]
        source: RestClientError
    },
}

#[uniffi::export]
impl EntityClient {
    pub async fn load_list_element(
        &self,
        type_ref: &TypeRef,
        id: &IdTuple,
    ) -> Result<RawEntity, ApiCallError> {
        let options = RestClientOptions {
            body: None,
            headers: self.auth_headers_provider.auth_headers(),
        };
        let url = format!(
            "{}/rest/{}/{}/{}/{}",
            self.base_url, type_ref.app, type_ref.type_, id.list_id, id.element_id
        );
        let response = self
            .rest_client
            .request_binary(url, HttpMethod::GET, options)
            .await?;
        let response_bytes = response.expect("no body");
        let response_entity = serde_json::from_slice(response_bytes.as_slice()).unwrap();
        Ok(response_entity)
    }

    pub async fn load_element(&self, type_ref: &TypeRef, id: &str) -> Result<RawEntity, ApiCallError> {
        let options = RestClientOptions {
            body: None,
            headers: self.auth_headers_provider.auth_headers(),
        };
        let url = format!(
            "{}/rest/{}/{}/{}",
            self.base_url, type_ref.app, type_ref.type_, id
        );
        let response = self
            .rest_client
            .request_binary(url, HttpMethod::GET, options)
            .await?;
        let response_bytes = response.expect("no body");
        let response_entity = serde_json::from_slice(response_bytes.as_slice()).unwrap();
        Ok(response_entity)
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
    pub async fn update(&self, type_ref: &TypeRef, entity: RawEntity) -> Result<(), ApiCallError> {
        let body = serde_json::to_vec(&entity).unwrap();
        let options = RestClientOptions {
            body: Some(body),
            headers: self.auth_headers_provider.auth_headers(),
        };
        // FIXME we should look at type model whether it is ET or LET
        let id = match entity.get("_id").unwrap() {
            JsonElement::String(id) => id.clone(),
            JsonElement::Array(id_vec) => {
                let list_id = id_vec.get(0).unwrap().assert_str();
                format!("{}/{}", list_id, id_vec.get(1).unwrap().assert_str())
            }
            _ => panic!("id is not string or array")
        };
        let url = format!(
            "{}/rest/{}/{}/{}",
            self.base_url, type_ref.app, type_ref.type_, id
        );
        self
            .rest_client
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

#[derive(uniffi::Enum)]
pub enum HttpMethod {
    GET,
    POST,
    PUT,
    DELETE,
}

#[derive(uniffi::Record)]
pub struct RestClientOptions {
    pub headers: HashMap<String, String>,
    pub body: Option<Vec<u8>>,
}

#[derive(Error, Debug, uniffi::Error)]
pub enum RestClientError {
    #[error("Network error")]
    NetworkError,
    #[error("Server response error, status: {status}")]
    ServerResponseError { status: u32 },
}

#[uniffi::export(with_foreign)]
#[async_trait::async_trait]
pub trait RestClient: Send + Sync {
    async fn request_binary(
        &self,
        url: String,
        method: HttpMethod,
        options: RestClientOptions,
    ) -> Result<Option<Vec<u8>>, RestClientError>;
}
