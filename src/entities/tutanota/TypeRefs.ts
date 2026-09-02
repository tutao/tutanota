import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId, DataTransferId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"
import { Nullable } from "@tutao/utils"
import { Blob } from "../sys/TypeRefs.js"
import { BucketKey } from "../sys/TypeRefs.js"
import { BlobReferenceTokenWrapper } from "../sys/TypeRefs.js"
import { DateWrapper } from "../sys/TypeRefs.js"
import { StringWrapper } from "../sys/TypeRefs.js"
import { GeneratedIdWrapper } from "../sys/TypeRefs.js"
import { IdTupleWrapper } from "../sys/TypeRefs.js"
import { InstanceSessionKey } from "../sys/TypeRefs.js"

export const SubfilesTypeRef: TypeRef<Subfiles> = new TypeRef("tutanota", 11)

export function createSubfiles(values: SubfilesParams): Subfiles {
	return Object.assign(create(typeModels[SubfilesTypeRef.typeId], SubfilesTypeRef), values)
}

export type SubfilesParams = {
	files: Id
}

export type Subfiles = {
	// == values

	_id: Id

	// == associations

	files: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<Subfiles>
	_original: Nullable<Subfiles>
	isAdapter: false
}
export const FileTypeRef: TypeRef<File> = new TypeRef("tutanota", 13)

export function createFile(values: FileParams): File {
	return Object.assign(create(typeModels[FileTypeRef.typeId], FileTypeRef), values)
}

export type FileParams = {
	name: string
	size: NumberString
	mimeType: null | string
	cid: null | string

	parent: null | IdTuple
	subFiles: null | Subfiles
	blobs: Blob[]
}

export type File = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	name: string
	size: NumberString
	mimeType: null | string
	_ownerGroup: null | Id
	cid: null | string
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	parent: null | IdTuple
	subFiles: null | Subfiles
	blobs: Blob[]

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<File>
	_errors: Object
	_original: Nullable<File>
	isAdapter: false
}
export const FileSystemTypeRef: TypeRef<FileSystem> = new TypeRef("tutanota", 28)

export function createFileSystem(values: FileSystemParams): FileSystem {
	return Object.assign(create(typeModels[FileSystemTypeRef.typeId], FileSystemTypeRef), values)
}

export type FileSystemParams = {
	files: Id
}

export type FileSystem = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	files: Id

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<FileSystem>
	_errors: Object
	_original: Nullable<FileSystem>
	isAdapter: false
}
export const ContactMailAddressTypeRef: TypeRef<ContactMailAddress> = new TypeRef("tutanota", 44)

export function createContactMailAddress(values: ContactMailAddressParams): ContactMailAddress {
	return Object.assign(create(typeModels[ContactMailAddressTypeRef.typeId], ContactMailAddressTypeRef), values)
}

export type ContactMailAddressParams = {
	type: NumberString
	address: string
	customTypeName: string
}

export type ContactMailAddress = {
	// == values

	_id: Id
	type: NumberString
	address: string
	customTypeName: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactMailAddress>
	_original: Nullable<ContactMailAddress>
	isAdapter: false
}
export const ContactPhoneNumberTypeRef: TypeRef<ContactPhoneNumber> = new TypeRef("tutanota", 49)

export function createContactPhoneNumber(values: ContactPhoneNumberParams): ContactPhoneNumber {
	return Object.assign(create(typeModels[ContactPhoneNumberTypeRef.typeId], ContactPhoneNumberTypeRef), values)
}

export type ContactPhoneNumberParams = {
	type: NumberString
	number: string
	customTypeName: string
}

export type ContactPhoneNumber = {
	// == values

	_id: Id
	type: NumberString
	number: string
	customTypeName: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactPhoneNumber>
	_original: Nullable<ContactPhoneNumber>
	isAdapter: false
}
export const ContactAddressTypeRef: TypeRef<ContactAddress> = new TypeRef("tutanota", 54)

export function createContactAddress(values: ContactAddressParams): ContactAddress {
	return Object.assign(create(typeModels[ContactAddressTypeRef.typeId], ContactAddressTypeRef), values)
}

export type ContactAddressParams = {
	type: NumberString
	address: string
	customTypeName: string
}

export type ContactAddress = {
	// == values

	_id: Id
	type: NumberString
	address: string
	customTypeName: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactAddress>
	_original: Nullable<ContactAddress>
	isAdapter: false
}
export const ContactSocialIdTypeRef: TypeRef<ContactSocialId> = new TypeRef("tutanota", 59)

export function createContactSocialId(values: ContactSocialIdParams): ContactSocialId {
	return Object.assign(create(typeModels[ContactSocialIdTypeRef.typeId], ContactSocialIdTypeRef), values)
}

export type ContactSocialIdParams = {
	type: NumberString
	socialId: string
	customTypeName: string
}

export type ContactSocialId = {
	// == values

	_id: Id
	type: NumberString
	socialId: string
	customTypeName: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactSocialId>
	_original: Nullable<ContactSocialId>
	isAdapter: false
}
export const ContactTypeRef: TypeRef<Contact> = new TypeRef("tutanota", 64)

export function createContact(values: ContactParams): Contact {
	return Object.assign(create(typeModels[ContactTypeRef.typeId], ContactTypeRef), values)
}

export type ContactParams = {
	firstName: string
	lastName: string
	company: string
	role: string
	oldBirthdayDate: null | Date
	comment: string
	presharedPassword: null | string
	nickname: null | string
	title: null | string
	birthdayIso: null | string
	middleName: null | string
	nameSuffix: null | string
	phoneticFirst: null | string
	phoneticMiddle: null | string
	phoneticLast: null | string
	department: null | string

	mailAddresses: ContactMailAddress[]
	phoneNumbers: ContactPhoneNumber[]
	addresses: ContactAddress[]
	socialIds: ContactSocialId[]
	oldBirthdayAggregate: null | Birthday
	photo: null | IdTuple
	customDate: ContactCustomDate[]
	websites: ContactWebsite[]
	relationships: ContactRelationship[]
	messengerHandles: ContactMessengerHandle[]
	pronouns: ContactPronouns[]
}

export type Contact = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	firstName: string
	lastName: string
	company: string
	role: string
	oldBirthdayDate: null | Date
	comment: string
	presharedPassword: null | string
	_ownerGroup: null | Id
	nickname: null | string
	title: null | string
	birthdayIso: null | string
	middleName: null | string
	nameSuffix: null | string
	phoneticFirst: null | string
	phoneticMiddle: null | string
	phoneticLast: null | string
	department: null | string
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	mailAddresses: ContactMailAddress[]
	phoneNumbers: ContactPhoneNumber[]
	addresses: ContactAddress[]
	socialIds: ContactSocialId[]
	oldBirthdayAggregate: null | Birthday
	photo: null | IdTuple
	customDate: ContactCustomDate[]
	websites: ContactWebsite[]
	relationships: ContactRelationship[]
	messengerHandles: ContactMessengerHandle[]
	pronouns: ContactPronouns[]

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<Contact>
	_errors: Object
	_original: Nullable<Contact>
	isAdapter: false
}
export const ConversationEntryTypeRef: TypeRef<ConversationEntry> = new TypeRef("tutanota", 84)

export function createConversationEntry(values: ConversationEntryParams): ConversationEntry {
	return Object.assign(create(typeModels[ConversationEntryTypeRef.typeId], ConversationEntryTypeRef), values)
}

export type ConversationEntryParams = {
	messageId: string
	conversationType: NumberString

	previous: null | IdTuple
	mail: null | IdTuple
}

export type ConversationEntry = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	messageId: string
	conversationType: NumberString
	_ownerGroup: null | Id

	// == associations

	previous: null | IdTuple
	mail: null | IdTuple

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ConversationEntry>
	_original: Nullable<ConversationEntry>
	isAdapter: false
}
export const MailAddressTypeRef: TypeRef<MailAddress> = new TypeRef("tutanota", 92)

export function createMailAddress(values: MailAddressParams): MailAddress {
	return Object.assign(create(typeModels[MailAddressTypeRef.typeId], MailAddressTypeRef), values)
}

export type MailAddressParams = {
	name: string
	address: string

	contact: null | IdTuple
}

export type MailAddress = {
	// == values

	_id: Id
	name: string
	address: string

	// == associations

	contact: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailAddress>
	_original: Nullable<MailAddress>
	isAdapter: false
}
export const MailTypeRef: TypeRef<Mail> = new TypeRef("tutanota", 97)

export function createMail(values: MailParams): Mail {
	return Object.assign(create(typeModels[MailTypeRef.typeId], MailTypeRef), values)
}

export type MailParams = {
	subject: string
	receivedDate: Date
	state: NumberString
	unread: boolean
	confidential: boolean
	replyType: NumberString
	differentEnvelopeSender: null | string
	listUnsubscribe: boolean
	movedTime: null | Date
	phishingStatus: NumberString
	authStatus: null | NumberString
	method: NumberString
	recipientCount: NumberString
	encryptionAuthStatus: null | NumberString
	processingState: NumberString
	processNeeded: boolean
	sendAt: null | Date
	serverClassificationData: null | string

	sender: MailAddress
	attachments: IdTuple[]
	conversationEntry: IdTuple
	firstRecipient: null | MailAddress
	mailDetails: null | IdTuple
	mailDetailsDraft: null | IdTuple
	bucketKey: null | BucketKey
	sets: IdTuple[]
	clientSpamClassifierResult: null | ClientSpamClassifierResult
}

export type Mail = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	subject: string
	receivedDate: Date
	state: NumberString
	unread: boolean
	confidential: boolean
	replyType: NumberString
	_ownerGroup: null | Id
	differentEnvelopeSender: null | string
	listUnsubscribe: boolean
	movedTime: null | Date
	phishingStatus: NumberString
	authStatus: null | NumberString
	method: NumberString
	recipientCount: NumberString
	encryptionAuthStatus: null | NumberString
	_ownerKeyVersion: null | NumberString
	processingState: NumberString
	processNeeded: boolean
	sendAt: null | Date
	serverClassificationData: null | string
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	sender: MailAddress
	attachments: IdTuple[]
	conversationEntry: IdTuple
	firstRecipient: null | MailAddress
	mailDetails: null | IdTuple
	mailDetailsDraft: null | IdTuple
	bucketKey: null | BucketKey
	sets: IdTuple[]
	clientSpamClassifierResult: null | ClientSpamClassifierResult

	//== some entities have these and some don't

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<Mail>
	_errors: Object
	_original: Nullable<Mail>
	isAdapter: false
}
export const MailBoxTypeRef: TypeRef<MailBox> = new TypeRef("tutanota", 125)

export function createMailBox(values: MailBoxParams): MailBox {
	return Object.assign(create(typeModels[MailBoxTypeRef.typeId], MailBoxTypeRef), values)
}

export type MailBoxParams = {
	lastInfoDate: Date

	sentAttachments: Id
	receivedAttachments: Id
	mailSets: MailSetRef
	spamResults: SpamResults
	mailDetailsDrafts: null | MailDetailsDraftsRef
	archivedMailBags: MailBag[]
	currentMailBag: null | MailBag
	importedAttachments: Id
	importFileMailStates: Id
	extractedFeatures: Id
	clientSpamTrainingData: Id
	modifiedClientSpamTrainingDataIndex: Id
	imapAccountSyncStates: null | Id
	deduplicatedImportedAttachments: null | Id
}

export type MailBox = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	lastInfoDate: Date
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	sentAttachments: Id
	receivedAttachments: Id
	mailSets: MailSetRef
	spamResults: SpamResults
	mailDetailsDrafts: null | MailDetailsDraftsRef
	archivedMailBags: MailBag[]
	currentMailBag: null | MailBag
	importedAttachments: Id
	importFileMailStates: Id
	extractedFeatures: Id
	clientSpamTrainingData: Id
	modifiedClientSpamTrainingDataIndex: Id
	imapAccountSyncStates: null | Id
	deduplicatedImportedAttachments: null | Id

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailBox>
	_errors: Object
	_original: Nullable<MailBox>
	isAdapter: false
}
export const CreateExternalUserGroupDataTypeRef: TypeRef<CreateExternalUserGroupData> = new TypeRef("tutanota", 138)

export function createCreateExternalUserGroupData(values: CreateExternalUserGroupDataParams): CreateExternalUserGroupData {
	return Object.assign(create(typeModels[CreateExternalUserGroupDataTypeRef.typeId], CreateExternalUserGroupDataTypeRef), values)
}

export type CreateExternalUserGroupDataParams = {
	mailAddress: string
	externalPwEncUserGroupKey: Uint8Array<ArrayBuffer>
	internalUserEncUserGroupKey: Uint8Array<ArrayBuffer>
	internalUserGroupKeyVersion: NumberString
}

export type CreateExternalUserGroupData = {
	// == values

	_id: Id
	mailAddress: string
	externalPwEncUserGroupKey: Uint8Array<ArrayBuffer>
	internalUserEncUserGroupKey: Uint8Array<ArrayBuffer>
	internalUserGroupKeyVersion: NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CreateExternalUserGroupData>
	_original: Nullable<CreateExternalUserGroupData>
	isAdapter: false
}
export const ExternalUserDataTypeRef: TypeRef<ExternalUserData> = new TypeRef("tutanota", 145)

export function createExternalUserData(values: ExternalUserDataParams): ExternalUserData {
	return Object.assign(create(typeModels[ExternalUserDataTypeRef.typeId], ExternalUserDataTypeRef), values)
}

export type ExternalUserDataParams = {
	externalUserEncMailGroupKey: Uint8Array<ArrayBuffer>
	verifier: Uint8Array<ArrayBuffer>
	externalUserEncUserGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	externalUserEncEntropy: Uint8Array<ArrayBuffer>
	internalMailEncUserGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	externalMailEncMailGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	internalMailEncMailGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	externalUserEncTutanotaPropertiesSessionKey: Uint8Array<ArrayBuffer>
	externalMailEncMailBoxSessionKey: Uint8Array<ArrayBuffer>
	kdfVersion: NumberString
	internalMailGroupKeyVersion: NumberString

	userGroupData: CreateExternalUserGroupData
}

export type ExternalUserData = {
	// == values

	_format: NumberString
	externalUserEncMailGroupKey: Uint8Array<ArrayBuffer>
	verifier: Uint8Array<ArrayBuffer>
	externalUserEncUserGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	externalUserEncEntropy: Uint8Array<ArrayBuffer>
	internalMailEncUserGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	externalMailEncMailGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	internalMailEncMailGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	externalUserEncTutanotaPropertiesSessionKey: Uint8Array<ArrayBuffer>
	externalMailEncMailBoxSessionKey: Uint8Array<ArrayBuffer>
	kdfVersion: NumberString
	internalMailGroupKeyVersion: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	userGroupData: CreateExternalUserGroupData

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ExternalUserData>
	_original: Nullable<ExternalUserData>
	isAdapter: false
}
export const ContactListTypeRef: TypeRef<ContactList> = new TypeRef("tutanota", 153)

export function createContactList(values: ContactListParams): ContactList {
	return Object.assign(create(typeModels[ContactListTypeRef.typeId], ContactListTypeRef), values)
}

export type ContactListParams = {
	contacts: Id
	photos: null | PhotosRef
}

export type ContactList = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	contacts: Id
	photos: null | PhotosRef

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactList>
	_errors: Object
	_original: Nullable<ContactList>
	isAdapter: false
}
export const RemoteImapSyncInfoTypeRef: TypeRef<RemoteImapSyncInfo> = new TypeRef("tutanota", 183)

export function createRemoteImapSyncInfo(values: RemoteImapSyncInfoParams): RemoteImapSyncInfo {
	return Object.assign(create(typeModels[RemoteImapSyncInfoTypeRef.typeId], RemoteImapSyncInfoTypeRef), values)
}

export type RemoteImapSyncInfoParams = {
	seen: boolean

	message: IdTuple
}

export type RemoteImapSyncInfo = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	seen: boolean
	_ownerGroup: null | Id

	// == associations

	message: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<RemoteImapSyncInfo>
	_original: Nullable<RemoteImapSyncInfo>
	isAdapter: false
}
export const ImapFolderTypeRef: TypeRef<ImapFolder> = new TypeRef("tutanota", 190)

export function createImapFolder(values: ImapFolderParams): ImapFolder {
	return Object.assign(create(typeModels[ImapFolderTypeRef.typeId], ImapFolderTypeRef), values)
}

export type ImapFolderParams = {
	name: string
	lastseenuid: string
	uidvalidity: string

	syncInfo: Id
}

export type ImapFolder = {
	// == values

	_id: Id
	name: string
	lastseenuid: string
	uidvalidity: string

	// == associations

	syncInfo: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapFolder>
	_original: Nullable<ImapFolder>
	isAdapter: false
}
export const ImapSyncStateTypeRef: TypeRef<ImapSyncState> = new TypeRef("tutanota", 196)

export function createImapSyncState(values: ImapSyncStateParams): ImapSyncState {
	return Object.assign(create(typeModels[ImapSyncStateTypeRef.typeId], ImapSyncStateTypeRef), values)
}

export type ImapSyncStateParams = {
	folders: ImapFolder[]
}

export type ImapSyncState = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	folders: ImapFolder[]

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapSyncState>
	_original: Nullable<ImapSyncState>
	isAdapter: false
}
export const ImapSyncConfigurationTypeRef: TypeRef<ImapSyncConfiguration> = new TypeRef("tutanota", 209)

export function createImapSyncConfiguration(values: ImapSyncConfigurationParams): ImapSyncConfiguration {
	return Object.assign(create(typeModels[ImapSyncConfigurationTypeRef.typeId], ImapSyncConfigurationTypeRef), values)
}

export type ImapSyncConfigurationParams = {
	host: string
	port: NumberString
	user: string
	password: string

	imapSyncState: null | Id
}

