// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestMetricConfigValue {
	pub _id: Option<CustomId>,
	pub key: String,
	pub value: String,
}

impl Entity for UsageTestMetricConfigValue {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_id: 8,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestMetricConfig {
	pub _id: Option<CustomId>,
	pub name: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub configValues: Vec<UsageTestMetricConfigValue>,
}

impl Entity for UsageTestMetricConfig {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_id: 12,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestMetricData {
	pub _id: Option<CustomId>,
	pub name: String,
	pub value: String,
}

impl Entity for UsageTestMetricData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_id: 17,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestStage {
	pub _id: Option<CustomId>,
	pub maxPings: i64,
	pub minPings: i64,
	pub name: String,
	pub metrics: Vec<UsageTestMetricConfig>,
}

impl Entity for UsageTestStage {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_id: 35,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestAssignmentIn {
	pub _format: i64,
	pub testDeviceId: Option<GeneratedId>,
}

impl Entity for UsageTestAssignmentIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_id: 53,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestAssignment {
	pub _id: Option<CustomId>,
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
			type_id: 56,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestAssignmentOut {
	pub _format: i64,
	pub testDeviceId: GeneratedId,
	pub assignments: Vec<UsageTestAssignment>,
}

impl Entity for UsageTestAssignmentOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "usage",
			type_id: 63,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
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
			type_id: 80,
		}
	}
}
