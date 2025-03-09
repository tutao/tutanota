import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { typeModels } from "./TypeModels.js"
import { Blob } from '../sys/TypeRefs.js'
import { BucketKey } from '../sys/TypeRefs.js'
import { BlobReferenceTokenWrapper } from '../sys/TypeRefs.js'
import { DateWrapper } from '../sys/TypeRefs.js'
import { StringWrapper } from '../sys/TypeRefs.js'
import { GeneratedIdWrapper } from '../sys/TypeRefs.js'
import { IdTupleWrapper } from '../sys/TypeRefs.js'

export const SubfilesTypeRef: TypeRef<Subfiles> = new TypeRef("tutanota", 11)

export function createSubfiles(values: StrippedEntity<Subfiles>): Subfiles {
	return Object.assign(create(typeModels[SubfilesTypeRef.typeId], SubfilesTypeRef), values)
}

export type Subfiles = {
	_type: TypeRef<Subfiles>;

	_id: Id;

	files: Id;
}
export const FileTypeRef: TypeRef<File> = new TypeRef("tutanota", 13)

export function createFile(values: StrippedEntity<File>): File {
	return Object.assign(create(typeModels[FileTypeRef.typeId], FileTypeRef), values)
}

export type File = {
	_type: TypeRef<File>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	cid: null | string;
	mimeType: null | string;
	name: string;
	size: NumberString;

	blobs: Blob[];
	parent: null | IdTuple;
	subFiles: null | Subfiles;
}
export const FileSystemTypeRef: TypeRef<FileSystem> = new TypeRef("tutanota", 28)

export function createFileSystem(values: StrippedEntity<FileSystem>): FileSystem {
	return Object.assign(create(typeModels[FileSystemTypeRef.typeId], FileSystemTypeRef), values)
}

export type FileSystem = {
	_type: TypeRef<FileSystem>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;

	files: Id;
}
export const ContactMailAddressTypeRef: TypeRef<ContactMailAddress> = new TypeRef("tutanota", 44)

export function createContactMailAddress(values: StrippedEntity<ContactMailAddress>): ContactMailAddress {
	return Object.assign(create(typeModels[ContactMailAddressTypeRef.typeId], ContactMailAddressTypeRef), values)
}

export type ContactMailAddress = {
	_type: TypeRef<ContactMailAddress>;

	_id: Id;
	address: string;
	customTypeName: string;
	type: NumberString;
}
export const ContactPhoneNumberTypeRef: TypeRef<ContactPhoneNumber> = new TypeRef("tutanota", 49)

export function createContactPhoneNumber(values: StrippedEntity<ContactPhoneNumber>): ContactPhoneNumber {
	return Object.assign(create(typeModels[ContactPhoneNumberTypeRef.typeId], ContactPhoneNumberTypeRef), values)
}

export type ContactPhoneNumber = {
	_type: TypeRef<ContactPhoneNumber>;

	_id: Id;
	customTypeName: string;
	number: string;
	type: NumberString;
}
export const ContactAddressTypeRef: TypeRef<ContactAddress> = new TypeRef("tutanota", 54)

export function createContactAddress(values: StrippedEntity<ContactAddress>): ContactAddress {
	return Object.assign(create(typeModels[ContactAddressTypeRef.typeId], ContactAddressTypeRef), values)
}

export type ContactAddress = {
	_type: TypeRef<ContactAddress>;

	_id: Id;
	address: string;
	customTypeName: string;
	type: NumberString;
}
export const ContactSocialIdTypeRef: TypeRef<ContactSocialId> = new TypeRef("tutanota", 59)

export function createContactSocialId(values: StrippedEntity<ContactSocialId>): ContactSocialId {
	return Object.assign(create(typeModels[ContactSocialIdTypeRef.typeId], ContactSocialIdTypeRef), values)
}

export type ContactSocialId = {
	_type: TypeRef<ContactSocialId>;

	_id: Id;
	customTypeName: string;
	socialId: string;
	type: NumberString;
}
export const ContactTypeRef: TypeRef<Contact> = new TypeRef("tutanota", 64)

export function createContact(values: StrippedEntity<Contact>): Contact {
	return Object.assign(create(typeModels[ContactTypeRef.typeId], ContactTypeRef), values)
}

export type Contact = {
	_type: TypeRef<Contact>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	birthdayIso: null | string;
	comment: string;
	company: string;
	department: null | string;
	firstName: string;
	lastName: string;
	middleName: null | string;
	nameSuffix: null | string;
	nickname: null | string;
	oldBirthdayDate: null | Date;
	phoneticFirst: null | string;
	phoneticLast: null | string;
	phoneticMiddle: null | string;
	presharedPassword: null | string;
	role: string;
	title: null | string;

	addresses: ContactAddress[];
	customDate: ContactCustomDate[];
	mailAddresses: ContactMailAddress[];
	messengerHandles: ContactMessengerHandle[];
	oldBirthdayAggregate: null | Birthday;
	phoneNumbers: ContactPhoneNumber[];
	photo: null | IdTuple;
	pronouns: ContactPronouns[];
	relationships: ContactRelationship[];
	socialIds: ContactSocialId[];
	websites: ContactWebsite[];
}
export const ConversationEntryTypeRef: TypeRef<ConversationEntry> = new TypeRef("tutanota", 84)

export function createConversationEntry(values: StrippedEntity<ConversationEntry>): ConversationEntry {
	return Object.assign(create(typeModels[ConversationEntryTypeRef.typeId], ConversationEntryTypeRef), values)
}

export type ConversationEntry = {
	_type: TypeRef<ConversationEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	conversationType: NumberString;
	messageId: string;

	mail: null | IdTuple;
	previous: null | IdTuple;
}
export const MailAddressTypeRef: TypeRef<MailAddress> = new TypeRef("tutanota", 92)

export function createMailAddress(values: StrippedEntity<MailAddress>): MailAddress {
	return Object.assign(create(typeModels[MailAddressTypeRef.typeId], MailAddressTypeRef), values)
}

export type MailAddress = {
	_type: TypeRef<MailAddress>;

	_id: Id;
	address: string;
	name: string;

	contact: null | IdTuple;
}
export const MailTypeRef: TypeRef<Mail> = new TypeRef("tutanota", 97)

export function createMail(values: StrippedEntity<Mail>): Mail {
	return Object.assign(create(typeModels[MailTypeRef.typeId], MailTypeRef), values)
}

export type Mail = {
	_type: TypeRef<Mail>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	authStatus: null | NumberString;
	confidential: boolean;
	differentEnvelopeSender: null | string;
	encryptionAuthStatus: null | NumberString;
	listUnsubscribe: boolean;
	method: NumberString;
	movedTime: null | Date;
	phishingStatus: NumberString;
	receivedDate: Date;
	recipientCount: NumberString;
	replyType: NumberString;
	state: NumberString;
	subject: string;
	unread: boolean;

	attachments: IdTuple[];
	bucketKey: null | BucketKey;
	conversationEntry: IdTuple;
	firstRecipient: null | MailAddress;
	mailDetails: null | IdTuple;
	mailDetailsDraft: null | IdTuple;
	sender: MailAddress;
	sets: IdTuple[];
}
export const MailBoxTypeRef: TypeRef<MailBox> = new TypeRef("tutanota", 125)

export function createMailBox(values: StrippedEntity<MailBox>): MailBox {
	return Object.assign(create(typeModels[MailBoxTypeRef.typeId], MailBoxTypeRef), values)
}

export type MailBox = {
	_type: TypeRef<MailBox>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	lastInfoDate: Date;

	archivedMailBags: MailBag[];
	currentMailBag: null | MailBag;
	folders: null | MailFolderRef;
	importedAttachments: Id;
	mailDetailsDrafts: null | MailDetailsDraftsRef;
	mailImportStates: Id;
	receivedAttachments: Id;
	sentAttachments: Id;
	spamResults: null | SpamResults;
}
export const CreateExternalUserGroupDataTypeRef: TypeRef<CreateExternalUserGroupData> = new TypeRef("tutanota", 138)

export function createCreateExternalUserGroupData(values: StrippedEntity<CreateExternalUserGroupData>): CreateExternalUserGroupData {
	return Object.assign(create(typeModels[CreateExternalUserGroupDataTypeRef.typeId], CreateExternalUserGroupDataTypeRef), values)
}

export type CreateExternalUserGroupData = {
	_type: TypeRef<CreateExternalUserGroupData>;

	_id: Id;
	externalPwEncUserGroupKey: Uint8Array;
	internalUserEncUserGroupKey: Uint8Array;
	internalUserGroupKeyVersion: NumberString;
	mailAddress: string;
}
export const ExternalUserDataTypeRef: TypeRef<ExternalUserData> = new TypeRef("tutanota", 145)

export function createExternalUserData(values: StrippedEntity<ExternalUserData>): ExternalUserData {
	return Object.assign(create(typeModels[ExternalUserDataTypeRef.typeId], ExternalUserDataTypeRef), values)
}

export type ExternalUserData = {
	_type: TypeRef<ExternalUserData>;

	_format: NumberString;
	externalMailEncMailBoxSessionKey: Uint8Array;
	externalMailEncMailGroupInfoSessionKey: Uint8Array;
	externalUserEncEntropy: Uint8Array;
	externalUserEncMailGroupKey: Uint8Array;
	externalUserEncTutanotaPropertiesSessionKey: Uint8Array;
	externalUserEncUserGroupInfoSessionKey: Uint8Array;
	internalMailEncMailGroupInfoSessionKey: Uint8Array;
	internalMailEncUserGroupInfoSessionKey: Uint8Array;
	internalMailGroupKeyVersion: NumberString;
	kdfVersion: NumberString;
	verifier: Uint8Array;

	userGroupData: CreateExternalUserGroupData;
}
export const ContactListTypeRef: TypeRef<ContactList> = new TypeRef("tutanota", 153)

export function createContactList(values: StrippedEntity<ContactList>): ContactList {
	return Object.assign(create(typeModels[ContactListTypeRef.typeId], ContactListTypeRef), values)
}

export type ContactList = {
	_type: TypeRef<ContactList>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;

	contacts: Id;
	photos: null | PhotosRef;
}
export const RemoteImapSyncInfoTypeRef: TypeRef<RemoteImapSyncInfo> = new TypeRef("tutanota", 183)

