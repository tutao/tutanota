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
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "112")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "60")]
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,

	#[serde(default)]
	pub _errors: Errors,
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
pub struct DrivePostIn {
	#[serde(rename = "62")]
	pub _format: i64,
	#[serde(rename = "64")]
	#[serde(with = "serde_bytes")]
	pub ownerEncRootFolderSessionKey: Vec<u8>,
	#[serde(rename = "65")]
	#[serde(with = "serde_bytes")]
	pub ownerEncTrashFolderSessionKey: Vec<u8>,
	#[serde(rename = "113")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "63")]
	pub fileGroupId: GeneratedId,
}

impl Entity for DrivePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(61),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveItemPostIn {
	#[serde(rename = "68")]
	pub _format: i64,
	#[serde(rename = "69")]
	pub parent: IdTupleGenerated,
	#[serde(rename = "70")]
	pub uploadedFile: DriveUploadedFile,

	#[serde(default)]
	pub _errors: Errors,
}

impl Entity for DriveItemPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(67),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveItemPostOut {
	#[serde(rename = "72")]
	pub _format: i64,
	#[serde(rename = "73")]
	pub createdFile: IdTupleGenerated,
}

impl Entity for DriveItemPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(71),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveItemPutIn {
	#[serde(rename = "75")]
	pub _format: i64,
	#[serde(rename = "76")]
	pub newName: String,
	#[serde(rename = "77")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "78")]
	pub folder: Option<IdTupleGenerated>,

	#[serde(default)]
	pub _errors: Errors,
}

impl Entity for DriveItemPutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(74),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveItemDeleteIn {
	#[serde(rename = "80")]
	pub _format: i64,
	#[serde(rename = "81")]
	pub files: Vec<IdTupleGenerated>,
	#[serde(rename = "82")]
	pub folders: Vec<IdTupleGenerated>,
}

impl Entity for DriveItemDeleteIn {
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
	#[serde(rename = "85")]
	pub _format: i64,
	#[serde(rename = "86")]
	pub folderName: String,
	#[serde(rename = "87")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "114")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "88")]
	pub parent: IdTupleGenerated,

	#[serde(default)]
	pub _errors: Errors,
}

impl Entity for DriveFolderServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(84),
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
pub struct DriveRenameData {
	#[serde(rename = "93")]
	pub _id: Option<CustomId>,
	#[serde(rename = "94")]
	#[serde(with = "serde_bytes")]
	pub encNewName: Option<Vec<u8>>,
	#[serde(rename = "95")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "96")]
	pub folder: Option<IdTupleGenerated>,
}

impl Entity for DriveRenameData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(92),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderServicePutIn {
	#[serde(rename = "98")]
	pub _format: i64,
	#[serde(rename = "99")]
	pub items: Vec<DriveRenameData>,
	#[serde(rename = "100")]
	pub destination: IdTupleGenerated,
}

impl Entity for DriveFolderServicePutIn {
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
	#[serde(rename = "102")]
	pub _format: i64,
	#[serde(rename = "105")]
	pub restore: bool,
	#[serde(rename = "103")]
	pub files: Vec<IdTupleGenerated>,
	#[serde(rename = "104")]
	pub folders: Vec<IdTupleGenerated>,
}

impl Entity for DriveFolderServiceDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(101),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveCopyServicePostIn {
	#[serde(rename = "108")]
	pub _format: i64,
	#[serde(rename = "109")]
	pub items: Vec<DriveRenameData>,
	#[serde(rename = "110")]
	pub destination: IdTupleGenerated,
}

impl Entity for DriveCopyServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(107),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveCopyServicePostOut {
	#[serde(rename = "116")]
	pub _format: i64,
	#[serde(rename = "117")]
	pub operationId: GeneratedId,
}

impl Entity for DriveCopyServicePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(115),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveItemServiceDeleteOut {
	#[serde(rename = "119")]
	pub _format: i64,
	#[serde(rename = "120")]
	pub operationId: GeneratedId,
}

impl Entity for DriveItemServiceDeleteOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(118),
		}
	}
}
