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
	_original?: Subfiles

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
	_original?: File

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerEncSessionKey: null | Uint8Array;
	name: string;
	size: NumberString;
	mimeType: null | string;
	_ownerGroup: null | Id;
	cid: null | string;
	_ownerKeyVersion: null | NumberString;

	parent: null | IdTuple;
	subFiles: null | Subfiles;
	blobs: Blob[];
}
export const FileSystemTypeRef: TypeRef<FileSystem> = new TypeRef("tutanota", 28)

export function createFileSystem(values: StrippedEntity<FileSystem>): FileSystem {
    return Object.assign(create(typeModels[FileSystemTypeRef.typeId], FileSystemTypeRef), values)
}

export type FileSystem = {
	_type: TypeRef<FileSystem>;
	_errors: Object;
	_original?: FileSystem

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	files: Id;
}
export const ContactMailAddressTypeRef: TypeRef<ContactMailAddress> = new TypeRef("tutanota", 44)

export function createContactMailAddress(values: StrippedEntity<ContactMailAddress>): ContactMailAddress {
    return Object.assign(create(typeModels[ContactMailAddressTypeRef.typeId], ContactMailAddressTypeRef), values)
}

export type ContactMailAddress = {
	_type: TypeRef<ContactMailAddress>;
	_original?: ContactMailAddress

	_id: Id;
	type: NumberString;
	address: string;
	customTypeName: string;
}
export const ContactPhoneNumberTypeRef: TypeRef<ContactPhoneNumber> = new TypeRef("tutanota", 49)

export function createContactPhoneNumber(values: StrippedEntity<ContactPhoneNumber>): ContactPhoneNumber {
    return Object.assign(create(typeModels[ContactPhoneNumberTypeRef.typeId], ContactPhoneNumberTypeRef), values)
}

export type ContactPhoneNumber = {
	_type: TypeRef<ContactPhoneNumber>;
	_original?: ContactPhoneNumber

	_id: Id;
	type: NumberString;
	number: string;
	customTypeName: string;
}
export const ContactAddressTypeRef: TypeRef<ContactAddress> = new TypeRef("tutanota", 54)

export function createContactAddress(values: StrippedEntity<ContactAddress>): ContactAddress {
    return Object.assign(create(typeModels[ContactAddressTypeRef.typeId], ContactAddressTypeRef), values)
}

export type ContactAddress = {
	_type: TypeRef<ContactAddress>;
	_original?: ContactAddress

	_id: Id;
	type: NumberString;
	address: string;
	customTypeName: string;
}
export const ContactSocialIdTypeRef: TypeRef<ContactSocialId> = new TypeRef("tutanota", 59)

export function createContactSocialId(values: StrippedEntity<ContactSocialId>): ContactSocialId {
    return Object.assign(create(typeModels[ContactSocialIdTypeRef.typeId], ContactSocialIdTypeRef), values)
}

export type ContactSocialId = {
	_type: TypeRef<ContactSocialId>;
	_original?: ContactSocialId

	_id: Id;
	type: NumberString;
	socialId: string;
	customTypeName: string;
}
export const ContactTypeRef: TypeRef<Contact> = new TypeRef("tutanota", 64)

export function createContact(values: StrippedEntity<Contact>): Contact {
    return Object.assign(create(typeModels[ContactTypeRef.typeId], ContactTypeRef), values)
}

export type Contact = {
	_type: TypeRef<Contact>;
	_errors: Object;
	_original?: Contact

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerEncSessionKey: null | Uint8Array;
	firstName: string;
	lastName: string;
	company: string;
	role: string;
	oldBirthdayDate: null | Date;
	comment: string;
	presharedPassword: null | string;
	_ownerGroup: null | Id;
	nickname: null | string;
	title: null | string;
	birthdayIso: null | string;
	middleName: null | string;
	nameSuffix: null | string;
	phoneticFirst: null | string;
	phoneticMiddle: null | string;
	phoneticLast: null | string;
	department: null | string;
	_ownerKeyVersion: null | NumberString;

	mailAddresses: ContactMailAddress[];
	phoneNumbers: ContactPhoneNumber[];
	addresses: ContactAddress[];
	socialIds: ContactSocialId[];
	oldBirthdayAggregate: null | Birthday;
	photo: null | IdTuple;
	customDate: ContactCustomDate[];
	websites: ContactWebsite[];
	relationships: ContactRelationship[];
	messengerHandles: ContactMessengerHandle[];
	pronouns: ContactPronouns[];
}
export const ConversationEntryTypeRef: TypeRef<ConversationEntry> = new TypeRef("tutanota", 84)

export function createConversationEntry(values: StrippedEntity<ConversationEntry>): ConversationEntry {
    return Object.assign(create(typeModels[ConversationEntryTypeRef.typeId], ConversationEntryTypeRef), values)
}

export type ConversationEntry = {
	_type: TypeRef<ConversationEntry>;
	_original?: ConversationEntry

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	messageId: string;
	conversationType: NumberString;
	_ownerGroup: null | Id;

	previous: null | IdTuple;
	mail: null | IdTuple;
}
export const MailAddressTypeRef: TypeRef<MailAddress> = new TypeRef("tutanota", 92)

export function createMailAddress(values: StrippedEntity<MailAddress>): MailAddress {
    return Object.assign(create(typeModels[MailAddressTypeRef.typeId], MailAddressTypeRef), values)
}

export type MailAddress = {
	_type: TypeRef<MailAddress>;
	_original?: MailAddress

	_id: Id;
	name: string;
	address: string;

	contact: null | IdTuple;
}
export const MailTypeRef: TypeRef<Mail> = new TypeRef("tutanota", 97)

export function createMail(values: StrippedEntity<Mail>): Mail {
    return Object.assign(create(typeModels[MailTypeRef.typeId], MailTypeRef), values)
}

export type Mail = {
	_type: TypeRef<Mail>;
	_errors: Object;
	_original?: Mail

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerEncSessionKey: null | Uint8Array;
	subject: string;
	receivedDate: Date;
	state: NumberString;
	unread: boolean;
	confidential: boolean;
	replyType: NumberString;
	_ownerGroup: null | Id;
	differentEnvelopeSender: null | string;
	listUnsubscribe: boolean;
	movedTime: null | Date;
	phishingStatus: NumberString;
	authStatus: null | NumberString;
	method: NumberString;
	recipientCount: NumberString;
	encryptionAuthStatus: null | NumberString;
	_ownerKeyVersion: null | NumberString;
	keyVerificationState: null | NumberString;
	processingState: NumberString;

	sender: MailAddress;
	attachments: IdTuple[];
	conversationEntry: IdTuple;
	firstRecipient: null | MailAddress;
	mailDetails: null | IdTuple;
	mailDetailsDraft: null | IdTuple;
	bucketKey: null | BucketKey;
	sets: IdTuple[];
	clientSpamClassifierResult: null | ClientSpamClassifierResult;
}
export const MailBoxTypeRef: TypeRef<MailBox> = new TypeRef("tutanota", 125)

export function createMailBox(values: StrippedEntity<MailBox>): MailBox {
    return Object.assign(create(typeModels[MailBoxTypeRef.typeId], MailBoxTypeRef), values)
}

export type MailBox = {
	_type: TypeRef<MailBox>;
	_errors: Object;
	_original?: MailBox

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	lastInfoDate: Date;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	sentAttachments: Id;
	receivedAttachments: Id;
	folders: null | MailFolderRef;
	spamResults: null | SpamResults;
	mailDetailsDrafts: null | MailDetailsDraftsRef;
	archivedMailBags: MailBag[];
	currentMailBag: null | MailBag;
	importedAttachments: Id;
	mailImportStates: Id;
	extractedFeatures: null | Id;
}
export const CreateExternalUserGroupDataTypeRef: TypeRef<CreateExternalUserGroupData> = new TypeRef("tutanota", 138)

export function createCreateExternalUserGroupData(values: StrippedEntity<CreateExternalUserGroupData>): CreateExternalUserGroupData {
    return Object.assign(create(typeModels[CreateExternalUserGroupDataTypeRef.typeId], CreateExternalUserGroupDataTypeRef), values)
}

export type CreateExternalUserGroupData = {
	_type: TypeRef<CreateExternalUserGroupData>;
	_original?: CreateExternalUserGroupData

	_id: Id;
	mailAddress: string;
	externalPwEncUserGroupKey: Uint8Array;
	internalUserEncUserGroupKey: Uint8Array;
	internalUserGroupKeyVersion: NumberString;
}
export const ExternalUserDataTypeRef: TypeRef<ExternalUserData> = new TypeRef("tutanota", 145)

export function createExternalUserData(values: StrippedEntity<ExternalUserData>): ExternalUserData {
    return Object.assign(create(typeModels[ExternalUserDataTypeRef.typeId], ExternalUserDataTypeRef), values)
}

export type ExternalUserData = {
	_type: TypeRef<ExternalUserData>;
	_original?: ExternalUserData

	_format: NumberString;
	externalUserEncMailGroupKey: Uint8Array;
	verifier: Uint8Array;
	externalUserEncUserGroupInfoSessionKey: Uint8Array;
	externalUserEncEntropy: Uint8Array;
	internalMailEncUserGroupInfoSessionKey: Uint8Array;
	externalMailEncMailGroupInfoSessionKey: Uint8Array;
	internalMailEncMailGroupInfoSessionKey: Uint8Array;
	externalUserEncTutanotaPropertiesSessionKey: Uint8Array;
	externalMailEncMailBoxSessionKey: Uint8Array;
	kdfVersion: NumberString;
	internalMailGroupKeyVersion: NumberString;

	userGroupData: CreateExternalUserGroupData;
}
export const ContactListTypeRef: TypeRef<ContactList> = new TypeRef("tutanota", 153)

export function createContactList(values: StrippedEntity<ContactList>): ContactList {
    return Object.assign(create(typeModels[ContactListTypeRef.typeId], ContactListTypeRef), values)
}

