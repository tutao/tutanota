use std::sync::Arc;
uniffi::setup_scaffolding!();

#[derive(uniffi::Record)]
#[derive(Debug)]
struct TypeRef {
    app: String,
    type_: String,
}

#[derive(uniffi::Object)]
struct EntityClient {

}

#[uniffi::export]
impl EntityClient {
    #[uniffi::constructor]
    fn new() -> Arc<Self> {
        Arc::new(EntityClient {})
    }

    fn load_element(&self, type_ref: &TypeRef, id: String) -> String {
        return String::from(format!("hi from rust! {:?} {:?}", type_ref, id))
    }
}