export type ImapSyncConfiguration = {
	// == values

	_id: Id
	host: string
	port: NumberString
	user: string
	password: string

	// == associations

	imapSyncState: null | Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapSyncConfiguration>
	_original: Nullable<ImapSyncConfiguration>
	isAdapter: false
}
export const TutanotaPropertiesTypeRef: TypeRef<TutanotaProperties> = new TypeRef("tutanota", 216)

export function createTutanotaProperties(values: TutanotaPropertiesParams): TutanotaProperties {
	return Object.assign(create(typeModels[TutanotaPropertiesTypeRef.typeId], TutanotaPropertiesTypeRef), values)
}

export type TutanotaPropertiesParams = {
	userEncEntropy: null | Uint8Array<ArrayBuffer>
	notificationMailLanguage: null | string
	defaultSender: null | string
	defaultUnconfidential: boolean
	customEmailSignature: string
	emailSignatureType: NumberString
	noAutomaticContacts: boolean
	sendPlaintextOnly: boolean
	lastSeenAnnouncement: NumberString
	userKeyVersion: null | NumberString
	defaultLabelCreated: boolean

	lastPushedMail: null | IdTuple
	imapSyncConfig: ImapSyncConfiguration[]
	inboxRules: InboxRule[]
}

export type TutanotaProperties = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	userEncEntropy: null | Uint8Array<ArrayBuffer>
	notificationMailLanguage: null | string
	defaultSender: null | string
	defaultUnconfidential: boolean
	customEmailSignature: string
	emailSignatureType: NumberString
	noAutomaticContacts: boolean
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	sendPlaintextOnly: boolean
	lastSeenAnnouncement: NumberString
	_ownerKeyVersion: null | NumberString
	userKeyVersion: null | NumberString
	defaultLabelCreated: boolean
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	lastPushedMail: null | IdTuple
	imapSyncConfig: ImapSyncConfiguration[]
	inboxRules: InboxRule[]

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<TutanotaProperties>
	_errors: Object
	_original: Nullable<TutanotaProperties>
	isAdapter: false
}
export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", 223)

export function createNotificationMail(values: NotificationMailParams): NotificationMail {
	return Object.assign(create(typeModels[NotificationMailTypeRef.typeId], NotificationMailTypeRef), values)
}

export type NotificationMailParams = {
	subject: string
	bodyText: string
	recipientMailAddress: string
	recipientName: string
	mailboxLink: string
}

export type NotificationMail = {
	// == values

	_id: Id
	subject: string
	bodyText: string
	recipientMailAddress: string
	recipientName: string
	mailboxLink: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<NotificationMail>
	_original: Nullable<NotificationMail>
	isAdapter: false
}
export const DeleteMailDataTypeRef: TypeRef<DeleteMailData> = new TypeRef("tutanota", 419)

export function createDeleteMailData(values: DeleteMailDataParams): DeleteMailData {
	return Object.assign(create(typeModels[DeleteMailDataTypeRef.typeId], DeleteMailDataTypeRef), values)
}

export type DeleteMailDataParams = {
	mails: IdTuple[]
	folder: null | IdTuple
}

export type DeleteMailData = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mails: IdTuple[]
	folder: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DeleteMailData>
	_original: Nullable<DeleteMailData>
	isAdapter: false
}
export const MailSetTypeRef: TypeRef<MailSet> = new TypeRef("tutanota", 429)

export function createMailSet(values: MailSetParams): MailSet {
	return Object.assign(create(typeModels[MailSetTypeRef.typeId], MailSetTypeRef), values)
}

export type MailSetParams = {
	name: string
	folderType: NumberString
	color: null | string

	parentFolder: null | IdTuple
	entries: Id
}

export type MailSet = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	name: string
	folderType: NumberString
	_ownerGroup: null | Id
	_ownerKeyVersion: null | NumberString
	color: null | string
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	parentFolder: null | IdTuple
	entries: Id

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailSet>
	_errors: Object
	_original: Nullable<MailSet>
	isAdapter: false
}
export const MailSetRefTypeRef: TypeRef<MailSetRef> = new TypeRef("tutanota", 440)

export function createMailSetRef(values: MailSetRefParams): MailSetRef {
	return Object.assign(create(typeModels[MailSetRefTypeRef.typeId], MailSetRefTypeRef), values)
}

export type MailSetRefParams = {
	mailSets: Id
}

export type MailSetRef = {
	// == values

	_id: Id

	// == associations

	mailSets: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailSetRef>
	_original: Nullable<MailSetRef>
	isAdapter: false
}
export const MoveMailDataTypeRef: TypeRef<MoveMailData> = new TypeRef("tutanota", 445)

export function createMoveMailData(values: MoveMailDataParams): MoveMailData {
	return Object.assign(create(typeModels[MoveMailDataTypeRef.typeId], MoveMailDataTypeRef), values)
}

export type MoveMailDataParams = {
	moveReason: null | NumberString

	targetFolder: IdTuple
	mails: IdTuple[]
	excludeMailSet: null | IdTuple
}

export type MoveMailData = {
	// == values

	_format: NumberString
	moveReason: null | NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	targetFolder: IdTuple
	mails: IdTuple[]
	excludeMailSet: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MoveMailData>
	_original: Nullable<MoveMailData>
	isAdapter: false
}
export const CreateMailFolderDataTypeRef: TypeRef<CreateMailFolderData> = new TypeRef("tutanota", 450)

export function createCreateMailFolderData(values: CreateMailFolderDataParams): CreateMailFolderData {
	return Object.assign(create(typeModels[CreateMailFolderDataTypeRef.typeId], CreateMailFolderDataTypeRef), values)
}

export type CreateMailFolderDataParams = {
	folderName: string

	parentFolder: null | IdTuple
}

export type CreateMailFolderData = {
	// == values

	_format: NumberString
	folderName: string
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	ownerGroup: null | Id
	ownerKeyVersion: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	parentFolder: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CreateMailFolderData>
	_errors: Object
	_original: Nullable<CreateMailFolderData>
	isAdapter: false
}
export const CreateMailFolderReturnTypeRef: TypeRef<CreateMailFolderReturn> = new TypeRef("tutanota", 455)

export function createCreateMailFolderReturn(values: CreateMailFolderReturnParams): CreateMailFolderReturn {
	return Object.assign(create(typeModels[CreateMailFolderReturnTypeRef.typeId], CreateMailFolderReturnTypeRef), values)
}

export type CreateMailFolderReturnParams = {
	newFolder: IdTuple
}

export type CreateMailFolderReturn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	newFolder: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CreateMailFolderReturn>
	_errors: Object
	_original: Nullable<CreateMailFolderReturn>
	isAdapter: false
}
export const DeleteMailFolderDataTypeRef: TypeRef<DeleteMailFolderData> = new TypeRef("tutanota", 458)

export function createDeleteMailFolderData(values: DeleteMailFolderDataParams): DeleteMailFolderData {
	return Object.assign(create(typeModels[DeleteMailFolderDataTypeRef.typeId], DeleteMailFolderDataTypeRef), values)
}

export type DeleteMailFolderDataParams = {
	folders: IdTuple[]
}

export type DeleteMailFolderData = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	folders: IdTuple[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DeleteMailFolderData>
	_errors: Object
	_original: Nullable<DeleteMailFolderData>
	isAdapter: false
}
export const EncryptTutanotaPropertiesDataTypeRef: TypeRef<EncryptTutanotaPropertiesData> = new TypeRef("tutanota", 473)

export function createEncryptTutanotaPropertiesData(values: EncryptTutanotaPropertiesDataParams): EncryptTutanotaPropertiesData {
	return Object.assign(create(typeModels[EncryptTutanotaPropertiesDataTypeRef.typeId], EncryptTutanotaPropertiesDataTypeRef), values)
}

export type EncryptTutanotaPropertiesDataParams = {
	symEncSessionKey: Uint8Array<ArrayBuffer>
	symKeyVersion: NumberString

	properties: Id
}

export type EncryptTutanotaPropertiesData = {
	// == values

	_format: NumberString
	symEncSessionKey: Uint8Array<ArrayBuffer>
	symKeyVersion: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	properties: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<EncryptTutanotaPropertiesData>
	_original: Nullable<EncryptTutanotaPropertiesData>
	isAdapter: false
}
export const DraftRecipientTypeRef: TypeRef<DraftRecipient> = new TypeRef("tutanota", 482)

export function createDraftRecipient(values: DraftRecipientParams): DraftRecipient {
	return Object.assign(create(typeModels[DraftRecipientTypeRef.typeId], DraftRecipientTypeRef), values)
}

export type DraftRecipientParams = {
	name: string
	mailAddress: string
}

export type DraftRecipient = {
	// == values

	_id: Id
	name: string
	mailAddress: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DraftRecipient>
	_original: Nullable<DraftRecipient>
	isAdapter: false
}
export const NewDraftAttachmentTypeRef: TypeRef<NewDraftAttachment> = new TypeRef("tutanota", 486)

export function createNewDraftAttachment(values: NewDraftAttachmentParams): NewDraftAttachment {
	return Object.assign(create(typeModels[NewDraftAttachmentTypeRef.typeId], NewDraftAttachmentTypeRef), values)
}

export type NewDraftAttachmentParams = {
	encFileName: Uint8Array<ArrayBuffer>
	encMimeType: Uint8Array<ArrayBuffer>
	encCid: null | Uint8Array<ArrayBuffer>

	referenceTokens: BlobReferenceTokenWrapper[]
}

export type NewDraftAttachment = {
	// == values

	_id: Id
	encFileName: Uint8Array<ArrayBuffer>
	encMimeType: Uint8Array<ArrayBuffer>
	encCid: null | Uint8Array<ArrayBuffer>

	// == associations

	referenceTokens: BlobReferenceTokenWrapper[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<NewDraftAttachment>
	_original: Nullable<NewDraftAttachment>
	isAdapter: false
}
export const DraftAttachmentTypeRef: TypeRef<DraftAttachment> = new TypeRef("tutanota", 491)

export function createDraftAttachment(values: DraftAttachmentParams): DraftAttachment {
	return Object.assign(create(typeModels[DraftAttachmentTypeRef.typeId], DraftAttachmentTypeRef), values)
}

export type DraftAttachmentParams = {
	ownerEncFileSessionKey: Uint8Array<ArrayBuffer>

	newFile: null | NewDraftAttachment
	existingFile: null | IdTuple
}

export type DraftAttachment = {
	// == values

	_id: Id
	ownerEncFileSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString

	// == associations

	newFile: null | NewDraftAttachment
	existingFile: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DraftAttachment>
	_original: Nullable<DraftAttachment>
	isAdapter: false
}
export const DraftDataTypeRef: TypeRef<DraftData> = new TypeRef("tutanota", 496)

export function createDraftData(values: DraftDataParams): DraftData {
	return Object.assign(create(typeModels[DraftDataTypeRef.typeId], DraftDataTypeRef), values)
}

export type DraftDataParams = {
	subject: string
	bodyText: string
	senderMailAddress: string
	senderName: string
	confidential: boolean
	method: NumberString
	compressedBodyText: null | string

	toRecipients: DraftRecipient[]
	ccRecipients: DraftRecipient[]
	bccRecipients: DraftRecipient[]
	addedAttachments: DraftAttachment[]
	removedAttachments: IdTuple[]
	replyTos: EncryptedMailAddress[]
}

export type DraftData = {
	// == values

	_id: Id
	subject: string
	bodyText: string
	senderMailAddress: string
	senderName: string
	confidential: boolean
	method: NumberString
	compressedBodyText: null | string

	// == associations

	toRecipients: DraftRecipient[]
	ccRecipients: DraftRecipient[]
	bccRecipients: DraftRecipient[]
	addedAttachments: DraftAttachment[]
	removedAttachments: IdTuple[]
	replyTos: EncryptedMailAddress[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DraftData>
	_original: Nullable<DraftData>
	isAdapter: false
}
export const DraftCreateDataTypeRef: TypeRef<DraftCreateData> = new TypeRef("tutanota", 508)

export function createDraftCreateData(values: DraftCreateDataParams): DraftCreateData {
	return Object.assign(create(typeModels[DraftCreateDataTypeRef.typeId], DraftCreateDataTypeRef), values)
}

export type DraftCreateDataParams = {
	previousMessageId: null | string
	conversationType: NumberString

	draftData: DraftData
}

export type DraftCreateData = {
	// == values

	_format: NumberString
	previousMessageId: null | string
	conversationType: NumberString
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	draftData: DraftData

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DraftCreateData>
	_errors: Object
	_original: Nullable<DraftCreateData>
	isAdapter: false
}
export const DraftCreateReturnTypeRef: TypeRef<DraftCreateReturn> = new TypeRef("tutanota", 516)

export function createDraftCreateReturn(values: DraftCreateReturnParams): DraftCreateReturn {
	return Object.assign(create(typeModels[DraftCreateReturnTypeRef.typeId], DraftCreateReturnTypeRef), values)
}

export type DraftCreateReturnParams = {
	draft: IdTuple
}

export type DraftCreateReturn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	draft: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DraftCreateReturn>
	_original: Nullable<DraftCreateReturn>
	isAdapter: false
}
export const DraftUpdateDataTypeRef: TypeRef<DraftUpdateData> = new TypeRef("tutanota", 519)

export function createDraftUpdateData(values: DraftUpdateDataParams): DraftUpdateData {
	return Object.assign(create(typeModels[DraftUpdateDataTypeRef.typeId], DraftUpdateDataTypeRef), values)
}

export type DraftUpdateDataParams = {
	draftData: DraftData
	draft: IdTuple
}

export type DraftUpdateData = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	draftData: DraftData
	draft: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DraftUpdateData>
	_errors: Object
	_original: Nullable<DraftUpdateData>
	isAdapter: false
}
export const DraftUpdateReturnTypeRef: TypeRef<DraftUpdateReturn> = new TypeRef("tutanota", 523)

export function createDraftUpdateReturn(values: DraftUpdateReturnParams): DraftUpdateReturn {
	return Object.assign(create(typeModels[DraftUpdateReturnTypeRef.typeId], DraftUpdateReturnTypeRef), values)
}

export type DraftUpdateReturnParams = {
	attachments: IdTuple[]
}

export type DraftUpdateReturn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	attachments: IdTuple[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DraftUpdateReturn>
	_errors: Object
	_original: Nullable<DraftUpdateReturn>
	isAdapter: false
}
export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", 527)

export function createInternalRecipientKeyData(values: InternalRecipientKeyDataParams): InternalRecipientKeyData {
	return Object.assign(create(typeModels[InternalRecipientKeyDataTypeRef.typeId], InternalRecipientKeyDataTypeRef), values)
}

export type InternalRecipientKeyDataParams = {
	mailAddress: string
	pubEncBucketKey: Uint8Array<ArrayBuffer>
	recipientKeyVersion: NumberString
	protocolVersion: NumberString
	senderKeyVersion: null | NumberString
}

export type InternalRecipientKeyData = {
	// == values

	_id: Id
	mailAddress: string
	pubEncBucketKey: Uint8Array<ArrayBuffer>
	recipientKeyVersion: NumberString
	protocolVersion: NumberString
	senderKeyVersion: null | NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<InternalRecipientKeyData>
	_original: Nullable<InternalRecipientKeyData>
	isAdapter: false
}
export const SecureExternalRecipientKeyDataTypeRef: TypeRef<SecureExternalRecipientKeyData> = new TypeRef("tutanota", 532)

export function createSecureExternalRecipientKeyData(values: SecureExternalRecipientKeyDataParams): SecureExternalRecipientKeyData {
	return Object.assign(create(typeModels[SecureExternalRecipientKeyDataTypeRef.typeId], SecureExternalRecipientKeyDataTypeRef), values)
}

export type SecureExternalRecipientKeyDataParams = {
	mailAddress: string
	passwordVerifier: Uint8Array<ArrayBuffer>
	salt: null | Uint8Array<ArrayBuffer>
	saltHash: null | Uint8Array<ArrayBuffer>
	pwEncCommunicationKey: null | Uint8Array<ArrayBuffer>
	ownerEncBucketKey: Uint8Array<ArrayBuffer>
	kdfVersion: NumberString
	userGroupKeyVersion: NumberString
}

export type SecureExternalRecipientKeyData = {
	// == values

	_id: Id
	mailAddress: string
	passwordVerifier: Uint8Array<ArrayBuffer>
	salt: null | Uint8Array<ArrayBuffer>
	saltHash: null | Uint8Array<ArrayBuffer>
	pwEncCommunicationKey: null | Uint8Array<ArrayBuffer>
	ownerEncBucketKey: Uint8Array<ArrayBuffer>
	kdfVersion: NumberString
	ownerKeyVersion: NumberString
	userGroupKeyVersion: NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SecureExternalRecipientKeyData>
	_original: Nullable<SecureExternalRecipientKeyData>
	isAdapter: false
}
export const AttachmentKeyDataTypeRef: TypeRef<AttachmentKeyData> = new TypeRef("tutanota", 542)

export function createAttachmentKeyData(values: AttachmentKeyDataParams): AttachmentKeyData {
	return Object.assign(create(typeModels[AttachmentKeyDataTypeRef.typeId], AttachmentKeyDataTypeRef), values)
}

export type AttachmentKeyDataParams = {
	bucketEncFileSessionKey: null | Uint8Array<ArrayBuffer>
	fileSessionKey: null | Uint8Array<ArrayBuffer>

	file: IdTuple
}

export type AttachmentKeyData = {
	// == values

	_id: Id
	bucketEncFileSessionKey: null | Uint8Array<ArrayBuffer>
	fileSessionKey: null | Uint8Array<ArrayBuffer>

	// == associations

	file: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<AttachmentKeyData>
	_original: Nullable<AttachmentKeyData>
	isAdapter: false
}
export const SendDraftDataTypeRef: TypeRef<SendDraftData> = new TypeRef("tutanota", 547)

export function createSendDraftData(values: SendDraftDataParams): SendDraftData {
	return Object.assign(create(typeModels[SendDraftDataTypeRef.typeId], SendDraftDataTypeRef), values)
}