export type ContactList = {
	_type: TypeRef<ContactList>;
	_errors: Object;
	_original?: ContactList

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	contacts: Id;
	photos: null | PhotosRef;
}
export const RemoteImapSyncInfoTypeRef: TypeRef<RemoteImapSyncInfo> = new TypeRef("tutanota", 183)

export function createRemoteImapSyncInfo(values: StrippedEntity<RemoteImapSyncInfo>): RemoteImapSyncInfo {
    return Object.assign(create(typeModels[RemoteImapSyncInfoTypeRef.typeId], RemoteImapSyncInfoTypeRef), values)
}

export type RemoteImapSyncInfo = {
	_type: TypeRef<RemoteImapSyncInfo>;
	_original?: RemoteImapSyncInfo

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	seen: boolean;
	_ownerGroup: null | Id;

	message: IdTuple;
}
export const ImapFolderTypeRef: TypeRef<ImapFolder> = new TypeRef("tutanota", 190)

export function createImapFolder(values: StrippedEntity<ImapFolder>): ImapFolder {
    return Object.assign(create(typeModels[ImapFolderTypeRef.typeId], ImapFolderTypeRef), values)
}

export type ImapFolder = {
	_type: TypeRef<ImapFolder>;
	_original?: ImapFolder

	_id: Id;
	name: string;
	lastseenuid: string;
	uidvalidity: string;

	syncInfo: Id;
}
export const ImapSyncStateTypeRef: TypeRef<ImapSyncState> = new TypeRef("tutanota", 196)

export function createImapSyncState(values: StrippedEntity<ImapSyncState>): ImapSyncState {
    return Object.assign(create(typeModels[ImapSyncStateTypeRef.typeId], ImapSyncStateTypeRef), values)
}

export type ImapSyncState = {
	_type: TypeRef<ImapSyncState>;
	_original?: ImapSyncState

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	folders: ImapFolder[];
}
export const ImapSyncConfigurationTypeRef: TypeRef<ImapSyncConfiguration> = new TypeRef("tutanota", 209)

export function createImapSyncConfiguration(values: StrippedEntity<ImapSyncConfiguration>): ImapSyncConfiguration {
    return Object.assign(create(typeModels[ImapSyncConfigurationTypeRef.typeId], ImapSyncConfigurationTypeRef), values)
}

export type ImapSyncConfiguration = {
	_type: TypeRef<ImapSyncConfiguration>;
	_original?: ImapSyncConfiguration

	_id: Id;
	host: string;
	port: NumberString;
	user: string;
	password: string;

	imapSyncState: null | Id;
}
export const TutanotaPropertiesTypeRef: TypeRef<TutanotaProperties> = new TypeRef("tutanota", 216)

export function createTutanotaProperties(values: StrippedEntity<TutanotaProperties>): TutanotaProperties {
    return Object.assign(create(typeModels[TutanotaPropertiesTypeRef.typeId], TutanotaPropertiesTypeRef), values)
}

export type TutanotaProperties = {
	_type: TypeRef<TutanotaProperties>;
	_errors: Object;
	_original?: TutanotaProperties

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	userEncEntropy: null | Uint8Array;
	notificationMailLanguage: null | string;
	defaultSender: null | string;
	defaultUnconfidential: boolean;
	customEmailSignature: string;
	emailSignatureType: NumberString;
	noAutomaticContacts: boolean;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	sendPlaintextOnly: boolean;
	lastSeenAnnouncement: NumberString;
	_ownerKeyVersion: null | NumberString;
	userKeyVersion: null | NumberString;
	defaultLabelCreated: boolean;

	lastPushedMail: null | IdTuple;
	imapSyncConfig: ImapSyncConfiguration[];
	inboxRules: InboxRule[];
}
export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", 223)

export function createNotificationMail(values: StrippedEntity<NotificationMail>): NotificationMail {
    return Object.assign(create(typeModels[NotificationMailTypeRef.typeId], NotificationMailTypeRef), values)
}

export type NotificationMail = {
	_type: TypeRef<NotificationMail>;
	_original?: NotificationMail

	_id: Id;
	subject: string;
	bodyText: string;
	recipientMailAddress: string;
	recipientName: string;
	mailboxLink: string;
}
export const DeleteMailDataTypeRef: TypeRef<DeleteMailData> = new TypeRef("tutanota", 419)

export function createDeleteMailData(values: StrippedEntity<DeleteMailData>): DeleteMailData {
    return Object.assign(create(typeModels[DeleteMailDataTypeRef.typeId], DeleteMailDataTypeRef), values)
}

export type DeleteMailData = {
	_type: TypeRef<DeleteMailData>;
	_original?: DeleteMailData

	_format: NumberString;

	mails: IdTuple[];
	folder: null | IdTuple;
}
export const MailFolderTypeRef: TypeRef<MailFolder> = new TypeRef("tutanota", 429)

export function createMailFolder(values: StrippedEntity<MailFolder>): MailFolder {
    return Object.assign(create(typeModels[MailFolderTypeRef.typeId], MailFolderTypeRef), values)
}

export type MailFolder = {
	_type: TypeRef<MailFolder>;
	_errors: Object;
	_original?: MailFolder

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerEncSessionKey: null | Uint8Array;
	name: string;
	folderType: NumberString;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	color: null | string;

	parentFolder: null | IdTuple;
	entries: Id;
}
export const MailFolderRefTypeRef: TypeRef<MailFolderRef> = new TypeRef("tutanota", 440)

export function createMailFolderRef(values: StrippedEntity<MailFolderRef>): MailFolderRef {
    return Object.assign(create(typeModels[MailFolderRefTypeRef.typeId], MailFolderRefTypeRef), values)
}

export type MailFolderRef = {
	_type: TypeRef<MailFolderRef>;
	_original?: MailFolderRef

	_id: Id;

	folders: Id;
}
export const MoveMailDataTypeRef: TypeRef<MoveMailData> = new TypeRef("tutanota", 445)

export function createMoveMailData(values: StrippedEntity<MoveMailData>): MoveMailData {
    return Object.assign(create(typeModels[MoveMailDataTypeRef.typeId], MoveMailDataTypeRef), values)
}

export type MoveMailData = {
	_type: TypeRef<MoveMailData>;
	_original?: MoveMailData

	_format: NumberString;
	moveReason: null | NumberString;

	targetFolder: IdTuple;
	mails: IdTuple[];
	excludeMailSet: null | IdTuple;
}
export const CreateMailFolderDataTypeRef: TypeRef<CreateMailFolderData> = new TypeRef("tutanota", 450)

export function createCreateMailFolderData(values: StrippedEntity<CreateMailFolderData>): CreateMailFolderData {
    return Object.assign(create(typeModels[CreateMailFolderDataTypeRef.typeId], CreateMailFolderDataTypeRef), values)
}

export type CreateMailFolderData = {
	_type: TypeRef<CreateMailFolderData>;
	_errors: Object;
	_original?: CreateMailFolderData

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
	_original?: CreateMailFolderReturn

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
	_original?: DeleteMailFolderData

	_format: NumberString;

	folders: IdTuple[];
}
export const EncryptTutanotaPropertiesDataTypeRef: TypeRef<EncryptTutanotaPropertiesData> = new TypeRef("tutanota", 473)

export function createEncryptTutanotaPropertiesData(values: StrippedEntity<EncryptTutanotaPropertiesData>): EncryptTutanotaPropertiesData {
    return Object.assign(create(typeModels[EncryptTutanotaPropertiesDataTypeRef.typeId], EncryptTutanotaPropertiesDataTypeRef), values)
}

export type EncryptTutanotaPropertiesData = {
	_type: TypeRef<EncryptTutanotaPropertiesData>;
	_original?: EncryptTutanotaPropertiesData

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
	_original?: DraftRecipient

	_id: Id;
	name: string;
	mailAddress: string;
}
export const NewDraftAttachmentTypeRef: TypeRef<NewDraftAttachment> = new TypeRef("tutanota", 486)

export function createNewDraftAttachment(values: StrippedEntity<NewDraftAttachment>): NewDraftAttachment {
    return Object.assign(create(typeModels[NewDraftAttachmentTypeRef.typeId], NewDraftAttachmentTypeRef), values)
}

