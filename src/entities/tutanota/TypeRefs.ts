import { create, StrippedEntity } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import { AggregatedEntity, ElementEntity, Entity, ListElementEntity, BlobElementEntity, DataTransferEntity, AttributeId } from "@tutao/meta"
import { Blob } from '../sys/TypeRefs.js'
import { BucketKey } from '../sys/TypeRefs.js'
import { BlobReferenceTokenWrapper } from '../sys/TypeRefs.js'
import { DateWrapper } from '../sys/TypeRefs.js'
import { StringWrapper } from '../sys/TypeRefs.js'
import { GeneratedIdWrapper } from '../sys/TypeRefs.js'
import { IdTupleWrapper } from '../sys/TypeRefs.js'
import { InstanceSessionKey } from '../sys/TypeRefs.js'

export const SubfilesTypeRef: TypeRef<Subfiles> = new TypeRef("tutanota", 11)

export function createSubfiles(values: StrippedEntity<Subfiles>): Subfiles {
    return Object.assign(create(typeModels[SubfilesTypeRef.typeId], SubfilesTypeRef), values)
}

export type SubfilesParams = {

	_id: Id;

	files: Id;
}

export class Subfiles extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Subfiles> { return SubfilesTypeRef };
	

	get _id(): Id { return this._attrs[12] }
	

	get files(): Id { return this._attrs[12] }
}
export const FileTypeRef: TypeRef<File> = new TypeRef("tutanota", 13)

export function createFile(values: StrippedEntity<File>): File {
    return Object.assign(create(typeModels[FileTypeRef.typeId], FileTypeRef), values)
}

export type FileParams = {

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

export class File extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<File> { return FileTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[15] }
	get _permissions(): Id { return this._attrs[16] }
	get _format(): NumberString { return this._attrs[17] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[18] }
	get name(): string { return this._attrs[21] }
	get size(): NumberString { return this._attrs[22] }
	get mimeType(): null | string { return this._attrs[23] }
	get _ownerGroup(): null | Id { return this._attrs[580] }
	get cid(): null | string { return this._attrs[924] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1391] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1831] }
	

	get parent(): null | IdTuple { return this._attrs[1831] }
	get subFiles(): null | Subfiles { return this._attrs[1831] }
	get blobs(): Blob[] { return this._attrs[1831] }
}
export const FileSystemTypeRef: TypeRef<FileSystem> = new TypeRef("tutanota", 28)

export function createFileSystem(values: StrippedEntity<FileSystem>): FileSystem {
    return Object.assign(create(typeModels[FileSystemTypeRef.typeId], FileSystemTypeRef), values)
}

export type FileSystemParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	files: Id;
}

export class FileSystem extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<FileSystem> { return FileSystemTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[30] }
	get _permissions(): Id { return this._attrs[31] }
	get _format(): NumberString { return this._attrs[32] }
	get _ownerGroup(): null | Id { return this._attrs[581] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[582] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1392] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1834] }
	

	get files(): Id { return this._attrs[1834] }
}
export const ContactMailAddressTypeRef: TypeRef<ContactMailAddress> = new TypeRef("tutanota", 44)

export function createContactMailAddress(values: StrippedEntity<ContactMailAddress>): ContactMailAddress {
    return Object.assign(create(typeModels[ContactMailAddressTypeRef.typeId], ContactMailAddressTypeRef), values)
}

export type ContactMailAddressParams = {

	_id: Id;
	type: NumberString;
	address: string;
	customTypeName: string;
}

export class ContactMailAddress extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactMailAddress> { return ContactMailAddressTypeRef };
	

	get _id(): Id { return this._attrs[45] }
	get type(): NumberString { return this._attrs[46] }
	get address(): string { return this._attrs[47] }
	get customTypeName(): string { return this._attrs[48] }
    set customTypeName(v: string) { this._attrs[48] = v }
	
}
export const ContactPhoneNumberTypeRef: TypeRef<ContactPhoneNumber> = new TypeRef("tutanota", 49)

export function createContactPhoneNumber(values: StrippedEntity<ContactPhoneNumber>): ContactPhoneNumber {
    return Object.assign(create(typeModels[ContactPhoneNumberTypeRef.typeId], ContactPhoneNumberTypeRef), values)
}

export type ContactPhoneNumberParams = {

	_id: Id;
	type: NumberString;
	number: string;
	customTypeName: string;
}

export class ContactPhoneNumber extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactPhoneNumber> { return ContactPhoneNumberTypeRef };
	

	get _id(): Id { return this._attrs[50] }
	get type(): NumberString { return this._attrs[51] }
	get number(): string { return this._attrs[52] }
	get customTypeName(): string { return this._attrs[53] }
    set customTypeName(v: string) { this._attrs[53] = v }
	
}
export const ContactAddressTypeRef: TypeRef<ContactAddress> = new TypeRef("tutanota", 54)

export function createContactAddress(values: StrippedEntity<ContactAddress>): ContactAddress {
    return Object.assign(create(typeModels[ContactAddressTypeRef.typeId], ContactAddressTypeRef), values)
}

export type ContactAddressParams = {

	_id: Id;
	type: NumberString;
	address: string;
	customTypeName: string;
}

export class ContactAddress extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactAddress> { return ContactAddressTypeRef };
	

	get _id(): Id { return this._attrs[55] }
	get type(): NumberString { return this._attrs[56] }
	get address(): string { return this._attrs[57] }
	get customTypeName(): string { return this._attrs[58] }
    set customTypeName(v: string) { this._attrs[58] = v }
	
}
export const ContactSocialIdTypeRef: TypeRef<ContactSocialId> = new TypeRef("tutanota", 59)

export function createContactSocialId(values: StrippedEntity<ContactSocialId>): ContactSocialId {
    return Object.assign(create(typeModels[ContactSocialIdTypeRef.typeId], ContactSocialIdTypeRef), values)
}

export type ContactSocialIdParams = {

	_id: Id;
	type: NumberString;
	socialId: string;
	customTypeName: string;
}

export class ContactSocialId extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactSocialId> { return ContactSocialIdTypeRef };
	

	get _id(): Id { return this._attrs[60] }
	get type(): NumberString { return this._attrs[61] }
	get socialId(): string { return this._attrs[62] }
	get customTypeName(): string { return this._attrs[63] }
    set customTypeName(v: string) { this._attrs[63] = v }
	
}
export const ContactTypeRef: TypeRef<Contact> = new TypeRef("tutanota", 64)

export function createContact(values: StrippedEntity<Contact>): Contact {
    return Object.assign(create(typeModels[ContactTypeRef.typeId], ContactTypeRef), values)
}

export type ContactParams = {

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

export class Contact extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Contact> { return ContactTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[66] }
	get _permissions(): Id { return this._attrs[67] }
	get _format(): NumberString { return this._attrs[68] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[69] }
	get firstName(): string { return this._attrs[72] }
	get lastName(): string { return this._attrs[73] }
	get company(): string { return this._attrs[74] }
	get role(): string { return this._attrs[75] }
	get oldBirthdayDate(): null | Date { return this._attrs[76] }
	get comment(): string { return this._attrs[77] }
	get presharedPassword(): null | string { return this._attrs[79] }
	get _ownerGroup(): null | Id { return this._attrs[585] }
	get nickname(): null | string { return this._attrs[849] }
	get title(): null | string { return this._attrs[850] }
	get birthdayIso(): null | string { return this._attrs[1083] }
	get middleName(): null | string { return this._attrs[1380] }
	get nameSuffix(): null | string { return this._attrs[1381] }
	get phoneticFirst(): null | string { return this._attrs[1382] }
	get phoneticMiddle(): null | string { return this._attrs[1383] }
	get phoneticLast(): null | string { return this._attrs[1384] }
	get department(): null | string { return this._attrs[1385] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1394] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1837] }
	

	get mailAddresses(): ContactMailAddress[] { return this._attrs[1837] }
	set mailAddresses(a: ContactMailAddress[])  { this._attrs[80] = a } 
	get phoneNumbers(): ContactPhoneNumber[] { return this._attrs[1837] }
	set phoneNumbers(a: ContactPhoneNumber[])  { this._attrs[81] = a } 
	get addresses(): ContactAddress[] { return this._attrs[1837] }
	set addresses(a: ContactAddress[])  { this._attrs[82] = a } 
	get socialIds(): ContactSocialId[] { return this._attrs[1837] }
	set socialIds(a: ContactSocialId[])  { this._attrs[83] = a } 
	get oldBirthdayAggregate(): null | Birthday { return this._attrs[1837] }
	set oldBirthdayAggregate(a: Birthday)  { this._attrs[851] = a } 
	get photo(): null | IdTuple { return this._attrs[1837] }
	set photo(a: IdTuple)  { this._attrs[852] = a } 
	get customDate(): ContactCustomDate[] { return this._attrs[1837] }
	set customDate(a: ContactCustomDate[])  { this._attrs[1386] = a } 
	get websites(): ContactWebsite[] { return this._attrs[1837] }
	set websites(a: ContactWebsite[])  { this._attrs[1387] = a } 
	get relationships(): ContactRelationship[] { return this._attrs[1837] }
	set relationships(a: ContactRelationship[])  { this._attrs[1388] = a } 
	get messengerHandles(): ContactMessengerHandle[] { return this._attrs[1837] }
	set messengerHandles(a: ContactMessengerHandle[])  { this._attrs[1389] = a } 
	get pronouns(): ContactPronouns[] { return this._attrs[1837] }
	set pronouns(a: ContactPronouns[])  { this._attrs[1390] = a } 
}
export const ConversationEntryTypeRef: TypeRef<ConversationEntry> = new TypeRef("tutanota", 84)

export function createConversationEntry(values: StrippedEntity<ConversationEntry>): ConversationEntry {
    return Object.assign(create(typeModels[ConversationEntryTypeRef.typeId], ConversationEntryTypeRef), values)
}

export type ConversationEntryParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	messageId: string;
	conversationType: NumberString;
	_ownerGroup: null | Id;

	previous: null | IdTuple;
	mail: null | IdTuple;
}

export class ConversationEntry extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ConversationEntry> { return ConversationEntryTypeRef };
	

	get _id(): IdTuple { return this._attrs[118] }
	get _permissions(): Id { return this._attrs[119] }
	get _format(): NumberString { return this._attrs[120] }
	get messageId(): string { return this._attrs[121] }
	get conversationType(): NumberString { return this._attrs[122] }
	get _ownerGroup(): null | Id { return this._attrs[588] }
	

	get previous(): null | IdTuple { return this._attrs[588] }
	get mail(): null | IdTuple { return this._attrs[588] }
}
export const MailAddressTypeRef: TypeRef<MailAddress> = new TypeRef("tutanota", 92)

export function createMailAddress(values: StrippedEntity<MailAddress>): MailAddress {
    return Object.assign(create(typeModels[MailAddressTypeRef.typeId], MailAddressTypeRef), values)
}

export type MailAddressParams = {

	_id: Id;
	name: string;
	address: string;

	contact: null | IdTuple;
}

export class MailAddress extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddress> { return MailAddressTypeRef };
	

	get _id(): Id { return this._attrs[93] }
	get name(): string { return this._attrs[94] }
	get address(): string { return this._attrs[95] }
	

	get contact(): null | IdTuple { return this._attrs[95] }
	set contact(a: IdTuple)  { this._attrs[96] = a } 
}
export const MailTypeRef: TypeRef<Mail> = new TypeRef("tutanota", 97)

export function createMail(values: StrippedEntity<Mail>): Mail {
    return Object.assign(create(typeModels[MailTypeRef.typeId], MailTypeRef), values)
}

export type MailParams = {

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

export class Mail extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Mail> { return MailTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[99] }
	get _permissions(): Id { return this._attrs[100] }
	get _format(): NumberString { return this._attrs[101] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[102] }
	get subject(): string { return this._attrs[105] }
	get receivedDate(): Date { return this._attrs[107] }
	get state(): NumberString { return this._attrs[108] }
	get unread(): boolean { return this._attrs[109] }
	get confidential(): boolean { return this._attrs[426] }
	get replyType(): NumberString { return this._attrs[466] }
	get _ownerGroup(): null | Id { return this._attrs[587] }
	get differentEnvelopeSender(): null | string { return this._attrs[617] }
	get listUnsubscribe(): boolean { return this._attrs[866] }
	get movedTime(): null | Date { return this._attrs[896] }
	get phishingStatus(): NumberString { return this._attrs[1021] }
	get authStatus(): null | NumberString { return this._attrs[1022] }
	get method(): NumberString { return this._attrs[1120] }
	get recipientCount(): NumberString { return this._attrs[1307] }
	get encryptionAuthStatus(): null | NumberString { return this._attrs[1346] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1395] }
	get processingState(): NumberString { return this._attrs[1728] }
	get processNeeded(): boolean { return this._attrs[1769] }
	get sendAt(): null | Date { return this._attrs[1784] }
	get serverClassificationData(): null | string { return this._attrs[1814] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1839] }
	

	get sender(): MailAddress { return this._attrs[1839] }
	get attachments(): IdTuple[] { return this._attrs[1839] }
	get conversationEntry(): IdTuple { return this._attrs[1839] }
	get firstRecipient(): null | MailAddress { return this._attrs[1839] }
	get mailDetails(): null | IdTuple { return this._attrs[1839] }
	get mailDetailsDraft(): null | IdTuple { return this._attrs[1839] }
	get bucketKey(): null | BucketKey { return this._attrs[1839] }
	get sets(): IdTuple[] { return this._attrs[1839] }
	set sets(a: IdTuple[])  { this._attrs[1465] = a } 
	get clientSpamClassifierResult(): null | ClientSpamClassifierResult { return this._attrs[1839] }
	set clientSpamClassifierResult(a: ClientSpamClassifierResult)  { this._attrs[1729] = a } 
}
export const MailBoxTypeRef: TypeRef<MailBox> = new TypeRef("tutanota", 125)

export function createMailBox(values: StrippedEntity<MailBox>): MailBox {
    return Object.assign(create(typeModels[MailBoxTypeRef.typeId], MailBoxTypeRef), values)
}

export type MailBoxParams = {

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

export class MailBox extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailBox> { return MailBoxTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[127] }
	get _permissions(): Id { return this._attrs[128] }
	get _format(): NumberString { return this._attrs[129] }
	get lastInfoDate(): Date { return this._attrs[569] }
	get _ownerGroup(): null | Id { return this._attrs[590] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[591] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1396] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1840] }
	

	get sentAttachments(): Id { return this._attrs[1840] }
	get receivedAttachments(): Id { return this._attrs[1840] }
	get mailSets(): MailSetRef { return this._attrs[1840] }
	get spamResults(): SpamResults { return this._attrs[1840] }
	get mailDetailsDrafts(): null | MailDetailsDraftsRef { return this._attrs[1840] }
	set mailDetailsDrafts(a: MailDetailsDraftsRef)  { this._attrs[1318] = a } 
	get archivedMailBags(): MailBag[] { return this._attrs[1840] }
	set archivedMailBags(a: MailBag[])  { this._attrs[1463] = a } 
	get currentMailBag(): null | MailBag { return this._attrs[1840] }
	set currentMailBag(a: MailBag)  { this._attrs[1464] = a } 
	get importedAttachments(): Id { return this._attrs[1840] }
	get importFileMailStates(): Id { return this._attrs[1840] }
	get extractedFeatures(): Id { return this._attrs[1840] }
	get clientSpamTrainingData(): Id { return this._attrs[1840] }
	get modifiedClientSpamTrainingDataIndex(): Id { return this._attrs[1840] }
	get imapAccountSyncStates(): null | Id { return this._attrs[1840] }
	get deduplicatedImportedAttachments(): null | Id { return this._attrs[1840] }
}
export const CreateExternalUserGroupDataTypeRef: TypeRef<CreateExternalUserGroupData> = new TypeRef("tutanota", 138)

export function createCreateExternalUserGroupData(values: StrippedEntity<CreateExternalUserGroupData>): CreateExternalUserGroupData {
    return Object.assign(create(typeModels[CreateExternalUserGroupDataTypeRef.typeId], CreateExternalUserGroupDataTypeRef), values)
}

export type CreateExternalUserGroupDataParams = {

	_id: Id;
	mailAddress: string;
	externalPwEncUserGroupKey: Uint8Array;
	internalUserEncUserGroupKey: Uint8Array;
	internalUserGroupKeyVersion: NumberString;
}

export class CreateExternalUserGroupData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateExternalUserGroupData> { return CreateExternalUserGroupDataTypeRef };
	

	get _id(): Id { return this._attrs[139] }
	get mailAddress(): string { return this._attrs[141] }
	get externalPwEncUserGroupKey(): Uint8Array { return this._attrs[142] }
	get internalUserEncUserGroupKey(): Uint8Array { return this._attrs[143] }
	get internalUserGroupKeyVersion(): NumberString { return this._attrs[1433] }
    set internalUserGroupKeyVersion(v: NumberString) { this._attrs[1433] = v }
	
}
export const ExternalUserDataTypeRef: TypeRef<ExternalUserData> = new TypeRef("tutanota", 145)

export function createExternalUserData(values: StrippedEntity<ExternalUserData>): ExternalUserData {
    return Object.assign(create(typeModels[ExternalUserDataTypeRef.typeId], ExternalUserDataTypeRef), values)
}

export type ExternalUserDataParams = {

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

export class ExternalUserData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ExternalUserData> { return ExternalUserDataTypeRef };
	

	get _format(): NumberString { return this._attrs[146] }
	get externalUserEncMailGroupKey(): Uint8Array { return this._attrs[148] }
	get verifier(): Uint8Array { return this._attrs[149] }
	get externalUserEncUserGroupInfoSessionKey(): Uint8Array { return this._attrs[150] }
	get externalUserEncEntropy(): Uint8Array { return this._attrs[412] }
	get internalMailEncUserGroupInfoSessionKey(): Uint8Array { return this._attrs[669] }
	get externalMailEncMailGroupInfoSessionKey(): Uint8Array { return this._attrs[670] }
	get internalMailEncMailGroupInfoSessionKey(): Uint8Array { return this._attrs[671] }
	get externalUserEncTutanotaPropertiesSessionKey(): Uint8Array { return this._attrs[672] }
	get externalMailEncMailBoxSessionKey(): Uint8Array { return this._attrs[673] }
	get kdfVersion(): NumberString { return this._attrs[1323] }
	get internalMailGroupKeyVersion(): NumberString { return this._attrs[1429] }
    set internalMailGroupKeyVersion(v: NumberString) { this._attrs[1429] = v }
	

	get userGroupData(): CreateExternalUserGroupData { return this._attrs[1429] }
	set userGroupData(a: CreateExternalUserGroupData)  { this._attrs[151] = a } 
}
export const ContactListTypeRef: TypeRef<ContactList> = new TypeRef("tutanota", 153)

export function createContactList(values: StrippedEntity<ContactList>): ContactList {
    return Object.assign(create(typeModels[ContactListTypeRef.typeId], ContactListTypeRef), values)
}

export type ContactListParams = {

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

export class ContactList extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactList> { return ContactListTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[155] }
	get _permissions(): Id { return this._attrs[156] }
	get _format(): NumberString { return this._attrs[157] }
	get _ownerGroup(): null | Id { return this._attrs[592] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[593] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1397] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1843] }
	

	get contacts(): Id { return this._attrs[1843] }
	get photos(): null | PhotosRef { return this._attrs[1843] }
	set photos(a: PhotosRef)  { this._attrs[856] = a } 
}
export const RemoteImapSyncInfoTypeRef: TypeRef<RemoteImapSyncInfo> = new TypeRef("tutanota", 183)

export function createRemoteImapSyncInfo(values: StrippedEntity<RemoteImapSyncInfo>): RemoteImapSyncInfo {
    return Object.assign(create(typeModels[RemoteImapSyncInfoTypeRef.typeId], RemoteImapSyncInfoTypeRef), values)
}

export type RemoteImapSyncInfoParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	seen: boolean;
	_ownerGroup: null | Id;

	message: IdTuple;
}

export class RemoteImapSyncInfo extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RemoteImapSyncInfo> { return RemoteImapSyncInfoTypeRef };
	

	get _id(): IdTuple { return this._attrs[185] }
	get _permissions(): Id { return this._attrs[186] }
	get _format(): NumberString { return this._attrs[187] }
	get seen(): boolean { return this._attrs[189] }
	get _ownerGroup(): null | Id { return this._attrs[594] }
	

	get message(): IdTuple { return this._attrs[594] }
	set message(a: IdTuple)  { this._attrs[188] = a } 
}
export const ImapFolderTypeRef: TypeRef<ImapFolder> = new TypeRef("tutanota", 190)

export function createImapFolder(values: StrippedEntity<ImapFolder>): ImapFolder {
    return Object.assign(create(typeModels[ImapFolderTypeRef.typeId], ImapFolderTypeRef), values)
}

export type ImapFolderParams = {

	_id: Id;
	name: string;
	lastseenuid: string;
	uidvalidity: string;

	syncInfo: Id;
}

export class ImapFolder extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapFolder> { return ImapFolderTypeRef };
	

	get _id(): Id { return this._attrs[191] }
	get name(): string { return this._attrs[192] }
	get lastseenuid(): string { return this._attrs[193] }
	get uidvalidity(): string { return this._attrs[194] }
    set uidvalidity(v: string) { this._attrs[194] = v }
	

	get syncInfo(): Id { return this._attrs[194] }
}
export const ImapSyncStateTypeRef: TypeRef<ImapSyncState> = new TypeRef("tutanota", 196)