export type SendDraftDataParams = {
	language: string
	mailSessionKey: null | Uint8Array<ArrayBuffer>
	bucketEncMailSessionKey: null | Uint8Array<ArrayBuffer>
	senderNameUnencrypted: null | string
	plaintext: boolean
	calendarMethod: boolean
	sessionEncEncryptionAuthStatus: null | Uint8Array<ArrayBuffer>
	sendAt: null | Date
	allowUndo: boolean

	internalRecipientKeyData: InternalRecipientKeyData[]
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[]
	attachmentKeyData: AttachmentKeyData[]
	mail: IdTuple
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[]
	parameters: null | SendDraftParameters
}

export type SendDraftData = {
	// == values

	_format: NumberString
	language: string
	mailSessionKey: null | Uint8Array<ArrayBuffer>
	bucketEncMailSessionKey: null | Uint8Array<ArrayBuffer>
	senderNameUnencrypted: null | string
	plaintext: boolean
	calendarMethod: boolean
	sessionEncEncryptionAuthStatus: null | Uint8Array<ArrayBuffer>
	sendAt: null | Date
	allowUndo: boolean

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	internalRecipientKeyData: InternalRecipientKeyData[]
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[]
	attachmentKeyData: AttachmentKeyData[]
	mail: IdTuple
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[]
	parameters: null | SendDraftParameters

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SendDraftData>
	_original: Nullable<SendDraftData>
	isAdapter: false
}
export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", 557)

export function createSendDraftReturn(values: SendDraftReturnParams): SendDraftReturn {
	return Object.assign(create(typeModels[SendDraftReturnTypeRef.typeId], SendDraftReturnTypeRef), values)
}

export type SendDraftReturnParams = {
	messageId: string
	sentDate: Date

	notifications: NotificationMail[]
	sentMail: IdTuple
	sendJob: null | IdTuple
}

export type SendDraftReturn = {
	// == values

	_format: NumberString
	messageId: string
	sentDate: Date

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	notifications: NotificationMail[]
	sentMail: IdTuple
	sendJob: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SendDraftReturn>
	_original: Nullable<SendDraftReturn>
	isAdapter: false
}
export const ReceiveInfoServiceDataTypeRef: TypeRef<ReceiveInfoServiceData> = new TypeRef("tutanota", 570)

export function createReceiveInfoServiceData(values: ReceiveInfoServiceDataParams): ReceiveInfoServiceData {
	return Object.assign(create(typeModels[ReceiveInfoServiceDataTypeRef.typeId], ReceiveInfoServiceDataTypeRef), values)
}

export type ReceiveInfoServiceDataParams = {
	language: string
}

export type ReceiveInfoServiceData = {
	// == values

	_format: NumberString
	language: string
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ReceiveInfoServiceData>
	_original: Nullable<ReceiveInfoServiceData>
	isAdapter: false
}
export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", 573)

export function createInboxRule(values: InboxRuleParams): InboxRule {
	return Object.assign(create(typeModels[InboxRuleTypeRef.typeId], InboxRuleTypeRef), values)
}

export type InboxRuleParams = {
	type: string
	value: string
	excludeFromSpamFilter: null | boolean

	targetFolder: IdTuple
}

export type InboxRule = {
	// == values

	_id: Id
	type: string
	value: string
	excludeFromSpamFilter: null | boolean

	// == associations

	targetFolder: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<InboxRule>
	_original: Nullable<InboxRule>
	isAdapter: false
}
export const EncryptedMailAddressTypeRef: TypeRef<EncryptedMailAddress> = new TypeRef("tutanota", 612)

export function createEncryptedMailAddress(values: EncryptedMailAddressParams): EncryptedMailAddress {
	return Object.assign(create(typeModels[EncryptedMailAddressTypeRef.typeId], EncryptedMailAddressTypeRef), values)
}

export type EncryptedMailAddressParams = {
	name: string
	address: string
}

export type EncryptedMailAddress = {
	// == values

	_id: Id
	name: string
	address: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<EncryptedMailAddress>
	_original: Nullable<EncryptedMailAddress>
	isAdapter: false
}
export const UserAccountUserDataTypeRef: TypeRef<UserAccountUserData> = new TypeRef("tutanota", 622)

export function createUserAccountUserData(values: UserAccountUserDataParams): UserAccountUserData {
	return Object.assign(create(typeModels[UserAccountUserDataTypeRef.typeId], UserAccountUserDataTypeRef), values)
}

export type UserAccountUserDataParams = {
	mailAddress: string
	encryptedName: Uint8Array<ArrayBuffer>
	salt: Uint8Array<ArrayBuffer>
	verifier: Uint8Array<ArrayBuffer>
	pwEncUserGroupKey: Uint8Array<ArrayBuffer>
	userEncCustomerGroupKey: Uint8Array<ArrayBuffer>
	userEncMailGroupKey: Uint8Array<ArrayBuffer>
	userEncContactGroupKey: Uint8Array<ArrayBuffer>
	userEncFileGroupKey: Uint8Array<ArrayBuffer>
	userEncEntropy: Uint8Array<ArrayBuffer>
	userEncTutanotaPropertiesSessionKey: Uint8Array<ArrayBuffer>
	mailEncMailBoxSessionKey: Uint8Array<ArrayBuffer>
	contactEncContactListSessionKey: Uint8Array<ArrayBuffer>
	fileEncFileSystemSessionKey: Uint8Array<ArrayBuffer>
	customerEncMailGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	customerEncContactGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	customerEncFileGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	userEncRecoverCode: Uint8Array<ArrayBuffer>
	recoverCodeEncUserGroupKey: Uint8Array<ArrayBuffer>
	recoverCodeVerifier: Uint8Array<ArrayBuffer>
	kdfVersion: NumberString
	customerKeyVersion: NumberString
}

export type UserAccountUserData = {
	// == values

	_id: Id
	mailAddress: string
	encryptedName: Uint8Array<ArrayBuffer>
	salt: Uint8Array<ArrayBuffer>
	verifier: Uint8Array<ArrayBuffer>
	pwEncUserGroupKey: Uint8Array<ArrayBuffer>
	userEncCustomerGroupKey: Uint8Array<ArrayBuffer>
	userEncMailGroupKey: Uint8Array<ArrayBuffer>
	userEncContactGroupKey: Uint8Array<ArrayBuffer>
	userEncFileGroupKey: Uint8Array<ArrayBuffer>
	userEncEntropy: Uint8Array<ArrayBuffer>
	userEncTutanotaPropertiesSessionKey: Uint8Array<ArrayBuffer>
	mailEncMailBoxSessionKey: Uint8Array<ArrayBuffer>
	contactEncContactListSessionKey: Uint8Array<ArrayBuffer>
	fileEncFileSystemSessionKey: Uint8Array<ArrayBuffer>
	customerEncMailGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	customerEncContactGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	customerEncFileGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	userEncRecoverCode: Uint8Array<ArrayBuffer>
	recoverCodeEncUserGroupKey: Uint8Array<ArrayBuffer>
	recoverCodeVerifier: Uint8Array<ArrayBuffer>
	kdfVersion: NumberString
	customerKeyVersion: NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UserAccountUserData>
	_original: Nullable<UserAccountUserData>
	isAdapter: false
}
export const InternalGroupDataTypeRef: TypeRef<InternalGroupData> = new TypeRef("tutanota", 642)

export function createInternalGroupData(values: InternalGroupDataParams): InternalGroupData {
	return Object.assign(create(typeModels[InternalGroupDataTypeRef.typeId], InternalGroupDataTypeRef), values)
}

export type InternalGroupDataParams = {
	pubRsaKey: null | Uint8Array<ArrayBuffer>
	groupEncPrivRsaKey: null | Uint8Array<ArrayBuffer>
	adminEncGroupKey: Uint8Array<ArrayBuffer>
	ownerEncGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	pubEccKey: null | Uint8Array<ArrayBuffer>
	groupEncPrivEccKey: null | Uint8Array<ArrayBuffer>
	pubKyberKey: null | Uint8Array<ArrayBuffer>
	groupEncPrivKyberKey: null | Uint8Array<ArrayBuffer>
	adminKeyVersion: NumberString

	adminGroup: null | Id
}

export type InternalGroupData = {
	// == values

	_id: Id
	pubRsaKey: null | Uint8Array<ArrayBuffer>
	groupEncPrivRsaKey: null | Uint8Array<ArrayBuffer>
	adminEncGroupKey: Uint8Array<ArrayBuffer>
	ownerEncGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	pubEccKey: null | Uint8Array<ArrayBuffer>
	groupEncPrivEccKey: null | Uint8Array<ArrayBuffer>
	pubKyberKey: null | Uint8Array<ArrayBuffer>
	groupEncPrivKyberKey: null | Uint8Array<ArrayBuffer>
	adminKeyVersion: NumberString
	ownerKeyVersion: NumberString

	// == associations

	adminGroup: null | Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<InternalGroupData>
	_original: Nullable<InternalGroupData>
	isAdapter: false
}
export const CustomerAccountCreateDataTypeRef: TypeRef<CustomerAccountCreateData> = new TypeRef("tutanota", 648)

export function createCustomerAccountCreateData(values: CustomerAccountCreateDataParams): CustomerAccountCreateData {
	return Object.assign(create(typeModels[CustomerAccountCreateDataTypeRef.typeId], CustomerAccountCreateDataTypeRef), values)
}

export type CustomerAccountCreateDataParams = {
	authToken: string
	date: null | Date
	lang: string
	userEncAdminGroupKey: Uint8Array<ArrayBuffer>
	userEncAccountGroupKey: Uint8Array<ArrayBuffer>
	adminEncAccountingInfoSessionKey: Uint8Array<ArrayBuffer>
	systemAdminPubEncAccountingInfoSessionKey: Uint8Array<ArrayBuffer>
	adminEncCustomerServerPropertiesSessionKey: Uint8Array<ArrayBuffer>
	code: string
	systemAdminPublicProtocolVersion: NumberString
	accountGroupKeyVersion: NumberString
	systemAdminPubKeyVersion: NumberString
	app: NumberString

	userData: UserAccountUserData
	userGroupData: InternalGroupData
	adminGroupData: InternalGroupData
	customerGroupData: InternalGroupData
}

export type CustomerAccountCreateData = {
	// == values

	_format: NumberString
	authToken: string
	date: null | Date
	lang: string
	userEncAdminGroupKey: Uint8Array<ArrayBuffer>
	userEncAccountGroupKey: Uint8Array<ArrayBuffer>
	adminEncAccountingInfoSessionKey: Uint8Array<ArrayBuffer>
	systemAdminPubEncAccountingInfoSessionKey: Uint8Array<ArrayBuffer>
	adminEncCustomerServerPropertiesSessionKey: Uint8Array<ArrayBuffer>
	code: string
	systemAdminPublicProtocolVersion: NumberString
	accountGroupKeyVersion: NumberString
	systemAdminPubKeyVersion: NumberString
	app: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	userData: UserAccountUserData
	userGroupData: InternalGroupData
	adminGroupData: InternalGroupData
	customerGroupData: InternalGroupData

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CustomerAccountCreateData>
	_original: Nullable<CustomerAccountCreateData>
	isAdapter: false
}
export const UserAccountCreateDataTypeRef: TypeRef<UserAccountCreateData> = new TypeRef("tutanota", 663)

export function createUserAccountCreateData(values: UserAccountCreateDataParams): UserAccountCreateData {
	return Object.assign(create(typeModels[UserAccountCreateDataTypeRef.typeId], UserAccountCreateDataTypeRef), values)
}

export type UserAccountCreateDataParams = {
	date: null | Date

	userData: UserAccountUserData
	userGroupData: InternalGroupData
}

export type UserAccountCreateData = {
	// == values

	_format: NumberString
	date: null | Date

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	userData: UserAccountUserData
	userGroupData: InternalGroupData

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UserAccountCreateData>
	_original: Nullable<UserAccountCreateData>
	isAdapter: false
}
export const MailboxServerPropertiesTypeRef: TypeRef<MailboxServerProperties> = new TypeRef("tutanota", 677)

export function createMailboxServerProperties(values: MailboxServerPropertiesParams): MailboxServerProperties {
	return Object.assign(create(typeModels[MailboxServerPropertiesTypeRef.typeId], MailboxServerPropertiesTypeRef), values)
}

export type MailboxServerPropertiesParams = {}

export type MailboxServerProperties = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailboxServerProperties>
	_original: Nullable<MailboxServerProperties>
	isAdapter: false
}
export const MailboxGroupRootTypeRef: TypeRef<MailboxGroupRoot> = new TypeRef("tutanota", 693)

export function createMailboxGroupRoot(values: MailboxGroupRootParams): MailboxGroupRoot {
	return Object.assign(create(typeModels[MailboxGroupRootTypeRef.typeId], MailboxGroupRootTypeRef), values)
}

export type MailboxGroupRootParams = {
	mailbox: Id
	serverProperties: Id
	calendarEventUpdates: null | CalendarEventUpdateList
	outOfOfficeNotification: null | Id
	outOfOfficeNotificationRecipientList: null | OutOfOfficeNotificationRecipientList
	mailboxProperties: null | Id
}

export type MailboxGroupRoot = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	mailbox: Id
	serverProperties: Id
	calendarEventUpdates: null | CalendarEventUpdateList
	outOfOfficeNotification: null | Id
	outOfOfficeNotificationRecipientList: null | OutOfOfficeNotificationRecipientList
	mailboxProperties: null | Id

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailboxGroupRoot>
	_original: Nullable<MailboxGroupRoot>
	isAdapter: false
}
export const CreateMailGroupDataTypeRef: TypeRef<CreateMailGroupData> = new TypeRef("tutanota", 707)

export function createCreateMailGroupData(values: CreateMailGroupDataParams): CreateMailGroupData {
	return Object.assign(create(typeModels[CreateMailGroupDataTypeRef.typeId], CreateMailGroupDataTypeRef), values)
}

export type CreateMailGroupDataParams = {
	mailAddress: string
	encryptedName: Uint8Array<ArrayBuffer>
	mailEncMailboxSessionKey: Uint8Array<ArrayBuffer>

	groupData: InternalGroupData
}

export type CreateMailGroupData = {
	// == values

	_format: NumberString
	mailAddress: string
	encryptedName: Uint8Array<ArrayBuffer>
	mailEncMailboxSessionKey: Uint8Array<ArrayBuffer>

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	groupData: InternalGroupData

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CreateMailGroupData>
	_original: Nullable<CreateMailGroupData>
	isAdapter: false
}
export const DeleteGroupDataTypeRef: TypeRef<DeleteGroupData> = new TypeRef("tutanota", 713)

export function createDeleteGroupData(values: DeleteGroupDataParams): DeleteGroupData {
	return Object.assign(create(typeModels[DeleteGroupDataTypeRef.typeId], DeleteGroupDataTypeRef), values)
}

export type DeleteGroupDataParams = {
	restore: boolean

	group: Id
}

export type DeleteGroupData = {
	// == values

	_format: NumberString
	restore: boolean

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	group: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DeleteGroupData>
	_original: Nullable<DeleteGroupData>
	isAdapter: false
}
export const BirthdayTypeRef: TypeRef<Birthday> = new TypeRef("tutanota", 844)

export function createBirthday(values: BirthdayParams): Birthday {
	return Object.assign(create(typeModels[BirthdayTypeRef.typeId], BirthdayTypeRef), values)
}

export type BirthdayParams = {
	day: NumberString
	month: NumberString
	year: null | NumberString
}

export type Birthday = {
	// == values

	_id: Id
	day: NumberString
	month: NumberString
	year: null | NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<Birthday>
	_original: Nullable<Birthday>
	isAdapter: false
}
export const PhotosRefTypeRef: TypeRef<PhotosRef> = new TypeRef("tutanota", 853)

export function createPhotosRef(values: PhotosRefParams): PhotosRef {
	return Object.assign(create(typeModels[PhotosRefTypeRef.typeId], PhotosRefTypeRef), values)
}

export type PhotosRefParams = {
	files: Id
}

export type PhotosRef = {
	// == values

	_id: Id

	// == associations

	files: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<PhotosRef>
	_original: Nullable<PhotosRef>
	isAdapter: false
}
export const ListUnsubscribeDataTypeRef: TypeRef<ListUnsubscribeData> = new TypeRef("tutanota", 867)

export function createListUnsubscribeData(values: ListUnsubscribeDataParams): ListUnsubscribeData {
	return Object.assign(create(typeModels[ListUnsubscribeDataTypeRef.typeId], ListUnsubscribeDataTypeRef), values)
}

export type ListUnsubscribeDataParams = {
	postLink: string

	mail: IdTuple
}

export type ListUnsubscribeData = {
	// == values

	_format: NumberString
	postLink: string

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mail: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ListUnsubscribeData>
	_original: Nullable<ListUnsubscribeData>
	isAdapter: false
}
export const CalendarRepeatRuleTypeRef: TypeRef<CalendarRepeatRule> = new TypeRef("tutanota", 926)

export function createCalendarRepeatRule(values: CalendarRepeatRuleParams): CalendarRepeatRule {
	return Object.assign(create(typeModels[CalendarRepeatRuleTypeRef.typeId], CalendarRepeatRuleTypeRef), values)
}

export type CalendarRepeatRuleParams = {
	frequency: NumberString
	endType: NumberString
	endValue: null | NumberString
	interval: NumberString
	timeZone: string

	excludedDates: DateWrapper[]
	advancedRules: AdvancedRepeatRule[]
}