export function createRemoteImapSyncInfo(values: StrippedEntity<RemoteImapSyncInfo>): RemoteImapSyncInfo {
	return Object.assign(create(typeModels[RemoteImapSyncInfoTypeRef.typeId], RemoteImapSyncInfoTypeRef), values)
}

export type RemoteImapSyncInfo = {
	_type: TypeRef<RemoteImapSyncInfo>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	seen: boolean;

	message: IdTuple;
}
export const ImapFolderTypeRef: TypeRef<ImapFolder> = new TypeRef("tutanota", 190)

export function createImapFolder(values: StrippedEntity<ImapFolder>): ImapFolder {
	return Object.assign(create(typeModels[ImapFolderTypeRef.typeId], ImapFolderTypeRef), values)
}

export type ImapFolder = {
	_type: TypeRef<ImapFolder>;

	_id: Id;
	lastseenuid: string;
	name: string;
	uidvalidity: string;

	syncInfo: Id;
}
export const ImapSyncStateTypeRef: TypeRef<ImapSyncState> = new TypeRef("tutanota", 196)

export function createImapSyncState(values: StrippedEntity<ImapSyncState>): ImapSyncState {
	return Object.assign(create(typeModels[ImapSyncStateTypeRef.typeId], ImapSyncStateTypeRef), values)
}

export type ImapSyncState = {
	_type: TypeRef<ImapSyncState>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	folders: ImapFolder[];
}
export const ImapSyncConfigurationTypeRef: TypeRef<ImapSyncConfiguration> = new TypeRef("tutanota", 209)

export function createImapSyncConfiguration(values: StrippedEntity<ImapSyncConfiguration>): ImapSyncConfiguration {
	return Object.assign(create(typeModels[ImapSyncConfigurationTypeRef.typeId], ImapSyncConfigurationTypeRef), values)
}

export type ImapSyncConfiguration = {
	_type: TypeRef<ImapSyncConfiguration>;

	_id: Id;
	host: string;
	password: string;
	port: NumberString;
	user: string;

	imapSyncState: null | Id;
}
export const TutanotaPropertiesTypeRef: TypeRef<TutanotaProperties> = new TypeRef("tutanota", 216)

export function createTutanotaProperties(values: StrippedEntity<TutanotaProperties>): TutanotaProperties {
	return Object.assign(create(typeModels[TutanotaPropertiesTypeRef.typeId], TutanotaPropertiesTypeRef), values)
}

export type TutanotaProperties = {
	_type: TypeRef<TutanotaProperties>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	customEmailSignature: string;
	defaultLabelCreated: boolean;
	defaultSender: null | string;
	defaultUnconfidential: boolean;
	emailSignatureType: NumberString;
	lastSeenAnnouncement: NumberString;
	noAutomaticContacts: boolean;
	notificationMailLanguage: null | string;
	sendPlaintextOnly: boolean;
	userEncEntropy: null | Uint8Array;
	userKeyVersion: null | NumberString;

	imapSyncConfig: ImapSyncConfiguration[];
	inboxRules: InboxRule[];
	lastPushedMail: null | IdTuple;
}
export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", 223)

export function createNotificationMail(values: StrippedEntity<NotificationMail>): NotificationMail {
	return Object.assign(create(typeModels[NotificationMailTypeRef.typeId], NotificationMailTypeRef), values)
}

export type NotificationMail = {
	_type: TypeRef<NotificationMail>;

	_id: Id;
	bodyText: string;
	mailboxLink: string;
	recipientMailAddress: string;
	recipientName: string;
	subject: string;
}
export const DeleteMailDataTypeRef: TypeRef<DeleteMailData> = new TypeRef("tutanota", 419)

export function createDeleteMailData(values: StrippedEntity<DeleteMailData>): DeleteMailData {
	return Object.assign(create(typeModels[DeleteMailDataTypeRef.typeId], DeleteMailDataTypeRef), values)
}

export type DeleteMailData = {
	_type: TypeRef<DeleteMailData>;

	_format: NumberString;

	folder: null | IdTuple;
	mails: IdTuple[];
}
export const MailFolderTypeRef: TypeRef<MailFolder> = new TypeRef("tutanota", 429)

export function createMailFolder(values: StrippedEntity<MailFolder>): MailFolder {
	return Object.assign(create(typeModels[MailFolderTypeRef.typeId], MailFolderTypeRef), values)
}

export type MailFolder = {
	_type: TypeRef<MailFolder>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	color: null | string;
	folderType: NumberString;
	name: string;

	entries: Id;
	parentFolder: null | IdTuple;
}
export const MailFolderRefTypeRef: TypeRef<MailFolderRef> = new TypeRef("tutanota", 440)

export function createMailFolderRef(values: StrippedEntity<MailFolderRef>): MailFolderRef {
	return Object.assign(create(typeModels[MailFolderRefTypeRef.typeId], MailFolderRefTypeRef), values)
}

export type MailFolderRef = {
	_type: TypeRef<MailFolderRef>;

	_id: Id;

	folders: Id;
}
export const MoveMailDataTypeRef: TypeRef<MoveMailData> = new TypeRef("tutanota", 445)

export function createMoveMailData(values: StrippedEntity<MoveMailData>): MoveMailData {
	return Object.assign(create(typeModels[MoveMailDataTypeRef.typeId], MoveMailDataTypeRef), values)
}

export type MoveMailData = {
	_type: TypeRef<MoveMailData>;

	_format: NumberString;

	excludeMailSet: null | IdTuple;
	mails: IdTuple[];
	targetFolder: IdTuple;
}
export const CreateMailFolderDataTypeRef: TypeRef<CreateMailFolderData> = new TypeRef("tutanota", 450)

export function createCreateMailFolderData(values: StrippedEntity<CreateMailFolderData>): CreateMailFolderData {
	return Object.assign(create(typeModels[CreateMailFolderDataTypeRef.typeId], CreateMailFolderDataTypeRef), values)
}

export type CreateMailFolderData = {
	_type: TypeRef<CreateMailFolderData>;
	_errors: Object;

	_format: NumberString;
	folderName: string;
	ownerEncSessionKey: Uint8Array;
	ownerGroup: null | Id;
	ownerKeyVersion: NumberString;

	parentFolder: null | IdTuple;
}
export const CreateMailFolderReturnTypeRef: TypeRef<CreateMailFolderReturn> = new TypeRef("tutanota", 455)

export function createCreateMailFolderReturn(values: StrippedEntity<CreateMailFolderReturn>): CreateMailFolderReturn {
	return Object.assign(create(typeModels[CreateMailFolderReturnTypeRef.typeId], CreateMailFolderReturnTypeRef), values)
}

export type CreateMailFolderReturn = {
	_type: TypeRef<CreateMailFolderReturn>;
	_errors: Object;

	_format: NumberString;

	newFolder: IdTuple;
}
export const DeleteMailFolderDataTypeRef: TypeRef<DeleteMailFolderData> = new TypeRef("tutanota", 458)

export function createDeleteMailFolderData(values: StrippedEntity<DeleteMailFolderData>): DeleteMailFolderData {
	return Object.assign(create(typeModels[DeleteMailFolderDataTypeRef.typeId], DeleteMailFolderDataTypeRef), values)
}

export type DeleteMailFolderData = {
	_type: TypeRef<DeleteMailFolderData>;
	_errors: Object;

	_format: NumberString;

	folders: IdTuple[];
}
export const EncryptTutanotaPropertiesDataTypeRef: TypeRef<EncryptTutanotaPropertiesData> = new TypeRef("tutanota", 473)

export function createEncryptTutanotaPropertiesData(values: StrippedEntity<EncryptTutanotaPropertiesData>): EncryptTutanotaPropertiesData {
	return Object.assign(create(typeModels[EncryptTutanotaPropertiesDataTypeRef.typeId], EncryptTutanotaPropertiesDataTypeRef), values)
}

export type EncryptTutanotaPropertiesData = {
	_type: TypeRef<EncryptTutanotaPropertiesData>;

	_format: NumberString;
	symEncSessionKey: Uint8Array;
	symKeyVersion: NumberString;

	properties: Id;
}
export const DraftRecipientTypeRef: TypeRef<DraftRecipient> = new TypeRef("tutanota", 482)

export function createDraftRecipient(values: StrippedEntity<DraftRecipient>): DraftRecipient {
	return Object.assign(create(typeModels[DraftRecipientTypeRef.typeId], DraftRecipientTypeRef), values)
}

export type DraftRecipient = {
	_type: TypeRef<DraftRecipient>;

	_id: Id;
	mailAddress: string;
	name: string;
}
export const NewDraftAttachmentTypeRef: TypeRef<NewDraftAttachment> = new TypeRef("tutanota", 486)

export function createNewDraftAttachment(values: StrippedEntity<NewDraftAttachment>): NewDraftAttachment {
	return Object.assign(create(typeModels[NewDraftAttachmentTypeRef.typeId], NewDraftAttachmentTypeRef), values)
}

