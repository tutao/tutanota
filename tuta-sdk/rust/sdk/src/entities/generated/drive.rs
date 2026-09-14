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
	#[serde(rename = "121")]
	#[serde(with = "serde_bytes")]
	pub _kdfNonce: Option<Vec<u8>>,
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
	#[serde(rename = "122")]
	#[serde(with = "serde_bytes")]
	pub _kdfNonce: Option<Vec<u8>>,
	#[serde(rename = "27")]
	pub folder: IdTupleGenerated,
	#[serde(rename = "28")]
	pub blobs: Vec<super::sys::Blob>,
	#[serde(rename = "29")]
	pub originalParent: Option<IdTupleGenerated>,
	#[serde(rename = "167")]
	pub share: Option<GeneratedId>,

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
	pub fileName: Option<String>,
	#[serde(rename = "58")]
	pub mimeType: Option<String>,
	#[serde(rename = "59")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "112")]
	pub ownerKeyVersion: Option<i64>,
	#[serde(rename = "60")]
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,
	#[serde(rename = "149")]
	pub file: Option<DriveFileTransferAggregatedType>,

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
	pub newName: Option<String>,
	#[serde(rename = "77")]
	pub file: Option<IdTupleGenerated>,
	#[serde(rename = "78")]
	pub folder: Option<IdTupleGenerated>,
	#[serde(rename = "150")]
	pub fileWithNewName: Option<DriveFileNameTransferAggregatedType>,
	#[serde(rename = "151")]
	pub folderWithNewName: Option<DriveFolderNameTransferAggregatedType>,

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
	pub folderName: Option<String>,
	#[serde(rename = "87")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "114")]
	pub ownerKeyVersion: Option<i64>,
	#[serde(rename = "88")]
	pub parent: Option<IdTupleGenerated>,
	#[serde(rename = "152")]
	pub folder: Option<DriveFolderTransferAggregatedType>,

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

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderTransferAggregatedType {
	#[serde(rename = "124")]
	pub _id: Option<CustomId>,
	#[serde(rename = "125")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "126")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "127")]
	#[serde(with = "serde_bytes")]
	pub _kdfNonce: Option<Vec<u8>>,
	#[serde(rename = "128")]
	pub name: String,
	#[serde(rename = "129")]
	pub parent: Option<IdTupleGenerated>,

	#[serde(default)]
	pub _errors: Errors,
}

impl Entity for DriveFolderTransferAggregatedType {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(123),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFolderNameTransferAggregatedType {
	#[serde(rename = "131")]
	pub _id: Option<CustomId>,
	#[serde(rename = "132")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "133")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "134")]
	#[serde(with = "serde_bytes")]
	pub _kdfNonce: Option<Vec<u8>>,
	#[serde(rename = "135")]
	pub name: String,

	#[serde(default)]
	pub _errors: Errors,
}

impl Entity for DriveFolderNameTransferAggregatedType {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(130),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileTransferAggregatedType {
	#[serde(rename = "137")]
	pub _id: Option<CustomId>,
	#[serde(rename = "138")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "139")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "140")]
	#[serde(with = "serde_bytes")]
	pub _kdfNonce: Option<Vec<u8>>,
	#[serde(rename = "141")]
	pub name: String,
	#[serde(rename = "142")]
	pub mimeType: String,

	#[serde(default)]
	pub _errors: Errors,
}

impl Entity for DriveFileTransferAggregatedType {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(136),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileNameTransferAggregatedType {
	#[serde(rename = "144")]
	pub _id: Option<CustomId>,
	#[serde(rename = "145")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "146")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "147")]
	#[serde(with = "serde_bytes")]
	pub _kdfNonce: Option<Vec<u8>>,
	#[serde(rename = "148")]
	pub name: String,