export type CalendarRepeatRule = {
	// == values

	_id: Id
	frequency: NumberString
	endType: NumberString
	endValue: null | NumberString
	interval: NumberString
	timeZone: string

	// == associations

	excludedDates: DateWrapper[]
	advancedRules: AdvancedRepeatRule[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarRepeatRule>
	_original: Nullable<CalendarRepeatRule>
	isAdapter: false
}
export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", 933)

export function createCalendarEvent(values: CalendarEventParams): CalendarEvent {
	return Object.assign(create(typeModels[CalendarEventTypeRef.typeId], CalendarEventTypeRef), values)
}

export type CalendarEventParams = {
	summary: string
	description: string
	startTime: Date
	endTime: Date
	location: string
	uid: null | string
	hashedUid: null | Uint8Array<ArrayBuffer>
	sequence: NumberString
	invitedConfidentially: null | boolean
	recurrenceId: null | Date
	sender: null | string
	pendingInvitation: null | boolean
	startTimeZone: null | string
	endTimeZone: null | string

	repeatRule: null | CalendarRepeatRule
	alarmInfos: IdTuple[]
	attendees: CalendarEventAttendee[]
	organizer: null | EncryptedMailAddress
}

export type CalendarEvent = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	summary: string
	description: string
	startTime: Date
	endTime: Date
	location: string
	uid: null | string
	hashedUid: null | Uint8Array<ArrayBuffer>
	sequence: NumberString
	invitedConfidentially: null | boolean
	recurrenceId: null | Date
	_ownerKeyVersion: null | NumberString
	sender: null | string
	pendingInvitation: null | boolean
	_kdfNonce: null | Uint8Array<ArrayBuffer>
	startTimeZone: null | string
	endTimeZone: null | string

	// == associations

	repeatRule: null | CalendarRepeatRule
	alarmInfos: IdTuple[]
	attendees: CalendarEventAttendee[]
	organizer: null | EncryptedMailAddress

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarEvent>
	_errors: Object
	_original: Nullable<CalendarEvent>
	isAdapter: false
}
export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", 947)

export function createCalendarGroupRoot(values: CalendarGroupRootParams): CalendarGroupRoot {
	return Object.assign(create(typeModels[CalendarGroupRootTypeRef.typeId], CalendarGroupRootTypeRef), values)
}

export type CalendarGroupRootParams = {
	shortEvents: Id
	longEvents: Id
	index: null | CalendarEventIndexRef
}

export type CalendarGroupRoot = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	shortEvents: Id
	longEvents: Id
	index: null | CalendarEventIndexRef

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarGroupRoot>
	_errors: Object
	_original: Nullable<CalendarGroupRoot>
	isAdapter: false
}
export const UserAreaGroupDataTypeRef: TypeRef<UserAreaGroupData> = new TypeRef("tutanota", 956)

export function createUserAreaGroupData(values: UserAreaGroupDataParams): UserAreaGroupData {
	return Object.assign(create(typeModels[UserAreaGroupDataTypeRef.typeId], UserAreaGroupDataTypeRef), values)
}

export type UserAreaGroupDataParams = {
	groupEncGroupRootSessionKey: Uint8Array<ArrayBuffer>
	adminEncGroupKey: null | Uint8Array<ArrayBuffer>
	customerEncGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	userEncGroupKey: Uint8Array<ArrayBuffer>
	groupInfoEncName: Uint8Array<ArrayBuffer>
	adminKeyVersion: null | NumberString
	customerKeyVersion: NumberString
	userKeyVersion: NumberString

	adminGroup: null | Id
}

export type UserAreaGroupData = {
	// == values

	_id: Id
	groupEncGroupRootSessionKey: Uint8Array<ArrayBuffer>
	adminEncGroupKey: null | Uint8Array<ArrayBuffer>
	customerEncGroupInfoSessionKey: Uint8Array<ArrayBuffer>
	userEncGroupKey: Uint8Array<ArrayBuffer>
	groupInfoEncName: Uint8Array<ArrayBuffer>
	adminKeyVersion: null | NumberString
	customerKeyVersion: NumberString
	userKeyVersion: NumberString

	// == associations

	adminGroup: null | Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UserAreaGroupData>
	_original: Nullable<UserAreaGroupData>
	isAdapter: false
}
export const UserAreaGroupPostDataTypeRef: TypeRef<UserAreaGroupPostData> = new TypeRef("tutanota", 964)

export function createUserAreaGroupPostData(values: UserAreaGroupPostDataParams): UserAreaGroupPostData {
	return Object.assign(create(typeModels[UserAreaGroupPostDataTypeRef.typeId], UserAreaGroupPostDataTypeRef), values)
}

export type UserAreaGroupPostDataParams = {
	groupData: UserAreaGroupData
}

export type UserAreaGroupPostData = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	groupData: UserAreaGroupData

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UserAreaGroupPostData>
	_original: Nullable<UserAreaGroupPostData>
	isAdapter: false
}
export const GroupSettingsTypeRef: TypeRef<GroupSettings> = new TypeRef("tutanota", 968)

export function createGroupSettings(values: GroupSettingsParams): GroupSettings {
	return Object.assign(create(typeModels[GroupSettingsTypeRef.typeId], GroupSettingsTypeRef), values)
}

export type GroupSettingsParams = {
	color: string
	name: null | string
	sourceUrl: null | string

	group: Id
	defaultAlarmsList: DefaultAlarmInfo[]
}

export type GroupSettings = {
	// == values

	_id: Id
	color: string
	name: null | string
	sourceUrl: null | string

	// == associations

	group: Id
	defaultAlarmsList: DefaultAlarmInfo[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<GroupSettings>
	_original: Nullable<GroupSettings>
	isAdapter: false
}
export const UserSettingsGroupRootTypeRef: TypeRef<UserSettingsGroupRoot> = new TypeRef("tutanota", 972)

export function createUserSettingsGroupRoot(values: UserSettingsGroupRootParams): UserSettingsGroupRoot {
	return Object.assign(create(typeModels[UserSettingsGroupRootTypeRef.typeId], UserSettingsGroupRootTypeRef), values)
}

export type UserSettingsGroupRootParams = {
	timeFormat: NumberString
	startOfTheWeek: NumberString
	usageDataOptedIn: null | boolean
	birthdayCalendarColor: null | string

	groupSettings: GroupSettings[]
}

export type UserSettingsGroupRoot = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	timeFormat: NumberString
	startOfTheWeek: NumberString
	usageDataOptedIn: null | boolean
	_ownerKeyVersion: null | NumberString
	birthdayCalendarColor: null | string
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	groupSettings: GroupSettings[]

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UserSettingsGroupRoot>
	_errors: Object
	_original: Nullable<UserSettingsGroupRoot>
	isAdapter: false
}
export const CalendarDeleteInTypeRef: TypeRef<CalendarDeleteIn> = new TypeRef("tutanota", 982)

export function createCalendarDeleteIn(values: CalendarDeleteInParams): CalendarDeleteIn {
	return Object.assign(create(typeModels[CalendarDeleteInTypeRef.typeId], CalendarDeleteInTypeRef), values)
}

export type CalendarDeleteInParams = {
	groupRootId: Id
}

export type CalendarDeleteIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	groupRootId: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarDeleteIn>
	_original: Nullable<CalendarDeleteIn>
	isAdapter: false
}
export const CreateGroupPostReturnTypeRef: TypeRef<CreateGroupPostReturn> = new TypeRef("tutanota", 985)

export function createCreateGroupPostReturn(values: CreateGroupPostReturnParams): CreateGroupPostReturn {
	return Object.assign(create(typeModels[CreateGroupPostReturnTypeRef.typeId], CreateGroupPostReturnTypeRef), values)
}

export type CreateGroupPostReturnParams = {
	group: Id
}

export type CreateGroupPostReturn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	group: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CreateGroupPostReturn>
	_errors: Object
	_original: Nullable<CreateGroupPostReturn>
	isAdapter: false
}
export const SharedGroupDataTypeRef: TypeRef<SharedGroupData> = new TypeRef("tutanota", 992)

export function createSharedGroupData(values: SharedGroupDataParams): SharedGroupData {
	return Object.assign(create(typeModels[SharedGroupDataTypeRef.typeId], SharedGroupDataTypeRef), values)
}

export type SharedGroupDataParams = {
	capability: NumberString
	sessionEncSharedGroupKey: Uint8Array<ArrayBuffer>
	sessionEncSharedGroupName: Uint8Array<ArrayBuffer>
	sessionEncInviterName: Uint8Array<ArrayBuffer>
	bucketEncInvitationSessionKey: Uint8Array<ArrayBuffer>
	sharedGroupEncInviterGroupInfoKey: Uint8Array<ArrayBuffer>
	sharedGroupEncSharedGroupInfoKey: Uint8Array<ArrayBuffer>
	sharedGroup: Id
	sharedGroupKeyVersion: NumberString
}

export type SharedGroupData = {
	// == values

	_id: Id
	capability: NumberString
	sessionEncSharedGroupKey: Uint8Array<ArrayBuffer>
	sessionEncSharedGroupName: Uint8Array<ArrayBuffer>
	sessionEncInviterName: Uint8Array<ArrayBuffer>
	bucketEncInvitationSessionKey: Uint8Array<ArrayBuffer>
	sharedGroupEncInviterGroupInfoKey: Uint8Array<ArrayBuffer>
	sharedGroupEncSharedGroupInfoKey: Uint8Array<ArrayBuffer>
	sharedGroup: Id
	sharedGroupKeyVersion: NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SharedGroupData>
	_original: Nullable<SharedGroupData>
	isAdapter: false
}
export const GroupInvitationPostDataTypeRef: TypeRef<GroupInvitationPostData> = new TypeRef("tutanota", 1002)

export function createGroupInvitationPostData(values: GroupInvitationPostDataParams): GroupInvitationPostData {
	return Object.assign(create(typeModels[GroupInvitationPostDataTypeRef.typeId], GroupInvitationPostDataTypeRef), values)
}

export type GroupInvitationPostDataParams = {
	sharedGroupData: SharedGroupData
	internalKeyData: InternalRecipientKeyData[]
}

export type GroupInvitationPostData = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	sharedGroupData: SharedGroupData
	internalKeyData: InternalRecipientKeyData[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<GroupInvitationPostData>
	_original: Nullable<GroupInvitationPostData>
	isAdapter: false
}
export const GroupInvitationPostReturnTypeRef: TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", 1006)

export function createGroupInvitationPostReturn(values: GroupInvitationPostReturnParams): GroupInvitationPostReturn {
	return Object.assign(create(typeModels[GroupInvitationPostReturnTypeRef.typeId], GroupInvitationPostReturnTypeRef), values)
}

export type GroupInvitationPostReturnParams = {
	existingMailAddresses: MailAddress[]
	invalidMailAddresses: MailAddress[]
	invitedMailAddresses: MailAddress[]
}

export type GroupInvitationPostReturn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	existingMailAddresses: MailAddress[]
	invalidMailAddresses: MailAddress[]
	invitedMailAddresses: MailAddress[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<GroupInvitationPostReturn>
	_original: Nullable<GroupInvitationPostReturn>
	isAdapter: false
}
export const GroupInvitationPutDataTypeRef: TypeRef<GroupInvitationPutData> = new TypeRef("tutanota", 1011)

export function createGroupInvitationPutData(values: GroupInvitationPutDataParams): GroupInvitationPutData {
	return Object.assign(create(typeModels[GroupInvitationPutDataTypeRef.typeId], GroupInvitationPutDataTypeRef), values)
}

export type GroupInvitationPutDataParams = {
	userGroupEncGroupKey: Uint8Array<ArrayBuffer>
	sharedGroupEncInviteeGroupInfoKey: Uint8Array<ArrayBuffer>
	userGroupKeyVersion: NumberString
	sharedGroupKeyVersion: NumberString

	receivedInvitation: IdTuple
}

export type GroupInvitationPutData = {
	// == values

	_format: NumberString
	userGroupEncGroupKey: Uint8Array<ArrayBuffer>
	sharedGroupEncInviteeGroupInfoKey: Uint8Array<ArrayBuffer>
	userGroupKeyVersion: NumberString
	sharedGroupKeyVersion: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	receivedInvitation: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<GroupInvitationPutData>
	_original: Nullable<GroupInvitationPutData>
	isAdapter: false
}
export const GroupInvitationDeleteDataTypeRef: TypeRef<GroupInvitationDeleteData> = new TypeRef("tutanota", 1016)

export function createGroupInvitationDeleteData(values: GroupInvitationDeleteDataParams): GroupInvitationDeleteData {
	return Object.assign(create(typeModels[GroupInvitationDeleteDataTypeRef.typeId], GroupInvitationDeleteDataTypeRef), values)
}

export type GroupInvitationDeleteDataParams = {
	receivedInvitation: IdTuple
}

export type GroupInvitationDeleteData = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	receivedInvitation: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<GroupInvitationDeleteData>
	_original: Nullable<GroupInvitationDeleteData>
	isAdapter: false
}
export const ReportedMailFieldMarkerTypeRef: TypeRef<ReportedMailFieldMarker> = new TypeRef("tutanota", 1023)

export function createReportedMailFieldMarker(values: ReportedMailFieldMarkerParams): ReportedMailFieldMarker {
	return Object.assign(create(typeModels[ReportedMailFieldMarkerTypeRef.typeId], ReportedMailFieldMarkerTypeRef), values)
}

export type ReportedMailFieldMarkerParams = {
	marker: string
	status: NumberString
}

export type ReportedMailFieldMarker = {
	// == values

	_id: Id
	marker: string
	status: NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ReportedMailFieldMarker>
	_original: Nullable<ReportedMailFieldMarker>
	isAdapter: false
}
export const PhishingMarkerWebsocketDataTypeRef: TypeRef<PhishingMarkerWebsocketData> = new TypeRef("tutanota", 1034)

export function createPhishingMarkerWebsocketData(values: PhishingMarkerWebsocketDataParams): PhishingMarkerWebsocketData {
	return Object.assign(create(typeModels[PhishingMarkerWebsocketDataTypeRef.typeId], PhishingMarkerWebsocketDataTypeRef), values)
}

export type PhishingMarkerWebsocketDataParams = {
	lastId: Id
	applicationVersionSum: NumberString
	applicationTypesHash: string

	markers: ReportedMailFieldMarker[]
}

export type PhishingMarkerWebsocketData = {
	// == values

	_format: NumberString
	lastId: Id
	applicationVersionSum: NumberString
	applicationTypesHash: string

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	markers: ReportedMailFieldMarker[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<PhishingMarkerWebsocketData>
	_original: Nullable<PhishingMarkerWebsocketData>
	isAdapter: false
}
export const ReportMailPostDataTypeRef: TypeRef<ReportMailPostData> = new TypeRef("tutanota", 1066)

export function createReportMailPostData(values: ReportMailPostDataParams): ReportMailPostData {
	return Object.assign(create(typeModels[ReportMailPostDataTypeRef.typeId], ReportMailPostDataTypeRef), values)
}

export type ReportMailPostDataParams = {
	mailSessionKey: Uint8Array<ArrayBuffer>
	reportType: NumberString

	mailId: IdTuple
}

export type ReportMailPostData = {
	// == values

	_format: NumberString
	mailSessionKey: Uint8Array<ArrayBuffer>
	reportType: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mailId: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ReportMailPostData>
	_original: Nullable<ReportMailPostData>
	isAdapter: false
}
export const CalendarEventAttendeeTypeRef: TypeRef<CalendarEventAttendee> = new TypeRef("tutanota", 1084)

export function createCalendarEventAttendee(values: CalendarEventAttendeeParams): CalendarEventAttendee {
	return Object.assign(create(typeModels[CalendarEventAttendeeTypeRef.typeId], CalendarEventAttendeeTypeRef), values)
}

export type CalendarEventAttendeeParams = {
	status: NumberString

	address: EncryptedMailAddress
}

export type CalendarEventAttendee = {
	// == values

	_id: Id
	status: NumberString

	// == associations

	address: EncryptedMailAddress

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarEventAttendee>
	_original: Nullable<CalendarEventAttendee>
	isAdapter: false
}
export const CalendarEventUidIndexTypeRef: TypeRef<CalendarEventUidIndex> = new TypeRef("tutanota", 1093)

export function createCalendarEventUidIndex(values: CalendarEventUidIndexParams): CalendarEventUidIndex {
	return Object.assign(create(typeModels[CalendarEventUidIndexTypeRef.typeId], CalendarEventUidIndexTypeRef), values)
}

export type CalendarEventUidIndexParams = {
	progenitor: null | IdTuple
	alteredInstances: IdTuple[]
}

export type CalendarEventUidIndex = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	progenitor: null | IdTuple
	alteredInstances: IdTuple[]

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarEventUidIndex>
	_original: Nullable<CalendarEventUidIndex>
	isAdapter: false
}
export const CalendarEventIndexRefTypeRef: TypeRef<CalendarEventIndexRef> = new TypeRef("tutanota", 1100)

export function createCalendarEventIndexRef(values: CalendarEventIndexRefParams): CalendarEventIndexRef {
	return Object.assign(create(typeModels[CalendarEventIndexRefTypeRef.typeId], CalendarEventIndexRefTypeRef), values)
}

export type CalendarEventIndexRefParams = {
	list: Id
}

export type CalendarEventIndexRef = {
	// == values

	_id: Id

	// == associations

	list: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarEventIndexRef>
	_original: Nullable<CalendarEventIndexRef>
	isAdapter: false
}
export const CalendarEventUpdateTypeRef: TypeRef<CalendarEventUpdate> = new TypeRef("tutanota", 1104)

export function createCalendarEventUpdate(values: CalendarEventUpdateParams): CalendarEventUpdate {
	return Object.assign(create(typeModels[CalendarEventUpdateTypeRef.typeId], CalendarEventUpdateTypeRef), values)
}

export type CalendarEventUpdateParams = {
	sender: string

	file: IdTuple
}

export type CalendarEventUpdate = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	sender: string
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	file: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarEventUpdate>
	_errors: Object
	_original: Nullable<CalendarEventUpdate>
	isAdapter: false
}
export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", 1113)

export function createCalendarEventUpdateList(values: CalendarEventUpdateListParams): CalendarEventUpdateList {
	return Object.assign(create(typeModels[CalendarEventUpdateListTypeRef.typeId], CalendarEventUpdateListTypeRef), values)
}

export type CalendarEventUpdateListParams = {
	list: Id
}

