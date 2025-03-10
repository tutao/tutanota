// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReadCounterData {
	pub _format: i64,
	pub rowName: String,
	pub columnName: Option<GeneratedId>,
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
	pub _format: i64,
	pub value: Option<i64>,
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
	pub _format: i64,
	pub row: String,
	pub column: GeneratedId,
	pub value: i64,
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
	pub _id: Option<IdTupleCustom>,
	pub _permissions: GeneratedId,
	pub _format: i64,
	pub _ownerGroup: Option<GeneratedId>,
	pub range: Option<String>,
	pub date: Option<DateTime>,
	pub text: String,
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
	pub _id: Option<CustomId>,
	pub counterId: GeneratedId,
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
	pub _id: Option<CustomId>,
	pub name: String,
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
	pub _id: Option<CustomId>,
	pub time: DateTime,
	pub appVersion: String,
	pub clientType: i64,
	pub userId: Option<String>,
	pub errorClass: String,
	pub errorMessage: Option<String>,
	pub stackTrace: String,
	pub userMessage: Option<String>,
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
	pub _format: i64,
	pub data: ErrorReportData,
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