export function createImapSyncState(values: StrippedEntity<ImapSyncState>): ImapSyncState {
    return Object.assign(create(typeModels[ImapSyncStateTypeRef.typeId], ImapSyncStateTypeRef), values)
}

export type ImapSyncStateParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	folders: ImapFolder[];
}

export class ImapSyncState extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapSyncState> { return ImapSyncStateTypeRef };
	

	get _id(): Id { return this._attrs[198] }
	get _permissions(): Id { return this._attrs[199] }
	get _format(): NumberString { return this._attrs[200] }
	get _ownerGroup(): null | Id { return this._attrs[595] }
	

	get folders(): ImapFolder[] { return this._attrs[595] }
	set folders(a: ImapFolder[])  { this._attrs[201] = a } 
}
export const ImapSyncConfigurationTypeRef: TypeRef<ImapSyncConfiguration> = new TypeRef("tutanota", 209)

export function createImapSyncConfiguration(values: StrippedEntity<ImapSyncConfiguration>): ImapSyncConfiguration {
    return Object.assign(create(typeModels[ImapSyncConfigurationTypeRef.typeId], ImapSyncConfigurationTypeRef), values)
}

export type ImapSyncConfigurationParams = {

	_id: Id;
	host: string;
	port: NumberString;
	user: string;
	password: string;

	imapSyncState: null | Id;
}

export class ImapSyncConfiguration extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapSyncConfiguration> { return ImapSyncConfigurationTypeRef };
	

	get _id(): Id { return this._attrs[210] }
	get host(): string { return this._attrs[211] }
	get port(): NumberString { return this._attrs[212] }
	get user(): string { return this._attrs[213] }
	get password(): string { return this._attrs[214] }
    set password(v: string) { this._attrs[214] = v }
	

	get imapSyncState(): null | Id { return this._attrs[214] }
	set imapSyncState(a: Id)  { this._attrs[215] = a } 
}
export const TutanotaPropertiesTypeRef: TypeRef<TutanotaProperties> = new TypeRef("tutanota", 216)

export function createTutanotaProperties(values: StrippedEntity<TutanotaProperties>): TutanotaProperties {
    return Object.assign(create(typeModels[TutanotaPropertiesTypeRef.typeId], TutanotaPropertiesTypeRef), values)
}

export type TutanotaPropertiesParams = {

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

export class TutanotaProperties extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<TutanotaProperties> { return TutanotaPropertiesTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[218] }
	get _permissions(): Id { return this._attrs[219] }
	get _format(): NumberString { return this._attrs[220] }
	get userEncEntropy(): null | Uint8Array { return this._attrs[410] }
	get notificationMailLanguage(): null | string { return this._attrs[418] }
	get defaultSender(): null | string { return this._attrs[469] }
	get defaultUnconfidential(): boolean { return this._attrs[470] }
	get customEmailSignature(): string { return this._attrs[471] }
	get emailSignatureType(): NumberString { return this._attrs[472] }
	get noAutomaticContacts(): boolean { return this._attrs[568] }
	get _ownerGroup(): null | Id { return this._attrs[597] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[598] }
	get sendPlaintextOnly(): boolean { return this._attrs[676] }
	get lastSeenAnnouncement(): NumberString { return this._attrs[897] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1398] }
	get userKeyVersion(): null | NumberString { return this._attrs[1434] }
	get defaultLabelCreated(): boolean { return this._attrs[1510] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1851] }
	

	get lastPushedMail(): null | IdTuple { return this._attrs[1851] }
	set lastPushedMail(a: IdTuple)  { this._attrs[221] = a } 
	get imapSyncConfig(): ImapSyncConfiguration[] { return this._attrs[1851] }
	set imapSyncConfig(a: ImapSyncConfiguration[])  { this._attrs[222] = a } 
	get inboxRules(): InboxRule[] { return this._attrs[1851] }
	set inboxRules(a: InboxRule[])  { this._attrs[578] = a } 
}
export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", 223)

export function createNotificationMail(values: StrippedEntity<NotificationMail>): NotificationMail {
    return Object.assign(create(typeModels[NotificationMailTypeRef.typeId], NotificationMailTypeRef), values)
}

export type NotificationMailParams = {

	_id: Id;
	subject: string;
	bodyText: string;
	recipientMailAddress: string;
	recipientName: string;
	mailboxLink: string;
}

export class NotificationMail extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NotificationMail> { return NotificationMailTypeRef };
	

	get _id(): Id { return this._attrs[224] }
	get subject(): string { return this._attrs[225] }
	get bodyText(): string { return this._attrs[226] }
	get recipientMailAddress(): string { return this._attrs[227] }
	get recipientName(): string { return this._attrs[228] }
	get mailboxLink(): string { return this._attrs[417] }
    set mailboxLink(v: string) { this._attrs[417] = v }
	
}
export const DeleteMailDataTypeRef: TypeRef<DeleteMailData> = new TypeRef("tutanota", 419)

export function createDeleteMailData(values: StrippedEntity<DeleteMailData>): DeleteMailData {
    return Object.assign(create(typeModels[DeleteMailDataTypeRef.typeId], DeleteMailDataTypeRef), values)
}

export type DeleteMailDataParams = {

	_format: NumberString;

	mails: IdTuple[];
	folder: null | IdTuple;
}

export class DeleteMailData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DeleteMailData> { return DeleteMailDataTypeRef };
	

	get _format(): NumberString { return this._attrs[420] }
    set _format(v: NumberString) { this._attrs[420] = v }
	

	get mails(): IdTuple[] { return this._attrs[420] }
	set mails(a: IdTuple[])  { this._attrs[421] = a } 
	get folder(): null | IdTuple { return this._attrs[420] }
}
export const MailSetTypeRef: TypeRef<MailSet> = new TypeRef("tutanota", 429)

export function createMailSet(values: StrippedEntity<MailSet>): MailSet {
    return Object.assign(create(typeModels[MailSetTypeRef.typeId], MailSetTypeRef), values)
}

export type MailSetParams = {

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

export class MailSet extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailSet> { return MailSetTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[431] }
	get _permissions(): Id { return this._attrs[432] }
	get _format(): NumberString { return this._attrs[433] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[434] }
	get name(): string { return this._attrs[435] }
	get folderType(): NumberString { return this._attrs[436] }
	get _ownerGroup(): null | Id { return this._attrs[589] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1399] }
	get color(): null | string { return this._attrs[1479] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1847] }
	

	get parentFolder(): null | IdTuple { return this._attrs[1847] }
	get entries(): Id { return this._attrs[1847] }
}
export const MailSetRefTypeRef: TypeRef<MailSetRef> = new TypeRef("tutanota", 440)

export function createMailSetRef(values: StrippedEntity<MailSetRef>): MailSetRef {
    return Object.assign(create(typeModels[MailSetRefTypeRef.typeId], MailSetRefTypeRef), values)
}

export type MailSetRefParams = {

	_id: Id;

	mailSets: Id;
}

export class MailSetRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailSetRef> { return MailSetRefTypeRef };
	

	get _id(): Id { return this._attrs[441] }
	

	get mailSets(): Id { return this._attrs[441] }
}
export const MoveMailDataTypeRef: TypeRef<MoveMailData> = new TypeRef("tutanota", 445)

export function createMoveMailData(values: StrippedEntity<MoveMailData>): MoveMailData {
    return Object.assign(create(typeModels[MoveMailDataTypeRef.typeId], MoveMailDataTypeRef), values)
}

export type MoveMailDataParams = {

	_format: NumberString;
	moveReason: null | NumberString;

	targetFolder: IdTuple;
	mails: IdTuple[];
	excludeMailSet: null | IdTuple;
}

export class MoveMailData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MoveMailData> { return MoveMailDataTypeRef };
	

	get _format(): NumberString { return this._attrs[446] }
	get moveReason(): null | NumberString { return this._attrs[1714] }
    set moveReason(v: null | NumberString) { this._attrs[1714] = v }
	

	get targetFolder(): IdTuple { return this._attrs[1714] }
	set targetFolder(a: IdTuple)  { this._attrs[447] = a } 
	get mails(): IdTuple[] { return this._attrs[1714] }
	set mails(a: IdTuple[])  { this._attrs[448] = a } 
	get excludeMailSet(): null | IdTuple { return this._attrs[1714] }
	set excludeMailSet(a: IdTuple)  { this._attrs[1644] = a } 
}
export const CreateMailFolderDataTypeRef: TypeRef<CreateMailFolderData> = new TypeRef("tutanota", 450)

export function createCreateMailFolderData(values: StrippedEntity<CreateMailFolderData>): CreateMailFolderData {
    return Object.assign(create(typeModels[CreateMailFolderDataTypeRef.typeId], CreateMailFolderDataTypeRef), values)
}

export type CreateMailFolderDataParams = {

	_format: NumberString;
	folderName: string;
	ownerEncSessionKey: Uint8Array;
	ownerGroup: null | Id;
	ownerKeyVersion: NumberString;

	parentFolder: null | IdTuple;
}

export class CreateMailFolderData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateMailFolderData> { return CreateMailFolderDataTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[451] }
	get folderName(): string { return this._attrs[453] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[454] }
	get ownerGroup(): null | Id { return this._attrs[1268] }
	get ownerKeyVersion(): NumberString { return this._attrs[1414] }
	

	get parentFolder(): null | IdTuple { return this._attrs[1414] }
}
export const CreateMailFolderReturnTypeRef: TypeRef<CreateMailFolderReturn> = new TypeRef("tutanota", 455)

export function createCreateMailFolderReturn(values: StrippedEntity<CreateMailFolderReturn>): CreateMailFolderReturn {
    return Object.assign(create(typeModels[CreateMailFolderReturnTypeRef.typeId], CreateMailFolderReturnTypeRef), values)
}

export type CreateMailFolderReturnParams = {

	_format: NumberString;

	newFolder: IdTuple;
}

export class CreateMailFolderReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateMailFolderReturn> { return CreateMailFolderReturnTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[456] }
    set _format(v: NumberString) { this._attrs[456] = v }
	

	get newFolder(): IdTuple { return this._attrs[456] }
	set newFolder(a: IdTuple)  { this._attrs[457] = a } 
}
export const DeleteMailFolderDataTypeRef: TypeRef<DeleteMailFolderData> = new TypeRef("tutanota", 458)

export function createDeleteMailFolderData(values: StrippedEntity<DeleteMailFolderData>): DeleteMailFolderData {
    return Object.assign(create(typeModels[DeleteMailFolderDataTypeRef.typeId], DeleteMailFolderDataTypeRef), values)
}

export type DeleteMailFolderDataParams = {

	_format: NumberString;

	folders: IdTuple[];
}

export class DeleteMailFolderData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DeleteMailFolderData> { return DeleteMailFolderDataTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[459] }
    set _format(v: NumberString) { this._attrs[459] = v }
	

	get folders(): IdTuple[] { return this._attrs[459] }
	set folders(a: IdTuple[])  { this._attrs[460] = a } 
}
export const EncryptTutanotaPropertiesDataTypeRef: TypeRef<EncryptTutanotaPropertiesData> = new TypeRef("tutanota", 473)

export function createEncryptTutanotaPropertiesData(values: StrippedEntity<EncryptTutanotaPropertiesData>): EncryptTutanotaPropertiesData {
    return Object.assign(create(typeModels[EncryptTutanotaPropertiesDataTypeRef.typeId], EncryptTutanotaPropertiesDataTypeRef), values)
}

export type EncryptTutanotaPropertiesDataParams = {

	_format: NumberString;
	symEncSessionKey: Uint8Array;
	symKeyVersion: NumberString;

	properties: Id;
}

export class EncryptTutanotaPropertiesData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<EncryptTutanotaPropertiesData> { return EncryptTutanotaPropertiesDataTypeRef };
	

	get _format(): NumberString { return this._attrs[474] }
	get symEncSessionKey(): Uint8Array { return this._attrs[476] }
	get symKeyVersion(): NumberString { return this._attrs[1428] }
    set symKeyVersion(v: NumberString) { this._attrs[1428] = v }
	

	get properties(): Id { return this._attrs[1428] }
	set properties(a: Id)  { this._attrs[475] = a } 
}
export const DraftRecipientTypeRef: TypeRef<DraftRecipient> = new TypeRef("tutanota", 482)

export function createDraftRecipient(values: StrippedEntity<DraftRecipient>): DraftRecipient {
    return Object.assign(create(typeModels[DraftRecipientTypeRef.typeId], DraftRecipientTypeRef), values)
}

export type DraftRecipientParams = {

	_id: Id;
	name: string;
	mailAddress: string;
}

export class DraftRecipient extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DraftRecipient> { return DraftRecipientTypeRef };
	

	get _id(): Id { return this._attrs[483] }
	get name(): string { return this._attrs[484] }
	get mailAddress(): string { return this._attrs[485] }
	
}
export const NewDraftAttachmentTypeRef: TypeRef<NewDraftAttachment> = new TypeRef("tutanota", 486)

export function createNewDraftAttachment(values: StrippedEntity<NewDraftAttachment>): NewDraftAttachment {
    return Object.assign(create(typeModels[NewDraftAttachmentTypeRef.typeId], NewDraftAttachmentTypeRef), values)
}

export type NewDraftAttachmentParams = {

	_id: Id;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;
	encCid: null | Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
}

export class NewDraftAttachment extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NewDraftAttachment> { return NewDraftAttachmentTypeRef };
	

	get _id(): Id { return this._attrs[487] }
	get encFileName(): Uint8Array { return this._attrs[488] }
	get encMimeType(): Uint8Array { return this._attrs[489] }
	get encCid(): null | Uint8Array { return this._attrs[925] }
	

	get referenceTokens(): BlobReferenceTokenWrapper[] { return this._attrs[925] }
}
export const DraftAttachmentTypeRef: TypeRef<DraftAttachment> = new TypeRef("tutanota", 491)

export function createDraftAttachment(values: StrippedEntity<DraftAttachment>): DraftAttachment {
    return Object.assign(create(typeModels[DraftAttachmentTypeRef.typeId], DraftAttachmentTypeRef), values)
}

export type DraftAttachmentParams = {

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	newFile: null | NewDraftAttachment;
	existingFile: null | IdTuple;
}

export class DraftAttachment extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DraftAttachment> { return DraftAttachmentTypeRef };
	

	get _id(): Id { return this._attrs[492] }
	get ownerEncFileSessionKey(): Uint8Array { return this._attrs[493] }
	get ownerKeyVersion(): NumberString { return this._attrs[1430] }
	

	get newFile(): null | NewDraftAttachment { return this._attrs[1430] }
	get existingFile(): null | IdTuple { return this._attrs[1430] }
}
export const DraftDataTypeRef: TypeRef<DraftData> = new TypeRef("tutanota", 496)

export function createDraftData(values: StrippedEntity<DraftData>): DraftData {
    return Object.assign(create(typeModels[DraftDataTypeRef.typeId], DraftDataTypeRef), values)
}

export type DraftDataParams = {

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

export class DraftData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DraftData> { return DraftDataTypeRef };
	

	get _id(): Id { return this._attrs[497] }
	get subject(): string { return this._attrs[498] }
	get bodyText(): string { return this._attrs[499] }
	get senderMailAddress(): string { return this._attrs[500] }
	get senderName(): string { return this._attrs[501] }
	get confidential(): boolean { return this._attrs[502] }
	get method(): NumberString { return this._attrs[1116] }
	get compressedBodyText(): null | string { return this._attrs[1194] }
	

	get toRecipients(): DraftRecipient[] { return this._attrs[1194] }
	get ccRecipients(): DraftRecipient[] { return this._attrs[1194] }
	get bccRecipients(): DraftRecipient[] { return this._attrs[1194] }
	get addedAttachments(): DraftAttachment[] { return this._attrs[1194] }
	get removedAttachments(): IdTuple[] { return this._attrs[1194] }
	get replyTos(): EncryptedMailAddress[] { return this._attrs[1194] }
	set replyTos(a: EncryptedMailAddress[])  { this._attrs[819] = a } 
}
export const DraftCreateDataTypeRef: TypeRef<DraftCreateData> = new TypeRef("tutanota", 508)

export function createDraftCreateData(values: StrippedEntity<DraftCreateData>): DraftCreateData {
    return Object.assign(create(typeModels[DraftCreateDataTypeRef.typeId], DraftCreateDataTypeRef), values)
}

export type DraftCreateDataParams = {

	_format: NumberString;
	previousMessageId: null | string;
	conversationType: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	draftData: DraftData;
}

export class DraftCreateData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DraftCreateData> { return DraftCreateDataTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[509] }
	get previousMessageId(): null | string { return this._attrs[510] }
	get conversationType(): NumberString { return this._attrs[511] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[512] }
	get ownerKeyVersion(): NumberString { return this._attrs[1427] }
    set ownerKeyVersion(v: NumberString) { this._attrs[1427] = v }
	

	get draftData(): DraftData { return this._attrs[1427] }
	set draftData(a: DraftData)  { this._attrs[515] = a } 
}
export const DraftCreateReturnTypeRef: TypeRef<DraftCreateReturn> = new TypeRef("tutanota", 516)

export function createDraftCreateReturn(values: StrippedEntity<DraftCreateReturn>): DraftCreateReturn {
    return Object.assign(create(typeModels[DraftCreateReturnTypeRef.typeId], DraftCreateReturnTypeRef), values)
}

export type DraftCreateReturnParams = {

	_format: NumberString;

	draft: IdTuple;
}

export class DraftCreateReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DraftCreateReturn> { return DraftCreateReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[517] }
    set _format(v: NumberString) { this._attrs[517] = v }
	

	get draft(): IdTuple { return this._attrs[517] }
	set draft(a: IdTuple)  { this._attrs[518] = a } 
}
export const DraftUpdateDataTypeRef: TypeRef<DraftUpdateData> = new TypeRef("tutanota", 519)

export function createDraftUpdateData(values: StrippedEntity<DraftUpdateData>): DraftUpdateData {
    return Object.assign(create(typeModels[DraftUpdateDataTypeRef.typeId], DraftUpdateDataTypeRef), values)
}

export type DraftUpdateDataParams = {

	_format: NumberString;

	draftData: DraftData;
	draft: IdTuple;
}

export class DraftUpdateData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DraftUpdateData> { return DraftUpdateDataTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[520] }
    set _format(v: NumberString) { this._attrs[520] = v }
	

	get draftData(): DraftData { return this._attrs[520] }
	set draftData(a: DraftData)  { this._attrs[521] = a } 
	get draft(): IdTuple { return this._attrs[520] }
	set draft(a: IdTuple)  { this._attrs[522] = a } 
}
export const DraftUpdateReturnTypeRef: TypeRef<DraftUpdateReturn> = new TypeRef("tutanota", 523)

export function createDraftUpdateReturn(values: StrippedEntity<DraftUpdateReturn>): DraftUpdateReturn {
    return Object.assign(create(typeModels[DraftUpdateReturnTypeRef.typeId], DraftUpdateReturnTypeRef), values)
}

export type DraftUpdateReturnParams = {

	_format: NumberString;

	attachments: IdTuple[];
}

export class DraftUpdateReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DraftUpdateReturn> { return DraftUpdateReturnTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[524] }
    set _format(v: NumberString) { this._attrs[524] = v }
	

	get attachments(): IdTuple[] { return this._attrs[524] }
}
export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", 527)

export function createInternalRecipientKeyData(values: StrippedEntity<InternalRecipientKeyData>): InternalRecipientKeyData {
    return Object.assign(create(typeModels[InternalRecipientKeyDataTypeRef.typeId], InternalRecipientKeyDataTypeRef), values)
}

export type InternalRecipientKeyDataParams = {

	_id: Id;
	mailAddress: string;
	pubEncBucketKey: Uint8Array;
	recipientKeyVersion: NumberString;
	protocolVersion: NumberString;
	senderKeyVersion: null | NumberString;
}

export class InternalRecipientKeyData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InternalRecipientKeyData> { return InternalRecipientKeyDataTypeRef };
	

	get _id(): Id { return this._attrs[528] }
	get mailAddress(): string { return this._attrs[529] }
	get pubEncBucketKey(): Uint8Array { return this._attrs[530] }
	get recipientKeyVersion(): NumberString { return this._attrs[531] }
	get protocolVersion(): NumberString { return this._attrs[1352] }
	get senderKeyVersion(): null | NumberString { return this._attrs[1431] }
	
}
export const SecureExternalRecipientKeyDataTypeRef: TypeRef<SecureExternalRecipientKeyData> = new TypeRef("tutanota", 532)

export function createSecureExternalRecipientKeyData(values: StrippedEntity<SecureExternalRecipientKeyData>): SecureExternalRecipientKeyData {
    return Object.assign(create(typeModels[SecureExternalRecipientKeyDataTypeRef.typeId], SecureExternalRecipientKeyDataTypeRef), values)
}

export type SecureExternalRecipientKeyDataParams = {

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

export class SecureExternalRecipientKeyData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SecureExternalRecipientKeyData> { return SecureExternalRecipientKeyDataTypeRef };
	

	get _id(): Id { return this._attrs[533] }
	get mailAddress(): string { return this._attrs[534] }
	get passwordVerifier(): Uint8Array { return this._attrs[536] }
	get salt(): null | Uint8Array { return this._attrs[538] }
	get saltHash(): null | Uint8Array { return this._attrs[539] }
	get pwEncCommunicationKey(): null | Uint8Array { return this._attrs[540] }
	get ownerEncBucketKey(): Uint8Array { return this._attrs[599] }
	get kdfVersion(): NumberString { return this._attrs[1324] }
	get ownerKeyVersion(): NumberString { return this._attrs[1417] }
	get userGroupKeyVersion(): NumberString { return this._attrs[1445] }
    set userGroupKeyVersion(v: NumberString) { this._attrs[1445] = v }
	
}
export const AttachmentKeyDataTypeRef: TypeRef<AttachmentKeyData> = new TypeRef("tutanota", 542)