export type CalendarEventUpdateList = {
	// == values

	_id: Id

	// == associations

	list: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<CalendarEventUpdateList>
	_original: Nullable<CalendarEventUpdateList>
	isAdapter: false
}
export const EntropyDataTypeRef: TypeRef<EntropyData> = new TypeRef("tutanota", 1122)

export function createEntropyData(values: EntropyDataParams): EntropyData {
	return Object.assign(create(typeModels[EntropyDataTypeRef.typeId], EntropyDataTypeRef), values)
}

export type EntropyDataParams = {
	userEncEntropy: Uint8Array<ArrayBuffer>
	userKeyVersion: NumberString
}

export type EntropyData = {
	// == values

	_format: NumberString
	userEncEntropy: Uint8Array<ArrayBuffer>
	userKeyVersion: NumberString
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<EntropyData>
	_original: Nullable<EntropyData>
	isAdapter: false
}
export const OutOfOfficeNotificationMessageTypeRef: TypeRef<OutOfOfficeNotificationMessage> = new TypeRef("tutanota", 1126)

export function createOutOfOfficeNotificationMessage(values: OutOfOfficeNotificationMessageParams): OutOfOfficeNotificationMessage {
	return Object.assign(create(typeModels[OutOfOfficeNotificationMessageTypeRef.typeId], OutOfOfficeNotificationMessageTypeRef), values)
}

export type OutOfOfficeNotificationMessageParams = {
	subject: string
	message: string
	type: NumberString
}

export type OutOfOfficeNotificationMessage = {
	// == values

	_id: Id
	subject: string
	message: string
	type: NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<OutOfOfficeNotificationMessage>
	_original: Nullable<OutOfOfficeNotificationMessage>
	isAdapter: false
}
export const OutOfOfficeNotificationTypeRef: TypeRef<OutOfOfficeNotification> = new TypeRef("tutanota", 1131)

export function createOutOfOfficeNotification(values: OutOfOfficeNotificationParams): OutOfOfficeNotification {
	return Object.assign(create(typeModels[OutOfOfficeNotificationTypeRef.typeId], OutOfOfficeNotificationTypeRef), values)
}

export type OutOfOfficeNotificationParams = {
	enabled: boolean
	startDate: null | Date
	endDate: null | Date

	notifications: OutOfOfficeNotificationMessage[]
}

export type OutOfOfficeNotification = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	enabled: boolean
	startDate: null | Date
	endDate: null | Date

	// == associations

	notifications: OutOfOfficeNotificationMessage[]

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<OutOfOfficeNotification>
	_original: Nullable<OutOfOfficeNotification>
	isAdapter: false
}
export const OutOfOfficeNotificationRecipientTypeRef: TypeRef<OutOfOfficeNotificationRecipient> = new TypeRef("tutanota", 1141)

export function createOutOfOfficeNotificationRecipient(values: OutOfOfficeNotificationRecipientParams): OutOfOfficeNotificationRecipient {
	return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientTypeRef.typeId], OutOfOfficeNotificationRecipientTypeRef), values)
}

export type OutOfOfficeNotificationRecipientParams = {}

export type OutOfOfficeNotificationRecipient = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<OutOfOfficeNotificationRecipient>
	_original: Nullable<OutOfOfficeNotificationRecipient>
	isAdapter: false
}
export const OutOfOfficeNotificationRecipientListTypeRef: TypeRef<OutOfOfficeNotificationRecipientList> = new TypeRef("tutanota", 1147)

export function createOutOfOfficeNotificationRecipientList(values: OutOfOfficeNotificationRecipientListParams): OutOfOfficeNotificationRecipientList {
	return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientListTypeRef.typeId], OutOfOfficeNotificationRecipientListTypeRef), values)
}

export type OutOfOfficeNotificationRecipientListParams = {
	list: Id
}

export type OutOfOfficeNotificationRecipientList = {
	// == values

	_id: Id

	// == associations

	list: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<OutOfOfficeNotificationRecipientList>
	_original: Nullable<OutOfOfficeNotificationRecipientList>
	isAdapter: false
}
export const EmailTemplateContentTypeRef: TypeRef<EmailTemplateContent> = new TypeRef("tutanota", 1154)

export function createEmailTemplateContent(values: EmailTemplateContentParams): EmailTemplateContent {
	return Object.assign(create(typeModels[EmailTemplateContentTypeRef.typeId], EmailTemplateContentTypeRef), values)
}

export type EmailTemplateContentParams = {
	text: string
	languageCode: string
}

export type EmailTemplateContent = {
	// == values

	_id: Id
	text: string
	languageCode: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<EmailTemplateContent>
	_original: Nullable<EmailTemplateContent>
	isAdapter: false
}
export const EmailTemplateTypeRef: TypeRef<EmailTemplate> = new TypeRef("tutanota", 1158)

export function createEmailTemplate(values: EmailTemplateParams): EmailTemplate {
	return Object.assign(create(typeModels[EmailTemplateTypeRef.typeId], EmailTemplateTypeRef), values)
}

export type EmailTemplateParams = {
	title: string
	tag: string

	contents: EmailTemplateContent[]
}

export type EmailTemplate = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	title: string
	tag: string
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	contents: EmailTemplateContent[]

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<EmailTemplate>
	_errors: Object
	_original: Nullable<EmailTemplate>
	isAdapter: false
}
export const KnowledgeBaseEntryKeywordTypeRef: TypeRef<KnowledgeBaseEntryKeyword> = new TypeRef("tutanota", 1168)

export function createKnowledgeBaseEntryKeyword(values: KnowledgeBaseEntryKeywordParams): KnowledgeBaseEntryKeyword {
	return Object.assign(create(typeModels[KnowledgeBaseEntryKeywordTypeRef.typeId], KnowledgeBaseEntryKeywordTypeRef), values)
}

export type KnowledgeBaseEntryKeywordParams = {
	keyword: string
}

export type KnowledgeBaseEntryKeyword = {
	// == values

	_id: Id
	keyword: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<KnowledgeBaseEntryKeyword>
	_original: Nullable<KnowledgeBaseEntryKeyword>
	isAdapter: false
}
export const KnowledgeBaseEntryTypeRef: TypeRef<KnowledgeBaseEntry> = new TypeRef("tutanota", 1171)

export function createKnowledgeBaseEntry(values: KnowledgeBaseEntryParams): KnowledgeBaseEntry {
	return Object.assign(create(typeModels[KnowledgeBaseEntryTypeRef.typeId], KnowledgeBaseEntryTypeRef), values)
}

export type KnowledgeBaseEntryParams = {
	title: string
	description: string

	keywords: KnowledgeBaseEntryKeyword[]
}

export type KnowledgeBaseEntry = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	title: string
	description: string
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	keywords: KnowledgeBaseEntryKeyword[]

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<KnowledgeBaseEntry>
	_errors: Object
	_original: Nullable<KnowledgeBaseEntry>
	isAdapter: false
}
export const TemplateGroupRootTypeRef: TypeRef<TemplateGroupRoot> = new TypeRef("tutanota", 1181)

export function createTemplateGroupRoot(values: TemplateGroupRootParams): TemplateGroupRoot {
	return Object.assign(create(typeModels[TemplateGroupRootTypeRef.typeId], TemplateGroupRootTypeRef), values)
}

export type TemplateGroupRootParams = {
	templates: Id
	knowledgeBase: Id
}

export type TemplateGroupRoot = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	templates: Id
	knowledgeBase: Id

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<TemplateGroupRoot>
	_errors: Object
	_original: Nullable<TemplateGroupRoot>
	isAdapter: false
}
export const UserAreaGroupDeleteDataTypeRef: TypeRef<UserAreaGroupDeleteData> = new TypeRef("tutanota", 1190)

export function createUserAreaGroupDeleteData(values: UserAreaGroupDeleteDataParams): UserAreaGroupDeleteData {
	return Object.assign(create(typeModels[UserAreaGroupDeleteDataTypeRef.typeId], UserAreaGroupDeleteDataTypeRef), values)
}

export type UserAreaGroupDeleteDataParams = {
	group: Id
}

export type UserAreaGroupDeleteData = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	group: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UserAreaGroupDeleteData>
	_original: Nullable<UserAreaGroupDeleteData>
	isAdapter: false
}
export const MailboxPropertiesTypeRef: TypeRef<MailboxProperties> = new TypeRef("tutanota", 1195)

export function createMailboxProperties(values: MailboxPropertiesParams): MailboxProperties {
	return Object.assign(create(typeModels[MailboxPropertiesTypeRef.typeId], MailboxPropertiesTypeRef), values)
}

export type MailboxPropertiesParams = {
	reportMovedMails: NumberString

	mailAddressProperties: MailAddressProperties[]
}

export type MailboxProperties = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	reportMovedMails: NumberString
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	mailAddressProperties: MailAddressProperties[]

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailboxProperties>
	_errors: Object
	_original: Nullable<MailboxProperties>
	isAdapter: false
}
export const SpamResultsTypeRef: TypeRef<SpamResults> = new TypeRef("tutanota", 1217)

export function createSpamResults(values: SpamResultsParams): SpamResults {
	return Object.assign(create(typeModels[SpamResultsTypeRef.typeId], SpamResultsTypeRef), values)
}

export type SpamResultsParams = {
	list: Id
}

export type SpamResults = {
	// == values

	_id: Id

	// == associations

	list: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SpamResults>
	_original: Nullable<SpamResults>
	isAdapter: false
}
export const NewsIdTypeRef: TypeRef<NewsId> = new TypeRef("tutanota", 1245)

export function createNewsId(values: NewsIdParams): NewsId {
	return Object.assign(create(typeModels[NewsIdTypeRef.typeId], NewsIdTypeRef), values)
}

export type NewsIdParams = {
	newsItemName: string
	newsItemId: Id
}

export type NewsId = {
	// == values

	_id: Id
	newsItemName: string
	newsItemId: Id

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<NewsId>
	_original: Nullable<NewsId>
	isAdapter: false
}
export const NewsOutTypeRef: TypeRef<NewsOut> = new TypeRef("tutanota", 1256)

export function createNewsOut(values: NewsOutParams): NewsOut {
	return Object.assign(create(typeModels[NewsOutTypeRef.typeId], NewsOutTypeRef), values)
}

export type NewsOutParams = {
	newsItemIds: NewsId[]
}

export type NewsOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	newsItemIds: NewsId[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<NewsOut>
	_original: Nullable<NewsOut>
	isAdapter: false
}
export const NewsInTypeRef: TypeRef<NewsIn> = new TypeRef("tutanota", 1259)

export function createNewsIn(values: NewsInParams): NewsIn {
	return Object.assign(create(typeModels[NewsInTypeRef.typeId], NewsInTypeRef), values)
}

export type NewsInParams = {
	newsItemId: null | Id
}

export type NewsIn = {
	// == values

	_format: NumberString
	newsItemId: null | Id
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<NewsIn>
	_original: Nullable<NewsIn>
	isAdapter: false
}
export const MailAddressPropertiesTypeRef: TypeRef<MailAddressProperties> = new TypeRef("tutanota", 1263)

export function createMailAddressProperties(values: MailAddressPropertiesParams): MailAddressProperties {
	return Object.assign(create(typeModels[MailAddressPropertiesTypeRef.typeId], MailAddressPropertiesTypeRef), values)
}

export type MailAddressPropertiesParams = {
	mailAddress: string
	senderName: string
}

export type MailAddressProperties = {
	// == values

	_id: Id
	mailAddress: string
	senderName: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailAddressProperties>
	_original: Nullable<MailAddressProperties>
	isAdapter: false
}
export const HeaderTypeRef: TypeRef<Header> = new TypeRef("tutanota", 1269)

export function createHeader(values: HeaderParams): Header {
	return Object.assign(create(typeModels[HeaderTypeRef.typeId], HeaderTypeRef), values)
}

export type HeaderParams = {
	headers: null | string
	compressedHeaders: null | string
}

export type Header = {
	// == values

	_id: Id
	headers: null | string
	compressedHeaders: null | string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<Header>
	_original: Nullable<Header>
	isAdapter: false
}
export const BodyTypeRef: TypeRef<Body> = new TypeRef("tutanota", 1273)

export function createBody(values: BodyParams): Body {
	return Object.assign(create(typeModels[BodyTypeRef.typeId], BodyTypeRef), values)
}

export type BodyParams = {
	text: null | string
	compressedText: null | string
}

export type Body = {
	// == values

	_id: Id
	text: null | string
	compressedText: null | string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<Body>
	_original: Nullable<Body>
	isAdapter: false
}
export const RecipientsTypeRef: TypeRef<Recipients> = new TypeRef("tutanota", 1277)

export function createRecipients(values: RecipientsParams): Recipients {
	return Object.assign(create(typeModels[RecipientsTypeRef.typeId], RecipientsTypeRef), values)
}

export type RecipientsParams = {
	toRecipients: MailAddress[]
	ccRecipients: MailAddress[]
	bccRecipients: MailAddress[]
}

export type Recipients = {
	// == values

	_id: Id

	// == associations

	toRecipients: MailAddress[]
	ccRecipients: MailAddress[]
	bccRecipients: MailAddress[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<Recipients>
	_original: Nullable<Recipients>
	isAdapter: false
}
export const MailDetailsTypeRef: TypeRef<MailDetails> = new TypeRef("tutanota", 1282)

export function createMailDetails(values: MailDetailsParams): MailDetails {
	return Object.assign(create(typeModels[MailDetailsTypeRef.typeId], MailDetailsTypeRef), values)
}

export type MailDetailsParams = {
	sentDate: Date
	authStatus: NumberString

	replyTos: EncryptedMailAddress[]
	recipients: Recipients
	headers: null | Header
	body: Body
}

export type MailDetails = {
	// == values

	_id: Id
	sentDate: Date
	authStatus: NumberString

	// == associations

	replyTos: EncryptedMailAddress[]
	recipients: Recipients
	headers: null | Header
	body: Body

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailDetails>
	_original: Nullable<MailDetails>
	isAdapter: false
}
export const MailDetailsDraftTypeRef: TypeRef<MailDetailsDraft> = new TypeRef("tutanota", 1290)

export function createMailDetailsDraft(values: MailDetailsDraftParams): MailDetailsDraft {
	return Object.assign(create(typeModels[MailDetailsDraftTypeRef.typeId], MailDetailsDraftTypeRef), values)
}

export type MailDetailsDraftParams = {
	details: MailDetails
}

export type MailDetailsDraft = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	details: MailDetails

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailDetailsDraft>
	_errors: Object
	_original: Nullable<MailDetailsDraft>
	isAdapter: false
}
export const MailDetailsBlobTypeRef: TypeRef<MailDetailsBlob> = new TypeRef("tutanota", 1298)

export function createMailDetailsBlob(values: MailDetailsBlobParams): MailDetailsBlob {
	return Object.assign(create(typeModels[MailDetailsBlobTypeRef.typeId], MailDetailsBlobTypeRef), values)
}

export type MailDetailsBlobParams = {
	details: MailDetails
}

export type MailDetailsBlob = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	details: MailDetails

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailDetailsBlob>
	_errors: Object
	_original: Nullable<MailDetailsBlob>
	isAdapter: false
}
export const UpdateMailFolderDataTypeRef: TypeRef<UpdateMailFolderData> = new TypeRef("tutanota", 1311)

export function createUpdateMailFolderData(values: UpdateMailFolderDataParams): UpdateMailFolderData {
	return Object.assign(create(typeModels[UpdateMailFolderDataTypeRef.typeId], UpdateMailFolderDataTypeRef), values)
}

export type UpdateMailFolderDataParams = {
	folder: IdTuple
	newParent: null | IdTuple
}

export type UpdateMailFolderData = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	folder: IdTuple
	newParent: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UpdateMailFolderData>
	_original: Nullable<UpdateMailFolderData>
	isAdapter: false
}
export const MailDetailsDraftsRefTypeRef: TypeRef<MailDetailsDraftsRef> = new TypeRef("tutanota", 1315)

export function createMailDetailsDraftsRef(values: MailDetailsDraftsRefParams): MailDetailsDraftsRef {
	return Object.assign(create(typeModels[MailDetailsDraftsRefTypeRef.typeId], MailDetailsDraftsRefTypeRef), values)
}

export type MailDetailsDraftsRefParams = {
	list: Id
}

export type MailDetailsDraftsRef = {
	// == values

	_id: Id

	// == associations

	list: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailDetailsDraftsRef>
	_original: Nullable<MailDetailsDraftsRef>
	isAdapter: false
}
export const ContactListEntryTypeRef: TypeRef<ContactListEntry> = new TypeRef("tutanota", 1325)

export function createContactListEntry(values: ContactListEntryParams): ContactListEntry {
	return Object.assign(create(typeModels[ContactListEntryTypeRef.typeId], ContactListEntryTypeRef), values)
}

export type ContactListEntryParams = {
	emailAddress: string
}

export type ContactListEntry = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	emailAddress: string
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactListEntry>
	_errors: Object
	_original: Nullable<ContactListEntry>
	isAdapter: false
}
export const ContactListGroupRootTypeRef: TypeRef<ContactListGroupRoot> = new TypeRef("tutanota", 1333)

export function createContactListGroupRoot(values: ContactListGroupRootParams): ContactListGroupRoot {
	return Object.assign(create(typeModels[ContactListGroupRootTypeRef.typeId], ContactListGroupRootTypeRef), values)
}

export type ContactListGroupRootParams = {
	entries: Id
}

export type ContactListGroupRoot = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	entries: Id

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactListGroupRoot>
	_errors: Object
	_original: Nullable<ContactListGroupRoot>
	isAdapter: false
}
export const SymEncInternalRecipientKeyDataTypeRef: TypeRef<SymEncInternalRecipientKeyData> = new TypeRef("tutanota", 1347)

export function createSymEncInternalRecipientKeyData(values: SymEncInternalRecipientKeyDataParams): SymEncInternalRecipientKeyData {
	return Object.assign(create(typeModels[SymEncInternalRecipientKeyDataTypeRef.typeId], SymEncInternalRecipientKeyDataTypeRef), values)
}

