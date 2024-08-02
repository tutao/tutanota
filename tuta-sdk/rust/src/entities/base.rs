#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Serialize, Deserialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PersistenceResourcePostReturn {
	pub _format: i64,
	pub generatedId: Option<Id>,
	pub permissionListId: Id,
}

impl Entity for PersistenceResourcePostReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "base".to_owned(), type_: "PersistenceResourcePostReturn".to_owned() }
	}
}