export type NewDraftAttachment = {
	_type: TypeRef<NewDraftAttachment>;

	_id: Id;
	encCid: null | Uint8Array;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const DraftAttachmentTypeRef: TypeRef<DraftAttachment> = new TypeRef("tutanota", 491)

export function createDraftAttachment(values: StrippedEntity<DraftAttachment>): DraftAttachment {
	return Object.assign(create(typeModels[DraftAttachmentTypeRef.typeId], DraftAttachmentTypeRef), values)
}

export type DraftAttachment = {
	_type: TypeRef<DraftAttachment>;

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	existingFile: null | IdTuple;
	newFile: null | NewDraftAttachment;
}
export const DraftDataTypeRef: TypeRef<DraftData> = new TypeRef("tutanota", 496)

export function createDraftData(values: StrippedEntity<DraftData>): DraftData {
	return Object.assign(create(typeModels[DraftDataTypeRef.typeId], DraftDataTypeRef), values)
}

export type DraftData = {
	_type: TypeRef<DraftData>;

	_id: Id;
	bodyText: string;
	compressedBodyText: null | string;
	confidential: boolean;
	method: NumberString;
	senderMailAddress: string;
	senderName: string;
	subject: string;

	addedAttachments: DraftAttachment[];
	bccRecipients: DraftRecipient[];
	ccRecipients: DraftRecipient[];
	removedAttachments: IdTuple[];
	replyTos: EncryptedMailAddress[];
	toRecipients: DraftRecipient[];
}
export const DraftCreateDataTypeRef: TypeRef<DraftCreateData> = new TypeRef("tutanota", 508)

export function createDraftCreateData(values: StrippedEntity<DraftCreateData>): DraftCreateData {
	return Object.assign(create(typeModels[DraftCreateDataTypeRef.typeId], DraftCreateDataTypeRef), values)
}

export type DraftCreateData = {
	_type: TypeRef<DraftCreateData>;
	_errors: Object;

	_format: NumberString;
	conversationType: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	previousMessageId: null | string;

	draftData: DraftData;
}
export const DraftCreateReturnTypeRef: TypeRef<DraftCreateReturn> = new TypeRef("tutanota", 516)

export function createDraftCreateReturn(values: StrippedEntity<DraftCreateReturn>): DraftCreateReturn {
	return Object.assign(create(typeModels[DraftCreateReturnTypeRef.typeId], DraftCreateReturnTypeRef), values)
}

export type DraftCreateReturn = {
	_type: TypeRef<DraftCreateReturn>;

	_format: NumberString;

	draft: IdTuple;
}
export const DraftUpdateDataTypeRef: TypeRef<DraftUpdateData> = new TypeRef("tutanota", 519)

export function createDraftUpdateData(values: StrippedEntity<DraftUpdateData>): DraftUpdateData {
	return Object.assign(create(typeModels[DraftUpdateDataTypeRef.typeId], DraftUpdateDataTypeRef), values)
}

export type DraftUpdateData = {
	_type: TypeRef<DraftUpdateData>;
	_errors: Object;

	_format: NumberString;

	draft: IdTuple;
	draftData: DraftData;
}
export const DraftUpdateReturnTypeRef: TypeRef<DraftUpdateReturn> = new TypeRef("tutanota", 523)

export function createDraftUpdateReturn(values: StrippedEntity<DraftUpdateReturn>): DraftUpdateReturn {
	return Object.assign(create(typeModels[DraftUpdateReturnTypeRef.typeId], DraftUpdateReturnTypeRef), values)
}

export type DraftUpdateReturn = {
	_type: TypeRef<DraftUpdateReturn>;
	_errors: Object;

	_format: NumberString;

	attachments: IdTuple[];
}
export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", 527)

export function createInternalRecipientKeyData(values: StrippedEntity<InternalRecipientKeyData>): InternalRecipientKeyData {
	return Object.assign(create(typeModels[InternalRecipientKeyDataTypeRef.typeId], InternalRecipientKeyDataTypeRef), values)
}

export type InternalRecipientKeyData = {
	_type: TypeRef<InternalRecipientKeyData>;

	_id: Id;
	mailAddress: string;
	protocolVersion: NumberString;
	pubEncBucketKey: Uint8Array;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;
}
export const SecureExternalRecipientKeyDataTypeRef: TypeRef<SecureExternalRecipientKeyData> = new TypeRef("tutanota", 532)

export function createSecureExternalRecipientKeyData(values: StrippedEntity<SecureExternalRecipientKeyData>): SecureExternalRecipientKeyData {
	return Object.assign(create(typeModels[SecureExternalRecipientKeyDataTypeRef.typeId], SecureExternalRecipientKeyDataTypeRef), values)
}

export type SecureExternalRecipientKeyData = {
	_type: TypeRef<SecureExternalRecipientKeyData>;

	_id: Id;
	kdfVersion: NumberString;
	mailAddress: string;
	ownerEncBucketKey: Uint8Array;
	ownerKeyVersion: NumberString;
	passwordVerifier: Uint8Array;
	pwEncCommunicationKey: null | Uint8Array;
	salt: null | Uint8Array;
	saltHash: null | Uint8Array;
	userGroupKeyVersion: NumberString;
}
export const AttachmentKeyDataTypeRef: TypeRef<AttachmentKeyData> = new TypeRef("tutanota", 542)

export function createAttachmentKeyData(values: StrippedEntity<AttachmentKeyData>): AttachmentKeyData {
	return Object.assign(create(typeModels[AttachmentKeyDataTypeRef.typeId], AttachmentKeyDataTypeRef), values)
}

export type AttachmentKeyData = {
	_type: TypeRef<AttachmentKeyData>;

	_id: Id;
	bucketEncFileSessionKey: null | Uint8Array;
	fileSessionKey: null | Uint8Array;

	file: IdTuple;
}
export const SendDraftDataTypeRef: TypeRef<SendDraftData> = new TypeRef("tutanota", 547)

export function createSendDraftData(values: StrippedEntity<SendDraftData>): SendDraftData {
	return Object.assign(create(typeModels[SendDraftDataTypeRef.typeId], SendDraftDataTypeRef), values)
}

export type SendDraftData = {
	_type: TypeRef<SendDraftData>;

	_format: NumberString;
	bucketEncMailSessionKey: null | Uint8Array;
	calendarMethod: boolean;
	language: string;
	mailSessionKey: null | Uint8Array;
	plaintext: boolean;
	senderNameUnencrypted: null | string;
	sessionEncEncryptionAuthStatus: null | Uint8Array;

	attachmentKeyData: AttachmentKeyData[];
	internalRecipientKeyData: InternalRecipientKeyData[];
	mail: IdTuple;
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[];
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[];
}
export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", 557)

export function createSendDraftReturn(values: StrippedEntity<SendDraftReturn>): SendDraftReturn {
	return Object.assign(create(typeModels[SendDraftReturnTypeRef.typeId], SendDraftReturnTypeRef), values)
}

export type SendDraftReturn = {
	_type: TypeRef<SendDraftReturn>;

	_format: NumberString;
	messageId: string;
	sentDate: Date;

	notifications: NotificationMail[];
	sentMail: IdTuple;
}
export const ReceiveInfoServiceDataTypeRef: TypeRef<ReceiveInfoServiceData> = new TypeRef("tutanota", 570)

export function createReceiveInfoServiceData(values: StrippedEntity<ReceiveInfoServiceData>): ReceiveInfoServiceData {
	return Object.assign(create(typeModels[ReceiveInfoServiceDataTypeRef.typeId], ReceiveInfoServiceDataTypeRef), values)
}

export type ReceiveInfoServiceData = {
	_type: TypeRef<ReceiveInfoServiceData>;

	_format: NumberString;
	language: string;
}
export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", 573)

export function createInboxRule(values: StrippedEntity<InboxRule>): InboxRule {
	return Object.assign(create(typeModels[InboxRuleTypeRef.typeId], InboxRuleTypeRef), values)
}

export type InboxRule = {
	_type: TypeRef<InboxRule>;

	_id: Id;
	type: string;
	value: string;

	targetFolder: IdTuple;
}
export const EncryptedMailAddressTypeRef: TypeRef<EncryptedMailAddress> = new TypeRef("tutanota", 612)

export function createEncryptedMailAddress(values: StrippedEntity<EncryptedMailAddress>): EncryptedMailAddress {
	return Object.assign(create(typeModels[EncryptedMailAddressTypeRef.typeId], EncryptedMailAddressTypeRef), values)
}

export type EncryptedMailAddress = {
	_type: TypeRef<EncryptedMailAddress>;

	_id: Id;
	address: string;
	name: string;
}
export const UserAccountUserDataTypeRef: TypeRef<UserAccountUserData> = new TypeRef("tutanota", 622)

export function createUserAccountUserData(values: StrippedEntity<UserAccountUserData>): UserAccountUserData {
	return Object.assign(create(typeModels[UserAccountUserDataTypeRef.typeId], UserAccountUserDataTypeRef), values)
}

export type UserAccountUserData = {
	_type: TypeRef<UserAccountUserData>;

	_id: Id;
	contactEncContactListSessionKey: Uint8Array;
	customerEncContactGroupInfoSessionKey: Uint8Array;
	customerEncFileGroupInfoSessionKey: Uint8Array;
	customerEncMailGroupInfoSessionKey: Uint8Array;
	customerKeyVersion: NumberString;
	encryptedName: Uint8Array;
	fileEncFileSystemSessionKey: Uint8Array;
	kdfVersion: NumberString;
	mailAddress: string;
	mailEncMailBoxSessionKey: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	recoverCodeEncUserGroupKey: Uint8Array;
	recoverCodeVerifier: Uint8Array;
	salt: Uint8Array;
	userEncContactGroupKey: Uint8Array;
	userEncCustomerGroupKey: Uint8Array;
	userEncEntropy: Uint8Array;
	userEncFileGroupKey: Uint8Array;
	userEncMailGroupKey: Uint8Array;
	userEncRecoverCode: Uint8Array;
	userEncTutanotaPropertiesSessionKey: Uint8Array;
	verifier: Uint8Array;
}
export const InternalGroupDataTypeRef: TypeRef<InternalGroupData> = new TypeRef("tutanota", 642)

export function createInternalGroupData(values: StrippedEntity<InternalGroupData>): InternalGroupData {
	return Object.assign(create(typeModels[InternalGroupDataTypeRef.typeId], InternalGroupDataTypeRef), values)
}

export type InternalGroupData = {
	_type: TypeRef<InternalGroupData>;

	_id: Id;
	adminEncGroupKey: Uint8Array;
	adminKeyVersion: NumberString;
	groupEncPrivEccKey: null | Uint8Array;
	groupEncPrivKyberKey: null | Uint8Array;
	groupEncPrivRsaKey: null | Uint8Array;
	ownerEncGroupInfoSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	pubEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;
	pubRsaKey: null | Uint8Array;

	adminGroup: null | Id;
}
export const CustomerAccountCreateDataTypeRef: TypeRef<CustomerAccountCreateData> = new TypeRef("tutanota", 648)

export function createCustomerAccountCreateData(values: StrippedEntity<CustomerAccountCreateData>): CustomerAccountCreateData {
	return Object.assign(create(typeModels[CustomerAccountCreateDataTypeRef.typeId], CustomerAccountCreateDataTypeRef), values)
}

export type CustomerAccountCreateData = {
	_type: TypeRef<CustomerAccountCreateData>;

	_format: NumberString;
	accountGroupKeyVersion: NumberString;
	adminEncAccountingInfoSessionKey: Uint8Array;
	adminEncCustomerServerPropertiesSessionKey: Uint8Array;
	app: NumberString;
	authToken: string;
	code: string;
	date: null | Date;
	lang: string;
	systemAdminPubEncAccountingInfoSessionKey: Uint8Array;
	systemAdminPubKeyVersion: NumberString;
	systemAdminPublicProtocolVersion: NumberString;
	userEncAccountGroupKey: Uint8Array;
	userEncAdminGroupKey: Uint8Array;

	adminGroupData: InternalGroupData;
	customerGroupData: InternalGroupData;
	userData: UserAccountUserData;
	userGroupData: InternalGroupData;
}
export const UserAccountCreateDataTypeRef: TypeRef<UserAccountCreateData> = new TypeRef("tutanota", 663)

export function createUserAccountCreateData(values: StrippedEntity<UserAccountCreateData>): UserAccountCreateData {
	return Object.assign(create(typeModels[UserAccountCreateDataTypeRef.typeId], UserAccountCreateDataTypeRef), values)
}

export type UserAccountCreateData = {
	_type: TypeRef<UserAccountCreateData>;

	_format: NumberString;
	date: null | Date;

	userData: UserAccountUserData;
	userGroupData: InternalGroupData;
}
export const MailboxServerPropertiesTypeRef: TypeRef<MailboxServerProperties> = new TypeRef("tutanota", 677)

export function createMailboxServerProperties(values: StrippedEntity<MailboxServerProperties>): MailboxServerProperties {
	return Object.assign(create(typeModels[MailboxServerPropertiesTypeRef.typeId], MailboxServerPropertiesTypeRef), values)
}

export type MailboxServerProperties = {
	_type: TypeRef<MailboxServerProperties>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	whitelistProtectionEnabled: boolean;
}
export const MailboxGroupRootTypeRef: TypeRef<MailboxGroupRoot> = new TypeRef("tutanota", 693)

export function createMailboxGroupRoot(values: StrippedEntity<MailboxGroupRoot>): MailboxGroupRoot {
	return Object.assign(create(typeModels[MailboxGroupRootTypeRef.typeId], MailboxGroupRootTypeRef), values)
}

export type MailboxGroupRoot = {
	_type: TypeRef<MailboxGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	calendarEventUpdates: null | CalendarEventUpdateList;
	mailbox: Id;
	mailboxProperties: null | Id;
	outOfOfficeNotification: null | Id;
	outOfOfficeNotificationRecipientList: null | OutOfOfficeNotificationRecipientList;
	serverProperties: Id;
}
export const CreateMailGroupDataTypeRef: TypeRef<CreateMailGroupData> = new TypeRef("tutanota", 707)

export function createCreateMailGroupData(values: StrippedEntity<CreateMailGroupData>): CreateMailGroupData {
	return Object.assign(create(typeModels[CreateMailGroupDataTypeRef.typeId], CreateMailGroupDataTypeRef), values)
}

export type CreateMailGroupData = {
	_type: TypeRef<CreateMailGroupData>;

	_format: NumberString;
	encryptedName: Uint8Array;
	mailAddress: string;
	mailEncMailboxSessionKey: Uint8Array;

	groupData: InternalGroupData;
}
export const DeleteGroupDataTypeRef: TypeRef<DeleteGroupData> = new TypeRef("tutanota", 713)

export function createDeleteGroupData(values: StrippedEntity<DeleteGroupData>): DeleteGroupData {
	return Object.assign(create(typeModels[DeleteGroupDataTypeRef.typeId], DeleteGroupDataTypeRef), values)
}

export type DeleteGroupData = {
	_type: TypeRef<DeleteGroupData>;

	_format: NumberString;
	restore: boolean;

	group: Id;
}
export const BirthdayTypeRef: TypeRef<Birthday> = new TypeRef("tutanota", 844)

export function createBirthday(values: StrippedEntity<Birthday>): Birthday {
	return Object.assign(create(typeModels[BirthdayTypeRef.typeId], BirthdayTypeRef), values)
}

export type Birthday = {
	_type: TypeRef<Birthday>;

	_id: Id;
	day: NumberString;
	month: NumberString;
	year: null | NumberString;
}
export const PhotosRefTypeRef: TypeRef<PhotosRef> = new TypeRef("tutanota", 853)

export function createPhotosRef(values: StrippedEntity<PhotosRef>): PhotosRef {
	return Object.assign(create(typeModels[PhotosRefTypeRef.typeId], PhotosRefTypeRef), values)
}

export type PhotosRef = {
	_type: TypeRef<PhotosRef>;

	_id: Id;

	files: Id;
}
export const ListUnsubscribeDataTypeRef: TypeRef<ListUnsubscribeData> = new TypeRef("tutanota", 867)

export function createListUnsubscribeData(values: StrippedEntity<ListUnsubscribeData>): ListUnsubscribeData {
	return Object.assign(create(typeModels[ListUnsubscribeDataTypeRef.typeId], ListUnsubscribeDataTypeRef), values)
}

export type ListUnsubscribeData = {
	_type: TypeRef<ListUnsubscribeData>;

	_format: NumberString;
	headers: string;
	recipient: string;

	mail: IdTuple;
}
export const CalendarRepeatRuleTypeRef: TypeRef<CalendarRepeatRule> = new TypeRef("tutanota", 926)

export function createCalendarRepeatRule(values: StrippedEntity<CalendarRepeatRule>): CalendarRepeatRule {
	return Object.assign(create(typeModels[CalendarRepeatRuleTypeRef.typeId], CalendarRepeatRuleTypeRef), values)
}

export type CalendarRepeatRule = {
	_type: TypeRef<CalendarRepeatRule>;

	_id: Id;
	endType: NumberString;
	endValue: null | NumberString;
	frequency: NumberString;
	interval: NumberString;
	timeZone: string;

	advancedRules: AdvancedRepeatRule[];
	excludedDates: DateWrapper[];
}
export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", 933)

export function createCalendarEvent(values: StrippedEntity<CalendarEvent>): CalendarEvent {
	return Object.assign(create(typeModels[CalendarEventTypeRef.typeId], CalendarEventTypeRef), values)
}

export type CalendarEvent = {
	_type: TypeRef<CalendarEvent>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	description: string;
	endTime: Date;
	hashedUid: null | Uint8Array;
	invitedConfidentially: null | boolean;
	location: string;
	recurrenceId: null | Date;
	sequence: NumberString;
	startTime: Date;
	summary: string;
	uid: null | string;

	alarmInfos: IdTuple[];
	attendees: CalendarEventAttendee[];
	organizer: null | EncryptedMailAddress;
	repeatRule: null | CalendarRepeatRule;
}
export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", 947)

export function createCalendarGroupRoot(values: StrippedEntity<CalendarGroupRoot>): CalendarGroupRoot {
	return Object.assign(create(typeModels[CalendarGroupRootTypeRef.typeId], CalendarGroupRootTypeRef), values)
}

export type CalendarGroupRoot = {
	_type: TypeRef<CalendarGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;

	index: null | CalendarEventIndexRef;
	longEvents: Id;
	shortEvents: Id;
}
export const UserAreaGroupDataTypeRef: TypeRef<UserAreaGroupData> = new TypeRef("tutanota", 956)

export function createUserAreaGroupData(values: StrippedEntity<UserAreaGroupData>): UserAreaGroupData {
	return Object.assign(create(typeModels[UserAreaGroupDataTypeRef.typeId], UserAreaGroupDataTypeRef), values)
}

export type UserAreaGroupData = {
	_type: TypeRef<UserAreaGroupData>;

	_id: Id;
	adminEncGroupKey: null | Uint8Array;
	adminKeyVersion: null | NumberString;
	customerEncGroupInfoSessionKey: Uint8Array;
	customerKeyVersion: NumberString;
	groupEncGroupRootSessionKey: Uint8Array;
	groupInfoEncName: Uint8Array;
	userEncGroupKey: Uint8Array;
	userKeyVersion: NumberString;

	adminGroup: null | Id;
}
export const UserAreaGroupPostDataTypeRef: TypeRef<UserAreaGroupPostData> = new TypeRef("tutanota", 964)

export function createUserAreaGroupPostData(values: StrippedEntity<UserAreaGroupPostData>): UserAreaGroupPostData {
	return Object.assign(create(typeModels[UserAreaGroupPostDataTypeRef.typeId], UserAreaGroupPostDataTypeRef), values)
}

export type UserAreaGroupPostData = {
	_type: TypeRef<UserAreaGroupPostData>;

	_format: NumberString;

	groupData: UserAreaGroupData;
}
export const GroupSettingsTypeRef: TypeRef<GroupSettings> = new TypeRef("tutanota", 968)

export function createGroupSettings(values: StrippedEntity<GroupSettings>): GroupSettings {
	return Object.assign(create(typeModels[GroupSettingsTypeRef.typeId], GroupSettingsTypeRef), values)
}

export type GroupSettings = {
	_type: TypeRef<GroupSettings>;

	_id: Id;
	color: string;
	name: null | string;
	sourceUrl: null | string;

	defaultAlarmsList: DefaultAlarmInfo[];
	group: Id;
}
export const UserSettingsGroupRootTypeRef: TypeRef<UserSettingsGroupRoot> = new TypeRef("tutanota", 972)

export function createUserSettingsGroupRoot(values: StrippedEntity<UserSettingsGroupRoot>): UserSettingsGroupRoot {
	return Object.assign(create(typeModels[UserSettingsGroupRootTypeRef.typeId], UserSettingsGroupRootTypeRef), values)
}

export type UserSettingsGroupRoot = {
	_type: TypeRef<UserSettingsGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	startOfTheWeek: NumberString;
	timeFormat: NumberString;
	usageDataOptedIn: null | boolean;

	groupSettings: GroupSettings[];
}
export const CalendarDeleteDataTypeRef: TypeRef<CalendarDeleteData> = new TypeRef("tutanota", 982)

export function createCalendarDeleteData(values: StrippedEntity<CalendarDeleteData>): CalendarDeleteData {
	return Object.assign(create(typeModels[CalendarDeleteDataTypeRef.typeId], CalendarDeleteDataTypeRef), values)
}

export type CalendarDeleteData = {
	_type: TypeRef<CalendarDeleteData>;

	_format: NumberString;

	groupRootId: Id;
}
export const CreateGroupPostReturnTypeRef: TypeRef<CreateGroupPostReturn> = new TypeRef("tutanota", 985)

export function createCreateGroupPostReturn(values: StrippedEntity<CreateGroupPostReturn>): CreateGroupPostReturn {
	return Object.assign(create(typeModels[CreateGroupPostReturnTypeRef.typeId], CreateGroupPostReturnTypeRef), values)
}

export type CreateGroupPostReturn = {
	_type: TypeRef<CreateGroupPostReturn>;
	_errors: Object;

	_format: NumberString;

	group: Id;
}
export const SharedGroupDataTypeRef: TypeRef<SharedGroupData> = new TypeRef("tutanota", 992)

export function createSharedGroupData(values: StrippedEntity<SharedGroupData>): SharedGroupData {
	return Object.assign(create(typeModels[SharedGroupDataTypeRef.typeId], SharedGroupDataTypeRef), values)
}

export type SharedGroupData = {
	_type: TypeRef<SharedGroupData>;

	_id: Id;
	bucketEncInvitationSessionKey: Uint8Array;
	capability: NumberString;
	sessionEncInviterName: Uint8Array;
	sessionEncSharedGroupKey: Uint8Array;
	sessionEncSharedGroupName: Uint8Array;
	sharedGroup: Id;
	sharedGroupEncInviterGroupInfoKey: Uint8Array;
	sharedGroupEncSharedGroupInfoKey: Uint8Array;
	sharedGroupKeyVersion: NumberString;
}
export const GroupInvitationPostDataTypeRef: TypeRef<GroupInvitationPostData> = new TypeRef("tutanota", 1002)

export function createGroupInvitationPostData(values: StrippedEntity<GroupInvitationPostData>): GroupInvitationPostData {
	return Object.assign(create(typeModels[GroupInvitationPostDataTypeRef.typeId], GroupInvitationPostDataTypeRef), values)
}

export type GroupInvitationPostData = {
	_type: TypeRef<GroupInvitationPostData>;

	_format: NumberString;

	internalKeyData: InternalRecipientKeyData[];
	sharedGroupData: SharedGroupData;
}
export const GroupInvitationPostReturnTypeRef: TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", 1006)

export function createGroupInvitationPostReturn(values: StrippedEntity<GroupInvitationPostReturn>): GroupInvitationPostReturn {
	return Object.assign(create(typeModels[GroupInvitationPostReturnTypeRef.typeId], GroupInvitationPostReturnTypeRef), values)
}

export type GroupInvitationPostReturn = {
	_type: TypeRef<GroupInvitationPostReturn>;

	_format: NumberString;

	existingMailAddresses: MailAddress[];
	invalidMailAddresses: MailAddress[];
	invitedMailAddresses: MailAddress[];
}
export const GroupInvitationPutDataTypeRef: TypeRef<GroupInvitationPutData> = new TypeRef("tutanota", 1011)

export function createGroupInvitationPutData(values: StrippedEntity<GroupInvitationPutData>): GroupInvitationPutData {
	return Object.assign(create(typeModels[GroupInvitationPutDataTypeRef.typeId], GroupInvitationPutDataTypeRef), values)
}

export type GroupInvitationPutData = {
	_type: TypeRef<GroupInvitationPutData>;

	_format: NumberString;
	sharedGroupEncInviteeGroupInfoKey: Uint8Array;
	sharedGroupKeyVersion: NumberString;
	userGroupEncGroupKey: Uint8Array;
	userGroupKeyVersion: NumberString;

	receivedInvitation: IdTuple;
}
export const GroupInvitationDeleteDataTypeRef: TypeRef<GroupInvitationDeleteData> = new TypeRef("tutanota", 1016)

export function createGroupInvitationDeleteData(values: StrippedEntity<GroupInvitationDeleteData>): GroupInvitationDeleteData {
	return Object.assign(create(typeModels[GroupInvitationDeleteDataTypeRef.typeId], GroupInvitationDeleteDataTypeRef), values)
}

export type GroupInvitationDeleteData = {
	_type: TypeRef<GroupInvitationDeleteData>;

	_format: NumberString;

	receivedInvitation: IdTuple;
}
export const ReportedMailFieldMarkerTypeRef: TypeRef<ReportedMailFieldMarker> = new TypeRef("tutanota", 1023)

export function createReportedMailFieldMarker(values: StrippedEntity<ReportedMailFieldMarker>): ReportedMailFieldMarker {
	return Object.assign(create(typeModels[ReportedMailFieldMarkerTypeRef.typeId], ReportedMailFieldMarkerTypeRef), values)
}

export type ReportedMailFieldMarker = {
	_type: TypeRef<ReportedMailFieldMarker>;

	_id: Id;
	marker: string;
	status: NumberString;
}
export const PhishingMarkerWebsocketDataTypeRef: TypeRef<PhishingMarkerWebsocketData> = new TypeRef("tutanota", 1034)

export function createPhishingMarkerWebsocketData(values: StrippedEntity<PhishingMarkerWebsocketData>): PhishingMarkerWebsocketData {
	return Object.assign(create(typeModels[PhishingMarkerWebsocketDataTypeRef.typeId], PhishingMarkerWebsocketDataTypeRef), values)
}

export type PhishingMarkerWebsocketData = {
	_type: TypeRef<PhishingMarkerWebsocketData>;

	_format: NumberString;
	lastId: Id;

	markers: ReportedMailFieldMarker[];
}
export const ReportMailPostDataTypeRef: TypeRef<ReportMailPostData> = new TypeRef("tutanota", 1066)

export function createReportMailPostData(values: StrippedEntity<ReportMailPostData>): ReportMailPostData {
	return Object.assign(create(typeModels[ReportMailPostDataTypeRef.typeId], ReportMailPostDataTypeRef), values)
}

export type ReportMailPostData = {
	_type: TypeRef<ReportMailPostData>;

	_format: NumberString;
	mailSessionKey: Uint8Array;
	reportType: NumberString;

	mailId: IdTuple;
}
export const CalendarEventAttendeeTypeRef: TypeRef<CalendarEventAttendee> = new TypeRef("tutanota", 1084)

export function createCalendarEventAttendee(values: StrippedEntity<CalendarEventAttendee>): CalendarEventAttendee {
	return Object.assign(create(typeModels[CalendarEventAttendeeTypeRef.typeId], CalendarEventAttendeeTypeRef), values)
}

export type CalendarEventAttendee = {
	_type: TypeRef<CalendarEventAttendee>;

	_id: Id;
	status: NumberString;

	address: EncryptedMailAddress;
}
export const CalendarEventUidIndexTypeRef: TypeRef<CalendarEventUidIndex> = new TypeRef("tutanota", 1093)

export function createCalendarEventUidIndex(values: StrippedEntity<CalendarEventUidIndex>): CalendarEventUidIndex {
	return Object.assign(create(typeModels[CalendarEventUidIndexTypeRef.typeId], CalendarEventUidIndexTypeRef), values)
}

export type CalendarEventUidIndex = {
	_type: TypeRef<CalendarEventUidIndex>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	alteredInstances: IdTuple[];
	progenitor: null | IdTuple;
}
export const CalendarEventIndexRefTypeRef: TypeRef<CalendarEventIndexRef> = new TypeRef("tutanota", 1100)

export function createCalendarEventIndexRef(values: StrippedEntity<CalendarEventIndexRef>): CalendarEventIndexRef {
	return Object.assign(create(typeModels[CalendarEventIndexRefTypeRef.typeId], CalendarEventIndexRefTypeRef), values)
}

export type CalendarEventIndexRef = {
	_type: TypeRef<CalendarEventIndexRef>;

	_id: Id;

	list: Id;
}
export const CalendarEventUpdateTypeRef: TypeRef<CalendarEventUpdate> = new TypeRef("tutanota", 1104)

export function createCalendarEventUpdate(values: StrippedEntity<CalendarEventUpdate>): CalendarEventUpdate {
	return Object.assign(create(typeModels[CalendarEventUpdateTypeRef.typeId], CalendarEventUpdateTypeRef), values)
}

export type CalendarEventUpdate = {
	_type: TypeRef<CalendarEventUpdate>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	sender: string;

	file: IdTuple;
}
export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", 1113)

export function createCalendarEventUpdateList(values: StrippedEntity<CalendarEventUpdateList>): CalendarEventUpdateList {
	return Object.assign(create(typeModels[CalendarEventUpdateListTypeRef.typeId], CalendarEventUpdateListTypeRef), values)
}

export type CalendarEventUpdateList = {
	_type: TypeRef<CalendarEventUpdateList>;

	_id: Id;

	list: Id;
}
export const EntropyDataTypeRef: TypeRef<EntropyData> = new TypeRef("tutanota", 1122)

export function createEntropyData(values: StrippedEntity<EntropyData>): EntropyData {
	return Object.assign(create(typeModels[EntropyDataTypeRef.typeId], EntropyDataTypeRef), values)
}

export type EntropyData = {
	_type: TypeRef<EntropyData>;

	_format: NumberString;
	userEncEntropy: Uint8Array;
	userKeyVersion: NumberString;
}
export const OutOfOfficeNotificationMessageTypeRef: TypeRef<OutOfOfficeNotificationMessage> = new TypeRef("tutanota", 1126)

export function createOutOfOfficeNotificationMessage(values: StrippedEntity<OutOfOfficeNotificationMessage>): OutOfOfficeNotificationMessage {
	return Object.assign(create(typeModels[OutOfOfficeNotificationMessageTypeRef.typeId], OutOfOfficeNotificationMessageTypeRef), values)
}

export type OutOfOfficeNotificationMessage = {
	_type: TypeRef<OutOfOfficeNotificationMessage>;

	_id: Id;
	message: string;
	subject: string;
	type: NumberString;
}
export const OutOfOfficeNotificationTypeRef: TypeRef<OutOfOfficeNotification> = new TypeRef("tutanota", 1131)

export function createOutOfOfficeNotification(values: StrippedEntity<OutOfOfficeNotification>): OutOfOfficeNotification {
	return Object.assign(create(typeModels[OutOfOfficeNotificationTypeRef.typeId], OutOfOfficeNotificationTypeRef), values)
}

export type OutOfOfficeNotification = {
	_type: TypeRef<OutOfOfficeNotification>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	enabled: boolean;
	endDate: null | Date;
	startDate: null | Date;

	notifications: OutOfOfficeNotificationMessage[];
}
export const OutOfOfficeNotificationRecipientListTypeRef: TypeRef<OutOfOfficeNotificationRecipientList> = new TypeRef("tutanota", 1147)

export function createOutOfOfficeNotificationRecipientList(values: StrippedEntity<OutOfOfficeNotificationRecipientList>): OutOfOfficeNotificationRecipientList {
	return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientListTypeRef.typeId], OutOfOfficeNotificationRecipientListTypeRef), values)
}

