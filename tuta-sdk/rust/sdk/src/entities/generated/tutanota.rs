// @generated
#![allow(non_snake_case, unused_imports)]
use super::super::*;
use crate::*;
use serde::{Deserialize, Serialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Subfiles {
	pub _id: Option<CustomId>,
	pub files: GeneratedId,
}

impl Entity for Subfiles {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 11,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TutanotaFile {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub cid: Option<String>,
	pub mimeType: Option<String>,
	pub name: String,
	pub size: i64,
	pub blobs: Vec<super::sys::Blob>,
	pub parent: Option<IdTupleGenerated>,
	pub subFiles: Option<Subfiles>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for TutanotaFile {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 13,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct FileSystem {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub files: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for FileSystem {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 28,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactMailAddress {
	pub _id: Option<CustomId>,
	pub address: String,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactMailAddress {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 44,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactPhoneNumber {
	pub _id: Option<CustomId>,
	pub customTypeName: String,
	pub number: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactPhoneNumber {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 49,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactAddress {
	pub _id: Option<CustomId>,
	pub address: String,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactAddress {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 54,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactSocialId {
	pub _id: Option<CustomId>,
	pub customTypeName: String,
	pub socialId: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactSocialId {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 59,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Contact {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub birthdayIso: Option<String>,
	pub comment: String,
	pub company: String,
	pub department: Option<String>,
	pub firstName: String,
	pub lastName: String,
	pub middleName: Option<String>,
	pub nameSuffix: Option<String>,
	pub nickname: Option<String>,
	pub oldBirthdayDate: Option<DateTime>,
	pub phoneticFirst: Option<String>,
	pub phoneticLast: Option<String>,
	pub phoneticMiddle: Option<String>,
	pub presharedPassword: Option<String>,
	pub role: String,
	pub title: Option<String>,
	pub addresses: Vec<ContactAddress>,
	pub customDate: Vec<ContactCustomDate>,
	pub mailAddresses: Vec<ContactMailAddress>,
	pub messengerHandles: Vec<ContactMessengerHandle>,
	pub oldBirthdayAggregate: Option<Birthday>,
	pub phoneNumbers: Vec<ContactPhoneNumber>,
	pub photo: Option<IdTupleGenerated>,
	pub pronouns: Vec<ContactPronouns>,
	pub relationships: Vec<ContactRelationship>,
	pub socialIds: Vec<ContactSocialId>,
	pub websites: Vec<ContactWebsite>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for Contact {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 64,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ConversationEntry {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub conversationType: i64,
	pub messageId: String,
	pub mail: Option<IdTupleGenerated>,
	pub previous: Option<IdTupleGenerated>,
}

impl Entity for ConversationEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 84,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddress {
	pub _id: Option<CustomId>,
	pub address: String,
	pub name: String,
	pub contact: Option<IdTupleGenerated>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for MailAddress {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 92,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Mail {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub authStatus: Option<i64>,
	pub confidential: bool,
	pub differentEnvelopeSender: Option<String>,
	pub encryptionAuthStatus: Option<i64>,
	pub listUnsubscribe: bool,
	pub method: i64,
	pub movedTime: Option<DateTime>,
	pub phishingStatus: i64,
	pub receivedDate: DateTime,
	pub recipientCount: i64,
	pub replyType: i64,
	pub state: i64,
	pub subject: String,
	pub unread: bool,
	pub attachments: Vec<IdTupleGenerated>,
	pub bucketKey: Option<super::sys::BucketKey>,
	pub conversationEntry: IdTupleGenerated,
	pub firstRecipient: Option<MailAddress>,
	pub mailDetails: Option<IdTupleGenerated>,
	pub mailDetailsDraft: Option<IdTupleGenerated>,
	pub sender: MailAddress,
	pub sets: Vec<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for Mail {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 97,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailBox {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub lastInfoDate: DateTime,
	pub archivedMailBags: Vec<MailBag>,
	pub currentMailBag: Option<MailBag>,
	pub folders: Option<MailFolderRef>,
	pub importedAttachments: GeneratedId,
	pub mailDetailsDrafts: Option<MailDetailsDraftsRef>,
	pub mailImportStates: GeneratedId,
	pub receivedAttachments: GeneratedId,
	pub sentAttachments: GeneratedId,
	pub spamResults: Option<SpamResults>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for MailBox {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 125,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateExternalUserGroupData {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub externalPwEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub internalUserEncUserGroupKey: Vec<u8>,
	pub internalUserGroupKeyVersion: i64,
	pub mailAddress: String,
}

impl Entity for CreateExternalUserGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 138,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ExternalUserData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub externalMailEncMailBoxSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub externalMailEncMailGroupInfoSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub externalUserEncEntropy: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub externalUserEncMailGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub externalUserEncTutanotaPropertiesSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub externalUserEncUserGroupInfoSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub internalMailEncMailGroupInfoSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub internalMailEncUserGroupInfoSessionKey: Vec<u8>,
	pub internalMailGroupKeyVersion: i64,
	pub kdfVersion: i64,
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
	pub userGroupData: CreateExternalUserGroupData,
}

impl Entity for ExternalUserData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 145,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactList {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub contacts: GeneratedId,
	pub photos: Option<PhotosRef>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactList {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 153,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct RemoteImapSyncInfo {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub seen: bool,
	pub message: IdTupleGenerated,
}

impl Entity for RemoteImapSyncInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 183,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImapFolder {
	pub _id: Option<CustomId>,
	pub lastseenuid: String,
	pub name: String,
	pub uidvalidity: String,
	pub syncInfo: GeneratedId,
}

impl Entity for ImapFolder {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 190,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImapSyncState {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub folders: Vec<ImapFolder>,
}

impl Entity for ImapSyncState {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 196,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImapSyncConfiguration {
	pub _id: Option<CustomId>,
	pub host: String,
	pub password: String,
	pub port: i64,
	pub user: String,
	pub imapSyncState: Option<GeneratedId>,
}

impl Entity for ImapSyncConfiguration {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 209,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TutanotaProperties {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub customEmailSignature: String,
	pub defaultLabelCreated: bool,
	pub defaultSender: Option<String>,
	pub defaultUnconfidential: bool,
	pub emailSignatureType: i64,
	pub lastSeenAnnouncement: i64,
	pub noAutomaticContacts: bool,
	pub notificationMailLanguage: Option<String>,
	pub sendPlaintextOnly: bool,
	#[serde(with = "serde_bytes")]
	pub userEncEntropy: Option<Vec<u8>>,
	pub userKeyVersion: Option<i64>,
	pub imapSyncConfig: Vec<ImapSyncConfiguration>,
	pub inboxRules: Vec<InboxRule>,
	pub lastPushedMail: Option<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for TutanotaProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 216,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NotificationMail {
	pub _id: Option<CustomId>,
	pub bodyText: String,
	pub mailboxLink: String,
	pub recipientMailAddress: String,
	pub recipientName: String,
	pub subject: String,
}

impl Entity for NotificationMail {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 223,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DeleteMailData {
	pub _format: i64,
	pub folder: Option<IdTupleGenerated>,
	pub mails: Vec<IdTupleGenerated>,
}

impl Entity for DeleteMailData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 419,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailFolder {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub color: Option<String>,
	pub folderType: i64,
	pub name: String,
	pub entries: GeneratedId,
	pub parentFolder: Option<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for MailFolder {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 429,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailFolderRef {
	pub _id: Option<CustomId>,
	pub folders: GeneratedId,
}

impl Entity for MailFolderRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 440,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MoveMailData {
	pub _format: i64,
	pub excludeMailSet: Option<IdTupleGenerated>,
	pub mails: Vec<IdTupleGenerated>,
	pub targetFolder: IdTupleGenerated,
}

impl Entity for MoveMailData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 445,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateMailFolderData {
	pub _format: i64,
	pub folderName: String,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerGroup: Option<GeneratedId>,
	pub ownerKeyVersion: i64,
	pub parentFolder: Option<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CreateMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 450,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateMailFolderReturn {
	pub _format: i64,
	pub newFolder: IdTupleGenerated,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CreateMailFolderReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 455,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DeleteMailFolderData {
	pub _format: i64,
	pub folders: Vec<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for DeleteMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 458,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EncryptTutanotaPropertiesData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub symEncSessionKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub properties: GeneratedId,
}

impl Entity for EncryptTutanotaPropertiesData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 473,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftRecipient {
	pub _id: Option<CustomId>,
	pub mailAddress: String,
	pub name: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for DraftRecipient {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 482,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewDraftAttachment {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub encCid: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub encFileName: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub encMimeType: Vec<u8>,
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,
}

impl Entity for NewDraftAttachment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 486,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftAttachment {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub ownerEncFileSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub existingFile: Option<IdTupleGenerated>,
	pub newFile: Option<NewDraftAttachment>,
}

impl Entity for DraftAttachment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 491,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftData {
	pub _id: Option<CustomId>,
	pub bodyText: String,
	pub compressedBodyText: Option<String>,
	pub confidential: bool,
	pub method: i64,
	pub senderMailAddress: String,
	pub senderName: String,
	pub subject: String,
	pub addedAttachments: Vec<DraftAttachment>,
	pub bccRecipients: Vec<DraftRecipient>,
	pub ccRecipients: Vec<DraftRecipient>,
	pub removedAttachments: Vec<IdTupleGenerated>,
	pub replyTos: Vec<EncryptedMailAddress>,
	pub toRecipients: Vec<DraftRecipient>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for DraftData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 496,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftCreateData {
	pub _format: i64,
	pub conversationType: i64,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub previousMessageId: Option<String>,
	pub draftData: DraftData,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for DraftCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 508,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftCreateReturn {
	pub _format: i64,
	pub draft: IdTupleGenerated,
}

impl Entity for DraftCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 516,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftUpdateData {
	pub _format: i64,
	pub draft: IdTupleGenerated,
	pub draftData: DraftData,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for DraftUpdateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 519,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DraftUpdateReturn {
	pub _format: i64,
	pub attachments: Vec<IdTupleGenerated>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for DraftUpdateReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 523,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InternalRecipientKeyData {
	pub _id: Option<CustomId>,
	pub mailAddress: String,
	pub protocolVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Vec<u8>,
	pub recipientKeyVersion: i64,
	pub senderKeyVersion: Option<i64>,
}

impl Entity for InternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 527,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SecureExternalRecipientKeyData {
	pub _id: Option<CustomId>,
	pub kdfVersion: i64,
	pub mailAddress: String,
	#[serde(with = "serde_bytes")]
	pub ownerEncBucketKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub passwordVerifier: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub pwEncCommunicationKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub salt: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub saltHash: Option<Vec<u8>>,
	pub userGroupKeyVersion: i64,
}

impl Entity for SecureExternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 532,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AttachmentKeyData {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub bucketEncFileSessionKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub fileSessionKey: Option<Vec<u8>>,
	pub file: IdTupleGenerated,
}

impl Entity for AttachmentKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 542,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SendDraftData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub bucketEncMailSessionKey: Option<Vec<u8>>,
	pub calendarMethod: bool,
	pub language: String,
	#[serde(with = "serde_bytes")]
	pub mailSessionKey: Option<Vec<u8>>,
	pub plaintext: bool,
	pub senderNameUnencrypted: Option<String>,
	#[serde(with = "serde_bytes")]
	pub sessionEncEncryptionAuthStatus: Option<Vec<u8>>,
	pub attachmentKeyData: Vec<AttachmentKeyData>,
	pub internalRecipientKeyData: Vec<InternalRecipientKeyData>,
	pub mail: IdTupleGenerated,
	pub secureExternalRecipientKeyData: Vec<SecureExternalRecipientKeyData>,
	pub symEncInternalRecipientKeyData: Vec<SymEncInternalRecipientKeyData>,
}

impl Entity for SendDraftData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 547,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SendDraftReturn {
	pub _format: i64,
	pub messageId: String,
	pub sentDate: DateTime,
	pub notifications: Vec<NotificationMail>,
	pub sentMail: IdTupleGenerated,
}

impl Entity for SendDraftReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 557,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReceiveInfoServiceData {
	pub _format: i64,
	pub language: String,
}

impl Entity for ReceiveInfoServiceData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 570,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InboxRule {
	pub _id: Option<CustomId>,
	#[serde(rename = "type")]
	pub r#type: String,
	pub value: String,
	pub targetFolder: IdTupleGenerated,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for InboxRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 573,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EncryptedMailAddress {
	pub _id: Option<CustomId>,
	pub address: String,
	pub name: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for EncryptedMailAddress {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 612,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAccountUserData {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub contactEncContactListSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub customerEncContactGroupInfoSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub customerEncFileGroupInfoSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub customerEncMailGroupInfoSessionKey: Vec<u8>,
	pub customerKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub encryptedName: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub fileEncFileSystemSessionKey: Vec<u8>,
	pub kdfVersion: i64,
	pub mailAddress: String,
	#[serde(with = "serde_bytes")]
	pub mailEncMailBoxSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub pwEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub recoverCodeEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub recoverCodeVerifier: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub salt: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncContactGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncCustomerGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncEntropy: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncFileGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncMailGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncRecoverCode: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncTutanotaPropertiesSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub verifier: Vec<u8>,
}

impl Entity for UserAccountUserData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 622,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct InternalGroupData {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub adminEncGroupKey: Vec<u8>,
	pub adminKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub groupEncPrivEccKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub groupEncPrivKyberKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub groupEncPrivRsaKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub ownerEncGroupInfoSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubEccKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub pubKyberKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub pubRsaKey: Option<Vec<u8>>,
	pub adminGroup: Option<GeneratedId>,
}

impl Entity for InternalGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 642,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CustomerAccountCreateData {
	pub _format: i64,
	pub accountGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub adminEncAccountingInfoSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub adminEncCustomerServerPropertiesSessionKey: Vec<u8>,
	pub app: i64,
	pub authToken: String,
	pub code: String,
	pub date: Option<DateTime>,
	pub lang: String,
	#[serde(with = "serde_bytes")]
	pub systemAdminPubEncAccountingInfoSessionKey: Vec<u8>,
	pub systemAdminPubKeyVersion: i64,
	pub systemAdminPublicProtocolVersion: i64,
	#[serde(with = "serde_bytes")]
	pub userEncAccountGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncAdminGroupKey: Vec<u8>,
	pub adminGroupData: InternalGroupData,
	pub customerGroupData: InternalGroupData,
	pub userData: UserAccountUserData,
	pub userGroupData: InternalGroupData,
}

impl Entity for CustomerAccountCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 648,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAccountCreateData {
	pub _format: i64,
	pub date: Option<DateTime>,
	pub userData: UserAccountUserData,
	pub userGroupData: InternalGroupData,
}

impl Entity for UserAccountCreateData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 663,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailboxServerProperties {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub whitelistProtectionEnabled: bool,
}

impl Entity for MailboxServerProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 677,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailboxGroupRoot {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub calendarEventUpdates: Option<CalendarEventUpdateList>,
	pub mailbox: GeneratedId,
	pub mailboxProperties: Option<GeneratedId>,
	pub outOfOfficeNotification: Option<GeneratedId>,
	pub outOfOfficeNotificationRecipientList: Option<OutOfOfficeNotificationRecipientList>,
	pub serverProperties: GeneratedId,
}

impl Entity for MailboxGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 693,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateMailGroupData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub encryptedName: Vec<u8>,
	pub mailAddress: String,
	#[serde(with = "serde_bytes")]
	pub mailEncMailboxSessionKey: Vec<u8>,
	pub groupData: InternalGroupData,
}

impl Entity for CreateMailGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 707,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DeleteGroupData {
	pub _format: i64,
	pub restore: bool,
	pub group: GeneratedId,
}

impl Entity for DeleteGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 713,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Birthday {
	pub _id: Option<CustomId>,
	pub day: i64,
	pub month: i64,
	pub year: Option<i64>,
}

impl Entity for Birthday {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 844,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PhotosRef {
	pub _id: Option<CustomId>,
	pub files: GeneratedId,
}

impl Entity for PhotosRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 853,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ListUnsubscribeData {
	pub _format: i64,
	pub headers: String,
	pub recipient: String,
	pub mail: IdTupleGenerated,
}

impl Entity for ListUnsubscribeData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 867,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarRepeatRule {
	pub _id: Option<CustomId>,
	pub endType: i64,
	pub endValue: Option<i64>,
	pub frequency: i64,
	pub interval: i64,
	pub timeZone: String,
	pub advancedRules: Vec<AdvancedRepeatRule>,
	pub excludedDates: Vec<super::sys::DateWrapper>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CalendarRepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 926,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEvent {
	pub _format: i64,
	pub _id: Option<IdTupleCustom>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub description: String,
	pub endTime: DateTime,
	#[serde(with = "serde_bytes")]
	pub hashedUid: Option<Vec<u8>>,
	pub invitedConfidentially: Option<bool>,
	pub location: String,
	pub recurrenceId: Option<DateTime>,
	pub sequence: i64,
	pub startTime: DateTime,
	pub summary: String,
	pub uid: Option<String>,
	pub alarmInfos: Vec<IdTupleGenerated>,
	pub attendees: Vec<CalendarEventAttendee>,
	pub organizer: Option<EncryptedMailAddress>,
	pub repeatRule: Option<CalendarRepeatRule>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CalendarEvent {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 933,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarGroupRoot {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub index: Option<CalendarEventIndexRef>,
	pub longEvents: GeneratedId,
	pub shortEvents: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CalendarGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 947,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAreaGroupData {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub adminEncGroupKey: Option<Vec<u8>>,
	pub adminKeyVersion: Option<i64>,
	#[serde(with = "serde_bytes")]
	pub customerEncGroupInfoSessionKey: Vec<u8>,
	pub customerKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub groupEncGroupRootSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub groupInfoEncName: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub userEncGroupKey: Vec<u8>,
	pub userKeyVersion: i64,
	pub adminGroup: Option<GeneratedId>,
}

impl Entity for UserAreaGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 956,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAreaGroupPostData {
	pub _format: i64,
	pub groupData: UserAreaGroupData,
}

impl Entity for UserAreaGroupPostData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 964,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupSettings {
	pub _id: Option<CustomId>,
	pub color: String,
	pub name: Option<String>,
	pub sourceUrl: Option<String>,
	pub defaultAlarmsList: Vec<DefaultAlarmInfo>,
	pub group: GeneratedId,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for GroupSettings {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 968,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserSettingsGroupRoot {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub startOfTheWeek: i64,
	pub timeFormat: i64,
	pub usageDataOptedIn: Option<bool>,
	pub groupSettings: Vec<GroupSettings>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for UserSettingsGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 972,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarDeleteData {
	pub _format: i64,
	pub groupRootId: GeneratedId,
}

impl Entity for CalendarDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 982,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CreateGroupPostReturn {
	pub _format: i64,
	pub group: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CreateGroupPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 985,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SharedGroupData {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub bucketEncInvitationSessionKey: Vec<u8>,
	pub capability: i64,
	#[serde(with = "serde_bytes")]
	pub sessionEncInviterName: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub sessionEncSharedGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub sessionEncSharedGroupName: Vec<u8>,
	pub sharedGroup: GeneratedId,
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncInviterGroupInfoKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncSharedGroupInfoKey: Vec<u8>,
	pub sharedGroupKeyVersion: i64,
}

impl Entity for SharedGroupData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 992,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInvitationPostData {
	pub _format: i64,
	pub internalKeyData: Vec<InternalRecipientKeyData>,
	pub sharedGroupData: SharedGroupData,
}

impl Entity for GroupInvitationPostData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1002,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInvitationPostReturn {
	pub _format: i64,
	pub existingMailAddresses: Vec<MailAddress>,
	pub invalidMailAddresses: Vec<MailAddress>,
	pub invitedMailAddresses: Vec<MailAddress>,
}

impl Entity for GroupInvitationPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1006,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInvitationPutData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncInviteeGroupInfoKey: Vec<u8>,
	pub sharedGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub userGroupEncGroupKey: Vec<u8>,
	pub userGroupKeyVersion: i64,
	pub receivedInvitation: IdTupleGenerated,
}

impl Entity for GroupInvitationPutData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1011,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct GroupInvitationDeleteData {
	pub _format: i64,
	pub receivedInvitation: IdTupleGenerated,
}

impl Entity for GroupInvitationDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1016,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReportedMailFieldMarker {
	pub _id: Option<CustomId>,
	pub marker: String,
	pub status: i64,
}

impl Entity for ReportedMailFieldMarker {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1023,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct PhishingMarkerWebsocketData {
	pub _format: i64,
	pub lastId: GeneratedId,
	pub markers: Vec<ReportedMailFieldMarker>,
}

impl Entity for PhishingMarkerWebsocketData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1034,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReportMailPostData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub mailSessionKey: Vec<u8>,
	pub reportType: i64,
	pub mailId: IdTupleGenerated,
}

impl Entity for ReportMailPostData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1066,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventAttendee {
	pub _id: Option<CustomId>,
	pub status: i64,
	pub address: EncryptedMailAddress,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CalendarEventAttendee {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1084,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventUidIndex {
	pub _format: i64,
	pub _id: Option<IdTupleCustom>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub alteredInstances: Vec<IdTupleCustom>,
	pub progenitor: Option<IdTupleCustom>,
}

impl Entity for CalendarEventUidIndex {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1093,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventIndexRef {
	pub _id: Option<CustomId>,
	pub list: GeneratedId,
}

impl Entity for CalendarEventIndexRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1100,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventUpdate {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub sender: String,
	pub file: IdTupleGenerated,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for CalendarEventUpdate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1104,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct CalendarEventUpdateList {
	pub _id: Option<CustomId>,
	pub list: GeneratedId,
}

impl Entity for CalendarEventUpdateList {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1113,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EntropyData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub userEncEntropy: Vec<u8>,
	pub userKeyVersion: i64,
}

impl Entity for EntropyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1122,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OutOfOfficeNotificationMessage {
	pub _id: Option<CustomId>,
	pub message: String,
	pub subject: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for OutOfOfficeNotificationMessage {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1126,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OutOfOfficeNotification {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub enabled: bool,
	pub endDate: Option<DateTime>,
	pub startDate: Option<DateTime>,
	pub notifications: Vec<OutOfOfficeNotificationMessage>,
}

impl Entity for OutOfOfficeNotification {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1131,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct OutOfOfficeNotificationRecipientList {
	pub _id: Option<CustomId>,
	pub list: GeneratedId,
}

impl Entity for OutOfOfficeNotificationRecipientList {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1147,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EmailTemplateContent {
	pub _id: Option<CustomId>,
	pub languageCode: String,
	pub text: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for EmailTemplateContent {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1154,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct EmailTemplate {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub tag: String,
	pub title: String,
	pub contents: Vec<EmailTemplateContent>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for EmailTemplate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1158,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct KnowledgeBaseEntryKeyword {
	pub _id: Option<CustomId>,
	pub keyword: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for KnowledgeBaseEntryKeyword {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1168,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct KnowledgeBaseEntry {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub description: String,
	pub title: String,
	pub keywords: Vec<KnowledgeBaseEntryKeyword>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for KnowledgeBaseEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1171,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TemplateGroupRoot {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub knowledgeBase: GeneratedId,
	pub templates: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for TemplateGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1181,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UserAreaGroupDeleteData {
	pub _format: i64,
	pub group: GeneratedId,
}

impl Entity for UserAreaGroupDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1190,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailboxProperties {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub reportMovedMails: i64,
	pub mailAddressProperties: Vec<MailAddressProperties>,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for MailboxProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1195,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SpamResults {
	pub _id: Option<CustomId>,
	pub list: GeneratedId,
}

impl Entity for SpamResults {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1217,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewsId {
	pub _id: Option<CustomId>,
	pub newsItemId: GeneratedId,
	pub newsItemName: String,
}

impl Entity for NewsId {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1245,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewsOut {
	pub _format: i64,
	pub newsItemIds: Vec<NewsId>,
}

impl Entity for NewsOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1256,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewsIn {
	pub _format: i64,
	pub newsItemId: Option<GeneratedId>,
}

impl Entity for NewsIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1259,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailAddressProperties {
	pub _id: Option<CustomId>,
	pub mailAddress: String,
	pub senderName: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for MailAddressProperties {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1263,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Header {
	pub _id: Option<CustomId>,
	pub compressedHeaders: Option<String>,
	pub headers: Option<String>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for Header {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1269,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Body {
	pub _id: Option<CustomId>,
	pub compressedText: Option<String>,
	pub text: Option<String>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for Body {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1273,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct Recipients {
	pub _id: Option<CustomId>,
	pub bccRecipients: Vec<MailAddress>,
	pub ccRecipients: Vec<MailAddress>,
	pub toRecipients: Vec<MailAddress>,
}

impl Entity for Recipients {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1277,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailDetails {
	pub _id: Option<CustomId>,
	pub authStatus: i64,
	pub sentDate: DateTime,
	pub body: Body,
	pub headers: Option<Header>,
	pub recipients: Recipients,
	pub replyTos: Vec<EncryptedMailAddress>,
}

impl Entity for MailDetails {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1282,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailDetailsDraft {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub details: MailDetails,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for MailDetailsDraft {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1290,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailDetailsBlob {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub details: MailDetails,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for MailDetailsBlob {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1298,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UpdateMailFolderData {
	pub _format: i64,
	pub folder: IdTupleGenerated,
	pub newParent: Option<IdTupleGenerated>,
}

impl Entity for UpdateMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1311,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailDetailsDraftsRef {
	pub _id: Option<CustomId>,
	pub list: GeneratedId,
}

impl Entity for MailDetailsDraftsRef {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1315,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactListEntry {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub emailAddress: String,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactListEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1325,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactListGroupRoot {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: GeneratedId,
	pub entries: GeneratedId,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactListGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1333,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SymEncInternalRecipientKeyData {
	pub _id: Option<CustomId>,
	pub mailAddress: String,
	#[serde(with = "serde_bytes")]
	pub symEncBucketKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub keyGroup: GeneratedId,
}

impl Entity for SymEncInternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1347,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactCustomDate {
	pub _id: Option<CustomId>,
	pub customTypeName: String,
	pub dateIso: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactCustomDate {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1356,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactWebsite {
	pub _id: Option<CustomId>,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub url: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactWebsite {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1361,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactRelationship {
	pub _id: Option<CustomId>,
	pub customTypeName: String,
	pub person: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactRelationship {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1366,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactMessengerHandle {
	pub _id: Option<CustomId>,
	pub customTypeName: String,
	pub handle: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactMessengerHandle {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1371,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ContactPronouns {
	pub _id: Option<CustomId>,
	pub language: String,
	pub pronouns: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ContactPronouns {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1376,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TranslationGetIn {
	pub _format: i64,
	pub lang: String,
}

impl Entity for TranslationGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1436,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct TranslationGetOut {
	pub _format: i64,
	pub giftCardSubject: String,
	pub invitationSubject: String,
}

impl Entity for TranslationGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1439,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct DefaultAlarmInfo {
	pub _id: Option<CustomId>,
	pub trigger: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for DefaultAlarmInfo {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1446,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailSetEntry {
	pub _format: i64,
	pub _id: Option<IdTupleCustom>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub mail: IdTupleGenerated,
}

impl Entity for MailSetEntry {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1450,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailBag {
	pub _id: Option<CustomId>,
	pub mails: GeneratedId,
}

impl Entity for MailBag {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1460,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SimpleMoveMailPostIn {
	pub _format: i64,
	pub destinationSetType: i64,
	pub mails: Vec<IdTupleGenerated>,
}

impl Entity for SimpleMoveMailPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1469,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct UnreadMailStatePostIn {
	pub _format: i64,
	pub unread: bool,
	pub mails: Vec<IdTupleGenerated>,
}

impl Entity for UnreadMailStatePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1474,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ManageLabelServiceLabelData {
	pub _id: Option<CustomId>,
	pub color: String,
	pub name: String,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ManageLabelServiceLabelData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1480,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ManageLabelServicePostIn {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerGroup: GeneratedId,
	pub ownerKeyVersion: i64,
	pub data: ManageLabelServiceLabelData,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ManageLabelServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1484,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ManageLabelServiceDeleteIn {
	pub _format: i64,
	pub label: IdTupleGenerated,
}

impl Entity for ManageLabelServiceDeleteIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1500,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ApplyLabelServicePostIn {
	pub _format: i64,
	pub addedLabels: Vec<IdTupleGenerated>,
	pub mails: Vec<IdTupleGenerated>,
	pub removedLabels: Vec<IdTupleGenerated>,
}

impl Entity for ApplyLabelServicePostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1504,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailDataMailReference {
	pub _id: Option<CustomId>,
	pub reference: String,
}

impl Entity for ImportMailDataMailReference {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1513,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct NewImportAttachment {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub encCid: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub encFileHash: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub encFileName: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub encMimeType: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub ownerEncFileHashSessionKey: Option<Vec<u8>>,
	pub referenceTokens: Vec<super::sys::BlobReferenceTokenWrapper>,
}

impl Entity for NewImportAttachment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1516,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportAttachment {
	pub _id: Option<CustomId>,
	#[serde(with = "serde_bytes")]
	pub ownerEncFileSessionKey: Vec<u8>,
	pub ownerFileKeyVersion: i64,
	pub existingAttachmentFile: Option<IdTupleGenerated>,
	pub newAttachment: Option<NewImportAttachment>,
}

impl Entity for ImportAttachment {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1524,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailData {
	pub _format: i64,
	pub compressedBodyText: String,
	pub compressedHeaders: String,
	pub confidential: bool,
	pub date: DateTime,
	pub differentEnvelopeSender: Option<String>,
	pub inReplyTo: Option<String>,
	pub messageId: Option<String>,
	pub method: i64,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub phishingStatus: i64,
	pub replyType: i64,
	pub state: i64,
	pub subject: String,
	pub unread: bool,
	pub importedAttachments: Vec<ImportAttachment>,
	pub recipients: Recipients,
	pub references: Vec<ImportMailDataMailReference>,
	pub replyTos: Vec<EncryptedMailAddress>,
	pub sender: MailAddress,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ImportMailData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1530,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportedMail {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub mailSetEntry: IdTupleCustom,
}

impl Entity for ImportedMail {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1552,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailState {
	pub _format: i64,
	pub _id: Option<IdTupleGenerated>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub failedMails: i64,
	pub status: i64,
	pub successfulMails: i64,
	pub totalMails: i64,
	pub importedMails: GeneratedId,
	pub targetFolder: IdTupleGenerated,
}

impl Entity for ImportMailState {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1559,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailPostIn {
	pub _format: i64,
	pub encImports: Vec<super::sys::StringWrapper>,
	pub mailState: IdTupleGenerated,
}

impl Entity for ImportMailPostIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1570,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailPostOut {
	pub _format: i64,
}

impl Entity for ImportMailPostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1579,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailGetIn {
	pub _format: i64,
	pub newImportedMailSetName: String,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerGroup: GeneratedId,
	pub ownerKeyVersion: i64,
	pub totalMails: i64,
	pub targetMailFolder: IdTupleGenerated,
	pub _errors: Option<Errors>,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for ImportMailGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1582,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct AdvancedRepeatRule {
	pub _id: Option<CustomId>,
	pub interval: String,
	pub ruleType: i64,
	pub _finalIvs: HashMap<String, FinalIv>,
}

impl Entity for AdvancedRepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1586,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ImportMailGetOut {
	pub _format: i64,
	pub mailState: IdTupleGenerated,
}

impl Entity for ImportMailGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1591,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct MailExportTokenServicePostOut {
	pub _format: i64,
	pub mailExportToken: String,
}

impl Entity for MailExportTokenServicePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1605,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SupportTopic {
	pub _id: Option<CustomId>,
	pub issueDE: String,
	pub issueEN: String,
	pub lastUpdated: DateTime,
	pub solutionHtmlDE: String,
	pub solutionHtmlEN: String,
	pub visibility: i64,
}

impl Entity for SupportTopic {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1618,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SupportCategory {
	pub _id: Option<CustomId>,
	pub icon: String,
	pub introductionDE: String,
	pub introductionEN: String,
	pub nameDE: String,
	pub nameEN: String,
	pub topics: Vec<SupportTopic>,
}

impl Entity for SupportCategory {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1626,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct SupportData {
	pub _format: i64,
	pub _id: Option<GeneratedId>,
	pub _ownerGroup: Option<GeneratedId>,
	pub _permissions: GeneratedId,
	pub categories: Vec<SupportCategory>,
}

impl Entity for SupportData {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1634,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ReceiveInfoServicePostOut {
	pub _format: i64,
	pub outdatedVersion: bool,
}

impl Entity for ReceiveInfoServicePostOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1641,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ResolveConversationsServiceGetIn {
	pub _format: i64,
	pub conversationLists: Vec<super::sys::GeneratedIdWrapper>,
}

impl Entity for ResolveConversationsServiceGetIn {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1645,
		}
	}
}

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
#[cfg_attr(any(test, feature = "testing"), derive(PartialEq, Debug))]
pub struct ResolveConversationsServiceGetOut {
	pub _format: i64,
	pub mailIds: Vec<super::sys::IdTupleWrapper>,
}

impl Entity for ResolveConversationsServiceGetOut {
	fn type_ref() -> TypeRef {
		TypeRef {
			app: "tutanota",
			type_id: 1648,
		}
	}
}