export function createAttachmentKeyData(values: StrippedEntity<AttachmentKeyData>): AttachmentKeyData {
    return Object.assign(create(typeModels[AttachmentKeyDataTypeRef.typeId], AttachmentKeyDataTypeRef), values)
}

export type AttachmentKeyDataParams = {

	_id: Id;
	bucketEncFileSessionKey: null | Uint8Array;
	fileSessionKey: null | Uint8Array;

	file: IdTuple;
}

export class AttachmentKeyData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AttachmentKeyData> { return AttachmentKeyDataTypeRef };
	

	get _id(): Id { return this._attrs[543] }
	get bucketEncFileSessionKey(): null | Uint8Array { return this._attrs[544] }
	get fileSessionKey(): null | Uint8Array { return this._attrs[545] }
	

	get file(): IdTuple { return this._attrs[545] }
}
export const SendDraftDataTypeRef: TypeRef<SendDraftData> = new TypeRef("tutanota", 547)

export function createSendDraftData(values: StrippedEntity<SendDraftData>): SendDraftData {
    return Object.assign(create(typeModels[SendDraftDataTypeRef.typeId], SendDraftDataTypeRef), values)
}

export type SendDraftDataParams = {

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

export class SendDraftData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SendDraftData> { return SendDraftDataTypeRef };
	

	get _format(): NumberString { return this._attrs[548] }
	get language(): string { return this._attrs[549] }
	get mailSessionKey(): null | Uint8Array { return this._attrs[550] }
	get bucketEncMailSessionKey(): null | Uint8Array { return this._attrs[551] }
	get senderNameUnencrypted(): null | string { return this._attrs[552] }
	get plaintext(): boolean { return this._attrs[675] }
	get calendarMethod(): boolean { return this._attrs[1117] }
	get sessionEncEncryptionAuthStatus(): null | Uint8Array { return this._attrs[1444] }
	get sendAt(): null | Date { return this._attrs[1809] }
	get allowUndo(): boolean { return this._attrs[1822] }
	

	get internalRecipientKeyData(): InternalRecipientKeyData[] { return this._attrs[1822] }
	get secureExternalRecipientKeyData(): SecureExternalRecipientKeyData[] { return this._attrs[1822] }
	get attachmentKeyData(): AttachmentKeyData[] { return this._attrs[1822] }
	get mail(): IdTuple { return this._attrs[1822] }
	get symEncInternalRecipientKeyData(): SymEncInternalRecipientKeyData[] { return this._attrs[1822] }
	get parameters(): null | SendDraftParameters { return this._attrs[1822] }
	set parameters(a: SendDraftParameters)  { this._attrs[1810] = a } 
}
export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", 557)

export function createSendDraftReturn(values: StrippedEntity<SendDraftReturn>): SendDraftReturn {
    return Object.assign(create(typeModels[SendDraftReturnTypeRef.typeId], SendDraftReturnTypeRef), values)
}

export type SendDraftReturnParams = {

	_format: NumberString;
	messageId: string;
	sentDate: Date;

	notifications: NotificationMail[];
	sentMail: IdTuple;
	sendJob: null | IdTuple;
}

export class SendDraftReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SendDraftReturn> { return SendDraftReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[558] }
	get messageId(): string { return this._attrs[559] }
	get sentDate(): Date { return this._attrs[560] }
    set sentDate(v: Date) { this._attrs[560] = v }
	

	get notifications(): NotificationMail[] { return this._attrs[560] }
	set notifications(a: NotificationMail[])  { this._attrs[561] = a } 
	get sentMail(): IdTuple { return this._attrs[560] }
	get sendJob(): null | IdTuple { return this._attrs[560] }
}
export const ReceiveInfoServiceDataTypeRef: TypeRef<ReceiveInfoServiceData> = new TypeRef("tutanota", 570)

export function createReceiveInfoServiceData(values: StrippedEntity<ReceiveInfoServiceData>): ReceiveInfoServiceData {
    return Object.assign(create(typeModels[ReceiveInfoServiceDataTypeRef.typeId], ReceiveInfoServiceDataTypeRef), values)
}

export type ReceiveInfoServiceDataParams = {

	_format: NumberString;
	language: string;
}

export class ReceiveInfoServiceData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReceiveInfoServiceData> { return ReceiveInfoServiceDataTypeRef };
	

	get _format(): NumberString { return this._attrs[571] }
	get language(): string { return this._attrs[1121] }
	
}
export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", 573)

export function createInboxRule(values: StrippedEntity<InboxRule>): InboxRule {
    return Object.assign(create(typeModels[InboxRuleTypeRef.typeId], InboxRuleTypeRef), values)
}

export type InboxRuleParams = {

	_id: Id;
	type: string;
	value: string;
	excludeFromSpamFilter: null | boolean;

	targetFolder: IdTuple;
}

export class InboxRule extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InboxRule> { return InboxRuleTypeRef };
	

	get _id(): Id { return this._attrs[574] }
	get type(): string { return this._attrs[575] }
	get value(): string { return this._attrs[576] }
	get excludeFromSpamFilter(): null | boolean { return this._attrs[1783] }
    set excludeFromSpamFilter(v: null | boolean) { this._attrs[1783] = v }
	

	get targetFolder(): IdTuple { return this._attrs[1783] }
	set targetFolder(a: IdTuple)  { this._attrs[577] = a } 
}
export const EncryptedMailAddressTypeRef: TypeRef<EncryptedMailAddress> = new TypeRef("tutanota", 612)

export function createEncryptedMailAddress(values: StrippedEntity<EncryptedMailAddress>): EncryptedMailAddress {
    return Object.assign(create(typeModels[EncryptedMailAddressTypeRef.typeId], EncryptedMailAddressTypeRef), values)
}

export type EncryptedMailAddressParams = {

	_id: Id;
	name: string;
	address: string;
}

export class EncryptedMailAddress extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<EncryptedMailAddress> { return EncryptedMailAddressTypeRef };
	

	get _id(): Id { return this._attrs[613] }
	get name(): string { return this._attrs[614] }
	get address(): string { return this._attrs[615] }
	
}
export const UserAccountUserDataTypeRef: TypeRef<UserAccountUserData> = new TypeRef("tutanota", 622)

export function createUserAccountUserData(values: StrippedEntity<UserAccountUserData>): UserAccountUserData {
    return Object.assign(create(typeModels[UserAccountUserDataTypeRef.typeId], UserAccountUserDataTypeRef), values)
}

export type UserAccountUserDataParams = {

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

export class UserAccountUserData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAccountUserData> { return UserAccountUserDataTypeRef };
	

	get _id(): Id { return this._attrs[623] }
	get mailAddress(): string { return this._attrs[624] }
	get encryptedName(): Uint8Array { return this._attrs[625] }
	get salt(): Uint8Array { return this._attrs[626] }
	get verifier(): Uint8Array { return this._attrs[627] }
	get pwEncUserGroupKey(): Uint8Array { return this._attrs[629] }
	get userEncCustomerGroupKey(): Uint8Array { return this._attrs[630] }
	get userEncMailGroupKey(): Uint8Array { return this._attrs[631] }
	get userEncContactGroupKey(): Uint8Array { return this._attrs[632] }
	get userEncFileGroupKey(): Uint8Array { return this._attrs[633] }
	get userEncEntropy(): Uint8Array { return this._attrs[634] }
	get userEncTutanotaPropertiesSessionKey(): Uint8Array { return this._attrs[635] }
	get mailEncMailBoxSessionKey(): Uint8Array { return this._attrs[636] }
	get contactEncContactListSessionKey(): Uint8Array { return this._attrs[637] }
	get fileEncFileSystemSessionKey(): Uint8Array { return this._attrs[638] }
	get customerEncMailGroupInfoSessionKey(): Uint8Array { return this._attrs[639] }
	get customerEncContactGroupInfoSessionKey(): Uint8Array { return this._attrs[640] }
	get customerEncFileGroupInfoSessionKey(): Uint8Array { return this._attrs[641] }
	get userEncRecoverCode(): Uint8Array { return this._attrs[892] }
	get recoverCodeEncUserGroupKey(): Uint8Array { return this._attrs[893] }
	get recoverCodeVerifier(): Uint8Array { return this._attrs[894] }
	get kdfVersion(): NumberString { return this._attrs[1322] }
	get customerKeyVersion(): NumberString { return this._attrs[1426] }
    set customerKeyVersion(v: NumberString) { this._attrs[1426] = v }
	
}
export const InternalGroupDataTypeRef: TypeRef<InternalGroupData> = new TypeRef("tutanota", 642)

export function createInternalGroupData(values: StrippedEntity<InternalGroupData>): InternalGroupData {
    return Object.assign(create(typeModels[InternalGroupDataTypeRef.typeId], InternalGroupDataTypeRef), values)
}

export type InternalGroupDataParams = {

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

export class InternalGroupData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InternalGroupData> { return InternalGroupDataTypeRef };
	

	get _id(): Id { return this._attrs[643] }
	get pubRsaKey(): null | Uint8Array { return this._attrs[644] }
	get groupEncPrivRsaKey(): null | Uint8Array { return this._attrs[645] }
	get adminEncGroupKey(): Uint8Array { return this._attrs[646] }
	get ownerEncGroupInfoSessionKey(): Uint8Array { return this._attrs[647] }
	get pubEccKey(): null | Uint8Array { return this._attrs[1342] }
	get groupEncPrivEccKey(): null | Uint8Array { return this._attrs[1343] }
	get pubKyberKey(): null | Uint8Array { return this._attrs[1344] }
	get groupEncPrivKyberKey(): null | Uint8Array { return this._attrs[1345] }
	get adminKeyVersion(): NumberString { return this._attrs[1415] }
	get ownerKeyVersion(): NumberString { return this._attrs[1416] }
    set ownerKeyVersion(v: NumberString) { this._attrs[1416] = v }
	

	get adminGroup(): null | Id { return this._attrs[1416] }
}
export const CustomerAccountCreateDataTypeRef: TypeRef<CustomerAccountCreateData> = new TypeRef("tutanota", 648)

export function createCustomerAccountCreateData(values: StrippedEntity<CustomerAccountCreateData>): CustomerAccountCreateData {
    return Object.assign(create(typeModels[CustomerAccountCreateDataTypeRef.typeId], CustomerAccountCreateDataTypeRef), values)
}

export type CustomerAccountCreateDataParams = {

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

export class CustomerAccountCreateData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerAccountCreateData> { return CustomerAccountCreateDataTypeRef };
	

	get _format(): NumberString { return this._attrs[649] }
	get authToken(): string { return this._attrs[650] }
	get date(): null | Date { return this._attrs[651] }
	get lang(): string { return this._attrs[652] }
	get userEncAdminGroupKey(): Uint8Array { return this._attrs[654] }
	get userEncAccountGroupKey(): Uint8Array { return this._attrs[655] }
	get adminEncAccountingInfoSessionKey(): Uint8Array { return this._attrs[659] }
	get systemAdminPubEncAccountingInfoSessionKey(): Uint8Array { return this._attrs[660] }
	get adminEncCustomerServerPropertiesSessionKey(): Uint8Array { return this._attrs[661] }
	get code(): string { return this._attrs[873] }
	get systemAdminPublicProtocolVersion(): NumberString { return this._attrs[1355] }
	get accountGroupKeyVersion(): NumberString { return this._attrs[1421] }
	get systemAdminPubKeyVersion(): NumberString { return this._attrs[1422] }
	get app(): NumberString { return this._attrs[1511] }
    set app(v: NumberString) { this._attrs[1511] = v }
	

	get userData(): UserAccountUserData { return this._attrs[1511] }
	set userData(a: UserAccountUserData)  { this._attrs[653] = a } 
	get userGroupData(): InternalGroupData { return this._attrs[1511] }
	set userGroupData(a: InternalGroupData)  { this._attrs[656] = a } 
	get adminGroupData(): InternalGroupData { return this._attrs[1511] }
	set adminGroupData(a: InternalGroupData)  { this._attrs[657] = a } 
	get customerGroupData(): InternalGroupData { return this._attrs[1511] }
	set customerGroupData(a: InternalGroupData)  { this._attrs[658] = a } 
}
export const UserAccountCreateDataTypeRef: TypeRef<UserAccountCreateData> = new TypeRef("tutanota", 663)

export function createUserAccountCreateData(values: StrippedEntity<UserAccountCreateData>): UserAccountCreateData {
    return Object.assign(create(typeModels[UserAccountCreateDataTypeRef.typeId], UserAccountCreateDataTypeRef), values)
}

export type UserAccountCreateDataParams = {

	_format: NumberString;
	date: null | Date;

	userData: UserAccountUserData;
	userGroupData: InternalGroupData;
}

export class UserAccountCreateData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAccountCreateData> { return UserAccountCreateDataTypeRef };
	

	get _format(): NumberString { return this._attrs[664] }
	get date(): null | Date { return this._attrs[665] }
    set date(v: null | Date) { this._attrs[665] = v }
	

	get userData(): UserAccountUserData { return this._attrs[665] }
	set userData(a: UserAccountUserData)  { this._attrs[666] = a } 
	get userGroupData(): InternalGroupData { return this._attrs[665] }
	set userGroupData(a: InternalGroupData)  { this._attrs[667] = a } 
}
export const MailboxServerPropertiesTypeRef: TypeRef<MailboxServerProperties> = new TypeRef("tutanota", 677)

export function createMailboxServerProperties(values: StrippedEntity<MailboxServerProperties>): MailboxServerProperties {
    return Object.assign(create(typeModels[MailboxServerPropertiesTypeRef.typeId], MailboxServerPropertiesTypeRef), values)
}

export type MailboxServerPropertiesParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
}

export class MailboxServerProperties extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailboxServerProperties> { return MailboxServerPropertiesTypeRef };
	

	get _id(): Id { return this._attrs[679] }
	get _permissions(): Id { return this._attrs[680] }
	get _format(): NumberString { return this._attrs[681] }
	get _ownerGroup(): null | Id { return this._attrs[682] }
	
}
export const MailboxGroupRootTypeRef: TypeRef<MailboxGroupRoot> = new TypeRef("tutanota", 693)

export function createMailboxGroupRoot(values: StrippedEntity<MailboxGroupRoot>): MailboxGroupRoot {
    return Object.assign(create(typeModels[MailboxGroupRootTypeRef.typeId], MailboxGroupRootTypeRef), values)
}

export type MailboxGroupRootParams = {

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

export class MailboxGroupRoot extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailboxGroupRoot> { return MailboxGroupRootTypeRef };
	

	get _id(): Id { return this._attrs[695] }
	get _permissions(): Id { return this._attrs[696] }
	get _format(): NumberString { return this._attrs[697] }
	get _ownerGroup(): null | Id { return this._attrs[698] }
	

	get mailbox(): Id { return this._attrs[698] }
	get serverProperties(): Id { return this._attrs[698] }
	get calendarEventUpdates(): null | CalendarEventUpdateList { return this._attrs[698] }
	get outOfOfficeNotification(): null | Id { return this._attrs[698] }
	get outOfOfficeNotificationRecipientList(): null | OutOfOfficeNotificationRecipientList { return this._attrs[698] }
	get mailboxProperties(): null | Id { return this._attrs[698] }
}
export const CreateMailGroupDataTypeRef: TypeRef<CreateMailGroupData> = new TypeRef("tutanota", 707)

export function createCreateMailGroupData(values: StrippedEntity<CreateMailGroupData>): CreateMailGroupData {
    return Object.assign(create(typeModels[CreateMailGroupDataTypeRef.typeId], CreateMailGroupDataTypeRef), values)
}

export type CreateMailGroupDataParams = {

	_format: NumberString;
	mailAddress: string;
	encryptedName: Uint8Array;
	mailEncMailboxSessionKey: Uint8Array;

	groupData: InternalGroupData;
}

export class CreateMailGroupData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateMailGroupData> { return CreateMailGroupDataTypeRef };
	

	get _format(): NumberString { return this._attrs[708] }
	get mailAddress(): string { return this._attrs[709] }
	get encryptedName(): Uint8Array { return this._attrs[710] }
	get mailEncMailboxSessionKey(): Uint8Array { return this._attrs[711] }
    set mailEncMailboxSessionKey(v: Uint8Array) { this._attrs[711] = v }
	

	get groupData(): InternalGroupData { return this._attrs[711] }
	set groupData(a: InternalGroupData)  { this._attrs[712] = a } 
}
export const DeleteGroupDataTypeRef: TypeRef<DeleteGroupData> = new TypeRef("tutanota", 713)

export function createDeleteGroupData(values: StrippedEntity<DeleteGroupData>): DeleteGroupData {
    return Object.assign(create(typeModels[DeleteGroupDataTypeRef.typeId], DeleteGroupDataTypeRef), values)
}

export type DeleteGroupDataParams = {

	_format: NumberString;
	restore: boolean;

	group: Id;
}

export class DeleteGroupData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DeleteGroupData> { return DeleteGroupDataTypeRef };
	

	get _format(): NumberString { return this._attrs[714] }
	get restore(): boolean { return this._attrs[715] }
    set restore(v: boolean) { this._attrs[715] = v }
	

	get group(): Id { return this._attrs[715] }
}
export const BirthdayTypeRef: TypeRef<Birthday> = new TypeRef("tutanota", 844)

export function createBirthday(values: StrippedEntity<Birthday>): Birthday {
    return Object.assign(create(typeModels[BirthdayTypeRef.typeId], BirthdayTypeRef), values)
}

export type BirthdayParams = {

	_id: Id;
	day: NumberString;
	month: NumberString;
	year: null | NumberString;
}

export class Birthday extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Birthday> { return BirthdayTypeRef };
	

	get _id(): Id { return this._attrs[845] }
	get day(): NumberString { return this._attrs[846] }
	get month(): NumberString { return this._attrs[847] }
	get year(): null | NumberString { return this._attrs[848] }
    set year(v: null | NumberString) { this._attrs[848] = v }
	
}
export const PhotosRefTypeRef: TypeRef<PhotosRef> = new TypeRef("tutanota", 853)

export function createPhotosRef(values: StrippedEntity<PhotosRef>): PhotosRef {
    return Object.assign(create(typeModels[PhotosRefTypeRef.typeId], PhotosRefTypeRef), values)
}

export type PhotosRefParams = {

	_id: Id;

	files: Id;
}

export class PhotosRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PhotosRef> { return PhotosRefTypeRef };
	

	get _id(): Id { return this._attrs[854] }
	

	get files(): Id { return this._attrs[854] }
}
export const ListUnsubscribeDataTypeRef: TypeRef<ListUnsubscribeData> = new TypeRef("tutanota", 867)

export function createListUnsubscribeData(values: StrippedEntity<ListUnsubscribeData>): ListUnsubscribeData {
    return Object.assign(create(typeModels[ListUnsubscribeDataTypeRef.typeId], ListUnsubscribeDataTypeRef), values)
}

export type ListUnsubscribeDataParams = {

	_format: NumberString;
	postLink: string;

	mail: IdTuple;
}

export class ListUnsubscribeData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ListUnsubscribeData> { return ListUnsubscribeDataTypeRef };
	

	get _format(): NumberString { return this._attrs[868] }
	get postLink(): string { return this._attrs[871] }
    set postLink(v: string) { this._attrs[871] = v }
	

	get mail(): IdTuple { return this._attrs[871] }
	set mail(a: IdTuple)  { this._attrs[869] = a } 
}
export const CalendarRepeatRuleTypeRef: TypeRef<CalendarRepeatRule> = new TypeRef("tutanota", 926)

export function createCalendarRepeatRule(values: StrippedEntity<CalendarRepeatRule>): CalendarRepeatRule {
    return Object.assign(create(typeModels[CalendarRepeatRuleTypeRef.typeId], CalendarRepeatRuleTypeRef), values)
}

export type CalendarRepeatRuleParams = {

	_id: Id;
	frequency: NumberString;
	endType: NumberString;
	endValue: null | NumberString;
	interval: NumberString;
	timeZone: string;

	excludedDates: DateWrapper[];
	advancedRules: AdvancedRepeatRule[];
}

export class CalendarRepeatRule extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarRepeatRule> { return CalendarRepeatRuleTypeRef };
	

	get _id(): Id { return this._attrs[927] }
	get frequency(): NumberString { return this._attrs[928] }
	get endType(): NumberString { return this._attrs[929] }
	get endValue(): null | NumberString { return this._attrs[930] }
	get interval(): NumberString { return this._attrs[931] }
	get timeZone(): string { return this._attrs[932] }
    set timeZone(v: string) { this._attrs[932] = v }
	

	get excludedDates(): DateWrapper[] { return this._attrs[932] }
	set excludedDates(a: DateWrapper[])  { this._attrs[1319] = a } 
	get advancedRules(): AdvancedRepeatRule[] { return this._attrs[932] }
	set advancedRules(a: AdvancedRepeatRule[])  { this._attrs[1590] = a } 
}
export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", 933)

export function createCalendarEvent(values: StrippedEntity<CalendarEvent>): CalendarEvent {
    return Object.assign(create(typeModels[CalendarEventTypeRef.typeId], CalendarEventTypeRef), values)
}

