use std::collections::HashMap;

use crate::metamodel::TypeModel;
use crate::TypeRef;

// TODO: Change `AppName` into an enum of strings that is generated from the model
/// The name of an app in the backend
pub type AppName = &'static str;
pub type TypeId = u64;
pub type AttributeId = u64;

// Reads all provided type models into a map.
// Should be able to do it without a provided list, but it's much more work.
// Another improvement could be to have more efficient representation in the binary
macro_rules! read_type_models {
    ($($app_name:literal), +) => {{
        use ::std::collections::HashMap;
        let mut map = HashMap::new();

        $(
            let json = include_str!(concat!("type_models/", $app_name, ".json"));
            let model = ::serde_json::from_str::<HashMap<TypeId, TypeModel>>(&json)
                .expect(concat!("Could not parse type model ", $app_name));
            map.insert($app_name, model);
        )*

        map
    }}
}

static CLIENT_TYPE_MODEL: std::sync::LazyLock<HashMap<AppName, HashMap<TypeId, TypeModel>>> =
	std::sync::LazyLock::new(|| {
		read_type_models![
			"accounting",
			"base",
			"gossip",
			"monitor",
			"storage",
			"sys",
			"tutanota",
			"usage"
		]
	});

/// Contains a map between backend apps and entity/instance types within them
pub struct TypeModelProvider {
	pub app_models: &'static HashMap<AppName, HashMap<TypeId, TypeModel>>,
}

impl TypeModelProvider {
	pub fn new() -> TypeModelProvider {
		TypeModelProvider {
			app_models: &CLIENT_TYPE_MODEL,
		}
	}

	/// Gets an entity/instance type with a specified name in a backend app
	// FIXME: make this private and outside this file always use .resolve_type_ref instead
	pub fn get_type_model(&self, app_name: &str, entity_id: TypeId) -> Option<&TypeModel> {
		let app_map = self.app_models.get(app_name)?;
		app_map.get(&entity_id)
	}

	pub fn resolve_type_ref(&self, type_ref: &TypeRef) -> Option<&TypeModel> {
		self.get_type_model(type_ref.app, type_ref.type_id)
	}
}

#[cfg(test)]
mod tests {
	use crate::type_model_provider::TypeModelProvider;

	#[test]
	fn read_type_model_only_once() {
		let first_type_model = TypeModelProvider::new();
		let second_type_model = TypeModelProvider::new();

		assert!(std::ptr::eq(
			first_type_model.app_models,
			second_type_model.app_models
		));
	}
}