export type NewDraftAttachment = {
	_type: TypeRef<NewDraftAttachment>;
	_original?: NewDraftAttachment

	_id: Id;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;
	encCid: null | Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const DraftAttachmentTypeRef: TypeRef<DraftAttachment> = new TypeRef("tutanota", 491)

export function createDraftAttachment(values: StrippedEntity<DraftAttachment>): DraftAttachment {
    return Object.assign(create(typeModels[DraftAttachmentTypeRef.typeId], DraftAttachmentTypeRef), values)
}

export type DraftAttachment = {
	_type: TypeRef<DraftAttachment>;
	_original?: DraftAttachment

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	newFile: null | NewDraftAttachment;
	existingFile: null | IdTuple;
}
export const DraftDataTypeRef: TypeRef<DraftData> = new TypeRef("tutanota", 496)

export function createDraftData(values: StrippedEntity<DraftData>): DraftData {
    return Object.assign(create(typeModels[DraftDataTypeRef.typeId], DraftDataTypeRef), values)
}

export type DraftData = {
	_type: TypeRef<DraftData>;
	_original?: DraftData

	_id: Id;
	subject: string;
	bodyText: string;
	senderMailAddress: string;
	senderName: string;
	confidential: boolean;
	method: NumberString;
	compressedBodyText: null | string;

	toRecipients: DraftRecipient[];
	ccRecipients: DraftRecipient[];
	bccRecipients: DraftRecipient[];
	addedAttachments: DraftAttachment[];
	removedAttachments: IdTuple[];
	replyTos: EncryptedMailAddress[];
}
export const DraftCreateDataTypeRef: TypeRef<DraftCreateData> = new TypeRef("tutanota", 508)

export function createDraftCreateData(values: StrippedEntity<DraftCreateData>): DraftCreateData {
    return Object.assign(create(typeModels[DraftCreateDataTypeRef.typeId], DraftCreateDataTypeRef), values)
}

export type DraftCreateData = {
	_type: TypeRef<DraftCreateData>;
	_errors: Object;
	_original?: DraftCreateData

	_format: NumberString;
	previousMessageId: null | string;
	conversationType: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	draftData: DraftData;
}
export const DraftCreateReturnTypeRef: TypeRef<DraftCreateReturn> = new TypeRef("tutanota", 516)

export function createDraftCreateReturn(values: StrippedEntity<DraftCreateReturn>): DraftCreateReturn {
    return Object.assign(create(typeModels[DraftCreateReturnTypeRef.typeId], DraftCreateReturnTypeRef), values)
}

export type DraftCreateReturn = {
	_type: TypeRef<DraftCreateReturn>;
	_original?: DraftCreateReturn

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
	_original?: DraftUpdateData

	_format: NumberString;

	draftData: DraftData;
	draft: IdTuple;
}
export const DraftUpdateReturnTypeRef: TypeRef<DraftUpdateReturn> = new TypeRef("tutanota", 523)

export function createDraftUpdateReturn(values: StrippedEntity<DraftUpdateReturn>): DraftUpdateReturn {
    return Object.assign(create(typeModels[DraftUpdateReturnTypeRef.typeId], DraftUpdateReturnTypeRef), values)
}

export type DraftUpdateReturn = {
	_type: TypeRef<DraftUpdateReturn>;
	_errors: Object;
	_original?: DraftUpdateReturn

	_format: NumberString;

	attachments: IdTuple[];
}
export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", 527)

export function createInternalRecipientKeyData(values: StrippedEntity<InternalRecipientKeyData>): InternalRecipientKeyData {
    return Object.assign(create(typeModels[InternalRecipientKeyDataTypeRef.typeId], InternalRecipientKeyDataTypeRef), values)
}

export type InternalRecipientKeyData = {
	_type: TypeRef<InternalRecipientKeyData>;
	_original?: InternalRecipientKeyData

	_id: Id;
	mailAddress: string;
	pubEncBucketKey: Uint8Array;
	recipientKeyVersion: NumberString;
	protocolVersion: NumberString;
	senderKeyVersion: null | NumberString;
}
export const SecureExternalRecipientKeyDataTypeRef: TypeRef<SecureExternalRecipientKeyData> = new TypeRef("tutanota", 532)

export function createSecureExternalRecipientKeyData(values: StrippedEntity<SecureExternalRecipientKeyData>): SecureExternalRecipientKeyData {
    return Object.assign(create(typeModels[SecureExternalRecipientKeyDataTypeRef.typeId], SecureExternalRecipientKeyDataTypeRef), values)
}

export type SecureExternalRecipientKeyData = {
	_type: TypeRef<SecureExternalRecipientKeyData>;
	_original?: SecureExternalRecipientKeyData

	_id: Id;
	mailAddress: string;
	passwordVerifier: Uint8Array;
	salt: null | Uint8Array;
	saltHash: null | Uint8Array;
	pwEncCommunicationKey: null | Uint8Array;
	ownerEncBucketKey: Uint8Array;
	kdfVersion: NumberString;
	ownerKeyVersion: NumberString;
	userGroupKeyVersion: NumberString;
}
export const AttachmentKeyDataTypeRef: TypeRef<AttachmentKeyData> = new TypeRef("tutanota", 542)

export function createAttachmentKeyData(values: StrippedEntity<AttachmentKeyData>): AttachmentKeyData {
    return Object.assign(create(typeModels[AttachmentKeyDataTypeRef.typeId], AttachmentKeyDataTypeRef), values)
}

export type AttachmentKeyData = {
	_type: TypeRef<AttachmentKeyData>;
	_original?: AttachmentKeyData

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
	_original?: SendDraftData

	_format: NumberString;
	language: string;
	mailSessionKey: null | Uint8Array;
	bucketEncMailSessionKey: null | Uint8Array;
	senderNameUnencrypted: null | string;
	plaintext: boolean;
	calendarMethod: boolean;
	sessionEncEncryptionAuthStatus: null | Uint8Array;

	internalRecipientKeyData: InternalRecipientKeyData[];
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[];
	attachmentKeyData: AttachmentKeyData[];
	mail: IdTuple;
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[];
}
export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", 557)

export function createSendDraftReturn(values: StrippedEntity<SendDraftReturn>): SendDraftReturn {
    return Object.assign(create(typeModels[SendDraftReturnTypeRef.typeId], SendDraftReturnTypeRef), values)
}

export type SendDraftReturn = {
	_type: TypeRef<SendDraftReturn>;
	_original?: SendDraftReturn

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
	_original?: ReceiveInfoServiceData

	_format: NumberString;
	language: string;
}
export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", 573)

export function createInboxRule(values: StrippedEntity<InboxRule>): InboxRule {
    return Object.assign(create(typeModels[InboxRuleTypeRef.typeId], InboxRuleTypeRef), values)
}

export type InboxRule = {
	_type: TypeRef<InboxRule>;
	_original?: InboxRule

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
	_original?: EncryptedMailAddress

	_id: Id;
	name: string;
	address: string;
}
export const UserAccountUserDataTypeRef: TypeRef<UserAccountUserData> = new TypeRef("tutanota", 622)

export function createUserAccountUserData(values: StrippedEntity<UserAccountUserData>): UserAccountUserData {
    return Object.assign(create(typeModels[UserAccountUserDataTypeRef.typeId], UserAccountUserDataTypeRef), values)
}

export type UserAccountUserData = {
	_type: TypeRef<UserAccountUserData>;
	_original?: UserAccountUserData

	_id: Id;
	mailAddress: string;
	encryptedName: Uint8Array;
	salt: Uint8Array;
	verifier: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	userEncCustomerGroupKey: Uint8Array;
	userEncMailGroupKey: Uint8Array;
	userEncContactGroupKey: Uint8Array;
	userEncFileGroupKey: Uint8Array;
	userEncEntropy: Uint8Array;
	userEncTutanotaPropertiesSessionKey: Uint8Array;
	mailEncMailBoxSessionKey: Uint8Array;
	contactEncContactListSessionKey: Uint8Array;
	fileEncFileSystemSessionKey: Uint8Array;
	customerEncMailGroupInfoSessionKey: Uint8Array;
	customerEncContactGroupInfoSessionKey: Uint8Array;
	customerEncFileGroupInfoSessionKey: Uint8Array;
	userEncRecoverCode: Uint8Array;
	recoverCodeEncUserGroupKey: Uint8Array;
	recoverCodeVerifier: Uint8Array;
	kdfVersion: NumberString;
	customerKeyVersion: NumberString;
}
export const InternalGroupDataTypeRef: TypeRef<InternalGroupData> = new TypeRef("tutanota", 642)

export function createInternalGroupData(values: StrippedEntity<InternalGroupData>): InternalGroupData {
    return Object.assign(create(typeModels[InternalGroupDataTypeRef.typeId], InternalGroupDataTypeRef), values)
}

export type InternalGroupData = {
	_type: TypeRef<InternalGroupData>;
	_original?: InternalGroupData

	_id: Id;
	pubRsaKey: null | Uint8Array;
	groupEncPrivRsaKey: null | Uint8Array;
	adminEncGroupKey: Uint8Array;
	ownerEncGroupInfoSessionKey: Uint8Array;
	pubEccKey: null | Uint8Array;
	groupEncPrivEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;
	groupEncPrivKyberKey: null | Uint8Array;
	adminKeyVersion: NumberString;
	ownerKeyVersion: NumberString;

	adminGroup: null | Id;
}
export const CustomerAccountCreateDataTypeRef: TypeRef<CustomerAccountCreateData> = new TypeRef("tutanota", 648)

export function createCustomerAccountCreateData(values: StrippedEntity<CustomerAccountCreateData>): CustomerAccountCreateData {
    return Object.assign(create(typeModels[CustomerAccountCreateDataTypeRef.typeId], CustomerAccountCreateDataTypeRef), values)
}

export type CustomerAccountCreateData = {
	_type: TypeRef<CustomerAccountCreateData>;
	_original?: CustomerAccountCreateData

	_format: NumberString;
	authToken: string;
	date: null | Date;
	lang: string;
	userEncAdminGroupKey: Uint8Array;
	userEncAccountGroupKey: Uint8Array;
	adminEncAccountingInfoSessionKey: Uint8Array;
	systemAdminPubEncAccountingInfoSessionKey: Uint8Array;
	adminEncCustomerServerPropertiesSessionKey: Uint8Array;
	code: string;
	systemAdminPublicProtocolVersion: NumberString;
	accountGroupKeyVersion: NumberString;
	systemAdminPubKeyVersion: NumberString;
	app: NumberString;

	userData: UserAccountUserData;
	userGroupData: InternalGroupData;
	adminGroupData: InternalGroupData;
	customerGroupData: InternalGroupData;
}
export const UserAccountCreateDataTypeRef: TypeRef<UserAccountCreateData> = new TypeRef("tutanota", 663)

export function createUserAccountCreateData(values: StrippedEntity<UserAccountCreateData>): UserAccountCreateData {
    return Object.assign(create(typeModels[UserAccountCreateDataTypeRef.typeId], UserAccountCreateDataTypeRef), values)
}

export type UserAccountCreateData = {
	_type: TypeRef<UserAccountCreateData>;
	_original?: UserAccountCreateData

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
	_original?: MailboxServerProperties

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	whitelistProtectionEnabled: boolean;
}
export const MailboxGroupRootTypeRef: TypeRef<MailboxGroupRoot> = new TypeRef("tutanota", 693)

export function createMailboxGroupRoot(values: StrippedEntity<MailboxGroupRoot>): MailboxGroupRoot {
    return Object.assign(create(typeModels[MailboxGroupRootTypeRef.typeId], MailboxGroupRootTypeRef), values)
}

export type MailboxGroupRoot = {
	_type: TypeRef<MailboxGroupRoot>;
	_original?: MailboxGroupRoot

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	mailbox: Id;
	serverProperties: Id;
	calendarEventUpdates: null | CalendarEventUpdateList;
	outOfOfficeNotification: null | Id;
	outOfOfficeNotificationRecipientList: null | OutOfOfficeNotificationRecipientList;
	mailboxProperties: null | Id;
}
export const CreateMailGroupDataTypeRef: TypeRef<CreateMailGroupData> = new TypeRef("tutanota", 707)

export function createCreateMailGroupData(values: StrippedEntity<CreateMailGroupData>): CreateMailGroupData {
    return Object.assign(create(typeModels[CreateMailGroupDataTypeRef.typeId], CreateMailGroupDataTypeRef), values)
}

export type CreateMailGroupData = {
	_type: TypeRef<CreateMailGroupData>;
	_original?: CreateMailGroupData

	_format: NumberString;
	mailAddress: string;
	encryptedName: Uint8Array;
	mailEncMailboxSessionKey: Uint8Array;

	groupData: InternalGroupData;
}
export const DeleteGroupDataTypeRef: TypeRef<DeleteGroupData> = new TypeRef("tutanota", 713)

export function createDeleteGroupData(values: StrippedEntity<DeleteGroupData>): DeleteGroupData {
    return Object.assign(create(typeModels[DeleteGroupDataTypeRef.typeId], DeleteGroupDataTypeRef), values)
}

export type DeleteGroupData = {
	_type: TypeRef<DeleteGroupData>;
	_original?: DeleteGroupData

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
	_original?: Birthday

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
	_original?: PhotosRef

	_id: Id;

	files: Id;
}
export const ListUnsubscribeDataTypeRef: TypeRef<ListUnsubscribeData> = new TypeRef("tutanota", 867)

export function createListUnsubscribeData(values: StrippedEntity<ListUnsubscribeData>): ListUnsubscribeData {
    return Object.assign(create(typeModels[ListUnsubscribeDataTypeRef.typeId], ListUnsubscribeDataTypeRef), values)
}

export type ListUnsubscribeData = {
	_type: TypeRef<ListUnsubscribeData>;
	_original?: ListUnsubscribeData

	_format: NumberString;
	postLink: string;

	mail: IdTuple;
}
export const CalendarRepeatRuleTypeRef: TypeRef<CalendarRepeatRule> = new TypeRef("tutanota", 926)

export function createCalendarRepeatRule(values: StrippedEntity<CalendarRepeatRule>): CalendarRepeatRule {
    return Object.assign(create(typeModels[CalendarRepeatRuleTypeRef.typeId], CalendarRepeatRuleTypeRef), values)
}

export type CalendarRepeatRule = {
	_type: TypeRef<CalendarRepeatRule>;
	_original?: CalendarRepeatRule

	_id: Id;
	frequency: NumberString;
	endType: NumberString;
	endValue: null | NumberString;
	interval: NumberString;
	timeZone: string;

	excludedDates: DateWrapper[];
	advancedRules: AdvancedRepeatRule[];
}
export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", 933)

export function createCalendarEvent(values: StrippedEntity<CalendarEvent>): CalendarEvent {
    return Object.assign(create(typeModels[CalendarEventTypeRef.typeId], CalendarEventTypeRef), values)
}

export type CalendarEvent = {
	_type: TypeRef<CalendarEvent>;
	_errors: Object;
	_original?: CalendarEvent

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	summary: string;
	description: string;
	startTime: Date;
	endTime: Date;
	location: string;
	uid: null | string;
	hashedUid: null | Uint8Array;
	sequence: NumberString;
	invitedConfidentially: null | boolean;
	recurrenceId: null | Date;
	_ownerKeyVersion: null | NumberString;
	sender: null | string;

	repeatRule: null | CalendarRepeatRule;
	alarmInfos: IdTuple[];
	attendees: CalendarEventAttendee[];
	organizer: null | EncryptedMailAddress;
}
export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", 947)

export function createCalendarGroupRoot(values: StrippedEntity<CalendarGroupRoot>): CalendarGroupRoot {
    return Object.assign(create(typeModels[CalendarGroupRootTypeRef.typeId], CalendarGroupRootTypeRef), values)
}

export type CalendarGroupRoot = {
	_type: TypeRef<CalendarGroupRoot>;
	_errors: Object;
	_original?: CalendarGroupRoot

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	shortEvents: Id;
	longEvents: Id;
	index: null | CalendarEventIndexRef;
	pendingEvents: null | CalendarEventsRef;
}
export const UserAreaGroupDataTypeRef: TypeRef<UserAreaGroupData> = new TypeRef("tutanota", 956)

export function createUserAreaGroupData(values: StrippedEntity<UserAreaGroupData>): UserAreaGroupData {
    return Object.assign(create(typeModels[UserAreaGroupDataTypeRef.typeId], UserAreaGroupDataTypeRef), values)
}

export type UserAreaGroupData = {
	_type: TypeRef<UserAreaGroupData>;
	_original?: UserAreaGroupData

	_id: Id;
	groupEncGroupRootSessionKey: Uint8Array;
	adminEncGroupKey: null | Uint8Array;
	customerEncGroupInfoSessionKey: Uint8Array;
	userEncGroupKey: Uint8Array;
	groupInfoEncName: Uint8Array;
	adminKeyVersion: null | NumberString;
	customerKeyVersion: NumberString;
	userKeyVersion: NumberString;

	adminGroup: null | Id;
}
export const UserAreaGroupPostDataTypeRef: TypeRef<UserAreaGroupPostData> = new TypeRef("tutanota", 964)

export function createUserAreaGroupPostData(values: StrippedEntity<UserAreaGroupPostData>): UserAreaGroupPostData {
    return Object.assign(create(typeModels[UserAreaGroupPostDataTypeRef.typeId], UserAreaGroupPostDataTypeRef), values)
}

export type UserAreaGroupPostData = {
	_type: TypeRef<UserAreaGroupPostData>;
	_original?: UserAreaGroupPostData

	_format: NumberString;

	groupData: UserAreaGroupData;
}
export const GroupSettingsTypeRef: TypeRef<GroupSettings> = new TypeRef("tutanota", 968)

export function createGroupSettings(values: StrippedEntity<GroupSettings>): GroupSettings {
    return Object.assign(create(typeModels[GroupSettingsTypeRef.typeId], GroupSettingsTypeRef), values)
}

export type GroupSettings = {
	_type: TypeRef<GroupSettings>;
	_original?: GroupSettings

	_id: Id;
	color: string;
	name: null | string;
	sourceUrl: null | string;

	group: Id;
	defaultAlarmsList: DefaultAlarmInfo[];
}
export const UserSettingsGroupRootTypeRef: TypeRef<UserSettingsGroupRoot> = new TypeRef("tutanota", 972)

export function createUserSettingsGroupRoot(values: StrippedEntity<UserSettingsGroupRoot>): UserSettingsGroupRoot {
    return Object.assign(create(typeModels[UserSettingsGroupRootTypeRef.typeId], UserSettingsGroupRootTypeRef), values)
}

export type UserSettingsGroupRoot = {
	_type: TypeRef<UserSettingsGroupRoot>;
	_errors: Object;
	_original?: UserSettingsGroupRoot

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	timeFormat: NumberString;
	startOfTheWeek: NumberString;
	usageDataOptedIn: null | boolean;
	_ownerKeyVersion: null | NumberString;
	birthdayCalendarColor: null | string;

	groupSettings: GroupSettings[];
	defaultCalendar: null | Id;
}
export const CalendarDeleteDataTypeRef: TypeRef<CalendarDeleteData> = new TypeRef("tutanota", 982)

export function createCalendarDeleteData(values: StrippedEntity<CalendarDeleteData>): CalendarDeleteData {
    return Object.assign(create(typeModels[CalendarDeleteDataTypeRef.typeId], CalendarDeleteDataTypeRef), values)
}

export type CalendarDeleteData = {
	_type: TypeRef<CalendarDeleteData>;
	_original?: CalendarDeleteData

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
	_original?: CreateGroupPostReturn

	_format: NumberString;

	group: Id;
}
export const SharedGroupDataTypeRef: TypeRef<SharedGroupData> = new TypeRef("tutanota", 992)

export function createSharedGroupData(values: StrippedEntity<SharedGroupData>): SharedGroupData {
    return Object.assign(create(typeModels[SharedGroupDataTypeRef.typeId], SharedGroupDataTypeRef), values)
}

export type SharedGroupData = {
	_type: TypeRef<SharedGroupData>;
	_original?: SharedGroupData

	_id: Id;
	capability: NumberString;
	sessionEncSharedGroupKey: Uint8Array;
	sessionEncSharedGroupName: Uint8Array;
	sessionEncInviterName: Uint8Array;
	bucketEncInvitationSessionKey: Uint8Array;
	sharedGroupEncInviterGroupInfoKey: Uint8Array;
	sharedGroupEncSharedGroupInfoKey: Uint8Array;
	sharedGroup: Id;
	sharedGroupKeyVersion: NumberString;
}
export const GroupInvitationPostDataTypeRef: TypeRef<GroupInvitationPostData> = new TypeRef("tutanota", 1002)

export function createGroupInvitationPostData(values: StrippedEntity<GroupInvitationPostData>): GroupInvitationPostData {
    return Object.assign(create(typeModels[GroupInvitationPostDataTypeRef.typeId], GroupInvitationPostDataTypeRef), values)
}

export type GroupInvitationPostData = {
	_type: TypeRef<GroupInvitationPostData>;
	_original?: GroupInvitationPostData

	_format: NumberString;

	sharedGroupData: SharedGroupData;
	internalKeyData: InternalRecipientKeyData[];
}
export const GroupInvitationPostReturnTypeRef: TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", 1006)

export function createGroupInvitationPostReturn(values: StrippedEntity<GroupInvitationPostReturn>): GroupInvitationPostReturn {
    return Object.assign(create(typeModels[GroupInvitationPostReturnTypeRef.typeId], GroupInvitationPostReturnTypeRef), values)
}

export type GroupInvitationPostReturn = {
	_type: TypeRef<GroupInvitationPostReturn>;
	_original?: GroupInvitationPostReturn

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
	_original?: GroupInvitationPutData

	_format: NumberString;
	userGroupEncGroupKey: Uint8Array;
	sharedGroupEncInviteeGroupInfoKey: Uint8Array;
	userGroupKeyVersion: NumberString;
	sharedGroupKeyVersion: NumberString;

	receivedInvitation: IdTuple;
}
export const GroupInvitationDeleteDataTypeRef: TypeRef<GroupInvitationDeleteData> = new TypeRef("tutanota", 1016)

export function createGroupInvitationDeleteData(values: StrippedEntity<GroupInvitationDeleteData>): GroupInvitationDeleteData {
    return Object.assign(create(typeModels[GroupInvitationDeleteDataTypeRef.typeId], GroupInvitationDeleteDataTypeRef), values)
}

export type GroupInvitationDeleteData = {
	_type: TypeRef<GroupInvitationDeleteData>;
	_original?: GroupInvitationDeleteData

	_format: NumberString;

	receivedInvitation: IdTuple;
}
export const ReportedMailFieldMarkerTypeRef: TypeRef<ReportedMailFieldMarker> = new TypeRef("tutanota", 1023)

export function createReportedMailFieldMarker(values: StrippedEntity<ReportedMailFieldMarker>): ReportedMailFieldMarker {
    return Object.assign(create(typeModels[ReportedMailFieldMarkerTypeRef.typeId], ReportedMailFieldMarkerTypeRef), values)
}

export type ReportedMailFieldMarker = {
	_type: TypeRef<ReportedMailFieldMarker>;
	_original?: ReportedMailFieldMarker

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
	_original?: PhishingMarkerWebsocketData

	_format: NumberString;
	lastId: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	markers: ReportedMailFieldMarker[];
}
export const ReportMailPostDataTypeRef: TypeRef<ReportMailPostData> = new TypeRef("tutanota", 1066)

export function createReportMailPostData(values: StrippedEntity<ReportMailPostData>): ReportMailPostData {
    return Object.assign(create(typeModels[ReportMailPostDataTypeRef.typeId], ReportMailPostDataTypeRef), values)
}

export type ReportMailPostData = {
	_type: TypeRef<ReportMailPostData>;
	_original?: ReportMailPostData

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
	_original?: CalendarEventAttendee

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
	_original?: CalendarEventUidIndex

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	progenitor: null | IdTuple;
	alteredInstances: IdTuple[];
}
export const CalendarEventIndexRefTypeRef: TypeRef<CalendarEventIndexRef> = new TypeRef("tutanota", 1100)

export function createCalendarEventIndexRef(values: StrippedEntity<CalendarEventIndexRef>): CalendarEventIndexRef {
    return Object.assign(create(typeModels[CalendarEventIndexRefTypeRef.typeId], CalendarEventIndexRefTypeRef), values)
}

export type CalendarEventIndexRef = {
	_type: TypeRef<CalendarEventIndexRef>;
	_original?: CalendarEventIndexRef

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
	_original?: CalendarEventUpdate

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	sender: string;
	_ownerKeyVersion: null | NumberString;

	file: IdTuple;
}
export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", 1113)

export function createCalendarEventUpdateList(values: StrippedEntity<CalendarEventUpdateList>): CalendarEventUpdateList {
    return Object.assign(create(typeModels[CalendarEventUpdateListTypeRef.typeId], CalendarEventUpdateListTypeRef), values)
}

export type CalendarEventUpdateList = {
	_type: TypeRef<CalendarEventUpdateList>;
	_original?: CalendarEventUpdateList

	_id: Id;

	list: Id;
}
export const EntropyDataTypeRef: TypeRef<EntropyData> = new TypeRef("tutanota", 1122)

export function createEntropyData(values: StrippedEntity<EntropyData>): EntropyData {
    return Object.assign(create(typeModels[EntropyDataTypeRef.typeId], EntropyDataTypeRef), values)
}

export type EntropyData = {
	_type: TypeRef<EntropyData>;
	_original?: EntropyData

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
	_original?: OutOfOfficeNotificationMessage

	_id: Id;
	subject: string;
	message: string;
	type: NumberString;
}
export const OutOfOfficeNotificationTypeRef: TypeRef<OutOfOfficeNotification> = new TypeRef("tutanota", 1131)

export function createOutOfOfficeNotification(values: StrippedEntity<OutOfOfficeNotification>): OutOfOfficeNotification {
    return Object.assign(create(typeModels[OutOfOfficeNotificationTypeRef.typeId], OutOfOfficeNotificationTypeRef), values)
}

export type OutOfOfficeNotification = {
	_type: TypeRef<OutOfOfficeNotification>;
	_original?: OutOfOfficeNotification

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	enabled: boolean;
	startDate: null | Date;
	endDate: null | Date;

	notifications: OutOfOfficeNotificationMessage[];
}
export const OutOfOfficeNotificationRecipientTypeRef: TypeRef<OutOfOfficeNotificationRecipient> = new TypeRef("tutanota", 1141)

export function createOutOfOfficeNotificationRecipient(values: StrippedEntity<OutOfOfficeNotificationRecipient>): OutOfOfficeNotificationRecipient {
    return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientTypeRef.typeId], OutOfOfficeNotificationRecipientTypeRef), values)
}

