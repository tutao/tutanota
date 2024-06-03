#![allow(non_snake_case)]
use super::*;

pub struct ApprovalMail {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub date: Date,
	pub range: String,
	pub text: String,
	pub customer: Option<Id>,
}

pub struct CounterValue {
	pub _id: Id,
	pub counterId: Id,
	pub value: String,
}

pub struct ErrorReportData {
	pub _id: Id,
	pub additionalInfo: String,
	pub appVersion: String,
	pub clientType: String,
	pub errorClass: String,
	pub errorMessage: String,
	pub stackTrace: String,
	pub time: Date,
	pub userId: String,
	pub userMessage: String,
}

pub struct ErrorReportFile {
	pub _id: Id,
	pub content: String,
	pub name: String,
}

pub struct ReadCounterData {
	pub _format: String,
	pub columnName: Id,
	pub counterType: String,
	pub rowName: String,
}

pub struct ReadCounterReturn {
	pub _format: String,
	pub value: String,
	pub counterValues: Vec<CounterValue>,
}

pub struct ReportErrorIn {
	pub _format: String,
	pub data: ErrorReportData,
	pub files: Vec<ErrorReportFile>,
}

pub struct WriteCounterData {
	pub _format: String,
	pub column: Id,
	pub counterType: String,
	pub row: String,
	pub value: String,
}