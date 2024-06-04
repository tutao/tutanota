#![allow(non_snake_case)]
use super::*;
use serde::{Serialize, Deserialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct UsageTestAssignment {
	pub _id: Id,
	pub name: String,
	pub sendPings: bool,
	pub testId: Id,
	pub variant: Option<i64>,
	pub stages: Vec<UsageTestStage>,
}

impl Entity for UsageTestAssignment {
	fn type_ref() -> TypeRef {
		TypeRef { app: "usage".to_owned(), type_: "UsageTestAssignment".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct UsageTestAssignmentIn {
	pub _format: i64,
	pub testDeviceId: Option<Id>,
}

impl Entity for UsageTestAssignmentIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "usage".to_owned(), type_: "UsageTestAssignmentIn".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct UsageTestAssignmentOut {
	pub _format: i64,
	pub testDeviceId: Id,
	pub assignments: Vec<UsageTestAssignment>,
}

impl Entity for UsageTestAssignmentOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "usage".to_owned(), type_: "UsageTestAssignmentOut".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct UsageTestMetricConfig {
	pub _id: Id,
	pub name: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub configValues: Vec<UsageTestMetricConfigValue>,
}

impl Entity for UsageTestMetricConfig {
	fn type_ref() -> TypeRef {
		TypeRef { app: "usage".to_owned(), type_: "UsageTestMetricConfig".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct UsageTestMetricConfigValue {
	pub _id: Id,
	pub key: String,
	pub value: String,
}

impl Entity for UsageTestMetricConfigValue {
	fn type_ref() -> TypeRef {
		TypeRef { app: "usage".to_owned(), type_: "UsageTestMetricConfigValue".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct UsageTestMetricData {
	pub _id: Id,
	pub name: String,
	pub value: String,
}

impl Entity for UsageTestMetricData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "usage".to_owned(), type_: "UsageTestMetricData".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct UsageTestParticipationIn {
	pub _format: i64,
	pub stage: i64,
	pub testDeviceId: Id,
	pub testId: Id,
	pub metrics: Vec<UsageTestMetricData>,
}

impl Entity for UsageTestParticipationIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "usage".to_owned(), type_: "UsageTestParticipationIn".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct UsageTestStage {
	pub _id: Id,
	pub maxPings: i64,
	pub minPings: i64,
	pub name: String,
	pub metrics: Vec<UsageTestMetricConfig>,
}

impl Entity for UsageTestStage {
	fn type_ref() -> TypeRef {
		TypeRef { app: "usage".to_owned(), type_: "UsageTestStage".to_owned() }
	}
}
