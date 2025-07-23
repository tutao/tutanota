// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestMetricConfigValue {
	#[serde(rename = "9")]
	pub _id: Option<CustomId>,
	#[serde(rename = "10")]
	pub key: String,
	#[serde(rename = "11")]
	pub value: String,
}

impl Entity for UsageTestMetricConfigValue {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(8),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestMetricConfig {
	#[serde(rename = "13")]
	pub _id: Option<CustomId>,
	#[serde(rename = "14")]
	pub name: String,
	#[serde(rename = "15")]
	pub r#type: i64,
	#[serde(rename = "16")]
	pub configValues: Vec<UsageTestMetricConfigValue>,
}

impl Entity for UsageTestMetricConfig {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(12),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestMetricData {
	#[serde(rename = "18")]
	pub _id: Option<CustomId>,
	#[serde(rename = "19")]
	pub name: String,
	#[serde(rename = "20")]
	pub value: String,
}

impl Entity for UsageTestMetricData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(17),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestStage {
	#[serde(rename = "36")]
	pub _id: Option<CustomId>,
	#[serde(rename = "37")]
	pub name: String,
	#[serde(rename = "87")]
	pub minPings: i64,
	#[serde(rename = "88")]
	pub maxPings: i64,
	#[serde(rename = "102")]
	pub isFinalStage: bool,
	#[serde(rename = "38")]
	pub metrics: Vec<UsageTestMetricConfig>,
}

impl Entity for UsageTestStage {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(35),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestAssignmentIn {
	#[serde(rename = "54")]
	pub _format: i64,
	#[serde(rename = "55")]
	pub testDeviceId: Option<GeneratedId>,
}

impl Entity for UsageTestAssignmentIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(53),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestAssignment {
	#[serde(rename = "57")]
	pub _id: Option<CustomId>,
	#[serde(rename = "58")]
	pub testId: GeneratedId,
	#[serde(rename = "59")]
	pub name: String,
	#[serde(rename = "60")]
	pub variant: Option<i64>,
	#[serde(rename = "61")]
	pub sendPings: bool,
	#[serde(rename = "62")]
	pub stages: Vec<UsageTestStage>,
}

impl Entity for UsageTestAssignment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(56),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestAssignmentOut {
	#[serde(rename = "64")]
	pub _format: i64,
	#[serde(rename = "65")]
	pub testDeviceId: GeneratedId,
	#[serde(rename = "66")]
	pub assignments: Vec<UsageTestAssignment>,
}

impl Entity for UsageTestAssignmentOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(63),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestParticipationIn {
	#[serde(rename = "81")]
	pub _format: i64,
	#[serde(rename = "82")]
	pub testId: GeneratedId,
	#[serde(rename = "83")]
	pub stage: i64,
	#[serde(rename = "84")]
	pub testDeviceId: GeneratedId,
	#[serde(rename = "100")]
	pub isFinalPingForStage: bool,
	#[serde(rename = "85")]
	pub metrics: Vec<UsageTestMetricData>,
}

impl Entity for UsageTestParticipationIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(80),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestParticipationOut {
	#[serde(rename = "91")]
	pub _format: i64,
	#[serde(rename = "92")]
	pub pingListId: GeneratedId,
	#[serde(rename = "93")]
	pub pingId: GeneratedId,
}

impl Entity for UsageTestParticipationOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(90),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UsageTestParticipationDeleteIn {
	#[serde(rename = "95")]
	pub _format: i64,
	#[serde(rename = "96")]
	pub testId: GeneratedId,
	#[serde(rename = "97")]
	pub testDeviceId: GeneratedId,
	#[serde(rename = "98")]
	pub pingListId: GeneratedId,
	#[serde(rename = "99")]
	pub pingId: GeneratedId,
}

impl Entity for UsageTestParticipationDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Usage,
			type_id: TypeId::from(94),
		}
	}
}
