use wasm_bindgen::prelude::wasm_bindgen;
use std::sync::{Arc, TryLockError};

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
pub struct EntityClient {}

#[cfg(not(any(target_family = "wasm")))]
#[uniffi::export]
impl EntityClient {
    #[cfg(not(any(target_family = "wasm")))]
    #[uniffi::constructor]
    pub fn new() -> Arc<EntityClient> {
        Arc::new(EntityClient {})
    }
}

#[cfg(target_family = "wasm")]
#[wasm_bindgen]
impl EntityClient {
    #[wasm_bindgen(constructor)]
    pub fn wasm_new() -> EntityClient {
        EntityClient {}
    }
}

#[wasm_bindgen]
#[uniffi::export]
impl EntityClient {
    #[wasm_bindgen]
    pub async fn load_element(&self, type_ref: &TypeRef, id: String) -> String {
        return String::from(format!("hi from rust! {:?} {:?}", type_ref, id));
    }
}


#[wasm_bindgen]
struct TestStruct {}

#[wasm_bindgen]
impl TestStruct {
    #[wasm_bindgen(constructor)]
    pub fn wasm_new() -> TestStruct {
        return TestStruct {};
    }
}