#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UsageTestAssignment {
	pub _id: CustomId,
	pub name: String,
	pub sendPings: bool,
	pub testId: GeneratedId,
	pub variant: Option<i64>,
	pub stages: Vec<UsageTestStage>,
}
impl Entity for UsageTestAssignment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_: "UsageTestAssignment",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UsageTestAssignmentIn {
	pub _format: i64,
	pub testDeviceId: Option<GeneratedId>,
}
impl Entity for UsageTestAssignmentIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_: "UsageTestAssignmentIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UsageTestAssignmentOut {
	pub _format: i64,
	pub testDeviceId: GeneratedId,
	pub assignments: Vec<UsageTestAssignment>,
}
impl Entity for UsageTestAssignmentOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_: "UsageTestAssignmentOut",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UsageTestMetricConfig {
	pub _id: CustomId,
	pub name: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub configValues: Vec<UsageTestMetricConfigValue>,
}
impl Entity for UsageTestMetricConfig {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_: "UsageTestMetricConfig",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UsageTestMetricConfigValue {
	pub _id: CustomId,
	pub key: String,
	pub value: String,
}
impl Entity for UsageTestMetricConfigValue {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_: "UsageTestMetricConfigValue",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UsageTestMetricData {
	pub _id: CustomId,
	pub name: String,
	pub value: String,
}
impl Entity for UsageTestMetricData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_: "UsageTestMetricData",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UsageTestParticipationIn {
	pub _format: i64,
	pub stage: i64,
	pub testDeviceId: GeneratedId,
	pub testId: GeneratedId,
	pub metrics: Vec<UsageTestMetricData>,
}
impl Entity for UsageTestParticipationIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_: "UsageTestParticipationIn",
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(test, derive(PartialEq, Debug))]
pub struct UsageTestStage {
	pub _id: CustomId,
	pub maxPings: i64,
	pub minPings: i64,
	pub name: String,
	pub metrics: Vec<UsageTestMetricConfig>,
}
impl Entity for UsageTestStage {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_: "UsageTestStage",
		}
	}
}
