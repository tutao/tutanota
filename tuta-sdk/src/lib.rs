use std::collections::HashMap;
use std::fmt::Debug;
use std::ops::Deref;
use std::sync::{Arc, RwLock};

use wasm_bindgen::prelude::wasm_bindgen;

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
            LoginState::LoggedIn { access_token } => HashMap::from([("accessToken".to_owned(), access_token.as_str().to_owned())])
        }
    }
}

#[derive(uniffi::Object)]
#[wasm_bindgen]
pub struct EntityClient {
    rest_client: Arc<dyn RestClient>,
    base_url: String,
    auth_headers_provider: Arc<dyn AuthHeadersProvider + Send + Sync>,
}

#[cfg(not(any(target_family = "wasm")))]
impl EntityClient {
    pub fn new<'a>(
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

#[derive(uniffi::Enum)]
pub enum JsonElement {
    Null,
    String(String),
    Number(i32),
    Element(HashMap<String, JsonElement>),
}

#[uniffi::export]
impl EntityClient {
    pub async fn load_list_element(
        &self,
        type_ref: &TypeRef,
        list_id: &str,
        element_id: &str,
    ) -> HashMap<String, JsonElement> {
        let options = RestClientOptions {
            body: None,
            headers: self.auth_headers_provider.auth_headers(),
        };
        let url = format!(
            "{}/rest/{}/{}/{}/{}",
            self.base_url, type_ref.app, type_ref.type_, list_id, element_id
        );
        let response = self
            .rest_client
            .request_binary(url, HttpMethod::GET, options)
            .await;
        let response_bytes = String::from_utf8(response.expect("no body")).unwrap();
        let mut map = HashMap::new();
        map.insert("response".to_owned(), JsonElement::String(response_bytes));
        return map;
    }

    pub async fn load_element(
        &self,
        type_ref: &TypeRef,
        id: String,
    ) -> HashMap<String, JsonElement> {
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
            .await;
        let response_bytes = String::from_utf8(response.expect("no body")).unwrap();
        let mut map = HashMap::new();
        map.insert("response".to_owned(), JsonElement::String(response_bytes));
        return map;
    }
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

#[uniffi::export(with_foreign)]
#[async_trait::async_trait]
pub trait RestClient: Send + Sync {
    async fn request_binary(
        &self,
        url: String,
        method: HttpMethod,
        options: RestClientOptions,
    ) -> Option<Vec<u8>>;
}