export type CalendarEventParams = {

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

	repeatRule: null | CalendarRepeatRule;
	alarmInfos: IdTuple[];
	attendees: CalendarEventAttendee[];
	organizer: null | EncryptedMailAddress;
}

export class CalendarEvent extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarEvent> { return CalendarEventTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[935] }
	get _permissions(): Id { return this._attrs[936] }
	get _format(): NumberString { return this._attrs[937] }
	get _ownerGroup(): null | Id { return this._attrs[938] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[939] }
	get summary(): string { return this._attrs[940] }
	get description(): string { return this._attrs[941] }
	get startTime(): Date { return this._attrs[942] }
	get endTime(): Date { return this._attrs[943] }
	get location(): string { return this._attrs[944] }
	get uid(): null | string { return this._attrs[988] }
	get hashedUid(): null | Uint8Array { return this._attrs[1088] }
	get sequence(): NumberString { return this._attrs[1089] }
	get invitedConfidentially(): null | boolean { return this._attrs[1090] }
	get recurrenceId(): null | Date { return this._attrs[1320] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1401] }
	get sender(): null | string { return this._attrs[1812] }
	get pendingInvitation(): null | boolean { return this._attrs[1813] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1845] }
	

	get repeatRule(): null | CalendarRepeatRule { return this._attrs[1845] }
	set repeatRule(a: CalendarRepeatRule)  { this._attrs[945] = a } 
	get alarmInfos(): IdTuple[] { return this._attrs[1845] }
	set alarmInfos(a: IdTuple[])  { this._attrs[946] = a } 
	get attendees(): CalendarEventAttendee[] { return this._attrs[1845] }
	set attendees(a: CalendarEventAttendee[])  { this._attrs[1091] = a } 
	get organizer(): null | EncryptedMailAddress { return this._attrs[1845] }
	set organizer(a: EncryptedMailAddress)  { this._attrs[1092] = a } 
}
export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", 947)

export function createCalendarGroupRoot(values: StrippedEntity<CalendarGroupRoot>): CalendarGroupRoot {
    return Object.assign(create(typeModels[CalendarGroupRootTypeRef.typeId], CalendarGroupRootTypeRef), values)
}

export type CalendarGroupRootParams = {

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

export class CalendarGroupRoot extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarGroupRoot> { return CalendarGroupRootTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[949] }
	get _permissions(): Id { return this._attrs[950] }
	get _format(): NumberString { return this._attrs[951] }
	get _ownerGroup(): null | Id { return this._attrs[952] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[953] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1402] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1848] }
	

	get shortEvents(): Id { return this._attrs[1848] }
	get longEvents(): Id { return this._attrs[1848] }
	get index(): null | CalendarEventIndexRef { return this._attrs[1848] }
}
export const UserAreaGroupDataTypeRef: TypeRef<UserAreaGroupData> = new TypeRef("tutanota", 956)

export function createUserAreaGroupData(values: StrippedEntity<UserAreaGroupData>): UserAreaGroupData {
    return Object.assign(create(typeModels[UserAreaGroupDataTypeRef.typeId], UserAreaGroupDataTypeRef), values)
}

export type UserAreaGroupDataParams = {

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

export class UserAreaGroupData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAreaGroupData> { return UserAreaGroupDataTypeRef };
	

	get _id(): Id { return this._attrs[957] }
	get groupEncGroupRootSessionKey(): Uint8Array { return this._attrs[958] }
	get adminEncGroupKey(): null | Uint8Array { return this._attrs[959] }
	get customerEncGroupInfoSessionKey(): Uint8Array { return this._attrs[960] }
	get userEncGroupKey(): Uint8Array { return this._attrs[961] }
	get groupInfoEncName(): Uint8Array { return this._attrs[962] }
	get adminKeyVersion(): null | NumberString { return this._attrs[1423] }
	get customerKeyVersion(): NumberString { return this._attrs[1424] }
	get userKeyVersion(): NumberString { return this._attrs[1425] }
    set userKeyVersion(v: NumberString) { this._attrs[1425] = v }
	

	get adminGroup(): null | Id { return this._attrs[1425] }
}
export const UserAreaGroupPostDataTypeRef: TypeRef<UserAreaGroupPostData> = new TypeRef("tutanota", 964)

export function createUserAreaGroupPostData(values: StrippedEntity<UserAreaGroupPostData>): UserAreaGroupPostData {
    return Object.assign(create(typeModels[UserAreaGroupPostDataTypeRef.typeId], UserAreaGroupPostDataTypeRef), values)
}

export type UserAreaGroupPostDataParams = {

	_format: NumberString;

	groupData: UserAreaGroupData;
}

export class UserAreaGroupPostData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAreaGroupPostData> { return UserAreaGroupPostDataTypeRef };
	

	get _format(): NumberString { return this._attrs[965] }
    set _format(v: NumberString) { this._attrs[965] = v }
	

	get groupData(): UserAreaGroupData { return this._attrs[965] }
	set groupData(a: UserAreaGroupData)  { this._attrs[966] = a } 
}
export const GroupSettingsTypeRef: TypeRef<GroupSettings> = new TypeRef("tutanota", 968)

export function createGroupSettings(values: StrippedEntity<GroupSettings>): GroupSettings {
    return Object.assign(create(typeModels[GroupSettingsTypeRef.typeId], GroupSettingsTypeRef), values)
}

export type GroupSettingsParams = {

	_id: Id;
	color: string;
	name: null | string;
	sourceUrl: null | string;

	group: Id;
	defaultAlarmsList: DefaultAlarmInfo[];
}

export class GroupSettings extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupSettings> { return GroupSettingsTypeRef };
	

	get _id(): Id { return this._attrs[969] }
	get color(): string { return this._attrs[971] }
	get name(): null | string { return this._attrs[1020] }
	get sourceUrl(): null | string { return this._attrs[1468] }
    set sourceUrl(v: null | string) { this._attrs[1468] = v }
	

	get group(): Id { return this._attrs[1468] }
	get defaultAlarmsList(): DefaultAlarmInfo[] { return this._attrs[1468] }
	set defaultAlarmsList(a: DefaultAlarmInfo[])  { this._attrs[1449] = a } 
}
export const UserSettingsGroupRootTypeRef: TypeRef<UserSettingsGroupRoot> = new TypeRef("tutanota", 972)

export function createUserSettingsGroupRoot(values: StrippedEntity<UserSettingsGroupRoot>): UserSettingsGroupRoot {
    return Object.assign(create(typeModels[UserSettingsGroupRootTypeRef.typeId], UserSettingsGroupRootTypeRef), values)
}

export type UserSettingsGroupRootParams = {

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

export class UserSettingsGroupRoot extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserSettingsGroupRoot> { return UserSettingsGroupRootTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[974] }
	get _permissions(): Id { return this._attrs[975] }
	get _format(): NumberString { return this._attrs[976] }
	get _ownerGroup(): null | Id { return this._attrs[977] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[978] }
	get timeFormat(): NumberString { return this._attrs[980] }
	get startOfTheWeek(): NumberString { return this._attrs[981] }
	get usageDataOptedIn(): null | boolean { return this._attrs[1234] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1403] }
	get birthdayCalendarColor(): null | string { return this._attrs[1735] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1850] }
	

	get groupSettings(): GroupSettings[] { return this._attrs[1850] }
	set groupSettings(a: GroupSettings[])  { this._attrs[979] = a } 
}
export const CalendarDeleteInTypeRef: TypeRef<CalendarDeleteIn> = new TypeRef("tutanota", 982)

export function createCalendarDeleteIn(values: StrippedEntity<CalendarDeleteIn>): CalendarDeleteIn {
    return Object.assign(create(typeModels[CalendarDeleteInTypeRef.typeId], CalendarDeleteInTypeRef), values)
}

export type CalendarDeleteInParams = {

	_format: NumberString;

	groupRootId: Id;
}

export class CalendarDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarDeleteIn> { return CalendarDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[983] }
    set _format(v: NumberString) { this._attrs[983] = v }
	

	get groupRootId(): Id { return this._attrs[983] }
	set groupRootId(a: Id)  { this._attrs[984] = a } 
}
export const CreateGroupPostReturnTypeRef: TypeRef<CreateGroupPostReturn> = new TypeRef("tutanota", 985)

export function createCreateGroupPostReturn(values: StrippedEntity<CreateGroupPostReturn>): CreateGroupPostReturn {
    return Object.assign(create(typeModels[CreateGroupPostReturnTypeRef.typeId], CreateGroupPostReturnTypeRef), values)
}

export type CreateGroupPostReturnParams = {

	_format: NumberString;

	group: Id;
}

export class CreateGroupPostReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateGroupPostReturn> { return CreateGroupPostReturnTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[986] }
    set _format(v: NumberString) { this._attrs[986] = v }
	

	get group(): Id { return this._attrs[986] }
}
export const SharedGroupDataTypeRef: TypeRef<SharedGroupData> = new TypeRef("tutanota", 992)

export function createSharedGroupData(values: StrippedEntity<SharedGroupData>): SharedGroupData {
    return Object.assign(create(typeModels[SharedGroupDataTypeRef.typeId], SharedGroupDataTypeRef), values)
}

export type SharedGroupDataParams = {

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

export class SharedGroupData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SharedGroupData> { return SharedGroupDataTypeRef };
	

	get _id(): Id { return this._attrs[993] }
	get capability(): NumberString { return this._attrs[994] }
	get sessionEncSharedGroupKey(): Uint8Array { return this._attrs[995] }
	get sessionEncSharedGroupName(): Uint8Array { return this._attrs[996] }
	get sessionEncInviterName(): Uint8Array { return this._attrs[997] }
	get bucketEncInvitationSessionKey(): Uint8Array { return this._attrs[998] }
	get sharedGroupEncInviterGroupInfoKey(): Uint8Array { return this._attrs[999] }
	get sharedGroupEncSharedGroupInfoKey(): Uint8Array { return this._attrs[1000] }
	get sharedGroup(): Id { return this._attrs[1001] }
	get sharedGroupKeyVersion(): NumberString { return this._attrs[1420] }
	
}
export const GroupInvitationPostDataTypeRef: TypeRef<GroupInvitationPostData> = new TypeRef("tutanota", 1002)

export function createGroupInvitationPostData(values: StrippedEntity<GroupInvitationPostData>): GroupInvitationPostData {
    return Object.assign(create(typeModels[GroupInvitationPostDataTypeRef.typeId], GroupInvitationPostDataTypeRef), values)
}

export type GroupInvitationPostDataParams = {

	_format: NumberString;

	sharedGroupData: SharedGroupData;
	internalKeyData: InternalRecipientKeyData[];
}

export class GroupInvitationPostData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupInvitationPostData> { return GroupInvitationPostDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1003] }
    set _format(v: NumberString) { this._attrs[1003] = v }
	

	get sharedGroupData(): SharedGroupData { return this._attrs[1003] }
	set sharedGroupData(a: SharedGroupData)  { this._attrs[1004] = a } 
	get internalKeyData(): InternalRecipientKeyData[] { return this._attrs[1003] }
	set internalKeyData(a: InternalRecipientKeyData[])  { this._attrs[1005] = a } 
}
export const GroupInvitationPostReturnTypeRef: TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", 1006)

export function createGroupInvitationPostReturn(values: StrippedEntity<GroupInvitationPostReturn>): GroupInvitationPostReturn {
    return Object.assign(create(typeModels[GroupInvitationPostReturnTypeRef.typeId], GroupInvitationPostReturnTypeRef), values)
}

export type GroupInvitationPostReturnParams = {

	_format: NumberString;

	existingMailAddresses: MailAddress[];
	invalidMailAddresses: MailAddress[];
	invitedMailAddresses: MailAddress[];
}

export class GroupInvitationPostReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupInvitationPostReturn> { return GroupInvitationPostReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1007] }
    set _format(v: NumberString) { this._attrs[1007] = v }
	

	get existingMailAddresses(): MailAddress[] { return this._attrs[1007] }
	set existingMailAddresses(a: MailAddress[])  { this._attrs[1008] = a } 
	get invalidMailAddresses(): MailAddress[] { return this._attrs[1007] }
	set invalidMailAddresses(a: MailAddress[])  { this._attrs[1009] = a } 
	get invitedMailAddresses(): MailAddress[] { return this._attrs[1007] }
	set invitedMailAddresses(a: MailAddress[])  { this._attrs[1010] = a } 
}
export const GroupInvitationPutDataTypeRef: TypeRef<GroupInvitationPutData> = new TypeRef("tutanota", 1011)

export function createGroupInvitationPutData(values: StrippedEntity<GroupInvitationPutData>): GroupInvitationPutData {
    return Object.assign(create(typeModels[GroupInvitationPutDataTypeRef.typeId], GroupInvitationPutDataTypeRef), values)
}

export type GroupInvitationPutDataParams = {

	_format: NumberString;
	userGroupEncGroupKey: Uint8Array;
	sharedGroupEncInviteeGroupInfoKey: Uint8Array;
	userGroupKeyVersion: NumberString;
	sharedGroupKeyVersion: NumberString;

	receivedInvitation: IdTuple;
}

export class GroupInvitationPutData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupInvitationPutData> { return GroupInvitationPutDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1012] }
	get userGroupEncGroupKey(): Uint8Array { return this._attrs[1013] }
	get sharedGroupEncInviteeGroupInfoKey(): Uint8Array { return this._attrs[1014] }
	get userGroupKeyVersion(): NumberString { return this._attrs[1418] }
	get sharedGroupKeyVersion(): NumberString { return this._attrs[1419] }
	

	get receivedInvitation(): IdTuple { return this._attrs[1419] }
	set receivedInvitation(a: IdTuple)  { this._attrs[1015] = a } 
}
export const GroupInvitationDeleteDataTypeRef: TypeRef<GroupInvitationDeleteData> = new TypeRef("tutanota", 1016)

export function createGroupInvitationDeleteData(values: StrippedEntity<GroupInvitationDeleteData>): GroupInvitationDeleteData {
    return Object.assign(create(typeModels[GroupInvitationDeleteDataTypeRef.typeId], GroupInvitationDeleteDataTypeRef), values)
}

export type GroupInvitationDeleteDataParams = {

	_format: NumberString;

	receivedInvitation: IdTuple;
}

export class GroupInvitationDeleteData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupInvitationDeleteData> { return GroupInvitationDeleteDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1017] }
    set _format(v: NumberString) { this._attrs[1017] = v }
	

	get receivedInvitation(): IdTuple { return this._attrs[1017] }
	set receivedInvitation(a: IdTuple)  { this._attrs[1018] = a } 
}
export const ReportedMailFieldMarkerTypeRef: TypeRef<ReportedMailFieldMarker> = new TypeRef("tutanota", 1023)

export function createReportedMailFieldMarker(values: StrippedEntity<ReportedMailFieldMarker>): ReportedMailFieldMarker {
    return Object.assign(create(typeModels[ReportedMailFieldMarkerTypeRef.typeId], ReportedMailFieldMarkerTypeRef), values)
}

export type ReportedMailFieldMarkerParams = {

	_id: Id;
	marker: string;
	status: NumberString;
}

export class ReportedMailFieldMarker extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReportedMailFieldMarker> { return ReportedMailFieldMarkerTypeRef };
	

	get _id(): Id { return this._attrs[1024] }
	get marker(): string { return this._attrs[1025] }
	get status(): NumberString { return this._attrs[1026] }
    set status(v: NumberString) { this._attrs[1026] = v }
	
}
export const PhishingMarkerWebsocketDataTypeRef: TypeRef<PhishingMarkerWebsocketData> = new TypeRef("tutanota", 1034)

export function createPhishingMarkerWebsocketData(values: StrippedEntity<PhishingMarkerWebsocketData>): PhishingMarkerWebsocketData {
    return Object.assign(create(typeModels[PhishingMarkerWebsocketDataTypeRef.typeId], PhishingMarkerWebsocketDataTypeRef), values)
}

export type PhishingMarkerWebsocketDataParams = {

	_format: NumberString;
	lastId: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	markers: ReportedMailFieldMarker[];
}

export class PhishingMarkerWebsocketData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PhishingMarkerWebsocketData> { return PhishingMarkerWebsocketDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1035] }
	get lastId(): Id { return this._attrs[1036] }
	get applicationVersionSum(): NumberString { return this._attrs[1652] }
	get applicationTypesHash(): string { return this._attrs[1653] }
    set applicationTypesHash(v: string) { this._attrs[1653] = v }
	

	get markers(): ReportedMailFieldMarker[] { return this._attrs[1653] }
	set markers(a: ReportedMailFieldMarker[])  { this._attrs[1037] = a } 
}
export const ReportMailPostDataTypeRef: TypeRef<ReportMailPostData> = new TypeRef("tutanota", 1066)

export function createReportMailPostData(values: StrippedEntity<ReportMailPostData>): ReportMailPostData {
    return Object.assign(create(typeModels[ReportMailPostDataTypeRef.typeId], ReportMailPostDataTypeRef), values)
}

export type ReportMailPostDataParams = {

	_format: NumberString;
	mailSessionKey: Uint8Array;
	reportType: NumberString;

	mailId: IdTuple;
}

export class ReportMailPostData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReportMailPostData> { return ReportMailPostDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1067] }
	get mailSessionKey(): Uint8Array { return this._attrs[1068] }
	get reportType(): NumberString { return this._attrs[1082] }
    set reportType(v: NumberString) { this._attrs[1082] = v }
	

	get mailId(): IdTuple { return this._attrs[1082] }
	set mailId(a: IdTuple)  { this._attrs[1069] = a } 
}
export const CalendarEventAttendeeTypeRef: TypeRef<CalendarEventAttendee> = new TypeRef("tutanota", 1084)

export function createCalendarEventAttendee(values: StrippedEntity<CalendarEventAttendee>): CalendarEventAttendee {
    return Object.assign(create(typeModels[CalendarEventAttendeeTypeRef.typeId], CalendarEventAttendeeTypeRef), values)
}

export type CalendarEventAttendeeParams = {

	_id: Id;
	status: NumberString;

	address: EncryptedMailAddress;
}

export class CalendarEventAttendee extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarEventAttendee> { return CalendarEventAttendeeTypeRef };
	

	get _id(): Id { return this._attrs[1085] }
	get status(): NumberString { return this._attrs[1086] }
    set status(v: NumberString) { this._attrs[1086] = v }
	

	get address(): EncryptedMailAddress { return this._attrs[1086] }
}
export const CalendarEventUidIndexTypeRef: TypeRef<CalendarEventUidIndex> = new TypeRef("tutanota", 1093)

export function createCalendarEventUidIndex(values: StrippedEntity<CalendarEventUidIndex>): CalendarEventUidIndex {
    return Object.assign(create(typeModels[CalendarEventUidIndexTypeRef.typeId], CalendarEventUidIndexTypeRef), values)
}

export type CalendarEventUidIndexParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	progenitor: null | IdTuple;
	alteredInstances: IdTuple[];
}

export class CalendarEventUidIndex extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarEventUidIndex> { return CalendarEventUidIndexTypeRef };
	

	get _id(): IdTuple { return this._attrs[1095] }
	get _permissions(): Id { return this._attrs[1096] }
	get _format(): NumberString { return this._attrs[1097] }
	get _ownerGroup(): null | Id { return this._attrs[1098] }
	

	get progenitor(): null | IdTuple { return this._attrs[1098] }
	get alteredInstances(): IdTuple[] { return this._attrs[1098] }
	set alteredInstances(a: IdTuple[])  { this._attrs[1321] = a } 
}
export const CalendarEventIndexRefTypeRef: TypeRef<CalendarEventIndexRef> = new TypeRef("tutanota", 1100)

export function createCalendarEventIndexRef(values: StrippedEntity<CalendarEventIndexRef>): CalendarEventIndexRef {
    return Object.assign(create(typeModels[CalendarEventIndexRefTypeRef.typeId], CalendarEventIndexRefTypeRef), values)
}

export type CalendarEventIndexRefParams = {

	_id: Id;

	list: Id;
}

export class CalendarEventIndexRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarEventIndexRef> { return CalendarEventIndexRefTypeRef };
	

	get _id(): Id { return this._attrs[1101] }
	

	get list(): Id { return this._attrs[1101] }
}
export const CalendarEventUpdateTypeRef: TypeRef<CalendarEventUpdate> = new TypeRef("tutanota", 1104)

export function createCalendarEventUpdate(values: StrippedEntity<CalendarEventUpdate>): CalendarEventUpdate {
    return Object.assign(create(typeModels[CalendarEventUpdateTypeRef.typeId], CalendarEventUpdateTypeRef), values)
}

export type CalendarEventUpdateParams = {

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

export class CalendarEventUpdate extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarEventUpdate> { return CalendarEventUpdateTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1106] }
	get _permissions(): Id { return this._attrs[1107] }
	get _format(): NumberString { return this._attrs[1108] }
	get _ownerGroup(): null | Id { return this._attrs[1109] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1110] }
	get sender(): string { return this._attrs[1111] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1405] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1838] }
	

	get file(): IdTuple { return this._attrs[1838] }
}
export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", 1113)

export function createCalendarEventUpdateList(values: StrippedEntity<CalendarEventUpdateList>): CalendarEventUpdateList {
    return Object.assign(create(typeModels[CalendarEventUpdateListTypeRef.typeId], CalendarEventUpdateListTypeRef), values)
}

export type CalendarEventUpdateListParams = {

	_id: Id;

	list: Id;
}