export type OutOfOfficeNotificationRecipientList = {
	_type: TypeRef<OutOfOfficeNotificationRecipientList>;

	_id: Id;

	list: Id;
}
export const EmailTemplateContentTypeRef: TypeRef<EmailTemplateContent> = new TypeRef("tutanota", 1154)

export function createEmailTemplateContent(values: StrippedEntity<EmailTemplateContent>): EmailTemplateContent {
	return Object.assign(create(typeModels[EmailTemplateContentTypeRef.typeId], EmailTemplateContentTypeRef), values)
}

export type EmailTemplateContent = {
	_type: TypeRef<EmailTemplateContent>;

	_id: Id;
	languageCode: string;
	text: string;
}
export const EmailTemplateTypeRef: TypeRef<EmailTemplate> = new TypeRef("tutanota", 1158)

export function createEmailTemplate(values: StrippedEntity<EmailTemplate>): EmailTemplate {
	return Object.assign(create(typeModels[EmailTemplateTypeRef.typeId], EmailTemplateTypeRef), values)
}

export type EmailTemplate = {
	_type: TypeRef<EmailTemplate>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	tag: string;
	title: string;

	contents: EmailTemplateContent[];
}
export const KnowledgeBaseEntryKeywordTypeRef: TypeRef<KnowledgeBaseEntryKeyword> = new TypeRef("tutanota", 1168)

