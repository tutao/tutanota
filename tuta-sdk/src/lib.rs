use std::collections::HashMap;
use std::fmt::Debug;

use std::sync::Arc;

use wasm_bindgen::prelude::wasm_bindgen;

uniffi::setup_scaffolding!();

#[derive(uniffi::Record)]
#[derive(Debug)]
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

#[derive(uniffi::Object)]
#[wasm_bindgen]
pub struct EntityClient {
    rest_client: Arc<dyn RestClient>
}

#[cfg(not(any(target_family = "wasm")))]
#[uniffi::export]
impl EntityClient {
    #[cfg(not(any(target_family = "wasm")))]
    #[uniffi::constructor]
    pub fn new(rest_client: Arc<dyn RestClient>) -> Arc<Self> {
        Arc::new(EntityClient {rest_client})
    }
}

#[cfg(target_family = "wasm")]
#[wasm_bindgen]
impl EntityClient {
    #[wasm_bindgen(constructor)]
    pub fn wasm_new(rest_client: &dyn RestClient) -> EntityClient {
        EntityClient {rest_client: Arc::new(rest_client)}
    }
}

#[wasm_bindgen]
#[uniffi::export]
impl EntityClient {
    #[wasm_bindgen]
    pub async fn load_element(&self, type_ref: &TypeRef, id: String) -> String {
        let options = RestClientOptions {
            body: None,
            headers: HashMap::from([("Header".to_owned(), "Value".to_owned())]),
            query: None,
        };
        let url = format!("http://test.com/{}/{}/{}", type_ref.app, type_ref.app, id);
        let response = self.rest_client.request_string(url, HttpMethod::GET, options).await;
        return String::from(format!("hi from rust! {}", response));
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
    pub query: Option<HashMap<String, String>>,
    pub body: Option<Vec<u8>>,
}


#[uniffi::export]
#[async_trait::async_trait]
pub trait RestClient : Send + Sync {
     async fn request_binary(&self, url: String, method: HttpMethod, options: RestClientOptions) -> Vec<u8>;
     async fn request_string(&self, url: String, method: HttpMethod, options: RestClientOptions) -> String;
}