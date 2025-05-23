// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerAccountPosting {
	#[serde(rename = "80")]
	pub _id: Option<CustomId>,
	#[serde(rename = "81")]
	pub r#type: i64,
	#[serde(rename = "82")]
	pub valueDate: DateTime,
	#[serde(rename = "83")]
	pub invoiceNumber: Option<String>,
	#[serde(rename = "84")]
	pub amount: i64,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CustomerAccountPosting {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Accounting,
			type_id: TypeId::from(79),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerAccountReturn {
	#[serde(rename = "87")]
	pub _format: i64,
	#[serde(rename = "88")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "89")]
	#[serde(with = "serde_bytes")]
	pub _ownerPublicEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "92")]
	pub outstandingBookingsPrice: i64,
	#[serde(rename = "94")]
	pub balance: i64,
	#[serde(rename = "96")]
	pub _publicCryptoProtocolVersion: Option<i64>,
	#[serde(rename = "90")]
	pub postings: Vec<CustomerAccountPosting>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CustomerAccountReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Accounting,
			type_id: TypeId::from(86),
		}
	}
}