export function createKnowledgeBaseEntryKeyword(values: StrippedEntity<KnowledgeBaseEntryKeyword>): KnowledgeBaseEntryKeyword {
	return Object.assign(create(typeModels[KnowledgeBaseEntryKeywordTypeRef.typeId], KnowledgeBaseEntryKeywordTypeRef), values)
}

export type KnowledgeBaseEntryKeyword = {
	_type: TypeRef<KnowledgeBaseEntryKeyword>;

	_id: Id;
	keyword: string;
}
export const KnowledgeBaseEntryTypeRef: TypeRef<KnowledgeBaseEntry> = new TypeRef("tutanota", 1171)

export function createKnowledgeBaseEntry(values: StrippedEntity<KnowledgeBaseEntry>): KnowledgeBaseEntry {
	return Object.assign(create(typeModels[KnowledgeBaseEntryTypeRef.typeId], KnowledgeBaseEntryTypeRef), values)
}

export type KnowledgeBaseEntry = {
	_type: TypeRef<KnowledgeBaseEntry>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	description: string;
	title: string;

	keywords: KnowledgeBaseEntryKeyword[];
}
export const TemplateGroupRootTypeRef: TypeRef<TemplateGroupRoot> = new TypeRef("tutanota", 1181)

export function createTemplateGroupRoot(values: StrippedEntity<TemplateGroupRoot>): TemplateGroupRoot {
	return Object.assign(create(typeModels[TemplateGroupRootTypeRef.typeId], TemplateGroupRootTypeRef), values)
}

