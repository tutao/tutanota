#![allow(non_snake_case)]
use super::*;

pub struct AttachmentKeyData {
	pub _id: Id,
	pub bucketEncFileSessionKey: Vec<u8>,
	pub fileSessionKey: Vec<u8>,
	pub file: IdTuple,
}

pub struct Birthday {
	pub _id: Id,
	pub day: String,
	pub month: String,
	pub year: String,
}

pub struct Body {
	pub _id: Id,
	pub compressedText: Vec<u8>,
	pub text: String,
}

pub struct CalendarDeleteData {
	pub _format: String,
	pub groupRootId: Id,
}

pub struct CalendarEvent {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub description: String,
	pub endTime: Date,
	pub hashedUid: Vec<u8>,
	pub invitedConfidentially: bool,
	pub location: String,
	pub recurrenceId: Date,
	pub sequence: String,
	pub startTime: Date,
	pub summary: String,
	pub uid: String,
	pub alarmInfos: Vec<IdTuple>,
	pub attendees: Vec<CalendarEventAttendee>,
	pub organizer: Option<EncryptedMailAddress>,
	pub repeatRule: Option<CalendarRepeatRule>,
}

pub struct CalendarEventAttendee {
	pub _id: Id,
	pub status: String,
	pub address: EncryptedMailAddress,
}

pub struct CalendarEventIndexRef {
	pub _id: Id,
	pub list: Id,
}

pub struct CalendarEventUidIndex {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub alteredInstances: Vec<IdTuple>,
	pub progenitor: Option<IdTuple>,
}

pub struct CalendarEventUpdate {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub sender: String,
	pub file: IdTuple,
}

pub struct CalendarEventUpdateList {
	pub _id: Id,
	pub list: Id,
}

pub struct CalendarGroupRoot {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub index: Option<CalendarEventIndexRef>,
	pub longEvents: Id,
	pub shortEvents: Id,
}

pub struct CalendarRepeatRule {
	pub _id: Id,
	pub endType: String,
	pub endValue: String,
	pub frequency: String,
	pub interval: String,
	pub timeZone: String,
	pub excludedDates: Vec<sys::DateWrapper>,
}