export type OutOfOfficeNotificationRecipient = {
	_type: TypeRef<OutOfOfficeNotificationRecipient>;
	_original?: OutOfOfficeNotificationRecipient

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
}
export const OutOfOfficeNotificationRecipientListTypeRef: TypeRef<OutOfOfficeNotificationRecipientList> = new TypeRef("tutanota", 1147)

export function createOutOfOfficeNotificationRecipientList(values: StrippedEntity<OutOfOfficeNotificationRecipientList>): OutOfOfficeNotificationRecipientList {
    return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientListTypeRef.typeId], OutOfOfficeNotificationRecipientListTypeRef), values)
}

export type OutOfOfficeNotificationRecipientList = {
	_type: TypeRef<OutOfOfficeNotificationRecipientList>;
	_original?: OutOfOfficeNotificationRecipientList

	_id: Id;

	list: Id;
}
export const EmailTemplateContentTypeRef: TypeRef<EmailTemplateContent> = new TypeRef("tutanota", 1154)

export function createEmailTemplateContent(values: StrippedEntity<EmailTemplateContent>): EmailTemplateContent {
    return Object.assign(create(typeModels[EmailTemplateContentTypeRef.typeId], EmailTemplateContentTypeRef), values)
}

export type EmailTemplateContent = {
	_type: TypeRef<EmailTemplateContent>;
	_original?: EmailTemplateContent

	_id: Id;
	text: string;
	languageCode: string;
}
export const EmailTemplateTypeRef: TypeRef<EmailTemplate> = new TypeRef("tutanota", 1158)