export class CalendarEventUpdateList extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarEventUpdateList> { return CalendarEventUpdateListTypeRef };
	

	get _id(): Id { return this._attrs[1114] }
	

	get list(): Id { return this._attrs[1114] }
}
export const EntropyDataTypeRef: TypeRef<EntropyData> = new TypeRef("tutanota", 1122)

export function createEntropyData(values: StrippedEntity<EntropyData>): EntropyData {
    return Object.assign(create(typeModels[EntropyDataTypeRef.typeId], EntropyDataTypeRef), values)
}

export type EntropyDataParams = {

	_format: NumberString;
	userEncEntropy: Uint8Array;
	userKeyVersion: NumberString;
}

export class EntropyData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<EntropyData> { return EntropyDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1123] }
	get userEncEntropy(): Uint8Array { return this._attrs[1124] }
	get userKeyVersion(): NumberString { return this._attrs[1432] }
    set userKeyVersion(v: NumberString) { this._attrs[1432] = v }
	
}
export const OutOfOfficeNotificationMessageTypeRef: TypeRef<OutOfOfficeNotificationMessage> = new TypeRef("tutanota", 1126)

export function createOutOfOfficeNotificationMessage(values: StrippedEntity<OutOfOfficeNotificationMessage>): OutOfOfficeNotificationMessage {
    return Object.assign(create(typeModels[OutOfOfficeNotificationMessageTypeRef.typeId], OutOfOfficeNotificationMessageTypeRef), values)
}

export type OutOfOfficeNotificationMessageParams = {

	_id: Id;
	subject: string;
	message: string;
	type: NumberString;
}

export class OutOfOfficeNotificationMessage extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<OutOfOfficeNotificationMessage> { return OutOfOfficeNotificationMessageTypeRef };
	

	get _id(): Id { return this._attrs[1127] }
	get subject(): string { return this._attrs[1128] }
	get message(): string { return this._attrs[1129] }
	get type(): NumberString { return this._attrs[1130] }
    set type(v: NumberString) { this._attrs[1130] = v }
	
}
export const OutOfOfficeNotificationTypeRef: TypeRef<OutOfOfficeNotification> = new TypeRef("tutanota", 1131)

export function createOutOfOfficeNotification(values: StrippedEntity<OutOfOfficeNotification>): OutOfOfficeNotification {
    return Object.assign(create(typeModels[OutOfOfficeNotificationTypeRef.typeId], OutOfOfficeNotificationTypeRef), values)
}

export type OutOfOfficeNotificationParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	enabled: boolean;
	startDate: null | Date;
	endDate: null | Date;

	notifications: OutOfOfficeNotificationMessage[];
}

export class OutOfOfficeNotification extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<OutOfOfficeNotification> { return OutOfOfficeNotificationTypeRef };
	

	get _id(): Id { return this._attrs[1133] }
	get _permissions(): Id { return this._attrs[1134] }
	get _format(): NumberString { return this._attrs[1135] }
	get _ownerGroup(): null | Id { return this._attrs[1136] }
	get enabled(): boolean { return this._attrs[1137] }
	get startDate(): null | Date { return this._attrs[1138] }
	get endDate(): null | Date { return this._attrs[1139] }
    set endDate(v: null | Date) { this._attrs[1139] = v }
	

	get notifications(): OutOfOfficeNotificationMessage[] { return this._attrs[1139] }
	set notifications(a: OutOfOfficeNotificationMessage[])  { this._attrs[1140] = a } 
}
export const OutOfOfficeNotificationRecipientTypeRef: TypeRef<OutOfOfficeNotificationRecipient> = new TypeRef("tutanota", 1141)

export function createOutOfOfficeNotificationRecipient(values: StrippedEntity<OutOfOfficeNotificationRecipient>): OutOfOfficeNotificationRecipient {
    return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientTypeRef.typeId], OutOfOfficeNotificationRecipientTypeRef), values)
}

export type OutOfOfficeNotificationRecipientParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
}

export class OutOfOfficeNotificationRecipient extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<OutOfOfficeNotificationRecipient> { return OutOfOfficeNotificationRecipientTypeRef };
	

	get _id(): IdTuple { return this._attrs[1143] }
	get _permissions(): Id { return this._attrs[1144] }
	get _format(): NumberString { return this._attrs[1145] }
	get _ownerGroup(): null | Id { return this._attrs[1146] }
	
}
export const OutOfOfficeNotificationRecipientListTypeRef: TypeRef<OutOfOfficeNotificationRecipientList> = new TypeRef("tutanota", 1147)

export function createOutOfOfficeNotificationRecipientList(values: StrippedEntity<OutOfOfficeNotificationRecipientList>): OutOfOfficeNotificationRecipientList {
    return Object.assign(create(typeModels[OutOfOfficeNotificationRecipientListTypeRef.typeId], OutOfOfficeNotificationRecipientListTypeRef), values)
}

export type OutOfOfficeNotificationRecipientListParams = {

	_id: Id;

	list: Id;
}

export class OutOfOfficeNotificationRecipientList extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<OutOfOfficeNotificationRecipientList> { return OutOfOfficeNotificationRecipientListTypeRef };
	

	get _id(): Id { return this._attrs[1148] }
	

	get list(): Id { return this._attrs[1148] }
}
export const EmailTemplateContentTypeRef: TypeRef<EmailTemplateContent> = new TypeRef("tutanota", 1154)

export function createEmailTemplateContent(values: StrippedEntity<EmailTemplateContent>): EmailTemplateContent {
    return Object.assign(create(typeModels[EmailTemplateContentTypeRef.typeId], EmailTemplateContentTypeRef), values)
}

export type EmailTemplateContentParams = {

	_id: Id;
	text: string;
	languageCode: string;
}

export class EmailTemplateContent extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<EmailTemplateContent> { return EmailTemplateContentTypeRef };
	

	get _id(): Id { return this._attrs[1155] }
	get text(): string { return this._attrs[1156] }
	get languageCode(): string { return this._attrs[1157] }
    set languageCode(v: string) { this._attrs[1157] = v }
	
}
export const EmailTemplateTypeRef: TypeRef<EmailTemplate> = new TypeRef("tutanota", 1158)

export function createEmailTemplate(values: StrippedEntity<EmailTemplate>): EmailTemplate {
    return Object.assign(create(typeModels[EmailTemplateTypeRef.typeId], EmailTemplateTypeRef), values)
}

export type EmailTemplateParams = {

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

export class EmailTemplate extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<EmailTemplate> { return EmailTemplateTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1160] }
	get _permissions(): Id { return this._attrs[1161] }
	get _format(): NumberString { return this._attrs[1162] }
	get _ownerGroup(): null | Id { return this._attrs[1163] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1164] }
	get title(): string { return this._attrs[1165] }
	get tag(): string { return this._attrs[1166] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1406] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1841] }
	

	get contents(): EmailTemplateContent[] { return this._attrs[1841] }
	set contents(a: EmailTemplateContent[])  { this._attrs[1167] = a } 
}
export const KnowledgeBaseEntryKeywordTypeRef: TypeRef<KnowledgeBaseEntryKeyword> = new TypeRef("tutanota", 1168)

export function createKnowledgeBaseEntryKeyword(values: StrippedEntity<KnowledgeBaseEntryKeyword>): KnowledgeBaseEntryKeyword {
    return Object.assign(create(typeModels[KnowledgeBaseEntryKeywordTypeRef.typeId], KnowledgeBaseEntryKeywordTypeRef), values)
}

export type KnowledgeBaseEntryKeywordParams = {

	_id: Id;
	keyword: string;
}

export class KnowledgeBaseEntryKeyword extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<KnowledgeBaseEntryKeyword> { return KnowledgeBaseEntryKeywordTypeRef };
	

	get _id(): Id { return this._attrs[1169] }
	get keyword(): string { return this._attrs[1170] }
    set keyword(v: string) { this._attrs[1170] = v }
	
}
export const KnowledgeBaseEntryTypeRef: TypeRef<KnowledgeBaseEntry> = new TypeRef("tutanota", 1171)

export function createKnowledgeBaseEntry(values: StrippedEntity<KnowledgeBaseEntry>): KnowledgeBaseEntry {
    return Object.assign(create(typeModels[KnowledgeBaseEntryTypeRef.typeId], KnowledgeBaseEntryTypeRef), values)
}

export type KnowledgeBaseEntryParams = {

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

export class KnowledgeBaseEntry extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<KnowledgeBaseEntry> { return KnowledgeBaseEntryTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1173] }
	get _permissions(): Id { return this._attrs[1174] }
	get _format(): NumberString { return this._attrs[1175] }
	get _ownerGroup(): null | Id { return this._attrs[1176] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1177] }
	get title(): string { return this._attrs[1178] }
	get description(): string { return this._attrs[1179] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1413] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1842] }
	

	get keywords(): KnowledgeBaseEntryKeyword[] { return this._attrs[1842] }
	set keywords(a: KnowledgeBaseEntryKeyword[])  { this._attrs[1180] = a } 
}
export const TemplateGroupRootTypeRef: TypeRef<TemplateGroupRoot> = new TypeRef("tutanota", 1181)

export function createTemplateGroupRoot(values: StrippedEntity<TemplateGroupRoot>): TemplateGroupRoot {
    return Object.assign(create(typeModels[TemplateGroupRootTypeRef.typeId], TemplateGroupRootTypeRef), values)
}

export type TemplateGroupRootParams = {

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

export class TemplateGroupRoot extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<TemplateGroupRoot> { return TemplateGroupRootTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[1183] }
	get _permissions(): Id { return this._attrs[1184] }
	get _format(): NumberString { return this._attrs[1185] }
	get _ownerGroup(): null | Id { return this._attrs[1186] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1187] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1412] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1844] }
	

	get templates(): Id { return this._attrs[1844] }
	get knowledgeBase(): Id { return this._attrs[1844] }
}
export const UserAreaGroupDeleteDataTypeRef: TypeRef<UserAreaGroupDeleteData> = new TypeRef("tutanota", 1190)

export function createUserAreaGroupDeleteData(values: StrippedEntity<UserAreaGroupDeleteData>): UserAreaGroupDeleteData {
    return Object.assign(create(typeModels[UserAreaGroupDeleteDataTypeRef.typeId], UserAreaGroupDeleteDataTypeRef), values)
}

export type UserAreaGroupDeleteDataParams = {

	_format: NumberString;

	group: Id;
}

export class UserAreaGroupDeleteData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAreaGroupDeleteData> { return UserAreaGroupDeleteDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1191] }
    set _format(v: NumberString) { this._attrs[1191] = v }
	

	get group(): Id { return this._attrs[1191] }
	set group(a: Id)  { this._attrs[1192] = a } 
}
export const MailboxPropertiesTypeRef: TypeRef<MailboxProperties> = new TypeRef("tutanota", 1195)

export function createMailboxProperties(values: StrippedEntity<MailboxProperties>): MailboxProperties {
    return Object.assign(create(typeModels[MailboxPropertiesTypeRef.typeId], MailboxPropertiesTypeRef), values)
}

export type MailboxPropertiesParams = {

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

export class MailboxProperties extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailboxProperties> { return MailboxPropertiesTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[1197] }
	get _permissions(): Id { return this._attrs[1198] }
	get _format(): NumberString { return this._attrs[1199] }
	get _ownerGroup(): null | Id { return this._attrs[1200] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1201] }
	get reportMovedMails(): NumberString { return this._attrs[1202] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1411] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1846] }
	

	get mailAddressProperties(): MailAddressProperties[] { return this._attrs[1846] }
	set mailAddressProperties(a: MailAddressProperties[])  { this._attrs[1267] = a } 
}
export const SpamResultsTypeRef: TypeRef<SpamResults> = new TypeRef("tutanota", 1217)

export function createSpamResults(values: StrippedEntity<SpamResults>): SpamResults {
    return Object.assign(create(typeModels[SpamResultsTypeRef.typeId], SpamResultsTypeRef), values)
}

export type SpamResultsParams = {

	_id: Id;

	list: Id;
}

export class SpamResults extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SpamResults> { return SpamResultsTypeRef };
	

	get _id(): Id { return this._attrs[1218] }
	

	get list(): Id { return this._attrs[1218] }
}
export const NewsIdTypeRef: TypeRef<NewsId> = new TypeRef("tutanota", 1245)

export function createNewsId(values: StrippedEntity<NewsId>): NewsId {
    return Object.assign(create(typeModels[NewsIdTypeRef.typeId], NewsIdTypeRef), values)
}

export type NewsIdParams = {

	_id: Id;
	newsItemName: string;
	newsItemId: Id;
}

export class NewsId extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NewsId> { return NewsIdTypeRef };
	

	get _id(): Id { return this._attrs[1246] }
	get newsItemName(): string { return this._attrs[1247] }
	get newsItemId(): Id { return this._attrs[1248] }
    set newsItemId(v: Id) { this._attrs[1248] = v }
	
}
export const NewsOutTypeRef: TypeRef<NewsOut> = new TypeRef("tutanota", 1256)

export function createNewsOut(values: StrippedEntity<NewsOut>): NewsOut {
    return Object.assign(create(typeModels[NewsOutTypeRef.typeId], NewsOutTypeRef), values)
}

export type NewsOutParams = {

	_format: NumberString;

	newsItemIds: NewsId[];
}

export class NewsOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NewsOut> { return NewsOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1257] }
    set _format(v: NumberString) { this._attrs[1257] = v }
	

	get newsItemIds(): NewsId[] { return this._attrs[1257] }
	set newsItemIds(a: NewsId[])  { this._attrs[1258] = a } 
}
export const NewsInTypeRef: TypeRef<NewsIn> = new TypeRef("tutanota", 1259)

export function createNewsIn(values: StrippedEntity<NewsIn>): NewsIn {
    return Object.assign(create(typeModels[NewsInTypeRef.typeId], NewsInTypeRef), values)
}

export type NewsInParams = {

	_format: NumberString;
	newsItemId: null | Id;
}

export class NewsIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NewsIn> { return NewsInTypeRef };
	

	get _format(): NumberString { return this._attrs[1260] }
	get newsItemId(): null | Id { return this._attrs[1261] }
    set newsItemId(v: null | Id) { this._attrs[1261] = v }
	
}
export const MailAddressPropertiesTypeRef: TypeRef<MailAddressProperties> = new TypeRef("tutanota", 1263)

export function createMailAddressProperties(values: StrippedEntity<MailAddressProperties>): MailAddressProperties {
    return Object.assign(create(typeModels[MailAddressPropertiesTypeRef.typeId], MailAddressPropertiesTypeRef), values)
}

export type MailAddressPropertiesParams = {

	_id: Id;
	mailAddress: string;
	senderName: string;
}

export class MailAddressProperties extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddressProperties> { return MailAddressPropertiesTypeRef };
	

	get _id(): Id { return this._attrs[1264] }
	get mailAddress(): string { return this._attrs[1265] }
	get senderName(): string { return this._attrs[1266] }
    set senderName(v: string) { this._attrs[1266] = v }
	
}
export const HeaderTypeRef: TypeRef<Header> = new TypeRef("tutanota", 1269)

export function createHeader(values: StrippedEntity<Header>): Header {
    return Object.assign(create(typeModels[HeaderTypeRef.typeId], HeaderTypeRef), values)
}

export type HeaderParams = {

	_id: Id;
	headers: null | string;
	compressedHeaders: null | string;
}

export class Header extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Header> { return HeaderTypeRef };
	

	get _id(): Id { return this._attrs[1270] }
	get headers(): null | string { return this._attrs[1271] }
	get compressedHeaders(): null | string { return this._attrs[1272] }
	
}
export const BodyTypeRef: TypeRef<Body> = new TypeRef("tutanota", 1273)

export function createBody(values: StrippedEntity<Body>): Body {
    return Object.assign(create(typeModels[BodyTypeRef.typeId], BodyTypeRef), values)
}

export type BodyParams = {

	_id: Id;
	text: null | string;
	compressedText: null | string;
}

export class Body extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Body> { return BodyTypeRef };
	

	get _id(): Id { return this._attrs[1274] }
	get text(): null | string { return this._attrs[1275] }
	get compressedText(): null | string { return this._attrs[1276] }
	
}
export const RecipientsTypeRef: TypeRef<Recipients> = new TypeRef("tutanota", 1277)

export function createRecipients(values: StrippedEntity<Recipients>): Recipients {
    return Object.assign(create(typeModels[RecipientsTypeRef.typeId], RecipientsTypeRef), values)
}

export type RecipientsParams = {

	_id: Id;

	toRecipients: MailAddress[];
	ccRecipients: MailAddress[];
	bccRecipients: MailAddress[];
}

export class Recipients extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Recipients> { return RecipientsTypeRef };
	

	get _id(): Id { return this._attrs[1278] }
	

	get toRecipients(): MailAddress[] { return this._attrs[1278] }
	get ccRecipients(): MailAddress[] { return this._attrs[1278] }
	get bccRecipients(): MailAddress[] { return this._attrs[1278] }
}
export const MailDetailsTypeRef: TypeRef<MailDetails> = new TypeRef("tutanota", 1282)

export function createMailDetails(values: StrippedEntity<MailDetails>): MailDetails {
    return Object.assign(create(typeModels[MailDetailsTypeRef.typeId], MailDetailsTypeRef), values)
}

export type MailDetailsParams = {

	_id: Id;
	sentDate: Date;
	authStatus: NumberString;

	replyTos: EncryptedMailAddress[];
	recipients: Recipients;
	headers: null | Header;
	body: Body;
}

export class MailDetails extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailDetails> { return MailDetailsTypeRef };
	

	get _id(): Id { return this._attrs[1283] }
	get sentDate(): Date { return this._attrs[1284] }
	get authStatus(): NumberString { return this._attrs[1289] }
    set authStatus(v: NumberString) { this._attrs[1289] = v }
	

	get replyTos(): EncryptedMailAddress[] { return this._attrs[1289] }
	get recipients(): Recipients { return this._attrs[1289] }
	get headers(): null | Header { return this._attrs[1289] }
	get body(): Body { return this._attrs[1289] }
}
export const MailDetailsDraftTypeRef: TypeRef<MailDetailsDraft> = new TypeRef("tutanota", 1290)

export function createMailDetailsDraft(values: StrippedEntity<MailDetailsDraft>): MailDetailsDraft {
    return Object.assign(create(typeModels[MailDetailsDraftTypeRef.typeId], MailDetailsDraftTypeRef), values)
}

export type MailDetailsDraftParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	details: MailDetails;
}

export class MailDetailsDraft extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailDetailsDraft> { return MailDetailsDraftTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1292] }
	get _permissions(): Id { return this._attrs[1293] }
	get _format(): NumberString { return this._attrs[1294] }
	get _ownerGroup(): null | Id { return this._attrs[1295] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1296] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1407] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1830] }
	

	get details(): MailDetails { return this._attrs[1830] }
}
export const MailDetailsBlobTypeRef: TypeRef<MailDetailsBlob> = new TypeRef("tutanota", 1298)

export function createMailDetailsBlob(values: StrippedEntity<MailDetailsBlob>): MailDetailsBlob {
    return Object.assign(create(typeModels[MailDetailsBlobTypeRef.typeId], MailDetailsBlobTypeRef), values)
}

export type MailDetailsBlobParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	details: MailDetails;
}

export class MailDetailsBlob extends BlobElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailDetailsBlob> { return MailDetailsBlobTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1300] }
	get _permissions(): Id { return this._attrs[1301] }
	get _format(): NumberString { return this._attrs[1302] }
	get _ownerGroup(): null | Id { return this._attrs[1303] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1304] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1408] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1833] }
	

	get details(): MailDetails { return this._attrs[1833] }
}
export const UpdateMailFolderDataTypeRef: TypeRef<UpdateMailFolderData> = new TypeRef("tutanota", 1311)

export function createUpdateMailFolderData(values: StrippedEntity<UpdateMailFolderData>): UpdateMailFolderData {
    return Object.assign(create(typeModels[UpdateMailFolderDataTypeRef.typeId], UpdateMailFolderDataTypeRef), values)
}

export type UpdateMailFolderDataParams = {

	_format: NumberString;

	folder: IdTuple;
	newParent: null | IdTuple;
}

export class UpdateMailFolderData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UpdateMailFolderData> { return UpdateMailFolderDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1312] }
    set _format(v: NumberString) { this._attrs[1312] = v }
	

	get folder(): IdTuple { return this._attrs[1312] }
	set folder(a: IdTuple)  { this._attrs[1313] = a } 
	get newParent(): null | IdTuple { return this._attrs[1312] }
	set newParent(a: IdTuple)  { this._attrs[1314] = a } 
}
export const MailDetailsDraftsRefTypeRef: TypeRef<MailDetailsDraftsRef> = new TypeRef("tutanota", 1315)

export function createMailDetailsDraftsRef(values: StrippedEntity<MailDetailsDraftsRef>): MailDetailsDraftsRef {
    return Object.assign(create(typeModels[MailDetailsDraftsRefTypeRef.typeId], MailDetailsDraftsRefTypeRef), values)
}

export type MailDetailsDraftsRefParams = {

	_id: Id;

	list: Id;
}

export class MailDetailsDraftsRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailDetailsDraftsRef> { return MailDetailsDraftsRefTypeRef };
	

	get _id(): Id { return this._attrs[1316] }
	

	get list(): Id { return this._attrs[1316] }
}
export const ContactListEntryTypeRef: TypeRef<ContactListEntry> = new TypeRef("tutanota", 1325)

export function createContactListEntry(values: StrippedEntity<ContactListEntry>): ContactListEntry {
    return Object.assign(create(typeModels[ContactListEntryTypeRef.typeId], ContactListEntryTypeRef), values)
}

