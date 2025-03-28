// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PersistenceResourcePostReturn {
	#[serde(rename = "1")]
	pub _format: i64,
	#[serde(rename = "2")]
	pub generatedId: Option<GeneratedId>,
	#[serde(rename = "3")]
	pub permissionListId: GeneratedId,
}

impl Entity for PersistenceResourcePostReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "base",
			type_id: 0,
		}
	}
}