export function createEmailTemplate(values: StrippedEntity<EmailTemplate>): EmailTemplate {
    return Object.assign(create(typeModels[EmailTemplateTypeRef.typeId], EmailTemplateTypeRef), values)
}

export type EmailTemplate = {
	_type: TypeRef<EmailTemplate>;
	_errors: Object;
	_original?: EmailTemplate

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	title: string;
	tag: string;
	_ownerKeyVersion: null | NumberString;

	contents: EmailTemplateContent[];
}
export const KnowledgeBaseEntryKeywordTypeRef: TypeRef<KnowledgeBaseEntryKeyword> = new TypeRef("tutanota", 1168)

export function createKnowledgeBaseEntryKeyword(values: StrippedEntity<KnowledgeBaseEntryKeyword>): KnowledgeBaseEntryKeyword {
    return Object.assign(create(typeModels[KnowledgeBaseEntryKeywordTypeRef.typeId], KnowledgeBaseEntryKeywordTypeRef), values)
}

export type KnowledgeBaseEntryKeyword = {
	_type: TypeRef<KnowledgeBaseEntryKeyword>;
	_original?: KnowledgeBaseEntryKeyword

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
	_original?: KnowledgeBaseEntry

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	title: string;
	description: string;
	_ownerKeyVersion: null | NumberString;

	keywords: KnowledgeBaseEntryKeyword[];
}
export const TemplateGroupRootTypeRef: TypeRef<TemplateGroupRoot> = new TypeRef("tutanota", 1181)

export function createTemplateGroupRoot(values: StrippedEntity<TemplateGroupRoot>): TemplateGroupRoot {
    return Object.assign(create(typeModels[TemplateGroupRootTypeRef.typeId], TemplateGroupRootTypeRef), values)
}

export type TemplateGroupRoot = {
	_type: TypeRef<TemplateGroupRoot>;
	_errors: Object;
	_original?: TemplateGroupRoot

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	templates: Id;
	knowledgeBase: Id;
}
export const UserAreaGroupDeleteDataTypeRef: TypeRef<UserAreaGroupDeleteData> = new TypeRef("tutanota", 1190)

export function createUserAreaGroupDeleteData(values: StrippedEntity<UserAreaGroupDeleteData>): UserAreaGroupDeleteData {
    return Object.assign(create(typeModels[UserAreaGroupDeleteDataTypeRef.typeId], UserAreaGroupDeleteDataTypeRef), values)
}

export type UserAreaGroupDeleteData = {
	_type: TypeRef<UserAreaGroupDeleteData>;
	_original?: UserAreaGroupDeleteData

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
	_original?: MailboxProperties

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	reportMovedMails: NumberString;
	_ownerKeyVersion: null | NumberString;

	mailAddressProperties: MailAddressProperties[];
}
export const SpamResultsTypeRef: TypeRef<SpamResults> = new TypeRef("tutanota", 1217)

export function createSpamResults(values: StrippedEntity<SpamResults>): SpamResults {
    return Object.assign(create(typeModels[SpamResultsTypeRef.typeId], SpamResultsTypeRef), values)
}

