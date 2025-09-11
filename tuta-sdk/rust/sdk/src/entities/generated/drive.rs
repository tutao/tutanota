// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolder {
	#[serde(rename = "2")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "3")]
	pub _permissions: GeneratedId,
	#[serde(rename = "4")]
	pub _format: i64,
	#[serde(rename = "5")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "6")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "7")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "8")]
	pub name: String,
	#[serde(rename = "9")]
	pub createdDate: DateTime,
	#[serde(rename = "10")]
	pub updatedDate: DateTime,
	#[serde(rename = "34")]
	pub files: GeneratedId,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DriveFolder {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(0),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFile {
	#[serde(rename = "13")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "14")]
	pub _permissions: GeneratedId,
	#[serde(rename = "15")]
	pub _format: i64,
	#[serde(rename = "16")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "17")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "18")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "19")]
	pub name: String,
	#[serde(rename = "20")]
	pub size: i64,
	#[serde(rename = "21")]
	pub mimeType: String,
	#[serde(rename = "22")]
	pub createdDate: DateTime,
	#[serde(rename = "23")]
	pub updatedDate: DateTime,
	#[serde(rename = "24")]
	pub folder: IdTupleGenerated,
	#[serde(rename = "25")]
	pub blobs: Vec<super::sys::Blob>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DriveFile {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(11),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileRef {
	#[serde(rename = "28")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "29")]
	pub _permissions: GeneratedId,
	#[serde(rename = "30")]
	pub _format: i64,
	#[serde(rename = "31")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "32")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "33")]
	pub folder: Option<IdTupleGenerated>,
}

impl Entity for DriveFileRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(26),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveGroupRoot {
	#[serde(rename = "37")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "38")]
	pub _permissions: GeneratedId,
	#[serde(rename = "39")]
	pub _format: i64,
	#[serde(rename = "40")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "41")]
	pub root: IdTupleGenerated,
	#[serde(rename = "42")]
	pub trash: IdTupleGenerated,
}

impl Entity for DriveGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(35),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveUploadedFile {
	#[serde(rename = "44")]
	pub _id: Option<CustomId>,
	#[serde(rename = "45")]
	#[serde(with = "serde_bytes")]
	pub encFileName: Vec<u8>,
	#[serde(rename = "46")]
	#[serde(with = "serde_bytes")]
	pub encMimeType: Vec<u8>,
	#[serde(rename = "47")]
	#[serde(with = "serde_bytes")]
	pub encCid: Option<Vec<u8>>,
	#[serde(rename = "48")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "49")]
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,
}

impl Entity for DriveUploadedFile {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(43),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveCreateData {
	#[serde(rename = "51")]
	pub _format: i64,
	#[serde(rename = "52")]
	pub parent: Option<IdTupleGenerated>,
	#[serde(rename = "53")]
	pub uploadedFile: DriveUploadedFile,
}

impl Entity for DriveCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(50),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveCreateReturn {
	#[serde(rename = "55")]
	pub _format: i64,
	#[serde(rename = "56")]
	pub createdFile: IdTupleGenerated,
}

impl Entity for DriveCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(54),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveDeleteIn {
	#[serde(rename = "58")]
	pub _format: i64,
	#[serde(rename = "59")]
	pub fileToDelete: IdTupleGenerated,
}

impl Entity for DriveDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(57),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveDeleteOut {
	#[serde(rename = "61")]
	pub _format: i64,
}

impl Entity for DriveDeleteOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(60),
		}
	}
}
