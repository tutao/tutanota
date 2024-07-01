#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Serialize, Deserialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobAccessTokenPostIn {
	pub _format: i64,
	pub archiveDataType: Option<i64>,
	pub read: Option<BlobReadData>,
	pub write: Option<BlobWriteData>,
}

impl Entity for BlobAccessTokenPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobAccessTokenPostIn" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobAccessTokenPostOut {
	pub _format: i64,
	pub blobAccessInfo: BlobServerAccessInfo,
}

impl Entity for BlobAccessTokenPostOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobAccessTokenPostOut" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobArchiveRef {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub archive: GeneratedId,
}

impl Entity for BlobArchiveRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobArchiveRef" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobGetIn {
	pub _format: i64,
	pub archiveId: GeneratedId,
	pub blobId: Option<GeneratedId>,
	pub blobIds: Vec<BlobId>,
}

impl Entity for BlobGetIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobGetIn" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobId {
	pub _id: String,
	pub blobId: GeneratedId,
}

impl Entity for BlobId {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobId" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobPostOut {
	pub _format: i64,
	pub blobReferenceToken: String,
}

impl Entity for BlobPostOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobPostOut" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobReadData {
	pub _id: String,
	pub archiveId: GeneratedId,
	pub instanceListId: Option<GeneratedId>,
	pub instanceIds: Vec<InstanceId>,
}

impl Entity for BlobReadData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobReadData" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobReferenceDeleteIn {
	pub _format: i64,
	pub archiveDataType: i64,
	pub instanceId: GeneratedId,
	pub instanceListId: Option<GeneratedId>,
	pub blobs: Vec<sys::Blob>,
}

impl Entity for BlobReferenceDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobReferenceDeleteIn" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobReferencePutIn {
	pub _format: i64,
	pub archiveDataType: i64,
	pub instanceId: GeneratedId,
	pub instanceListId: Option<GeneratedId>,
	pub referenceTokens: Vec<sys::BlobReferenceTokenWrapper>,
}

impl Entity for BlobReferencePutIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobReferencePutIn" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobServerAccessInfo {
	pub _id: String,
	pub blobAccessToken: String,
	pub expires: DateTime,
	pub servers: Vec<BlobServerUrl>,
}

impl Entity for BlobServerAccessInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobServerAccessInfo" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobServerUrl {
	pub _id: String,
	pub url: String,
}

impl Entity for BlobServerUrl {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobServerUrl" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct BlobWriteData {
	pub _id: String,
	pub archiveOwnerGroup: GeneratedId,
}

impl Entity for BlobWriteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "BlobWriteData" }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InstanceId {
	pub _id: String,
	pub instanceId: Option<GeneratedId>,
}

impl Entity for InstanceId {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage", type_: "InstanceId" }
	}
}