export type SpamResults = {
	_type: TypeRef<SpamResults>;
	_original?: SpamResults

	_id: Id;

	list: Id;
}
export const NewsIdTypeRef: TypeRef<NewsId> = new TypeRef("tutanota", 1245)

export function createNewsId(values: StrippedEntity<NewsId>): NewsId {
    return Object.assign(create(typeModels[NewsIdTypeRef.typeId], NewsIdTypeRef), values)
}

export type NewsId = {
	_type: TypeRef<NewsId>;
	_original?: NewsId

	_id: Id;
	newsItemName: string;
	newsItemId: Id;
}
export const NewsOutTypeRef: TypeRef<NewsOut> = new TypeRef("tutanota", 1256)

export function createNewsOut(values: StrippedEntity<NewsOut>): NewsOut {
    return Object.assign(create(typeModels[NewsOutTypeRef.typeId], NewsOutTypeRef), values)
}

export type NewsOut = {
	_type: TypeRef<NewsOut>;
	_original?: NewsOut

	_format: NumberString;

	newsItemIds: NewsId[];
}
export const NewsInTypeRef: TypeRef<NewsIn> = new TypeRef("tutanota", 1259)

export function createNewsIn(values: StrippedEntity<NewsIn>): NewsIn {
    return Object.assign(create(typeModels[NewsInTypeRef.typeId], NewsInTypeRef), values)
}

export type NewsIn = {
	_type: TypeRef<NewsIn>;
	_original?: NewsIn

	_format: NumberString;
	newsItemId: null | Id;
}
export const MailAddressPropertiesTypeRef: TypeRef<MailAddressProperties> = new TypeRef("tutanota", 1263)

export function createMailAddressProperties(values: StrippedEntity<MailAddressProperties>): MailAddressProperties {
    return Object.assign(create(typeModels[MailAddressPropertiesTypeRef.typeId], MailAddressPropertiesTypeRef), values)
}

export type MailAddressProperties = {
	_type: TypeRef<MailAddressProperties>;
	_original?: MailAddressProperties

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
	_original?: Header

	_id: Id;
	headers: null | string;
	compressedHeaders: null | string;
}
export const BodyTypeRef: TypeRef<Body> = new TypeRef("tutanota", 1273)

export function createBody(values: StrippedEntity<Body>): Body {
    return Object.assign(create(typeModels[BodyTypeRef.typeId], BodyTypeRef), values)
}

export type Body = {
	_type: TypeRef<Body>;
	_original?: Body

	_id: Id;
	text: null | string;
	compressedText: null | string;
}
export const RecipientsTypeRef: TypeRef<Recipients> = new TypeRef("tutanota", 1277)

export function createRecipients(values: StrippedEntity<Recipients>): Recipients {
    return Object.assign(create(typeModels[RecipientsTypeRef.typeId], RecipientsTypeRef), values)
}

export type Recipients = {
	_type: TypeRef<Recipients>;
	_original?: Recipients

	_id: Id;

	toRecipients: MailAddress[];
	ccRecipients: MailAddress[];
	bccRecipients: MailAddress[];
}
export const MailDetailsTypeRef: TypeRef<MailDetails> = new TypeRef("tutanota", 1282)

export function createMailDetails(values: StrippedEntity<MailDetails>): MailDetails {
    return Object.assign(create(typeModels[MailDetailsTypeRef.typeId], MailDetailsTypeRef), values)
}

export type MailDetails = {
	_type: TypeRef<MailDetails>;
	_original?: MailDetails

	_id: Id;
	sentDate: Date;
	authStatus: NumberString;

	replyTos: EncryptedMailAddress[];
	recipients: Recipients;
	headers: null | Header;
	body: Body;
}
export const MailDetailsDraftTypeRef: TypeRef<MailDetailsDraft> = new TypeRef("tutanota", 1290)

export function createMailDetailsDraft(values: StrippedEntity<MailDetailsDraft>): MailDetailsDraft {
    return Object.assign(create(typeModels[MailDetailsDraftTypeRef.typeId], MailDetailsDraftTypeRef), values)
}

export type MailDetailsDraft = {
	_type: TypeRef<MailDetailsDraft>;
	_errors: Object;
	_original?: MailDetailsDraft

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	details: MailDetails;
}
export const MailDetailsBlobTypeRef: TypeRef<MailDetailsBlob> = new TypeRef("tutanota", 1298)

export function createMailDetailsBlob(values: StrippedEntity<MailDetailsBlob>): MailDetailsBlob {
    return Object.assign(create(typeModels[MailDetailsBlobTypeRef.typeId], MailDetailsBlobTypeRef), values)
}

export type MailDetailsBlob = {
	_type: TypeRef<MailDetailsBlob>;
	_errors: Object;
	_original?: MailDetailsBlob

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	details: MailDetails;
}
export const UpdateMailFolderDataTypeRef: TypeRef<UpdateMailFolderData> = new TypeRef("tutanota", 1311)

export function createUpdateMailFolderData(values: StrippedEntity<UpdateMailFolderData>): UpdateMailFolderData {
    return Object.assign(create(typeModels[UpdateMailFolderDataTypeRef.typeId], UpdateMailFolderDataTypeRef), values)
}

export type UpdateMailFolderData = {
	_type: TypeRef<UpdateMailFolderData>;
	_original?: UpdateMailFolderData

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
	_original?: MailDetailsDraftsRef

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
	_original?: ContactListEntry

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	emailAddress: string;
	_ownerKeyVersion: null | NumberString;
}
export const ContactListGroupRootTypeRef: TypeRef<ContactListGroupRoot> = new TypeRef("tutanota", 1333)

export function createContactListGroupRoot(values: StrippedEntity<ContactListGroupRoot>): ContactListGroupRoot {
    return Object.assign(create(typeModels[ContactListGroupRootTypeRef.typeId], ContactListGroupRootTypeRef), values)
}

export type ContactListGroupRoot = {
	_type: TypeRef<ContactListGroupRoot>;
	_errors: Object;
	_original?: ContactListGroupRoot

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	entries: Id;
}
export const SymEncInternalRecipientKeyDataTypeRef: TypeRef<SymEncInternalRecipientKeyData> = new TypeRef("tutanota", 1347)

export function createSymEncInternalRecipientKeyData(values: StrippedEntity<SymEncInternalRecipientKeyData>): SymEncInternalRecipientKeyData {
    return Object.assign(create(typeModels[SymEncInternalRecipientKeyDataTypeRef.typeId], SymEncInternalRecipientKeyDataTypeRef), values)
}

export type SymEncInternalRecipientKeyData = {
	_type: TypeRef<SymEncInternalRecipientKeyData>;
	_original?: SymEncInternalRecipientKeyData

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
	_original?: ContactCustomDate

	_id: Id;
	type: NumberString;
	customTypeName: string;
	dateIso: string;
}
export const ContactWebsiteTypeRef: TypeRef<ContactWebsite> = new TypeRef("tutanota", 1361)

export function createContactWebsite(values: StrippedEntity<ContactWebsite>): ContactWebsite {
    return Object.assign(create(typeModels[ContactWebsiteTypeRef.typeId], ContactWebsiteTypeRef), values)
}

export type ContactWebsite = {
	_type: TypeRef<ContactWebsite>;
	_original?: ContactWebsite

	_id: Id;
	type: NumberString;
	customTypeName: string;
	url: string;
}
export const ContactRelationshipTypeRef: TypeRef<ContactRelationship> = new TypeRef("tutanota", 1366)

export function createContactRelationship(values: StrippedEntity<ContactRelationship>): ContactRelationship {
    return Object.assign(create(typeModels[ContactRelationshipTypeRef.typeId], ContactRelationshipTypeRef), values)
}

export type ContactRelationship = {
	_type: TypeRef<ContactRelationship>;
	_original?: ContactRelationship

	_id: Id;
	type: NumberString;
	customTypeName: string;
	person: string;
}
export const ContactMessengerHandleTypeRef: TypeRef<ContactMessengerHandle> = new TypeRef("tutanota", 1371)

export function createContactMessengerHandle(values: StrippedEntity<ContactMessengerHandle>): ContactMessengerHandle {
    return Object.assign(create(typeModels[ContactMessengerHandleTypeRef.typeId], ContactMessengerHandleTypeRef), values)
}

export type ContactMessengerHandle = {
	_type: TypeRef<ContactMessengerHandle>;
	_original?: ContactMessengerHandle

	_id: Id;
	type: NumberString;
	customTypeName: string;
	handle: string;
}
export const ContactPronounsTypeRef: TypeRef<ContactPronouns> = new TypeRef("tutanota", 1376)

export function createContactPronouns(values: StrippedEntity<ContactPronouns>): ContactPronouns {
    return Object.assign(create(typeModels[ContactPronounsTypeRef.typeId], ContactPronounsTypeRef), values)
}

export type ContactPronouns = {
	_type: TypeRef<ContactPronouns>;
	_original?: ContactPronouns

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
	_original?: TranslationGetIn

	_format: NumberString;
	lang: string;
}
export const TranslationGetOutTypeRef: TypeRef<TranslationGetOut> = new TypeRef("tutanota", 1439)

export function createTranslationGetOut(values: StrippedEntity<TranslationGetOut>): TranslationGetOut {
    return Object.assign(create(typeModels[TranslationGetOutTypeRef.typeId], TranslationGetOutTypeRef), values)
}

export type TranslationGetOut = {
	_type: TypeRef<TranslationGetOut>;
	_original?: TranslationGetOut

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
	_original?: DefaultAlarmInfo

	_id: Id;
	trigger: string;
}
export const MailSetEntryTypeRef: TypeRef<MailSetEntry> = new TypeRef("tutanota", 1450)

export function createMailSetEntry(values: StrippedEntity<MailSetEntry>): MailSetEntry {
    return Object.assign(create(typeModels[MailSetEntryTypeRef.typeId], MailSetEntryTypeRef), values)
}

