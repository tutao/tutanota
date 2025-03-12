// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobGetIn {
	pub _format: i64,
	pub archiveId: GeneratedId,
	pub blobId: Option<GeneratedId>,
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
	pub _id: Option<CustomId>,
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
	pub _format: i64,
	pub archiveDataType: Option<i64>,
	pub write: Option<BlobWriteData>,
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
	pub _format: i64,
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
	pub _format: i64,
	pub instanceListId: Option<GeneratedId>,
	pub instanceId: GeneratedId,
	pub archiveDataType: i64,
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
	pub _format: i64,
	pub instanceListId: Option<GeneratedId>,
	pub instanceId: GeneratedId,
	pub archiveDataType: i64,
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
	pub _format: i64,
	pub blobReferenceToken: Option<String>,
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
	pub _id: Option<IdTupleGenerated>,
	pub _permissions: GeneratedId,
	pub _format: i64,
	pub _ownerGroup: Option<GeneratedId>,
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
	pub _id: Option<CustomId>,
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
	pub _id: Option<CustomId>,
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
	pub _id: Option<CustomId>,
	pub blobAccessToken: String,
	pub expires: DateTime,
	pub tokenKind: i64,
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
	pub _id: Option<CustomId>,
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
	pub _id: Option<CustomId>,
	pub archiveId: GeneratedId,
	pub instanceListId: Option<GeneratedId>,
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