export type SymEncInternalRecipientKeyDataParams = {
	mailAddress: string
	symEncBucketKey: Uint8Array<ArrayBuffer>
	symKeyVersion: NumberString

	keyGroup: Id
}

export type SymEncInternalRecipientKeyData = {
	// == values

	_id: Id
	mailAddress: string
	symEncBucketKey: Uint8Array<ArrayBuffer>
	symKeyVersion: NumberString

	// == associations

	keyGroup: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SymEncInternalRecipientKeyData>
	_original: Nullable<SymEncInternalRecipientKeyData>
	isAdapter: false
}
export const ContactCustomDateTypeRef: TypeRef<ContactCustomDate> = new TypeRef("tutanota", 1356)

export function createContactCustomDate(values: ContactCustomDateParams): ContactCustomDate {
	return Object.assign(create(typeModels[ContactCustomDateTypeRef.typeId], ContactCustomDateTypeRef), values)
}

export type ContactCustomDateParams = {
	type: NumberString
	customTypeName: string
	dateIso: string
}

export type ContactCustomDate = {
	// == values

	_id: Id
	type: NumberString
	customTypeName: string
	dateIso: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactCustomDate>
	_original: Nullable<ContactCustomDate>
	isAdapter: false
}
export const ContactWebsiteTypeRef: TypeRef<ContactWebsite> = new TypeRef("tutanota", 1361)

export function createContactWebsite(values: ContactWebsiteParams): ContactWebsite {
	return Object.assign(create(typeModels[ContactWebsiteTypeRef.typeId], ContactWebsiteTypeRef), values)
}

export type ContactWebsiteParams = {
	type: NumberString
	customTypeName: string
	url: string
}

export type ContactWebsite = {
	// == values

	_id: Id
	type: NumberString
	customTypeName: string
	url: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactWebsite>
	_original: Nullable<ContactWebsite>
	isAdapter: false
}
export const ContactRelationshipTypeRef: TypeRef<ContactRelationship> = new TypeRef("tutanota", 1366)

export function createContactRelationship(values: ContactRelationshipParams): ContactRelationship {
	return Object.assign(create(typeModels[ContactRelationshipTypeRef.typeId], ContactRelationshipTypeRef), values)
}

export type ContactRelationshipParams = {
	type: NumberString
	customTypeName: string
	person: string
}

export type ContactRelationship = {
	// == values

	_id: Id
	type: NumberString
	customTypeName: string
	person: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactRelationship>
	_original: Nullable<ContactRelationship>
	isAdapter: false
}
export const ContactMessengerHandleTypeRef: TypeRef<ContactMessengerHandle> = new TypeRef("tutanota", 1371)

export function createContactMessengerHandle(values: ContactMessengerHandleParams): ContactMessengerHandle {
	return Object.assign(create(typeModels[ContactMessengerHandleTypeRef.typeId], ContactMessengerHandleTypeRef), values)
}

export type ContactMessengerHandleParams = {
	type: NumberString
	customTypeName: string
	handle: string
}

export type ContactMessengerHandle = {
	// == values

	_id: Id
	type: NumberString
	customTypeName: string
	handle: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactMessengerHandle>
	_original: Nullable<ContactMessengerHandle>
	isAdapter: false
}
export const ContactPronounsTypeRef: TypeRef<ContactPronouns> = new TypeRef("tutanota", 1376)

export function createContactPronouns(values: ContactPronounsParams): ContactPronouns {
	return Object.assign(create(typeModels[ContactPronounsTypeRef.typeId], ContactPronounsTypeRef), values)
}

export type ContactPronounsParams = {
	language: string
	pronouns: string
}

export type ContactPronouns = {
	// == values

	_id: Id
	language: string
	pronouns: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ContactPronouns>
	_original: Nullable<ContactPronouns>
	isAdapter: false
}
export const TranslationGetInTypeRef: TypeRef<TranslationGetIn> = new TypeRef("tutanota", 1436)

export function createTranslationGetIn(values: TranslationGetInParams): TranslationGetIn {
	return Object.assign(create(typeModels[TranslationGetInTypeRef.typeId], TranslationGetInTypeRef), values)
}

export type TranslationGetInParams = {
	lang: string
}

export type TranslationGetIn = {
	// == values

	_format: NumberString
	lang: string
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<TranslationGetIn>
	_original: Nullable<TranslationGetIn>
	isAdapter: false
}
export const TranslationGetOutTypeRef: TypeRef<TranslationGetOut> = new TypeRef("tutanota", 1439)

export function createTranslationGetOut(values: TranslationGetOutParams): TranslationGetOut {
	return Object.assign(create(typeModels[TranslationGetOutTypeRef.typeId], TranslationGetOutTypeRef), values)
}

export type TranslationGetOutParams = {
	giftCardSubject: string
	invitationSubject: string
}

export type TranslationGetOut = {
	// == values

	_format: NumberString
	giftCardSubject: string
	invitationSubject: string
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<TranslationGetOut>
	_original: Nullable<TranslationGetOut>
	isAdapter: false
}
export const DefaultAlarmInfoTypeRef: TypeRef<DefaultAlarmInfo> = new TypeRef("tutanota", 1446)

export function createDefaultAlarmInfo(values: DefaultAlarmInfoParams): DefaultAlarmInfo {
	return Object.assign(create(typeModels[DefaultAlarmInfoTypeRef.typeId], DefaultAlarmInfoTypeRef), values)
}

export type DefaultAlarmInfoParams = {
	trigger: string
}

export type DefaultAlarmInfo = {
	// == values

	_id: Id
	trigger: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DefaultAlarmInfo>
	_original: Nullable<DefaultAlarmInfo>
	isAdapter: false
}
export const MailSetEntryTypeRef: TypeRef<MailSetEntry> = new TypeRef("tutanota", 1450)

export function createMailSetEntry(values: MailSetEntryParams): MailSetEntry {
	return Object.assign(create(typeModels[MailSetEntryTypeRef.typeId], MailSetEntryTypeRef), values)
}

export type MailSetEntryParams = {
	mail: IdTuple
}

export type MailSetEntry = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	mail: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailSetEntry>
	_original: Nullable<MailSetEntry>
	isAdapter: false
}
export const MailBagTypeRef: TypeRef<MailBag> = new TypeRef("tutanota", 1460)

export function createMailBag(values: MailBagParams): MailBag {
	return Object.assign(create(typeModels[MailBagTypeRef.typeId], MailBagTypeRef), values)
}

export type MailBagParams = {
	mails: Id
}

export type MailBag = {
	// == values

	_id: Id

	// == associations

	mails: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailBag>
	_original: Nullable<MailBag>
	isAdapter: false
}
export const SimpleMoveMailPostInTypeRef: TypeRef<SimpleMoveMailPostIn> = new TypeRef("tutanota", 1469)

export function createSimpleMoveMailPostIn(values: SimpleMoveMailPostInParams): SimpleMoveMailPostIn {
	return Object.assign(create(typeModels[SimpleMoveMailPostInTypeRef.typeId], SimpleMoveMailPostInTypeRef), values)
}

export type SimpleMoveMailPostInParams = {
	destinationSetType: NumberString
	moveReason: null | NumberString

	mails: IdTuple[]
}

export type SimpleMoveMailPostIn = {
	// == values

	_format: NumberString
	destinationSetType: NumberString
	moveReason: null | NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mails: IdTuple[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SimpleMoveMailPostIn>
	_original: Nullable<SimpleMoveMailPostIn>
	isAdapter: false
}
export const UnreadMailStatePostInTypeRef: TypeRef<UnreadMailStatePostIn> = new TypeRef("tutanota", 1474)

export function createUnreadMailStatePostIn(values: UnreadMailStatePostInParams): UnreadMailStatePostIn {
	return Object.assign(create(typeModels[UnreadMailStatePostInTypeRef.typeId], UnreadMailStatePostInTypeRef), values)
}

export type UnreadMailStatePostInParams = {
	unread: boolean

	mails: IdTuple[]
}

export type UnreadMailStatePostIn = {
	// == values

	_format: NumberString
	unread: boolean

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mails: IdTuple[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UnreadMailStatePostIn>
	_original: Nullable<UnreadMailStatePostIn>
	isAdapter: false
}
export const ManageLabelServiceLabelDataTypeRef: TypeRef<ManageLabelServiceLabelData> = new TypeRef("tutanota", 1480)

export function createManageLabelServiceLabelData(values: ManageLabelServiceLabelDataParams): ManageLabelServiceLabelData {
	return Object.assign(create(typeModels[ManageLabelServiceLabelDataTypeRef.typeId], ManageLabelServiceLabelDataTypeRef), values)
}

export type ManageLabelServiceLabelDataParams = {
	name: string
	color: string

	parentLabel: null | IdTuple
}

export type ManageLabelServiceLabelData = {
	// == values

	_id: Id
	name: string
	color: string

	// == associations

	parentLabel: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ManageLabelServiceLabelData>
	_original: Nullable<ManageLabelServiceLabelData>
	isAdapter: false
}
export const ManageLabelServicePostInTypeRef: TypeRef<ManageLabelServicePostIn> = new TypeRef("tutanota", 1484)

export function createManageLabelServicePostIn(values: ManageLabelServicePostInParams): ManageLabelServicePostIn {
	return Object.assign(create(typeModels[ManageLabelServicePostInTypeRef.typeId], ManageLabelServicePostInTypeRef), values)
}

export type ManageLabelServicePostInParams = {
	data: ManageLabelServiceLabelData
}

export type ManageLabelServicePostIn = {
	// == values

	_format: NumberString
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString
	ownerGroup: Id

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	data: ManageLabelServiceLabelData

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ManageLabelServicePostIn>
	_errors: Object
	_original: Nullable<ManageLabelServicePostIn>
	isAdapter: false
}
export const ManageLabelServicePostOutTypeRef: TypeRef<ManageLabelServicePostOut> = new TypeRef("tutanota", 1490)

export function createManageLabelServicePostOut(values: ManageLabelServicePostOutParams): ManageLabelServicePostOut {
	return Object.assign(create(typeModels[ManageLabelServicePostOutTypeRef.typeId], ManageLabelServicePostOutTypeRef), values)
}

export type ManageLabelServicePostOutParams = {
	label: IdTuple
}

export type ManageLabelServicePostOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	label: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ManageLabelServicePostOut>
	_original: Nullable<ManageLabelServicePostOut>
	isAdapter: false
}
export const ManageLabelServicePutInTypeRef: TypeRef<ManageLabelServicePutIn> = new TypeRef("tutanota", 1493)

export function createManageLabelServicePutIn(values: ManageLabelServicePutInParams): ManageLabelServicePutIn {
	return Object.assign(create(typeModels[ManageLabelServicePutInTypeRef.typeId], ManageLabelServicePutInTypeRef), values)
}

export type ManageLabelServicePutInParams = {
	label: IdTuple
	data: ManageLabelServiceLabelData
}

export type ManageLabelServicePutIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	label: IdTuple
	data: ManageLabelServiceLabelData

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ManageLabelServicePutIn>
	_errors: Object
	_original: Nullable<ManageLabelServicePutIn>
	isAdapter: false
}
export const ManageLabelServiceDeleteInTypeRef: TypeRef<ManageLabelServiceDeleteIn> = new TypeRef("tutanota", 1500)

export function createManageLabelServiceDeleteIn(values: ManageLabelServiceDeleteInParams): ManageLabelServiceDeleteIn {
	return Object.assign(create(typeModels[ManageLabelServiceDeleteInTypeRef.typeId], ManageLabelServiceDeleteInTypeRef), values)
}

export type ManageLabelServiceDeleteInParams = {
	label: IdTuple
}

export type ManageLabelServiceDeleteIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	label: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ManageLabelServiceDeleteIn>
	_original: Nullable<ManageLabelServiceDeleteIn>
	isAdapter: false
}
export const ApplyLabelServicePostInTypeRef: TypeRef<ApplyLabelServicePostIn> = new TypeRef("tutanota", 1504)

export function createApplyLabelServicePostIn(values: ApplyLabelServicePostInParams): ApplyLabelServicePostIn {
	return Object.assign(create(typeModels[ApplyLabelServicePostInTypeRef.typeId], ApplyLabelServicePostInTypeRef), values)
}

export type ApplyLabelServicePostInParams = {
	mails: IdTuple[]
	addedLabels: IdTuple[]
	removedLabels: IdTuple[]
}

export type ApplyLabelServicePostIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mails: IdTuple[]
	addedLabels: IdTuple[]
	removedLabels: IdTuple[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ApplyLabelServicePostIn>
	_original: Nullable<ApplyLabelServicePostIn>
	isAdapter: false
}
export const ImportMailDataMailReferenceTypeRef: TypeRef<ImportMailDataMailReference> = new TypeRef("tutanota", 1513)

export function createImportMailDataMailReference(values: ImportMailDataMailReferenceParams): ImportMailDataMailReference {
	return Object.assign(create(typeModels[ImportMailDataMailReferenceTypeRef.typeId], ImportMailDataMailReferenceTypeRef), values)
}

export type ImportMailDataMailReferenceParams = {
	reference: string
}

export type ImportMailDataMailReference = {
	// == values

	_id: Id
	reference: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportMailDataMailReference>
	_original: Nullable<ImportMailDataMailReference>
	isAdapter: false
}
export const NewImportAttachmentTypeRef: TypeRef<NewImportAttachment> = new TypeRef("tutanota", 1516)

export function createNewImportAttachment(values: NewImportAttachmentParams): NewImportAttachment {
	return Object.assign(create(typeModels[NewImportAttachmentTypeRef.typeId], NewImportAttachmentTypeRef), values)
}

export type NewImportAttachmentParams = {
	ownerEncFileHashSessionKey: null | Uint8Array<ArrayBuffer>
	encFileHash: null | Uint8Array<ArrayBuffer>
	encFileName: Uint8Array<ArrayBuffer>
	encMimeType: Uint8Array<ArrayBuffer>
	encCid: null | Uint8Array<ArrayBuffer>

	referenceTokens: BlobReferenceTokenWrapper[]
}

export type NewImportAttachment = {
	// == values

	_id: Id
	ownerEncFileHashSessionKey: null | Uint8Array<ArrayBuffer>
	encFileHash: null | Uint8Array<ArrayBuffer>
	encFileName: Uint8Array<ArrayBuffer>
	encMimeType: Uint8Array<ArrayBuffer>
	encCid: null | Uint8Array<ArrayBuffer>
	ownerKeyVersion: null | NumberString

	// == associations

	referenceTokens: BlobReferenceTokenWrapper[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<NewImportAttachment>
	_original: Nullable<NewImportAttachment>
	isAdapter: false
}
export const ImportAttachmentTypeRef: TypeRef<ImportAttachment> = new TypeRef("tutanota", 1524)

export function createImportAttachment(values: ImportAttachmentParams): ImportAttachment {
	return Object.assign(create(typeModels[ImportAttachmentTypeRef.typeId], ImportAttachmentTypeRef), values)
}

export type ImportAttachmentParams = {
	ownerEncFileSessionKey: Uint8Array<ArrayBuffer>
	ownerFileKeyVersion: NumberString

	newAttachment: null | NewImportAttachment
	existingAttachmentFile: null | IdTuple
}

export type ImportAttachment = {
	// == values

	_id: Id
	ownerEncFileSessionKey: Uint8Array<ArrayBuffer>
	ownerFileKeyVersion: NumberString

	// == associations

	newAttachment: null | NewImportAttachment
	existingAttachmentFile: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportAttachment>
	_original: Nullable<ImportAttachment>
	isAdapter: false
}
export const ImportMailDataTypeRef: TypeRef<ImportMailData> = new TypeRef("tutanota", 1530)

export function createImportMailData(values: ImportMailDataParams): ImportMailData {
	return Object.assign(create(typeModels[ImportMailDataTypeRef.typeId], ImportMailDataTypeRef), values)
}

export type ImportMailDataParams = {
	subject: string
	compressedBodyText: string
	date: Date
	state: NumberString
	unread: boolean
	messageId: null | string
	inReplyTo: null | string
	confidential: boolean
	method: NumberString
	replyType: NumberString
	differentEnvelopeSender: null | string
	phishingStatus: NumberString
	compressedHeaders: string
	imapModSeq: null | NumberString
	imapUid: null | NumberString
	sourceId: null | string

	references: ImportMailDataMailReference[]
	sender: MailAddress
	replyTos: EncryptedMailAddress[]
	recipients: Recipients
	importedAttachments: ImportAttachment[]
	labels: IdTuple[]
}

export type ImportMailData = {
	// == values

	_format: NumberString
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString
	subject: string
	compressedBodyText: string
	date: Date
	state: NumberString
	unread: boolean
	messageId: null | string
	inReplyTo: null | string
	confidential: boolean
	method: NumberString
	replyType: NumberString
	differentEnvelopeSender: null | string
	phishingStatus: NumberString
	compressedHeaders: string
	imapModSeq: null | NumberString
	imapUid: null | NumberString
	sourceId: null | string

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	references: ImportMailDataMailReference[]
	sender: MailAddress
	replyTos: EncryptedMailAddress[]
	recipients: Recipients
	importedAttachments: ImportAttachment[]
	labels: IdTuple[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportMailData>
	_errors: Object
	_original: Nullable<ImportMailData>
	isAdapter: false
}
export const ImportedFileMailTypeRef: TypeRef<ImportedFileMail> = new TypeRef("tutanota", 1552)

export function createImportedFileMail(values: ImportedFileMailParams): ImportedFileMail {
	return Object.assign(create(typeModels[ImportedFileMailTypeRef.typeId], ImportedFileMailTypeRef), values)
}

export type ImportedFileMailParams = {
	mailSetEntry: IdTuple
}

export type ImportedFileMail = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	mailSetEntry: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportedFileMail>
	_original: Nullable<ImportedFileMail>
	isAdapter: false
}
export const ImportFileMailStateTypeRef: TypeRef<ImportFileMailState> = new TypeRef("tutanota", 1559)

export function createImportFileMailState(values: ImportFileMailStateParams): ImportFileMailState {
	return Object.assign(create(typeModels[ImportFileMailStateTypeRef.typeId], ImportFileMailStateTypeRef), values)
}

export type ImportFileMailStateParams = {
	status: NumberString
	successfulMails: NumberString
	failedMails: NumberString
	totalMails: NumberString

	importedMails: Id
	targetFolder: IdTuple
}

export type ImportFileMailState = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	status: NumberString
	successfulMails: NumberString
	failedMails: NumberString
	totalMails: NumberString

	// == associations

	importedMails: Id
	targetFolder: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportFileMailState>
	_original: Nullable<ImportFileMailState>
	isAdapter: false
}
export const ImportMailPostInTypeRef: TypeRef<ImportMailPostIn> = new TypeRef("tutanota", 1570)