export type ContactListEntryParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	emailAddress: string;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;
}

export class ContactListEntry extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactListEntry> { return ContactListEntryTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1327] }
	get _permissions(): Id { return this._attrs[1328] }
	get _format(): NumberString { return this._attrs[1329] }
	get _ownerGroup(): null | Id { return this._attrs[1330] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1331] }
	get emailAddress(): string { return this._attrs[1332] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1409] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1835] }
	
}
export const ContactListGroupRootTypeRef: TypeRef<ContactListGroupRoot> = new TypeRef("tutanota", 1333)

export function createContactListGroupRoot(values: StrippedEntity<ContactListGroupRoot>): ContactListGroupRoot {
    return Object.assign(create(typeModels[ContactListGroupRootTypeRef.typeId], ContactListGroupRootTypeRef), values)
}

export type ContactListGroupRootParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	entries: Id;
}

export class ContactListGroupRoot extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactListGroupRoot> { return ContactListGroupRootTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[1335] }
	get _permissions(): Id { return this._attrs[1336] }
	get _format(): NumberString { return this._attrs[1337] }
	get _ownerGroup(): null | Id { return this._attrs[1338] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1339] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1410] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1836] }
	

	get entries(): Id { return this._attrs[1836] }
}
export const SymEncInternalRecipientKeyDataTypeRef: TypeRef<SymEncInternalRecipientKeyData> = new TypeRef("tutanota", 1347)

export function createSymEncInternalRecipientKeyData(values: StrippedEntity<SymEncInternalRecipientKeyData>): SymEncInternalRecipientKeyData {
    return Object.assign(create(typeModels[SymEncInternalRecipientKeyDataTypeRef.typeId], SymEncInternalRecipientKeyDataTypeRef), values)
}

export type SymEncInternalRecipientKeyDataParams = {

	_id: Id;
	mailAddress: string;
	symEncBucketKey: Uint8Array;
	symKeyVersion: NumberString;

	keyGroup: Id;
}

export class SymEncInternalRecipientKeyData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SymEncInternalRecipientKeyData> { return SymEncInternalRecipientKeyDataTypeRef };
	

	get _id(): Id { return this._attrs[1348] }
	get mailAddress(): string { return this._attrs[1349] }
	get symEncBucketKey(): Uint8Array { return this._attrs[1350] }
	get symKeyVersion(): NumberString { return this._attrs[1435] }
    set symKeyVersion(v: NumberString) { this._attrs[1435] = v }
	

	get keyGroup(): Id { return this._attrs[1435] }
}
export const ContactCustomDateTypeRef: TypeRef<ContactCustomDate> = new TypeRef("tutanota", 1356)

export function createContactCustomDate(values: StrippedEntity<ContactCustomDate>): ContactCustomDate {
    return Object.assign(create(typeModels[ContactCustomDateTypeRef.typeId], ContactCustomDateTypeRef), values)
}

export type ContactCustomDateParams = {

	_id: Id;
	type: NumberString;
	customTypeName: string;
	dateIso: string;
}

export class ContactCustomDate extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactCustomDate> { return ContactCustomDateTypeRef };
	

	get _id(): Id { return this._attrs[1357] }
	get type(): NumberString { return this._attrs[1358] }
	get customTypeName(): string { return this._attrs[1359] }
	get dateIso(): string { return this._attrs[1360] }
    set dateIso(v: string) { this._attrs[1360] = v }
	
}
export const ContactWebsiteTypeRef: TypeRef<ContactWebsite> = new TypeRef("tutanota", 1361)

export function createContactWebsite(values: StrippedEntity<ContactWebsite>): ContactWebsite {
    return Object.assign(create(typeModels[ContactWebsiteTypeRef.typeId], ContactWebsiteTypeRef), values)
}

export type ContactWebsiteParams = {

	_id: Id;
	type: NumberString;
	customTypeName: string;
	url: string;
}

export class ContactWebsite extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactWebsite> { return ContactWebsiteTypeRef };
	

	get _id(): Id { return this._attrs[1362] }
	get type(): NumberString { return this._attrs[1363] }
	get customTypeName(): string { return this._attrs[1364] }
	get url(): string { return this._attrs[1365] }
    set url(v: string) { this._attrs[1365] = v }
	
}
export const ContactRelationshipTypeRef: TypeRef<ContactRelationship> = new TypeRef("tutanota", 1366)

export function createContactRelationship(values: StrippedEntity<ContactRelationship>): ContactRelationship {
    return Object.assign(create(typeModels[ContactRelationshipTypeRef.typeId], ContactRelationshipTypeRef), values)
}

export type ContactRelationshipParams = {

	_id: Id;
	type: NumberString;
	customTypeName: string;
	person: string;
}

export class ContactRelationship extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactRelationship> { return ContactRelationshipTypeRef };
	

	get _id(): Id { return this._attrs[1367] }
	get type(): NumberString { return this._attrs[1368] }
	get customTypeName(): string { return this._attrs[1369] }
	get person(): string { return this._attrs[1370] }
    set person(v: string) { this._attrs[1370] = v }
	
}
export const ContactMessengerHandleTypeRef: TypeRef<ContactMessengerHandle> = new TypeRef("tutanota", 1371)

export function createContactMessengerHandle(values: StrippedEntity<ContactMessengerHandle>): ContactMessengerHandle {
    return Object.assign(create(typeModels[ContactMessengerHandleTypeRef.typeId], ContactMessengerHandleTypeRef), values)
}

export type ContactMessengerHandleParams = {

	_id: Id;
	type: NumberString;
	customTypeName: string;
	handle: string;
}

export class ContactMessengerHandle extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactMessengerHandle> { return ContactMessengerHandleTypeRef };
	

	get _id(): Id { return this._attrs[1372] }
	get type(): NumberString { return this._attrs[1373] }
	get customTypeName(): string { return this._attrs[1374] }
	get handle(): string { return this._attrs[1375] }
    set handle(v: string) { this._attrs[1375] = v }
	
}
export const ContactPronounsTypeRef: TypeRef<ContactPronouns> = new TypeRef("tutanota", 1376)

export function createContactPronouns(values: StrippedEntity<ContactPronouns>): ContactPronouns {
    return Object.assign(create(typeModels[ContactPronounsTypeRef.typeId], ContactPronounsTypeRef), values)
}

export type ContactPronounsParams = {

	_id: Id;
	language: string;
	pronouns: string;
}

export class ContactPronouns extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ContactPronouns> { return ContactPronounsTypeRef };
	

	get _id(): Id { return this._attrs[1377] }
	get language(): string { return this._attrs[1378] }
	get pronouns(): string { return this._attrs[1379] }
    set pronouns(v: string) { this._attrs[1379] = v }
	
}
export const TranslationGetInTypeRef: TypeRef<TranslationGetIn> = new TypeRef("tutanota", 1436)

export function createTranslationGetIn(values: StrippedEntity<TranslationGetIn>): TranslationGetIn {
    return Object.assign(create(typeModels[TranslationGetInTypeRef.typeId], TranslationGetInTypeRef), values)
}

export type TranslationGetInParams = {

	_format: NumberString;
	lang: string;
}

export class TranslationGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<TranslationGetIn> { return TranslationGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[1437] }
	get lang(): string { return this._attrs[1438] }
	
}
export const TranslationGetOutTypeRef: TypeRef<TranslationGetOut> = new TypeRef("tutanota", 1439)

export function createTranslationGetOut(values: StrippedEntity<TranslationGetOut>): TranslationGetOut {
    return Object.assign(create(typeModels[TranslationGetOutTypeRef.typeId], TranslationGetOutTypeRef), values)
}

export type TranslationGetOutParams = {

	_format: NumberString;
	giftCardSubject: string;
	invitationSubject: string;
}

export class TranslationGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<TranslationGetOut> { return TranslationGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1440] }
	get giftCardSubject(): string { return this._attrs[1441] }
	get invitationSubject(): string { return this._attrs[1442] }
    set invitationSubject(v: string) { this._attrs[1442] = v }
	
}
export const DefaultAlarmInfoTypeRef: TypeRef<DefaultAlarmInfo> = new TypeRef("tutanota", 1446)

export function createDefaultAlarmInfo(values: StrippedEntity<DefaultAlarmInfo>): DefaultAlarmInfo {
    return Object.assign(create(typeModels[DefaultAlarmInfoTypeRef.typeId], DefaultAlarmInfoTypeRef), values)
}

export type DefaultAlarmInfoParams = {

	_id: Id;
	trigger: string;
}

export class DefaultAlarmInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DefaultAlarmInfo> { return DefaultAlarmInfoTypeRef };
	

	get _id(): Id { return this._attrs[1447] }
	get trigger(): string { return this._attrs[1448] }
	
}
export const MailSetEntryTypeRef: TypeRef<MailSetEntry> = new TypeRef("tutanota", 1450)

export function createMailSetEntry(values: StrippedEntity<MailSetEntry>): MailSetEntry {
    return Object.assign(create(typeModels[MailSetEntryTypeRef.typeId], MailSetEntryTypeRef), values)
}

export type MailSetEntryParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	mail: IdTuple;
}

export class MailSetEntry extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailSetEntry> { return MailSetEntryTypeRef };
	

	get _id(): IdTuple { return this._attrs[1452] }
	get _permissions(): Id { return this._attrs[1453] }
	get _format(): NumberString { return this._attrs[1454] }
	get _ownerGroup(): null | Id { return this._attrs[1455] }
	

	get mail(): IdTuple { return this._attrs[1455] }
}
export const MailBagTypeRef: TypeRef<MailBag> = new TypeRef("tutanota", 1460)

export function createMailBag(values: StrippedEntity<MailBag>): MailBag {
    return Object.assign(create(typeModels[MailBagTypeRef.typeId], MailBagTypeRef), values)
}

export type MailBagParams = {

	_id: Id;

	mails: Id;
}

export class MailBag extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailBag> { return MailBagTypeRef };
	

	get _id(): Id { return this._attrs[1461] }
	

	get mails(): Id { return this._attrs[1461] }
}
export const SimpleMoveMailPostInTypeRef: TypeRef<SimpleMoveMailPostIn> = new TypeRef("tutanota", 1469)

export function createSimpleMoveMailPostIn(values: StrippedEntity<SimpleMoveMailPostIn>): SimpleMoveMailPostIn {
    return Object.assign(create(typeModels[SimpleMoveMailPostInTypeRef.typeId], SimpleMoveMailPostInTypeRef), values)
}

export type SimpleMoveMailPostInParams = {

	_format: NumberString;
	destinationSetType: NumberString;
	moveReason: null | NumberString;

	mails: IdTuple[];
}

export class SimpleMoveMailPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SimpleMoveMailPostIn> { return SimpleMoveMailPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[1470] }
	get destinationSetType(): NumberString { return this._attrs[1472] }
	get moveReason(): null | NumberString { return this._attrs[1713] }
    set moveReason(v: null | NumberString) { this._attrs[1713] = v }
	

	get mails(): IdTuple[] { return this._attrs[1713] }
	set mails(a: IdTuple[])  { this._attrs[1471] = a } 
}
export const UnreadMailStatePostInTypeRef: TypeRef<UnreadMailStatePostIn> = new TypeRef("tutanota", 1474)

export function createUnreadMailStatePostIn(values: StrippedEntity<UnreadMailStatePostIn>): UnreadMailStatePostIn {
    return Object.assign(create(typeModels[UnreadMailStatePostInTypeRef.typeId], UnreadMailStatePostInTypeRef), values)
}

export type UnreadMailStatePostInParams = {

	_format: NumberString;
	unread: boolean;

	mails: IdTuple[];
}

export class UnreadMailStatePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UnreadMailStatePostIn> { return UnreadMailStatePostInTypeRef };
	

	get _format(): NumberString { return this._attrs[1475] }
	get unread(): boolean { return this._attrs[1477] }
    set unread(v: boolean) { this._attrs[1477] = v }
	

	get mails(): IdTuple[] { return this._attrs[1477] }
	set mails(a: IdTuple[])  { this._attrs[1476] = a } 
}
export const ManageLabelServiceLabelDataTypeRef: TypeRef<ManageLabelServiceLabelData> = new TypeRef("tutanota", 1480)

export function createManageLabelServiceLabelData(values: StrippedEntity<ManageLabelServiceLabelData>): ManageLabelServiceLabelData {
    return Object.assign(create(typeModels[ManageLabelServiceLabelDataTypeRef.typeId], ManageLabelServiceLabelDataTypeRef), values)
}

export type ManageLabelServiceLabelDataParams = {

	_id: Id;
	name: string;
	color: string;
}

export class ManageLabelServiceLabelData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ManageLabelServiceLabelData> { return ManageLabelServiceLabelDataTypeRef };
	

	get _id(): Id { return this._attrs[1481] }
	get name(): string { return this._attrs[1482] }
	get color(): string { return this._attrs[1483] }
    set color(v: string) { this._attrs[1483] = v }
	
}
export const ManageLabelServicePostInTypeRef: TypeRef<ManageLabelServicePostIn> = new TypeRef("tutanota", 1484)

export function createManageLabelServicePostIn(values: StrippedEntity<ManageLabelServicePostIn>): ManageLabelServicePostIn {
    return Object.assign(create(typeModels[ManageLabelServicePostInTypeRef.typeId], ManageLabelServicePostInTypeRef), values)
}

export type ManageLabelServicePostInParams = {

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	ownerGroup: Id;

	data: ManageLabelServiceLabelData;
}

export class ManageLabelServicePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ManageLabelServicePostIn> { return ManageLabelServicePostInTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[1485] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[1486] }
	get ownerKeyVersion(): NumberString { return this._attrs[1487] }
	get ownerGroup(): Id { return this._attrs[1488] }
    set ownerGroup(v: Id) { this._attrs[1488] = v }
	

	get data(): ManageLabelServiceLabelData { return this._attrs[1488] }
	set data(a: ManageLabelServiceLabelData)  { this._attrs[1489] = a } 
}
export const ManageLabelServicePostOutTypeRef: TypeRef<ManageLabelServicePostOut> = new TypeRef("tutanota", 1490)

export function createManageLabelServicePostOut(values: StrippedEntity<ManageLabelServicePostOut>): ManageLabelServicePostOut {
    return Object.assign(create(typeModels[ManageLabelServicePostOutTypeRef.typeId], ManageLabelServicePostOutTypeRef), values)
}

export type ManageLabelServicePostOutParams = {

	_format: NumberString;

	label: IdTuple;
}

export class ManageLabelServicePostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ManageLabelServicePostOut> { return ManageLabelServicePostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1491] }
    set _format(v: NumberString) { this._attrs[1491] = v }
	

	get label(): IdTuple { return this._attrs[1491] }
	set label(a: IdTuple)  { this._attrs[1492] = a } 
}
export const ManageLabelServiceDeleteInTypeRef: TypeRef<ManageLabelServiceDeleteIn> = new TypeRef("tutanota", 1500)

export function createManageLabelServiceDeleteIn(values: StrippedEntity<ManageLabelServiceDeleteIn>): ManageLabelServiceDeleteIn {
    return Object.assign(create(typeModels[ManageLabelServiceDeleteInTypeRef.typeId], ManageLabelServiceDeleteInTypeRef), values)
}

export type ManageLabelServiceDeleteInParams = {

	_format: NumberString;

	label: IdTuple;
}

export class ManageLabelServiceDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ManageLabelServiceDeleteIn> { return ManageLabelServiceDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[1501] }
    set _format(v: NumberString) { this._attrs[1501] = v }
	

	get label(): IdTuple { return this._attrs[1501] }
	set label(a: IdTuple)  { this._attrs[1502] = a } 
}
export const ApplyLabelServicePostInTypeRef: TypeRef<ApplyLabelServicePostIn> = new TypeRef("tutanota", 1504)

export function createApplyLabelServicePostIn(values: StrippedEntity<ApplyLabelServicePostIn>): ApplyLabelServicePostIn {
    return Object.assign(create(typeModels[ApplyLabelServicePostInTypeRef.typeId], ApplyLabelServicePostInTypeRef), values)
}

export type ApplyLabelServicePostInParams = {

	_format: NumberString;

	mails: IdTuple[];
	addedLabels: IdTuple[];
	removedLabels: IdTuple[];
}

export class ApplyLabelServicePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ApplyLabelServicePostIn> { return ApplyLabelServicePostInTypeRef };
	

	get _format(): NumberString { return this._attrs[1505] }
    set _format(v: NumberString) { this._attrs[1505] = v }
	

	get mails(): IdTuple[] { return this._attrs[1505] }
	set mails(a: IdTuple[])  { this._attrs[1506] = a } 
	get addedLabels(): IdTuple[] { return this._attrs[1505] }
	set addedLabels(a: IdTuple[])  { this._attrs[1507] = a } 
	get removedLabels(): IdTuple[] { return this._attrs[1505] }
	set removedLabels(a: IdTuple[])  { this._attrs[1508] = a } 
}
export const ImportMailDataMailReferenceTypeRef: TypeRef<ImportMailDataMailReference> = new TypeRef("tutanota", 1513)

export function createImportMailDataMailReference(values: StrippedEntity<ImportMailDataMailReference>): ImportMailDataMailReference {
    return Object.assign(create(typeModels[ImportMailDataMailReferenceTypeRef.typeId], ImportMailDataMailReferenceTypeRef), values)
}

export type ImportMailDataMailReferenceParams = {

	_id: Id;
	reference: string;
}

export class ImportMailDataMailReference extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportMailDataMailReference> { return ImportMailDataMailReferenceTypeRef };
	

	get _id(): Id { return this._attrs[1514] }
	get reference(): string { return this._attrs[1515] }
    set reference(v: string) { this._attrs[1515] = v }
	
}
export const NewImportAttachmentTypeRef: TypeRef<NewImportAttachment> = new TypeRef("tutanota", 1516)

export function createNewImportAttachment(values: StrippedEntity<NewImportAttachment>): NewImportAttachment {
    return Object.assign(create(typeModels[NewImportAttachmentTypeRef.typeId], NewImportAttachmentTypeRef), values)
}

export type NewImportAttachmentParams = {

	_id: Id;
	ownerEncFileHashSessionKey: null | Uint8Array;
	encFileHash: null | Uint8Array;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;
	encCid: null | Uint8Array;
	ownerKeyVersion: null | NumberString;

	referenceTokens: BlobReferenceTokenWrapper[];
}

export class NewImportAttachment extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NewImportAttachment> { return NewImportAttachmentTypeRef };
	

	get _id(): Id { return this._attrs[1517] }
	get ownerEncFileHashSessionKey(): null | Uint8Array { return this._attrs[1518] }
	get encFileHash(): null | Uint8Array { return this._attrs[1519] }
	get encFileName(): Uint8Array { return this._attrs[1520] }
	get encMimeType(): Uint8Array { return this._attrs[1521] }
	get encCid(): null | Uint8Array { return this._attrs[1522] }
	get ownerKeyVersion(): null | NumberString { return this._attrs[1894] }
	

	get referenceTokens(): BlobReferenceTokenWrapper[] { return this._attrs[1894] }
}
export const ImportAttachmentTypeRef: TypeRef<ImportAttachment> = new TypeRef("tutanota", 1524)

export function createImportAttachment(values: StrippedEntity<ImportAttachment>): ImportAttachment {
    return Object.assign(create(typeModels[ImportAttachmentTypeRef.typeId], ImportAttachmentTypeRef), values)
}

export type ImportAttachmentParams = {

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;
	ownerFileKeyVersion: NumberString;

	newAttachment: null | NewImportAttachment;
	existingAttachmentFile: null | IdTuple;
}

export class ImportAttachment extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportAttachment> { return ImportAttachmentTypeRef };
	

	get _id(): Id { return this._attrs[1525] }
	get ownerEncFileSessionKey(): Uint8Array { return this._attrs[1526] }
	get ownerFileKeyVersion(): NumberString { return this._attrs[1527] }
    set ownerFileKeyVersion(v: NumberString) { this._attrs[1527] = v }
	

	get newAttachment(): null | NewImportAttachment { return this._attrs[1527] }
	get existingAttachmentFile(): null | IdTuple { return this._attrs[1527] }
}
export const ImportMailDataTypeRef: TypeRef<ImportMailData> = new TypeRef("tutanota", 1530)

export function createImportMailData(values: StrippedEntity<ImportMailData>): ImportMailData {
    return Object.assign(create(typeModels[ImportMailDataTypeRef.typeId], ImportMailDataTypeRef), values)
}

export type ImportMailDataParams = {

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

export class ImportMailData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportMailData> { return ImportMailDataTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[1531] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[1532] }
	get ownerKeyVersion(): NumberString { return this._attrs[1533] }
	get subject(): string { return this._attrs[1534] }
	get compressedBodyText(): string { return this._attrs[1535] }
	get date(): Date { return this._attrs[1536] }
	get state(): NumberString { return this._attrs[1537] }
	get unread(): boolean { return this._attrs[1538] }
	get messageId(): null | string { return this._attrs[1539] }
	get inReplyTo(): null | string { return this._attrs[1540] }
	get confidential(): boolean { return this._attrs[1541] }
	get method(): NumberString { return this._attrs[1542] }
	get replyType(): NumberString { return this._attrs[1543] }
	get differentEnvelopeSender(): null | string { return this._attrs[1544] }
	get phishingStatus(): NumberString { return this._attrs[1545] }
	get compressedHeaders(): string { return this._attrs[1546] }
	get imapModSeq(): null | NumberString { return this._attrs[1965] }
	get imapUid(): null | NumberString { return this._attrs[1966] }
    set imapUid(v: null | NumberString) { this._attrs[1966] = v }
	

	get references(): ImportMailDataMailReference[] { return this._attrs[1966] }
	get sender(): MailAddress { return this._attrs[1966] }
	get replyTos(): EncryptedMailAddress[] { return this._attrs[1966] }
	set replyTos(a: EncryptedMailAddress[])  { this._attrs[1549] = a } 
	get recipients(): Recipients { return this._attrs[1966] }
	get importedAttachments(): ImportAttachment[] { return this._attrs[1966] }
}
export const ImportedFileMailTypeRef: TypeRef<ImportedFileMail> = new TypeRef("tutanota", 1552)