export type TemplateGroupRoot = {
	_type: TypeRef<TemplateGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;

	knowledgeBase: Id;
	templates: Id;
}
export const UserAreaGroupDeleteDataTypeRef: TypeRef<UserAreaGroupDeleteData> = new TypeRef("tutanota", 1190)

export function createUserAreaGroupDeleteData(values: StrippedEntity<UserAreaGroupDeleteData>): UserAreaGroupDeleteData {
	return Object.assign(create(typeModels[UserAreaGroupDeleteDataTypeRef.typeId], UserAreaGroupDeleteDataTypeRef), values)
}

export type UserAreaGroupDeleteData = {
	_type: TypeRef<UserAreaGroupDeleteData>;

	_format: NumberString;

	group: Id;
}
export const MailboxPropertiesTypeRef: TypeRef<MailboxProperties> = new TypeRef("tutanota", 1195)

export function createMailboxProperties(values: StrippedEntity<MailboxProperties>): MailboxProperties {
	return Object.assign(create(typeModels[MailboxPropertiesTypeRef.typeId], MailboxPropertiesTypeRef), values)
}

export type MailboxProperties = {
	_type: TypeRef<MailboxProperties>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	reportMovedMails: NumberString;

	mailAddressProperties: MailAddressProperties[];
}
export const SpamResultsTypeRef: TypeRef<SpamResults> = new TypeRef("tutanota", 1217)

export function createSpamResults(values: StrippedEntity<SpamResults>): SpamResults {
	return Object.assign(create(typeModels[SpamResultsTypeRef.typeId], SpamResultsTypeRef), values)
}

export type SpamResults = {
	_type: TypeRef<SpamResults>;

	_id: Id;

	list: Id;
}
export const NewsIdTypeRef: TypeRef<NewsId> = new TypeRef("tutanota", 1245)

export function createNewsId(values: StrippedEntity<NewsId>): NewsId {
	return Object.assign(create(typeModels[NewsIdTypeRef.typeId], NewsIdTypeRef), values)
}

export type NewsId = {
	_type: TypeRef<NewsId>;

	_id: Id;
	newsItemId: Id;
	newsItemName: string;
}
export const NewsOutTypeRef: TypeRef<NewsOut> = new TypeRef("tutanota", 1256)

export function createNewsOut(values: StrippedEntity<NewsOut>): NewsOut {
	return Object.assign(create(typeModels[NewsOutTypeRef.typeId], NewsOutTypeRef), values)
}

export type NewsOut = {
	_type: TypeRef<NewsOut>;

	_format: NumberString;

	newsItemIds: NewsId[];
}
export const NewsInTypeRef: TypeRef<NewsIn> = new TypeRef("tutanota", 1259)

export function createNewsIn(values: StrippedEntity<NewsIn>): NewsIn {
	return Object.assign(create(typeModels[NewsInTypeRef.typeId], NewsInTypeRef), values)
}

export type NewsIn = {
	_type: TypeRef<NewsIn>;

	_format: NumberString;
	newsItemId: null | Id;
}
export const MailAddressPropertiesTypeRef: TypeRef<MailAddressProperties> = new TypeRef("tutanota", 1263)

export function createMailAddressProperties(values: StrippedEntity<MailAddressProperties>): MailAddressProperties {
	return Object.assign(create(typeModels[MailAddressPropertiesTypeRef.typeId], MailAddressPropertiesTypeRef), values)
}

export type MailAddressProperties = {
	_type: TypeRef<MailAddressProperties>;

	_id: Id;
	mailAddress: string;
	senderName: string;
}
export const HeaderTypeRef: TypeRef<Header> = new TypeRef("tutanota", 1269)

export function createHeader(values: StrippedEntity<Header>): Header {
	return Object.assign(create(typeModels[HeaderTypeRef.typeId], HeaderTypeRef), values)
}

export type Header = {
	_type: TypeRef<Header>;

	_id: Id;
	compressedHeaders: null | string;
	headers: null | string;
}
export const BodyTypeRef: TypeRef<Body> = new TypeRef("tutanota", 1273)

export function createBody(values: StrippedEntity<Body>): Body {
	return Object.assign(create(typeModels[BodyTypeRef.typeId], BodyTypeRef), values)
}

export type Body = {
	_type: TypeRef<Body>;

	_id: Id;
	compressedText: null | string;
	text: null | string;
}
export const RecipientsTypeRef: TypeRef<Recipients> = new TypeRef("tutanota", 1277)

export function createRecipients(values: StrippedEntity<Recipients>): Recipients {
	return Object.assign(create(typeModels[RecipientsTypeRef.typeId], RecipientsTypeRef), values)
}

export type Recipients = {
	_type: TypeRef<Recipients>;

	_id: Id;

	bccRecipients: MailAddress[];
	ccRecipients: MailAddress[];
	toRecipients: MailAddress[];
}
export const MailDetailsTypeRef: TypeRef<MailDetails> = new TypeRef("tutanota", 1282)

export function createMailDetails(values: StrippedEntity<MailDetails>): MailDetails {
	return Object.assign(create(typeModels[MailDetailsTypeRef.typeId], MailDetailsTypeRef), values)
}

export type MailDetails = {
	_type: TypeRef<MailDetails>;

	_id: Id;
	authStatus: NumberString;
	sentDate: Date;

	body: Body;
	headers: null | Header;
	recipients: Recipients;
	replyTos: EncryptedMailAddress[];
}
export const MailDetailsDraftTypeRef: TypeRef<MailDetailsDraft> = new TypeRef("tutanota", 1290)

export function createMailDetailsDraft(values: StrippedEntity<MailDetailsDraft>): MailDetailsDraft {
	return Object.assign(create(typeModels[MailDetailsDraftTypeRef.typeId], MailDetailsDraftTypeRef), values)
}

export type MailDetailsDraft = {
	_type: TypeRef<MailDetailsDraft>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;

	details: MailDetails;
}
export const MailDetailsBlobTypeRef: TypeRef<MailDetailsBlob> = new TypeRef("tutanota", 1298)

export function createMailDetailsBlob(values: StrippedEntity<MailDetailsBlob>): MailDetailsBlob {
	return Object.assign(create(typeModels[MailDetailsBlobTypeRef.typeId], MailDetailsBlobTypeRef), values)
}

export type MailDetailsBlob = {
	_type: TypeRef<MailDetailsBlob>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;

	details: MailDetails;
}
export const UpdateMailFolderDataTypeRef: TypeRef<UpdateMailFolderData> = new TypeRef("tutanota", 1311)

export function createUpdateMailFolderData(values: StrippedEntity<UpdateMailFolderData>): UpdateMailFolderData {
	return Object.assign(create(typeModels[UpdateMailFolderDataTypeRef.typeId], UpdateMailFolderDataTypeRef), values)
}

export type UpdateMailFolderData = {
	_type: TypeRef<UpdateMailFolderData>;

	_format: NumberString;

	folder: IdTuple;
	newParent: null | IdTuple;
}
export const MailDetailsDraftsRefTypeRef: TypeRef<MailDetailsDraftsRef> = new TypeRef("tutanota", 1315)

export function createMailDetailsDraftsRef(values: StrippedEntity<MailDetailsDraftsRef>): MailDetailsDraftsRef {
	return Object.assign(create(typeModels[MailDetailsDraftsRefTypeRef.typeId], MailDetailsDraftsRefTypeRef), values)
}

export type MailDetailsDraftsRef = {
	_type: TypeRef<MailDetailsDraftsRef>;

	_id: Id;

	list: Id;
}
export const ContactListEntryTypeRef: TypeRef<ContactListEntry> = new TypeRef("tutanota", 1325)

export function createContactListEntry(values: StrippedEntity<ContactListEntry>): ContactListEntry {
	return Object.assign(create(typeModels[ContactListEntryTypeRef.typeId], ContactListEntryTypeRef), values)
}