export function createImportMailPostIn(values: ImportMailPostInParams): ImportMailPostIn {
	return Object.assign(create(typeModels[ImportMailPostInTypeRef.typeId], ImportMailPostInTypeRef), values)
}

export type ImportMailPostInParams = {
	importFileMailState: null | IdTuple
	encImports: StringWrapper[]
	imapFolderSyncState: null | IdTuple
}

export type ImportMailPostIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	importFileMailState: null | IdTuple
	encImports: StringWrapper[]
	imapFolderSyncState: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportMailPostIn>
	_original: Nullable<ImportMailPostIn>
	isAdapter: false
}
export const ImportMailPostOutTypeRef: TypeRef<ImportMailPostOut> = new TypeRef("tutanota", 1579)

export function createImportMailPostOut(values: ImportMailPostOutParams): ImportMailPostOut {
	return Object.assign(create(typeModels[ImportMailPostOutTypeRef.typeId], ImportMailPostOutTypeRef), values)
}

export type ImportMailPostOutParams = {}

export type ImportMailPostOut = {
	// == values

	_format: NumberString
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportMailPostOut>
	_original: Nullable<ImportMailPostOut>
	isAdapter: false
}
export const ImportMailGetInTypeRef: TypeRef<ImportMailGetIn> = new TypeRef("tutanota", 1582)

export function createImportMailGetIn(values: ImportMailGetInParams): ImportMailGetIn {
	return Object.assign(create(typeModels[ImportMailGetInTypeRef.typeId], ImportMailGetInTypeRef), values)
}

export type ImportMailGetInParams = {
	newImportedMailSetName: string
	totalMails: NumberString

	targetMailFolder: IdTuple
}

export type ImportMailGetIn = {
	// == values

	_format: NumberString
	ownerGroup: Id
	ownerKeyVersion: NumberString
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	newImportedMailSetName: string
	totalMails: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	targetMailFolder: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportMailGetIn>
	_errors: Object
	_original: Nullable<ImportMailGetIn>
	isAdapter: false
}
export const AdvancedRepeatRuleTypeRef: TypeRef<AdvancedRepeatRule> = new TypeRef("tutanota", 1586)

export function createAdvancedRepeatRule(values: AdvancedRepeatRuleParams): AdvancedRepeatRule {
	return Object.assign(create(typeModels[AdvancedRepeatRuleTypeRef.typeId], AdvancedRepeatRuleTypeRef), values)
}

export type AdvancedRepeatRuleParams = {
	ruleType: NumberString
	interval: string
}

export type AdvancedRepeatRule = {
	// == values

	_id: Id
	ruleType: NumberString
	interval: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<AdvancedRepeatRule>
	_original: Nullable<AdvancedRepeatRule>
	isAdapter: false
}
export const ImportMailGetOutTypeRef: TypeRef<ImportMailGetOut> = new TypeRef("tutanota", 1591)

export function createImportMailGetOut(values: ImportMailGetOutParams): ImportMailGetOut {
	return Object.assign(create(typeModels[ImportMailGetOutTypeRef.typeId], ImportMailGetOutTypeRef), values)
}

export type ImportMailGetOutParams = {
	importFileMailState: IdTuple
}

export type ImportMailGetOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	importFileMailState: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportMailGetOut>
	_original: Nullable<ImportMailGetOut>
	isAdapter: false
}
export const MailExportTokenServicePostOutTypeRef: TypeRef<MailExportTokenServicePostOut> = new TypeRef("tutanota", 1605)

export function createMailExportTokenServicePostOut(values: MailExportTokenServicePostOutParams): MailExportTokenServicePostOut {
	return Object.assign(create(typeModels[MailExportTokenServicePostOutTypeRef.typeId], MailExportTokenServicePostOutTypeRef), values)
}

export type MailExportTokenServicePostOutParams = {
	mailExportToken: string
}

export type MailExportTokenServicePostOut = {
	// == values

	_format: NumberString
	mailExportToken: string
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailExportTokenServicePostOut>
	_original: Nullable<MailExportTokenServicePostOut>
	isAdapter: false
}
export const SupportTopicTypeRef: TypeRef<SupportTopic> = new TypeRef("tutanota", 1618)

export function createSupportTopic(values: SupportTopicParams): SupportTopic {
	return Object.assign(create(typeModels[SupportTopicTypeRef.typeId], SupportTopicTypeRef), values)
}

export type SupportTopicParams = {
	lastUpdated: Date
	issueEN: string
	issueDE: string
	solutionHtmlEN: string
	solutionHtmlDE: string
	visibility: NumberString
	contactTemplateHtmlEN: string
	contactTemplateHtmlDE: string
	helpTextEN: string
	helpTextDE: string
	contactSupportTextEN: null | string
	contactSupportTextDE: null | string
}

export type SupportTopic = {
	// == values

	_id: Id
	lastUpdated: Date
	issueEN: string
	issueDE: string
	solutionHtmlEN: string
	solutionHtmlDE: string
	visibility: NumberString
	contactTemplateHtmlEN: string
	contactTemplateHtmlDE: string
	helpTextEN: string
	helpTextDE: string
	contactSupportTextEN: null | string
	contactSupportTextDE: null | string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SupportTopic>
	_original: Nullable<SupportTopic>
	isAdapter: false
}
export const SupportCategoryTypeRef: TypeRef<SupportCategory> = new TypeRef("tutanota", 1626)

export function createSupportCategory(values: SupportCategoryParams): SupportCategory {
	return Object.assign(create(typeModels[SupportCategoryTypeRef.typeId], SupportCategoryTypeRef), values)
}

export type SupportCategoryParams = {
	nameEN: string
	nameDE: string
	introductionEN: string
	introductionDE: string
	icon: string
	contactTemplateHtmlEN: string
	contactTemplateHtmlDE: string
	helpTextEN: string
	helpTextDE: string

	topics: SupportTopic[]
}

export type SupportCategory = {
	// == values

	_id: Id
	nameEN: string
	nameDE: string
	introductionEN: string
	introductionDE: string
	icon: string
	contactTemplateHtmlEN: string
	contactTemplateHtmlDE: string
	helpTextEN: string
	helpTextDE: string

	// == associations

	topics: SupportTopic[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SupportCategory>
	_original: Nullable<SupportCategory>
	isAdapter: false
}
export const SupportDataTypeRef: TypeRef<SupportData> = new TypeRef("tutanota", 1634)

export function createSupportData(values: SupportDataParams): SupportData {
	return Object.assign(create(typeModels[SupportDataTypeRef.typeId], SupportDataTypeRef), values)
}

export type SupportDataParams = {
	categories: SupportCategory[]
}

export type SupportData = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	categories: SupportCategory[]

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SupportData>
	_original: Nullable<SupportData>
	isAdapter: false
}
export const ReceiveInfoServicePostOutTypeRef: TypeRef<ReceiveInfoServicePostOut> = new TypeRef("tutanota", 1641)

export function createReceiveInfoServicePostOut(values: ReceiveInfoServicePostOutParams): ReceiveInfoServicePostOut {
	return Object.assign(create(typeModels[ReceiveInfoServicePostOutTypeRef.typeId], ReceiveInfoServicePostOutTypeRef), values)
}

export type ReceiveInfoServicePostOutParams = {
	outdatedVersion: boolean
}

export type ReceiveInfoServicePostOut = {
	// == values

	_format: NumberString
	outdatedVersion: boolean
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ReceiveInfoServicePostOut>
	_original: Nullable<ReceiveInfoServicePostOut>
	isAdapter: false
}
export const ResolveConversationsServiceGetInTypeRef: TypeRef<ResolveConversationsServiceGetIn> = new TypeRef("tutanota", 1645)

export function createResolveConversationsServiceGetIn(values: ResolveConversationsServiceGetInParams): ResolveConversationsServiceGetIn {
	return Object.assign(create(typeModels[ResolveConversationsServiceGetInTypeRef.typeId], ResolveConversationsServiceGetInTypeRef), values)
}

export type ResolveConversationsServiceGetInParams = {
	conversationLists: GeneratedIdWrapper[]
}

export type ResolveConversationsServiceGetIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	conversationLists: GeneratedIdWrapper[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ResolveConversationsServiceGetIn>
	_original: Nullable<ResolveConversationsServiceGetIn>
	isAdapter: false
}
export const ResolveConversationsServiceGetOutTypeRef: TypeRef<ResolveConversationsServiceGetOut> = new TypeRef("tutanota", 1648)

export function createResolveConversationsServiceGetOut(values: ResolveConversationsServiceGetOutParams): ResolveConversationsServiceGetOut {
	return Object.assign(create(typeModels[ResolveConversationsServiceGetOutTypeRef.typeId], ResolveConversationsServiceGetOutTypeRef), values)
}

export type ResolveConversationsServiceGetOutParams = {
	mailIds: IdTupleWrapper[]
}

export type ResolveConversationsServiceGetOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mailIds: IdTupleWrapper[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ResolveConversationsServiceGetOut>
	_original: Nullable<ResolveConversationsServiceGetOut>
	isAdapter: false
}
export const UserAccountPostOutTypeRef: TypeRef<UserAccountPostOut> = new TypeRef("tutanota", 1664)

export function createUserAccountPostOut(values: UserAccountPostOutParams): UserAccountPostOut {
	return Object.assign(create(typeModels[UserAccountPostOutTypeRef.typeId], UserAccountPostOutTypeRef), values)
}

export type UserAccountPostOutParams = {
	userId: Id
	userGroup: Id
}

export type UserAccountPostOut = {
	// == values

	_format: NumberString
	userId: Id
	userGroup: Id
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<UserAccountPostOut>
	_original: Nullable<UserAccountPostOut>
	isAdapter: false
}
export const MailGroupPostOutTypeRef: TypeRef<MailGroupPostOut> = new TypeRef("tutanota", 1668)

export function createMailGroupPostOut(values: MailGroupPostOutParams): MailGroupPostOut {
	return Object.assign(create(typeModels[MailGroupPostOutTypeRef.typeId], MailGroupPostOutTypeRef), values)
}

export type MailGroupPostOutParams = {
	mailGroup: Id
}

export type MailGroupPostOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mailGroup: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MailGroupPostOut>
	_original: Nullable<MailGroupPostOut>
	isAdapter: false
}
export const ChangePrimaryAddressServicePutInTypeRef: TypeRef<ChangePrimaryAddressServicePutIn> = new TypeRef("tutanota", 1671)

export function createChangePrimaryAddressServicePutIn(values: ChangePrimaryAddressServicePutInParams): ChangePrimaryAddressServicePutIn {
	return Object.assign(create(typeModels[ChangePrimaryAddressServicePutInTypeRef.typeId], ChangePrimaryAddressServicePutInTypeRef), values)
}

export type ChangePrimaryAddressServicePutInParams = {
	address: string

	user: Id
}

export type ChangePrimaryAddressServicePutIn = {
	// == values

	_format: NumberString
	address: string

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	user: Id

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ChangePrimaryAddressServicePutIn>
	_original: Nullable<ChangePrimaryAddressServicePutIn>
	isAdapter: false
}
export const MovedMailsTypeRef: TypeRef<MovedMails> = new TypeRef("tutanota", 1716)

export function createMovedMails(values: MovedMailsParams): MovedMails {
	return Object.assign(create(typeModels[MovedMailsTypeRef.typeId], MovedMailsTypeRef), values)
}

export type MovedMailsParams = {
	targetFolder: IdTuple
	sourceFolder: IdTuple
	mailIds: IdTupleWrapper[]
}

export type MovedMails = {
	// == values

	_id: Id

	// == associations

	targetFolder: IdTuple
	sourceFolder: IdTuple
	mailIds: IdTupleWrapper[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MovedMails>
	_original: Nullable<MovedMails>
	isAdapter: false
}
export const MoveMailPostOutTypeRef: TypeRef<MoveMailPostOut> = new TypeRef("tutanota", 1721)

export function createMoveMailPostOut(values: MoveMailPostOutParams): MoveMailPostOut {
	return Object.assign(create(typeModels[MoveMailPostOutTypeRef.typeId], MoveMailPostOutTypeRef), values)
}

export type MoveMailPostOutParams = {
	movedMails: MovedMails[]
}

export type MoveMailPostOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	movedMails: MovedMails[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<MoveMailPostOut>
	_original: Nullable<MoveMailPostOut>
	isAdapter: false
}
export const ClientSpamClassifierResultTypeRef: TypeRef<ClientSpamClassifierResult> = new TypeRef("tutanota", 1724)

export function createClientSpamClassifierResult(values: ClientSpamClassifierResultParams): ClientSpamClassifierResult {
	return Object.assign(create(typeModels[ClientSpamClassifierResultTypeRef.typeId], ClientSpamClassifierResultTypeRef), values)
}

export type ClientSpamClassifierResultParams = {
	spamDecision: NumberString
	confidence: NumberString
}

export type ClientSpamClassifierResult = {
	// == values

	_id: Id
	spamDecision: NumberString
	confidence: NumberString

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ClientSpamClassifierResult>
	_original: Nullable<ClientSpamClassifierResult>
	isAdapter: false
}
export const ClientClassifierResultPostInTypeRef: TypeRef<ClientClassifierResultPostIn> = new TypeRef("tutanota", 1730)

export function createClientClassifierResultPostIn(values: ClientClassifierResultPostInParams): ClientClassifierResultPostIn {
	return Object.assign(create(typeModels[ClientClassifierResultPostInTypeRef.typeId], ClientClassifierResultPostInTypeRef), values)
}

export type ClientClassifierResultPostInParams = {
	isPredictionMade: boolean

	mails: IdTuple[]
}

export type ClientClassifierResultPostIn = {
	// == values

	_format: NumberString
	isPredictionMade: boolean

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mails: IdTuple[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ClientClassifierResultPostIn>
	_original: Nullable<ClientClassifierResultPostIn>
	isAdapter: false
}
export const ClientSpamTrainingDatumTypeRef: TypeRef<ClientSpamTrainingDatum> = new TypeRef("tutanota", 1736)

export function createClientSpamTrainingDatum(values: ClientSpamTrainingDatumParams): ClientSpamTrainingDatum {
	return Object.assign(create(typeModels[ClientSpamTrainingDatumTypeRef.typeId], ClientSpamTrainingDatumTypeRef), values)
}

export type ClientSpamTrainingDatumParams = {
	confidence: NumberString
	spamDecision: NumberString
	vectorLegacy: Uint8Array<ArrayBuffer>
	vectorWithServerClassifiers: null | Uint8Array<ArrayBuffer>
}

export type ClientSpamTrainingDatum = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	confidence: NumberString
	spamDecision: NumberString
	vectorLegacy: Uint8Array<ArrayBuffer>
	vectorWithServerClassifiers: null | Uint8Array<ArrayBuffer>
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ClientSpamTrainingDatum>
	_errors: Object
	_original: Nullable<ClientSpamTrainingDatum>
	isAdapter: false
}
export const ClientSpamTrainingDatumIndexEntryTypeRef: TypeRef<ClientSpamTrainingDatumIndexEntry> = new TypeRef("tutanota", 1747)

export function createClientSpamTrainingDatumIndexEntry(values: ClientSpamTrainingDatumIndexEntryParams): ClientSpamTrainingDatumIndexEntry {
	return Object.assign(create(typeModels[ClientSpamTrainingDatumIndexEntryTypeRef.typeId], ClientSpamTrainingDatumIndexEntryTypeRef), values)
}

export type ClientSpamTrainingDatumIndexEntryParams = {
	clientSpamTrainingDatumElementId: Id
}

export type ClientSpamTrainingDatumIndexEntry = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	clientSpamTrainingDatumElementId: Id

	// == associations

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ClientSpamTrainingDatumIndexEntry>
	_original: Nullable<ClientSpamTrainingDatumIndexEntry>
	isAdapter: false
}
export const ProcessInboxDatumTypeRef: TypeRef<ProcessInboxDatum> = new TypeRef("tutanota", 1756)

export function createProcessInboxDatum(values: ProcessInboxDatumParams): ProcessInboxDatum {
	return Object.assign(create(typeModels[ProcessInboxDatumTypeRef.typeId], ProcessInboxDatumTypeRef), values)
}

export type ProcessInboxDatumParams = {
	ownerEncVectorSessionKey: Uint8Array<ArrayBuffer>
	classifierType: null | NumberString
	encVectorLegacy: Uint8Array<ArrayBuffer>
	encVectorWithServerClassifiers: null | Uint8Array<ArrayBuffer>

	mailId: IdTuple
	targetMoveFolder: IdTuple
	ownerEncMailSessionKeys: InstanceSessionKey[]
}