export function createImportedFileMail(values: StrippedEntity<ImportedFileMail>): ImportedFileMail {
    return Object.assign(create(typeModels[ImportedFileMailTypeRef.typeId], ImportedFileMailTypeRef), values)
}

export type ImportedFileMailParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	mailSetEntry: IdTuple;
}

export class ImportedFileMail extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportedFileMail> { return ImportedFileMailTypeRef };
	

	get _id(): IdTuple { return this._attrs[1554] }
	get _permissions(): Id { return this._attrs[1555] }
	get _format(): NumberString { return this._attrs[1556] }
	get _ownerGroup(): null | Id { return this._attrs[1557] }
	

	get mailSetEntry(): IdTuple { return this._attrs[1557] }
	set mailSetEntry(a: IdTuple)  { this._attrs[1558] = a } 
}
export const ImportFileMailStateTypeRef: TypeRef<ImportFileMailState> = new TypeRef("tutanota", 1559)

export function createImportFileMailState(values: StrippedEntity<ImportFileMailState>): ImportFileMailState {
    return Object.assign(create(typeModels[ImportFileMailStateTypeRef.typeId], ImportFileMailStateTypeRef), values)
}

export type ImportFileMailStateParams = {

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

export class ImportFileMailState extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportFileMailState> { return ImportFileMailStateTypeRef };
	

	get _id(): IdTuple { return this._attrs[1561] }
	get _permissions(): Id { return this._attrs[1562] }
	get _format(): NumberString { return this._attrs[1563] }
	get _ownerGroup(): null | Id { return this._attrs[1564] }
	get status(): NumberString { return this._attrs[1565] }
	get successfulMails(): NumberString { return this._attrs[1566] }
	get failedMails(): NumberString { return this._attrs[1567] }
	get totalMails(): NumberString { return this._attrs[1600] }
    set totalMails(v: NumberString) { this._attrs[1600] = v }
	

	get importedMails(): Id { return this._attrs[1600] }
	get targetFolder(): IdTuple { return this._attrs[1600] }
}
export const ImportMailPostInTypeRef: TypeRef<ImportMailPostIn> = new TypeRef("tutanota", 1570)

export function createImportMailPostIn(values: StrippedEntity<ImportMailPostIn>): ImportMailPostIn {
    return Object.assign(create(typeModels[ImportMailPostInTypeRef.typeId], ImportMailPostInTypeRef), values)
}

export type ImportMailPostInParams = {

	_format: NumberString;

	importFileMailState: null | IdTuple;
	encImports: StringWrapper[];
	imapFolderSyncState: null | IdTuple;
}

export class ImportMailPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportMailPostIn> { return ImportMailPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[1571] }
    set _format(v: NumberString) { this._attrs[1571] = v }
	

	get importFileMailState(): null | IdTuple { return this._attrs[1571] }
	get encImports(): StringWrapper[] { return this._attrs[1571] }
	set encImports(a: StringWrapper[])  { this._attrs[1578] = a } 
	get imapFolderSyncState(): null | IdTuple { return this._attrs[1571] }
	set imapFolderSyncState(a: IdTuple)  { this._attrs[1964] = a } 
}
export const ImportMailPostOutTypeRef: TypeRef<ImportMailPostOut> = new TypeRef("tutanota", 1579)

export function createImportMailPostOut(values: StrippedEntity<ImportMailPostOut>): ImportMailPostOut {
    return Object.assign(create(typeModels[ImportMailPostOutTypeRef.typeId], ImportMailPostOutTypeRef), values)
}

export type ImportMailPostOutParams = {

	_format: NumberString;
}

export class ImportMailPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportMailPostOut> { return ImportMailPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1580] }
    set _format(v: NumberString) { this._attrs[1580] = v }
	
}
export const ImportMailGetInTypeRef: TypeRef<ImportMailGetIn> = new TypeRef("tutanota", 1582)

export function createImportMailGetIn(values: StrippedEntity<ImportMailGetIn>): ImportMailGetIn {
    return Object.assign(create(typeModels[ImportMailGetInTypeRef.typeId], ImportMailGetInTypeRef), values)
}

export type ImportMailGetInParams = {

	_format: NumberString;
	ownerGroup: Id;
	ownerKeyVersion: NumberString;
	ownerEncSessionKey: Uint8Array;
	newImportedMailSetName: string;
	totalMails: NumberString;

	targetMailFolder: IdTuple;
}

export class ImportMailGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportMailGetIn> { return ImportMailGetInTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[1583] }
	get ownerGroup(): Id { return this._attrs[1594] }
	get ownerKeyVersion(): NumberString { return this._attrs[1595] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[1596] }
	get newImportedMailSetName(): string { return this._attrs[1597] }
	get totalMails(): NumberString { return this._attrs[1598] }
    set totalMails(v: NumberString) { this._attrs[1598] = v }
	

	get targetMailFolder(): IdTuple { return this._attrs[1598] }
}
export const AdvancedRepeatRuleTypeRef: TypeRef<AdvancedRepeatRule> = new TypeRef("tutanota", 1586)

export function createAdvancedRepeatRule(values: StrippedEntity<AdvancedRepeatRule>): AdvancedRepeatRule {
    return Object.assign(create(typeModels[AdvancedRepeatRuleTypeRef.typeId], AdvancedRepeatRuleTypeRef), values)
}

export type AdvancedRepeatRuleParams = {

	_id: Id;
	ruleType: NumberString;
	interval: string;
}

export class AdvancedRepeatRule extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AdvancedRepeatRule> { return AdvancedRepeatRuleTypeRef };
	

	get _id(): Id { return this._attrs[1587] }
	get ruleType(): NumberString { return this._attrs[1588] }
	get interval(): string { return this._attrs[1589] }
    set interval(v: string) { this._attrs[1589] = v }
	
}
export const ImportMailGetOutTypeRef: TypeRef<ImportMailGetOut> = new TypeRef("tutanota", 1591)

export function createImportMailGetOut(values: StrippedEntity<ImportMailGetOut>): ImportMailGetOut {
    return Object.assign(create(typeModels[ImportMailGetOutTypeRef.typeId], ImportMailGetOutTypeRef), values)
}

export type ImportMailGetOutParams = {

	_format: NumberString;

	importFileMailState: IdTuple;
}

export class ImportMailGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportMailGetOut> { return ImportMailGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1592] }
    set _format(v: NumberString) { this._attrs[1592] = v }
	

	get importFileMailState(): IdTuple { return this._attrs[1592] }
}
export const MailExportTokenServicePostOutTypeRef: TypeRef<MailExportTokenServicePostOut> = new TypeRef("tutanota", 1605)

export function createMailExportTokenServicePostOut(values: StrippedEntity<MailExportTokenServicePostOut>): MailExportTokenServicePostOut {
    return Object.assign(create(typeModels[MailExportTokenServicePostOutTypeRef.typeId], MailExportTokenServicePostOutTypeRef), values)
}

export type MailExportTokenServicePostOutParams = {

	_format: NumberString;
	mailExportToken: string;
}

export class MailExportTokenServicePostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailExportTokenServicePostOut> { return MailExportTokenServicePostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1606] }
	get mailExportToken(): string { return this._attrs[1607] }
    set mailExportToken(v: string) { this._attrs[1607] = v }
	
}
export const SupportTopicTypeRef: TypeRef<SupportTopic> = new TypeRef("tutanota", 1618)

export function createSupportTopic(values: StrippedEntity<SupportTopic>): SupportTopic {
    return Object.assign(create(typeModels[SupportTopicTypeRef.typeId], SupportTopicTypeRef), values)
}

export type SupportTopicParams = {

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

export class SupportTopic extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SupportTopic> { return SupportTopicTypeRef };
	

	get _id(): Id { return this._attrs[1619] }
	get lastUpdated(): Date { return this._attrs[1620] }
	get issueEN(): string { return this._attrs[1621] }
	get issueDE(): string { return this._attrs[1622] }
	get solutionHtmlEN(): string { return this._attrs[1623] }
	get solutionHtmlDE(): string { return this._attrs[1624] }
	get visibility(): NumberString { return this._attrs[1625] }
	get contactTemplateHtmlEN(): string { return this._attrs[1654] }
	get contactTemplateHtmlDE(): string { return this._attrs[1655] }
	get helpTextEN(): string { return this._attrs[1656] }
	get helpTextDE(): string { return this._attrs[1657] }
	get contactSupportTextEN(): null | string { return this._attrs[1658] }
	get contactSupportTextDE(): null | string { return this._attrs[1659] }
    set contactSupportTextDE(v: null | string) { this._attrs[1659] = v }
	
}
export const SupportCategoryTypeRef: TypeRef<SupportCategory> = new TypeRef("tutanota", 1626)

export function createSupportCategory(values: StrippedEntity<SupportCategory>): SupportCategory {
    return Object.assign(create(typeModels[SupportCategoryTypeRef.typeId], SupportCategoryTypeRef), values)
}

export type SupportCategoryParams = {

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

export class SupportCategory extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SupportCategory> { return SupportCategoryTypeRef };
	

	get _id(): Id { return this._attrs[1627] }
	get nameEN(): string { return this._attrs[1628] }
	get nameDE(): string { return this._attrs[1629] }
	get introductionEN(): string { return this._attrs[1630] }
	get introductionDE(): string { return this._attrs[1631] }
	get icon(): string { return this._attrs[1632] }
	get contactTemplateHtmlEN(): string { return this._attrs[1660] }
	get contactTemplateHtmlDE(): string { return this._attrs[1661] }
	get helpTextEN(): string { return this._attrs[1662] }
	get helpTextDE(): string { return this._attrs[1663] }
    set helpTextDE(v: string) { this._attrs[1663] = v }
	

	get topics(): SupportTopic[] { return this._attrs[1663] }
	set topics(a: SupportTopic[])  { this._attrs[1633] = a } 
}
export const SupportDataTypeRef: TypeRef<SupportData> = new TypeRef("tutanota", 1634)

export function createSupportData(values: StrippedEntity<SupportData>): SupportData {
    return Object.assign(create(typeModels[SupportDataTypeRef.typeId], SupportDataTypeRef), values)
}

export type SupportDataParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	categories: SupportCategory[];
}

export class SupportData extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SupportData> { return SupportDataTypeRef };
	

	get _id(): Id { return this._attrs[1636] }
	get _permissions(): Id { return this._attrs[1637] }
	get _format(): NumberString { return this._attrs[1638] }
	get _ownerGroup(): null | Id { return this._attrs[1639] }
	

	get categories(): SupportCategory[] { return this._attrs[1639] }
	set categories(a: SupportCategory[])  { this._attrs[1640] = a } 
}
export const ReceiveInfoServicePostOutTypeRef: TypeRef<ReceiveInfoServicePostOut> = new TypeRef("tutanota", 1641)

export function createReceiveInfoServicePostOut(values: StrippedEntity<ReceiveInfoServicePostOut>): ReceiveInfoServicePostOut {
    return Object.assign(create(typeModels[ReceiveInfoServicePostOutTypeRef.typeId], ReceiveInfoServicePostOutTypeRef), values)
}

export type ReceiveInfoServicePostOutParams = {

	_format: NumberString;
	outdatedVersion: boolean;
}

export class ReceiveInfoServicePostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReceiveInfoServicePostOut> { return ReceiveInfoServicePostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1642] }
	get outdatedVersion(): boolean { return this._attrs[1643] }
	
}
export const ResolveConversationsServiceGetInTypeRef: TypeRef<ResolveConversationsServiceGetIn> = new TypeRef("tutanota", 1645)

export function createResolveConversationsServiceGetIn(values: StrippedEntity<ResolveConversationsServiceGetIn>): ResolveConversationsServiceGetIn {
    return Object.assign(create(typeModels[ResolveConversationsServiceGetInTypeRef.typeId], ResolveConversationsServiceGetInTypeRef), values)
}

export type ResolveConversationsServiceGetInParams = {

	_format: NumberString;

	conversationLists: GeneratedIdWrapper[];
}

export class ResolveConversationsServiceGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ResolveConversationsServiceGetIn> { return ResolveConversationsServiceGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[1646] }
    set _format(v: NumberString) { this._attrs[1646] = v }
	

	get conversationLists(): GeneratedIdWrapper[] { return this._attrs[1646] }
}
export const ResolveConversationsServiceGetOutTypeRef: TypeRef<ResolveConversationsServiceGetOut> = new TypeRef("tutanota", 1648)

export function createResolveConversationsServiceGetOut(values: StrippedEntity<ResolveConversationsServiceGetOut>): ResolveConversationsServiceGetOut {
    return Object.assign(create(typeModels[ResolveConversationsServiceGetOutTypeRef.typeId], ResolveConversationsServiceGetOutTypeRef), values)
}

export type ResolveConversationsServiceGetOutParams = {

	_format: NumberString;

	mailIds: IdTupleWrapper[];
}

export class ResolveConversationsServiceGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ResolveConversationsServiceGetOut> { return ResolveConversationsServiceGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1649] }
    set _format(v: NumberString) { this._attrs[1649] = v }
	

	get mailIds(): IdTupleWrapper[] { return this._attrs[1649] }
}
export const UserAccountPostOutTypeRef: TypeRef<UserAccountPostOut> = new TypeRef("tutanota", 1664)

export function createUserAccountPostOut(values: StrippedEntity<UserAccountPostOut>): UserAccountPostOut {
    return Object.assign(create(typeModels[UserAccountPostOutTypeRef.typeId], UserAccountPostOutTypeRef), values)
}

export type UserAccountPostOutParams = {

	_format: NumberString;
	userId: Id;
	userGroup: Id;
}

export class UserAccountPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAccountPostOut> { return UserAccountPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1665] }
	get userId(): Id { return this._attrs[1666] }
	get userGroup(): Id { return this._attrs[1667] }
    set userGroup(v: Id) { this._attrs[1667] = v }
	
}
export const MailGroupPostOutTypeRef: TypeRef<MailGroupPostOut> = new TypeRef("tutanota", 1668)

export function createMailGroupPostOut(values: StrippedEntity<MailGroupPostOut>): MailGroupPostOut {
    return Object.assign(create(typeModels[MailGroupPostOutTypeRef.typeId], MailGroupPostOutTypeRef), values)
}

export type MailGroupPostOutParams = {

	_format: NumberString;

	mailGroup: Id;
}

export class MailGroupPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailGroupPostOut> { return MailGroupPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1669] }
    set _format(v: NumberString) { this._attrs[1669] = v }
	

	get mailGroup(): Id { return this._attrs[1669] }
	set mailGroup(a: Id)  { this._attrs[1670] = a } 
}
export const ChangePrimaryAddressServicePutInTypeRef: TypeRef<ChangePrimaryAddressServicePutIn> = new TypeRef("tutanota", 1671)

export function createChangePrimaryAddressServicePutIn(values: StrippedEntity<ChangePrimaryAddressServicePutIn>): ChangePrimaryAddressServicePutIn {
    return Object.assign(create(typeModels[ChangePrimaryAddressServicePutInTypeRef.typeId], ChangePrimaryAddressServicePutInTypeRef), values)
}

export type ChangePrimaryAddressServicePutInParams = {

	_format: NumberString;
	address: string;

	user: Id;
}

export class ChangePrimaryAddressServicePutIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ChangePrimaryAddressServicePutIn> { return ChangePrimaryAddressServicePutInTypeRef };
	

	get _format(): NumberString { return this._attrs[1672] }
	get address(): string { return this._attrs[1674] }
    set address(v: string) { this._attrs[1674] = v }
	

	get user(): Id { return this._attrs[1674] }
}
export const MovedMailsTypeRef: TypeRef<MovedMails> = new TypeRef("tutanota", 1716)

export function createMovedMails(values: StrippedEntity<MovedMails>): MovedMails {
    return Object.assign(create(typeModels[MovedMailsTypeRef.typeId], MovedMailsTypeRef), values)
}

export type MovedMailsParams = {

	_id: Id;

	targetFolder: IdTuple;
	sourceFolder: IdTuple;
	mailIds: IdTupleWrapper[];
}

export class MovedMails extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MovedMails> { return MovedMailsTypeRef };
	

	get _id(): Id { return this._attrs[1717] }
	

	get targetFolder(): IdTuple { return this._attrs[1717] }
	set targetFolder(a: IdTuple)  { this._attrs[1718] = a } 
	get sourceFolder(): IdTuple { return this._attrs[1717] }
	set sourceFolder(a: IdTuple)  { this._attrs[1719] = a } 
	get mailIds(): IdTupleWrapper[] { return this._attrs[1717] }
}
export const MoveMailPostOutTypeRef: TypeRef<MoveMailPostOut> = new TypeRef("tutanota", 1721)

export function createMoveMailPostOut(values: StrippedEntity<MoveMailPostOut>): MoveMailPostOut {
    return Object.assign(create(typeModels[MoveMailPostOutTypeRef.typeId], MoveMailPostOutTypeRef), values)
}

export type MoveMailPostOutParams = {

	_format: NumberString;

	movedMails: MovedMails[];
}

export class MoveMailPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MoveMailPostOut> { return MoveMailPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1722] }
    set _format(v: NumberString) { this._attrs[1722] = v }
	

	get movedMails(): MovedMails[] { return this._attrs[1722] }
	set movedMails(a: MovedMails[])  { this._attrs[1723] = a } 
}
export const ClientSpamClassifierResultTypeRef: TypeRef<ClientSpamClassifierResult> = new TypeRef("tutanota", 1724)

export function createClientSpamClassifierResult(values: StrippedEntity<ClientSpamClassifierResult>): ClientSpamClassifierResult {
    return Object.assign(create(typeModels[ClientSpamClassifierResultTypeRef.typeId], ClientSpamClassifierResultTypeRef), values)
}

export type ClientSpamClassifierResultParams = {

	_id: Id;
	spamDecision: NumberString;
	confidence: NumberString;
}

export class ClientSpamClassifierResult extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ClientSpamClassifierResult> { return ClientSpamClassifierResultTypeRef };
	

	get _id(): Id { return this._attrs[1725] }
	get spamDecision(): NumberString { return this._attrs[1726] }
	get confidence(): NumberString { return this._attrs[1727] }
    set confidence(v: NumberString) { this._attrs[1727] = v }
	
}
export const ClientClassifierResultPostInTypeRef: TypeRef<ClientClassifierResultPostIn> = new TypeRef("tutanota", 1730)

export function createClientClassifierResultPostIn(values: StrippedEntity<ClientClassifierResultPostIn>): ClientClassifierResultPostIn {
    return Object.assign(create(typeModels[ClientClassifierResultPostInTypeRef.typeId], ClientClassifierResultPostInTypeRef), values)
}

export type ClientClassifierResultPostInParams = {

	_format: NumberString;
	isPredictionMade: boolean;

	mails: IdTuple[];
}

export class ClientClassifierResultPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ClientClassifierResultPostIn> { return ClientClassifierResultPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[1731] }
	get isPredictionMade(): boolean { return this._attrs[1733] }
    set isPredictionMade(v: boolean) { this._attrs[1733] = v }
	

	get mails(): IdTuple[] { return this._attrs[1733] }
	set mails(a: IdTuple[])  { this._attrs[1732] = a } 
}
export const ClientSpamTrainingDatumTypeRef: TypeRef<ClientSpamTrainingDatum> = new TypeRef("tutanota", 1736)

export function createClientSpamTrainingDatum(values: StrippedEntity<ClientSpamTrainingDatum>): ClientSpamTrainingDatum {
    return Object.assign(create(typeModels[ClientSpamTrainingDatumTypeRef.typeId], ClientSpamTrainingDatumTypeRef), values)
}

export type ClientSpamTrainingDatumParams = {

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

export class ClientSpamTrainingDatum extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ClientSpamTrainingDatum> { return ClientSpamTrainingDatumTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1738] }
	get _permissions(): Id { return this._attrs[1739] }
	get _format(): NumberString { return this._attrs[1740] }
	get _ownerGroup(): null | Id { return this._attrs[1741] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1742] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1743] }
	get confidence(): NumberString { return this._attrs[1744] }
	get spamDecision(): NumberString { return this._attrs[1745] }
	get vectorLegacy(): Uint8Array { return this._attrs[1746] }
	get vectorWithServerClassifiers(): null | Uint8Array { return this._attrs[1817] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1849] }
	
}
export const ClientSpamTrainingDatumIndexEntryTypeRef: TypeRef<ClientSpamTrainingDatumIndexEntry> = new TypeRef("tutanota", 1747)

export function createClientSpamTrainingDatumIndexEntry(values: StrippedEntity<ClientSpamTrainingDatumIndexEntry>): ClientSpamTrainingDatumIndexEntry {
    return Object.assign(create(typeModels[ClientSpamTrainingDatumIndexEntryTypeRef.typeId], ClientSpamTrainingDatumIndexEntryTypeRef), values)
}

