#![allow(non_snake_case)]
use super::*;

pub struct BlobAccessTokenPostIn {
	pub _format: String,
	pub archiveDataType: String,
	pub read: Option<BlobReadData>,
	pub write: Option<BlobWriteData>,
}

pub struct BlobAccessTokenPostOut {
	pub _format: String,
	pub blobAccessInfo: BlobServerAccessInfo,
}

pub struct BlobArchiveRef {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub archive: Id,
}

pub struct BlobGetIn {
	pub _format: String,
	pub archiveId: Id,
	pub blobId: Id,
	pub blobIds: Vec<BlobId>,
}

pub struct BlobId {
	pub _id: Id,
	pub blobId: Id,
}

pub struct BlobPostOut {
	pub _format: String,
	pub blobReferenceToken: String,
}

pub struct BlobReadData {
	pub _id: Id,
	pub archiveId: Id,
	pub instanceListId: Id,
	pub instanceIds: Vec<InstanceId>,
}

pub struct BlobReferenceDeleteIn {
	pub _format: String,
	pub archiveDataType: String,
	pub instanceId: Id,
	pub instanceListId: Id,
	pub blobs: Vec<sys::Blob>,
}

pub struct BlobReferencePutIn {
	pub _format: String,
	pub archiveDataType: String,
	pub instanceId: Id,
	pub instanceListId: Id,
	pub referenceTokens: Vec<sys::BlobReferenceTokenWrapper>,
}

pub struct BlobServerAccessInfo {
	pub _id: Id,
	pub blobAccessToken: String,
	pub expires: Date,
	pub servers: Vec<BlobServerUrl>,
}

pub struct BlobServerUrl {
	pub _id: Id,
	pub url: String,
}

pub struct BlobWriteData {
	pub _id: Id,
	pub archiveOwnerGroup: Id,
}

pub struct InstanceId {
	pub _id: Id,
	pub instanceId: Id,
}