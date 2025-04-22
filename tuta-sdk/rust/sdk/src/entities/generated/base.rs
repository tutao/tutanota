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
			app: AppName::Base,
			type_id: TypeId::from(0),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ApplicationTypesGetOut {
	#[serde(rename = "5")]
	pub _format: i64,
	#[serde(rename = "6")]
	pub applicationTypesJson: String,
	#[serde(rename = "7")]
	pub applicationVersionSum: i64,
	#[serde(rename = "8")]
	pub applicationTypesHash: String,
}

impl Entity for ApplicationTypesGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Base,
			type_id: TypeId::from(4),
		}
	}
}
