import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import {
	Blob,
	BlobReferenceTokenWrapper,
	BucketKey,
	DateWrapper,
	GeneratedIdWrapper,
	IdTupleWrapper,
	InstanceSessionKey,
	StringWrapper
} from "../sys/TypeRefs.js"
import { Entity } from "@tutao/meta"

export const SubfilesTypeRef: TypeRef<Subfiles> = new TypeRef("tutanota", 11)

export function createSubfiles(values: SubfilesParams): Subfiles {
    return Object.assign(create(typeModels[SubfilesTypeRef.typeId], SubfilesTypeRef), values)
}

export type SubfilesParams = {



	files: Id;
}

export type Subfiles = {
	_type: TypeRef<Subfiles>;
	_original?: Subfiles

	_id: Id;

	files: Id;
}
export const FileTypeRef: TypeRef<File> = new TypeRef("tutanota", 13)

export function createFile(values: FileParams): File {
    return Object.assign(create(typeModels[FileTypeRef.typeId], FileTypeRef), values)
}

export type FileParams = {


	name: string;
	size: NumberString;
	mimeType: null | string;
	cid: null | string;

	parent: null | IdTuple;
	subFiles: null | Subfiles;
	blobs: Blob[];
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
	_kdfNonce: null | Uint8Array;

	parent: null | IdTuple;
	subFiles: null | Subfiles;
	blobs: Blob[];
}
export const FileSystemTypeRef: TypeRef<FileSystem> = new TypeRef("tutanota", 28)

export function createFileSystem(values: FileSystemParams): FileSystem {
    return Object.assign(create(typeModels[FileSystemTypeRef.typeId], FileSystemTypeRef), values)
}

export type FileSystemParams = {



	files: Id;
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
	_kdfNonce: null | Uint8Array;

	files: Id;
}
export const ContactMailAddressTypeRef: TypeRef<ContactMailAddress> = new TypeRef("tutanota", 44)

export function createContactMailAddress(values: ContactMailAddressParams): ContactMailAddress {
    return Object.assign(create(typeModels[ContactMailAddressTypeRef.typeId], ContactMailAddressTypeRef), values)
}

