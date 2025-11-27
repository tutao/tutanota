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
	pub r#type: i64,
	#[serde(rename = "9")]
	pub name: String,
	#[serde(rename = "10")]
	pub createdDate: DateTime,
	#[serde(rename = "11")]
	pub updatedDate: DateTime,
	#[serde(rename = "12")]
	pub parent: Option<IdTupleGenerated>,
	#[serde(rename = "36")]
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
	#[serde(rename = "15")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "16")]
	pub _permissions: GeneratedId,
	#[serde(rename = "17")]
	pub _format: i64,
	#[serde(rename = "18")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "19")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "20")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "21")]
	pub name: String,
	#[serde(rename = "22")]
	pub size: i64,
	#[serde(rename = "23")]
	pub mimeType: String,
	#[serde(rename = "24")]
	pub createdDate: DateTime,
	#[serde(rename = "25")]
	pub updatedDate: DateTime,
	#[serde(rename = "26")]
	pub folder: IdTupleGenerated,
	#[serde(rename = "27")]
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
			type_id: TypeId::from(13),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileRef {
	#[serde(rename = "30")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "31")]
	pub _permissions: GeneratedId,
	#[serde(rename = "32")]
	pub _format: i64,
	#[serde(rename = "33")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "34")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "35")]
	pub folder: Option<IdTupleGenerated>,
}

impl Entity for DriveFileRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(28),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileBag {
	#[serde(rename = "38")]
	pub _id: Option<CustomId>,
	#[serde(rename = "39")]
	pub files: GeneratedId,
}

impl Entity for DriveFileBag {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(37),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderBag {
	#[serde(rename = "41")]
	pub _id: Option<CustomId>,
	#[serde(rename = "42")]
	pub folders: GeneratedId,
}

impl Entity for DriveFolderBag {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(40),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveGroupRoot {
	#[serde(rename = "45")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "46")]
	pub _permissions: GeneratedId,
	#[serde(rename = "47")]
	pub _format: i64,
	#[serde(rename = "48")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "49")]
	pub fileBags: Vec<DriveFileBag>,
	#[serde(rename = "50")]
	pub folderBags: Vec<DriveFolderBag>,
	#[serde(rename = "51")]
	pub root: IdTupleGenerated,
	#[serde(rename = "52")]
	pub trash: IdTupleGenerated,
}

impl Entity for DriveGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(43),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveUploadedFile {
	#[serde(rename = "54")]
	pub _id: Option<CustomId>,
	#[serde(rename = "55")]
	pub fileName: String,
	#[serde(rename = "56")]
	pub mimeType: String,
	#[serde(rename = "57")]
	pub createdDate: DateTime,
	#[serde(rename = "58")]
	pub updatedDate: DateTime,
	#[serde(rename = "59")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "60")]
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DriveUploadedFile {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(53),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveCreateData {
	#[serde(rename = "62")]
	pub _format: i64,
	#[serde(rename = "63")]
	pub parent: IdTupleGenerated,
	#[serde(rename = "64")]
	pub uploadedFile: DriveUploadedFile,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DriveCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(61),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveCreateReturn {
	#[serde(rename = "66")]
	pub _format: i64,
	#[serde(rename = "67")]
	pub createdFile: IdTupleGenerated,
}

impl Entity for DriveCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(65),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveDeleteIn {
	#[serde(rename = "69")]
	pub _format: i64,
	#[serde(rename = "70")]
	pub fileToDelete: IdTupleGenerated,
}

impl Entity for DriveDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(68),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveDeleteOut {
	#[serde(rename = "72")]
	pub _format: i64,
}

impl Entity for DriveDeleteOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(71),
		}
	}
}