pub struct Contact {
	pub _area: String,
	pub _format: String,
	pub _id: IdTuple,
	pub _owner: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub autoTransmitPassword: String,
	pub birthdayIso: String,
	pub comment: String,
	pub company: String,
	pub department: String,
	pub firstName: String,
	pub lastName: String,
	pub middleName: String,
	pub nameSuffix: String,
	pub nickname: String,
	pub oldBirthdayDate: Date,
	pub phoneticFirst: String,
	pub phoneticLast: String,
	pub phoneticMiddle: String,
	pub presharedPassword: String,
	pub role: String,
	pub title: String,
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

pub struct ContactAddress {
	pub _id: Id,
	pub address: String,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct ContactCustomDate {
	pub _id: Id,
	pub customTypeName: String,
	pub dateIso: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct ContactList {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub contacts: Id,
	pub photos: Option<PhotosRef>,
}

pub struct ContactListEntry {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub emailAddress: String,
}

pub struct ContactListGroupRoot {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub entries: Id,
}

pub struct ContactMailAddress {
	pub _id: Id,
	pub address: String,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct ContactMessengerHandle {
	pub _id: Id,
	pub customTypeName: String,
	pub handle: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct ContactPhoneNumber {
	pub _id: Id,
	pub customTypeName: String,
	pub number: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct ContactPronouns {
	pub _id: Id,
	pub language: String,
	pub pronouns: String,
}

pub struct ContactRelationship {
	pub _id: Id,
	pub customTypeName: String,
	pub person: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct ContactSocialId {
	pub _id: Id,
	pub customTypeName: String,
	pub socialId: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct ContactWebsite {
	pub _id: Id,
	pub customTypeName: String,
	#[serde(rename = "type")]
	pub r#type: String,
	pub url: String,
}

pub struct ConversationEntry {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub conversationType: String,
	pub messageId: String,
	pub mail: Option<IdTuple>,
	pub previous: Option<IdTuple>,
}

pub struct CreateExternalUserGroupData {
	pub _id: Id,
	pub externalPwEncUserGroupKey: Vec<u8>,
	pub internalUserEncUserGroupKey: Vec<u8>,
	pub internalUserGroupKeyVersion: String,
	pub mailAddress: String,
}

pub struct CreateGroupPostReturn {
	pub _format: String,
	pub group: Id,
}

pub struct CreateMailFolderData {
	pub _format: String,
	pub folderName: String,
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerGroup: Id,
	pub ownerKeyVersion: String,
	pub parentFolder: Option<IdTuple>,
}

pub struct CreateMailFolderReturn {
	pub _format: String,
	pub newFolder: IdTuple,
}

pub struct CreateMailGroupData {
	pub _format: String,
	pub encryptedName: Vec<u8>,
	pub mailAddress: String,
	pub mailEncMailboxSessionKey: Vec<u8>,
	pub groupData: InternalGroupData,
}

pub struct CustomerAccountCreateData {
	pub _format: String,
	pub accountGroupKeyVersion: String,
	pub adminEncAccountingInfoSessionKey: Vec<u8>,
	pub adminEncCustomerServerPropertiesSessionKey: Vec<u8>,
	pub authToken: String,
	pub code: String,
	pub date: Date,
	pub lang: String,
	pub systemAdminPubEncAccountingInfoSessionKey: Vec<u8>,
	pub systemAdminPubKeyVersion: String,
	pub systemAdminPublicProtocolVersion: String,
	pub userEncAccountGroupKey: Vec<u8>,
	pub userEncAdminGroupKey: Vec<u8>,
	pub adminGroupData: InternalGroupData,
	pub customerGroupData: InternalGroupData,
	pub userData: UserAccountUserData,
	pub userGroupData: InternalGroupData,
}

pub struct DeleteGroupData {
	pub _format: String,
	pub restore: bool,
	pub group: Id,
}

pub struct DeleteMailData {
	pub _format: String,
	pub folder: Option<IdTuple>,
	pub mails: Vec<IdTuple>,
}

pub struct DeleteMailFolderData {
	pub _format: String,
	pub folders: Vec<IdTuple>,
}

pub struct DraftAttachment {
	pub _id: Id,
	pub ownerEncFileSessionKey: Vec<u8>,
	pub ownerKeyVersion: String,
	pub existingFile: Option<IdTuple>,
	pub newFile: Option<NewDraftAttachment>,
}

pub struct DraftCreateData {
	pub _format: String,
	pub conversationType: String,
	pub ownerEncSessionKey: Vec<u8>,
	pub ownerKeyVersion: String,
	pub previousMessageId: String,
	pub draftData: DraftData,
}

pub struct DraftCreateReturn {
	pub _format: String,
	pub draft: IdTuple,
}

pub struct DraftData {
	pub _id: Id,
	pub bodyText: String,
	pub compressedBodyText: Vec<u8>,
	pub confidential: bool,
	pub method: String,
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

pub struct DraftRecipient {
	pub _id: Id,
	pub mailAddress: String,
	pub name: String,
}

pub struct DraftUpdateData {
	pub _format: String,
	pub draft: IdTuple,
	pub draftData: DraftData,
}

pub struct DraftUpdateReturn {
	pub _format: String,
	pub attachments: Vec<IdTuple>,
}

pub struct EmailTemplate {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub tag: String,
	pub title: String,
	pub contents: Vec<EmailTemplateContent>,
}

pub struct EmailTemplateContent {
	pub _id: Id,
	pub languageCode: String,
	pub text: String,
}

pub struct EncryptTutanotaPropertiesData {
	pub _format: String,
	pub symEncSessionKey: Vec<u8>,
	pub symKeyVersion: String,
	pub properties: Id,
}

pub struct EncryptedMailAddress {
	pub _id: Id,
	pub address: String,
	pub name: String,
}

pub struct EntropyData {
	pub _format: String,
	pub userEncEntropy: Vec<u8>,
	pub userKeyVersion: String,
}

pub struct ExternalUserData {
	pub _format: String,
	pub externalMailEncMailBoxSessionKey: Vec<u8>,
	pub externalMailEncMailGroupInfoSessionKey: Vec<u8>,
	pub externalUserEncEntropy: Vec<u8>,
	pub externalUserEncMailGroupKey: Vec<u8>,
	pub externalUserEncTutanotaPropertiesSessionKey: Vec<u8>,
	pub externalUserEncUserGroupInfoSessionKey: Vec<u8>,
	pub internalMailEncMailGroupInfoSessionKey: Vec<u8>,
	pub internalMailEncUserGroupInfoSessionKey: Vec<u8>,
	pub internalMailGroupKeyVersion: String,
	pub kdfVersion: String,
	pub verifier: Vec<u8>,
	pub userGroupData: CreateExternalUserGroupData,
}

pub struct File {
	pub _area: String,
	pub _format: String,
	pub _id: IdTuple,
	pub _owner: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub cid: String,
	pub mimeType: String,
	pub name: String,
	pub size: String,
	pub blobs: Vec<sys::Blob>,
	pub parent: Option<IdTuple>,
	pub subFiles: Option<Subfiles>,
}

pub struct FileSystem {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub files: Id,
}

pub struct GroupInvitationDeleteData {
	pub _format: String,
	pub receivedInvitation: IdTuple,
}

pub struct GroupInvitationPostData {
	pub _format: String,
	pub internalKeyData: Vec<InternalRecipientKeyData>,
	pub sharedGroupData: SharedGroupData,
}

pub struct GroupInvitationPostReturn {
	pub _format: String,
	pub existingMailAddresses: Vec<MailAddress>,
	pub invalidMailAddresses: Vec<MailAddress>,
	pub invitedMailAddresses: Vec<MailAddress>,
}

pub struct GroupInvitationPutData {
	pub _format: String,
	pub sharedGroupEncInviteeGroupInfoKey: Vec<u8>,
	pub sharedGroupKeyVersion: String,
	pub userGroupEncGroupKey: Vec<u8>,
	pub userGroupKeyVersion: String,
	pub receivedInvitation: IdTuple,
}

pub struct GroupSettings {
	pub _id: Id,
	pub color: String,
	pub name: String,
	pub group: Id,
}

pub struct Header {
	pub _id: Id,
	pub compressedHeaders: Vec<u8>,
	pub headers: String,
}

pub struct ImapFolder {
	pub _id: Id,
	pub lastseenuid: String,
	pub name: String,
	pub uidvalidity: String,
	pub syncInfo: Id,
}

pub struct ImapSyncConfiguration {
	pub _id: Id,
	pub host: String,
	pub password: String,
	pub port: String,
	pub user: String,
	pub imapSyncState: Option<Id>,
}

pub struct ImapSyncState {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub folders: Vec<ImapFolder>,
}

pub struct InboxRule {
	pub _id: Id,
	#[serde(rename = "type")]
	pub r#type: String,
	pub value: String,
	pub targetFolder: IdTuple,
}

pub struct InternalGroupData {
	pub _id: Id,
	pub adminEncGroupKey: Vec<u8>,
	pub adminKeyVersion: String,
	pub groupEncPrivEccKey: Vec<u8>,
	pub groupEncPrivKyberKey: Vec<u8>,
	pub groupEncPrivRsaKey: Vec<u8>,
	pub ownerEncGroupInfoSessionKey: Vec<u8>,
	pub ownerKeyVersion: String,
	pub pubEccKey: Vec<u8>,
	pub pubKyberKey: Vec<u8>,
	pub pubRsaKey: Vec<u8>,
	pub adminGroup: Option<Id>,
}

pub struct InternalRecipientKeyData {
	pub _id: Id,
	pub mailAddress: String,
	pub protocolVersion: String,
	pub pubEncBucketKey: Vec<u8>,
	pub recipientKeyVersion: String,
	pub senderKeyVersion: String,
}

pub struct KnowledgeBaseEntry {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub description: String,
	pub title: String,
	pub keywords: Vec<KnowledgeBaseEntryKeyword>,
}

pub struct KnowledgeBaseEntryKeyword {
	pub _id: Id,
	pub keyword: String,
}

pub struct ListUnsubscribeData {
	pub _format: String,
	pub headers: String,
	pub recipient: String,
	pub mail: IdTuple,
}

pub struct Mail {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub authStatus: String,
	pub confidential: bool,
	pub differentEnvelopeSender: String,
	pub encryptionAuthStatus: String,
	pub listUnsubscribe: bool,
	pub method: String,
	pub movedTime: Date,
	pub phishingStatus: String,
	pub receivedDate: Date,
	pub recipientCount: String,
	pub replyType: String,
	pub sentDate: Date,
	pub state: String,
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

pub struct MailAddress {
	pub _id: Id,
	pub address: String,
	pub name: String,
	pub contact: Option<IdTuple>,
}

pub struct MailAddressProperties {
	pub _id: Id,
	pub mailAddress: String,
	pub senderName: String,
}

pub struct MailBody {
	pub _area: String,
	pub _format: String,
	pub _id: Id,
	pub _owner: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub compressedText: Vec<u8>,
	pub text: String,
}

pub struct MailBox {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub lastInfoDate: Date,
	pub folders: Option<MailFolderRef>,
	pub mailDetailsDrafts: Option<MailDetailsDraftsRef>,
	pub mails: Id,
	pub receivedAttachments: Id,
	pub sentAttachments: Id,
	pub spamResults: Option<SpamResults>,
}

pub struct MailDetails {
	pub _id: Id,
	pub authStatus: String,
	pub sentDate: Date,
	pub body: Body,
	pub headers: Option<Header>,
	pub recipients: Recipients,
	pub replyTos: Vec<EncryptedMailAddress>,
}

pub struct MailDetailsBlob {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub details: MailDetails,
}

pub struct MailDetailsDraft {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub details: MailDetails,
}

pub struct MailDetailsDraftsRef {
	pub _id: Id,
	pub list: Id,
}

pub struct MailFolder {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub folderType: String,
	pub name: String,
	pub mails: Id,
	pub parentFolder: Option<IdTuple>,
	pub subFolders: Id,
}

pub struct MailFolderRef {
	pub _id: Id,
	pub folders: Id,
}

pub struct MailHeaders {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub compressedHeaders: Vec<u8>,
	pub headers: String,
}

pub struct MailboxGroupRoot {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub calendarEventUpdates: Option<CalendarEventUpdateList>,
	pub mailbox: Id,
	pub mailboxProperties: Option<Id>,
	pub outOfOfficeNotification: Option<Id>,
	pub outOfOfficeNotificationRecipientList: Option<OutOfOfficeNotificationRecipientList>,
	pub serverProperties: Id,
	pub whitelistRequests: Id,
}

pub struct MailboxProperties {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub reportMovedMails: String,
	pub mailAddressProperties: Vec<MailAddressProperties>,
}

pub struct MailboxServerProperties {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub whitelistProtectionEnabled: bool,
}

pub struct MoveMailData {
	pub _format: String,
	pub mails: Vec<IdTuple>,
	pub targetFolder: IdTuple,
}

pub struct NewDraftAttachment {
	pub _id: Id,
	pub encCid: Vec<u8>,
	pub encFileName: Vec<u8>,
	pub encMimeType: Vec<u8>,
	pub referenceTokens: Vec<sys::BlobReferenceTokenWrapper>,
}

pub struct NewsId {
	pub _id: Id,
	pub newsItemId: Id,
	pub newsItemName: String,
}

pub struct NewsIn {
	pub _format: String,
	pub newsItemId: Id,
}

pub struct NewsOut {
	pub _format: String,
	pub newsItemIds: Vec<NewsId>,
}

pub struct NotificationMail {
	pub _id: Id,
	pub bodyText: String,
	pub mailboxLink: String,
	pub recipientMailAddress: String,
	pub recipientName: String,
	pub subject: String,
}

pub struct OutOfOfficeNotification {
	pub _format: String,
	pub _id: Id,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub enabled: bool,
	pub endDate: Date,
	pub startDate: Date,
	pub notifications: Vec<OutOfOfficeNotificationMessage>,
}

pub struct OutOfOfficeNotificationMessage {
	pub _id: Id,
	pub message: String,
	pub subject: String,
	#[serde(rename = "type")]
	pub r#type: String,
}

pub struct OutOfOfficeNotificationRecipientList {
	pub _id: Id,
	pub list: Id,
}

pub struct PasswordAutoAuthenticationReturn {
	pub _format: String,
}

pub struct PasswordChannelPhoneNumber {
	pub _id: Id,
	pub number: String,
}

pub struct PasswordChannelReturn {
	pub _format: String,
	pub phoneNumberChannels: Vec<PasswordChannelPhoneNumber>,
}

pub struct PasswordMessagingData {
	pub _format: String,
	pub language: String,
	pub numberId: Id,
	pub symKeyForPasswordTransmission: Vec<u8>,
}

pub struct PasswordMessagingReturn {
	pub _format: String,
	pub autoAuthenticationId: Id,
}

pub struct PhishingMarkerWebsocketData {
	pub _format: String,
	pub lastId: Id,
	pub markers: Vec<ReportedMailFieldMarker>,
}

pub struct PhotosRef {
	pub _id: Id,
	pub files: Id,
}

pub struct ReceiveInfoServiceData {
	pub _format: String,
	pub language: String,
}

pub struct Recipients {
	pub _id: Id,
	pub bccRecipients: Vec<MailAddress>,
	pub ccRecipients: Vec<MailAddress>,
	pub toRecipients: Vec<MailAddress>,
}

pub struct RemoteImapSyncInfo {
	pub _format: String,
	pub _id: IdTuple,
	pub _ownerGroup: Id,
	pub _permissions: Id,
	pub seen: bool,
	pub message: IdTuple,
}

pub struct ReportMailPostData {
	pub _format: String,
	pub mailSessionKey: Vec<u8>,
	pub reportType: String,
	pub mailId: IdTuple,
}

pub struct ReportedMailFieldMarker {
	pub _id: Id,
	pub marker: String,
	pub status: String,
}

pub struct SecureExternalRecipientKeyData {
	pub _id: Id,
	pub autoTransmitPassword: String,
	pub kdfVersion: String,
	pub mailAddress: String,
	pub ownerEncBucketKey: Vec<u8>,
	pub ownerKeyVersion: String,
	pub passwordVerifier: Vec<u8>,
	pub pwEncCommunicationKey: Vec<u8>,
	pub salt: Vec<u8>,
	pub saltHash: Vec<u8>,
	pub passwordChannelPhoneNumbers: Vec<PasswordChannelPhoneNumber>,
}

pub struct SendDraftData {
	pub _format: String,
	pub bucketEncMailSessionKey: Vec<u8>,
	pub calendarMethod: bool,
	pub language: String,
	pub mailSessionKey: Vec<u8>,
	pub plaintext: bool,
	pub senderNameUnencrypted: String,
	pub sessionEncEncryptionAuthStatus: Vec<u8>,
	pub attachmentKeyData: Vec<AttachmentKeyData>,
	pub internalRecipientKeyData: Vec<InternalRecipientKeyData>,
	pub mail: IdTuple,
	pub secureExternalRecipientKeyData: Vec<SecureExternalRecipientKeyData>,
	pub symEncInternalRecipientKeyData: Vec<SymEncInternalRecipientKeyData>,
}

pub struct SendDraftReturn {
	pub _format: String,
	pub messageId: String,
	pub sentDate: Date,
	pub notifications: Vec<NotificationMail>,
	pub sentMail: IdTuple,
}

pub struct SharedGroupData {
	pub _id: Id,
	pub bucketEncInvitationSessionKey: Vec<u8>,
	pub capability: String,
	pub sessionEncInviterName: Vec<u8>,
	pub sessionEncSharedGroupKey: Vec<u8>,
	pub sessionEncSharedGroupName: Vec<u8>,
	pub sharedGroup: Id,
	pub sharedGroupEncInviterGroupInfoKey: Vec<u8>,
	pub sharedGroupEncSharedGroupInfoKey: Vec<u8>,
	pub sharedGroupKeyVersion: String,
}

pub struct SpamResults {
	pub _id: Id,
	pub list: Id,
}

pub struct Subfiles {
	pub _id: Id,
	pub files: Id,
}

pub struct SymEncInternalRecipientKeyData {
	pub _id: Id,
	pub mailAddress: String,
	pub symEncBucketKey: Vec<u8>,
	pub symKeyVersion: String,
	pub keyGroup: Id,
}

pub struct TemplateGroupRoot {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub knowledgeBase: Id,
	pub templates: Id,
}

pub struct TranslationGetIn {
	pub _format: String,
	pub lang: String,
}

pub struct TranslationGetOut {
	pub _format: String,
	pub giftCardSubject: String,
	pub invitationSubject: String,
}

pub struct TutanotaProperties {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub customEmailSignature: String,
	pub defaultSender: String,
	pub defaultUnconfidential: bool,
	pub emailSignatureType: String,
	pub lastSeenAnnouncement: String,
	pub noAutomaticContacts: bool,
	pub notificationMailLanguage: String,
	pub sendPlaintextOnly: bool,
	pub userEncEntropy: Vec<u8>,
	pub userKeyVersion: String,
	pub imapSyncConfig: Vec<ImapSyncConfiguration>,
	pub inboxRules: Vec<InboxRule>,
	pub lastPushedMail: Option<IdTuple>,
}

pub struct UpdateMailFolderData {
	pub _format: String,
	pub folder: IdTuple,
	pub newParent: Option<IdTuple>,
}

pub struct UserAccountCreateData {
	pub _format: String,
	pub date: Date,
	pub userData: UserAccountUserData,
	pub userGroupData: InternalGroupData,
}

pub struct UserAccountUserData {
	pub _id: Id,
	pub contactEncContactListSessionKey: Vec<u8>,
	pub customerEncContactGroupInfoSessionKey: Vec<u8>,
	pub customerEncFileGroupInfoSessionKey: Vec<u8>,
	pub customerEncMailGroupInfoSessionKey: Vec<u8>,
	pub customerKeyVersion: String,
	pub encryptedName: Vec<u8>,
	pub fileEncFileSystemSessionKey: Vec<u8>,
	pub kdfVersion: String,
	pub mailAddress: String,
	pub mailEncMailBoxSessionKey: Vec<u8>,
	pub pwEncUserGroupKey: Vec<u8>,
	pub recoverCodeEncUserGroupKey: Vec<u8>,
	pub recoverCodeVerifier: Vec<u8>,
	pub salt: Vec<u8>,
	pub userEncContactGroupKey: Vec<u8>,
	pub userEncCustomerGroupKey: Vec<u8>,
	pub userEncEntropy: Vec<u8>,
	pub userEncFileGroupKey: Vec<u8>,
	pub userEncMailGroupKey: Vec<u8>,
	pub userEncRecoverCode: Vec<u8>,
	pub userEncTutanotaPropertiesSessionKey: Vec<u8>,
	pub verifier: Vec<u8>,
}

pub struct UserAreaGroupData {
	pub _id: Id,
	pub adminEncGroupKey: Vec<u8>,
	pub adminKeyVersion: String,
	pub customerEncGroupInfoSessionKey: Vec<u8>,
	pub customerKeyVersion: String,
	pub groupEncGroupRootSessionKey: Vec<u8>,
	pub groupInfoEncName: Vec<u8>,
	pub userEncGroupKey: Vec<u8>,
	pub userKeyVersion: String,
	pub adminGroup: Option<Id>,
}

pub struct UserAreaGroupDeleteData {
	pub _format: String,
	pub group: Id,
}

pub struct UserAreaGroupPostData {
	pub _format: String,
	pub groupData: UserAreaGroupData,
}

pub struct UserSettingsGroupRoot {
	pub _format: String,
	pub _id: Id,
	pub _ownerEncSessionKey: Vec<u8>,
	pub _ownerGroup: Id,
	pub _ownerKeyVersion: String,
	pub _permissions: Id,
	pub startOfTheWeek: String,
	pub timeFormat: String,
	pub usageDataOptedIn: bool,
	pub groupSettings: Vec<GroupSettings>,
}