export type ContactListEntry = {
	_type: TypeRef<ContactListEntry>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;
	emailAddress: string;
}
export const ContactListGroupRootTypeRef: TypeRef<ContactListGroupRoot> = new TypeRef("tutanota", 1333)

export function createContactListGroupRoot(values: StrippedEntity<ContactListGroupRoot>): ContactListGroupRoot {
	return Object.assign(create(typeModels[ContactListGroupRootTypeRef.typeId], ContactListGroupRootTypeRef), values)
}

export type ContactListGroupRoot = {
	_type: TypeRef<ContactListGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	_permissions: Id;

	entries: Id;
}
export const SymEncInternalRecipientKeyDataTypeRef: TypeRef<SymEncInternalRecipientKeyData> = new TypeRef("tutanota", 1347)

export function createSymEncInternalRecipientKeyData(values: StrippedEntity<SymEncInternalRecipientKeyData>): SymEncInternalRecipientKeyData {
	return Object.assign(create(typeModels[SymEncInternalRecipientKeyDataTypeRef.typeId], SymEncInternalRecipientKeyDataTypeRef), values)
}

export type SymEncInternalRecipientKeyData = {
	_type: TypeRef<SymEncInternalRecipientKeyData>;

	_id: Id;
	mailAddress: string;
	symEncBucketKey: Uint8Array;
	symKeyVersion: NumberString;

	keyGroup: Id;
}
export const ContactCustomDateTypeRef: TypeRef<ContactCustomDate> = new TypeRef("tutanota", 1356)

export function createContactCustomDate(values: StrippedEntity<ContactCustomDate>): ContactCustomDate {
	return Object.assign(create(typeModels[ContactCustomDateTypeRef.typeId], ContactCustomDateTypeRef), values)
}

export type ContactCustomDate = {
	_type: TypeRef<ContactCustomDate>;

	_id: Id;
	customTypeName: string;
	dateIso: string;
	type: NumberString;
}
export const ContactWebsiteTypeRef: TypeRef<ContactWebsite> = new TypeRef("tutanota", 1361)

export function createContactWebsite(values: StrippedEntity<ContactWebsite>): ContactWebsite {
	return Object.assign(create(typeModels[ContactWebsiteTypeRef.typeId], ContactWebsiteTypeRef), values)
}

export type ContactWebsite = {
	_type: TypeRef<ContactWebsite>;

	_id: Id;
	customTypeName: string;
	type: NumberString;
	url: string;
}
export const ContactRelationshipTypeRef: TypeRef<ContactRelationship> = new TypeRef("tutanota", 1366)

export function createContactRelationship(values: StrippedEntity<ContactRelationship>): ContactRelationship {
	return Object.assign(create(typeModels[ContactRelationshipTypeRef.typeId], ContactRelationshipTypeRef), values)
}

export type ContactRelationship = {
	_type: TypeRef<ContactRelationship>;

	_id: Id;
	customTypeName: string;
	person: string;
	type: NumberString;
}
export const ContactMessengerHandleTypeRef: TypeRef<ContactMessengerHandle> = new TypeRef("tutanota", 1371)

export function createContactMessengerHandle(values: StrippedEntity<ContactMessengerHandle>): ContactMessengerHandle {
	return Object.assign(create(typeModels[ContactMessengerHandleTypeRef.typeId], ContactMessengerHandleTypeRef), values)
}

export type ContactMessengerHandle = {
	_type: TypeRef<ContactMessengerHandle>;

	_id: Id;
	customTypeName: string;
	handle: string;
	type: NumberString;
}
export const ContactPronounsTypeRef: TypeRef<ContactPronouns> = new TypeRef("tutanota", 1376)

export function createContactPronouns(values: StrippedEntity<ContactPronouns>): ContactPronouns {
	return Object.assign(create(typeModels[ContactPronounsTypeRef.typeId], ContactPronounsTypeRef), values)
}

export type ContactPronouns = {
	_type: TypeRef<ContactPronouns>;

	_id: Id;
	language: string;
	pronouns: string;
}
export const TranslationGetInTypeRef: TypeRef<TranslationGetIn> = new TypeRef("tutanota", 1436)

export function createTranslationGetIn(values: StrippedEntity<TranslationGetIn>): TranslationGetIn {
	return Object.assign(create(typeModels[TranslationGetInTypeRef.typeId], TranslationGetInTypeRef), values)
}

export type TranslationGetIn = {
	_type: TypeRef<TranslationGetIn>;

	_format: NumberString;
	lang: string;
}
export const TranslationGetOutTypeRef: TypeRef<TranslationGetOut> = new TypeRef("tutanota", 1439)

export function createTranslationGetOut(values: StrippedEntity<TranslationGetOut>): TranslationGetOut {
	return Object.assign(create(typeModels[TranslationGetOutTypeRef.typeId], TranslationGetOutTypeRef), values)
}

export type TranslationGetOut = {
	_type: TypeRef<TranslationGetOut>;

	_format: NumberString;
	giftCardSubject: string;
	invitationSubject: string;
}
export const DefaultAlarmInfoTypeRef: TypeRef<DefaultAlarmInfo> = new TypeRef("tutanota", 1446)

export function createDefaultAlarmInfo(values: StrippedEntity<DefaultAlarmInfo>): DefaultAlarmInfo {
	return Object.assign(create(typeModels[DefaultAlarmInfoTypeRef.typeId], DefaultAlarmInfoTypeRef), values)
}

export type DefaultAlarmInfo = {
	_type: TypeRef<DefaultAlarmInfo>;

	_id: Id;
	trigger: string;
}
export const MailSetEntryTypeRef: TypeRef<MailSetEntry> = new TypeRef("tutanota", 1450)

export function createMailSetEntry(values: StrippedEntity<MailSetEntry>): MailSetEntry {
	return Object.assign(create(typeModels[MailSetEntryTypeRef.typeId], MailSetEntryTypeRef), values)
}

export type MailSetEntry = {
	_type: TypeRef<MailSetEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	mail: IdTuple;
}
export const MailBagTypeRef: TypeRef<MailBag> = new TypeRef("tutanota", 1460)

export function createMailBag(values: StrippedEntity<MailBag>): MailBag {
	return Object.assign(create(typeModels[MailBagTypeRef.typeId], MailBagTypeRef), values)
}

export type MailBag = {
	_type: TypeRef<MailBag>;

	_id: Id;

	mails: Id;
}
export const SimpleMoveMailPostInTypeRef: TypeRef<SimpleMoveMailPostIn> = new TypeRef("tutanota", 1469)

export function createSimpleMoveMailPostIn(values: StrippedEntity<SimpleMoveMailPostIn>): SimpleMoveMailPostIn {
	return Object.assign(create(typeModels[SimpleMoveMailPostInTypeRef.typeId], SimpleMoveMailPostInTypeRef), values)
}

export type SimpleMoveMailPostIn = {
	_type: TypeRef<SimpleMoveMailPostIn>;

	_format: NumberString;
	destinationSetType: NumberString;

	mails: IdTuple[];
}
export const UnreadMailStatePostInTypeRef: TypeRef<UnreadMailStatePostIn> = new TypeRef("tutanota", 1474)

export function createUnreadMailStatePostIn(values: StrippedEntity<UnreadMailStatePostIn>): UnreadMailStatePostIn {
	return Object.assign(create(typeModels[UnreadMailStatePostInTypeRef.typeId], UnreadMailStatePostInTypeRef), values)
}

export type UnreadMailStatePostIn = {
	_type: TypeRef<UnreadMailStatePostIn>;

	_format: NumberString;
	unread: boolean;

	mails: IdTuple[];
}
export const ManageLabelServiceLabelDataTypeRef: TypeRef<ManageLabelServiceLabelData> = new TypeRef("tutanota", 1480)

export function createManageLabelServiceLabelData(values: StrippedEntity<ManageLabelServiceLabelData>): ManageLabelServiceLabelData {
	return Object.assign(create(typeModels[ManageLabelServiceLabelDataTypeRef.typeId], ManageLabelServiceLabelDataTypeRef), values)
}

export type ManageLabelServiceLabelData = {
	_type: TypeRef<ManageLabelServiceLabelData>;

	_id: Id;
	color: string;
	name: string;
}
export const ManageLabelServicePostInTypeRef: TypeRef<ManageLabelServicePostIn> = new TypeRef("tutanota", 1484)

export function createManageLabelServicePostIn(values: StrippedEntity<ManageLabelServicePostIn>): ManageLabelServicePostIn {
	return Object.assign(create(typeModels[ManageLabelServicePostInTypeRef.typeId], ManageLabelServicePostInTypeRef), values)
}

export type ManageLabelServicePostIn = {
	_type: TypeRef<ManageLabelServicePostIn>;
	_errors: Object;

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerGroup: Id;
	ownerKeyVersion: NumberString;

	data: ManageLabelServiceLabelData;
}
export const ManageLabelServiceDeleteInTypeRef: TypeRef<ManageLabelServiceDeleteIn> = new TypeRef("tutanota", 1500)

export function createManageLabelServiceDeleteIn(values: StrippedEntity<ManageLabelServiceDeleteIn>): ManageLabelServiceDeleteIn {
	return Object.assign(create(typeModels[ManageLabelServiceDeleteInTypeRef.typeId], ManageLabelServiceDeleteInTypeRef), values)
}

export type ManageLabelServiceDeleteIn = {
	_type: TypeRef<ManageLabelServiceDeleteIn>;

	_format: NumberString;

	label: IdTuple;
}
export const ApplyLabelServicePostInTypeRef: TypeRef<ApplyLabelServicePostIn> = new TypeRef("tutanota", 1504)

export function createApplyLabelServicePostIn(values: StrippedEntity<ApplyLabelServicePostIn>): ApplyLabelServicePostIn {
	return Object.assign(create(typeModels[ApplyLabelServicePostInTypeRef.typeId], ApplyLabelServicePostInTypeRef), values)
}

export type ApplyLabelServicePostIn = {
	_type: TypeRef<ApplyLabelServicePostIn>;

	_format: NumberString;

	addedLabels: IdTuple[];
	mails: IdTuple[];
	removedLabels: IdTuple[];
}
export const ImportMailDataMailReferenceTypeRef: TypeRef<ImportMailDataMailReference> = new TypeRef("tutanota", 1513)

