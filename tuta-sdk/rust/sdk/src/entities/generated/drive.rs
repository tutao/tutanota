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
	#[serde(rename = "13")]
	pub originalParent: Option<IdTupleGenerated>,
	#[serde(rename = "38")]
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
	#[serde(rename = "16")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "17")]
	pub _permissions: GeneratedId,
	#[serde(rename = "18")]
	pub _format: i64,
	#[serde(rename = "19")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "20")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "21")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "22")]
	pub name: String,
	#[serde(rename = "23")]
	pub size: i64,
	#[serde(rename = "24")]
	pub mimeType: String,
	#[serde(rename = "25")]
	pub createdDate: DateTime,
	#[serde(rename = "26")]
	pub updatedDate: DateTime,
	#[serde(rename = "27")]
	pub folder: IdTupleGenerated,
	#[serde(rename = "28")]
	pub blobs: Vec<super::sys::Blob>,
	#[serde(rename = "29")]
	pub originalParent: Option<IdTupleGenerated>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DriveFile {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(14),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileRef {
	#[serde(rename = "32")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "33")]
	pub _permissions: GeneratedId,
	#[serde(rename = "34")]
	pub _format: i64,
	#[serde(rename = "35")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "36")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "37")]
	pub folder: Option<IdTupleGenerated>,
}

impl Entity for DriveFileRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(30),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileBag {
	#[serde(rename = "40")]
	pub _id: Option<CustomId>,
	#[serde(rename = "41")]
	pub files: GeneratedId,
}

impl Entity for DriveFileBag {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(39),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderBag {
	#[serde(rename = "43")]
	pub _id: Option<CustomId>,
	#[serde(rename = "44")]
	pub folders: GeneratedId,
}

impl Entity for DriveFolderBag {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(42),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveGroupRoot {
	#[serde(rename = "47")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "48")]
	pub _permissions: GeneratedId,
	#[serde(rename = "49")]
	pub _format: i64,
	#[serde(rename = "50")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "51")]
	pub fileBags: Vec<DriveFileBag>,
	#[serde(rename = "52")]
	pub folderBags: Vec<DriveFolderBag>,
	#[serde(rename = "53")]
	pub root: IdTupleGenerated,
	#[serde(rename = "54")]
	pub trash: IdTupleGenerated,
}

impl Entity for DriveGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(45),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveUploadedFile {
	#[serde(rename = "56")]
	pub _id: Option<CustomId>,
	#[serde(rename = "57")]
	pub fileName: String,
	#[serde(rename = "58")]
	pub mimeType: String,
	#[serde(rename = "59")]
	pub createdDate: DateTime,
	#[serde(rename = "60")]
	pub updatedDate: DateTime,
	#[serde(rename = "61")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "62")]
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
			type_id: TypeId::from(55),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveCreateData {
	#[serde(rename = "64")]
	pub _format: i64,
	#[serde(rename = "65")]
	pub parent: IdTupleGenerated,
	#[serde(rename = "66")]
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
			type_id: TypeId::from(63),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveCreateReturn {
	#[serde(rename = "68")]
	pub _format: i64,
	#[serde(rename = "69")]
	pub createdFile: IdTupleGenerated,
}

impl Entity for DriveCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(67),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DrivePutIn {
	#[serde(rename = "71")]
	pub _format: i64,
	#[serde(rename = "72")]
	pub newName: String,
	#[serde(rename = "73")]
	pub updatedDate: DateTime,
	#[serde(rename = "74")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "75")]
	pub folder: Option<IdTupleGenerated>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DrivePutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(70),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveDeleteIn {
	#[serde(rename = "77")]
	pub _format: i64,
	#[serde(rename = "78")]
	pub fileToDelete: IdTupleGenerated,
}

impl Entity for DriveDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(76),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveDeleteOut {
	#[serde(rename = "80")]
	pub _format: i64,
}

impl Entity for DriveDeleteOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(79),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderServicePostIn {
	#[serde(rename = "83")]
	pub _format: i64,
	#[serde(rename = "84")]
	pub folderName: String,
	#[serde(rename = "85")]
	pub createdDate: DateTime,
	#[serde(rename = "86")]
	pub updatedDate: DateTime,
	#[serde(rename = "87")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "88")]
	pub parent: IdTupleGenerated,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DriveFolderServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(82),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderServicePostOut {
	#[serde(rename = "90")]
	pub _format: i64,
	#[serde(rename = "91")]
	pub folder: IdTupleGenerated,
}

impl Entity for DriveFolderServicePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(89),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderServicePutIn {
	#[serde(rename = "93")]
	pub _format: i64,
	#[serde(rename = "94")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "95")]
	pub folder: Option<IdTupleGenerated>,
	#[serde(rename = "96")]
	pub destination: IdTupleGenerated,
}

impl Entity for DriveFolderServicePutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(92),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderServicePutOut {
	#[serde(rename = "98")]
	pub _format: i64,
	#[serde(rename = "99")]
	pub movedFile: IdTupleGenerated,
}

impl Entity for DriveFolderServicePutOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(97),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderServiceDeleteIn {
	#[serde(rename = "101")]
	pub _format: i64,
	#[serde(rename = "104")]
	pub restore: bool,
	#[serde(rename = "102")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "103")]
	pub folder: Option<IdTupleGenerated>,
}

impl Entity for DriveFolderServiceDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(100),
		}
	}
}