export type ProcessInboxDatum = {
	// == values

	_id: Id
	ownerEncVectorSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString
	classifierType: null | NumberString
	encVectorLegacy: Uint8Array<ArrayBuffer>
	encVectorWithServerClassifiers: null | Uint8Array<ArrayBuffer>

	// == associations

	mailId: IdTuple
	targetMoveFolder: IdTuple
	ownerEncMailSessionKeys: InstanceSessionKey[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ProcessInboxDatum>
	_original: Nullable<ProcessInboxDatum>
	isAdapter: false
}
export const ProcessInboxPostInTypeRef: TypeRef<ProcessInboxPostIn> = new TypeRef("tutanota", 1764)

export function createProcessInboxPostIn(values: ProcessInboxPostInParams): ProcessInboxPostIn {
	return Object.assign(create(typeModels[ProcessInboxPostInTypeRef.typeId], ProcessInboxPostInTypeRef), values)
}

export type ProcessInboxPostInParams = {
	mailOwnerGroup: Id

	processInboxData: ProcessInboxDatum[]
}

export type ProcessInboxPostIn = {
	// == values

	_format: NumberString
	mailOwnerGroup: Id

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	processInboxData: ProcessInboxDatum[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ProcessInboxPostIn>
	_original: Nullable<ProcessInboxPostIn>
	isAdapter: false
}
export const PopulateClientSpamTrainingDatumTypeRef: TypeRef<PopulateClientSpamTrainingDatum> = new TypeRef("tutanota", 1770)

export function createPopulateClientSpamTrainingDatum(values: PopulateClientSpamTrainingDatumParams): PopulateClientSpamTrainingDatum {
	return Object.assign(create(typeModels[PopulateClientSpamTrainingDatumTypeRef.typeId], PopulateClientSpamTrainingDatumTypeRef), values)
}

export type PopulateClientSpamTrainingDatumParams = {
	ownerEncVectorSessionKey: Uint8Array<ArrayBuffer>
	isSpam: boolean
	confidence: NumberString
	encVectorLegacy: Uint8Array<ArrayBuffer>
	encVectorWithServerClassifiers: null | Uint8Array<ArrayBuffer>

	mailId: IdTuple
}

export type PopulateClientSpamTrainingDatum = {
	// == values

	_id: Id
	ownerEncVectorSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString
	isSpam: boolean
	confidence: NumberString
	encVectorLegacy: Uint8Array<ArrayBuffer>
	encVectorWithServerClassifiers: null | Uint8Array<ArrayBuffer>

	// == associations

	mailId: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<PopulateClientSpamTrainingDatum>
	_original: Nullable<PopulateClientSpamTrainingDatum>
	isAdapter: false
}
export const PopulateClientSpamTrainingDataPostInTypeRef: TypeRef<PopulateClientSpamTrainingDataPostIn> = new TypeRef("tutanota", 1778)

export function createPopulateClientSpamTrainingDataPostIn(values: PopulateClientSpamTrainingDataPostInParams): PopulateClientSpamTrainingDataPostIn {
	return Object.assign(create(typeModels[PopulateClientSpamTrainingDataPostInTypeRef.typeId], PopulateClientSpamTrainingDataPostInTypeRef), values)
}

export type PopulateClientSpamTrainingDataPostInParams = {
	mailOwnerGroup: Id

	populateClientSpamTrainingData: PopulateClientSpamTrainingDatum[]
}

export type PopulateClientSpamTrainingDataPostIn = {
	// == values

	_format: NumberString
	mailOwnerGroup: Id

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	populateClientSpamTrainingData: PopulateClientSpamTrainingDatum[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<PopulateClientSpamTrainingDataPostIn>
	_original: Nullable<PopulateClientSpamTrainingDataPostIn>
	isAdapter: false
}
export const SendDraftDeleteInTypeRef: TypeRef<SendDraftDeleteIn> = new TypeRef("tutanota", 1785)

export function createSendDraftDeleteIn(values: SendDraftDeleteInParams): SendDraftDeleteIn {
	return Object.assign(create(typeModels[SendDraftDeleteInTypeRef.typeId], SendDraftDeleteInTypeRef), values)
}

export type SendDraftDeleteInParams = {
	mail: IdTuple
	sendJob: null | IdTuple
}

export type SendDraftDeleteIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	mail: IdTuple
	sendJob: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SendDraftDeleteIn>
	_original: Nullable<SendDraftDeleteIn>
	isAdapter: false
}
export const SendDraftParametersTypeRef: TypeRef<SendDraftParameters> = new TypeRef("tutanota", 1788)

export function createSendDraftParameters(values: SendDraftParametersParams): SendDraftParameters {
	return Object.assign(create(typeModels[SendDraftParametersTypeRef.typeId], SendDraftParametersTypeRef), values)
}

export type SendDraftParametersParams = {
	language: string
	mailSessionKey: null | Uint8Array<ArrayBuffer>
	bucketEncMailSessionKey: null | Uint8Array<ArrayBuffer>
	senderNameUnencrypted: null | string
	plaintext: boolean
	calendarMethod: boolean
	sessionEncEncryptionAuthStatus: null | Uint8Array<ArrayBuffer>

	mail: IdTuple
	internalRecipientKeyData: InternalRecipientKeyData[]
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[]
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[]
	attachmentKeyData: AttachmentKeyData[]
}

export type SendDraftParameters = {
	// == values

	_id: Id
	language: string
	mailSessionKey: null | Uint8Array<ArrayBuffer>
	bucketEncMailSessionKey: null | Uint8Array<ArrayBuffer>
	senderNameUnencrypted: null | string
	plaintext: boolean
	calendarMethod: boolean
	sessionEncEncryptionAuthStatus: null | Uint8Array<ArrayBuffer>

	// == associations

	mail: IdTuple
	internalRecipientKeyData: InternalRecipientKeyData[]
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[]
	symEncInternalRecipientKeyData: SymEncInternalRecipientKeyData[]
	attachmentKeyData: AttachmentKeyData[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<SendDraftParameters>
	_original: Nullable<SendDraftParameters>
	isAdapter: false
}
export const OAuthTokenEndpointResponseTypeRef: TypeRef<OAuthTokenEndpointResponse> = new TypeRef("tutanota", 1860)

export function createOAuthTokenEndpointResponse(values: OAuthTokenEndpointResponseParams): OAuthTokenEndpointResponse {
	return Object.assign(create(typeModels[OAuthTokenEndpointResponseTypeRef.typeId], OAuthTokenEndpointResponseTypeRef), values)
}

export type OAuthTokenEndpointResponseParams = {
	accessToken: string
	refreshToken: null | string
	expiresIn: null | NumberString
	tokenType: string
}

export type OAuthTokenEndpointResponse = {
	// == values

	_id: Id
	accessToken: string
	refreshToken: null | string
	expiresIn: null | NumberString
	tokenType: string

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<OAuthTokenEndpointResponse>
	_original: Nullable<OAuthTokenEndpointResponse>
	isAdapter: false
}
export const ImapAccountTypeRef: TypeRef<ImapAccount> = new TypeRef("tutanota", 1866)

export function createImapAccount(values: ImapAccountParams): ImapAccount {
	return Object.assign(create(typeModels[ImapAccountTypeRef.typeId], ImapAccountTypeRef), values)
}

export type ImapAccountParams = {
	host: string
	port: NumberString
	username: string
	password: null | string
	ignoreCertificateErrors: boolean
	customCertificateData: null | Uint8Array<ArrayBuffer>
	useSSL: null | boolean

	oAuthTokenEndpointResponse: null | OAuthTokenEndpointResponse
}

export type ImapAccount = {
	// == values

	_id: Id
	host: string
	port: NumberString
	username: string
	password: null | string
	ignoreCertificateErrors: boolean
	customCertificateData: null | Uint8Array<ArrayBuffer>
	useSSL: null | boolean

	// == associations

	oAuthTokenEndpointResponse: null | OAuthTokenEndpointResponse

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapAccount>
	_original: Nullable<ImapAccount>
	isAdapter: false
}
export const ImportedImapMailTypeRef: TypeRef<ImportedImapMail> = new TypeRef("tutanota", 1873)

export function createImportedImapMail(values: ImportedImapMailParams): ImportedImapMail {
	return Object.assign(create(typeModels[ImportedImapMailTypeRef.typeId], ImportedImapMailTypeRef), values)
}

export type ImportedImapMailParams = {
	imapUid: NumberString
	imapModSeq: null | NumberString
	messageId: string
	sourceId: null | string

	mailSetEntry: IdTuple
}

export type ImportedImapMail = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	imapUid: NumberString
	imapModSeq: null | NumberString
	messageId: string
	sourceId: null | string

	// == associations

	mailSetEntry: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImportedImapMail>
	_original: Nullable<ImportedImapMail>
	isAdapter: false
}
export const DeduplicatedImportedAttachmentTypeRef: TypeRef<DeduplicatedImportedAttachment> = new TypeRef("tutanota", 1883)

export function createDeduplicatedImportedAttachment(values: DeduplicatedImportedAttachmentParams): DeduplicatedImportedAttachment {
	return Object.assign(create(typeModels[DeduplicatedImportedAttachmentTypeRef.typeId], DeduplicatedImportedAttachmentTypeRef), values)
}

export type DeduplicatedImportedAttachmentParams = {
	attachmentHash: string

	attachment: IdTuple
}

export type DeduplicatedImportedAttachment = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>
	attachmentHash: string

	// == associations

	attachment: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DeduplicatedImportedAttachment>
	_errors: Object
	_original: Nullable<DeduplicatedImportedAttachment>
	isAdapter: false
}
export const ImapFolderSyncStateTypeRef: TypeRef<ImapFolderSyncState> = new TypeRef("tutanota", 1895)

export function createImapFolderSyncState(values: ImapFolderSyncStateParams): ImapFolderSyncState {
	return Object.assign(create(typeModels[ImapFolderSyncStateTypeRef.typeId], ImapFolderSyncStateTypeRef), values)
}

export type ImapFolderSyncStateParams = {
	path: string
	status: NumberString
	uidvalidity: null | NumberString
	uidnext: null | NumberString
	highestmodseq: null | NumberString
	imapSpecialUse: null | string

	importedMails: Id
	mailSet: null | IdTuple
	imapAccountSyncState: IdTuple
}

export type ImapFolderSyncState = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>
	path: string
	status: NumberString
	uidvalidity: null | NumberString
	uidnext: null | NumberString
	highestmodseq: null | NumberString
	imapSpecialUse: null | string

	// == associations

	importedMails: Id
	mailSet: null | IdTuple
	imapAccountSyncState: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapFolderSyncState>
	_errors: Object
	_original: Nullable<ImapFolderSyncState>
	isAdapter: false
}
export const ImapAccountSyncStateTypeRef: TypeRef<ImapAccountSyncState> = new TypeRef("tutanota", 1911)

export function createImapAccountSyncState(values: ImapAccountSyncStateParams): ImapAccountSyncState {
	return Object.assign(create(typeModels[ImapAccountSyncStateTypeRef.typeId], ImapAccountSyncStateTypeRef), values)
}

export type ImapAccountSyncStateParams = {
	maxQuota: NumberString
	postponedUntil: NumberString
	provider: NumberString
	status: NumberString
	importedMailCount: null | NumberString

	imapFolderSyncStateList: Id
	imapAccount: ImapAccount
	rootImportMailSet: null | IdTuple
	imapSyncLabel: null | IdTuple
}

export type ImapAccountSyncState = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	_kdfNonce: null | Uint8Array<ArrayBuffer>
	maxQuota: NumberString
	postponedUntil: NumberString
	provider: NumberString
	status: NumberString
	importedMailCount: null | NumberString

	// == associations

	imapFolderSyncStateList: Id
	imapAccount: ImapAccount
	rootImportMailSet: null | IdTuple
	imapSyncLabel: null | IdTuple

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapAccountSyncState>
	_errors: Object
	_original: Nullable<ImapAccountSyncState>
	isAdapter: false
}
export const ImapFolderPostInTypeRef: TypeRef<ImapFolderPostIn> = new TypeRef("tutanota", 1929)

export function createImapFolderPostIn(values: ImapFolderPostInParams): ImapFolderPostIn {
	return Object.assign(create(typeModels[ImapFolderPostInTypeRef.typeId], ImapFolderPostInTypeRef), values)
}

export type ImapFolderPostInParams = {
	path: string
	shouldSync: boolean
	imapSpecialUse: null | string

	imapAccountSyncState: IdTuple
	mailSet: null | IdTuple
}

export type ImapFolderPostIn = {
	// == values

	_format: NumberString
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString
	ownerGroup: Id
	path: string
	shouldSync: boolean
	imapSpecialUse: null | string

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	imapAccountSyncState: IdTuple
	mailSet: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapFolderPostIn>
	_errors: Object
	_original: Nullable<ImapFolderPostIn>
	isAdapter: false
}
export const ImapFolderPostOutTypeRef: TypeRef<ImapFolderPostOut> = new TypeRef("tutanota", 1937)

export function createImapFolderPostOut(values: ImapFolderPostOutParams): ImapFolderPostOut {
	return Object.assign(create(typeModels[ImapFolderPostOutTypeRef.typeId], ImapFolderPostOutTypeRef), values)
}

export type ImapFolderPostOutParams = {
	imapFolderSyncState: IdTuple
}

export type ImapFolderPostOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	imapFolderSyncState: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapFolderPostOut>
	_original: Nullable<ImapFolderPostOut>
	isAdapter: false
}
export const ImapFolderDeleteInTypeRef: TypeRef<ImapFolderDeleteIn> = new TypeRef("tutanota", 1940)

export function createImapFolderDeleteIn(values: ImapFolderDeleteInParams): ImapFolderDeleteIn {
	return Object.assign(create(typeModels[ImapFolderDeleteInTypeRef.typeId], ImapFolderDeleteInTypeRef), values)
}

export type ImapFolderDeleteInParams = {
	imapFolderSyncState: IdTuple
}

export type ImapFolderDeleteIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	imapFolderSyncState: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapFolderDeleteIn>
	_original: Nullable<ImapFolderDeleteIn>
	isAdapter: false
}
export const ImapPostInTypeRef: TypeRef<ImapPostIn> = new TypeRef("tutanota", 1944)

export function createImapPostIn(values: ImapPostInParams): ImapPostIn {
	return Object.assign(create(typeModels[ImapPostInTypeRef.typeId], ImapPostInTypeRef), values)
}

export type ImapPostInParams = {
	maxQuota: NumberString
	postponedUntil: NumberString
	provider: NumberString

	imapAccount: ImapAccount
	rootImportMailSet: null | IdTuple
	syncLabel: null | IdTuple
}

export type ImapPostIn = {
	// == values

	_format: NumberString
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString
	ownerGroup: Id
	maxQuota: NumberString
	postponedUntil: NumberString
	provider: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	imapAccount: ImapAccount
	rootImportMailSet: null | IdTuple
	syncLabel: null | IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapPostIn>
	_errors: Object
	_original: Nullable<ImapPostIn>
	isAdapter: false
}
export const ImapPostOutTypeRef: TypeRef<ImapPostOut> = new TypeRef("tutanota", 1955)

export function createImapPostOut(values: ImapPostOutParams): ImapPostOut {
	return Object.assign(create(typeModels[ImapPostOutTypeRef.typeId], ImapPostOutTypeRef), values)
}

export type ImapPostOutParams = {
	imapAccountSyncState: IdTuple
}

export type ImapPostOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	imapAccountSyncState: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapPostOut>
	_original: Nullable<ImapPostOut>
	isAdapter: false
}
export const ImapDeleteInTypeRef: TypeRef<ImapDeleteIn> = new TypeRef("tutanota", 1958)

export function createImapDeleteIn(values: ImapDeleteInParams): ImapDeleteIn {
	return Object.assign(create(typeModels[ImapDeleteInTypeRef.typeId], ImapDeleteInTypeRef), values)
}

export type ImapDeleteInParams = {
	imapAccountSyncState: IdTuple
}

export type ImapDeleteIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	imapAccountSyncState: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapDeleteIn>
	_original: Nullable<ImapDeleteIn>
	isAdapter: false
}
export const ImapOauthConfigGetInTypeRef: TypeRef<ImapOauthConfigGetIn> = new TypeRef("tutanota", 1969)

export function createImapOauthConfigGetIn(values: ImapOauthConfigGetInParams): ImapOauthConfigGetIn {
	return Object.assign(create(typeModels[ImapOauthConfigGetInTypeRef.typeId], ImapOauthConfigGetInTypeRef), values)
}

export type ImapOauthConfigGetInParams = {
	clientId: string
}

export type ImapOauthConfigGetIn = {
	// == values

	_format: NumberString
	clientId: string
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapOauthConfigGetIn>
	_original: Nullable<ImapOauthConfigGetIn>
	isAdapter: false
}
export const ImapOauthConfigGetOutTypeRef: TypeRef<ImapOauthConfigGetOut> = new TypeRef("tutanota", 1972)

export function createImapOauthConfigGetOut(values: ImapOauthConfigGetOutParams): ImapOauthConfigGetOut {
	return Object.assign(create(typeModels[ImapOauthConfigGetOutTypeRef.typeId], ImapOauthConfigGetOutTypeRef), values)
}

export type ImapOauthConfigGetOutParams = {
	clientSecret: string
}

export type ImapOauthConfigGetOut = {
	// == values

	_format: NumberString
	clientSecret: string
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapOauthConfigGetOut>
	_original: Nullable<ImapOauthConfigGetOut>
	isAdapter: false
}
export const ImapPutInTypeRef: TypeRef<ImapPutIn> = new TypeRef("tutanota", 1979)

export function createImapPutIn(values: ImapPutInParams): ImapPutIn {
	return Object.assign(create(typeModels[ImapPutInTypeRef.typeId], ImapPutInTypeRef), values)
}

export type ImapPutInParams = {
	newImapAccountSyncStatus: NumberString
	newImapFolderSyncStatus: NumberString
	newPostponedUntil: null | string

	imapAccountSyncState: IdTuple
}

export type ImapPutIn = {
	// == values

	_format: NumberString
	newImapAccountSyncStatus: NumberString
	newImapFolderSyncStatus: NumberString
	newPostponedUntil: null | string

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	imapAccountSyncState: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<ImapPutIn>
	_original: Nullable<ImapPutIn>
	isAdapter: false
}