export type ContactMailAddressParams = {


	type: NumberString;
	address: string;
	customTypeName: string;
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

export function createContactPhoneNumber(values: ContactPhoneNumberParams): ContactPhoneNumber {
    return Object.assign(create(typeModels[ContactPhoneNumberTypeRef.typeId], ContactPhoneNumberTypeRef), values)
}

export type ContactPhoneNumberParams = {


	type: NumberString;
	number: string;
	customTypeName: string;
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

export function createContactAddress(values: ContactAddressParams): ContactAddress {
    return Object.assign(create(typeModels[ContactAddressTypeRef.typeId], ContactAddressTypeRef), values)
}

export type ContactAddressParams = {


	type: NumberString;
	address: string;
	customTypeName: string;
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

export function createContactSocialId(values: ContactSocialIdParams): ContactSocialId {
    return Object.assign(create(typeModels[ContactSocialIdTypeRef.typeId], ContactSocialIdTypeRef), values)
}

export type ContactSocialIdParams = {


	type: NumberString;
	socialId: string;
	customTypeName: string;
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

export function createContact(values: ContactParams): Contact {
    return Object.assign(create(typeModels[ContactTypeRef.typeId], ContactTypeRef), values)
}

export type ContactParams = {


	firstName: string;
	lastName: string;
	company: string;
	role: string;
	oldBirthdayDate: null | Date;
	comment: string;
	presharedPassword: null | string;
	nickname: null | string;
	title: null | string;
	birthdayIso: null | string;
	middleName: null | string;
	nameSuffix: null | string;
	phoneticFirst: null | string;
	phoneticMiddle: null | string;
	phoneticLast: null | string;
	department: null | string;

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
	_kdfNonce: null | Uint8Array;

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

export function createConversationEntry(values: ConversationEntryParams): ConversationEntry {
    return Object.assign(create(typeModels[ConversationEntryTypeRef.typeId], ConversationEntryTypeRef), values)
}

export type ConversationEntryParams = {


	messageId: string;
	conversationType: NumberString;

	previous: null | IdTuple;
	mail: null | IdTuple;
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

export function createMailAddress(values: MailAddressParams): MailAddress {
    return Object.assign(create(typeModels[MailAddressTypeRef.typeId], MailAddressTypeRef), values)
}

export type MailAddressParams = {


	name: string;
	address: string;

	contact: null | IdTuple;
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

export function createMail(values: MailParams): Mail {
    return Object.assign(create(typeModels[MailTypeRef.typeId], MailTypeRef), values)
}

export type MailParams = {


	subject: string;
	receivedDate: Date;
	state: NumberString;
	unread: boolean;
	confidential: boolean;
	replyType: NumberString;
	differentEnvelopeSender: null | string;
	listUnsubscribe: boolean;
	movedTime: null | Date;
	phishingStatus: NumberString;
	authStatus: null | NumberString;
	method: NumberString;
	recipientCount: NumberString;
	encryptionAuthStatus: null | NumberString;
	processingState: NumberString;
	processNeeded: boolean;
	sendAt: null | Date;
	serverClassificationData: null | string;

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

export type Mail =  {
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
	processingState: NumberString;
	processNeeded: boolean;
	sendAt: null | Date;
	serverClassificationData: null | string;
	_kdfNonce: null | Uint8Array;

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

export function createMailBox(values: MailBoxParams): MailBox {
    return Object.assign(create(typeModels[MailBoxTypeRef.typeId], MailBoxTypeRef), values)
}

export type MailBoxParams = {


	lastInfoDate: Date;

	sentAttachments: Id;
	receivedAttachments: Id;
	mailSets: MailSetRef;
	spamResults: SpamResults;
	mailDetailsDrafts: null | MailDetailsDraftsRef;
	archivedMailBags: MailBag[];
	currentMailBag: null | MailBag;
	importedAttachments: Id;
	importFileMailStates: Id;
	extractedFeatures: Id;
	clientSpamTrainingData: Id;
	modifiedClientSpamTrainingDataIndex: Id;
	imapAccountSyncStates: null | Id;
	deduplicatedImportedAttachments: null | Id;
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
	_kdfNonce: null | Uint8Array;

	sentAttachments: Id;
	receivedAttachments: Id;
	mailSets: MailSetRef;
	spamResults: SpamResults;
	mailDetailsDrafts: null | MailDetailsDraftsRef;
	archivedMailBags: MailBag[];
	currentMailBag: null | MailBag;
	importedAttachments: Id;
	importFileMailStates: Id;
	extractedFeatures: Id;
	clientSpamTrainingData: Id;
	modifiedClientSpamTrainingDataIndex: Id;
	imapAccountSyncStates: null | Id;
	deduplicatedImportedAttachments: null | Id;
}
export const CreateExternalUserGroupDataTypeRef: TypeRef<CreateExternalUserGroupData> = new TypeRef("tutanota", 138)

export function createCreateExternalUserGroupData(values: CreateExternalUserGroupDataParams): CreateExternalUserGroupData {
    return Object.assign(create(typeModels[CreateExternalUserGroupDataTypeRef.typeId], CreateExternalUserGroupDataTypeRef), values)
}

export type CreateExternalUserGroupDataParams = {


	mailAddress: string;
	externalPwEncUserGroupKey: Uint8Array;
	internalUserEncUserGroupKey: Uint8Array;
	internalUserGroupKeyVersion: NumberString;
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

export function createExternalUserData(values: ExternalUserDataParams): ExternalUserData {
    return Object.assign(create(typeModels[ExternalUserDataTypeRef.typeId], ExternalUserDataTypeRef), values)
}

export type ExternalUserDataParams = {


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

export function createContactList(values: ContactListParams): ContactList {
    return Object.assign(create(typeModels[ContactListTypeRef.typeId], ContactListTypeRef), values)
}

export type ContactListParams = {



	contacts: Id;
	photos: null | PhotosRef;
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
	_kdfNonce: null | Uint8Array;

	contacts: Id;
	photos: null | PhotosRef;
}
export const RemoteImapSyncInfoTypeRef: TypeRef<RemoteImapSyncInfo> = new TypeRef("tutanota", 183)

export function createRemoteImapSyncInfo(values: RemoteImapSyncInfoParams): RemoteImapSyncInfo {
    return Object.assign(create(typeModels[RemoteImapSyncInfoTypeRef.typeId], RemoteImapSyncInfoTypeRef), values)
}

export type RemoteImapSyncInfoParams = {


	seen: boolean;

	message: IdTuple;
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

export function createImapFolder(values: ImapFolderParams): ImapFolder {
    return Object.assign(create(typeModels[ImapFolderTypeRef.typeId], ImapFolderTypeRef), values)
}

export type ImapFolderParams = {


	name: string;
	lastseenuid: string;
	uidvalidity: string;

	syncInfo: Id;
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

export function createImapSyncState(values: ImapSyncStateParams): ImapSyncState {
    return Object.assign(create(typeModels[ImapSyncStateTypeRef.typeId], ImapSyncStateTypeRef), values)
}

export type ImapSyncStateParams = {



	folders: ImapFolder[];
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

export function createImapSyncConfiguration(values: ImapSyncConfigurationParams): ImapSyncConfiguration {
    return Object.assign(create(typeModels[ImapSyncConfigurationTypeRef.typeId], ImapSyncConfigurationTypeRef), values)
}

export type ImapSyncConfigurationParams = {


	host: string;
	port: NumberString;
	user: string;
	password: string;

	imapSyncState: null | Id;
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

export function createTutanotaProperties(values: TutanotaPropertiesParams): TutanotaProperties {
    return Object.assign(create(typeModels[TutanotaPropertiesTypeRef.typeId], TutanotaPropertiesTypeRef), values)
}

export type TutanotaPropertiesParams = {


	userEncEntropy: null | Uint8Array;
	notificationMailLanguage: null | string;
	defaultSender: null | string;
	defaultUnconfidential: boolean;
	customEmailSignature: string;
	emailSignatureType: NumberString;
	noAutomaticContacts: boolean;
	sendPlaintextOnly: boolean;
	lastSeenAnnouncement: NumberString;
	userKeyVersion: null | NumberString;
	defaultLabelCreated: boolean;

	lastPushedMail: null | IdTuple;
	imapSyncConfig: ImapSyncConfiguration[];
	inboxRules: InboxRule[];
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
	_kdfNonce: null | Uint8Array;

	lastPushedMail: null | IdTuple;
	imapSyncConfig: ImapSyncConfiguration[];
	inboxRules: InboxRule[];
}
export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", 223)

export function createNotificationMail(values: NotificationMailParams): NotificationMail {
    return Object.assign(create(typeModels[NotificationMailTypeRef.typeId], NotificationMailTypeRef), values)
}

export type NotificationMailParams = {


	subject: string;
	bodyText: string;
	recipientMailAddress: string;
	recipientName: string;
	mailboxLink: string;
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

export function createDeleteMailData(values: DeleteMailDataParams): DeleteMailData {
    return Object.assign(create(typeModels[DeleteMailDataTypeRef.typeId], DeleteMailDataTypeRef), values)
}

export type DeleteMailDataParams = {



	mails: IdTuple[];
	folder: null | IdTuple;
}

export type DeleteMailData = {
	_type: TypeRef<DeleteMailData>;
	_original?: DeleteMailData

	_format: NumberString;

	mails: IdTuple[];
	folder: null | IdTuple;
}
export const MailSetTypeRef: TypeRef<MailSet> = new TypeRef("tutanota", 429)

export function createMailSet(values: MailSetParams): MailSet {
    return Object.assign(create(typeModels[MailSetTypeRef.typeId], MailSetTypeRef), values)
}

export type MailSetParams = {


	name: string;
	folderType: NumberString;
	color: null | string;

	parentFolder: null | IdTuple;
	entries: Id;
}

export type MailSet = {
	_type: TypeRef<MailSet>;
	_errors: Object;
	_original?: MailSet

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerEncSessionKey: null | Uint8Array;
	name: string;
	folderType: NumberString;
	_ownerGroup: null | Id;
	_ownerKeyVersion: null | NumberString;
	color: null | string;
	_kdfNonce: null | Uint8Array;

	parentFolder: null | IdTuple;
	entries: Id;
}
export const MailSetRefTypeRef: TypeRef<MailSetRef> = new TypeRef("tutanota", 440)

export function createMailSetRef(values: MailSetRefParams): MailSetRef {
    return Object.assign(create(typeModels[MailSetRefTypeRef.typeId], MailSetRefTypeRef), values)
}

export type MailSetRefParams = {



	mailSets: Id;
}

export type MailSetRef = {
	_type: TypeRef<MailSetRef>;
	_original?: MailSetRef

	_id: Id;

	mailSets: Id;
}
export const MoveMailDataTypeRef: TypeRef<MoveMailData> = new TypeRef("tutanota", 445)

export function createMoveMailData(values: MoveMailDataParams): MoveMailData {
    return Object.assign(create(typeModels[MoveMailDataTypeRef.typeId], MoveMailDataTypeRef), values)
}

export type MoveMailDataParams = {


	moveReason: null | NumberString;

	targetFolder: IdTuple;
	mails: IdTuple[];
	excludeMailSet: null | IdTuple;
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

export function createCreateMailFolderData(values: CreateMailFolderDataParams): CreateMailFolderData {
    return Object.assign(create(typeModels[CreateMailFolderDataTypeRef.typeId], CreateMailFolderDataTypeRef), values)
}

export type CreateMailFolderDataParams = {


	folderName: string;

	parentFolder: null | IdTuple;
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

export function createCreateMailFolderReturn(values: CreateMailFolderReturnParams): CreateMailFolderReturn {
    return Object.assign(create(typeModels[CreateMailFolderReturnTypeRef.typeId], CreateMailFolderReturnTypeRef), values)
}

export type CreateMailFolderReturnParams = {



	newFolder: IdTuple;
}

export type CreateMailFolderReturn = {
	_type: TypeRef<CreateMailFolderReturn>;
	_errors: Object;
	_original?: CreateMailFolderReturn

	_format: NumberString;

	newFolder: IdTuple;
}
export const DeleteMailFolderDataTypeRef: TypeRef<DeleteMailFolderData> = new TypeRef("tutanota", 458)

export function createDeleteMailFolderData(values: DeleteMailFolderDataParams): DeleteMailFolderData {
    return Object.assign(create(typeModels[DeleteMailFolderDataTypeRef.typeId], DeleteMailFolderDataTypeRef), values)
}

export type DeleteMailFolderDataParams = {



	folders: IdTuple[];
}

export type DeleteMailFolderData = {
	_type: TypeRef<DeleteMailFolderData>;
	_errors: Object;
	_original?: DeleteMailFolderData

	_format: NumberString;

	folders: IdTuple[];
}
export const EncryptTutanotaPropertiesDataTypeRef: TypeRef<EncryptTutanotaPropertiesData> = new TypeRef("tutanota", 473)

export function createEncryptTutanotaPropertiesData(values: EncryptTutanotaPropertiesDataParams): EncryptTutanotaPropertiesData {
    return Object.assign(create(typeModels[EncryptTutanotaPropertiesDataTypeRef.typeId], EncryptTutanotaPropertiesDataTypeRef), values)
}

export type EncryptTutanotaPropertiesDataParams = {


	symEncSessionKey: Uint8Array;
	symKeyVersion: NumberString;

	properties: Id;
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

export function createDraftRecipient(values: DraftRecipientParams): DraftRecipient {
    return Object.assign(create(typeModels[DraftRecipientTypeRef.typeId], DraftRecipientTypeRef), values)
}

export type DraftRecipientParams = {


	name: string;
	mailAddress: string;
}

export type DraftRecipient = {
	_type: TypeRef<DraftRecipient>;
	_original?: DraftRecipient

	_id: Id;
	name: string;
	mailAddress: string;
}
export const NewDraftAttachmentTypeRef: TypeRef<NewDraftAttachment> = new TypeRef("tutanota", 486)

export function createNewDraftAttachment(values: NewDraftAttachmentParams): NewDraftAttachment {
    return Object.assign(create(typeModels[NewDraftAttachmentTypeRef.typeId], NewDraftAttachmentTypeRef), values)
}

export type NewDraftAttachmentParams = {


	encFileName: Uint8Array;
	encMimeType: Uint8Array;
	encCid: null | Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
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

export function createDraftAttachment(values: DraftAttachmentParams): DraftAttachment {
    return Object.assign(create(typeModels[DraftAttachmentTypeRef.typeId], DraftAttachmentTypeRef), values)
}

export type DraftAttachmentParams = {


	ownerEncFileSessionKey: Uint8Array;

	newFile: null | NewDraftAttachment;
	existingFile: null | IdTuple;
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

export function createDraftData(values: DraftDataParams): DraftData {
    return Object.assign(create(typeModels[DraftDataTypeRef.typeId], DraftDataTypeRef), values)
}

export type DraftDataParams = {


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

export function createDraftCreateData(values: DraftCreateDataParams): DraftCreateData {
    return Object.assign(create(typeModels[DraftCreateDataTypeRef.typeId], DraftCreateDataTypeRef), values)
}

export type DraftCreateDataParams = {


	previousMessageId: null | string;
	conversationType: NumberString;

	draftData: DraftData;
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

export function createDraftCreateReturn(values: DraftCreateReturnParams): DraftCreateReturn {
    return Object.assign(create(typeModels[DraftCreateReturnTypeRef.typeId], DraftCreateReturnTypeRef), values)
}

export type DraftCreateReturnParams = {



	draft: IdTuple;
}

export type DraftCreateReturn = {
	_type: TypeRef<DraftCreateReturn>;
	_original?: DraftCreateReturn

	_format: NumberString;

	draft: IdTuple;
}
export const DraftUpdateDataTypeRef: TypeRef<DraftUpdateData> = new TypeRef("tutanota", 519)

export function createDraftUpdateData(values: DraftUpdateDataParams): DraftUpdateData {
    return Object.assign(create(typeModels[DraftUpdateDataTypeRef.typeId], DraftUpdateDataTypeRef), values)
}

export type DraftUpdateDataParams = {



	draftData: DraftData;
	draft: IdTuple;
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

export function createDraftUpdateReturn(values: DraftUpdateReturnParams): DraftUpdateReturn {
    return Object.assign(create(typeModels[DraftUpdateReturnTypeRef.typeId], DraftUpdateReturnTypeRef), values)
}

export type DraftUpdateReturnParams = {



	attachments: IdTuple[];
}

export type DraftUpdateReturn = {
	_type: TypeRef<DraftUpdateReturn>;
	_errors: Object;
	_original?: DraftUpdateReturn

	_format: NumberString;

	attachments: IdTuple[];
}
export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", 527)

export function createInternalRecipientKeyData(values: InternalRecipientKeyDataParams): InternalRecipientKeyData {
    return Object.assign(create(typeModels[InternalRecipientKeyDataTypeRef.typeId], InternalRecipientKeyDataTypeRef), values)
}

export type InternalRecipientKeyDataParams = {


	mailAddress: string;
	pubEncBucketKey: Uint8Array;
	recipientKeyVersion: NumberString;
	protocolVersion: NumberString;
	senderKeyVersion: null | NumberString;
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

export function createSecureExternalRecipientKeyData(values: SecureExternalRecipientKeyDataParams): SecureExternalRecipientKeyData {
    return Object.assign(create(typeModels[SecureExternalRecipientKeyDataTypeRef.typeId], SecureExternalRecipientKeyDataTypeRef), values)
}

export type SecureExternalRecipientKeyDataParams = {


	mailAddress: string;
	passwordVerifier: Uint8Array;
	salt: null | Uint8Array;
	saltHash: null | Uint8Array;
	pwEncCommunicationKey: null | Uint8Array;
	ownerEncBucketKey: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
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

export function createAttachmentKeyData(values: AttachmentKeyDataParams): AttachmentKeyData {
    return Object.assign(create(typeModels[AttachmentKeyDataTypeRef.typeId], AttachmentKeyDataTypeRef), values)
}

export type AttachmentKeyDataParams = {


	bucketEncFileSessionKey: null | Uint8Array;
	fileSessionKey: null | Uint8Array;

	file: IdTuple;
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

export function createSendDraftData(values: SendDraftDataParams): SendDraftData {
    return Object.assign(create(typeModels[SendDraftDataTypeRef.typeId], SendDraftDataTypeRef), values)
}

export type SendDraftDataParams = {


	language: string;
	mailSessionKey: null | Uint8Array;
	bucketEncMailSessionKey: null | Uint8Array;
	senderNameUnencrypted: null | string;
	plaintext: boolean;
	calendarMethod: boolean;
	sessionEncEncryptionAuthStatus: null | Uint8Array;
	sendAt: null | Date;
	allowUndo: boolean;

	internalRecipientKeyData: InternalRecipientKeyData[];
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[];
	attachmentKeyData: AttachmentKeyData[];
	mail: IdTuple;
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[];
	parameters: null | SendDraftParameters;
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
	sendAt: null | Date;
	allowUndo: boolean;

	internalRecipientKeyData: InternalRecipientKeyData[];
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[];
	attachmentKeyData: AttachmentKeyData[];
	mail: IdTuple;
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[];
	parameters: null | SendDraftParameters;
}
export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", 557)

export function createSendDraftReturn(values: SendDraftReturnParams): SendDraftReturn {
    return Object.assign(create(typeModels[SendDraftReturnTypeRef.typeId], SendDraftReturnTypeRef), values)
}

export type SendDraftReturnParams = {


	messageId: string;
	sentDate: Date;

	notifications: NotificationMail[];
	sentMail: IdTuple;
	sendJob: null | IdTuple;
}

export type SendDraftReturn = {
	_type: TypeRef<SendDraftReturn>;
	_original?: SendDraftReturn

	_format: NumberString;
	messageId: string;
	sentDate: Date;

	notifications: NotificationMail[];
	sentMail: IdTuple;
	sendJob: null | IdTuple;
}
export const ReceiveInfoServiceDataTypeRef: TypeRef<ReceiveInfoServiceData> = new TypeRef("tutanota", 570)

export function createReceiveInfoServiceData(values: ReceiveInfoServiceDataParams): ReceiveInfoServiceData {
    return Object.assign(create(typeModels[ReceiveInfoServiceDataTypeRef.typeId], ReceiveInfoServiceDataTypeRef), values)
}

export type ReceiveInfoServiceDataParams = {


	language: string;
}

export type ReceiveInfoServiceData = {
	_type: TypeRef<ReceiveInfoServiceData>;
	_original?: ReceiveInfoServiceData

	_format: NumberString;
	language: string;
}
export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", 573)

export function createInboxRule(values: InboxRuleParams): InboxRule {
    return Object.assign(create(typeModels[InboxRuleTypeRef.typeId], InboxRuleTypeRef), values)
}

export type InboxRuleParams = {


	type: string;
	value: string;
	excludeFromSpamFilter: null | boolean;

	targetFolder: IdTuple;
}

export type InboxRule = {
	_type: TypeRef<InboxRule>;
	_original?: InboxRule

	_id: Id;
	type: string;
	value: string;
	excludeFromSpamFilter: null | boolean;

	targetFolder: IdTuple;
}
export const EncryptedMailAddressTypeRef: TypeRef<EncryptedMailAddress> = new TypeRef("tutanota", 612)

export function createEncryptedMailAddress(values: EncryptedMailAddressParams): EncryptedMailAddress {
    return Object.assign(create(typeModels[EncryptedMailAddressTypeRef.typeId], EncryptedMailAddressTypeRef), values)
}

export type EncryptedMailAddressParams = {


	name: string;
	address: string;
}

export type EncryptedMailAddress = {
	_type: TypeRef<EncryptedMailAddress>;
	_original?: EncryptedMailAddress

	_id: Id;
	name: string;
	address: string;
}
export const UserAccountUserDataTypeRef: TypeRef<UserAccountUserData> = new TypeRef("tutanota", 622)

export function createUserAccountUserData(values: UserAccountUserDataParams): UserAccountUserData {
    return Object.assign(create(typeModels[UserAccountUserDataTypeRef.typeId], UserAccountUserDataTypeRef), values)
}

export type UserAccountUserDataParams = {


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

export function createInternalGroupData(values: InternalGroupDataParams): InternalGroupData {
    return Object.assign(create(typeModels[InternalGroupDataTypeRef.typeId], InternalGroupDataTypeRef), values)
}

export type InternalGroupDataParams = {


	pubRsaKey: null | Uint8Array;
	groupEncPrivRsaKey: null | Uint8Array;
	adminEncGroupKey: Uint8Array;
	ownerEncGroupInfoSessionKey: Uint8Array;
	pubEccKey: null | Uint8Array;
	groupEncPrivEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;
	groupEncPrivKyberKey: null | Uint8Array;
	adminKeyVersion: NumberString;

	adminGroup: null | Id;
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

export function createCustomerAccountCreateData(values: CustomerAccountCreateDataParams): CustomerAccountCreateData {
    return Object.assign(create(typeModels[CustomerAccountCreateDataTypeRef.typeId], CustomerAccountCreateDataTypeRef), values)
}

export type CustomerAccountCreateDataParams = {


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

export function createUserAccountCreateData(values: UserAccountCreateDataParams): UserAccountCreateData {
    return Object.assign(create(typeModels[UserAccountCreateDataTypeRef.typeId], UserAccountCreateDataTypeRef), values)
}

export type UserAccountCreateDataParams = {


	date: null | Date;

	userData: UserAccountUserData;
	userGroupData: InternalGroupData;
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

export function createMailboxServerProperties(values: MailboxServerPropertiesParams): MailboxServerProperties {
    return Object.assign(create(typeModels[MailboxServerPropertiesTypeRef.typeId], MailboxServerPropertiesTypeRef), values)
}

export type MailboxServerPropertiesParams = {


}

export type MailboxServerProperties = {
	_type: TypeRef<MailboxServerProperties>;
	_original?: MailboxServerProperties

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
}
export const MailboxGroupRootTypeRef: TypeRef<MailboxGroupRoot> = new TypeRef("tutanota", 693)

export function createMailboxGroupRoot(values: MailboxGroupRootParams): MailboxGroupRoot {
    return Object.assign(create(typeModels[MailboxGroupRootTypeRef.typeId], MailboxGroupRootTypeRef), values)
}

export type MailboxGroupRootParams = {



	mailbox: Id;
	serverProperties: Id;
	calendarEventUpdates: null | CalendarEventUpdateList;
	outOfOfficeNotification: null | Id;
	outOfOfficeNotificationRecipientList: null | OutOfOfficeNotificationRecipientList;
	mailboxProperties: null | Id;
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

export function createCreateMailGroupData(values: CreateMailGroupDataParams): CreateMailGroupData {
    return Object.assign(create(typeModels[CreateMailGroupDataTypeRef.typeId], CreateMailGroupDataTypeRef), values)
}

export type CreateMailGroupDataParams = {


	mailAddress: string;
	encryptedName: Uint8Array;
	mailEncMailboxSessionKey: Uint8Array;

	groupData: InternalGroupData;
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

export function createDeleteGroupData(values: DeleteGroupDataParams): DeleteGroupData {
    return Object.assign(create(typeModels[DeleteGroupDataTypeRef.typeId], DeleteGroupDataTypeRef), values)
}

export type DeleteGroupDataParams = {


	restore: boolean;

	group: Id;
}

export type DeleteGroupData = {
	_type: TypeRef<DeleteGroupData>;
	_original?: DeleteGroupData

	_format: NumberString;
	restore: boolean;

	group: Id;
}
export const BirthdayTypeRef: TypeRef<Birthday> = new TypeRef("tutanota", 844)

export function createBirthday(values: BirthdayParams): Birthday {
    return Object.assign(create(typeModels[BirthdayTypeRef.typeId], BirthdayTypeRef), values)
}

export type BirthdayParams = {


	day: NumberString;
	month: NumberString;
	year: null | NumberString;
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

export function createPhotosRef(values: PhotosRefParams): PhotosRef {
    return Object.assign(create(typeModels[PhotosRefTypeRef.typeId], PhotosRefTypeRef), values)
}

export type PhotosRefParams = {



	files: Id;
}

export type PhotosRef = {
	_type: TypeRef<PhotosRef>;
	_original?: PhotosRef

	_id: Id;

	files: Id;
}
export const ListUnsubscribeDataTypeRef: TypeRef<ListUnsubscribeData> = new TypeRef("tutanota", 867)

export function createListUnsubscribeData(values: ListUnsubscribeDataParams): ListUnsubscribeData {
    return Object.assign(create(typeModels[ListUnsubscribeDataTypeRef.typeId], ListUnsubscribeDataTypeRef), values)
}

export type ListUnsubscribeDataParams = {


	postLink: string;

	mail: IdTuple;
}

export type ListUnsubscribeData = {
	_type: TypeRef<ListUnsubscribeData>;
	_original?: ListUnsubscribeData

	_format: NumberString;
	postLink: string;

	mail: IdTuple;
}
export const CalendarRepeatRuleTypeRef: TypeRef<CalendarRepeatRule> = new TypeRef("tutanota", 926)

export function createCalendarRepeatRule(values: CalendarRepeatRuleParams): CalendarRepeatRule {
    return Object.assign(create(typeModels[CalendarRepeatRuleTypeRef.typeId], CalendarRepeatRuleTypeRef), values)
}

export type CalendarRepeatRuleParams = {


	frequency: NumberString;
	endType: NumberString;
	endValue: null | NumberString;
	interval: NumberString;
	timeZone: string;

	excludedDates: DateWrapper[];
	advancedRules: AdvancedRepeatRule[];
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

export function createCalendarEvent(values: CalendarEventParams): CalendarEvent {
    return Object.assign(create(typeModels[CalendarEventTypeRef.typeId], CalendarEventTypeRef), values)
}

export type CalendarEventParams = {


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
	sender: null | string;
	pendingInvitation: null | boolean;
	startTimeZone: null | string;
	endTimeZone: null | string;

	repeatRule: null | CalendarRepeatRule;
	alarmInfos: IdTuple[];
	attendees: CalendarEventAttendee[];
	organizer: null | EncryptedMailAddress;
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
	pendingInvitation: null | boolean;
	_kdfNonce: null | Uint8Array;
	startTimeZone: null | string;
	endTimeZone: null | string;

	repeatRule: null | CalendarRepeatRule;
	alarmInfos: IdTuple[];
	attendees: CalendarEventAttendee[];
	organizer: null | EncryptedMailAddress;
}
export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", 947)

export function createCalendarGroupRoot(values: CalendarGroupRootParams): CalendarGroupRoot {
    return Object.assign(create(typeModels[CalendarGroupRootTypeRef.typeId], CalendarGroupRootTypeRef), values)
}

export type CalendarGroupRootParams = {



	shortEvents: Id;
	longEvents: Id;
	index: null | CalendarEventIndexRef;
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
	_kdfNonce: null | Uint8Array;

	shortEvents: Id;
	longEvents: Id;
	index: null | CalendarEventIndexRef;
}
export const UserAreaGroupDataTypeRef: TypeRef<UserAreaGroupData> = new TypeRef("tutanota", 956)

export function createUserAreaGroupData(values: UserAreaGroupDataParams): UserAreaGroupData {
    return Object.assign(create(typeModels[UserAreaGroupDataTypeRef.typeId], UserAreaGroupDataTypeRef), values)
}

export type UserAreaGroupDataParams = {


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

export function createUserAreaGroupPostData(values: UserAreaGroupPostDataParams): UserAreaGroupPostData {
    return Object.assign(create(typeModels[UserAreaGroupPostDataTypeRef.typeId], UserAreaGroupPostDataTypeRef), values)
}

export type UserAreaGroupPostDataParams = {



	groupData: UserAreaGroupData;
}

export type UserAreaGroupPostData = {
	_type: TypeRef<UserAreaGroupPostData>;
	_original?: UserAreaGroupPostData

	_format: NumberString;

	groupData: UserAreaGroupData;
}
export const GroupSettingsTypeRef: TypeRef<GroupSettings> = new TypeRef("tutanota", 968)

export function createGroupSettings(values: GroupSettingsParams): GroupSettings {
    return Object.assign(create(typeModels[GroupSettingsTypeRef.typeId], GroupSettingsTypeRef), values)
}

export type GroupSettingsParams = {


	color: string;
	name: null | string;
	sourceUrl: null | string;

	group: Id;
	defaultAlarmsList: DefaultAlarmInfo[];
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

export function createUserSettingsGroupRoot(values: UserSettingsGroupRootParams): UserSettingsGroupRoot {
    return Object.assign(create(typeModels[UserSettingsGroupRootTypeRef.typeId], UserSettingsGroupRootTypeRef), values)
}

export type UserSettingsGroupRootParams = {


	timeFormat: NumberString;
	startOfTheWeek: NumberString;
	usageDataOptedIn: null | boolean;
	birthdayCalendarColor: null | string;

	groupSettings: GroupSettings[];
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
	_kdfNonce: null | Uint8Array;

	groupSettings: GroupSettings[];
}
export const CalendarDeleteInTypeRef: TypeRef<CalendarDeleteIn> = new TypeRef("tutanota", 982)

export function createCalendarDeleteIn(values: CalendarDeleteInParams): CalendarDeleteIn {
    return Object.assign(create(typeModels[CalendarDeleteInTypeRef.typeId], CalendarDeleteInTypeRef), values)
}

export type CalendarDeleteInParams = {



	groupRootId: Id;
}

export type CalendarDeleteIn = {
	_type: TypeRef<CalendarDeleteIn>;
	_original?: CalendarDeleteIn

	_format: NumberString;

	groupRootId: Id;
}
export const CreateGroupPostReturnTypeRef: TypeRef<CreateGroupPostReturn> = new TypeRef("tutanota", 985)

export function createCreateGroupPostReturn(values: CreateGroupPostReturnParams): CreateGroupPostReturn {
    return Object.assign(create(typeModels[CreateGroupPostReturnTypeRef.typeId], CreateGroupPostReturnTypeRef), values)
}

export type CreateGroupPostReturnParams = {



	group: Id;
}

export type CreateGroupPostReturn = {
	_type: TypeRef<CreateGroupPostReturn>;
	_errors: Object;
	_original?: CreateGroupPostReturn

	_format: NumberString;

	group: Id;
}
export const SharedGroupDataTypeRef: TypeRef<SharedGroupData> = new TypeRef("tutanota", 992)

export function createSharedGroupData(values: SharedGroupDataParams): SharedGroupData {
    return Object.assign(create(typeModels[SharedGroupDataTypeRef.typeId], SharedGroupDataTypeRef), values)
}

export type SharedGroupDataParams = {


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

export function createGroupInvitationPostData(values: GroupInvitationPostDataParams): GroupInvitationPostData {
    return Object.assign(create(typeModels[GroupInvitationPostDataTypeRef.typeId], GroupInvitationPostDataTypeRef), values)
}

export type GroupInvitationPostDataParams = {



	sharedGroupData: SharedGroupData;
	internalKeyData: InternalRecipientKeyData[];
}

export type GroupInvitationPostData = {
	_type: TypeRef<GroupInvitationPostData>;
	_original?: GroupInvitationPostData

	_format: NumberString;

	sharedGroupData: SharedGroupData;
	internalKeyData: InternalRecipientKeyData[];
}
export const GroupInvitationPostReturnTypeRef: TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", 1006)

export function createGroupInvitationPostReturn(values: GroupInvitationPostReturnParams): GroupInvitationPostReturn {
    return Object.assign(create(typeModels[GroupInvitationPostReturnTypeRef.typeId], GroupInvitationPostReturnTypeRef), values)
}

export type GroupInvitationPostReturnParams = {



	existingMailAddresses: MailAddress[];
	invalidMailAddresses: MailAddress[];
	invitedMailAddresses: MailAddress[];
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

export function createGroupInvitationPutData(values: GroupInvitationPutDataParams): GroupInvitationPutData {
    return Object.assign(create(typeModels[GroupInvitationPutDataTypeRef.typeId], GroupInvitationPutDataTypeRef), values)
}

export type GroupInvitationPutDataParams = {


	userGroupEncGroupKey: Uint8Array;
	sharedGroupEncInviteeGroupInfoKey: Uint8Array;
	userGroupKeyVersion: NumberString;
	sharedGroupKeyVersion: NumberString;

	receivedInvitation: IdTuple;
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

export function createGroupInvitationDeleteData(values: GroupInvitationDeleteDataParams): GroupInvitationDeleteData {
    return Object.assign(create(typeModels[GroupInvitationDeleteDataTypeRef.typeId], GroupInvitationDeleteDataTypeRef), values)
}

export type GroupInvitationDeleteDataParams = {



	receivedInvitation: IdTuple;
}

export type GroupInvitationDeleteData = {
	_type: TypeRef<GroupInvitationDeleteData>;
	_original?: GroupInvitationDeleteData

	_format: NumberString;

	receivedInvitation: IdTuple;
}
export const ReportedMailFieldMarkerTypeRef: TypeRef<ReportedMailFieldMarker> = new TypeRef("tutanota", 1023)

export function createReportedMailFieldMarker(values: ReportedMailFieldMarkerParams): ReportedMailFieldMarker {
    return Object.assign(create(typeModels[ReportedMailFieldMarkerTypeRef.typeId], ReportedMailFieldMarkerTypeRef), values)
}

export type ReportedMailFieldMarkerParams = {


	marker: string;
	status: NumberString;
}

export type ReportedMailFieldMarker = {
	_type: TypeRef<ReportedMailFieldMarker>;
	_original?: ReportedMailFieldMarker

	_id: Id;
	marker: string;
	status: NumberString;
}
export const PhishingMarkerWebsocketDataTypeRef: TypeRef<PhishingMarkerWebsocketData> = new TypeRef("tutanota", 1034)

export function createPhishingMarkerWebsocketData(values: PhishingMarkerWebsocketDataParams): PhishingMarkerWebsocketData {
    return Object.assign(create(typeModels[PhishingMarkerWebsocketDataTypeRef.typeId], PhishingMarkerWebsocketDataTypeRef), values)
}

export type PhishingMarkerWebsocketDataParams = {


	lastId: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	markers: ReportedMailFieldMarker[];
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

export function createReportMailPostData(values: ReportMailPostDataParams): ReportMailPostData {
    return Object.assign(create(typeModels[ReportMailPostDataTypeRef.typeId], ReportMailPostDataTypeRef), values)
}

export type ReportMailPostDataParams = {


	mailSessionKey: Uint8Array;
	reportType: NumberString;

	mailId: IdTuple;
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

export function createCalendarEventAttendee(values: CalendarEventAttendeeParams): CalendarEventAttendee {
    return Object.assign(create(typeModels[CalendarEventAttendeeTypeRef.typeId], CalendarEventAttendeeTypeRef), values)
}

export type CalendarEventAttendeeParams = {


	status: NumberString;

	address: EncryptedMailAddress;
}

export type CalendarEventAttendee = {
	_type: TypeRef<CalendarEventAttendee>;
	_original?: CalendarEventAttendee

	_id: Id;
	status: NumberString;

	address: EncryptedMailAddress;
}
export const CalendarEventUidIndexTypeRef: TypeRef<CalendarEventUidIndex> = new TypeRef("tutanota", 1093)

export function createCalendarEventUidIndex(values: CalendarEventUidIndexParams): CalendarEventUidIndex {
    return Object.assign(create(typeModels[CalendarEventUidIndexTypeRef.typeId], CalendarEventUidIndexTypeRef), values)
}

export type CalendarEventUidIndexParams = {



	progenitor: null | IdTuple;
	alteredInstances: IdTuple[];
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

export function createCalendarEventIndexRef(values: CalendarEventIndexRefParams): CalendarEventIndexRef {
    return Object.assign(create(typeModels[CalendarEventIndexRefTypeRef.typeId], CalendarEventIndexRefTypeRef), values)
}

export type CalendarEventIndexRefParams = {



	list: Id;
}

export type CalendarEventIndexRef = {
	_type: TypeRef<CalendarEventIndexRef>;
	_original?: CalendarEventIndexRef

	_id: Id;

	list: Id;
}
export const CalendarEventUpdateTypeRef: TypeRef<CalendarEventUpdate> = new TypeRef("tutanota", 1104)

export function createCalendarEventUpdate(values: CalendarEventUpdateParams): CalendarEventUpdate {
    return Object.assign(create(typeModels[CalendarEventUpdateTypeRef.typeId], CalendarEventUpdateTypeRef), values)
}

export type CalendarEventUpdateParams = {


	sender: string;

	file: IdTuple;
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
	_kdfNonce: null | Uint8Array;

	file: IdTuple;
}
export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", 1113)

export function createCalendarEventUpdateList(values: CalendarEventUpdateListParams): CalendarEventUpdateList {
    return Object.assign(create(typeModels[CalendarEventUpdateListTypeRef.typeId], CalendarEventUpdateListTypeRef), values)
}

export type CalendarEventUpdateListParams = {



	list: Id;
}

export type CalendarEventUpdateList = {
	_type: TypeRef<CalendarEventUpdateList>;
	_original?: CalendarEventUpdateList

	_id: Id;

	list: Id;
}
export const EntropyDataTypeRef: TypeRef<EntropyData> = new TypeRef("tutanota", 1122)

export function createEntropyData(values: EntropyDataParams): EntropyData {
    return Object.assign(create(typeModels[EntropyDataTypeRef.typeId], EntropyDataTypeRef), values)
}

export type EntropyDataParams = {


	userEncEntropy: Uint8Array;
	userKeyVersion: NumberString;
}

export type EntropyData = {
	_type: TypeRef<EntropyData>;
	_original?: EntropyData

	_format: NumberString;
	userEncEntropy: Uint8Array;
	userKeyVersion: NumberString;
}
export const OutOfOfficeNotificationMessageTypeRef: TypeRef<OutOfOfficeNotificationMessage> = new TypeRef("tutanota", 1126)

export function createOutOfOfficeNotificationMessage(values: OutOfOfficeNotificationMessageParams): OutOfOfficeNotificationMessage {
    return Object.assign(create(typeModels[OutOfOfficeNotificationMessageTypeRef.typeId], OutOfOfficeNotificationMessageTypeRef), values)
}

export type OutOfOfficeNotificationMessageParams = {


	subject: string;
	message: string;
	type: NumberString;
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

export function createOutOfOfficeNotification(values: OutOfOfficeNotificationParams): OutOfOfficeNotification {
    return Object.assign(create(typeModels[OutOfOfficeNotificationTypeRef.typeId], OutOfOfficeNotificationTypeRef), values)
}

export type OutOfOfficeNotificationParams = {


	enabled: boolean;
	startDate: null | Date;
	endDate: null | Date;

	notifications: OutOfOfficeNotificationMessage[];
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

export function createOutOfOfficeNotificationRecipient(values: OutOfOfficeNotificationRecipientParams): OutOfOfficeNotificationRecipient {
    return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientTypeRef.typeId], OutOfOfficeNotificationRecipientTypeRef), values)
}

export type OutOfOfficeNotificationRecipientParams = {


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

export function createOutOfOfficeNotificationRecipientList(values: OutOfOfficeNotificationRecipientListParams): OutOfOfficeNotificationRecipientList {
    return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientListTypeRef.typeId], OutOfOfficeNotificationRecipientListTypeRef), values)
}

export type OutOfOfficeNotificationRecipientListParams = {



	list: Id;
}

export type OutOfOfficeNotificationRecipientList = {
	_type: TypeRef<OutOfOfficeNotificationRecipientList>;
	_original?: OutOfOfficeNotificationRecipientList

	_id: Id;

	list: Id;
}
export const EmailTemplateContentTypeRef: TypeRef<EmailTemplateContent> = new TypeRef("tutanota", 1154)

export function createEmailTemplateContent(values: EmailTemplateContentParams): EmailTemplateContent {
    return Object.assign(create(typeModels[EmailTemplateContentTypeRef.typeId], EmailTemplateContentTypeRef), values)
}

export type EmailTemplateContentParams = {


	text: string;
	languageCode: string;
}

export type EmailTemplateContent = {
	_type: TypeRef<EmailTemplateContent>;
	_original?: EmailTemplateContent

	_id: Id;
	text: string;
	languageCode: string;
}
export const EmailTemplateTypeRef: TypeRef<EmailTemplate> = new TypeRef("tutanota", 1158)

export function createEmailTemplate(values: EmailTemplateParams): EmailTemplate {
    return Object.assign(create(typeModels[EmailTemplateTypeRef.typeId], EmailTemplateTypeRef), values)
}

export type EmailTemplateParams = {


	title: string;
	tag: string;

	contents: EmailTemplateContent[];
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
	_kdfNonce: null | Uint8Array;

	contents: EmailTemplateContent[];
}
export const KnowledgeBaseEntryKeywordTypeRef: TypeRef<KnowledgeBaseEntryKeyword> = new TypeRef("tutanota", 1168)

export function createKnowledgeBaseEntryKeyword(values: KnowledgeBaseEntryKeywordParams): KnowledgeBaseEntryKeyword {
    return Object.assign(create(typeModels[KnowledgeBaseEntryKeywordTypeRef.typeId], KnowledgeBaseEntryKeywordTypeRef), values)
}

export type KnowledgeBaseEntryKeywordParams = {


	keyword: string;
}

export type KnowledgeBaseEntryKeyword = {
	_type: TypeRef<KnowledgeBaseEntryKeyword>;
	_original?: KnowledgeBaseEntryKeyword

	_id: Id;
	keyword: string;
}
export const KnowledgeBaseEntryTypeRef: TypeRef<KnowledgeBaseEntry> = new TypeRef("tutanota", 1171)

export function createKnowledgeBaseEntry(values: KnowledgeBaseEntryParams): KnowledgeBaseEntry {
    return Object.assign(create(typeModels[KnowledgeBaseEntryTypeRef.typeId], KnowledgeBaseEntryTypeRef), values)
}

export type KnowledgeBaseEntryParams = {


	title: string;
	description: string;

	keywords: KnowledgeBaseEntryKeyword[];
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
	_kdfNonce: null | Uint8Array;

	keywords: KnowledgeBaseEntryKeyword[];
}
export const TemplateGroupRootTypeRef: TypeRef<TemplateGroupRoot> = new TypeRef("tutanota", 1181)

export function createTemplateGroupRoot(values: TemplateGroupRootParams): TemplateGroupRoot {
    return Object.assign(create(typeModels[TemplateGroupRootTypeRef.typeId], TemplateGroupRootTypeRef), values)
}

export type TemplateGroupRootParams = {



	templates: Id;
	knowledgeBase: Id;
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
	_kdfNonce: null | Uint8Array;

	templates: Id;
	knowledgeBase: Id;
}
export const UserAreaGroupDeleteDataTypeRef: TypeRef<UserAreaGroupDeleteData> = new TypeRef("tutanota", 1190)

export function createUserAreaGroupDeleteData(values: UserAreaGroupDeleteDataParams): UserAreaGroupDeleteData {
    return Object.assign(create(typeModels[UserAreaGroupDeleteDataTypeRef.typeId], UserAreaGroupDeleteDataTypeRef), values)
}

export type UserAreaGroupDeleteDataParams = {



	group: Id;
}

export type UserAreaGroupDeleteData = {
	_type: TypeRef<UserAreaGroupDeleteData>;
	_original?: UserAreaGroupDeleteData

	_format: NumberString;

	group: Id;
}
export const MailboxPropertiesTypeRef: TypeRef<MailboxProperties> = new TypeRef("tutanota", 1195)

export function createMailboxProperties(values: MailboxPropertiesParams): MailboxProperties {
    return Object.assign(create(typeModels[MailboxPropertiesTypeRef.typeId], MailboxPropertiesTypeRef), values)
}

export type MailboxPropertiesParams = {


	reportMovedMails: NumberString;

	mailAddressProperties: MailAddressProperties[];
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
	_kdfNonce: null | Uint8Array;

	mailAddressProperties: MailAddressProperties[];
}
export const SpamResultsTypeRef: TypeRef<SpamResults> = new TypeRef("tutanota", 1217)

export function createSpamResults(values: SpamResultsParams): SpamResults {
    return Object.assign(create(typeModels[SpamResultsTypeRef.typeId], SpamResultsTypeRef), values)
}

export type SpamResultsParams = {



	list: Id;
}

export type SpamResults = {
	_type: TypeRef<SpamResults>;
	_original?: SpamResults

	_id: Id;

	list: Id;
}
export const NewsIdTypeRef: TypeRef<NewsId> = new TypeRef("tutanota", 1245)

export function createNewsId(values: NewsIdParams): NewsId {
    return Object.assign(create(typeModels[NewsIdTypeRef.typeId], NewsIdTypeRef), values)
}

export type NewsIdParams = {


	newsItemName: string;
	newsItemId: Id;
}

export type NewsId = {
	_type: TypeRef<NewsId>;
	_original?: NewsId

	_id: Id;
	newsItemName: string;
	newsItemId: Id;
}
export const NewsOutTypeRef: TypeRef<NewsOut> = new TypeRef("tutanota", 1256)

export function createNewsOut(values: NewsOutParams): NewsOut {
    return Object.assign(create(typeModels[NewsOutTypeRef.typeId], NewsOutTypeRef), values)
}

export type NewsOutParams = {



	newsItemIds: NewsId[];
}

export type NewsOut = {
	_type: TypeRef<NewsOut>;
	_original?: NewsOut

	_format: NumberString;

	newsItemIds: NewsId[];
}
export const NewsInTypeRef: TypeRef<NewsIn> = new TypeRef("tutanota", 1259)

export function createNewsIn(values: NewsInParams): NewsIn {
    return Object.assign(create(typeModels[NewsInTypeRef.typeId], NewsInTypeRef), values)
}

export type NewsInParams = {


	newsItemId: null | Id;
}

export type NewsIn = {
	_type: TypeRef<NewsIn>;
	_original?: NewsIn

	_format: NumberString;
	newsItemId: null | Id;
}
export const MailAddressPropertiesTypeRef: TypeRef<MailAddressProperties> = new TypeRef("tutanota", 1263)

export function createMailAddressProperties(values: MailAddressPropertiesParams): MailAddressProperties {
    return Object.assign(create(typeModels[MailAddressPropertiesTypeRef.typeId], MailAddressPropertiesTypeRef), values)
}

export type MailAddressPropertiesParams = {


	mailAddress: string;
	senderName: string;
}

export type MailAddressProperties = {
	_type: TypeRef<MailAddressProperties>;
	_original?: MailAddressProperties

	_id: Id;
	mailAddress: string;
	senderName: string;
}
export const HeaderTypeRef: TypeRef<Header> = new TypeRef("tutanota", 1269)

export function createHeader(values: HeaderParams): Header {
    return Object.assign(create(typeModels[HeaderTypeRef.typeId], HeaderTypeRef), values)
}

export type HeaderParams = {


	headers: null | string;
	compressedHeaders: null | string;
}

export type Header = {
	_type: TypeRef<Header>;
	_original?: Header

	_id: Id;
	headers: null | string;
	compressedHeaders: null | string;
}
export const BodyTypeRef: TypeRef<Body> = new TypeRef("tutanota", 1273)

export function createBody(values: BodyParams): Body {
    return Object.assign(create(typeModels[BodyTypeRef.typeId], BodyTypeRef), values)
}

export type BodyParams = {


	text: null | string;
	compressedText: null | string;
}

export type Body = {
	_type: TypeRef<Body>;
	_original?: Body

	_id: Id;
	text: null | string;
	compressedText: null | string;
}
export const RecipientsTypeRef: TypeRef<Recipients> = new TypeRef("tutanota", 1277)

export function createRecipients(values: RecipientsParams): Recipients {
    return Object.assign(create(typeModels[RecipientsTypeRef.typeId], RecipientsTypeRef), values)
}

export type RecipientsParams = {



	toRecipients: MailAddress[];
	ccRecipients: MailAddress[];
	bccRecipients: MailAddress[];
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

export function createMailDetails(values: MailDetailsParams): MailDetails {
    return Object.assign(create(typeModels[MailDetailsTypeRef.typeId], MailDetailsTypeRef), values)
}

export type MailDetailsParams = {


	sentDate: Date;
	authStatus: NumberString;

	replyTos: EncryptedMailAddress[];
	recipients: Recipients;
	headers: null | Header;
	body: Body;
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

export function createMailDetailsDraft(values: MailDetailsDraftParams): MailDetailsDraft {
    return Object.assign(create(typeModels[MailDetailsDraftTypeRef.typeId], MailDetailsDraftTypeRef), values)
}

export type MailDetailsDraftParams = {



	details: MailDetails;
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
	_kdfNonce: null | Uint8Array;

	details: MailDetails;
}
export const MailDetailsBlobTypeRef: TypeRef<MailDetailsBlob> = new TypeRef("tutanota", 1298)

export function createMailDetailsBlob(values: MailDetailsBlobParams): MailDetailsBlob {
    return Object.assign(create(typeModels[MailDetailsBlobTypeRef.typeId], MailDetailsBlobTypeRef), values)
}

export type MailDetailsBlobParams = {



	details: MailDetails;
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
	_kdfNonce: null | Uint8Array;

	details: MailDetails;
}
export const UpdateMailFolderDataTypeRef: TypeRef<UpdateMailFolderData> = new TypeRef("tutanota", 1311)

export function createUpdateMailFolderData(values: UpdateMailFolderDataParams): UpdateMailFolderData {
    return Object.assign(create(typeModels[UpdateMailFolderDataTypeRef.typeId], UpdateMailFolderDataTypeRef), values)
}

export type UpdateMailFolderDataParams = {



	folder: IdTuple;
	newParent: null | IdTuple;
}

export type UpdateMailFolderData = {
	_type: TypeRef<UpdateMailFolderData>;
	_original?: UpdateMailFolderData

	_format: NumberString;

	folder: IdTuple;
	newParent: null | IdTuple;
}
export const MailDetailsDraftsRefTypeRef: TypeRef<MailDetailsDraftsRef> = new TypeRef("tutanota", 1315)

export function createMailDetailsDraftsRef(values: MailDetailsDraftsRefParams): MailDetailsDraftsRef {
    return Object.assign(create(typeModels[MailDetailsDraftsRefTypeRef.typeId], MailDetailsDraftsRefTypeRef), values)
}

export type MailDetailsDraftsRefParams = {



	list: Id;
}

export type MailDetailsDraftsRef = {
	_type: TypeRef<MailDetailsDraftsRef>;
	_original?: MailDetailsDraftsRef

	_id: Id;

	list: Id;
}
export const ContactListEntryTypeRef: TypeRef<ContactListEntry> = new TypeRef("tutanota", 1325)

export function createContactListEntry(values: ContactListEntryParams): ContactListEntry {
    return Object.assign(create(typeModels[ContactListEntryTypeRef.typeId], ContactListEntryTypeRef), values)
}

export type ContactListEntryParams = {


	emailAddress: string;
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
	_kdfNonce: null | Uint8Array;
}
export const ContactListGroupRootTypeRef: TypeRef<ContactListGroupRoot> = new TypeRef("tutanota", 1333)

export function createContactListGroupRoot(values: ContactListGroupRootParams): ContactListGroupRoot {
    return Object.assign(create(typeModels[ContactListGroupRootTypeRef.typeId], ContactListGroupRootTypeRef), values)
}

export type ContactListGroupRootParams = {



	entries: Id;
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
	_kdfNonce: null | Uint8Array;

	entries: Id;
}
export const SymEncInternalRecipientKeyDataTypeRef: TypeRef<SymEncInternalRecipientKeyData> = new TypeRef("tutanota", 1347)

export function createSymEncInternalRecipientKeyData(values: SymEncInternalRecipientKeyDataParams): SymEncInternalRecipientKeyData {
    return Object.assign(create(typeModels[SymEncInternalRecipientKeyDataTypeRef.typeId], SymEncInternalRecipientKeyDataTypeRef), values)
}

export type SymEncInternalRecipientKeyDataParams = {


	mailAddress: string;
	symEncBucketKey: Uint8Array;
	symKeyVersion: NumberString;

	keyGroup: Id;
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

export function createContactCustomDate(values: ContactCustomDateParams): ContactCustomDate {
    return Object.assign(create(typeModels[ContactCustomDateTypeRef.typeId], ContactCustomDateTypeRef), values)
}

export type ContactCustomDateParams = {


	type: NumberString;
	customTypeName: string;
	dateIso: string;
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

export function createContactWebsite(values: ContactWebsiteParams): ContactWebsite {
    return Object.assign(create(typeModels[ContactWebsiteTypeRef.typeId], ContactWebsiteTypeRef), values)
}

export type ContactWebsiteParams = {


	type: NumberString;
	customTypeName: string;
	url: string;
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

export function createContactRelationship(values: ContactRelationshipParams): ContactRelationship {
    return Object.assign(create(typeModels[ContactRelationshipTypeRef.typeId], ContactRelationshipTypeRef), values)
}

export type ContactRelationshipParams = {


	type: NumberString;
	customTypeName: string;
	person: string;
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

export function createContactMessengerHandle(values: ContactMessengerHandleParams): ContactMessengerHandle {
    return Object.assign(create(typeModels[ContactMessengerHandleTypeRef.typeId], ContactMessengerHandleTypeRef), values)
}

export type ContactMessengerHandleParams = {


	type: NumberString;
	customTypeName: string;
	handle: string;
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

export function createContactPronouns(values: ContactPronounsParams): ContactPronouns {
    return Object.assign(create(typeModels[ContactPronounsTypeRef.typeId], ContactPronounsTypeRef), values)
}

export type ContactPronounsParams = {


	language: string;
	pronouns: string;
}

export type ContactPronouns = {
	_type: TypeRef<ContactPronouns>;
	_original?: ContactPronouns

	_id: Id;
	language: string;
	pronouns: string;
}
export const TranslationGetInTypeRef: TypeRef<TranslationGetIn> = new TypeRef("tutanota", 1436)

export function createTranslationGetIn(values: TranslationGetInParams): TranslationGetIn {
    return Object.assign(create(typeModels[TranslationGetInTypeRef.typeId], TranslationGetInTypeRef), values)
}

export type TranslationGetInParams = {


	lang: string;
}

export type TranslationGetIn = {
	_type: TypeRef<TranslationGetIn>;
	_original?: TranslationGetIn

	_format: NumberString;
	lang: string;
}
export const TranslationGetOutTypeRef: TypeRef<TranslationGetOut> = new TypeRef("tutanota", 1439)

export function createTranslationGetOut(values: TranslationGetOutParams): TranslationGetOut {
    return Object.assign(create(typeModels[TranslationGetOutTypeRef.typeId], TranslationGetOutTypeRef), values)
}

export type TranslationGetOutParams = {


	giftCardSubject: string;
	invitationSubject: string;
}

export type TranslationGetOut = {
	_type: TypeRef<TranslationGetOut>;
	_original?: TranslationGetOut

	_format: NumberString;
	giftCardSubject: string;
	invitationSubject: string;
}
export const DefaultAlarmInfoTypeRef: TypeRef<DefaultAlarmInfo> = new TypeRef("tutanota", 1446)

export function createDefaultAlarmInfo(values: DefaultAlarmInfoParams): DefaultAlarmInfo {
    return Object.assign(create(typeModels[DefaultAlarmInfoTypeRef.typeId], DefaultAlarmInfoTypeRef), values)
}

export type DefaultAlarmInfoParams = {


	trigger: string;
}

export type DefaultAlarmInfo = {
	_type: TypeRef<DefaultAlarmInfo>;
	_original?: DefaultAlarmInfo

	_id: Id;
	trigger: string;
}
export const MailSetEntryTypeRef: TypeRef<MailSetEntry> = new TypeRef("tutanota", 1450)

export function createMailSetEntry(values: MailSetEntryParams): MailSetEntry {
    return Object.assign(create(typeModels[MailSetEntryTypeRef.typeId], MailSetEntryTypeRef), values)
}

export type MailSetEntryParams = {



	mail: IdTuple;
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

export function createMailBag(values: MailBagParams): MailBag {
    return Object.assign(create(typeModels[MailBagTypeRef.typeId], MailBagTypeRef), values)
}

export type MailBagParams = {



	mails: Id;
}

export type MailBag = {
	_type: TypeRef<MailBag>;
	_original?: MailBag

	_id: Id;

	mails: Id;
}
export const SimpleMoveMailPostInTypeRef: TypeRef<SimpleMoveMailPostIn> = new TypeRef("tutanota", 1469)

export function createSimpleMoveMailPostIn(values: SimpleMoveMailPostInParams): SimpleMoveMailPostIn {
    return Object.assign(create(typeModels[SimpleMoveMailPostInTypeRef.typeId], SimpleMoveMailPostInTypeRef), values)
}

export type SimpleMoveMailPostInParams = {


	destinationSetType: NumberString;
	moveReason: null | NumberString;

	mails: IdTuple[];
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

export function createUnreadMailStatePostIn(values: UnreadMailStatePostInParams): UnreadMailStatePostIn {
    return Object.assign(create(typeModels[UnreadMailStatePostInTypeRef.typeId], UnreadMailStatePostInTypeRef), values)
}

export type UnreadMailStatePostInParams = {


	unread: boolean;

	mails: IdTuple[];
}

export type UnreadMailStatePostIn = {
	_type: TypeRef<UnreadMailStatePostIn>;
	_original?: UnreadMailStatePostIn

	_format: NumberString;
	unread: boolean;

	mails: IdTuple[];
}
export const ManageLabelServiceLabelDataTypeRef: TypeRef<ManageLabelServiceLabelData> = new TypeRef("tutanota", 1480)

export function createManageLabelServiceLabelData(values: ManageLabelServiceLabelDataParams): ManageLabelServiceLabelData {
    return Object.assign(create(typeModels[ManageLabelServiceLabelDataTypeRef.typeId], ManageLabelServiceLabelDataTypeRef), values)
}

export type ManageLabelServiceLabelDataParams = {


	name: string;
	color: string;
}

export type ManageLabelServiceLabelData = {
	_type: TypeRef<ManageLabelServiceLabelData>;
	_original?: ManageLabelServiceLabelData

	_id: Id;
	name: string;
	color: string;
}
export const ManageLabelServicePostInTypeRef: TypeRef<ManageLabelServicePostIn> = new TypeRef("tutanota", 1484)

export function createManageLabelServicePostIn(values: ManageLabelServicePostInParams): ManageLabelServicePostIn {
    return Object.assign(create(typeModels[ManageLabelServicePostInTypeRef.typeId], ManageLabelServicePostInTypeRef), values)
}

export type ManageLabelServicePostInParams = {



	data: ManageLabelServiceLabelData;
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
export const ManageLabelServicePostOutTypeRef: TypeRef<ManageLabelServicePostOut> = new TypeRef("tutanota", 1490)

export function createManageLabelServicePostOut(values: ManageLabelServicePostOutParams): ManageLabelServicePostOut {
    return Object.assign(create(typeModels[ManageLabelServicePostOutTypeRef.typeId], ManageLabelServicePostOutTypeRef), values)
}

export type ManageLabelServicePostOutParams = {



	label: IdTuple;
}

export type ManageLabelServicePostOut = {
	_type: TypeRef<ManageLabelServicePostOut>;
	_original?: ManageLabelServicePostOut

	_format: NumberString;

	label: IdTuple;
}
export const ManageLabelServiceDeleteInTypeRef: TypeRef<ManageLabelServiceDeleteIn> = new TypeRef("tutanota", 1500)

export function createManageLabelServiceDeleteIn(values: ManageLabelServiceDeleteInParams): ManageLabelServiceDeleteIn {
    return Object.assign(create(typeModels[ManageLabelServiceDeleteInTypeRef.typeId], ManageLabelServiceDeleteInTypeRef), values)
}

export type ManageLabelServiceDeleteInParams = {



	label: IdTuple;
}

export type ManageLabelServiceDeleteIn = {
	_type: TypeRef<ManageLabelServiceDeleteIn>;
	_original?: ManageLabelServiceDeleteIn

	_format: NumberString;

	label: IdTuple;
}
export const ApplyLabelServicePostInTypeRef: TypeRef<ApplyLabelServicePostIn> = new TypeRef("tutanota", 1504)

export function createApplyLabelServicePostIn(values: ApplyLabelServicePostInParams): ApplyLabelServicePostIn {
    return Object.assign(create(typeModels[ApplyLabelServicePostInTypeRef.typeId], ApplyLabelServicePostInTypeRef), values)
}

export type ApplyLabelServicePostInParams = {



	mails: IdTuple[];
	addedLabels: IdTuple[];
	removedLabels: IdTuple[];
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

export function createImportMailDataMailReference(values: ImportMailDataMailReferenceParams): ImportMailDataMailReference {
    return Object.assign(create(typeModels[ImportMailDataMailReferenceTypeRef.typeId], ImportMailDataMailReferenceTypeRef), values)
}

export type ImportMailDataMailReferenceParams = {


	reference: string;
}

export type ImportMailDataMailReference = {
	_type: TypeRef<ImportMailDataMailReference>;
	_original?: ImportMailDataMailReference

	_id: Id;
	reference: string;
}
export const NewImportAttachmentTypeRef: TypeRef<NewImportAttachment> = new TypeRef("tutanota", 1516)

export function createNewImportAttachment(values: NewImportAttachmentParams): NewImportAttachment {
    return Object.assign(create(typeModels[NewImportAttachmentTypeRef.typeId], NewImportAttachmentTypeRef), values)
}

export type NewImportAttachmentParams = {


	ownerEncFileHashSessionKey: null | Uint8Array;
	encFileHash: null | Uint8Array;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;
	encCid: null | Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
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
	ownerKeyVersion: null | NumberString;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const ImportAttachmentTypeRef: TypeRef<ImportAttachment> = new TypeRef("tutanota", 1524)

export function createImportAttachment(values: ImportAttachmentParams): ImportAttachment {
    return Object.assign(create(typeModels[ImportAttachmentTypeRef.typeId], ImportAttachmentTypeRef), values)
}

export type ImportAttachmentParams = {


	ownerEncFileSessionKey: Uint8Array;
	ownerFileKeyVersion: NumberString;

	newAttachment: null | NewImportAttachment;
	existingAttachmentFile: null | IdTuple;
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

export function createImportMailData(values: ImportMailDataParams): ImportMailData {
    return Object.assign(create(typeModels[ImportMailDataTypeRef.typeId], ImportMailDataTypeRef), values)
}

export type ImportMailDataParams = {


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
	imapModSeq: null | NumberString;
	imapUid: null | NumberString;

	references: ImportMailDataMailReference[];
	sender: MailAddress;
	replyTos: EncryptedMailAddress[];
	recipients: Recipients;
	importedAttachments: ImportAttachment[];
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
	imapModSeq: null | NumberString;
	imapUid: null | NumberString;

	references: ImportMailDataMailReference[];
	sender: MailAddress;
	replyTos: EncryptedMailAddress[];
	recipients: Recipients;
	importedAttachments: ImportAttachment[];
}
export const ImportedFileMailTypeRef: TypeRef<ImportedFileMail> = new TypeRef("tutanota", 1552)

export function createImportedFileMail(values: ImportedFileMailParams): ImportedFileMail {
    return Object.assign(create(typeModels[ImportedFileMailTypeRef.typeId], ImportedFileMailTypeRef), values)
}

export type ImportedFileMailParams = {



	mailSetEntry: IdTuple;
}

export type ImportedFileMail = {
	_type: TypeRef<ImportedFileMail>;
	_original?: ImportedFileMail

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	mailSetEntry: IdTuple;
}
export const ImportFileMailStateTypeRef: TypeRef<ImportFileMailState> = new TypeRef("tutanota", 1559)

export function createImportFileMailState(values: ImportFileMailStateParams): ImportFileMailState {
    return Object.assign(create(typeModels[ImportFileMailStateTypeRef.typeId], ImportFileMailStateTypeRef), values)
}

export type ImportFileMailStateParams = {


	status: NumberString;
	successfulMails: NumberString;
	failedMails: NumberString;
	totalMails: NumberString;

	importedMails: Id;
	targetFolder: IdTuple;
}

export type ImportFileMailState = {
	_type: TypeRef<ImportFileMailState>;
	_original?: ImportFileMailState

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

export function createImportMailPostIn(values: ImportMailPostInParams): ImportMailPostIn {
    return Object.assign(create(typeModels[ImportMailPostInTypeRef.typeId], ImportMailPostInTypeRef), values)
}

export type ImportMailPostInParams = {



	importFileMailState: null | IdTuple;
	encImports: StringWrapper[];
	imapFolderSyncState: null | IdTuple;
}

export type ImportMailPostIn = {
	_type: TypeRef<ImportMailPostIn>;
	_original?: ImportMailPostIn

	_format: NumberString;

	importFileMailState: null | IdTuple;
	encImports: StringWrapper[];
	imapFolderSyncState: null | IdTuple;
}
export const ImportMailPostOutTypeRef: TypeRef<ImportMailPostOut> = new TypeRef("tutanota", 1579)

export function createImportMailPostOut(values: ImportMailPostOutParams): ImportMailPostOut {
    return Object.assign(create(typeModels[ImportMailPostOutTypeRef.typeId], ImportMailPostOutTypeRef), values)
}

export type ImportMailPostOutParams = {


}

export type ImportMailPostOut = {
	_type: TypeRef<ImportMailPostOut>;
	_original?: ImportMailPostOut

	_format: NumberString;
}
export const ImportMailGetInTypeRef: TypeRef<ImportMailGetIn> = new TypeRef("tutanota", 1582)

export function createImportMailGetIn(values: ImportMailGetInParams): ImportMailGetIn {
    return Object.assign(create(typeModels[ImportMailGetInTypeRef.typeId], ImportMailGetInTypeRef), values)
}

export type ImportMailGetInParams = {


	newImportedMailSetName: string;
	totalMails: NumberString;

	targetMailFolder: IdTuple;
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

export function createAdvancedRepeatRule(values: AdvancedRepeatRuleParams): AdvancedRepeatRule {
    return Object.assign(create(typeModels[AdvancedRepeatRuleTypeRef.typeId], AdvancedRepeatRuleTypeRef), values)
}

export type AdvancedRepeatRuleParams = {


	ruleType: NumberString;
	interval: string;
}

export type AdvancedRepeatRule = {
	_type: TypeRef<AdvancedRepeatRule>;
	_original?: AdvancedRepeatRule

	_id: Id;
	ruleType: NumberString;
	interval: string;
}
export const ImportMailGetOutTypeRef: TypeRef<ImportMailGetOut> = new TypeRef("tutanota", 1591)

export function createImportMailGetOut(values: ImportMailGetOutParams): ImportMailGetOut {
    return Object.assign(create(typeModels[ImportMailGetOutTypeRef.typeId], ImportMailGetOutTypeRef), values)
}

export type ImportMailGetOutParams = {



	importFileMailState: IdTuple;
}

export type ImportMailGetOut = {
	_type: TypeRef<ImportMailGetOut>;
	_original?: ImportMailGetOut

	_format: NumberString;

	importFileMailState: IdTuple;
}
export const MailExportTokenServicePostOutTypeRef: TypeRef<MailExportTokenServicePostOut> = new TypeRef("tutanota", 1605)

export function createMailExportTokenServicePostOut(values: MailExportTokenServicePostOutParams): MailExportTokenServicePostOut {
    return Object.assign(create(typeModels[MailExportTokenServicePostOutTypeRef.typeId], MailExportTokenServicePostOutTypeRef), values)
}

export type MailExportTokenServicePostOutParams = {


	mailExportToken: string;
}

export type MailExportTokenServicePostOut = {
	_type: TypeRef<MailExportTokenServicePostOut>;
	_original?: MailExportTokenServicePostOut

	_format: NumberString;
	mailExportToken: string;
}
export const SupportTopicTypeRef: TypeRef<SupportTopic> = new TypeRef("tutanota", 1618)

export function createSupportTopic(values: SupportTopicParams): SupportTopic {
    return Object.assign(create(typeModels[SupportTopicTypeRef.typeId], SupportTopicTypeRef), values)
}

export type SupportTopicParams = {


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

export function createSupportCategory(values: SupportCategoryParams): SupportCategory {
    return Object.assign(create(typeModels[SupportCategoryTypeRef.typeId], SupportCategoryTypeRef), values)
}

export type SupportCategoryParams = {


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

export function createSupportData(values: SupportDataParams): SupportData {
    return Object.assign(create(typeModels[SupportDataTypeRef.typeId], SupportDataTypeRef), values)
}

export type SupportDataParams = {



	categories: SupportCategory[];
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

export function createReceiveInfoServicePostOut(values: ReceiveInfoServicePostOutParams): ReceiveInfoServicePostOut {
    return Object.assign(create(typeModels[ReceiveInfoServicePostOutTypeRef.typeId], ReceiveInfoServicePostOutTypeRef), values)
}

export type ReceiveInfoServicePostOutParams = {


	outdatedVersion: boolean;
}

export type ReceiveInfoServicePostOut = {
	_type: TypeRef<ReceiveInfoServicePostOut>;
	_original?: ReceiveInfoServicePostOut

	_format: NumberString;
	outdatedVersion: boolean;
}
export const ResolveConversationsServiceGetInTypeRef: TypeRef<ResolveConversationsServiceGetIn> = new TypeRef("tutanota", 1645)

export function createResolveConversationsServiceGetIn(values: ResolveConversationsServiceGetInParams): ResolveConversationsServiceGetIn {
    return Object.assign(create(typeModels[ResolveConversationsServiceGetInTypeRef.typeId], ResolveConversationsServiceGetInTypeRef), values)
}

export type ResolveConversationsServiceGetInParams = {



	conversationLists: GeneratedIdWrapper[];
}

export type ResolveConversationsServiceGetIn = {
	_type: TypeRef<ResolveConversationsServiceGetIn>;
	_original?: ResolveConversationsServiceGetIn

	_format: NumberString;

	conversationLists: GeneratedIdWrapper[];
}
export const ResolveConversationsServiceGetOutTypeRef: TypeRef<ResolveConversationsServiceGetOut> = new TypeRef("tutanota", 1648)

export function createResolveConversationsServiceGetOut(values: ResolveConversationsServiceGetOutParams): ResolveConversationsServiceGetOut {
    return Object.assign(create(typeModels[ResolveConversationsServiceGetOutTypeRef.typeId], ResolveConversationsServiceGetOutTypeRef), values)
}

export type ResolveConversationsServiceGetOutParams = {



	mailIds: IdTupleWrapper[];
}

export type ResolveConversationsServiceGetOut = {
	_type: TypeRef<ResolveConversationsServiceGetOut>;
	_original?: ResolveConversationsServiceGetOut

	_format: NumberString;

	mailIds: IdTupleWrapper[];
}
export const UserAccountPostOutTypeRef: TypeRef<UserAccountPostOut> = new TypeRef("tutanota", 1664)

export function createUserAccountPostOut(values: UserAccountPostOutParams): UserAccountPostOut {
    return Object.assign(create(typeModels[UserAccountPostOutTypeRef.typeId], UserAccountPostOutTypeRef), values)
}

export type UserAccountPostOutParams = {


	userId: Id;
	userGroup: Id;
}

export type UserAccountPostOut = {
	_type: TypeRef<UserAccountPostOut>;
	_original?: UserAccountPostOut

	_format: NumberString;
	userId: Id;
	userGroup: Id;
}
export const MailGroupPostOutTypeRef: TypeRef<MailGroupPostOut> = new TypeRef("tutanota", 1668)

export function createMailGroupPostOut(values: MailGroupPostOutParams): MailGroupPostOut {
    return Object.assign(create(typeModels[MailGroupPostOutTypeRef.typeId], MailGroupPostOutTypeRef), values)
}

export type MailGroupPostOutParams = {



	mailGroup: Id;
}

export type MailGroupPostOut = {
	_type: TypeRef<MailGroupPostOut>;
	_original?: MailGroupPostOut

	_format: NumberString;

	mailGroup: Id;
}
export const ChangePrimaryAddressServicePutInTypeRef: TypeRef<ChangePrimaryAddressServicePutIn> = new TypeRef("tutanota", 1671)

export function createChangePrimaryAddressServicePutIn(values: ChangePrimaryAddressServicePutInParams): ChangePrimaryAddressServicePutIn {
    return Object.assign(create(typeModels[ChangePrimaryAddressServicePutInTypeRef.typeId], ChangePrimaryAddressServicePutInTypeRef), values)
}

export type ChangePrimaryAddressServicePutInParams = {


	address: string;

	user: Id;
}

export type ChangePrimaryAddressServicePutIn = {
	_type: TypeRef<ChangePrimaryAddressServicePutIn>;
	_original?: ChangePrimaryAddressServicePutIn

	_format: NumberString;
	address: string;

	user: Id;
}
export const MovedMailsTypeRef: TypeRef<MovedMails> = new TypeRef("tutanota", 1716)

export function createMovedMails(values: MovedMailsParams): MovedMails {
    return Object.assign(create(typeModels[MovedMailsTypeRef.typeId], MovedMailsTypeRef), values)
}

export type MovedMailsParams = {



	targetFolder: IdTuple;
	sourceFolder: IdTuple;
	mailIds: IdTupleWrapper[];
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

export function createMoveMailPostOut(values: MoveMailPostOutParams): MoveMailPostOut {
    return Object.assign(create(typeModels[MoveMailPostOutTypeRef.typeId], MoveMailPostOutTypeRef), values)
}

export type MoveMailPostOutParams = {



	movedMails: MovedMails[];
}

export type MoveMailPostOut = {
	_type: TypeRef<MoveMailPostOut>;
	_original?: MoveMailPostOut

	_format: NumberString;

	movedMails: MovedMails[];
}
export const ClientSpamClassifierResultTypeRef: TypeRef<ClientSpamClassifierResult> = new TypeRef("tutanota", 1724)

export function createClientSpamClassifierResult(values: ClientSpamClassifierResultParams): ClientSpamClassifierResult {
    return Object.assign(create(typeModels[ClientSpamClassifierResultTypeRef.typeId], ClientSpamClassifierResultTypeRef), values)
}

export type ClientSpamClassifierResultParams = {


	spamDecision: NumberString;
	confidence: NumberString;
}

export type ClientSpamClassifierResult = {
	_type: TypeRef<ClientSpamClassifierResult>;
	_original?: ClientSpamClassifierResult

	_id: Id;
	spamDecision: NumberString;
	confidence: NumberString;
}
export const ClientClassifierResultPostInTypeRef: TypeRef<ClientClassifierResultPostIn> = new TypeRef("tutanota", 1730)

export function createClientClassifierResultPostIn(values: ClientClassifierResultPostInParams): ClientClassifierResultPostIn {
    return Object.assign(create(typeModels[ClientClassifierResultPostInTypeRef.typeId], ClientClassifierResultPostInTypeRef), values)
}

export type ClientClassifierResultPostInParams = {


	isPredictionMade: boolean;

	mails: IdTuple[];
}

export type ClientClassifierResultPostIn = {
	_type: TypeRef<ClientClassifierResultPostIn>;
	_original?: ClientClassifierResultPostIn

	_format: NumberString;
	isPredictionMade: boolean;

	mails: IdTuple[];
}
export const ClientSpamTrainingDatumTypeRef: TypeRef<ClientSpamTrainingDatum> = new TypeRef("tutanota", 1736)

export function createClientSpamTrainingDatum(values: ClientSpamTrainingDatumParams): ClientSpamTrainingDatum {
    return Object.assign(create(typeModels[ClientSpamTrainingDatumTypeRef.typeId], ClientSpamTrainingDatumTypeRef), values)
}

export type ClientSpamTrainingDatumParams = {


	confidence: NumberString;
	spamDecision: NumberString;
	vectorLegacy: Uint8Array;
	vectorWithServerClassifiers: null | Uint8Array;
}

export type ClientSpamTrainingDatum = {
	_type: TypeRef<ClientSpamTrainingDatum>;
	_errors: Object;
	_original?: ClientSpamTrainingDatum

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	confidence: NumberString;
	spamDecision: NumberString;
	vectorLegacy: Uint8Array;
	vectorWithServerClassifiers: null | Uint8Array;
	_kdfNonce: null | Uint8Array;
}
export const ClientSpamTrainingDatumIndexEntryTypeRef: TypeRef<ClientSpamTrainingDatumIndexEntry> = new TypeRef("tutanota", 1747)

export function createClientSpamTrainingDatumIndexEntry(values: ClientSpamTrainingDatumIndexEntryParams): ClientSpamTrainingDatumIndexEntry {
    return Object.assign(create(typeModels[ClientSpamTrainingDatumIndexEntryTypeRef.typeId], ClientSpamTrainingDatumIndexEntryTypeRef), values)
}

export type ClientSpamTrainingDatumIndexEntryParams = {


	clientSpamTrainingDatumElementId: Id;
}

export type ClientSpamTrainingDatumIndexEntry = {
	_type: TypeRef<ClientSpamTrainingDatumIndexEntry>;
	_original?: ClientSpamTrainingDatumIndexEntry

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	clientSpamTrainingDatumElementId: Id;
}
export const ProcessInboxDatumTypeRef: TypeRef<ProcessInboxDatum> = new TypeRef("tutanota", 1756)

export function createProcessInboxDatum(values: ProcessInboxDatumParams): ProcessInboxDatum {
    return Object.assign(create(typeModels[ProcessInboxDatumTypeRef.typeId], ProcessInboxDatumTypeRef), values)
}

export type ProcessInboxDatumParams = {


	ownerEncVectorSessionKey: Uint8Array;
	classifierType: null | NumberString;
	encVectorLegacy: Uint8Array;
	encVectorWithServerClassifiers: null | Uint8Array;

	mailId: IdTuple;
	targetMoveFolder: IdTuple;
	ownerEncMailSessionKeys: InstanceSessionKey[];
}

export type ProcessInboxDatum = {
	_type: TypeRef<ProcessInboxDatum>;
	_original?: ProcessInboxDatum

	_id: Id;
	ownerEncVectorSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	classifierType: null | NumberString;
	encVectorLegacy: Uint8Array;
	encVectorWithServerClassifiers: null | Uint8Array;

	mailId: IdTuple;
	targetMoveFolder: IdTuple;
	ownerEncMailSessionKeys: InstanceSessionKey[];
}
export const ProcessInboxPostInTypeRef: TypeRef<ProcessInboxPostIn> = new TypeRef("tutanota", 1764)

export function createProcessInboxPostIn(values: ProcessInboxPostInParams): ProcessInboxPostIn {
    return Object.assign(create(typeModels[ProcessInboxPostInTypeRef.typeId], ProcessInboxPostInTypeRef), values)
}

export type ProcessInboxPostInParams = {


	mailOwnerGroup: Id;

	processInboxData: ProcessInboxDatum[];
}

export type ProcessInboxPostIn = {
	_type: TypeRef<ProcessInboxPostIn>;
	_original?: ProcessInboxPostIn

	_format: NumberString;
	mailOwnerGroup: Id;

	processInboxData: ProcessInboxDatum[];
}
export const PopulateClientSpamTrainingDatumTypeRef: TypeRef<PopulateClientSpamTrainingDatum> = new TypeRef("tutanota", 1770)

export function createPopulateClientSpamTrainingDatum(values: PopulateClientSpamTrainingDatumParams): PopulateClientSpamTrainingDatum {
    return Object.assign(create(typeModels[PopulateClientSpamTrainingDatumTypeRef.typeId], PopulateClientSpamTrainingDatumTypeRef), values)
}

export type PopulateClientSpamTrainingDatumParams = {


	ownerEncVectorSessionKey: Uint8Array;
	isSpam: boolean;
	confidence: NumberString;
	encVectorLegacy: Uint8Array;
	encVectorWithServerClassifiers: null | Uint8Array;

	mailId: IdTuple;
}

export type PopulateClientSpamTrainingDatum = {
	_type: TypeRef<PopulateClientSpamTrainingDatum>;
	_original?: PopulateClientSpamTrainingDatum

	_id: Id;
	ownerEncVectorSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	isSpam: boolean;
	confidence: NumberString;
	encVectorLegacy: Uint8Array;
	encVectorWithServerClassifiers: null | Uint8Array;

	mailId: IdTuple;
}
export const PopulateClientSpamTrainingDataPostInTypeRef: TypeRef<PopulateClientSpamTrainingDataPostIn> = new TypeRef("tutanota", 1778)

export function createPopulateClientSpamTrainingDataPostIn(values: PopulateClientSpamTrainingDataPostInParams): PopulateClientSpamTrainingDataPostIn {
    return Object.assign(create(typeModels[PopulateClientSpamTrainingDataPostInTypeRef.typeId], PopulateClientSpamTrainingDataPostInTypeRef), values)
}

export type PopulateClientSpamTrainingDataPostInParams = {


	mailOwnerGroup: Id;

	populateClientSpamTrainingData: PopulateClientSpamTrainingDatum[];
}

export type PopulateClientSpamTrainingDataPostIn = {
	_type: TypeRef<PopulateClientSpamTrainingDataPostIn>;
	_original?: PopulateClientSpamTrainingDataPostIn

	_format: NumberString;
	mailOwnerGroup: Id;

	populateClientSpamTrainingData: PopulateClientSpamTrainingDatum[];
}
export const SendDraftDeleteInTypeRef: TypeRef<SendDraftDeleteIn> = new TypeRef("tutanota", 1785)

export function createSendDraftDeleteIn(values: SendDraftDeleteInParams): SendDraftDeleteIn {
    return Object.assign(create(typeModels[SendDraftDeleteInTypeRef.typeId], SendDraftDeleteInTypeRef), values)
}

export type SendDraftDeleteInParams = {



	mail: IdTuple;
	sendJob: null | IdTuple;
}

export type SendDraftDeleteIn = {
	_type: TypeRef<SendDraftDeleteIn>;
	_original?: SendDraftDeleteIn

	_format: NumberString;

	mail: IdTuple;
	sendJob: null | IdTuple;
}
export const SendDraftParametersTypeRef: TypeRef<SendDraftParameters> = new TypeRef("tutanota", 1788)

export function createSendDraftParameters(values: SendDraftParametersParams): SendDraftParameters {
    return Object.assign(create(typeModels[SendDraftParametersTypeRef.typeId], SendDraftParametersTypeRef), values)
}

export type SendDraftParametersParams = {


	language: string;
	mailSessionKey: null | Uint8Array;
	bucketEncMailSessionKey: null | Uint8Array;
	senderNameUnencrypted: null | string;
	plaintext: boolean;
	calendarMethod: boolean;
	sessionEncEncryptionAuthStatus: null | Uint8Array;

	mail: IdTuple;
	internalRecipientKeyData: InternalRecipientKeyData[];
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[];
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[];
	attachmentKeyData: AttachmentKeyData[];
}

export type SendDraftParameters = {
	_type: TypeRef<SendDraftParameters>;
	_original?: SendDraftParameters

	_id: Id;
	language: string;
	mailSessionKey: null | Uint8Array;
	bucketEncMailSessionKey: null | Uint8Array;
	senderNameUnencrypted: null | string;
	plaintext: boolean;
	calendarMethod: boolean;
	sessionEncEncryptionAuthStatus: null | Uint8Array;

	mail: IdTuple;
	internalRecipientKeyData: InternalRecipientKeyData[];
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[];
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[];
	attachmentKeyData: AttachmentKeyData[];
}
export const OAuthTokenEndpointResponseTypeRef: TypeRef<OAuthTokenEndpointResponse> = new TypeRef("tutanota", 1860)

export function createOAuthTokenEndpointResponse(values: OAuthTokenEndpointResponseParams): OAuthTokenEndpointResponse {
    return Object.assign(create(typeModels[OAuthTokenEndpointResponseTypeRef.typeId], OAuthTokenEndpointResponseTypeRef), values)
}

export type OAuthTokenEndpointResponseParams = {


	accessToken: string;
	refreshToken: null | string;
	expiresIn: null | NumberString;
	tokenType: string;
}

export type OAuthTokenEndpointResponse = {
	_type: TypeRef<OAuthTokenEndpointResponse>;
	_original?: OAuthTokenEndpointResponse

	_id: Id;
	accessToken: string;
	refreshToken: null | string;
	expiresIn: null | NumberString;
	tokenType: string;
}
export const ImapAccountTypeRef: TypeRef<ImapAccount> = new TypeRef("tutanota", 1866)

export function createImapAccount(values: ImapAccountParams): ImapAccount {
    return Object.assign(create(typeModels[ImapAccountTypeRef.typeId], ImapAccountTypeRef), values)
}

export type ImapAccountParams = {


	host: string;
	port: NumberString;
	username: string;
	password: null | string;

	oAuthTokenEndpointResponse: null | OAuthTokenEndpointResponse;
}

export type ImapAccount = {
	_type: TypeRef<ImapAccount>;
	_original?: ImapAccount

	_id: Id;
	host: string;
	port: NumberString;
	username: string;
	password: null | string;

	oAuthTokenEndpointResponse: null | OAuthTokenEndpointResponse;
}
export const ImportedImapMailTypeRef: TypeRef<ImportedImapMail> = new TypeRef("tutanota", 1873)

export function createImportedImapMail(values: ImportedImapMailParams): ImportedImapMail {
    return Object.assign(create(typeModels[ImportedImapMailTypeRef.typeId], ImportedImapMailTypeRef), values)
}

export type ImportedImapMailParams = {


	imapUid: NumberString;
	imapModSeq: null | NumberString;
	messageId: string;

	mailSetEntry: IdTuple;
}

export type ImportedImapMail = {
	_type: TypeRef<ImportedImapMail>;
	_original?: ImportedImapMail

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	imapUid: NumberString;
	imapModSeq: null | NumberString;
	messageId: string;

	mailSetEntry: IdTuple;
}
export const DeduplicatedImportedAttachmentTypeRef: TypeRef<DeduplicatedImportedAttachment> = new TypeRef("tutanota", 1883)

export function createDeduplicatedImportedAttachment(values: DeduplicatedImportedAttachmentParams): DeduplicatedImportedAttachment {
    return Object.assign(create(typeModels[DeduplicatedImportedAttachmentTypeRef.typeId], DeduplicatedImportedAttachmentTypeRef), values)
}

export type DeduplicatedImportedAttachmentParams = {


	attachmentHash: string;

	attachment: IdTuple;
}

export type DeduplicatedImportedAttachment = {
	_type: TypeRef<DeduplicatedImportedAttachment>;
	_errors: Object;
	_original?: DeduplicatedImportedAttachment

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;
	attachmentHash: string;

	attachment: IdTuple;
}
export const ImapFolderSyncStateTypeRef: TypeRef<ImapFolderSyncState> = new TypeRef("tutanota", 1895)

export function createImapFolderSyncState(values: ImapFolderSyncStateParams): ImapFolderSyncState {
    return Object.assign(create(typeModels[ImapFolderSyncStateTypeRef.typeId], ImapFolderSyncStateTypeRef), values)
}

export type ImapFolderSyncStateParams = {


	path: string;
	status: NumberString;
	uidvalidity: null | NumberString;
	uidnext: null | NumberString;
	highestmodseq: null | NumberString;

	importedMails: Id;
	mailFolder: null | IdTuple;
	imapAccountSyncState: IdTuple;
}

export type ImapFolderSyncState = {
	_type: TypeRef<ImapFolderSyncState>;
	_errors: Object;
	_original?: ImapFolderSyncState

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;
	path: string;
	status: NumberString;
	uidvalidity: null | NumberString;
	uidnext: null | NumberString;
	highestmodseq: null | NumberString;

	importedMails: Id;
	mailFolder: null | IdTuple;
	imapAccountSyncState: IdTuple;
}
export const ImapAccountSyncStateTypeRef: TypeRef<ImapAccountSyncState> = new TypeRef("tutanota", 1911)

export function createImapAccountSyncState(values: ImapAccountSyncStateParams): ImapAccountSyncState {
    return Object.assign(create(typeModels[ImapAccountSyncStateTypeRef.typeId], ImapAccountSyncStateTypeRef), values)
}

export type ImapAccountSyncStateParams = {


	maxQuota: NumberString;
	postponedUntil: NumberString;
	provider: NumberString;
	status: NumberString;
	importedMailCount: null | NumberString;

	imapFolderSyncStateList: Id;
	imapAccount: ImapAccount;
	rootImportMailFolder: null | IdTuple;
	imapSyncLabel: null | IdTuple;
}

export type ImapAccountSyncState = {
	_type: TypeRef<ImapAccountSyncState>;
	_errors: Object;
	_original?: ImapAccountSyncState

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;
	maxQuota: NumberString;
	postponedUntil: NumberString;
	provider: NumberString;
	status: NumberString;
	importedMailCount: null | NumberString;

	imapFolderSyncStateList: Id;
	imapAccount: ImapAccount;
	rootImportMailFolder: null | IdTuple;
	imapSyncLabel: null | IdTuple;
}
export const ImapFolderPostInTypeRef: TypeRef<ImapFolderPostIn> = new TypeRef("tutanota", 1929)

export function createImapFolderPostIn(values: ImapFolderPostInParams): ImapFolderPostIn {
    return Object.assign(create(typeModels[ImapFolderPostInTypeRef.typeId], ImapFolderPostInTypeRef), values)
}

export type ImapFolderPostInParams = {


	path: string;

	imapAccountSyncState: IdTuple;
	mailFolder: null | IdTuple;
}

export type ImapFolderPostIn = {
	_type: TypeRef<ImapFolderPostIn>;
	_errors: Object;
	_original?: ImapFolderPostIn

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	ownerGroup: Id;
	path: string;

	imapAccountSyncState: IdTuple;
	mailFolder: null | IdTuple;
}
export const ImapFolderPostOutTypeRef: TypeRef<ImapFolderPostOut> = new TypeRef("tutanota", 1937)

export function createImapFolderPostOut(values: ImapFolderPostOutParams): ImapFolderPostOut {
    return Object.assign(create(typeModels[ImapFolderPostOutTypeRef.typeId], ImapFolderPostOutTypeRef), values)
}

export type ImapFolderPostOutParams = {



	imapFolderSyncState: IdTuple;
}

export type ImapFolderPostOut = {
	_type: TypeRef<ImapFolderPostOut>;
	_original?: ImapFolderPostOut

	_format: NumberString;

	imapFolderSyncState: IdTuple;
}
export const ImapFolderDeleteInTypeRef: TypeRef<ImapFolderDeleteIn> = new TypeRef("tutanota", 1940)

export function createImapFolderDeleteIn(values: ImapFolderDeleteInParams): ImapFolderDeleteIn {
    return Object.assign(create(typeModels[ImapFolderDeleteInTypeRef.typeId], ImapFolderDeleteInTypeRef), values)
}

export type ImapFolderDeleteInParams = {



	imapFolderSyncState: IdTuple;
}

export type ImapFolderDeleteIn = {
	_type: TypeRef<ImapFolderDeleteIn>;
	_original?: ImapFolderDeleteIn

	_format: NumberString;

	imapFolderSyncState: IdTuple;
}
export const ImapPostInTypeRef: TypeRef<ImapPostIn> = new TypeRef("tutanota", 1944)

export function createImapPostIn(values: ImapPostInParams): ImapPostIn {
    return Object.assign(create(typeModels[ImapPostInTypeRef.typeId], ImapPostInTypeRef), values)
}

export type ImapPostInParams = {


	maxQuota: NumberString;
	postponedUntil: NumberString;
	provider: NumberString;

	imapAccount: ImapAccount;
	rootImportMailFolder: null | IdTuple;
	syncLabel: null | IdTuple;
}

export type ImapPostIn = {
	_type: TypeRef<ImapPostIn>;
	_errors: Object;
	_original?: ImapPostIn

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	ownerGroup: Id;
	maxQuota: NumberString;
	postponedUntil: NumberString;
	provider: NumberString;

	imapAccount: ImapAccount;
	rootImportMailFolder: null | IdTuple;
	syncLabel: null | IdTuple;
}
export const ImapPostOutTypeRef: TypeRef<ImapPostOut> = new TypeRef("tutanota", 1955)

export function createImapPostOut(values: ImapPostOutParams): ImapPostOut {
    return Object.assign(create(typeModels[ImapPostOutTypeRef.typeId], ImapPostOutTypeRef), values)
}

export type ImapPostOutParams = {



	imapAccountSyncState: IdTuple;
}

export type ImapPostOut = {
	_type: TypeRef<ImapPostOut>;
	_original?: ImapPostOut

	_format: NumberString;

	imapAccountSyncState: IdTuple;
}
export const ImapDeleteInTypeRef: TypeRef<ImapDeleteIn> = new TypeRef("tutanota", 1958)

export function createImapDeleteIn(values: ImapDeleteInParams): ImapDeleteIn {
    return Object.assign(create(typeModels[ImapDeleteInTypeRef.typeId], ImapDeleteInTypeRef), values)
}

export type ImapDeleteInParams = {



	imapAccountSyncState: IdTuple;
}

export type ImapDeleteIn = {
	_type: TypeRef<ImapDeleteIn>;
	_original?: ImapDeleteIn

	_format: NumberString;

	imapAccountSyncState: IdTuple;
}
export const ImapOauthConfigGetInTypeRef: TypeRef<ImapOauthConfigGetIn> = new TypeRef("tutanota", 1969)

export function createImapOauthConfigGetIn(values: ImapOauthConfigGetInParams): ImapOauthConfigGetIn {
    return Object.assign(create(typeModels[ImapOauthConfigGetInTypeRef.typeId], ImapOauthConfigGetInTypeRef), values)
}

export type ImapOauthConfigGetInParams = {


	clientId: string;
}

export type ImapOauthConfigGetIn = {
	_type: TypeRef<ImapOauthConfigGetIn>;
	_original?: ImapOauthConfigGetIn

	_format: NumberString;
	clientId: string;
}
export const ImapOauthConfigGetOutTypeRef: TypeRef<ImapOauthConfigGetOut> = new TypeRef("tutanota", 1972)

export function createImapOauthConfigGetOut(values: ImapOauthConfigGetOutParams): ImapOauthConfigGetOut {
    return Object.assign(create(typeModels[ImapOauthConfigGetOutTypeRef.typeId], ImapOauthConfigGetOutTypeRef), values)
}

export type ImapOauthConfigGetOutParams = {


	clientSecret: string;
}

export type ImapOauthConfigGetOut = {
	_type: TypeRef<ImapOauthConfigGetOut>;
	_original?: ImapOauthConfigGetOut

	_format: NumberString;
	clientSecret: string;
}
export const ImapPutInTypeRef: TypeRef<ImapPutIn> = new TypeRef("tutanota", 1979)

export function createImapPutIn(values: ImapPutInParams): ImapPutIn {
    return Object.assign(create(typeModels[ImapPutInTypeRef.typeId], ImapPutInTypeRef), values)
}

export type ImapPutInParams = {


	newImapAccountSyncStatus: NumberString;
	newImapFolderSyncStatus: NumberString;

	imapAccountSyncState: IdTuple;
}

export type ImapPutIn = {
	_type: TypeRef<ImapPutIn>;
	_original?: ImapPutIn

	_format: NumberString;
	newImapAccountSyncStatus: NumberString;
	newImapFolderSyncStatus: NumberString;

	imapAccountSyncState: IdTuple;
}
