#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Serialize, Deserialize};

#[derive(Clone, Serialize, Deserialize)]
pub struct BlobAccessTokenPostIn {
	pub _format: i64,
	pub archiveDataType: Option<i64>,
	pub read: Option<BlobReadData>,
	pub write: Option<BlobWriteData>,
}

impl Entity for BlobAccessTokenPostIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobAccessTokenPostIn".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobAccessTokenPostOut {
	pub _format: i64,
	pub blobAccessInfo: BlobServerAccessInfo,
}

impl Entity for BlobAccessTokenPostOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobAccessTokenPostOut".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobArchiveRef {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub archive: Id,
}

impl Entity for BlobArchiveRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobArchiveRef".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobGetIn {
	pub _format: i64,
	pub archiveId: Id,
	pub blobId: Option<Id>,
	pub blobIds: Vec<BlobId>,
}

impl Entity for BlobGetIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobGetIn".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobId {
	pub _id: Id,
	pub blobId: Id,
}

impl Entity for BlobId {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobId".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobPostOut {
	pub _format: i64,
	pub blobReferenceToken: String,
}

impl Entity for BlobPostOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobPostOut".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobReadData {
	pub _id: Id,
	pub archiveId: Id,
	pub instanceListId: Option<Id>,
	pub instanceIds: Vec<InstanceId>,
}

impl Entity for BlobReadData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobReadData".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobReferenceDeleteIn {
	pub _format: i64,
	pub archiveDataType: i64,
	pub instanceId: Id,
	pub instanceListId: Option<Id>,
	pub blobs: Vec<sys::Blob>,
}

impl Entity for BlobReferenceDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobReferenceDeleteIn".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobReferencePutIn {
	pub _format: i64,
	pub archiveDataType: i64,
	pub instanceId: Id,
	pub instanceListId: Option<Id>,
	pub referenceTokens: Vec<sys::BlobReferenceTokenWrapper>,
}

impl Entity for BlobReferencePutIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobReferencePutIn".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobServerAccessInfo {
	pub _id: Id,
	pub blobAccessToken: String,
	pub expires: Date,
	pub servers: Vec<BlobServerUrl>,
}

impl Entity for BlobServerAccessInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobServerAccessInfo".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobServerUrl {
	pub _id: Id,
	pub url: String,
}

impl Entity for BlobServerUrl {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobServerUrl".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct BlobWriteData {
	pub _id: Id,
	pub archiveOwnerGroup: Id,
}

impl Entity for BlobWriteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "BlobWriteData".to_owned() }
	}
}


#[derive(Clone, Serialize, Deserialize)]
pub struct InstanceId {
	pub _id: Id,
	pub instanceId: Option<Id>,
}

impl Entity for InstanceId {
	fn type_ref() -> TypeRef {
		TypeRef { app: "storage".to_owned(), type_: "InstanceId".to_owned() }
	}
}
