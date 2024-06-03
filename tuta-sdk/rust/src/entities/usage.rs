#![allow(non_snake_case)]
use super::*;

pub struct UsageTestAssignment {
	pub _id: Id,
	pub name: String,
	pub sendPings: bool,
	pub testId: Id,
	pub variant: String,
	pub stages: Vec<UsageTestStage>,
}

pub struct UsageTestAssignmentIn {
	pub _format: String,
	pub testDeviceId: Id,
}

pub struct UsageTestAssignmentOut {
	pub _format: String,
	pub testDeviceId: Id,
	pub assignments: Vec<UsageTestAssignment>,
}

pub struct UsageTestMetricConfig {
	pub _id: Id,
	pub name: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub configValues: Vec<UsageTestMetricConfigValue>,
}

pub struct UsageTestMetricConfigValue {
	pub _id: Id,
	pub key: String,
	pub value: String,
}

pub struct UsageTestMetricData {
	pub _id: Id,
	pub name: String,
	pub value: String,
}

pub struct UsageTestParticipationIn {
	pub _format: String,
	pub stage: String,
	pub testDeviceId: Id,
	pub testId: Id,
	pub metrics: Vec<UsageTestMetricData>,
}

pub struct UsageTestStage {
	pub _id: Id,
	pub maxPings: String,
	pub minPings: String,
	pub name: String,
	pub metrics: Vec<UsageTestMetricConfig>,
}