export type MailSetEntry = {
	_type: TypeRef<MailSetEntry>;
	_original?: MailSetEntry

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	mail: IdTuple;
}
export const MailBagTypeRef: TypeRef<MailBag> = new TypeRef("tutanota", 1460)

export function createMailBag(values: StrippedEntity<MailBag>): MailBag {
    return Object.assign(create(typeModels[MailBagTypeRef.typeId], MailBagTypeRef), values)
}

export type MailBag = {
	_type: TypeRef<MailBag>;
	_original?: MailBag

	_id: Id;

	mails: Id;
}
export const SimpleMoveMailPostInTypeRef: TypeRef<SimpleMoveMailPostIn> = new TypeRef("tutanota", 1469)

export function createSimpleMoveMailPostIn(values: StrippedEntity<SimpleMoveMailPostIn>): SimpleMoveMailPostIn {
    return Object.assign(create(typeModels[SimpleMoveMailPostInTypeRef.typeId], SimpleMoveMailPostInTypeRef), values)
}

export type SimpleMoveMailPostIn = {
	_type: TypeRef<SimpleMoveMailPostIn>;
	_original?: SimpleMoveMailPostIn

	_format: NumberString;
	destinationSetType: NumberString;
	moveReason: null | NumberString;

	mails: IdTuple[];
}
export const UnreadMailStatePostInTypeRef: TypeRef<UnreadMailStatePostIn> = new TypeRef("tutanota", 1474)

export function createUnreadMailStatePostIn(values: StrippedEntity<UnreadMailStatePostIn>): UnreadMailStatePostIn {
    return Object.assign(create(typeModels[UnreadMailStatePostInTypeRef.typeId], UnreadMailStatePostInTypeRef), values)
}

export type UnreadMailStatePostIn = {
	_type: TypeRef<UnreadMailStatePostIn>;
	_original?: UnreadMailStatePostIn

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
	_original?: ManageLabelServiceLabelData

	_id: Id;
	name: string;
	color: string;
}
export const ManageLabelServicePostInTypeRef: TypeRef<ManageLabelServicePostIn> = new TypeRef("tutanota", 1484)

export function createManageLabelServicePostIn(values: StrippedEntity<ManageLabelServicePostIn>): ManageLabelServicePostIn {
    return Object.assign(create(typeModels[ManageLabelServicePostInTypeRef.typeId], ManageLabelServicePostInTypeRef), values)
}

export type ManageLabelServicePostIn = {
	_type: TypeRef<ManageLabelServicePostIn>;
	_errors: Object;
	_original?: ManageLabelServicePostIn

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	ownerGroup: Id;

	data: ManageLabelServiceLabelData;
}
export const ManageLabelServiceDeleteInTypeRef: TypeRef<ManageLabelServiceDeleteIn> = new TypeRef("tutanota", 1500)

export function createManageLabelServiceDeleteIn(values: StrippedEntity<ManageLabelServiceDeleteIn>): ManageLabelServiceDeleteIn {
    return Object.assign(create(typeModels[ManageLabelServiceDeleteInTypeRef.typeId], ManageLabelServiceDeleteInTypeRef), values)
}

export type ManageLabelServiceDeleteIn = {
	_type: TypeRef<ManageLabelServiceDeleteIn>;
	_original?: ManageLabelServiceDeleteIn

	_format: NumberString;

	label: IdTuple;
}
export const ApplyLabelServicePostInTypeRef: TypeRef<ApplyLabelServicePostIn> = new TypeRef("tutanota", 1504)

export function createApplyLabelServicePostIn(values: StrippedEntity<ApplyLabelServicePostIn>): ApplyLabelServicePostIn {
    return Object.assign(create(typeModels[ApplyLabelServicePostInTypeRef.typeId], ApplyLabelServicePostInTypeRef), values)
}

export type ApplyLabelServicePostIn = {
	_type: TypeRef<ApplyLabelServicePostIn>;
	_original?: ApplyLabelServicePostIn

	_format: NumberString;

	mails: IdTuple[];
	addedLabels: IdTuple[];
	removedLabels: IdTuple[];
}
export const ImportMailDataMailReferenceTypeRef: TypeRef<ImportMailDataMailReference> = new TypeRef("tutanota", 1513)

export function createImportMailDataMailReference(values: StrippedEntity<ImportMailDataMailReference>): ImportMailDataMailReference {
    return Object.assign(create(typeModels[ImportMailDataMailReferenceTypeRef.typeId], ImportMailDataMailReferenceTypeRef), values)
}

export type ImportMailDataMailReference = {
	_type: TypeRef<ImportMailDataMailReference>;
	_original?: ImportMailDataMailReference

	_id: Id;
	reference: string;
}
export const NewImportAttachmentTypeRef: TypeRef<NewImportAttachment> = new TypeRef("tutanota", 1516)

export function createNewImportAttachment(values: StrippedEntity<NewImportAttachment>): NewImportAttachment {
    return Object.assign(create(typeModels[NewImportAttachmentTypeRef.typeId], NewImportAttachmentTypeRef), values)
}