export type ClientSpamTrainingDatumIndexEntryParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	clientSpamTrainingDatumElementId: Id;
}

export class ClientSpamTrainingDatumIndexEntry extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ClientSpamTrainingDatumIndexEntry> { return ClientSpamTrainingDatumIndexEntryTypeRef };
	

	get _id(): IdTuple { return this._attrs[1749] }
	get _permissions(): Id { return this._attrs[1750] }
	get _format(): NumberString { return this._attrs[1751] }
	get _ownerGroup(): null | Id { return this._attrs[1752] }
	get clientSpamTrainingDatumElementId(): Id { return this._attrs[1753] }
    set clientSpamTrainingDatumElementId(v: Id) { this._attrs[1753] = v }
	
}
export const ProcessInboxDatumTypeRef: TypeRef<ProcessInboxDatum> = new TypeRef("tutanota", 1756)

export function createProcessInboxDatum(values: StrippedEntity<ProcessInboxDatum>): ProcessInboxDatum {
    return Object.assign(create(typeModels[ProcessInboxDatumTypeRef.typeId], ProcessInboxDatumTypeRef), values)
}

export type ProcessInboxDatumParams = {

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

export class ProcessInboxDatum extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ProcessInboxDatum> { return ProcessInboxDatumTypeRef };
	

	get _id(): Id { return this._attrs[1757] }
	get ownerEncVectorSessionKey(): Uint8Array { return this._attrs[1758] }
	get ownerKeyVersion(): NumberString { return this._attrs[1759] }
	get classifierType(): null | NumberString { return this._attrs[1762] }
	get encVectorLegacy(): Uint8Array { return this._attrs[1763] }
	get encVectorWithServerClassifiers(): null | Uint8Array { return this._attrs[1815] }
	

	get mailId(): IdTuple { return this._attrs[1815] }
	set mailId(a: IdTuple)  { this._attrs[1760] = a } 
	get targetMoveFolder(): IdTuple { return this._attrs[1815] }
	set targetMoveFolder(a: IdTuple)  { this._attrs[1761] = a } 
	get ownerEncMailSessionKeys(): InstanceSessionKey[] { return this._attrs[1815] }
}
export const ProcessInboxPostInTypeRef: TypeRef<ProcessInboxPostIn> = new TypeRef("tutanota", 1764)

export function createProcessInboxPostIn(values: StrippedEntity<ProcessInboxPostIn>): ProcessInboxPostIn {
    return Object.assign(create(typeModels[ProcessInboxPostInTypeRef.typeId], ProcessInboxPostInTypeRef), values)
}

export type ProcessInboxPostInParams = {

	_format: NumberString;
	mailOwnerGroup: Id;

	processInboxData: ProcessInboxDatum[];
}

export class ProcessInboxPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ProcessInboxPostIn> { return ProcessInboxPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[1765] }
	get mailOwnerGroup(): Id { return this._attrs[1766] }
    set mailOwnerGroup(v: Id) { this._attrs[1766] = v }
	

	get processInboxData(): ProcessInboxDatum[] { return this._attrs[1766] }
	set processInboxData(a: ProcessInboxDatum[])  { this._attrs[1767] = a } 
}
export const PopulateClientSpamTrainingDatumTypeRef: TypeRef<PopulateClientSpamTrainingDatum> = new TypeRef("tutanota", 1770)

export function createPopulateClientSpamTrainingDatum(values: StrippedEntity<PopulateClientSpamTrainingDatum>): PopulateClientSpamTrainingDatum {
    return Object.assign(create(typeModels[PopulateClientSpamTrainingDatumTypeRef.typeId], PopulateClientSpamTrainingDatumTypeRef), values)
}

export type PopulateClientSpamTrainingDatumParams = {

	_id: Id;
	ownerEncVectorSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	isSpam: boolean;
	confidence: NumberString;
	encVectorLegacy: Uint8Array;
	encVectorWithServerClassifiers: null | Uint8Array;

	mailId: IdTuple;
}

export class PopulateClientSpamTrainingDatum extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PopulateClientSpamTrainingDatum> { return PopulateClientSpamTrainingDatumTypeRef };
	

	get _id(): Id { return this._attrs[1771] }
	get ownerEncVectorSessionKey(): Uint8Array { return this._attrs[1772] }
	get ownerKeyVersion(): NumberString { return this._attrs[1773] }
	get isSpam(): boolean { return this._attrs[1775] }
	get confidence(): NumberString { return this._attrs[1776] }
	get encVectorLegacy(): Uint8Array { return this._attrs[1777] }
	get encVectorWithServerClassifiers(): null | Uint8Array { return this._attrs[1816] }
	

	get mailId(): IdTuple { return this._attrs[1816] }
	set mailId(a: IdTuple)  { this._attrs[1774] = a } 
}
export const PopulateClientSpamTrainingDataPostInTypeRef: TypeRef<PopulateClientSpamTrainingDataPostIn> = new TypeRef("tutanota", 1778)

export function createPopulateClientSpamTrainingDataPostIn(values: StrippedEntity<PopulateClientSpamTrainingDataPostIn>): PopulateClientSpamTrainingDataPostIn {
    return Object.assign(create(typeModels[PopulateClientSpamTrainingDataPostInTypeRef.typeId], PopulateClientSpamTrainingDataPostInTypeRef), values)
}

export type PopulateClientSpamTrainingDataPostInParams = {

	_format: NumberString;
	mailOwnerGroup: Id;

	populateClientSpamTrainingData: PopulateClientSpamTrainingDatum[];
}

export class PopulateClientSpamTrainingDataPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PopulateClientSpamTrainingDataPostIn> { return PopulateClientSpamTrainingDataPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[1779] }
	get mailOwnerGroup(): Id { return this._attrs[1780] }
    set mailOwnerGroup(v: Id) { this._attrs[1780] = v }
	

	get populateClientSpamTrainingData(): PopulateClientSpamTrainingDatum[] { return this._attrs[1780] }
	set populateClientSpamTrainingData(a: PopulateClientSpamTrainingDatum[])  { this._attrs[1781] = a } 
}
export const SendDraftDeleteInTypeRef: TypeRef<SendDraftDeleteIn> = new TypeRef("tutanota", 1785)

export function createSendDraftDeleteIn(values: StrippedEntity<SendDraftDeleteIn>): SendDraftDeleteIn {
    return Object.assign(create(typeModels[SendDraftDeleteInTypeRef.typeId], SendDraftDeleteInTypeRef), values)
}

export type SendDraftDeleteInParams = {

	_format: NumberString;

	mail: IdTuple;
	sendJob: null | IdTuple;
}

export class SendDraftDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SendDraftDeleteIn> { return SendDraftDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[1786] }
    set _format(v: NumberString) { this._attrs[1786] = v }
	

	get mail(): IdTuple { return this._attrs[1786] }
	set mail(a: IdTuple)  { this._attrs[1787] = a } 
	get sendJob(): null | IdTuple { return this._attrs[1786] }
	set sendJob(a: IdTuple)  { this._attrs[1824] = a } 
}
export const SendDraftParametersTypeRef: TypeRef<SendDraftParameters> = new TypeRef("tutanota", 1788)

export function createSendDraftParameters(values: StrippedEntity<SendDraftParameters>): SendDraftParameters {
    return Object.assign(create(typeModels[SendDraftParametersTypeRef.typeId], SendDraftParametersTypeRef), values)
}

export type SendDraftParametersParams = {

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

export class SendDraftParameters extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SendDraftParameters> { return SendDraftParametersTypeRef };
	

	get _id(): Id { return this._attrs[1789] }
	get language(): string { return this._attrs[1791] }
	get mailSessionKey(): null | Uint8Array { return this._attrs[1792] }
	get bucketEncMailSessionKey(): null | Uint8Array { return this._attrs[1793] }
	get senderNameUnencrypted(): null | string { return this._attrs[1794] }
	get plaintext(): boolean { return this._attrs[1795] }
	get calendarMethod(): boolean { return this._attrs[1796] }
	get sessionEncEncryptionAuthStatus(): null | Uint8Array { return this._attrs[1801] }
	

	get mail(): IdTuple { return this._attrs[1801] }
	set mail(a: IdTuple)  { this._attrs[1790] = a } 
	get internalRecipientKeyData(): InternalRecipientKeyData[] { return this._attrs[1801] }
	get secureExternalRecipientKeyData(): SecureExternalRecipientKeyData[] { return this._attrs[1801] }
	get symEncInternalRecipientKeyData(): SymEncInternalRecipientKeyData[] { return this._attrs[1801] }
	get attachmentKeyData(): AttachmentKeyData[] { return this._attrs[1801] }
}
export const OAuthTokenEndpointResponseTypeRef: TypeRef<OAuthTokenEndpointResponse> = new TypeRef("tutanota", 1860)

export function createOAuthTokenEndpointResponse(values: StrippedEntity<OAuthTokenEndpointResponse>): OAuthTokenEndpointResponse {
    return Object.assign(create(typeModels[OAuthTokenEndpointResponseTypeRef.typeId], OAuthTokenEndpointResponseTypeRef), values)
}

export type OAuthTokenEndpointResponseParams = {

	_id: Id;
	accessToken: string;
	refreshToken: null | string;
	expiresIn: null | NumberString;
	tokenType: string;
}

export class OAuthTokenEndpointResponse extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<OAuthTokenEndpointResponse> { return OAuthTokenEndpointResponseTypeRef };
	

	get _id(): Id { return this._attrs[1861] }
	get accessToken(): string { return this._attrs[1862] }
	get refreshToken(): null | string { return this._attrs[1863] }
	get expiresIn(): null | NumberString { return this._attrs[1864] }
	get tokenType(): string { return this._attrs[1865] }
    set tokenType(v: string) { this._attrs[1865] = v }
	
}
export const ImapAccountTypeRef: TypeRef<ImapAccount> = new TypeRef("tutanota", 1866)

export function createImapAccount(values: StrippedEntity<ImapAccount>): ImapAccount {
    return Object.assign(create(typeModels[ImapAccountTypeRef.typeId], ImapAccountTypeRef), values)
}

export type ImapAccountParams = {

	_id: Id;
	host: string;
	port: NumberString;
	username: string;
	password: null | string;

	oAuthTokenEndpointResponse: null | OAuthTokenEndpointResponse;
}

export class ImapAccount extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapAccount> { return ImapAccountTypeRef };
	

	get _id(): Id { return this._attrs[1867] }
	get host(): string { return this._attrs[1868] }
	get port(): NumberString { return this._attrs[1869] }
	get username(): string { return this._attrs[1870] }
	get password(): null | string { return this._attrs[1871] }
	

	get oAuthTokenEndpointResponse(): null | OAuthTokenEndpointResponse { return this._attrs[1871] }
	set oAuthTokenEndpointResponse(a: OAuthTokenEndpointResponse)  { this._attrs[1872] = a } 
}
export const ImportedImapMailTypeRef: TypeRef<ImportedImapMail> = new TypeRef("tutanota", 1873)

export function createImportedImapMail(values: StrippedEntity<ImportedImapMail>): ImportedImapMail {
    return Object.assign(create(typeModels[ImportedImapMailTypeRef.typeId], ImportedImapMailTypeRef), values)
}

export type ImportedImapMailParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	imapUid: NumberString;
	imapModSeq: null | NumberString;
	messageId: string;

	mailSetEntry: IdTuple;
}

export class ImportedImapMail extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImportedImapMail> { return ImportedImapMailTypeRef };
	

	get _id(): IdTuple { return this._attrs[1875] }
	get _permissions(): Id { return this._attrs[1876] }
	get _format(): NumberString { return this._attrs[1877] }
	get _ownerGroup(): null | Id { return this._attrs[1878] }
	get imapUid(): NumberString { return this._attrs[1879] }
	get imapModSeq(): null | NumberString { return this._attrs[1880] }
	get messageId(): string { return this._attrs[1881] }
	

	get mailSetEntry(): IdTuple { return this._attrs[1881] }
}
export const DeduplicatedImportedAttachmentTypeRef: TypeRef<DeduplicatedImportedAttachment> = new TypeRef("tutanota", 1883)

export function createDeduplicatedImportedAttachment(values: StrippedEntity<DeduplicatedImportedAttachment>): DeduplicatedImportedAttachment {
    return Object.assign(create(typeModels[DeduplicatedImportedAttachmentTypeRef.typeId], DeduplicatedImportedAttachmentTypeRef), values)
}

export type DeduplicatedImportedAttachmentParams = {

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

export class DeduplicatedImportedAttachment extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DeduplicatedImportedAttachment> { return DeduplicatedImportedAttachmentTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1885] }
	get _permissions(): Id { return this._attrs[1886] }
	get _format(): NumberString { return this._attrs[1887] }
	get _ownerGroup(): null | Id { return this._attrs[1888] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1889] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1890] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1891] }
	get attachmentHash(): string { return this._attrs[1892] }
	

	get attachment(): IdTuple { return this._attrs[1892] }
}
export const ImapFolderSyncStateTypeRef: TypeRef<ImapFolderSyncState> = new TypeRef("tutanota", 1895)

export function createImapFolderSyncState(values: StrippedEntity<ImapFolderSyncState>): ImapFolderSyncState {
    return Object.assign(create(typeModels[ImapFolderSyncStateTypeRef.typeId], ImapFolderSyncStateTypeRef), values)
}

export type ImapFolderSyncStateParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;
	path: string;
	uidvalidity: null | NumberString;
	uidnext: null | NumberString;
	highestmodseq: null | NumberString;
	status: NumberString;

	importedMails: Id;
	mailFolder: IdTuple;
	imapAccountSyncState: IdTuple;
}

export class ImapFolderSyncState extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapFolderSyncState> { return ImapFolderSyncStateTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1897] }
	get _permissions(): Id { return this._attrs[1898] }
	get _format(): NumberString { return this._attrs[1899] }
	get _ownerGroup(): null | Id { return this._attrs[1900] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1901] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1902] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1903] }
	get path(): string { return this._attrs[1904] }
	get uidvalidity(): null | NumberString { return this._attrs[1905] }
	get uidnext(): null | NumberString { return this._attrs[1906] }
	get highestmodseq(): null | NumberString { return this._attrs[1907] }
	get status(): NumberString { return this._attrs[1908] }
    set status(v: NumberString) { this._attrs[1908] = v }
	

	get importedMails(): Id { return this._attrs[1908] }
	get mailFolder(): IdTuple { return this._attrs[1908] }
	get imapAccountSyncState(): IdTuple { return this._attrs[1908] }
}
export const ImapAccountSyncStateTypeRef: TypeRef<ImapAccountSyncState> = new TypeRef("tutanota", 1911)

export function createImapAccountSyncState(values: StrippedEntity<ImapAccountSyncState>): ImapAccountSyncState {
    return Object.assign(create(typeModels[ImapAccountSyncStateTypeRef.typeId], ImapAccountSyncStateTypeRef), values)
}

export type ImapAccountSyncStateParams = {

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

	imapFolderSyncStateList: Id;
	imapAccount: ImapAccount;
	rootImportMailFolder: null | IdTuple;
	imapSyncLabel: null | IdTuple;
}

export class ImapAccountSyncState extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapAccountSyncState> { return ImapAccountSyncStateTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1913] }
	get _permissions(): Id { return this._attrs[1914] }
	get _format(): NumberString { return this._attrs[1915] }
	get _ownerGroup(): null | Id { return this._attrs[1916] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1917] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[1918] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[1919] }
	get maxQuota(): NumberString { return this._attrs[1920] }
	get postponedUntil(): NumberString { return this._attrs[1921] }
	get provider(): NumberString { return this._attrs[1922] }
	get status(): NumberString { return this._attrs[1923] }
    set status(v: NumberString) { this._attrs[1923] = v }
	

	get imapFolderSyncStateList(): Id { return this._attrs[1923] }
	get imapAccount(): ImapAccount { return this._attrs[1923] }
	set imapAccount(a: ImapAccount)  { this._attrs[1925] = a } 
	get rootImportMailFolder(): null | IdTuple { return this._attrs[1923] }
	get imapSyncLabel(): null | IdTuple { return this._attrs[1923] }
}
export const ImapFolderPostInTypeRef: TypeRef<ImapFolderPostIn> = new TypeRef("tutanota", 1929)

export function createImapFolderPostIn(values: StrippedEntity<ImapFolderPostIn>): ImapFolderPostIn {
    return Object.assign(create(typeModels[ImapFolderPostInTypeRef.typeId], ImapFolderPostInTypeRef), values)
}

export type ImapFolderPostInParams = {

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	ownerGroup: Id;
	path: string;

	imapAccountSyncState: IdTuple;
	mailFolder: IdTuple;
}

export class ImapFolderPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapFolderPostIn> { return ImapFolderPostInTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[1930] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[1931] }
	get ownerKeyVersion(): NumberString { return this._attrs[1932] }
	get ownerGroup(): Id { return this._attrs[1933] }
	get path(): string { return this._attrs[1934] }
	

	get imapAccountSyncState(): IdTuple { return this._attrs[1934] }
	get mailFolder(): IdTuple { return this._attrs[1934] }
}
export const ImapFolderPostOutTypeRef: TypeRef<ImapFolderPostOut> = new TypeRef("tutanota", 1937)

export function createImapFolderPostOut(values: StrippedEntity<ImapFolderPostOut>): ImapFolderPostOut {
    return Object.assign(create(typeModels[ImapFolderPostOutTypeRef.typeId], ImapFolderPostOutTypeRef), values)
}

export type ImapFolderPostOutParams = {

	_format: NumberString;

	imapFolderSyncState: IdTuple;
}

export class ImapFolderPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapFolderPostOut> { return ImapFolderPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1938] }
    set _format(v: NumberString) { this._attrs[1938] = v }
	

	get imapFolderSyncState(): IdTuple { return this._attrs[1938] }
	set imapFolderSyncState(a: IdTuple)  { this._attrs[1939] = a } 
}
export const ImapFolderDeleteInTypeRef: TypeRef<ImapFolderDeleteIn> = new TypeRef("tutanota", 1940)

export function createImapFolderDeleteIn(values: StrippedEntity<ImapFolderDeleteIn>): ImapFolderDeleteIn {
    return Object.assign(create(typeModels[ImapFolderDeleteInTypeRef.typeId], ImapFolderDeleteInTypeRef), values)
}

export type ImapFolderDeleteInParams = {

	_format: NumberString;

	imapFolderSyncState: IdTuple;
}

export class ImapFolderDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapFolderDeleteIn> { return ImapFolderDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[1941] }
    set _format(v: NumberString) { this._attrs[1941] = v }
	

	get imapFolderSyncState(): IdTuple { return this._attrs[1941] }
	set imapFolderSyncState(a: IdTuple)  { this._attrs[1942] = a } 
}
export const ImapPostInTypeRef: TypeRef<ImapPostIn> = new TypeRef("tutanota", 1944)

export function createImapPostIn(values: StrippedEntity<ImapPostIn>): ImapPostIn {
    return Object.assign(create(typeModels[ImapPostInTypeRef.typeId], ImapPostInTypeRef), values)
}

export type ImapPostInParams = {

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	ownerGroup: Id;
	maxQuota: NumberString;
	postponedUntil: NumberString;
	provider: NumberString;

	imapAccount: ImapAccount;
	labelData: null | ManageLabelServiceLabelData;
	rootImportMailFolder: null | IdTuple;
}

export class ImapPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapPostIn> { return ImapPostInTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[1945] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[1946] }
	get ownerKeyVersion(): NumberString { return this._attrs[1947] }
	get ownerGroup(): Id { return this._attrs[1948] }
	get maxQuota(): NumberString { return this._attrs[1949] }
	get postponedUntil(): NumberString { return this._attrs[1950] }
	get provider(): NumberString { return this._attrs[1951] }
	

	get imapAccount(): ImapAccount { return this._attrs[1951] }
	get labelData(): null | ManageLabelServiceLabelData { return this._attrs[1951] }
	get rootImportMailFolder(): null | IdTuple { return this._attrs[1951] }
}
export const ImapPostOutTypeRef: TypeRef<ImapPostOut> = new TypeRef("tutanota", 1955)

export function createImapPostOut(values: StrippedEntity<ImapPostOut>): ImapPostOut {
    return Object.assign(create(typeModels[ImapPostOutTypeRef.typeId], ImapPostOutTypeRef), values)
}

export type ImapPostOutParams = {

	_format: NumberString;

	imapAccountSyncState: IdTuple;
}

export class ImapPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapPostOut> { return ImapPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1956] }
    set _format(v: NumberString) { this._attrs[1956] = v }
	

	get imapAccountSyncState(): IdTuple { return this._attrs[1956] }
	set imapAccountSyncState(a: IdTuple)  { this._attrs[1957] = a } 
}
export const ImapDeleteInTypeRef: TypeRef<ImapDeleteIn> = new TypeRef("tutanota", 1958)

export function createImapDeleteIn(values: StrippedEntity<ImapDeleteIn>): ImapDeleteIn {
    return Object.assign(create(typeModels[ImapDeleteInTypeRef.typeId], ImapDeleteInTypeRef), values)
}

export type ImapDeleteInParams = {

	_format: NumberString;

	imapAccountSyncState: IdTuple;
}

export class ImapDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ImapDeleteIn> { return ImapDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[1959] }
    set _format(v: NumberString) { this._attrs[1959] = v }
	

	get imapAccountSyncState(): IdTuple { return this._attrs[1959] }
	set imapAccountSyncState(a: IdTuple)  { this._attrs[1960] = a } 
}