	#[serde(default)]
	pub _errors: Errors,
}

impl Entity for DriveFileNameTransferAggregatedType {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(143),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileShare {
	#[serde(rename = "155")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "156")]
	pub _permissions: GeneratedId,
	#[serde(rename = "157")]
	pub _format: i64,
	#[serde(rename = "158")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "160")]
	pub accessToken: String,
	#[serde(rename = "161")]
	#[serde(with = "serde_bytes")]
	pub verifier: Option<Vec<u8>>,
	#[serde(rename = "162")]
	pub expirationDate: Option<DateTime>,
	#[serde(rename = "163")]
	#[serde(with = "serde_bytes")]
	pub shareKeyEncFileSessionKey: Vec<u8>,
	#[serde(rename = "164")]
	#[serde(with = "serde_bytes")]
	pub ownerEncPassword: Option<Vec<u8>>,
	#[serde(rename = "165")]
	pub groupKeyVersion: i64,
	#[serde(rename = "166")]
	#[serde(with = "serde_bytes")]
	pub nonce: Vec<u8>,
	#[serde(rename = "159")]
	pub file: IdTupleGenerated,
}

impl Entity for DriveFileShare {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(153),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileShareServicePostIn {
	#[serde(rename = "169")]
	pub _format: i64,
	#[serde(rename = "171")]
	pub expirationDate: Option<DateTime>,
	#[serde(rename = "172")]
	#[serde(with = "serde_bytes")]
	pub shareKeyEncFileSessionKey: Vec<u8>,
	#[serde(rename = "173")]
	#[serde(with = "serde_bytes")]
	pub ownerEncPassword: Option<Vec<u8>>,
	#[serde(rename = "174")]
	pub groupKeyVersion: i64,
	#[serde(rename = "175")]
	#[serde(with = "serde_bytes")]
	pub verifier: Option<Vec<u8>>,
	#[serde(rename = "176")]
	#[serde(with = "serde_bytes")]
	pub nonce: Vec<u8>,
	#[serde(rename = "170")]
	pub file: IdTupleGenerated,
}

impl Entity for DriveFileShareServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(168),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileShareServicePasswordUpdate {
	#[serde(rename = "178")]
	pub _id: Option<CustomId>,
	#[serde(rename = "179")]
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	#[serde(rename = "180")]
	#[serde(with = "serde_bytes")]
	pub ownerEncPassword: Vec<u8>,
}

impl Entity for DriveFileShareServicePasswordUpdate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(177),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileShareServicePutIn {
	#[serde(rename = "182")]
	pub _format: i64,
	#[serde(rename = "185")]
	pub expirationDate: Option<DateTime>,
	#[serde(rename = "186")]
	pub groupKeyVersion: i64,
	#[serde(rename = "183")]
	pub share: GeneratedId,
	#[serde(rename = "184")]
	pub passwordUpdate: Option<DriveFileShareServicePasswordUpdate>,
}

impl Entity for DriveFileShareServicePutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(181),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileShareServiceDeleteIn {
	#[serde(rename = "188")]
	pub _format: i64,
	#[serde(rename = "189")]
	pub file: IdTupleGenerated,
}

impl Entity for DriveFileShareServiceDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(187),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobServerUrl {
	#[serde(rename = "192")]
	pub _id: Option<CustomId>,
	#[serde(rename = "193")]
	pub url: String,
}

impl Entity for BlobServerUrl {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(191),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct BlobServerAccessInfo {
	#[serde(rename = "195")]
	pub _id: Option<CustomId>,
	#[serde(rename = "196")]
	pub blobAccessToken: String,
	#[serde(rename = "197")]
	pub expires: DateTime,
	#[serde(rename = "198")]
	pub tokenKind: i64,
	#[serde(rename = "199")]
	pub servers: Vec<BlobServerUrl>,
}

impl Entity for BlobServerAccessInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(194),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileShareTokenServicePostIn {
	#[serde(rename = "201")]
	pub _format: i64,
	#[serde(rename = "202")]
	pub file: IdTupleGenerated,
}

impl Entity for DriveFileShareTokenServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(200),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DriveFileShareTokenServicePostOut {
	#[serde(rename = "204")]
	pub _format: i64,
	#[serde(rename = "205")]
	pub blobAccessInfo: BlobServerAccessInfo,
}

impl Entity for DriveFileShareTokenServicePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Drive,
			type_id: TypeId::from(203),
		}
	}
}
