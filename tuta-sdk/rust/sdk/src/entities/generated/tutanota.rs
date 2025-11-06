// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Subfiles {
	#[serde(rename = "12")]
	pub _id: Option<CustomId>,
	#[serde(rename = "27")]
	pub files: GeneratedId,
}

impl Entity for Subfiles {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(11),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TutanotaFile {
	#[serde(rename = "15")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "16")]
	pub _permissions: GeneratedId,
	#[serde(rename = "17")]
	pub _format: i64,
	#[serde(rename = "18")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "21")]
	pub name: String,
	#[serde(rename = "22")]
	pub size: i64,
	#[serde(rename = "23")]
	pub mimeType: Option<String>,
	#[serde(rename = "580")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "924")]
	pub cid: Option<String>,
	#[serde(rename = "1391")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "25")]
	pub parent: Option<IdTupleGenerated>,
	#[serde(rename = "26")]
	pub subFiles: Option<Subfiles>,
	#[serde(rename = "1225")]
	pub blobs: Vec<super::sys::Blob>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for TutanotaFile {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(13),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct FileSystem {
	#[serde(rename = "30")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "31")]
	pub _permissions: GeneratedId,
	#[serde(rename = "32")]
	pub _format: i64,
	#[serde(rename = "581")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "582")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1392")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "35")]
	pub files: GeneratedId,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for FileSystem {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(28),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactMailAddress {
	#[serde(rename = "45")]
	pub _id: Option<CustomId>,
	#[serde(rename = "46")]
	pub r#type: i64,
	#[serde(rename = "47")]
	pub address: String,
	#[serde(rename = "48")]
	pub customTypeName: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactMailAddress {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(44),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactPhoneNumber {
	#[serde(rename = "50")]
	pub _id: Option<CustomId>,
	#[serde(rename = "51")]
	pub r#type: i64,
	#[serde(rename = "52")]
	pub number: String,
	#[serde(rename = "53")]
	pub customTypeName: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactPhoneNumber {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(49),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactAddress {
	#[serde(rename = "55")]
	pub _id: Option<CustomId>,
	#[serde(rename = "56")]
	pub r#type: i64,
	#[serde(rename = "57")]
	pub address: String,
	#[serde(rename = "58")]
	pub customTypeName: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactAddress {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(54),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactSocialId {
	#[serde(rename = "60")]
	pub _id: Option<CustomId>,
	#[serde(rename = "61")]
	pub r#type: i64,
	#[serde(rename = "62")]
	pub socialId: String,
	#[serde(rename = "63")]
	pub customTypeName: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactSocialId {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(59),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Contact {
	#[serde(rename = "66")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "67")]
	pub _permissions: GeneratedId,
	#[serde(rename = "68")]
	pub _format: i64,
	#[serde(rename = "69")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "72")]
	pub firstName: String,
	#[serde(rename = "73")]
	pub lastName: String,
	#[serde(rename = "74")]
	pub company: String,
	#[serde(rename = "75")]
	pub role: String,
	#[serde(rename = "76")]
	pub oldBirthdayDate: Option<DateTime>,
	#[serde(rename = "77")]
	pub comment: String,
	#[serde(rename = "79")]
	pub presharedPassword: Option<String>,
	#[serde(rename = "585")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "849")]
	pub nickname: Option<String>,
	#[serde(rename = "850")]
	pub title: Option<String>,
	#[serde(rename = "1083")]
	pub birthdayIso: Option<String>,
	#[serde(rename = "1380")]
	pub middleName: Option<String>,
	#[serde(rename = "1381")]
	pub nameSuffix: Option<String>,
	#[serde(rename = "1382")]
	pub phoneticFirst: Option<String>,
	#[serde(rename = "1383")]
	pub phoneticMiddle: Option<String>,
	#[serde(rename = "1384")]
	pub phoneticLast: Option<String>,
	#[serde(rename = "1385")]
	pub department: Option<String>,
	#[serde(rename = "1394")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "80")]
	pub mailAddresses: Vec<ContactMailAddress>,
	#[serde(rename = "81")]
	pub phoneNumbers: Vec<ContactPhoneNumber>,
	#[serde(rename = "82")]
	pub addresses: Vec<ContactAddress>,
	#[serde(rename = "83")]
	pub socialIds: Vec<ContactSocialId>,
	#[serde(rename = "851")]
	pub oldBirthdayAggregate: Option<Birthday>,
	#[serde(rename = "852")]
	pub photo: Option<IdTupleGenerated>,
	#[serde(rename = "1386")]
	pub customDate: Vec<ContactCustomDate>,
	#[serde(rename = "1387")]
	pub websites: Vec<ContactWebsite>,
	#[serde(rename = "1388")]
	pub relationships: Vec<ContactRelationship>,
	#[serde(rename = "1389")]
	pub messengerHandles: Vec<ContactMessengerHandle>,
	#[serde(rename = "1390")]
	pub pronouns: Vec<ContactPronouns>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for Contact {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(64),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ConversationEntry {
	#[serde(rename = "118")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "119")]
	pub _permissions: GeneratedId,
	#[serde(rename = "120")]
	pub _format: i64,
	#[serde(rename = "121")]
	pub messageId: String,
	#[serde(rename = "122")]
	pub conversationType: i64,
	#[serde(rename = "588")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "123")]
	pub previous: Option<IdTupleGenerated>,
	#[serde(rename = "124")]
	pub mail: Option<IdTupleGenerated>,
}

impl Entity for ConversationEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(84),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddress {
	#[serde(rename = "93")]
	pub _id: Option<CustomId>,
	#[serde(rename = "94")]
	pub name: String,
	#[serde(rename = "95")]
	pub address: String,
	#[serde(rename = "96")]
	pub contact: Option<IdTupleGenerated>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for MailAddress {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(92),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Mail {
	#[serde(rename = "99")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "100")]
	pub _permissions: GeneratedId,
	#[serde(rename = "101")]
	pub _format: i64,
	#[serde(rename = "102")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "105")]
	pub subject: String,
	#[serde(rename = "107")]
	pub receivedDate: DateTime,
	#[serde(rename = "108")]
	pub state: i64,
	#[serde(rename = "109")]
	pub unread: bool,
	#[serde(rename = "426")]
	pub confidential: bool,
	#[serde(rename = "466")]
	pub replyType: i64,
	#[serde(rename = "587")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "617")]
	pub differentEnvelopeSender: Option<String>,
	#[serde(rename = "866")]
	pub listUnsubscribe: bool,
	#[serde(rename = "896")]
	pub movedTime: Option<DateTime>,
	#[serde(rename = "1021")]
	pub phishingStatus: i64,
	#[serde(rename = "1022")]
	pub authStatus: Option<i64>,
	#[serde(rename = "1120")]
	pub method: i64,
	#[serde(rename = "1307")]
	pub recipientCount: i64,
	#[serde(rename = "1346")]
	pub encryptionAuthStatus: Option<i64>,
	#[serde(rename = "1395")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1677")]
	pub keyVerificationState: Option<i64>,
	#[serde(rename = "1728")]
	pub processingState: i64,
	#[serde(rename = "1736")]
	pub sendAt: Option<DateTime>,
	#[serde(rename = "111")]
	pub sender: MailAddress,
	#[serde(rename = "115")]
	pub attachments: Vec<IdTupleGenerated>,
	#[serde(rename = "117")]
	pub conversationEntry: IdTupleGenerated,
	#[serde(rename = "1306")]
	pub firstRecipient: Option<MailAddress>,
	#[serde(rename = "1308")]
	pub mailDetails: Option<IdTupleGenerated>,
	#[serde(rename = "1309")]
	pub mailDetailsDraft: Option<IdTupleGenerated>,
	#[serde(rename = "1310")]
	pub bucketKey: Option<super::sys::BucketKey>,
	#[serde(rename = "1465")]
	pub sets: Vec<IdTupleGenerated>,
	#[serde(rename = "1729")]
	pub clientSpamClassifierResult: Option<ClientSpamClassifierResult>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for Mail {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(97),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailBox {
	#[serde(rename = "127")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "128")]
	pub _permissions: GeneratedId,
	#[serde(rename = "129")]
	pub _format: i64,
	#[serde(rename = "569")]
	pub lastInfoDate: DateTime,
	#[serde(rename = "590")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "591")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1396")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "133")]
	pub sentAttachments: GeneratedId,
	#[serde(rename = "134")]
	pub receivedAttachments: GeneratedId,
	#[serde(rename = "443")]
	pub folders: Option<MailFolderRef>,
	#[serde(rename = "1220")]
	pub spamResults: Option<SpamResults>,
	#[serde(rename = "1318")]
	pub mailDetailsDrafts: Option<MailDetailsDraftsRef>,
	#[serde(rename = "1463")]
	pub archivedMailBags: Vec<MailBag>,
	#[serde(rename = "1464")]
	pub currentMailBag: Option<MailBag>,
	#[serde(rename = "1512")]
	pub importedAttachments: GeneratedId,
	#[serde(rename = "1585")]
	pub mailImportStates: GeneratedId,
	#[serde(rename = "1710")]
	pub extractedFeatures: Option<GeneratedId>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for MailBox {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(125),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateExternalUserGroupData {
	#[serde(rename = "139")]
	pub _id: Option<CustomId>,
	#[serde(rename = "141")]
	pub mailAddress: String,
	#[serde(rename = "142")]
	#[serde(with = "serde_bytes")]
	pub externalPwEncUserGroupKey: Vec<u8>,
	#[serde(rename = "143")]
	#[serde(with = "serde_bytes")]
	pub internalUserEncUserGroupKey: Vec<u8>,
	#[serde(rename = "1433")]
	pub internalUserGroupKeyVersion: i64,
}

impl Entity for CreateExternalUserGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(138),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ExternalUserData {
	#[serde(rename = "146")]
	pub _format: i64,
	#[serde(rename = "148")]
	#[serde(with = "serde_bytes")]
	pub externalUserEncMailGroupKey: Vec<u8>,
	#[serde(rename = "149")]
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	#[serde(rename = "150")]
	#[serde(with = "serde_bytes")]
	pub externalUserEncUserGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "412")]
	#[serde(with = "serde_bytes")]
	pub externalUserEncEntropy: Vec<u8>,
	#[serde(rename = "669")]
	#[serde(with = "serde_bytes")]
	pub internalMailEncUserGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "670")]
	#[serde(with = "serde_bytes")]
	pub externalMailEncMailGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "671")]
	#[serde(with = "serde_bytes")]
	pub internalMailEncMailGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "672")]
	#[serde(with = "serde_bytes")]
	pub externalUserEncTutanotaPropertiesSessionKey: Vec<u8>,
	#[serde(rename = "673")]
	#[serde(with = "serde_bytes")]
	pub externalMailEncMailBoxSessionKey: Vec<u8>,
	#[serde(rename = "1323")]
	pub kdfVersion: i64,
	#[serde(rename = "1429")]
	pub internalMailGroupKeyVersion: i64,
	#[serde(rename = "151")]
	pub userGroupData: CreateExternalUserGroupData,
}

impl Entity for ExternalUserData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(145),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactList {
	#[serde(rename = "155")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "156")]
	pub _permissions: GeneratedId,
	#[serde(rename = "157")]
	pub _format: i64,
	#[serde(rename = "592")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "593")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1397")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "160")]
	pub contacts: GeneratedId,
	#[serde(rename = "856")]
	pub photos: Option<PhotosRef>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactList {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(153),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RemoteImapSyncInfo {
	#[serde(rename = "185")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "186")]
	pub _permissions: GeneratedId,
	#[serde(rename = "187")]
	pub _format: i64,
	#[serde(rename = "189")]
	pub seen: bool,
	#[serde(rename = "594")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "188")]
	pub message: IdTupleGenerated,
}

impl Entity for RemoteImapSyncInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(183),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImapFolder {
	#[serde(rename = "191")]
	pub _id: Option<CustomId>,
	#[serde(rename = "192")]
	pub name: String,
	#[serde(rename = "193")]
	pub lastseenuid: String,
	#[serde(rename = "194")]
	pub uidvalidity: String,
	#[serde(rename = "195")]
	pub syncInfo: GeneratedId,
}

impl Entity for ImapFolder {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(190),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImapSyncState {
	#[serde(rename = "198")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "199")]
	pub _permissions: GeneratedId,
	#[serde(rename = "200")]
	pub _format: i64,
	#[serde(rename = "595")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "201")]
	pub folders: Vec<ImapFolder>,
}

impl Entity for ImapSyncState {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(196),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImapSyncConfiguration {
	#[serde(rename = "210")]
	pub _id: Option<CustomId>,
	#[serde(rename = "211")]
	pub host: String,
	#[serde(rename = "212")]
	pub port: i64,
	#[serde(rename = "213")]
	pub user: String,
	#[serde(rename = "214")]
	pub password: String,
	#[serde(rename = "215")]
	pub imapSyncState: Option<GeneratedId>,
}

impl Entity for ImapSyncConfiguration {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(209),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TutanotaProperties {
	#[serde(rename = "218")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "219")]
	pub _permissions: GeneratedId,
	#[serde(rename = "220")]
	pub _format: i64,
	#[serde(rename = "410")]
	#[serde(with = "serde_bytes")]
	pub userEncEntropy: Option<Vec<u8>>,
	#[serde(rename = "418")]
	pub notificationMailLanguage: Option<String>,
	#[serde(rename = "469")]
	pub defaultSender: Option<String>,
	#[serde(rename = "470")]
	pub defaultUnconfidential: bool,
	#[serde(rename = "471")]
	pub customEmailSignature: String,
	#[serde(rename = "472")]
	pub emailSignatureType: i64,
	#[serde(rename = "568")]
	pub noAutomaticContacts: bool,
	#[serde(rename = "597")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "598")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "676")]
	pub sendPlaintextOnly: bool,
	#[serde(rename = "897")]
	pub lastSeenAnnouncement: i64,
	#[serde(rename = "1398")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1434")]
	pub userKeyVersion: Option<i64>,
	#[serde(rename = "1510")]
	pub defaultLabelCreated: bool,
	#[serde(rename = "221")]
	pub lastPushedMail: Option<IdTupleGenerated>,
	#[serde(rename = "222")]
	pub imapSyncConfig: Vec<ImapSyncConfiguration>,
	#[serde(rename = "578")]
	pub inboxRules: Vec<InboxRule>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for TutanotaProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(216),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NotificationMail {
	#[serde(rename = "224")]
	pub _id: Option<CustomId>,
	#[serde(rename = "225")]
	pub subject: String,
	#[serde(rename = "226")]
	pub bodyText: String,
	#[serde(rename = "227")]
	pub recipientMailAddress: String,
	#[serde(rename = "228")]
	pub recipientName: String,
	#[serde(rename = "417")]
	pub mailboxLink: String,
}

impl Entity for NotificationMail {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(223),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DeleteMailData {
	#[serde(rename = "420")]
	pub _format: i64,
	#[serde(rename = "421")]
	pub mails: Vec<IdTupleGenerated>,
	#[serde(rename = "724")]
	pub folder: Option<IdTupleGenerated>,
}

impl Entity for DeleteMailData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(419),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailFolder {
	#[serde(rename = "431")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "432")]
	pub _permissions: GeneratedId,
	#[serde(rename = "433")]
	pub _format: i64,
	#[serde(rename = "434")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "435")]
	pub name: String,
	#[serde(rename = "436")]
	pub folderType: i64,
	#[serde(rename = "589")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1399")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1479")]
	pub color: Option<String>,
	#[serde(rename = "439")]
	pub parentFolder: Option<IdTupleGenerated>,
	#[serde(rename = "1459")]
	pub entries: GeneratedId,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for MailFolder {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(429),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailFolderRef {
	#[serde(rename = "441")]
	pub _id: Option<CustomId>,
	#[serde(rename = "442")]
	pub folders: GeneratedId,
}

impl Entity for MailFolderRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(440),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MoveMailData {
	#[serde(rename = "446")]
	pub _format: i64,
	#[serde(rename = "1714")]
	pub moveReason: Option<i64>,
	#[serde(rename = "447")]
	pub targetFolder: IdTupleGenerated,
	#[serde(rename = "448")]
	pub mails: Vec<IdTupleGenerated>,
	#[serde(rename = "1644")]
	pub excludeMailSet: Option<IdTupleGenerated>,
}

impl Entity for MoveMailData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(445),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateMailFolderData {
	#[serde(rename = "451")]
	pub _format: i64,
	#[serde(rename = "453")]
	pub folderName: String,
	#[serde(rename = "454")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "1268")]
	pub ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1414")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "452")]
	pub parentFolder: Option<IdTupleGenerated>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CreateMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(450),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateMailFolderReturn {
	#[serde(rename = "456")]
	pub _format: i64,
	#[serde(rename = "457")]
	pub newFolder: IdTupleGenerated,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CreateMailFolderReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(455),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DeleteMailFolderData {
	#[serde(rename = "459")]
	pub _format: i64,
	#[serde(rename = "460")]
	pub folders: Vec<IdTupleGenerated>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DeleteMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(458),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EncryptTutanotaPropertiesData {
	#[serde(rename = "474")]
	pub _format: i64,
	#[serde(rename = "476")]
	#[serde(with = "serde_bytes")]
	pub symEncSessionKey: Vec<u8>,
	#[serde(rename = "1428")]
	pub symKeyVersion: i64,
	#[serde(rename = "475")]
	pub properties: GeneratedId,
}

impl Entity for EncryptTutanotaPropertiesData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(473),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftRecipient {
	#[serde(rename = "483")]
	pub _id: Option<CustomId>,
	#[serde(rename = "484")]
	pub name: String,
	#[serde(rename = "485")]
	pub mailAddress: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DraftRecipient {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(482),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewDraftAttachment {
	#[serde(rename = "487")]
	pub _id: Option<CustomId>,
	#[serde(rename = "488")]
	#[serde(with = "serde_bytes")]
	pub encFileName: Vec<u8>,
	#[serde(rename = "489")]
	#[serde(with = "serde_bytes")]
	pub encMimeType: Vec<u8>,
	#[serde(rename = "925")]
	#[serde(with = "serde_bytes")]
	pub encCid: Option<Vec<u8>>,
	#[serde(rename = "1226")]
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,
}

impl Entity for NewDraftAttachment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(486),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftAttachment {
	#[serde(rename = "492")]
	pub _id: Option<CustomId>,
	#[serde(rename = "493")]
	#[serde(with = "serde_bytes")]
	pub ownerEncFileSessionKey: Vec<u8>,
	#[serde(rename = "1430")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "494")]
	pub newFile: Option<NewDraftAttachment>,
	#[serde(rename = "495")]
	pub existingFile: Option<IdTupleGenerated>,
}

impl Entity for DraftAttachment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(491),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftData {
	#[serde(rename = "497")]
	pub _id: Option<CustomId>,
	#[serde(rename = "498")]
	pub subject: String,
	#[serde(rename = "499")]
	pub bodyText: String,
	#[serde(rename = "500")]
	pub senderMailAddress: String,
	#[serde(rename = "501")]
	pub senderName: String,
	#[serde(rename = "502")]
	pub confidential: bool,
	#[serde(rename = "1116")]
	pub method: i64,
	#[serde(rename = "1194")]
	pub compressedBodyText: Option<String>,
	#[serde(rename = "503")]
	pub toRecipients: Vec<DraftRecipient>,
	#[serde(rename = "504")]
	pub ccRecipients: Vec<DraftRecipient>,
	#[serde(rename = "505")]
	pub bccRecipients: Vec<DraftRecipient>,
	#[serde(rename = "506")]
	pub addedAttachments: Vec<DraftAttachment>,
	#[serde(rename = "507")]
	pub removedAttachments: Vec<IdTupleGenerated>,
	#[serde(rename = "819")]
	pub replyTos: Vec<EncryptedMailAddress>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DraftData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(496),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftCreateData {
	#[serde(rename = "509")]
	pub _format: i64,
	#[serde(rename = "510")]
	pub previousMessageId: Option<String>,
	#[serde(rename = "511")]
	pub conversationType: i64,
	#[serde(rename = "512")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "1427")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "515")]
	pub draftData: DraftData,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DraftCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(508),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftCreateReturn {
	#[serde(rename = "517")]
	pub _format: i64,
	#[serde(rename = "518")]
	pub draft: IdTupleGenerated,
}

impl Entity for DraftCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(516),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftUpdateData {
	#[serde(rename = "520")]
	pub _format: i64,
	#[serde(rename = "521")]
	pub draftData: DraftData,
	#[serde(rename = "522")]
	pub draft: IdTupleGenerated,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DraftUpdateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(519),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftUpdateReturn {
	#[serde(rename = "524")]
	pub _format: i64,
	#[serde(rename = "525")]
	pub attachments: Vec<IdTupleGenerated>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DraftUpdateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(523),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InternalRecipientKeyData {
	#[serde(rename = "528")]
	pub _id: Option<CustomId>,
	#[serde(rename = "529")]
	pub mailAddress: String,
	#[serde(rename = "530")]
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Vec<u8>,
	#[serde(rename = "531")]
	pub recipientKeyVersion: i64,
	#[serde(rename = "1352")]
	pub protocolVersion: i64,
	#[serde(rename = "1431")]
	pub senderKeyVersion: Option<i64>,
}

impl Entity for InternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(527),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecureExternalRecipientKeyData {
	#[serde(rename = "533")]
	pub _id: Option<CustomId>,
	#[serde(rename = "534")]
	pub mailAddress: String,
	#[serde(rename = "536")]
	#[serde(with = "serde_bytes")]
	pub passwordVerifier: Vec<u8>,
	#[serde(rename = "538")]
	#[serde(with = "serde_bytes")]
	pub salt: Option<Vec<u8>>,
	#[serde(rename = "539")]
	#[serde(with = "serde_bytes")]
	pub saltHash: Option<Vec<u8>>,
	#[serde(rename = "540")]
	#[serde(with = "serde_bytes")]
	pub pwEncCommunicationKey: Option<Vec<u8>>,
	#[serde(rename = "599")]
	#[serde(with = "serde_bytes")]
	pub ownerEncBucketKey: Vec<u8>,
	#[serde(rename = "1324")]
	pub kdfVersion: i64,
	#[serde(rename = "1417")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "1445")]
	pub userGroupKeyVersion: i64,
}

impl Entity for SecureExternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(532),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AttachmentKeyData {
	#[serde(rename = "543")]
	pub _id: Option<CustomId>,
	#[serde(rename = "544")]
	#[serde(with = "serde_bytes")]
	pub bucketEncFileSessionKey: Option<Vec<u8>>,
	#[serde(rename = "545")]
	#[serde(with = "serde_bytes")]
	pub fileSessionKey: Option<Vec<u8>>,
	#[serde(rename = "546")]
	pub file: IdTupleGenerated,
}

impl Entity for AttachmentKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(542),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SendDraftData {
	#[serde(rename = "548")]
	pub _format: i64,
	#[serde(rename = "549")]
	pub language: String,
	#[serde(rename = "550")]
	#[serde(with = "serde_bytes")]
	pub mailSessionKey: Option<Vec<u8>>,
	#[serde(rename = "551")]
	#[serde(with = "serde_bytes")]
	pub bucketEncMailSessionKey: Option<Vec<u8>>,
	#[serde(rename = "552")]
	pub senderNameUnencrypted: Option<String>,
	#[serde(rename = "675")]
	pub plaintext: bool,
	#[serde(rename = "1117")]
	pub calendarMethod: bool,
	#[serde(rename = "1444")]
	#[serde(with = "serde_bytes")]
	pub sessionEncEncryptionAuthStatus: Option<Vec<u8>>,
	#[serde(rename = "1761")]
	pub sendAt: Option<DateTime>,
	#[serde(rename = "553")]
	pub internalRecipientKeyData: Vec<InternalRecipientKeyData>,
	#[serde(rename = "554")]
	pub secureExternalRecipientKeyData: Vec<SecureExternalRecipientKeyData>,
	#[serde(rename = "555")]
	pub attachmentKeyData: Vec<AttachmentKeyData>,
	#[serde(rename = "556")]
	pub mail: IdTupleGenerated,
	#[serde(rename = "1353")]
	pub symEncInternalRecipientKeyData: Vec<SymEncInternalRecipientKeyData>,
	#[serde(rename = "1762")]
	pub parameters: Option<SendDraftParameters>,
}

impl Entity for SendDraftData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(547),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SendDraftReturn {
	#[serde(rename = "558")]
	pub _format: i64,
	#[serde(rename = "559")]
	pub messageId: String,
	#[serde(rename = "560")]
	pub sentDate: DateTime,
	#[serde(rename = "561")]
	pub notifications: Vec<NotificationMail>,
	#[serde(rename = "562")]
	pub sentMail: IdTupleGenerated,
}

impl Entity for SendDraftReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(557),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReceiveInfoServiceData {
	#[serde(rename = "571")]
	pub _format: i64,
	#[serde(rename = "1121")]
	pub language: String,
}

impl Entity for ReceiveInfoServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(570),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InboxRule {
	#[serde(rename = "574")]
	pub _id: Option<CustomId>,
	#[serde(rename = "575")]
	pub r#type: String,
	#[serde(rename = "576")]
	pub value: String,
	#[serde(rename = "577")]
	pub targetFolder: IdTupleGenerated,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for InboxRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(573),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EncryptedMailAddress {
	#[serde(rename = "613")]
	pub _id: Option<CustomId>,
	#[serde(rename = "614")]
	pub name: String,
	#[serde(rename = "615")]
	pub address: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for EncryptedMailAddress {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(612),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAccountUserData {
	#[serde(rename = "623")]
	pub _id: Option<CustomId>,
	#[serde(rename = "624")]
	pub mailAddress: String,
	#[serde(rename = "625")]
	#[serde(with = "serde_bytes")]
	pub encryptedName: Vec<u8>,
	#[serde(rename = "626")]
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	#[serde(rename = "627")]
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	#[serde(rename = "629")]
	#[serde(with = "serde_bytes")]
	pub pwEncUserGroupKey: Vec<u8>,
	#[serde(rename = "630")]
	#[serde(with = "serde_bytes")]
	pub userEncCustomerGroupKey: Vec<u8>,
	#[serde(rename = "631")]
	#[serde(with = "serde_bytes")]
	pub userEncMailGroupKey: Vec<u8>,
	#[serde(rename = "632")]
	#[serde(with = "serde_bytes")]
	pub userEncContactGroupKey: Vec<u8>,
	#[serde(rename = "633")]
	#[serde(with = "serde_bytes")]
	pub userEncFileGroupKey: Vec<u8>,
	#[serde(rename = "634")]
	#[serde(with = "serde_bytes")]
	pub userEncEntropy: Vec<u8>,
	#[serde(rename = "635")]
	#[serde(with = "serde_bytes")]
	pub userEncTutanotaPropertiesSessionKey: Vec<u8>,
	#[serde(rename = "636")]
	#[serde(with = "serde_bytes")]
	pub mailEncMailBoxSessionKey: Vec<u8>,
	#[serde(rename = "637")]
	#[serde(with = "serde_bytes")]
	pub contactEncContactListSessionKey: Vec<u8>,
	#[serde(rename = "638")]
	#[serde(with = "serde_bytes")]
	pub fileEncFileSystemSessionKey: Vec<u8>,
	#[serde(rename = "639")]
	#[serde(with = "serde_bytes")]
	pub customerEncMailGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "640")]
	#[serde(with = "serde_bytes")]
	pub customerEncContactGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "641")]
	#[serde(with = "serde_bytes")]
	pub customerEncFileGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "892")]
	#[serde(with = "serde_bytes")]
	pub userEncRecoverCode: Vec<u8>,
	#[serde(rename = "893")]
	#[serde(with = "serde_bytes")]
	pub recoverCodeEncUserGroupKey: Vec<u8>,
	#[serde(rename = "894")]
	#[serde(with = "serde_bytes")]
	pub recoverCodeVerifier: Vec<u8>,
	#[serde(rename = "1322")]
	pub kdfVersion: i64,
	#[serde(rename = "1426")]
	pub customerKeyVersion: i64,
}

impl Entity for UserAccountUserData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(622),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InternalGroupData {
	#[serde(rename = "643")]
	pub _id: Option<CustomId>,
	#[serde(rename = "644")]
	#[serde(with = "serde_bytes")]
	pub pubRsaKey: Option<Vec<u8>>,
	#[serde(rename = "645")]
	#[serde(with = "serde_bytes")]
	pub groupEncPrivRsaKey: Option<Vec<u8>>,
	#[serde(rename = "646")]
	#[serde(with = "serde_bytes")]
	pub adminEncGroupKey: Vec<u8>,
	#[serde(rename = "647")]
	#[serde(with = "serde_bytes")]
	pub ownerEncGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "1342")]
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Option<Vec<u8>>,
	#[serde(rename = "1343")]
	#[serde(with = "serde_bytes")]
	pub groupEncPrivEccKey: Option<Vec<u8>>,
	#[serde(rename = "1344")]
	#[serde(with = "serde_bytes")]
	pub pubKyberKey: Option<Vec<u8>>,
	#[serde(rename = "1345")]
	#[serde(with = "serde_bytes")]
	pub groupEncPrivKyberKey: Option<Vec<u8>>,
	#[serde(rename = "1415")]
	pub adminKeyVersion: i64,
	#[serde(rename = "1416")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "874")]
	pub adminGroup: Option<GeneratedId>,
}

impl Entity for InternalGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(642),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerAccountCreateData {
	#[serde(rename = "649")]
	pub _format: i64,
	#[serde(rename = "650")]
	pub authToken: String,
	#[serde(rename = "651")]
	pub date: Option<DateTime>,
	#[serde(rename = "652")]
	pub lang: String,
	#[serde(rename = "654")]
	#[serde(with = "serde_bytes")]
	pub userEncAdminGroupKey: Vec<u8>,
	#[serde(rename = "655")]
	#[serde(with = "serde_bytes")]
	pub userEncAccountGroupKey: Vec<u8>,
	#[serde(rename = "659")]
	#[serde(with = "serde_bytes")]
	pub adminEncAccountingInfoSessionKey: Vec<u8>,
	#[serde(rename = "660")]
	#[serde(with = "serde_bytes")]
	pub systemAdminPubEncAccountingInfoSessionKey: Vec<u8>,
	#[serde(rename = "661")]
	#[serde(with = "serde_bytes")]
	pub adminEncCustomerServerPropertiesSessionKey: Vec<u8>,
	#[serde(rename = "873")]
	pub code: String,
	#[serde(rename = "1355")]
	pub systemAdminPublicProtocolVersion: i64,
	#[serde(rename = "1421")]
	pub accountGroupKeyVersion: i64,
	#[serde(rename = "1422")]
	pub systemAdminPubKeyVersion: i64,
	#[serde(rename = "1511")]
	pub app: i64,
	#[serde(rename = "653")]
	pub userData: UserAccountUserData,
	#[serde(rename = "656")]
	pub userGroupData: InternalGroupData,
	#[serde(rename = "657")]
	pub adminGroupData: InternalGroupData,
	#[serde(rename = "658")]
	pub customerGroupData: InternalGroupData,
}

impl Entity for CustomerAccountCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(648),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAccountCreateData {
	#[serde(rename = "664")]
	pub _format: i64,
	#[serde(rename = "665")]
	pub date: Option<DateTime>,
	#[serde(rename = "666")]
	pub userData: UserAccountUserData,
	#[serde(rename = "667")]
	pub userGroupData: InternalGroupData,
}

impl Entity for UserAccountCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(663),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailboxServerProperties {
	#[serde(rename = "679")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "680")]
	pub _permissions: GeneratedId,
	#[serde(rename = "681")]
	pub _format: i64,
	#[serde(rename = "682")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "683")]
	pub whitelistProtectionEnabled: bool,
}

impl Entity for MailboxServerProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(677),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailboxGroupRoot {
	#[serde(rename = "695")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "696")]
	pub _permissions: GeneratedId,
	#[serde(rename = "697")]
	pub _format: i64,
	#[serde(rename = "698")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "699")]
	pub mailbox: GeneratedId,
	#[serde(rename = "700")]
	pub serverProperties: GeneratedId,
	#[serde(rename = "1119")]
	pub calendarEventUpdates: Option<CalendarEventUpdateList>,
	#[serde(rename = "1150")]
	pub outOfOfficeNotification: Option<GeneratedId>,
	#[serde(rename = "1151")]
	pub outOfOfficeNotificationRecipientList: Option<OutOfOfficeNotificationRecipientList>,
	#[serde(rename = "1203")]
	pub mailboxProperties: Option<GeneratedId>,
}

impl Entity for MailboxGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(693),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateMailGroupData {
	#[serde(rename = "708")]
	pub _format: i64,
	#[serde(rename = "709")]
	pub mailAddress: String,
	#[serde(rename = "710")]
	#[serde(with = "serde_bytes")]
	pub encryptedName: Vec<u8>,
	#[serde(rename = "711")]
	#[serde(with = "serde_bytes")]
	pub mailEncMailboxSessionKey: Vec<u8>,
	#[serde(rename = "712")]
	pub groupData: InternalGroupData,
}

impl Entity for CreateMailGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(707),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DeleteGroupData {
	#[serde(rename = "714")]
	pub _format: i64,
	#[serde(rename = "715")]
	pub restore: bool,
	#[serde(rename = "716")]
	pub group: GeneratedId,
}

impl Entity for DeleteGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(713),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Birthday {
	#[serde(rename = "845")]
	pub _id: Option<CustomId>,
	#[serde(rename = "846")]
	pub day: i64,
	#[serde(rename = "847")]
	pub month: i64,
	#[serde(rename = "848")]
	pub year: Option<i64>,
}

impl Entity for Birthday {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(844),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PhotosRef {
	#[serde(rename = "854")]
	pub _id: Option<CustomId>,
	#[serde(rename = "855")]
	pub files: GeneratedId,
}

impl Entity for PhotosRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(853),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ListUnsubscribeData {
	#[serde(rename = "868")]
	pub _format: i64,
	#[serde(rename = "871")]
	pub postLink: String,
	#[serde(rename = "869")]
	pub mail: IdTupleGenerated,
}

impl Entity for ListUnsubscribeData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(867),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarRepeatRule {
	#[serde(rename = "927")]
	pub _id: Option<CustomId>,
	#[serde(rename = "928")]
	pub frequency: i64,
	#[serde(rename = "929")]
	pub endType: i64,
	#[serde(rename = "930")]
	pub endValue: Option<i64>,
	#[serde(rename = "931")]
	pub interval: i64,
	#[serde(rename = "932")]
	pub timeZone: String,
	#[serde(rename = "1319")]
	pub excludedDates: Vec<super::sys::DateWrapper>,
	#[serde(rename = "1590")]
	pub advancedRules: Vec<AdvancedRepeatRule>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CalendarRepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(926),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEvent {
	#[serde(rename = "935")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "936")]
	pub _permissions: GeneratedId,
	#[serde(rename = "937")]
	pub _format: i64,
	#[serde(rename = "938")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "939")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "940")]
	pub summary: String,
	#[serde(rename = "941")]
	pub description: String,
	#[serde(rename = "942")]
	pub startTime: DateTime,
	#[serde(rename = "943")]
	pub endTime: DateTime,
	#[serde(rename = "944")]
	pub location: String,
	#[serde(rename = "988")]
	pub uid: Option<String>,
	#[serde(rename = "1088")]
	#[serde(with = "serde_bytes")]
	pub hashedUid: Option<Vec<u8>>,
	#[serde(rename = "1089")]
	pub sequence: i64,
	#[serde(rename = "1090")]
	pub invitedConfidentially: Option<bool>,
	#[serde(rename = "1320")]
	pub recurrenceId: Option<DateTime>,
	#[serde(rename = "1401")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "945")]
	pub repeatRule: Option<CalendarRepeatRule>,
	#[serde(rename = "946")]
	pub alarmInfos: Vec<IdTupleGenerated>,
	#[serde(rename = "1091")]
	pub attendees: Vec<CalendarEventAttendee>,
	#[serde(rename = "1092")]
	pub organizer: Option<EncryptedMailAddress>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CalendarEvent {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(933),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarGroupRoot {
	#[serde(rename = "949")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "950")]
	pub _permissions: GeneratedId,
	#[serde(rename = "951")]
	pub _format: i64,
	#[serde(rename = "952")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "953")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1402")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "954")]
	pub shortEvents: GeneratedId,
	#[serde(rename = "955")]
	pub longEvents: GeneratedId,
	#[serde(rename = "1103")]
	pub index: Option<CalendarEventIndexRef>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CalendarGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(947),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAreaGroupData {
	#[serde(rename = "957")]
	pub _id: Option<CustomId>,
	#[serde(rename = "958")]
	#[serde(with = "serde_bytes")]
	pub groupEncGroupRootSessionKey: Vec<u8>,
	#[serde(rename = "959")]
	#[serde(with = "serde_bytes")]
	pub adminEncGroupKey: Option<Vec<u8>>,
	#[serde(rename = "960")]
	#[serde(with = "serde_bytes")]
	pub customerEncGroupInfoSessionKey: Vec<u8>,
	#[serde(rename = "961")]
	#[serde(with = "serde_bytes")]
	pub userEncGroupKey: Vec<u8>,
	#[serde(rename = "962")]
	#[serde(with = "serde_bytes")]
	pub groupInfoEncName: Vec<u8>,
	#[serde(rename = "1423")]
	pub adminKeyVersion: Option<i64>,
	#[serde(rename = "1424")]
	pub customerKeyVersion: i64,
	#[serde(rename = "1425")]
	pub userKeyVersion: i64,
	#[serde(rename = "963")]
	pub adminGroup: Option<GeneratedId>,
}

impl Entity for UserAreaGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(956),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAreaGroupPostData {
	#[serde(rename = "965")]
	pub _format: i64,
	#[serde(rename = "966")]
	pub groupData: UserAreaGroupData,
}

impl Entity for UserAreaGroupPostData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(964),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupSettings {
	#[serde(rename = "969")]
	pub _id: Option<CustomId>,
	#[serde(rename = "971")]
	pub color: String,
	#[serde(rename = "1020")]
	pub name: Option<String>,
	#[serde(rename = "1468")]
	pub sourceUrl: Option<String>,
	#[serde(rename = "970")]
	pub group: GeneratedId,
	#[serde(rename = "1449")]
	pub defaultAlarmsList: Vec<DefaultAlarmInfo>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for GroupSettings {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(968),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserSettingsGroupRoot {
	#[serde(rename = "974")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "975")]
	pub _permissions: GeneratedId,
	#[serde(rename = "976")]
	pub _format: i64,
	#[serde(rename = "977")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "978")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "980")]
	pub timeFormat: i64,
	#[serde(rename = "981")]
	pub startOfTheWeek: i64,
	#[serde(rename = "1234")]
	pub usageDataOptedIn: Option<bool>,
	#[serde(rename = "1403")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1735")]
	pub birthdayCalendarColor: Option<String>,
	#[serde(rename = "979")]
	pub groupSettings: Vec<GroupSettings>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for UserSettingsGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(972),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarDeleteData {
	#[serde(rename = "983")]
	pub _format: i64,
	#[serde(rename = "984")]
	pub groupRootId: GeneratedId,
}

impl Entity for CalendarDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(982),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateGroupPostReturn {
	#[serde(rename = "986")]
	pub _format: i64,
	#[serde(rename = "987")]
	pub group: GeneratedId,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CreateGroupPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(985),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SharedGroupData {
	#[serde(rename = "993")]
	pub _id: Option<CustomId>,
	#[serde(rename = "994")]
	pub capability: i64,
	#[serde(rename = "995")]
	#[serde(with = "serde_bytes")]
	pub sessionEncSharedGroupKey: Vec<u8>,
	#[serde(rename = "996")]
	#[serde(with = "serde_bytes")]
	pub sessionEncSharedGroupName: Vec<u8>,
	#[serde(rename = "997")]
	#[serde(with = "serde_bytes")]
	pub sessionEncInviterName: Vec<u8>,
	#[serde(rename = "998")]
	#[serde(with = "serde_bytes")]
	pub bucketEncInvitationSessionKey: Vec<u8>,
	#[serde(rename = "999")]
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncInviterGroupInfoKey: Vec<u8>,
	#[serde(rename = "1000")]
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncSharedGroupInfoKey: Vec<u8>,
	#[serde(rename = "1001")]
	pub sharedGroup: GeneratedId,
	#[serde(rename = "1420")]
	pub sharedGroupKeyVersion: i64,
}

impl Entity for SharedGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(992),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInvitationPostData {
	#[serde(rename = "1003")]
	pub _format: i64,
	#[serde(rename = "1004")]
	pub sharedGroupData: SharedGroupData,
	#[serde(rename = "1005")]
	pub internalKeyData: Vec<InternalRecipientKeyData>,
}

impl Entity for GroupInvitationPostData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1002),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInvitationPostReturn {
	#[serde(rename = "1007")]
	pub _format: i64,
	#[serde(rename = "1008")]
	pub existingMailAddresses: Vec<MailAddress>,
	#[serde(rename = "1009")]
	pub invalidMailAddresses: Vec<MailAddress>,
	#[serde(rename = "1010")]
	pub invitedMailAddresses: Vec<MailAddress>,
}

impl Entity for GroupInvitationPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1006),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInvitationPutData {
	#[serde(rename = "1012")]
	pub _format: i64,
	#[serde(rename = "1013")]
	#[serde(with = "serde_bytes")]
	pub userGroupEncGroupKey: Vec<u8>,
	#[serde(rename = "1014")]
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncInviteeGroupInfoKey: Vec<u8>,
	#[serde(rename = "1418")]
	pub userGroupKeyVersion: i64,
	#[serde(rename = "1419")]
	pub sharedGroupKeyVersion: i64,
	#[serde(rename = "1015")]
	pub receivedInvitation: IdTupleGenerated,
}

impl Entity for GroupInvitationPutData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1011),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInvitationDeleteData {
	#[serde(rename = "1017")]
	pub _format: i64,
	#[serde(rename = "1018")]
	pub receivedInvitation: IdTupleGenerated,
}

impl Entity for GroupInvitationDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1016),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReportedMailFieldMarker {
	#[serde(rename = "1024")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1025")]
	pub marker: String,
	#[serde(rename = "1026")]
	pub status: i64,
}

impl Entity for ReportedMailFieldMarker {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1023),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PhishingMarkerWebsocketData {
	#[serde(rename = "1035")]
	pub _format: i64,
	#[serde(rename = "1036")]
	pub lastId: GeneratedId,
	#[serde(rename = "1652")]
	pub applicationVersionSum: i64,
	#[serde(rename = "1653")]
	pub applicationTypesHash: String,
	#[serde(rename = "1037")]
	pub markers: Vec<ReportedMailFieldMarker>,
}

impl Entity for PhishingMarkerWebsocketData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1034),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReportMailPostData {
	#[serde(rename = "1067")]
	pub _format: i64,
	#[serde(rename = "1068")]
	#[serde(with = "serde_bytes")]
	pub mailSessionKey: Vec<u8>,
	#[serde(rename = "1082")]
	pub reportType: i64,
	#[serde(rename = "1069")]
	pub mailId: IdTupleGenerated,
}

impl Entity for ReportMailPostData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1066),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventAttendee {
	#[serde(rename = "1085")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1086")]
	pub status: i64,
	#[serde(rename = "1087")]
	pub address: EncryptedMailAddress,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CalendarEventAttendee {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1084),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventUidIndex {
	#[serde(rename = "1095")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "1096")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1097")]
	pub _format: i64,
	#[serde(rename = "1098")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1099")]
	pub progenitor: Option<IdTupleCustom>,
	#[serde(rename = "1321")]
	pub alteredInstances: Vec<IdTupleCustom>,
}

impl Entity for CalendarEventUidIndex {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1093),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventIndexRef {
	#[serde(rename = "1101")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1102")]
	pub list: GeneratedId,
}

impl Entity for CalendarEventIndexRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1100),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventUpdate {
	#[serde(rename = "1106")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1107")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1108")]
	pub _format: i64,
	#[serde(rename = "1109")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1110")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1111")]
	pub sender: String,
	#[serde(rename = "1405")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1112")]
	pub file: IdTupleGenerated,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for CalendarEventUpdate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1104),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventUpdateList {
	#[serde(rename = "1114")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1115")]
	pub list: GeneratedId,
}

impl Entity for CalendarEventUpdateList {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1113),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EntropyData {
	#[serde(rename = "1123")]
	pub _format: i64,
	#[serde(rename = "1124")]
	#[serde(with = "serde_bytes")]
	pub userEncEntropy: Vec<u8>,
	#[serde(rename = "1432")]
	pub userKeyVersion: i64,
}

impl Entity for EntropyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1122),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OutOfOfficeNotificationMessage {
	#[serde(rename = "1127")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1128")]
	pub subject: String,
	#[serde(rename = "1129")]
	pub message: String,
	#[serde(rename = "1130")]
	pub r#type: i64,
}

impl Entity for OutOfOfficeNotificationMessage {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1126),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OutOfOfficeNotification {
	#[serde(rename = "1133")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1134")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1135")]
	pub _format: i64,
	#[serde(rename = "1136")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1137")]
	pub enabled: bool,
	#[serde(rename = "1138")]
	pub startDate: Option<DateTime>,
	#[serde(rename = "1139")]
	pub endDate: Option<DateTime>,
	#[serde(rename = "1140")]
	pub notifications: Vec<OutOfOfficeNotificationMessage>,
}

impl Entity for OutOfOfficeNotification {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1131),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OutOfOfficeNotificationRecipient {
	#[serde(rename = "1143")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "1144")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1145")]
	pub _format: i64,
	#[serde(rename = "1146")]
	pub _ownerGroup: Option<GeneratedId>,
}

impl Entity for OutOfOfficeNotificationRecipient {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1141),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OutOfOfficeNotificationRecipientList {
	#[serde(rename = "1148")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1149")]
	pub list: GeneratedId,
}

impl Entity for OutOfOfficeNotificationRecipientList {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1147),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EmailTemplateContent {
	#[serde(rename = "1155")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1156")]
	pub text: String,
	#[serde(rename = "1157")]
	pub languageCode: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for EmailTemplateContent {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1154),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EmailTemplate {
	#[serde(rename = "1160")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1161")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1162")]
	pub _format: i64,
	#[serde(rename = "1163")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1164")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1165")]
	pub title: String,
	#[serde(rename = "1166")]
	pub tag: String,
	#[serde(rename = "1406")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1167")]
	pub contents: Vec<EmailTemplateContent>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for EmailTemplate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1158),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct KnowledgeBaseEntryKeyword {
	#[serde(rename = "1169")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1170")]
	pub keyword: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for KnowledgeBaseEntryKeyword {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1168),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct KnowledgeBaseEntry {
	#[serde(rename = "1173")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1174")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1175")]
	pub _format: i64,
	#[serde(rename = "1176")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1177")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1178")]
	pub title: String,
	#[serde(rename = "1179")]
	pub description: String,
	#[serde(rename = "1413")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1180")]
	pub keywords: Vec<KnowledgeBaseEntryKeyword>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for KnowledgeBaseEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1171),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TemplateGroupRoot {
	#[serde(rename = "1183")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1184")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1185")]
	pub _format: i64,
	#[serde(rename = "1186")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1187")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1412")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1188")]
	pub templates: GeneratedId,
	#[serde(rename = "1189")]
	pub knowledgeBase: GeneratedId,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for TemplateGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1181),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAreaGroupDeleteData {
	#[serde(rename = "1191")]
	pub _format: i64,
	#[serde(rename = "1192")]
	pub group: GeneratedId,
}

impl Entity for UserAreaGroupDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1190),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailboxProperties {
	#[serde(rename = "1197")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1198")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1199")]
	pub _format: i64,
	#[serde(rename = "1200")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1201")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1202")]
	pub reportMovedMails: i64,
	#[serde(rename = "1411")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1267")]
	pub mailAddressProperties: Vec<MailAddressProperties>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for MailboxProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1195),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SpamResults {
	#[serde(rename = "1218")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1219")]
	pub list: GeneratedId,
}

impl Entity for SpamResults {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1217),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewsId {
	#[serde(rename = "1246")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1247")]
	pub newsItemName: String,
	#[serde(rename = "1248")]
	pub newsItemId: GeneratedId,
}

impl Entity for NewsId {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1245),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewsOut {
	#[serde(rename = "1257")]
	pub _format: i64,
	#[serde(rename = "1258")]
	pub newsItemIds: Vec<NewsId>,
}

impl Entity for NewsOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1256),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewsIn {
	#[serde(rename = "1260")]
	pub _format: i64,
	#[serde(rename = "1261")]
	pub newsItemId: Option<GeneratedId>,
}

impl Entity for NewsIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1259),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressProperties {
	#[serde(rename = "1264")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1265")]
	pub mailAddress: String,
	#[serde(rename = "1266")]
	pub senderName: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for MailAddressProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1263),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Header {
	#[serde(rename = "1270")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1271")]
	pub headers: Option<String>,
	#[serde(rename = "1272")]
	pub compressedHeaders: Option<String>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for Header {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1269),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Body {
	#[serde(rename = "1274")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1275")]
	pub text: Option<String>,
	#[serde(rename = "1276")]
	pub compressedText: Option<String>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for Body {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1273),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Recipients {
	#[serde(rename = "1278")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1279")]
	pub toRecipients: Vec<MailAddress>,
	#[serde(rename = "1280")]
	pub ccRecipients: Vec<MailAddress>,
	#[serde(rename = "1281")]
	pub bccRecipients: Vec<MailAddress>,
}

impl Entity for Recipients {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1277),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailDetails {
	#[serde(rename = "1283")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1284")]
	pub sentDate: DateTime,
	#[serde(rename = "1289")]
	pub authStatus: i64,
	#[serde(rename = "1285")]
	pub replyTos: Vec<EncryptedMailAddress>,
	#[serde(rename = "1286")]
	pub recipients: Recipients,
	#[serde(rename = "1287")]
	pub headers: Option<Header>,
	#[serde(rename = "1288")]
	pub body: Body,
}

impl Entity for MailDetails {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1282),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailDetailsDraft {
	#[serde(rename = "1292")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1293")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1294")]
	pub _format: i64,
	#[serde(rename = "1295")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1296")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1407")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1297")]
	pub details: MailDetails,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for MailDetailsDraft {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1290),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailDetailsBlob {
	#[serde(rename = "1300")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1301")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1302")]
	pub _format: i64,
	#[serde(rename = "1303")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1304")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1408")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1305")]
	pub details: MailDetails,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for MailDetailsBlob {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1298),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UpdateMailFolderData {
	#[serde(rename = "1312")]
	pub _format: i64,
	#[serde(rename = "1313")]
	pub folder: IdTupleGenerated,
	#[serde(rename = "1314")]
	pub newParent: Option<IdTupleGenerated>,
}

impl Entity for UpdateMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1311),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailDetailsDraftsRef {
	#[serde(rename = "1316")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1317")]
	pub list: GeneratedId,
}

impl Entity for MailDetailsDraftsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1315),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactListEntry {
	#[serde(rename = "1327")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1328")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1329")]
	pub _format: i64,
	#[serde(rename = "1330")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1331")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1332")]
	pub emailAddress: String,
	#[serde(rename = "1409")]
	pub _ownerKeyVersion: Option<i64>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactListEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1325),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactListGroupRoot {
	#[serde(rename = "1335")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1336")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1337")]
	pub _format: i64,
	#[serde(rename = "1338")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1339")]
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1410")]
	pub _ownerKeyVersion: Option<i64>,
	#[serde(rename = "1340")]
	pub entries: GeneratedId,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactListGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1333),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SymEncInternalRecipientKeyData {
	#[serde(rename = "1348")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1349")]
	pub mailAddress: String,
	#[serde(rename = "1350")]
	#[serde(with = "serde_bytes")]
	pub symEncBucketKey: Vec<u8>,
	#[serde(rename = "1435")]
	pub symKeyVersion: i64,
	#[serde(rename = "1351")]
	pub keyGroup: GeneratedId,
}

impl Entity for SymEncInternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1347),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactCustomDate {
	#[serde(rename = "1357")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1358")]
	pub r#type: i64,
	#[serde(rename = "1359")]
	pub customTypeName: String,
	#[serde(rename = "1360")]
	pub dateIso: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactCustomDate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1356),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactWebsite {
	#[serde(rename = "1362")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1363")]
	pub r#type: i64,
	#[serde(rename = "1364")]
	pub customTypeName: String,
	#[serde(rename = "1365")]
	pub url: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactWebsite {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1361),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactRelationship {
	#[serde(rename = "1367")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1368")]
	pub r#type: i64,
	#[serde(rename = "1369")]
	pub customTypeName: String,
	#[serde(rename = "1370")]
	pub person: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactRelationship {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1366),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactMessengerHandle {
	#[serde(rename = "1372")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1373")]
	pub r#type: i64,
	#[serde(rename = "1374")]
	pub customTypeName: String,
	#[serde(rename = "1375")]
	pub handle: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactMessengerHandle {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1371),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactPronouns {
	#[serde(rename = "1377")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1378")]
	pub language: String,
	#[serde(rename = "1379")]
	pub pronouns: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ContactPronouns {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1376),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TranslationGetIn {
	#[serde(rename = "1437")]
	pub _format: i64,
	#[serde(rename = "1438")]
	pub lang: String,
}

impl Entity for TranslationGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1436),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TranslationGetOut {
	#[serde(rename = "1440")]
	pub _format: i64,
	#[serde(rename = "1441")]
	pub giftCardSubject: String,
	#[serde(rename = "1442")]
	pub invitationSubject: String,
}

impl Entity for TranslationGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1439),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DefaultAlarmInfo {
	#[serde(rename = "1447")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1448")]
	pub trigger: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for DefaultAlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1446),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailSetEntry {
	#[serde(rename = "1452")]
	pub _id: Option<IdTupleCustom>,
	#[serde(rename = "1453")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1454")]
	pub _format: i64,
	#[serde(rename = "1455")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1456")]
	pub mail: IdTupleGenerated,
}

impl Entity for MailSetEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1450),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailBag {
	#[serde(rename = "1461")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1462")]
	pub mails: GeneratedId,
}

impl Entity for MailBag {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1460),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SimpleMoveMailPostIn {
	#[serde(rename = "1470")]
	pub _format: i64,
	#[serde(rename = "1472")]
	pub destinationSetType: i64,
	#[serde(rename = "1713")]
	pub moveReason: Option<i64>,
	#[serde(rename = "1471")]
	pub mails: Vec<IdTupleGenerated>,
}

impl Entity for SimpleMoveMailPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1469),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UnreadMailStatePostIn {
	#[serde(rename = "1475")]
	pub _format: i64,
	#[serde(rename = "1477")]
	pub unread: bool,
	#[serde(rename = "1476")]
	pub mails: Vec<IdTupleGenerated>,
}

impl Entity for UnreadMailStatePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1474),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ManageLabelServiceLabelData {
	#[serde(rename = "1481")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1482")]
	pub name: String,
	#[serde(rename = "1483")]
	pub color: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ManageLabelServiceLabelData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1480),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ManageLabelServicePostIn {
	#[serde(rename = "1485")]
	pub _format: i64,
	#[serde(rename = "1486")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "1487")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "1488")]
	pub ownerGroup: GeneratedId,
	#[serde(rename = "1489")]
	pub data: ManageLabelServiceLabelData,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ManageLabelServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1484),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ManageLabelServiceDeleteIn {
	#[serde(rename = "1501")]
	pub _format: i64,
	#[serde(rename = "1502")]
	pub label: IdTupleGenerated,
}

impl Entity for ManageLabelServiceDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1500),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ApplyLabelServicePostIn {
	#[serde(rename = "1505")]
	pub _format: i64,
	#[serde(rename = "1506")]
	pub mails: Vec<IdTupleGenerated>,
	#[serde(rename = "1507")]
	pub addedLabels: Vec<IdTupleGenerated>,
	#[serde(rename = "1508")]
	pub removedLabels: Vec<IdTupleGenerated>,
}

impl Entity for ApplyLabelServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1504),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailDataMailReference {
	#[serde(rename = "1514")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1515")]
	pub reference: String,
}

impl Entity for ImportMailDataMailReference {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1513),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewImportAttachment {
	#[serde(rename = "1517")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1518")]
	#[serde(with = "serde_bytes")]
	pub ownerEncFileHashSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1519")]
	#[serde(with = "serde_bytes")]
	pub encFileHash: Option<Vec<u8>>,
	#[serde(rename = "1520")]
	#[serde(with = "serde_bytes")]
	pub encFileName: Vec<u8>,
	#[serde(rename = "1521")]
	#[serde(with = "serde_bytes")]
	pub encMimeType: Vec<u8>,
	#[serde(rename = "1522")]
	#[serde(with = "serde_bytes")]
	pub encCid: Option<Vec<u8>>,
	#[serde(rename = "1523")]
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,
}

impl Entity for NewImportAttachment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1516),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportAttachment {
	#[serde(rename = "1525")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1526")]
	#[serde(with = "serde_bytes")]
	pub ownerEncFileSessionKey: Vec<u8>,
	#[serde(rename = "1527")]
	pub ownerFileKeyVersion: i64,
	#[serde(rename = "1528")]
	pub newAttachment: Option<NewImportAttachment>,
	#[serde(rename = "1529")]
	pub existingAttachmentFile: Option<IdTupleGenerated>,
}

impl Entity for ImportAttachment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1524),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailData {
	#[serde(rename = "1531")]
	pub _format: i64,
	#[serde(rename = "1532")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "1533")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "1534")]
	pub subject: String,
	#[serde(rename = "1535")]
	pub compressedBodyText: String,
	#[serde(rename = "1536")]
	pub date: DateTime,
	#[serde(rename = "1537")]
	pub state: i64,
	#[serde(rename = "1538")]
	pub unread: bool,
	#[serde(rename = "1539")]
	pub messageId: Option<String>,
	#[serde(rename = "1540")]
	pub inReplyTo: Option<String>,
	#[serde(rename = "1541")]
	pub confidential: bool,
	#[serde(rename = "1542")]
	pub method: i64,
	#[serde(rename = "1543")]
	pub replyType: i64,
	#[serde(rename = "1544")]
	pub differentEnvelopeSender: Option<String>,
	#[serde(rename = "1545")]
	pub phishingStatus: i64,
	#[serde(rename = "1546")]
	pub compressedHeaders: String,
	#[serde(rename = "1547")]
	pub references: Vec<ImportMailDataMailReference>,
	#[serde(rename = "1548")]
	pub sender: MailAddress,
	#[serde(rename = "1549")]
	pub replyTos: Vec<EncryptedMailAddress>,
	#[serde(rename = "1550")]
	pub recipients: Recipients,
	#[serde(rename = "1551")]
	pub importedAttachments: Vec<ImportAttachment>,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ImportMailData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1530),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportedMail {
	#[serde(rename = "1554")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1555")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1556")]
	pub _format: i64,
	#[serde(rename = "1557")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1558")]
	pub mailSetEntry: IdTupleCustom,
}

impl Entity for ImportedMail {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1552),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailState {
	#[serde(rename = "1561")]
	pub _id: Option<IdTupleGenerated>,
	#[serde(rename = "1562")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1563")]
	pub _format: i64,
	#[serde(rename = "1564")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1565")]
	pub status: i64,
	#[serde(rename = "1566")]
	pub successfulMails: i64,
	#[serde(rename = "1567")]
	pub failedMails: i64,
	#[serde(rename = "1600")]
	pub totalMails: i64,
	#[serde(rename = "1568")]
	pub importedMails: GeneratedId,
	#[serde(rename = "1569")]
	pub targetFolder: IdTupleGenerated,
}

impl Entity for ImportMailState {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1559),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailPostIn {
	#[serde(rename = "1571")]
	pub _format: i64,
	#[serde(rename = "1577")]
	pub mailState: IdTupleGenerated,
	#[serde(rename = "1578")]
	pub encImports: Vec<super::sys::StringWrapper>,
}

impl Entity for ImportMailPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1570),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailPostOut {
	#[serde(rename = "1580")]
	pub _format: i64,
}

impl Entity for ImportMailPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1579),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailGetIn {
	#[serde(rename = "1583")]
	pub _format: i64,
	#[serde(rename = "1594")]
	pub ownerGroup: GeneratedId,
	#[serde(rename = "1595")]
	pub ownerKeyVersion: i64,
	#[serde(rename = "1596")]
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	#[serde(rename = "1597")]
	pub newImportedMailSetName: String,
	#[serde(rename = "1598")]
	pub totalMails: i64,
	#[serde(rename = "1599")]
	pub targetMailFolder: IdTupleGenerated,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for ImportMailGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1582),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AdvancedRepeatRule {
	#[serde(rename = "1587")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1588")]
	pub ruleType: i64,
	#[serde(rename = "1589")]
	pub interval: String,

	#[serde(default)]
	pub _errors: Errors,
	#[serde(default)]
	pub _finalIvs: HashMap<String, Option<FinalIv>>,
}

impl Entity for AdvancedRepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1586),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailGetOut {
	#[serde(rename = "1592")]
	pub _format: i64,
	#[serde(rename = "1593")]
	pub mailState: IdTupleGenerated,
}

impl Entity for ImportMailGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1591),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailExportTokenServicePostOut {
	#[serde(rename = "1606")]
	pub _format: i64,
	#[serde(rename = "1607")]
	pub mailExportToken: String,
}

impl Entity for MailExportTokenServicePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1605),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SupportTopic {
	#[serde(rename = "1619")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1620")]
	pub lastUpdated: DateTime,
	#[serde(rename = "1621")]
	pub issueEN: String,
	#[serde(rename = "1622")]
	pub issueDE: String,
	#[serde(rename = "1623")]
	pub solutionHtmlEN: String,
	#[serde(rename = "1624")]
	pub solutionHtmlDE: String,
	#[serde(rename = "1625")]
	pub visibility: i64,
	#[serde(rename = "1654")]
	pub contactTemplateHtmlEN: String,
	#[serde(rename = "1655")]
	pub contactTemplateHtmlDE: String,
	#[serde(rename = "1656")]
	pub helpTextEN: String,
	#[serde(rename = "1657")]
	pub helpTextDE: String,
	#[serde(rename = "1658")]
	pub contactSupportTextEN: Option<String>,
	#[serde(rename = "1659")]
	pub contactSupportTextDE: Option<String>,
}

impl Entity for SupportTopic {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1618),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SupportCategory {
	#[serde(rename = "1627")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1628")]
	pub nameEN: String,
	#[serde(rename = "1629")]
	pub nameDE: String,
	#[serde(rename = "1630")]
	pub introductionEN: String,
	#[serde(rename = "1631")]
	pub introductionDE: String,
	#[serde(rename = "1632")]
	pub icon: String,
	#[serde(rename = "1660")]
	pub contactTemplateHtmlEN: String,
	#[serde(rename = "1661")]
	pub contactTemplateHtmlDE: String,
	#[serde(rename = "1662")]
	pub helpTextEN: String,
	#[serde(rename = "1663")]
	pub helpTextDE: String,
	#[serde(rename = "1633")]
	pub topics: Vec<SupportTopic>,
}

impl Entity for SupportCategory {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1626),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SupportData {
	#[serde(rename = "1636")]
	pub _id: Option<GeneratedId>,
	#[serde(rename = "1637")]
	pub _permissions: GeneratedId,
	#[serde(rename = "1638")]
	pub _format: i64,
	#[serde(rename = "1639")]
	pub _ownerGroup: Option<GeneratedId>,
	#[serde(rename = "1640")]
	pub categories: Vec<SupportCategory>,
}

impl Entity for SupportData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1634),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReceiveInfoServicePostOut {
	#[serde(rename = "1642")]
	pub _format: i64,
	#[serde(rename = "1643")]
	pub outdatedVersion: bool,
}

impl Entity for ReceiveInfoServicePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1641),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ResolveConversationsServiceGetIn {
	#[serde(rename = "1646")]
	pub _format: i64,
	#[serde(rename = "1647")]
	pub conversationLists: Vec<super::sys::GeneratedIdWrapper>,
}

impl Entity for ResolveConversationsServiceGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1645),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ResolveConversationsServiceGetOut {
	#[serde(rename = "1649")]
	pub _format: i64,
	#[serde(rename = "1650")]
	pub mailIds: Vec<super::sys::IdTupleWrapper>,
}

impl Entity for ResolveConversationsServiceGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1648),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAccountPostOut {
	#[serde(rename = "1665")]
	pub _format: i64,
	#[serde(rename = "1666")]
	pub userId: GeneratedId,
	#[serde(rename = "1667")]
	pub userGroup: GeneratedId,
}

impl Entity for UserAccountPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1664),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailGroupPostOut {
	#[serde(rename = "1669")]
	pub _format: i64,
	#[serde(rename = "1670")]
	pub mailGroup: GeneratedId,
}

impl Entity for MailGroupPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1668),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ChangePrimaryAddressServicePutIn {
	#[serde(rename = "1672")]
	pub _format: i64,
	#[serde(rename = "1674")]
	pub address: String,
	#[serde(rename = "1673")]
	pub user: GeneratedId,
}

impl Entity for ChangePrimaryAddressServicePutIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1671),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MovedMails {
	#[serde(rename = "1717")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1718")]
	pub targetFolder: IdTupleGenerated,
	#[serde(rename = "1719")]
	pub sourceFolder: IdTupleGenerated,
	#[serde(rename = "1720")]
	pub mailIds: Vec<super::sys::IdTupleWrapper>,
}

impl Entity for MovedMails {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1716),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MoveMailPostOut {
	#[serde(rename = "1722")]
	pub _format: i64,
	#[serde(rename = "1723")]
	pub movedMails: Vec<MovedMails>,
}

impl Entity for MoveMailPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1721),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ClientSpamClassifierResult {
	#[serde(rename = "1725")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1726")]
	pub spamDecision: i64,
	#[serde(rename = "1727")]
	pub confidence: i64,
}

impl Entity for ClientSpamClassifierResult {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1724),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ClientClassifierResultPostIn {
	#[serde(rename = "1731")]
	pub _format: i64,
	#[serde(rename = "1733")]
	pub isPredictionMade: bool,
	#[serde(rename = "1732")]
	pub mails: Vec<IdTupleGenerated>,
}

impl Entity for ClientClassifierResultPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1730),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SendDraftDeleteIn {
	#[serde(rename = "1738")]
	pub _format: i64,
	#[serde(rename = "1739")]
	pub mail: IdTupleGenerated,
}

impl Entity for SendDraftDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1737),
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SendDraftParameters {
	#[serde(rename = "1741")]
	pub _id: Option<CustomId>,
	#[serde(rename = "1743")]
	pub language: String,
	#[serde(rename = "1744")]
	#[serde(with = "serde_bytes")]
	pub mailSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1745")]
	#[serde(with = "serde_bytes")]
	pub bucketEncMailSessionKey: Option<Vec<u8>>,
	#[serde(rename = "1746")]
	pub senderNameUnencrypted: Option<String>,
	#[serde(rename = "1747")]
	pub plaintext: bool,
	#[serde(rename = "1748")]
	pub calendarMethod: bool,
	#[serde(rename = "1753")]
	#[serde(with = "serde_bytes")]
	pub sessionEncEncryptionAuthStatus: Option<Vec<u8>>,
	#[serde(rename = "1742")]
	pub mail: IdTupleGenerated,
	#[serde(rename = "1749")]
	pub internalRecipientKeyData: Vec<InternalRecipientKeyData>,
	#[serde(rename = "1750")]
	pub secureExternalRecipientKeyData: Vec<SecureExternalRecipientKeyData>,
	#[serde(rename = "1751")]
	pub symEncInternalRecipientKeyData: Vec<SymEncInternalRecipientKeyData>,
	#[serde(rename = "1752")]
	pub attachmentKeyData: Vec<AttachmentKeyData>,
}

impl Entity for SendDraftParameters {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: AppName::Tutanota,
			type_id: TypeId::from(1740),
		}
	}
}
