#![allow(non_snake_case, unused_imports)]
use super::*;
use serde::{Serialize, Deserialize};

#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct AttachmentKeyData {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub bucketEncFileSessionKey: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub fileSessionKey: Option<Vec<u8>>,
	pub file: IdTuple,
}

impl Entity for AttachmentKeyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "AttachmentKeyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Birthday {
	pub _id: Id,
	pub day: i64,
	pub month: i64,
	pub year: Option<i64>,
}

impl Entity for Birthday {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "Birthday".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Body {
	pub _id: Id,
	pub compressedText: Option<Vec<u8>>,
	pub text: Option<String>,
}

impl Entity for Body {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "Body".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarDeleteData {
	pub _format: i64,
	pub groupRootId: Id,
}

impl Entity for CalendarDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarDeleteData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarEvent {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub description: String,
	pub endTime: Date,
	#[serde(with = "serde_bytes")]
	pub hashedUid: Option<Vec<u8>>,
	pub invitedConfidentially: Option<bool>,
	pub location: String,
	pub recurrenceId: Option<Date>,
	pub sequence: i64,
	pub startTime: Date,
	pub summary: String,
	pub uid: Option<String>,
	pub alarmInfos: Vec<IdTuple>,
	pub attendees: Vec<CalendarEventAttendee>,
	pub organizer: Option<EncryptedMailAddress>,
	pub repeatRule: Option<CalendarRepeatRule>,
}

impl Entity for CalendarEvent {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarEvent".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarEventAttendee {
	pub _id: Id,
	pub status: i64,
	pub address: EncryptedMailAddress,
}

impl Entity for CalendarEventAttendee {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarEventAttendee".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarEventIndexRef {
	pub _id: Id,
	pub list: Id,
}

impl Entity for CalendarEventIndexRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarEventIndexRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarEventUidIndex {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub alteredInstances: Vec<IdTuple>,
	pub progenitor: Option<IdTuple>,
}

impl Entity for CalendarEventUidIndex {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarEventUidIndex".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarEventUpdate {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub sender: String,
	pub file: IdTuple,
}

impl Entity for CalendarEventUpdate {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarEventUpdate".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarEventUpdateList {
	pub _id: Id,
	pub list: Id,
}

impl Entity for CalendarEventUpdateList {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarEventUpdateList".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarGroupRoot {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub index: Option<CalendarEventIndexRef>,
	pub longEvents: Id,
	pub shortEvents: Id,
}

impl Entity for CalendarGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarGroupRoot".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CalendarRepeatRule {
	pub _id: Id,
	pub endType: i64,
	pub endValue: Option<i64>,
	pub frequency: i64,
	pub interval: i64,
	pub timeZone: String,
	pub excludedDates: Vec<sys::DateWrapper>,
}

impl Entity for CalendarRepeatRule {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CalendarRepeatRule".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Contact {
	pub _area: i64,
	pub _format: i64,
	pub _id: IdTuple,
	pub _owner: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub autoTransmitPassword: String,
	pub birthdayIso: Option<String>,
	pub comment: String,
	pub company: String,
	pub department: Option<String>,
	pub firstName: String,
	pub lastName: String,
	pub middleName: Option<String>,
	pub nameSuffix: Option<String>,
	pub nickname: Option<String>,
	pub oldBirthdayDate: Option<Date>,
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
	pub photo: Option<IdTuple>,
	pub pronouns: Vec<ContactPronouns>,
	pub relationships: Vec<ContactRelationship>,
	pub socialIds: Vec<ContactSocialId>,
	pub websites: Vec<ContactWebsite>,
}

impl Entity for Contact {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "Contact".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactAddress {
	pub _id: Id,
	pub address: String,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for ContactAddress {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactAddress".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactCustomDate {
	pub _id: Id,
	pub customTypeName: String,
	pub dateIso: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for ContactCustomDate {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactCustomDate".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactList {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub contacts: Id,
	pub photos: Option<PhotosRef>,
}

impl Entity for ContactList {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactList".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactListEntry {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub emailAddress: String,
}

impl Entity for ContactListEntry {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactListEntry".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactListGroupRoot {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub entries: Id,
}

impl Entity for ContactListGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactListGroupRoot".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactMailAddress {
	pub _id: Id,
	pub address: String,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for ContactMailAddress {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactMailAddress".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactMessengerHandle {
	pub _id: Id,
	pub customTypeName: String,
	pub handle: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for ContactMessengerHandle {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactMessengerHandle".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactPhoneNumber {
	pub _id: Id,
	pub customTypeName: String,
	pub number: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for ContactPhoneNumber {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactPhoneNumber".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactPronouns {
	pub _id: Id,
	pub language: String,
	pub pronouns: String,
}

impl Entity for ContactPronouns {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactPronouns".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactRelationship {
	pub _id: Id,
	pub customTypeName: String,
	pub person: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for ContactRelationship {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactRelationship".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactSocialId {
	pub _id: Id,
	pub customTypeName: String,
	pub socialId: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for ContactSocialId {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactSocialId".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ContactWebsite {
	pub _id: Id,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: i64,
	pub url: String,
}

impl Entity for ContactWebsite {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ContactWebsite".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ConversationEntry {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub conversationType: i64,
	pub messageId: String,
	pub mail: Option<IdTuple>,
	pub previous: Option<IdTuple>,
}

impl Entity for ConversationEntry {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ConversationEntry".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreateExternalUserGroupData {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub externalPwEncUserGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub internalUserEncUserGroupKey: Vec<u8>,
	pub internalUserGroupKeyVersion: i64,
	pub mailAddress: String,
}

impl Entity for CreateExternalUserGroupData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CreateExternalUserGroupData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreateGroupPostReturn {
	pub _format: i64,
	pub group: Id,
}

impl Entity for CreateGroupPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CreateGroupPostReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreateMailFolderData {
	pub _format: i64,
	pub folderName: String,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerGroup: Option<Id>,
	pub ownerKeyVersion: i64,
	pub parentFolder: Option<IdTuple>,
}

impl Entity for CreateMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CreateMailFolderData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CreateMailFolderReturn {
	pub _format: i64,
	pub newFolder: IdTuple,
}

impl Entity for CreateMailFolderReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "CreateMailFolderReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
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
		TypeRef { app: "tutanota".to_owned(), type_: "CreateMailGroupData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct CustomerAccountCreateData {
	pub _format: i64,
	pub accountGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub adminEncAccountingInfoSessionKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub adminEncCustomerServerPropertiesSessionKey: Vec<u8>,
	pub authToken: String,
	pub code: String,
	pub date: Option<Date>,
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
		TypeRef { app: "tutanota".to_owned(), type_: "CustomerAccountCreateData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DeleteGroupData {
	pub _format: i64,
	pub restore: bool,
	pub group: Id,
}

impl Entity for DeleteGroupData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DeleteGroupData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DeleteMailData {
	pub _format: i64,
	pub folder: Option<IdTuple>,
	pub mails: Vec<IdTuple>,
}

impl Entity for DeleteMailData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DeleteMailData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DeleteMailFolderData {
	pub _format: i64,
	pub folders: Vec<IdTuple>,
}

impl Entity for DeleteMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DeleteMailFolderData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DraftAttachment {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub ownerEncFileSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub existingFile: Option<IdTuple>,
	pub newFile: Option<NewDraftAttachment>,
}

impl Entity for DraftAttachment {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DraftAttachment".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DraftCreateData {
	pub _format: i64,
	pub conversationType: i64,
	#[serde(with = "serde_bytes")]
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: i64,
	pub previousMessageId: Option<String>,
	pub draftData: DraftData,
}

impl Entity for DraftCreateData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DraftCreateData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DraftCreateReturn {
	pub _format: i64,
	pub draft: IdTuple,
}

impl Entity for DraftCreateReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DraftCreateReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DraftData {
	pub _id: Id,
	pub bodyText: String,
	pub compressedBodyText: Option<Vec<u8>>,
	pub confidential: bool,
	pub method: i64,
	pub senderMailAddress: String,
	pub senderName: String,
	pub subject: String,
	pub addedAttachments: Vec<DraftAttachment>,
	pub bccRecipients: Vec<DraftRecipient>,
	pub ccRecipients: Vec<DraftRecipient>,
	pub removedAttachments: Vec<IdTuple>,
	pub replyTos: Vec<EncryptedMailAddress>,
	pub toRecipients: Vec<DraftRecipient>,
}

impl Entity for DraftData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DraftData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DraftRecipient {
	pub _id: Id,
	pub mailAddress: String,
	pub name: String,
}

impl Entity for DraftRecipient {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DraftRecipient".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DraftUpdateData {
	pub _format: i64,
	pub draft: IdTuple,
	pub draftData: DraftData,
}

impl Entity for DraftUpdateData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DraftUpdateData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct DraftUpdateReturn {
	pub _format: i64,
	pub attachments: Vec<IdTuple>,
}

impl Entity for DraftUpdateReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "DraftUpdateReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct EmailTemplate {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub tag: String,
	pub title: String,
	pub contents: Vec<EmailTemplateContent>,
}

impl Entity for EmailTemplate {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "EmailTemplate".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct EmailTemplateContent {
	pub _id: Id,
	pub languageCode: String,
	pub text: String,
}

impl Entity for EmailTemplateContent {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "EmailTemplateContent".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct EncryptTutanotaPropertiesData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub symEncSessionKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub properties: Id,
}

impl Entity for EncryptTutanotaPropertiesData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "EncryptTutanotaPropertiesData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct EncryptedMailAddress {
	pub _id: Id,
	pub address: String,
	pub name: String,
}

impl Entity for EncryptedMailAddress {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "EncryptedMailAddress".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct EntropyData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub userEncEntropy: Vec<u8>,
	pub userKeyVersion: i64,
}

impl Entity for EntropyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "EntropyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
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
		TypeRef { app: "tutanota".to_owned(), type_: "ExternalUserData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct TutanotaFile {
	pub _area: i64,
	pub _format: i64,
	pub _id: IdTuple,
	pub _owner: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub cid: Option<String>,
	pub mimeType: Option<String>,
	pub name: String,
	pub size: i64,
	pub blobs: Vec<sys::Blob>,
	pub parent: Option<IdTuple>,
	pub subFiles: Option<Subfiles>,
}

impl Entity for TutanotaFile {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "TutanotaFile".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct FileSystem {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub files: Id,
}

impl Entity for FileSystem {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "FileSystem".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupInvitationDeleteData {
	pub _format: i64,
	pub receivedInvitation: IdTuple,
}

impl Entity for GroupInvitationDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "GroupInvitationDeleteData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupInvitationPostData {
	pub _format: i64,
	pub internalKeyData: Vec<InternalRecipientKeyData>,
	pub sharedGroupData: SharedGroupData,
}

impl Entity for GroupInvitationPostData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "GroupInvitationPostData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupInvitationPostReturn {
	pub _format: i64,
	pub existingMailAddresses: Vec<MailAddress>,
	pub invalidMailAddresses: Vec<MailAddress>,
	pub invitedMailAddresses: Vec<MailAddress>,
}

impl Entity for GroupInvitationPostReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "GroupInvitationPostReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupInvitationPutData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncInviteeGroupInfoKey: Vec<u8>,
	pub sharedGroupKeyVersion: i64,
	#[serde(with = "serde_bytes")]
	pub userGroupEncGroupKey: Vec<u8>,
	pub userGroupKeyVersion: i64,
	pub receivedInvitation: IdTuple,
}

impl Entity for GroupInvitationPutData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "GroupInvitationPutData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct GroupSettings {
	pub _id: Id,
	pub color: String,
	pub name: Option<String>,
	pub defaultAlarmsList: Vec<sys::DefaultAlarmInfo>,
	pub group: Id,
}

impl Entity for GroupSettings {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "GroupSettings".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Header {
	pub _id: Id,
	pub compressedHeaders: Option<Vec<u8>>,
	pub headers: Option<String>,
}

impl Entity for Header {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "Header".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ImapFolder {
	pub _id: Id,
	pub lastseenuid: String,
	pub name: String,
	pub uidvalidity: String,
	pub syncInfo: Id,
}

impl Entity for ImapFolder {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ImapFolder".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ImapSyncConfiguration {
	pub _id: Id,
	pub host: String,
	pub password: String,
	pub port: i64,
	pub user: String,
	pub imapSyncState: Option<Id>,
}

impl Entity for ImapSyncConfiguration {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ImapSyncConfiguration".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ImapSyncState {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub folders: Vec<ImapFolder>,
}

impl Entity for ImapSyncState {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ImapSyncState".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InboxRule {
	pub _id: Id,
	#[serde(rename = "type")]
	pub r#type: String,
	pub value: String,
	pub targetFolder: IdTuple,
}

impl Entity for InboxRule {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "InboxRule".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InternalGroupData {
	pub _id: Id,
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
	pub adminGroup: Option<Id>,
}

impl Entity for InternalGroupData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "InternalGroupData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct InternalRecipientKeyData {
	pub _id: Id,
	pub mailAddress: String,
	pub protocolVersion: i64,
	#[serde(with = "serde_bytes")]
	pub pubEncBucketKey: Vec<u8>,
	pub recipientKeyVersion: i64,
	pub senderKeyVersion: Option<i64>,
}

impl Entity for InternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "InternalRecipientKeyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct KnowledgeBaseEntry {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub description: String,
	pub title: String,
	pub keywords: Vec<KnowledgeBaseEntryKeyword>,
}

impl Entity for KnowledgeBaseEntry {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "KnowledgeBaseEntry".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct KnowledgeBaseEntryKeyword {
	pub _id: Id,
	pub keyword: String,
}

impl Entity for KnowledgeBaseEntryKeyword {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "KnowledgeBaseEntryKeyword".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ListUnsubscribeData {
	pub _format: i64,
	pub headers: String,
	pub recipient: String,
	pub mail: IdTuple,
}

impl Entity for ListUnsubscribeData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ListUnsubscribeData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Mail {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub authStatus: Option<i64>,
	pub confidential: bool,
	pub differentEnvelopeSender: Option<String>,
	pub encryptionAuthStatus: Option<i64>,
	pub listUnsubscribe: bool,
	pub method: i64,
	pub movedTime: Option<Date>,
	pub phishingStatus: i64,
	pub receivedDate: Date,
	pub recipientCount: i64,
	pub replyType: i64,
	pub sentDate: Option<Date>,
	pub state: i64,
	pub subject: String,
	pub unread: bool,
	pub attachments: Vec<IdTuple>,
	pub bccRecipients: Vec<MailAddress>,
	pub body: Option<Id>,
	pub bucketKey: Option<sys::BucketKey>,
	pub ccRecipients: Vec<MailAddress>,
	pub conversationEntry: IdTuple,
	pub firstRecipient: Option<MailAddress>,
	pub headers: Option<Id>,
	pub mailDetails: Option<IdTuple>,
	pub mailDetailsDraft: Option<IdTuple>,
	pub replyTos: Vec<EncryptedMailAddress>,
	pub sender: MailAddress,
	pub toRecipients: Vec<MailAddress>,
}

impl Entity for Mail {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "Mail".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddress {
	pub _id: Id,
	pub address: String,
	pub name: String,
	pub contact: Option<IdTuple>,
}

impl Entity for MailAddress {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailAddress".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailAddressProperties {
	pub _id: Id,
	pub mailAddress: String,
	pub senderName: String,
}

impl Entity for MailAddressProperties {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailAddressProperties".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailBody {
	pub _area: i64,
	pub _format: i64,
	pub _id: Id,
	pub _owner: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub compressedText: Option<Vec<u8>>,
	pub text: Option<String>,
}

impl Entity for MailBody {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailBody".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailBox {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub lastInfoDate: Date,
	pub folders: Option<MailFolderRef>,
	pub mailDetailsDrafts: Option<MailDetailsDraftsRef>,
	pub mails: Id,
	pub receivedAttachments: Id,
	pub sentAttachments: Id,
	pub spamResults: Option<SpamResults>,
}

impl Entity for MailBox {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailBox".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailDetails {
	pub _id: Id,
	pub authStatus: i64,
	pub sentDate: Date,
	pub body: Body,
	pub headers: Option<Header>,
	pub recipients: Recipients,
	pub replyTos: Vec<EncryptedMailAddress>,
}

impl Entity for MailDetails {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailDetails".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailDetailsBlob {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub details: MailDetails,
}

impl Entity for MailDetailsBlob {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailDetailsBlob".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailDetailsDraft {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub details: MailDetails,
}

impl Entity for MailDetailsDraft {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailDetailsDraft".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailDetailsDraftsRef {
	pub _id: Id,
	pub list: Id,
}

impl Entity for MailDetailsDraftsRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailDetailsDraftsRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailFolder {
	pub _format: i64,
	pub _id: IdTuple,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub folderType: i64,
	pub name: String,
	pub mails: Id,
	pub parentFolder: Option<IdTuple>,
	pub subFolders: Id,
}

impl Entity for MailFolder {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailFolder".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailFolderRef {
	pub _id: Id,
	pub folders: Id,
}

impl Entity for MailFolderRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailFolderRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailHeaders {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub compressedHeaders: Option<Vec<u8>>,
	pub headers: Option<String>,
}

impl Entity for MailHeaders {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailHeaders".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailboxGroupRoot {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub calendarEventUpdates: Option<CalendarEventUpdateList>,
	pub mailbox: Id,
	pub mailboxProperties: Option<Id>,
	pub outOfOfficeNotification: Option<Id>,
	pub outOfOfficeNotificationRecipientList: Option<OutOfOfficeNotificationRecipientList>,
	pub serverProperties: Id,
	pub whitelistRequests: Id,
}

impl Entity for MailboxGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailboxGroupRoot".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailboxProperties {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub reportMovedMails: i64,
	pub mailAddressProperties: Vec<MailAddressProperties>,
}

impl Entity for MailboxProperties {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailboxProperties".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MailboxServerProperties {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub whitelistProtectionEnabled: bool,
}

impl Entity for MailboxServerProperties {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MailboxServerProperties".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct MoveMailData {
	pub _format: i64,
	pub mails: Vec<IdTuple>,
	pub targetFolder: IdTuple,
}

impl Entity for MoveMailData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "MoveMailData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct NewDraftAttachment {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub encCid: Option<Vec<u8>>,
	#[serde(with = "serde_bytes")]
	pub encFileName: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub encMimeType: Vec<u8>,
	pub referenceTokens: Vec<sys::BlobReferenceTokenWrapper>,
}

impl Entity for NewDraftAttachment {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "NewDraftAttachment".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct NewsId {
	pub _id: Id,
	pub newsItemId: Id,
	pub newsItemName: String,
}

impl Entity for NewsId {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "NewsId".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct NewsIn {
	pub _format: i64,
	pub newsItemId: Option<Id>,
}

impl Entity for NewsIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "NewsIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct NewsOut {
	pub _format: i64,
	pub newsItemIds: Vec<NewsId>,
}

impl Entity for NewsOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "NewsOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct NotificationMail {
	pub _id: Id,
	pub bodyText: String,
	pub mailboxLink: String,
	pub recipientMailAddress: String,
	pub recipientName: String,
	pub subject: String,
}

impl Entity for NotificationMail {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "NotificationMail".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct OutOfOfficeNotification {
	pub _format: i64,
	pub _id: Id,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub enabled: bool,
	pub endDate: Option<Date>,
	pub startDate: Option<Date>,
	pub notifications: Vec<OutOfOfficeNotificationMessage>,
}

impl Entity for OutOfOfficeNotification {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "OutOfOfficeNotification".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct OutOfOfficeNotificationMessage {
	pub _id: Id,
	pub message: String,
	pub subject: String,
	#[serde(rename = "type")]
	pub r#type: i64,
}

impl Entity for OutOfOfficeNotificationMessage {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "OutOfOfficeNotificationMessage".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct OutOfOfficeNotificationRecipientList {
	pub _id: Id,
	pub list: Id,
}

impl Entity for OutOfOfficeNotificationRecipientList {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "OutOfOfficeNotificationRecipientList".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PasswordAutoAuthenticationReturn {
	pub _format: i64,
}

impl Entity for PasswordAutoAuthenticationReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "PasswordAutoAuthenticationReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PasswordChannelPhoneNumber {
	pub _id: Id,
	pub number: String,
}

impl Entity for PasswordChannelPhoneNumber {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "PasswordChannelPhoneNumber".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PasswordChannelReturn {
	pub _format: i64,
	pub phoneNumberChannels: Vec<PasswordChannelPhoneNumber>,
}

impl Entity for PasswordChannelReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "PasswordChannelReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PasswordMessagingData {
	pub _format: i64,
	pub language: String,
	pub numberId: Id,
	#[serde(with = "serde_bytes")]
	pub symKeyForPasswordTransmission: Vec<u8>,
}

impl Entity for PasswordMessagingData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "PasswordMessagingData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PasswordMessagingReturn {
	pub _format: i64,
	pub autoAuthenticationId: Id,
}

impl Entity for PasswordMessagingReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "PasswordMessagingReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PhishingMarkerWebsocketData {
	pub _format: i64,
	pub lastId: Id,
	pub markers: Vec<ReportedMailFieldMarker>,
}

impl Entity for PhishingMarkerWebsocketData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "PhishingMarkerWebsocketData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct PhotosRef {
	pub _id: Id,
	pub files: Id,
}

impl Entity for PhotosRef {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "PhotosRef".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ReceiveInfoServiceData {
	pub _format: i64,
	pub language: String,
}

impl Entity for ReceiveInfoServiceData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ReceiveInfoServiceData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Recipients {
	pub _id: Id,
	pub bccRecipients: Vec<MailAddress>,
	pub ccRecipients: Vec<MailAddress>,
	pub toRecipients: Vec<MailAddress>,
}

impl Entity for Recipients {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "Recipients".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct RemoteImapSyncInfo {
	pub _format: i64,
	pub _id: IdTuple,
	pub _ownerGroup: Option<Id>,
	pub _permissions: Id,
	pub seen: bool,
	pub message: IdTuple,
}

impl Entity for RemoteImapSyncInfo {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "RemoteImapSyncInfo".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ReportMailPostData {
	pub _format: i64,
	#[serde(with = "serde_bytes")]
	pub mailSessionKey: Vec<u8>,
	pub reportType: i64,
	pub mailId: IdTuple,
}

impl Entity for ReportMailPostData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ReportMailPostData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct ReportedMailFieldMarker {
	pub _id: Id,
	pub marker: String,
	pub status: i64,
}

impl Entity for ReportedMailFieldMarker {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "ReportedMailFieldMarker".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SecureExternalRecipientKeyData {
	pub _id: Id,
	pub autoTransmitPassword: Option<String>,
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
	pub passwordChannelPhoneNumbers: Vec<PasswordChannelPhoneNumber>,
}

impl Entity for SecureExternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "SecureExternalRecipientKeyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
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
	pub mail: IdTuple,
	pub secureExternalRecipientKeyData: Vec<SecureExternalRecipientKeyData>,
	pub symEncInternalRecipientKeyData: Vec<SymEncInternalRecipientKeyData>,
}

impl Entity for SendDraftData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "SendDraftData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SendDraftReturn {
	pub _format: i64,
	pub messageId: String,
	pub sentDate: Date,
	pub notifications: Vec<NotificationMail>,
	pub sentMail: IdTuple,
}

impl Entity for SendDraftReturn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "SendDraftReturn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SharedGroupData {
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub bucketEncInvitationSessionKey: Vec<u8>,
	pub capability: i64,
	#[serde(with = "serde_bytes")]
	pub sessionEncInviterName: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub sessionEncSharedGroupKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub sessionEncSharedGroupName: Vec<u8>,
	pub sharedGroup: Id,
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncInviterGroupInfoKey: Vec<u8>,
	#[serde(with = "serde_bytes")]
	pub sharedGroupEncSharedGroupInfoKey: Vec<u8>,
	pub sharedGroupKeyVersion: i64,
}

impl Entity for SharedGroupData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "SharedGroupData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SpamResults {
	pub _id: Id,
	pub list: Id,
}

impl Entity for SpamResults {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "SpamResults".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct Subfiles {
	pub _id: Id,
	pub files: Id,
}

impl Entity for Subfiles {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "Subfiles".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct SymEncInternalRecipientKeyData {
	pub _id: Id,
	pub mailAddress: String,
	#[serde(with = "serde_bytes")]
	pub symEncBucketKey: Vec<u8>,
	pub symKeyVersion: i64,
	pub keyGroup: Id,
}

impl Entity for SymEncInternalRecipientKeyData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "SymEncInternalRecipientKeyData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct TemplateGroupRoot {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub knowledgeBase: Id,
	pub templates: Id,
}

impl Entity for TemplateGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "TemplateGroupRoot".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct TranslationGetIn {
	pub _format: i64,
	pub lang: String,
}

impl Entity for TranslationGetIn {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "TranslationGetIn".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct TranslationGetOut {
	pub _format: i64,
	pub giftCardSubject: String,
	pub invitationSubject: String,
}

impl Entity for TranslationGetOut {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "TranslationGetOut".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct TutanotaProperties {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub customEmailSignature: String,
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
	pub lastPushedMail: Option<IdTuple>,
}

impl Entity for TutanotaProperties {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "TutanotaProperties".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UpdateMailFolderData {
	pub _format: i64,
	pub folder: IdTuple,
	pub newParent: Option<IdTuple>,
}

impl Entity for UpdateMailFolderData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "UpdateMailFolderData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAccountCreateData {
	pub _format: i64,
	pub date: Option<Date>,
	pub userData: UserAccountUserData,
	pub userGroupData: InternalGroupData,
}

impl Entity for UserAccountCreateData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "UserAccountCreateData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAccountUserData {
	pub _id: Id,
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
		TypeRef { app: "tutanota".to_owned(), type_: "UserAccountUserData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAreaGroupData {
	pub _id: Id,
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
	pub adminGroup: Option<Id>,
}

impl Entity for UserAreaGroupData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "UserAreaGroupData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAreaGroupDeleteData {
	pub _format: i64,
	pub group: Id,
}

impl Entity for UserAreaGroupDeleteData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "UserAreaGroupDeleteData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserAreaGroupPostData {
	pub _format: i64,
	pub groupData: UserAreaGroupData,
}

impl Entity for UserAreaGroupPostData {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "UserAreaGroupPostData".to_owned() }
	}
}


#[derive(uniffi::Record, Clone, Serialize, Deserialize)]
pub struct UserSettingsGroupRoot {
	pub _format: i64,
	pub _id: Id,
	#[serde(with = "serde_bytes")]
	pub _ownerEncSessionKey: Option<Vec<u8>>,
	pub _ownerGroup: Option<Id>,
	pub _ownerKeyVersion: Option<i64>,
	pub _permissions: Id,
	pub startOfTheWeek: i64,
	pub timeFormat: i64,
	pub usageDataOptedIn: Option<bool>,
	pub groupSettings: Vec<GroupSettings>,
}

impl Entity for UserSettingsGroupRoot {
	fn type_ref() -> TypeRef {
		TypeRef { app: "tutanota".to_owned(), type_: "UserSettingsGroupRoot".to_owned() }
	}
}
