// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReadCounterData {
	#[serde(rename = "13")]
	pub _format: i64,
	#[serde(rename = "14")]
	pub rowName: String,
	#[serde(rename = "15")]
	pub columnName: Option<GeneratedId>,
	#[serde(rename = "299")]
	pub counterType: i64,
}

impl Entity for ReadCounterData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "monitor",
			type_id: 12,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReadCounterReturn {
	#[serde(rename = "17")]
	pub _format: i64,
	#[serde(rename = "18")]
	pub value: Option<i64>,
	#[serde(rename = "304")]
	pub counterValues: Vec<CounterValue>,
}

impl Entity for ReadCounterReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "monitor",
			type_id: 16,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct WriteCounterData {
	#[serde(rename = "50")]
	pub _format: i64,
	#[serde(rename = "51")]
	pub row: String,
	#[serde(rename = "52")]
	pub column: GeneratedId,
	#[serde(rename = "53")]
	pub value: i64,
	#[serde(rename = "215")]
	pub counterType: Option<i64>,
}

impl Entity for WriteCounterData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "monitor",
			type_id: 49,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ApprovalMail {
	#[serde(rename = "223")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "224")]
	pub _permissions: GeneratedId,
	#[serde(rename = "225")]
	pub _format: i64,
	#[serde(rename = "226")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "227")]
	pub range: Option<String>,
	#[serde(rename = "228")]
	pub date: Option<DateTime>,
	#[serde(rename = "229")]
	pub text: String,
	#[serde(rename = "230")]
	pub customer: Option<GeneratedId>,
}

impl Entity for ApprovalMail {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "monitor",
			type_id: 221,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CounterValue {
	#[serde(rename = "301")]
	pub _id: Option<CustomId>,
	#[serde(rename = "302")]
	pub counterId: GeneratedId,
	#[serde(rename = "303")]
	pub value: i64,
}

impl Entity for CounterValue {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "monitor",
			type_id: 300,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ErrorReportFile {
	#[serde(rename = "306")]
	pub _id: Option<CustomId>,
	#[serde(rename = "307")]
	pub name: String,
	#[serde(rename = "308")]
	pub content: String,
}

impl Entity for ErrorReportFile {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "monitor",
			type_id: 305,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ErrorReportData {
	#[serde(rename = "317")]
	pub _id: Option<CustomId>,
	#[serde(rename = "318")]
	pub time: DateTime,
	#[serde(rename = "319")]
	pub appVersion: String,
	#[serde(rename = "320")]
	pub clientType: i64,
	#[serde(rename = "321")]
	pub userId: Option<String>,
	#[serde(rename = "322")]
	pub errorClass: String,
	#[serde(rename = "323")]
	pub errorMessage: Option<String>,
	#[serde(rename = "324")]
	pub stackTrace: String,
	#[serde(rename = "325")]
	pub userMessage: Option<String>,
	#[serde(rename = "326")]
	pub additionalInfo: String,
}

impl Entity for ErrorReportData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "monitor",
			type_id: 316,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReportErrorIn {
	#[serde(rename = "336")]
	pub _format: i64,
	#[serde(rename = "337")]
	pub data: ErrorReportData,
	#[serde(rename = "338")]
	pub files: Vec<ErrorReportFile>,
}

impl Entity for ReportErrorIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "monitor",
			type_id: 335,
		}
	}
}
