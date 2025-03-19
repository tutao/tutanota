// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobGetIn {
	#[serde(rename = "51")]
	pub _format: i64,
	#[serde(rename = "52")]
	pub archiveId: GeneratedId,
	#[serde(rename = "110")]
	pub blobId: Option<GeneratedId>,
	#[serde(rename = "193")]
	pub blobIds: Vec<BlobId>,
}

impl Entity for BlobGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 50,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobWriteData {
	#[serde(rename = "74")]
	pub _id: Option<CustomId>,
	#[serde(rename = "75")]
	pub archiveOwnerGroup: GeneratedId,
}

impl Entity for BlobWriteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 73,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobAccessTokenPostIn {
	#[serde(rename = "78")]
	pub _format: i64,
	#[serde(rename = "180")]
	pub archiveDataType: Option<i64>,
	#[serde(rename = "80")]
	pub write: Option<BlobWriteData>,
	#[serde(rename = "181")]
	pub read: Option<BlobReadData>,
}

impl Entity for BlobAccessTokenPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 77,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobAccessTokenPostOut {
	#[serde(rename = "82")]
	pub _format: i64,
	#[serde(rename = "161")]
	pub blobAccessInfo: BlobServerAccessInfo,
}

impl Entity for BlobAccessTokenPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 81,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobReferencePutIn {
	#[serde(rename = "95")]
	pub _format: i64,
	#[serde(rename = "97")]
	pub instanceListId: Option<GeneratedId>,
	#[serde(rename = "107")]
	pub instanceId: GeneratedId,
	#[serde(rename = "123")]
	pub archiveDataType: i64,
	#[serde(rename = "122")]
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,
}

impl Entity for BlobReferencePutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 94,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobReferenceDeleteIn {
	#[serde(rename = "101")]
	pub _format: i64,
	#[serde(rename = "102")]
	pub instanceListId: Option<GeneratedId>,
	#[serde(rename = "103")]
	pub instanceId: GeneratedId,
	#[serde(rename = "124")]
	pub archiveDataType: i64,
	#[serde(rename = "105")]
	pub blobs: Vec<super::sys::Blob>,
}

impl Entity for BlobReferenceDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 100,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobPostOut {
	#[serde(rename = "126")]
	pub _format: i64,
	#[serde(rename = "127")]
	pub blobReferenceToken: Option<String>,
	#[serde(rename = "208")]
	pub blobReferenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,
}

impl Entity for BlobPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 125,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobArchiveRef {
	#[serde(rename = "131")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "132")]
	pub _permissions: GeneratedId,
	#[serde(rename = "133")]
	pub _format: i64,
	#[serde(rename = "134")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "135")]
	pub archive: GeneratedId,
}

impl Entity for BlobArchiveRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 129,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobId {
	#[serde(rename = "145")]
	pub _id: Option<CustomId>,
	#[serde(rename = "146")]
	pub blobId: GeneratedId,
}

impl Entity for BlobId {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 144,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobServerUrl {
	#[serde(rename = "155")]
	pub _id: Option<CustomId>,
	#[serde(rename = "156")]
	pub url: String,
}

impl Entity for BlobServerUrl {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 154,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobServerAccessInfo {
	#[serde(rename = "158")]
	pub _id: Option<CustomId>,
	#[serde(rename = "159")]
	pub blobAccessToken: String,
	#[serde(rename = "192")]
	pub expires: DateTime,
	#[serde(rename = "209")]
	pub tokenKind: i64,
	#[serde(rename = "160")]
	pub servers: Vec<BlobServerUrl>,
}

impl Entity for BlobServerAccessInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 157,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InstanceId {
	#[serde(rename = "173")]
	pub _id: Option<CustomId>,
	#[serde(rename = "174")]
	pub instanceId: Option<GeneratedId>,
}

impl Entity for InstanceId {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 172,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobReadData {
	#[serde(rename = "176")]
	pub _id: Option<CustomId>,
	#[serde(rename = "177")]
	pub archiveId: GeneratedId,
	#[serde(rename = "178")]
	pub instanceListId: Option<GeneratedId>,
	#[serde(rename = "179")]
	pub instanceIds: Vec<InstanceId>,
}

impl Entity for BlobReadData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "storage",
			type_id: 175,
		}
	}
}