export type NewImportAttachment = {
	_type: TypeRef<NewImportAttachment>;
	_original?: NewImportAttachment

	_id: Id;
	ownerEncFileHashSessionKey: null | Uint8Array;
	encFileHash: null | Uint8Array;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;
	encCid: null | Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const ImportAttachmentTypeRef: TypeRef<ImportAttachment> = new TypeRef("tutanota", 1524)

export function createImportAttachment(values: StrippedEntity<ImportAttachment>): ImportAttachment {
    return Object.assign(create(typeModels[ImportAttachmentTypeRef.typeId], ImportAttachmentTypeRef), values)
}

export type ImportAttachment = {
	_type: TypeRef<ImportAttachment>;
	_original?: ImportAttachment

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;
	ownerFileKeyVersion: NumberString;

	newAttachment: null | NewImportAttachment;
	existingAttachmentFile: null | IdTuple;
}
export const ImportMailDataTypeRef: TypeRef<ImportMailData> = new TypeRef("tutanota", 1530)

export function createImportMailData(values: StrippedEntity<ImportMailData>): ImportMailData {
    return Object.assign(create(typeModels[ImportMailDataTypeRef.typeId], ImportMailDataTypeRef), values)
}

export type ImportMailData = {
	_type: TypeRef<ImportMailData>;
	_errors: Object;
	_original?: ImportMailData

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	subject: string;
	compressedBodyText: string;
	date: Date;
	state: NumberString;
	unread: boolean;
	messageId: null | string;
	inReplyTo: null | string;
	confidential: boolean;
	method: NumberString;
	replyType: NumberString;
	differentEnvelopeSender: null | string;
	phishingStatus: NumberString;
	compressedHeaders: string;

	references: ImportMailDataMailReference[];
	sender: MailAddress;
	replyTos: EncryptedMailAddress[];
	recipients: Recipients;
	importedAttachments: ImportAttachment[];
}
export const ImportedMailTypeRef: TypeRef<ImportedMail> = new TypeRef("tutanota", 1552)

export function createImportedMail(values: StrippedEntity<ImportedMail>): ImportedMail {
    return Object.assign(create(typeModels[ImportedMailTypeRef.typeId], ImportedMailTypeRef), values)
}

export type ImportedMail = {
	_type: TypeRef<ImportedMail>;
	_original?: ImportedMail

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	mailSetEntry: IdTuple;
}
export const ImportMailStateTypeRef: TypeRef<ImportMailState> = new TypeRef("tutanota", 1559)

export function createImportMailState(values: StrippedEntity<ImportMailState>): ImportMailState {
    return Object.assign(create(typeModels[ImportMailStateTypeRef.typeId], ImportMailStateTypeRef), values)
}

export type ImportMailState = {
	_type: TypeRef<ImportMailState>;
	_original?: ImportMailState

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	status: NumberString;
	successfulMails: NumberString;
	failedMails: NumberString;
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
	_original?: ImportMailPostIn

	_format: NumberString;

	mailState: IdTuple;
	encImports: StringWrapper[];
}
export const ImportMailPostOutTypeRef: TypeRef<ImportMailPostOut> = new TypeRef("tutanota", 1579)

export function createImportMailPostOut(values: StrippedEntity<ImportMailPostOut>): ImportMailPostOut {
    return Object.assign(create(typeModels[ImportMailPostOutTypeRef.typeId], ImportMailPostOutTypeRef), values)
}

export type ImportMailPostOut = {
	_type: TypeRef<ImportMailPostOut>;
	_original?: ImportMailPostOut

	_format: NumberString;
}
export const ImportMailGetInTypeRef: TypeRef<ImportMailGetIn> = new TypeRef("tutanota", 1582)

export function createImportMailGetIn(values: StrippedEntity<ImportMailGetIn>): ImportMailGetIn {
    return Object.assign(create(typeModels[ImportMailGetInTypeRef.typeId], ImportMailGetInTypeRef), values)
}

export type ImportMailGetIn = {
	_type: TypeRef<ImportMailGetIn>;
	_errors: Object;
	_original?: ImportMailGetIn

	_format: NumberString;
	ownerGroup: Id;
	ownerKeyVersion: NumberString;
	ownerEncSessionKey: Uint8Array;
	newImportedMailSetName: string;
	totalMails: NumberString;

	targetMailFolder: IdTuple;
}
export const AdvancedRepeatRuleTypeRef: TypeRef<AdvancedRepeatRule> = new TypeRef("tutanota", 1586)

export function createAdvancedRepeatRule(values: StrippedEntity<AdvancedRepeatRule>): AdvancedRepeatRule {
    return Object.assign(create(typeModels[AdvancedRepeatRuleTypeRef.typeId], AdvancedRepeatRuleTypeRef), values)
}

export type AdvancedRepeatRule = {
	_type: TypeRef<AdvancedRepeatRule>;
	_original?: AdvancedRepeatRule

	_id: Id;
	ruleType: NumberString;
	interval: string;
}
export const ImportMailGetOutTypeRef: TypeRef<ImportMailGetOut> = new TypeRef("tutanota", 1591)

export function createImportMailGetOut(values: StrippedEntity<ImportMailGetOut>): ImportMailGetOut {
    return Object.assign(create(typeModels[ImportMailGetOutTypeRef.typeId], ImportMailGetOutTypeRef), values)
}

export type ImportMailGetOut = {
	_type: TypeRef<ImportMailGetOut>;
	_original?: ImportMailGetOut

	_format: NumberString;

	mailState: IdTuple;
}
export const MailExportTokenServicePostOutTypeRef: TypeRef<MailExportTokenServicePostOut> = new TypeRef("tutanota", 1605)

export function createMailExportTokenServicePostOut(values: StrippedEntity<MailExportTokenServicePostOut>): MailExportTokenServicePostOut {
    return Object.assign(create(typeModels[MailExportTokenServicePostOutTypeRef.typeId], MailExportTokenServicePostOutTypeRef), values)
}

export type MailExportTokenServicePostOut = {
	_type: TypeRef<MailExportTokenServicePostOut>;
	_original?: MailExportTokenServicePostOut

	_format: NumberString;
	mailExportToken: string;
}
export const SupportTopicTypeRef: TypeRef<SupportTopic> = new TypeRef("tutanota", 1618)

export function createSupportTopic(values: StrippedEntity<SupportTopic>): SupportTopic {
    return Object.assign(create(typeModels[SupportTopicTypeRef.typeId], SupportTopicTypeRef), values)
}

export type SupportTopic = {
	_type: TypeRef<SupportTopic>;
	_original?: SupportTopic

	_id: Id;
	lastUpdated: Date;
	issueEN: string;
	issueDE: string;
	solutionHtmlEN: string;
	solutionHtmlDE: string;
	visibility: NumberString;
	contactTemplateHtmlEN: string;
	contactTemplateHtmlDE: string;
	helpTextEN: string;
	helpTextDE: string;
	contactSupportTextEN: null | string;
	contactSupportTextDE: null | string;
}
export const SupportCategoryTypeRef: TypeRef<SupportCategory> = new TypeRef("tutanota", 1626)

export function createSupportCategory(values: StrippedEntity<SupportCategory>): SupportCategory {
    return Object.assign(create(typeModels[SupportCategoryTypeRef.typeId], SupportCategoryTypeRef), values)
}

export type SupportCategory = {
	_type: TypeRef<SupportCategory>;
	_original?: SupportCategory

	_id: Id;
	nameEN: string;
	nameDE: string;
	introductionEN: string;
	introductionDE: string;
	icon: string;
	contactTemplateHtmlEN: string;
	contactTemplateHtmlDE: string;
	helpTextEN: string;
	helpTextDE: string;

	topics: SupportTopic[];
}
export const SupportDataTypeRef: TypeRef<SupportData> = new TypeRef("tutanota", 1634)

export function createSupportData(values: StrippedEntity<SupportData>): SupportData {
    return Object.assign(create(typeModels[SupportDataTypeRef.typeId], SupportDataTypeRef), values)
}

export type SupportData = {
	_type: TypeRef<SupportData>;
	_original?: SupportData

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	categories: SupportCategory[];
}
export const ReceiveInfoServicePostOutTypeRef: TypeRef<ReceiveInfoServicePostOut> = new TypeRef("tutanota", 1641)

export function createReceiveInfoServicePostOut(values: StrippedEntity<ReceiveInfoServicePostOut>): ReceiveInfoServicePostOut {
    return Object.assign(create(typeModels[ReceiveInfoServicePostOutTypeRef.typeId], ReceiveInfoServicePostOutTypeRef), values)
}

export type ReceiveInfoServicePostOut = {
	_type: TypeRef<ReceiveInfoServicePostOut>;
	_original?: ReceiveInfoServicePostOut

	_format: NumberString;
	outdatedVersion: boolean;
}
export const ResolveConversationsServiceGetInTypeRef: TypeRef<ResolveConversationsServiceGetIn> = new TypeRef("tutanota", 1645)

export function createResolveConversationsServiceGetIn(values: StrippedEntity<ResolveConversationsServiceGetIn>): ResolveConversationsServiceGetIn {
    return Object.assign(create(typeModels[ResolveConversationsServiceGetInTypeRef.typeId], ResolveConversationsServiceGetInTypeRef), values)
}

export type ResolveConversationsServiceGetIn = {
	_type: TypeRef<ResolveConversationsServiceGetIn>;
	_original?: ResolveConversationsServiceGetIn

	_format: NumberString;

	conversationLists: GeneratedIdWrapper[];
}
export const ResolveConversationsServiceGetOutTypeRef: TypeRef<ResolveConversationsServiceGetOut> = new TypeRef("tutanota", 1648)

export function createResolveConversationsServiceGetOut(values: StrippedEntity<ResolveConversationsServiceGetOut>): ResolveConversationsServiceGetOut {
    return Object.assign(create(typeModels[ResolveConversationsServiceGetOutTypeRef.typeId], ResolveConversationsServiceGetOutTypeRef), values)
}

export type ResolveConversationsServiceGetOut = {
	_type: TypeRef<ResolveConversationsServiceGetOut>;
	_original?: ResolveConversationsServiceGetOut

	_format: NumberString;

	mailIds: IdTupleWrapper[];
}
export const UserAccountPostOutTypeRef: TypeRef<UserAccountPostOut> = new TypeRef("tutanota", 1664)

export function createUserAccountPostOut(values: StrippedEntity<UserAccountPostOut>): UserAccountPostOut {
    return Object.assign(create(typeModels[UserAccountPostOutTypeRef.typeId], UserAccountPostOutTypeRef), values)
}

export type UserAccountPostOut = {
	_type: TypeRef<UserAccountPostOut>;
	_original?: UserAccountPostOut

	_format: NumberString;
	userId: Id;
	userGroup: Id;
}
export const MailGroupPostOutTypeRef: TypeRef<MailGroupPostOut> = new TypeRef("tutanota", 1668)

export function createMailGroupPostOut(values: StrippedEntity<MailGroupPostOut>): MailGroupPostOut {
    return Object.assign(create(typeModels[MailGroupPostOutTypeRef.typeId], MailGroupPostOutTypeRef), values)
}

export type MailGroupPostOut = {
	_type: TypeRef<MailGroupPostOut>;
	_original?: MailGroupPostOut

	_format: NumberString;

	mailGroup: Id;
}
export const ChangePrimaryAddressServicePutInTypeRef: TypeRef<ChangePrimaryAddressServicePutIn> = new TypeRef("tutanota", 1671)

export function createChangePrimaryAddressServicePutIn(values: StrippedEntity<ChangePrimaryAddressServicePutIn>): ChangePrimaryAddressServicePutIn {
    return Object.assign(create(typeModels[ChangePrimaryAddressServicePutInTypeRef.typeId], ChangePrimaryAddressServicePutInTypeRef), values)
}

export type ChangePrimaryAddressServicePutIn = {
	_type: TypeRef<ChangePrimaryAddressServicePutIn>;
	_original?: ChangePrimaryAddressServicePutIn

	_format: NumberString;
	address: string;

	user: Id;
}
export const MovedMailsTypeRef: TypeRef<MovedMails> = new TypeRef("tutanota", 1716)

export function createMovedMails(values: StrippedEntity<MovedMails>): MovedMails {
    return Object.assign(create(typeModels[MovedMailsTypeRef.typeId], MovedMailsTypeRef), values)
}

export type MovedMails = {
	_type: TypeRef<MovedMails>;
	_original?: MovedMails

	_id: Id;

	targetFolder: IdTuple;
	sourceFolder: IdTuple;
	mailIds: IdTupleWrapper[];
}
export const MoveMailPostOutTypeRef: TypeRef<MoveMailPostOut> = new TypeRef("tutanota", 1721)

export function createMoveMailPostOut(values: StrippedEntity<MoveMailPostOut>): MoveMailPostOut {
    return Object.assign(create(typeModels[MoveMailPostOutTypeRef.typeId], MoveMailPostOutTypeRef), values)
}

export type MoveMailPostOut = {
	_type: TypeRef<MoveMailPostOut>;
	_original?: MoveMailPostOut

	_format: NumberString;

	movedMails: MovedMails[];
}
export const ClientSpamClassifierResultTypeRef: TypeRef<ClientSpamClassifierResult> = new TypeRef("tutanota", 1724)

export function createClientSpamClassifierResult(values: StrippedEntity<ClientSpamClassifierResult>): ClientSpamClassifierResult {
    return Object.assign(create(typeModels[ClientSpamClassifierResultTypeRef.typeId], ClientSpamClassifierResultTypeRef), values)
}

export type ClientSpamClassifierResult = {
	_type: TypeRef<ClientSpamClassifierResult>;
	_original?: ClientSpamClassifierResult

	_id: Id;
	spamDecision: NumberString;
	confidence: NumberString;
}
export const ClientClassifierResultPostInTypeRef: TypeRef<ClientClassifierResultPostIn> = new TypeRef("tutanota", 1730)

export function createClientClassifierResultPostIn(values: StrippedEntity<ClientClassifierResultPostIn>): ClientClassifierResultPostIn {
    return Object.assign(create(typeModels[ClientClassifierResultPostInTypeRef.typeId], ClientClassifierResultPostInTypeRef), values)
}

export type ClientClassifierResultPostIn = {
	_type: TypeRef<ClientClassifierResultPostIn>;
	_original?: ClientClassifierResultPostIn

	_format: NumberString;
	isPredictionMade: boolean;

	mails: IdTuple[];
}
export const CalendarEventsRefTypeRef: TypeRef<CalendarEventsRef> = new TypeRef("tutanota", 1736)

export function createCalendarEventsRef(values: StrippedEntity<CalendarEventsRef>): CalendarEventsRef {
    return Object.assign(create(typeModels[CalendarEventsRefTypeRef.typeId], CalendarEventsRefTypeRef), values)
}

export type CalendarEventsRef = {
	_type: TypeRef<CalendarEventsRef>;
	_original?: CalendarEventsRef

	_id: Id;

	list: Id;
}
