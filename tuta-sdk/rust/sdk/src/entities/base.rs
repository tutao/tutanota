#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct PersistenceResourcePostReturn {
	pub _format: i64,
	pub generatedId: Option<GeneratedId>,
	pub permissionListId: GeneratedId,
}
impl Entity for PersistenceResourcePostReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "base",
			type_: "PersistenceResourcePostReturn",
		}
	}
}
