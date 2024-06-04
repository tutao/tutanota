#![allow(non_snake_case)]
use super::*;
use serde::{Serialize, Deserialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct ApprovalMail {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub date: Option<Date>,
	pub range: Option<String>,
	pub text: String,
	pub customer: Option<Id>,
}

impl Entity for ApprovalMail {
	fn type_ref() -> TypeRef {
		TypeRef { app: "monitor".to_owned(), type_: "ApprovalMail".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct CounterValue {
	pub _id: Id,
	pub counterId: Id,
	pub value: i64,
}

impl Entity for CounterValue {
	fn type_ref() -> TypeRef {
		TypeRef { app: "monitor".to_owned(), type_: "CounterValue".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct ErrorReportData {
	pub _id: Id,
	pub additionalInfo: String,
	pub appVersion: String,
	pub clientType: i64,
	pub errorClass: String,
	pub errorMessage: Option<String>,
	pub stackTrace: String,
	pub time: Date,
	pub userId: Option<String>,
	pub userMessage: Option<String>,
}

impl Entity for ErrorReportData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "monitor".to_owned(), type_: "ErrorReportData".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct ErrorReportFile {
	pub _id: Id,
	pub content: String,
	pub name: String,
}

impl Entity for ErrorReportFile {
	fn type_ref() -> TypeRef {
		TypeRef { app: "monitor".to_owned(), type_: "ErrorReportFile".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct ReadCounterData {
	pub _format: i64,
	pub columnName: Option<Id>,
	pub counterType: i64,
	pub rowName: String,
}

impl Entity for ReadCounterData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "monitor".to_owned(), type_: "ReadCounterData".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct ReadCounterReturn {
	pub _format: i64,
	pub value: Option<i64>,
	pub counterValues: Vec<CounterValue>,
}

impl Entity for ReadCounterReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "monitor".to_owned(), type_: "ReadCounterReturn".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct ReportErrorIn {
	pub _format: i64,
	pub data: ErrorReportData,
	pub files: Vec<ErrorReportFile>,
}

impl Entity for ReportErrorIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "monitor".to_owned(), type_: "ReportErrorIn".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct WriteCounterData {
	pub _format: i64,
	pub column: Id,
	pub counterType: Option<i64>,
	pub row: String,
	pub value: i64,
}

impl Entity for WriteCounterData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "monitor".to_owned(), type_: "WriteCounterData".to_owned() }
	}
}