export function createImportMailDataMailReference(values: StrippedEntity<ImportMailDataMailReference>): ImportMailDataMailReference {
	return Object.assign(create(typeModels[ImportMailDataMailReferenceTypeRef.typeId], ImportMailDataMailReferenceTypeRef), values)
}

export type ImportMailDataMailReference = {
	_type: TypeRef<ImportMailDataMailReference>;

	_id: Id;
	reference: string;
}
export const NewImportAttachmentTypeRef: TypeRef<NewImportAttachment> = new TypeRef("tutanota", 1516)

export function createNewImportAttachment(values: StrippedEntity<NewImportAttachment>): NewImportAttachment {
	return Object.assign(create(typeModels[NewImportAttachmentTypeRef.typeId], NewImportAttachmentTypeRef), values)
}

export type NewImportAttachment = {
	_type: TypeRef<NewImportAttachment>;

	_id: Id;
	encCid: null | Uint8Array;
	encFileHash: null | Uint8Array;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;
	ownerEncFileHashSessionKey: null | Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const ImportAttachmentTypeRef: TypeRef<ImportAttachment> = new TypeRef("tutanota", 1524)

export function createImportAttachment(values: StrippedEntity<ImportAttachment>): ImportAttachment {
	return Object.assign(create(typeModels[ImportAttachmentTypeRef.typeId], ImportAttachmentTypeRef), values)
}

export type ImportAttachment = {
	_type: TypeRef<ImportAttachment>;

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;
	ownerFileKeyVersion: NumberString;

	existingAttachmentFile: null | IdTuple;
	newAttachment: null | NewImportAttachment;
}
export const ImportMailDataTypeRef: TypeRef<ImportMailData> = new TypeRef("tutanota", 1530)

export function createImportMailData(values: StrippedEntity<ImportMailData>): ImportMailData {
	return Object.assign(create(typeModels[ImportMailDataTypeRef.typeId], ImportMailDataTypeRef), values)
}

export type ImportMailData = {
	_type: TypeRef<ImportMailData>;
	_errors: Object;

	_format: NumberString;
	compressedBodyText: string;
	compressedHeaders: string;
	confidential: boolean;
	date: Date;
	differentEnvelopeSender: null | string;
	inReplyTo: null | string;
	messageId: null | string;
	method: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	phishingStatus: NumberString;
	replyType: NumberString;
	state: NumberString;
	subject: string;
	unread: boolean;

	importedAttachments: ImportAttachment[];
	recipients: Recipients;
	references: ImportMailDataMailReference[];
	replyTos: EncryptedMailAddress[];
	sender: MailAddress;
}
export const ImportedMailTypeRef: TypeRef<ImportedMail> = new TypeRef("tutanota", 1552)

export function createImportedMail(values: StrippedEntity<ImportedMail>): ImportedMail {
	return Object.assign(create(typeModels[ImportedMailTypeRef.typeId], ImportedMailTypeRef), values)
}

export type ImportedMail = {
	_type: TypeRef<ImportedMail>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	mailSetEntry: IdTuple;
}
export const ImportMailStateTypeRef: TypeRef<ImportMailState> = new TypeRef("tutanota", 1559)

export function createImportMailState(values: StrippedEntity<ImportMailState>): ImportMailState {
	return Object.assign(create(typeModels[ImportMailStateTypeRef.typeId], ImportMailStateTypeRef), values)
}

export type ImportMailState = {
	_type: TypeRef<ImportMailState>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	failedMails: NumberString;
	status: NumberString;
	successfulMails: NumberString;
	totalMails: NumberString;

	importedMails: Id;
	targetFolder: IdTuple;
}
export const ImportMailPostInTypeRef: TypeRef<ImportMailPostIn> = new TypeRef("tutanota", 1570)

export function createImportMailPostIn(values: StrippedEntity<ImportMailPostIn>): ImportMailPostIn {
	return Object.assign(create(typeModels[ImportMailPostInTypeRef.typeId], ImportMailPostInTypeRef), values)
}

export type ImportMailPostIn = {
	_type: TypeRef<ImportMailPostIn>;

	_format: NumberString;

	encImports: StringWrapper[];
	mailState: IdTuple;
}
export const ImportMailPostOutTypeRef: TypeRef<ImportMailPostOut> = new TypeRef("tutanota", 1579)

export function createImportMailPostOut(values: StrippedEntity<ImportMailPostOut>): ImportMailPostOut {
	return Object.assign(create(typeModels[ImportMailPostOutTypeRef.typeId], ImportMailPostOutTypeRef), values)
}

export type ImportMailPostOut = {
	_type: TypeRef<ImportMailPostOut>;

	_format: NumberString;
}
export const ImportMailGetInTypeRef: TypeRef<ImportMailGetIn> = new TypeRef("tutanota", 1582)

export function createImportMailGetIn(values: StrippedEntity<ImportMailGetIn>): ImportMailGetIn {
	return Object.assign(create(typeModels[ImportMailGetInTypeRef.typeId], ImportMailGetInTypeRef), values)
}

export type ImportMailGetIn = {
	_type: TypeRef<ImportMailGetIn>;
	_errors: Object;

	_format: NumberString;
	newImportedMailSetName: string;
	ownerEncSessionKey: Uint8Array;
	ownerGroup: Id;
	ownerKeyVersion: NumberString;
	totalMails: NumberString;

	targetMailFolder: IdTuple;
}
export const AdvancedRepeatRuleTypeRef: TypeRef<AdvancedRepeatRule> = new TypeRef("tutanota", 1586)

export function createAdvancedRepeatRule(values: StrippedEntity<AdvancedRepeatRule>): AdvancedRepeatRule {
	return Object.assign(create(typeModels[AdvancedRepeatRuleTypeRef.typeId], AdvancedRepeatRuleTypeRef), values)
}

export type AdvancedRepeatRule = {
	_type: TypeRef<AdvancedRepeatRule>;

	_id: Id;
	interval: string;
	ruleType: NumberString;
}
export const ImportMailGetOutTypeRef: TypeRef<ImportMailGetOut> = new TypeRef("tutanota", 1591)

export function createImportMailGetOut(values: StrippedEntity<ImportMailGetOut>): ImportMailGetOut {
	return Object.assign(create(typeModels[ImportMailGetOutTypeRef.typeId], ImportMailGetOutTypeRef), values)
}

export type ImportMailGetOut = {
	_type: TypeRef<ImportMailGetOut>;

	_format: NumberString;

	mailState: IdTuple;
}
export const MailExportTokenServicePostOutTypeRef: TypeRef<MailExportTokenServicePostOut> = new TypeRef("tutanota", 1605)

export function createMailExportTokenServicePostOut(values: StrippedEntity<MailExportTokenServicePostOut>): MailExportTokenServicePostOut {
	return Object.assign(create(typeModels[MailExportTokenServicePostOutTypeRef.typeId], MailExportTokenServicePostOutTypeRef), values)
}

export type MailExportTokenServicePostOut = {
	_type: TypeRef<MailExportTokenServicePostOut>;

	_format: NumberString;
	mailExportToken: string;
}
export const SupportTopicTypeRef: TypeRef<SupportTopic> = new TypeRef("tutanota", 1618)

export function createSupportTopic(values: StrippedEntity<SupportTopic>): SupportTopic {
	return Object.assign(create(typeModels[SupportTopicTypeRef.typeId], SupportTopicTypeRef), values)
}

export type SupportTopic = {
	_type: TypeRef<SupportTopic>;

	_id: Id;
	issueDE: string;
	issueEN: string;
	lastUpdated: Date;
	solutionHtmlDE: string;
	solutionHtmlEN: string;
	visibility: NumberString;
}
export const SupportCategoryTypeRef: TypeRef<SupportCategory> = new TypeRef("tutanota", 1626)

export function createSupportCategory(values: StrippedEntity<SupportCategory>): SupportCategory {
	return Object.assign(create(typeModels[SupportCategoryTypeRef.typeId], SupportCategoryTypeRef), values)
}

export type SupportCategory = {
	_type: TypeRef<SupportCategory>;

	_id: Id;
	icon: string;
	introductionDE: string;
	introductionEN: string;
	nameDE: string;
	nameEN: string;

	topics: SupportTopic[];
}
export const SupportDataTypeRef: TypeRef<SupportData> = new TypeRef("tutanota", 1634)

export function createSupportData(values: StrippedEntity<SupportData>): SupportData {
	return Object.assign(create(typeModels[SupportDataTypeRef.typeId], SupportDataTypeRef), values)
}

export type SupportData = {
	_type: TypeRef<SupportData>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	categories: SupportCategory[];
}
export const ReceiveInfoServicePostOutTypeRef: TypeRef<ReceiveInfoServicePostOut> = new TypeRef("tutanota", 1641)

export function createReceiveInfoServicePostOut(values: StrippedEntity<ReceiveInfoServicePostOut>): ReceiveInfoServicePostOut {
	return Object.assign(create(typeModels[ReceiveInfoServicePostOutTypeRef.typeId], ReceiveInfoServicePostOutTypeRef), values)
}

export type ReceiveInfoServicePostOut = {
	_type: TypeRef<ReceiveInfoServicePostOut>;

	_format: NumberString;
	outdatedVersion: boolean;
}
export const ResolveConversationsServiceGetInTypeRef: TypeRef<ResolveConversationsServiceGetIn> = new TypeRef("tutanota", 1645)

export function createResolveConversationsServiceGetIn(values: StrippedEntity<ResolveConversationsServiceGetIn>): ResolveConversationsServiceGetIn {
	return Object.assign(create(typeModels[ResolveConversationsServiceGetInTypeRef.typeId], ResolveConversationsServiceGetInTypeRef), values)
}

export type ResolveConversationsServiceGetIn = {
	_type: TypeRef<ResolveConversationsServiceGetIn>;

	_format: NumberString;

	conversationLists: GeneratedIdWrapper[];
}
export const ResolveConversationsServiceGetOutTypeRef: TypeRef<ResolveConversationsServiceGetOut> = new TypeRef("tutanota", 1648)

export function createResolveConversationsServiceGetOut(values: StrippedEntity<ResolveConversationsServiceGetOut>): ResolveConversationsServiceGetOut {
	return Object.assign(create(typeModels[ResolveConversationsServiceGetOutTypeRef.typeId], ResolveConversationsServiceGetOutTypeRef), values)
}

export type ResolveConversationsServiceGetOut = {
	_type: TypeRef<ResolveConversationsServiceGetOut>;

	_format: NumberString;

	mailIds: IdTupleWrapper[];
}
