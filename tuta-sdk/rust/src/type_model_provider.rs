use std::collections::HashMap;

use crate::metamodel::TypeModel;

/// The name of an app in the backend
type AppName = String;
/// The name of an entity/instance type in the backend
type TypeName = String;

/// Contains a map between backend apps and entity/instance types within them
pub struct TypeModelProvider {
    app_models: HashMap<AppName, HashMap<TypeName, TypeModel>>,
}

impl TypeModelProvider {
    pub fn new(app_models: HashMap<String, HashMap<String, TypeModel>>) -> TypeModelProvider {
        TypeModelProvider { app_models }
    }

    /// Gets an entity/instance type with a specified name in a backend app
    pub fn get_type_model(&self, app_name: &str, entity_name: &str) -> Option<&TypeModel> {
        let app_map = self.app_models.get(app_name)?;
        let entity_model = app_map.get(entity_name)?;
        Some(entity_model)
    }
}

// Reads all provided type models into a map.
// Should be able to do it without a provided list, but it's much more work.
// Another improvement could be to have more efficient representation in the binary
macro_rules! read_type_models {
    ($($type_model:expr), +) => {{
        use ::std::collections::HashMap;
        let mut map = HashMap::new();

        $(
            let json = include_str!(concat!("type_models/", $type_model, ".json"));
            let model = ::serde_json::from_str::<HashMap<String, TypeModel>>(&json)
                .expect(concat!("Could not parse type model ", $type_model));
            map.insert($type_model.to_owned(), model);
        )*

        map
    }}
}


/// Creates a new `TypeModelProvider` populated with the type models from the JSON type model files
pub fn init_type_model_provider() -> TypeModelProvider {
    let type_model_map = read_type_models![
        "accounting",
        "base",
        "gossip",
        "monitor",
        "storage",
        "sys",
        "tutanota",
        "usage"
        ];
    let type_model_provider = TypeModelProvider::new(type_model_map);
    type_model_provider
}

