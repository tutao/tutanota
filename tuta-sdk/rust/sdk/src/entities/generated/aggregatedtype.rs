// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Et1 {
	#[serde(rename = "19")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "20")]
	pub _permissions: GeneratedId,
	#[serde(rename = "21")]
	pub _format: i64,
	#[serde(rename = "22")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "23")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "24")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "48")]
	pub oneAggregated: Option<At2>,
	#[serde(rename = "49")]
	pub anyAggregated: Vec<At2>,

	#[serde(default)]
	pub _errors: Errors,
}

impl Entity for Et1 {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Aggregatedtype,
			type_id: TypeId::from(17),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct At1 {
	#[serde(rename = "26")]
	pub _id: Option<CustomId>,
}

impl Entity for At1 {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Aggregatedtype,
			type_id: TypeId::from(25),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct At2 {
	#[serde(rename = "36")]
	pub _id: Option<CustomId>,
	#[serde(rename = "37")]
	#[serde(with = "serde_bytes")]
	pub BytesValue: Vec<u8>,
	#[serde(rename = "38")]
	pub StringValue: String,
	#[serde(rename = "39")]
	pub LongValue: i64,
	#[serde(rename = "40")]
	pub DateValue: DateTime,
	#[serde(rename = "41")]
	pub BooleanValue: bool,
	#[serde(rename = "42")]
	pub oneResource: Option<GeneratedId>,
	#[serde(rename = "43")]
	pub anyResource: Vec<GeneratedId>,
	#[serde(rename = "44")]
	pub oneAggregated: Option<At1>,
	#[serde(rename = "45")]
	pub anyAggregated: Vec<At1>,
	#[serde(rename = "46")]
	pub oneList: Option<IdTupleGenerated>,
	#[serde(rename = "47")]
	pub anyList: Vec<IdTupleGenerated>,
}

impl Entity for At2 {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Aggregatedtype,
			type_id: TypeId::from(35),
		}
	}
}
