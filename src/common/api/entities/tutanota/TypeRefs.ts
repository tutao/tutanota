import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import {TypeRef} from "@tutao/tutanota-utils"
import {typeModels} from "./TypeModels.js"
import {DateWrapper} from '../sys/TypeRefs.js'
import {Blob} from '../sys/TypeRefs.js'
import {BucketKey} from '../sys/TypeRefs.js'
import {BlobReferenceTokenWrapper} from '../sys/TypeRefs.js'

export const AttachmentKeyDataTypeRef: TypeRef<AttachmentKeyData> = new TypeRef("tutanota", "AttachmentKeyData")

export function createAttachmentKeyData(values: StrippedEntity<AttachmentKeyData>): AttachmentKeyData {
	return Object.assign(create(typeModels.AttachmentKeyData, AttachmentKeyDataTypeRef), values)
}

export type AttachmentKeyData = {
	_type: TypeRef<AttachmentKeyData>;

	_id: Id;
	bucketEncFileSessionKey: null | Uint8Array;
	fileSessionKey: null | Uint8Array;

	file: IdTuple;
}
export const BirthdayTypeRef: TypeRef<Birthday> = new TypeRef("tutanota", "Birthday")

export function createBirthday(values: StrippedEntity<Birthday>): Birthday {
	return Object.assign(create(typeModels.Birthday, BirthdayTypeRef), values)
}

export type Birthday = {
	_type: TypeRef<Birthday>;

	_id: Id;
	day: NumberString;
	month: NumberString;
	year: null | NumberString;
}
export const BodyTypeRef: TypeRef<Body> = new TypeRef("tutanota", "Body")

export function createBody(values: StrippedEntity<Body>): Body {
	return Object.assign(create(typeModels.Body, BodyTypeRef), values)
}

export type Body = {
	_type: TypeRef<Body>;

	_id: Id;
	compressedText: null | string;
	text: null | string;
}
export const CalendarDeleteDataTypeRef: TypeRef<CalendarDeleteData> = new TypeRef("tutanota", "CalendarDeleteData")

export function createCalendarDeleteData(values: StrippedEntity<CalendarDeleteData>): CalendarDeleteData {
	return Object.assign(create(typeModels.CalendarDeleteData, CalendarDeleteDataTypeRef), values)
}

export type CalendarDeleteData = {
	_type: TypeRef<CalendarDeleteData>;

	_format: NumberString;

	groupRootId: Id;
}
export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", "CalendarEvent")

export function createCalendarEvent(values: StrippedEntity<CalendarEvent>): CalendarEvent {
	return Object.assign(create(typeModels.CalendarEvent, CalendarEventTypeRef), values)
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
	organizer:  null | EncryptedMailAddress;
	repeatRule:  null | CalendarRepeatRule;
}
export const CalendarEventAttendeeTypeRef: TypeRef<CalendarEventAttendee> = new TypeRef("tutanota", "CalendarEventAttendee")

export function createCalendarEventAttendee(values: StrippedEntity<CalendarEventAttendee>): CalendarEventAttendee {
	return Object.assign(create(typeModels.CalendarEventAttendee, CalendarEventAttendeeTypeRef), values)
}

export type CalendarEventAttendee = {
	_type: TypeRef<CalendarEventAttendee>;

	_id: Id;
	status: NumberString;

	address: EncryptedMailAddress;
}
export const CalendarEventIndexRefTypeRef: TypeRef<CalendarEventIndexRef> = new TypeRef("tutanota", "CalendarEventIndexRef")

export function createCalendarEventIndexRef(values: StrippedEntity<CalendarEventIndexRef>): CalendarEventIndexRef {
	return Object.assign(create(typeModels.CalendarEventIndexRef, CalendarEventIndexRefTypeRef), values)
}

export type CalendarEventIndexRef = {
	_type: TypeRef<CalendarEventIndexRef>;

	_id: Id;

	list: Id;
}
export const CalendarEventUidIndexTypeRef: TypeRef<CalendarEventUidIndex> = new TypeRef("tutanota", "CalendarEventUidIndex")

export function createCalendarEventUidIndex(values: StrippedEntity<CalendarEventUidIndex>): CalendarEventUidIndex {
	return Object.assign(create(typeModels.CalendarEventUidIndex, CalendarEventUidIndexTypeRef), values)
}

export type CalendarEventUidIndex = {
	_type: TypeRef<CalendarEventUidIndex>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	alteredInstances: IdTuple[];
	progenitor:  null | IdTuple;
}
export const CalendarEventUpdateTypeRef: TypeRef<CalendarEventUpdate> = new TypeRef("tutanota", "CalendarEventUpdate")

export function createCalendarEventUpdate(values: StrippedEntity<CalendarEventUpdate>): CalendarEventUpdate {
	return Object.assign(create(typeModels.CalendarEventUpdate, CalendarEventUpdateTypeRef), values)
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
export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", "CalendarEventUpdateList")

export function createCalendarEventUpdateList(values: StrippedEntity<CalendarEventUpdateList>): CalendarEventUpdateList {
	return Object.assign(create(typeModels.CalendarEventUpdateList, CalendarEventUpdateListTypeRef), values)
}

export type CalendarEventUpdateList = {
	_type: TypeRef<CalendarEventUpdateList>;

	_id: Id;

	list: Id;
}
export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", "CalendarGroupRoot")

export function createCalendarGroupRoot(values: StrippedEntity<CalendarGroupRoot>): CalendarGroupRoot {
	return Object.assign(create(typeModels.CalendarGroupRoot, CalendarGroupRootTypeRef), values)
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

	index:  null | CalendarEventIndexRef;
	longEvents: Id;
	shortEvents: Id;
}
export const CalendarRepeatRuleTypeRef: TypeRef<CalendarRepeatRule> = new TypeRef("tutanota", "CalendarRepeatRule")

export function createCalendarRepeatRule(values: StrippedEntity<CalendarRepeatRule>): CalendarRepeatRule {
	return Object.assign(create(typeModels.CalendarRepeatRule, CalendarRepeatRuleTypeRef), values)
}

export type CalendarRepeatRule = {
	_type: TypeRef<CalendarRepeatRule>;

	_id: Id;
	endType: NumberString;
	endValue: null | NumberString;
	frequency: NumberString;
	interval: NumberString;
	timeZone: string;

	excludedDates: DateWrapper[];
}
export const ContactTypeRef: TypeRef<Contact> = new TypeRef("tutanota", "Contact")

export function createContact(values: StrippedEntity<Contact>): Contact {
	return Object.assign(create(typeModels.Contact, ContactTypeRef), values)
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
	oldBirthdayAggregate:  null | Birthday;
	phoneNumbers: ContactPhoneNumber[];
	photo:  null | IdTuple;
	pronouns: ContactPronouns[];
	relationships: ContactRelationship[];
	socialIds: ContactSocialId[];
	websites: ContactWebsite[];
}
export const ContactAddressTypeRef: TypeRef<ContactAddress> = new TypeRef("tutanota", "ContactAddress")

export function createContactAddress(values: StrippedEntity<ContactAddress>): ContactAddress {
	return Object.assign(create(typeModels.ContactAddress, ContactAddressTypeRef), values)
}

export type ContactAddress = {
	_type: TypeRef<ContactAddress>;

	_id: Id;
	address: string;
	customTypeName: string;
	type: NumberString;
}
export const ContactCustomDateTypeRef: TypeRef<ContactCustomDate> = new TypeRef("tutanota", "ContactCustomDate")

export function createContactCustomDate(values: StrippedEntity<ContactCustomDate>): ContactCustomDate {
	return Object.assign(create(typeModels.ContactCustomDate, ContactCustomDateTypeRef), values)
}

export type ContactCustomDate = {
	_type: TypeRef<ContactCustomDate>;

	_id: Id;
	customTypeName: string;
	dateIso: string;
	type: NumberString;
}
export const ContactListTypeRef: TypeRef<ContactList> = new TypeRef("tutanota", "ContactList")

export function createContactList(values: StrippedEntity<ContactList>): ContactList {
	return Object.assign(create(typeModels.ContactList, ContactListTypeRef), values)
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
	photos:  null | PhotosRef;
}
export const ContactListEntryTypeRef: TypeRef<ContactListEntry> = new TypeRef("tutanota", "ContactListEntry")

export function createContactListEntry(values: StrippedEntity<ContactListEntry>): ContactListEntry {
	return Object.assign(create(typeModels.ContactListEntry, ContactListEntryTypeRef), values)
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
export const ContactListGroupRootTypeRef: TypeRef<ContactListGroupRoot> = new TypeRef("tutanota", "ContactListGroupRoot")

export function createContactListGroupRoot(values: StrippedEntity<ContactListGroupRoot>): ContactListGroupRoot {
	return Object.assign(create(typeModels.ContactListGroupRoot, ContactListGroupRootTypeRef), values)
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
export const ContactMailAddressTypeRef: TypeRef<ContactMailAddress> = new TypeRef("tutanota", "ContactMailAddress")

export function createContactMailAddress(values: StrippedEntity<ContactMailAddress>): ContactMailAddress {
	return Object.assign(create(typeModels.ContactMailAddress, ContactMailAddressTypeRef), values)
}

export type ContactMailAddress = {
	_type: TypeRef<ContactMailAddress>;

	_id: Id;
	address: string;
	customTypeName: string;
	type: NumberString;
}
export const ContactMessengerHandleTypeRef: TypeRef<ContactMessengerHandle> = new TypeRef("tutanota", "ContactMessengerHandle")

export function createContactMessengerHandle(values: StrippedEntity<ContactMessengerHandle>): ContactMessengerHandle {
	return Object.assign(create(typeModels.ContactMessengerHandle, ContactMessengerHandleTypeRef), values)
}

export type ContactMessengerHandle = {
	_type: TypeRef<ContactMessengerHandle>;

	_id: Id;
	customTypeName: string;
	handle: string;
	type: NumberString;
}
export const ContactPhoneNumberTypeRef: TypeRef<ContactPhoneNumber> = new TypeRef("tutanota", "ContactPhoneNumber")

export function createContactPhoneNumber(values: StrippedEntity<ContactPhoneNumber>): ContactPhoneNumber {
	return Object.assign(create(typeModels.ContactPhoneNumber, ContactPhoneNumberTypeRef), values)
}

export type ContactPhoneNumber = {
	_type: TypeRef<ContactPhoneNumber>;

	_id: Id;
	customTypeName: string;
	number: string;
	type: NumberString;
}
export const ContactPronounsTypeRef: TypeRef<ContactPronouns> = new TypeRef("tutanota", "ContactPronouns")

export function createContactPronouns(values: StrippedEntity<ContactPronouns>): ContactPronouns {
	return Object.assign(create(typeModels.ContactPronouns, ContactPronounsTypeRef), values)
}

export type ContactPronouns = {
	_type: TypeRef<ContactPronouns>;

	_id: Id;
	language: string;
	pronouns: string;
}
export const ContactRelationshipTypeRef: TypeRef<ContactRelationship> = new TypeRef("tutanota", "ContactRelationship")

export function createContactRelationship(values: StrippedEntity<ContactRelationship>): ContactRelationship {
	return Object.assign(create(typeModels.ContactRelationship, ContactRelationshipTypeRef), values)
}

export type ContactRelationship = {
	_type: TypeRef<ContactRelationship>;

	_id: Id;
	customTypeName: string;
	person: string;
	type: NumberString;
}
export const ContactSocialIdTypeRef: TypeRef<ContactSocialId> = new TypeRef("tutanota", "ContactSocialId")

export function createContactSocialId(values: StrippedEntity<ContactSocialId>): ContactSocialId {
	return Object.assign(create(typeModels.ContactSocialId, ContactSocialIdTypeRef), values)
}

export type ContactSocialId = {
	_type: TypeRef<ContactSocialId>;

	_id: Id;
	customTypeName: string;
	socialId: string;
	type: NumberString;
}
export const ContactWebsiteTypeRef: TypeRef<ContactWebsite> = new TypeRef("tutanota", "ContactWebsite")

export function createContactWebsite(values: StrippedEntity<ContactWebsite>): ContactWebsite {
	return Object.assign(create(typeModels.ContactWebsite, ContactWebsiteTypeRef), values)
}

export type ContactWebsite = {
	_type: TypeRef<ContactWebsite>;

	_id: Id;
	customTypeName: string;
	type: NumberString;
	url: string;
}
export const ConversationEntryTypeRef: TypeRef<ConversationEntry> = new TypeRef("tutanota", "ConversationEntry")

export function createConversationEntry(values: StrippedEntity<ConversationEntry>): ConversationEntry {
	return Object.assign(create(typeModels.ConversationEntry, ConversationEntryTypeRef), values)
}

export type ConversationEntry = {
	_type: TypeRef<ConversationEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	conversationType: NumberString;
	messageId: string;

	mail:  null | IdTuple;
	previous:  null | IdTuple;
}
export const CreateExternalUserGroupDataTypeRef: TypeRef<CreateExternalUserGroupData> = new TypeRef("tutanota", "CreateExternalUserGroupData")

export function createCreateExternalUserGroupData(values: StrippedEntity<CreateExternalUserGroupData>): CreateExternalUserGroupData {
	return Object.assign(create(typeModels.CreateExternalUserGroupData, CreateExternalUserGroupDataTypeRef), values)
}

export type CreateExternalUserGroupData = {
	_type: TypeRef<CreateExternalUserGroupData>;

	_id: Id;
	externalPwEncUserGroupKey: Uint8Array;
	internalUserEncUserGroupKey: Uint8Array;
	internalUserGroupKeyVersion: NumberString;
	mailAddress: string;
}
export const CreateGroupPostReturnTypeRef: TypeRef<CreateGroupPostReturn> = new TypeRef("tutanota", "CreateGroupPostReturn")

export function createCreateGroupPostReturn(values: StrippedEntity<CreateGroupPostReturn>): CreateGroupPostReturn {
	return Object.assign(create(typeModels.CreateGroupPostReturn, CreateGroupPostReturnTypeRef), values)
}

export type CreateGroupPostReturn = {
	_type: TypeRef<CreateGroupPostReturn>;
	_errors: Object;

	_format: NumberString;

	group: Id;
}
export const CreateMailFolderDataTypeRef: TypeRef<CreateMailFolderData> = new TypeRef("tutanota", "CreateMailFolderData")

export function createCreateMailFolderData(values: StrippedEntity<CreateMailFolderData>): CreateMailFolderData {
	return Object.assign(create(typeModels.CreateMailFolderData, CreateMailFolderDataTypeRef), values)
}

export type CreateMailFolderData = {
	_type: TypeRef<CreateMailFolderData>;
	_errors: Object;

	_format: NumberString;
	folderName: string;
	ownerEncSessionKey: Uint8Array;
	ownerGroup: null | Id;
	ownerKeyVersion: NumberString;

	parentFolder:  null | IdTuple;
}
export const CreateMailFolderReturnTypeRef: TypeRef<CreateMailFolderReturn> = new TypeRef("tutanota", "CreateMailFolderReturn")

export function createCreateMailFolderReturn(values: StrippedEntity<CreateMailFolderReturn>): CreateMailFolderReturn {
	return Object.assign(create(typeModels.CreateMailFolderReturn, CreateMailFolderReturnTypeRef), values)
}

export type CreateMailFolderReturn = {
	_type: TypeRef<CreateMailFolderReturn>;
	_errors: Object;

	_format: NumberString;

	newFolder: IdTuple;
}
export const CreateMailGroupDataTypeRef: TypeRef<CreateMailGroupData> = new TypeRef("tutanota", "CreateMailGroupData")

export function createCreateMailGroupData(values: StrippedEntity<CreateMailGroupData>): CreateMailGroupData {
	return Object.assign(create(typeModels.CreateMailGroupData, CreateMailGroupDataTypeRef), values)
}

export type CreateMailGroupData = {
	_type: TypeRef<CreateMailGroupData>;

	_format: NumberString;
	encryptedName: Uint8Array;
	mailAddress: string;
	mailEncMailboxSessionKey: Uint8Array;

	groupData: InternalGroupData;
}
export const CustomerAccountCreateDataTypeRef: TypeRef<CustomerAccountCreateData> = new TypeRef("tutanota", "CustomerAccountCreateData")

export function createCustomerAccountCreateData(values: StrippedEntity<CustomerAccountCreateData>): CustomerAccountCreateData {
	return Object.assign(create(typeModels.CustomerAccountCreateData, CustomerAccountCreateDataTypeRef), values)
}

export type CustomerAccountCreateData = {
	_type: TypeRef<CustomerAccountCreateData>;

	_format: NumberString;
	accountGroupKeyVersion: NumberString;
	adminEncAccountingInfoSessionKey: Uint8Array;
	adminEncCustomerServerPropertiesSessionKey: Uint8Array;
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
export const DefaultAlarmInfoTypeRef: TypeRef<DefaultAlarmInfo> = new TypeRef("tutanota", "DefaultAlarmInfo")

export function createDefaultAlarmInfo(values: StrippedEntity<DefaultAlarmInfo>): DefaultAlarmInfo {
	return Object.assign(create(typeModels.DefaultAlarmInfo, DefaultAlarmInfoTypeRef), values)
}

export type DefaultAlarmInfo = {
	_type: TypeRef<DefaultAlarmInfo>;

	_id: Id;
	trigger: string;
}
export const DeleteGroupDataTypeRef: TypeRef<DeleteGroupData> = new TypeRef("tutanota", "DeleteGroupData")

export function createDeleteGroupData(values: StrippedEntity<DeleteGroupData>): DeleteGroupData {
	return Object.assign(create(typeModels.DeleteGroupData, DeleteGroupDataTypeRef), values)
}

export type DeleteGroupData = {
	_type: TypeRef<DeleteGroupData>;

	_format: NumberString;
	restore: boolean;

	group: Id;
}
export const DeleteMailDataTypeRef: TypeRef<DeleteMailData> = new TypeRef("tutanota", "DeleteMailData")

export function createDeleteMailData(values: StrippedEntity<DeleteMailData>): DeleteMailData {
	return Object.assign(create(typeModels.DeleteMailData, DeleteMailDataTypeRef), values)
}

export type DeleteMailData = {
	_type: TypeRef<DeleteMailData>;

	_format: NumberString;

	folder:  null | IdTuple;
	mails: IdTuple[];
}
export const DeleteMailFolderDataTypeRef: TypeRef<DeleteMailFolderData> = new TypeRef("tutanota", "DeleteMailFolderData")

export function createDeleteMailFolderData(values: StrippedEntity<DeleteMailFolderData>): DeleteMailFolderData {
	return Object.assign(create(typeModels.DeleteMailFolderData, DeleteMailFolderDataTypeRef), values)
}

export type DeleteMailFolderData = {
	_type: TypeRef<DeleteMailFolderData>;
	_errors: Object;

	_format: NumberString;

	folders: IdTuple[];
}
export const DraftAttachmentTypeRef: TypeRef<DraftAttachment> = new TypeRef("tutanota", "DraftAttachment")

export function createDraftAttachment(values: StrippedEntity<DraftAttachment>): DraftAttachment {
	return Object.assign(create(typeModels.DraftAttachment, DraftAttachmentTypeRef), values)
}

export type DraftAttachment = {
	_type: TypeRef<DraftAttachment>;

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	existingFile:  null | IdTuple;
	newFile:  null | NewDraftAttachment;
}
export const DraftCreateDataTypeRef: TypeRef<DraftCreateData> = new TypeRef("tutanota", "DraftCreateData")

export function createDraftCreateData(values: StrippedEntity<DraftCreateData>): DraftCreateData {
	return Object.assign(create(typeModels.DraftCreateData, DraftCreateDataTypeRef), values)
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
export const DraftCreateReturnTypeRef: TypeRef<DraftCreateReturn> = new TypeRef("tutanota", "DraftCreateReturn")

export function createDraftCreateReturn(values: StrippedEntity<DraftCreateReturn>): DraftCreateReturn {
	return Object.assign(create(typeModels.DraftCreateReturn, DraftCreateReturnTypeRef), values)
}

export type DraftCreateReturn = {
	_type: TypeRef<DraftCreateReturn>;

	_format: NumberString;

	draft: IdTuple;
}
export const DraftDataTypeRef: TypeRef<DraftData> = new TypeRef("tutanota", "DraftData")

export function createDraftData(values: StrippedEntity<DraftData>): DraftData {
	return Object.assign(create(typeModels.DraftData, DraftDataTypeRef), values)
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
export const DraftRecipientTypeRef: TypeRef<DraftRecipient> = new TypeRef("tutanota", "DraftRecipient")

export function createDraftRecipient(values: StrippedEntity<DraftRecipient>): DraftRecipient {
	return Object.assign(create(typeModels.DraftRecipient, DraftRecipientTypeRef), values)
}

export type DraftRecipient = {
	_type: TypeRef<DraftRecipient>;

	_id: Id;
	mailAddress: string;
	name: string;
}
export const DraftUpdateDataTypeRef: TypeRef<DraftUpdateData> = new TypeRef("tutanota", "DraftUpdateData")

export function createDraftUpdateData(values: StrippedEntity<DraftUpdateData>): DraftUpdateData {
	return Object.assign(create(typeModels.DraftUpdateData, DraftUpdateDataTypeRef), values)
}

export type DraftUpdateData = {
	_type: TypeRef<DraftUpdateData>;
	_errors: Object;

	_format: NumberString;

	draft: IdTuple;
	draftData: DraftData;
}
export const DraftUpdateReturnTypeRef: TypeRef<DraftUpdateReturn> = new TypeRef("tutanota", "DraftUpdateReturn")

export function createDraftUpdateReturn(values: StrippedEntity<DraftUpdateReturn>): DraftUpdateReturn {
	return Object.assign(create(typeModels.DraftUpdateReturn, DraftUpdateReturnTypeRef), values)
}

export type DraftUpdateReturn = {
	_type: TypeRef<DraftUpdateReturn>;
	_errors: Object;

	_format: NumberString;

	attachments: IdTuple[];
}
export const EmailTemplateTypeRef: TypeRef<EmailTemplate> = new TypeRef("tutanota", "EmailTemplate")

export function createEmailTemplate(values: StrippedEntity<EmailTemplate>): EmailTemplate {
	return Object.assign(create(typeModels.EmailTemplate, EmailTemplateTypeRef), values)
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
export const EmailTemplateContentTypeRef: TypeRef<EmailTemplateContent> = new TypeRef("tutanota", "EmailTemplateContent")

export function createEmailTemplateContent(values: StrippedEntity<EmailTemplateContent>): EmailTemplateContent {
	return Object.assign(create(typeModels.EmailTemplateContent, EmailTemplateContentTypeRef), values)
}

export type EmailTemplateContent = {
	_type: TypeRef<EmailTemplateContent>;

	_id: Id;
	languageCode: string;
	text: string;
}
export const EncryptTutanotaPropertiesDataTypeRef: TypeRef<EncryptTutanotaPropertiesData> = new TypeRef("tutanota", "EncryptTutanotaPropertiesData")

export function createEncryptTutanotaPropertiesData(values: StrippedEntity<EncryptTutanotaPropertiesData>): EncryptTutanotaPropertiesData {
	return Object.assign(create(typeModels.EncryptTutanotaPropertiesData, EncryptTutanotaPropertiesDataTypeRef), values)
}

export type EncryptTutanotaPropertiesData = {
	_type: TypeRef<EncryptTutanotaPropertiesData>;

	_format: NumberString;
	symEncSessionKey: Uint8Array;
	symKeyVersion: NumberString;

	properties: Id;
}
export const EncryptedMailAddressTypeRef: TypeRef<EncryptedMailAddress> = new TypeRef("tutanota", "EncryptedMailAddress")

export function createEncryptedMailAddress(values: StrippedEntity<EncryptedMailAddress>): EncryptedMailAddress {
	return Object.assign(create(typeModels.EncryptedMailAddress, EncryptedMailAddressTypeRef), values)
}

export type EncryptedMailAddress = {
	_type: TypeRef<EncryptedMailAddress>;

	_id: Id;
	address: string;
	name: string;
}
export const EntropyDataTypeRef: TypeRef<EntropyData> = new TypeRef("tutanota", "EntropyData")

export function createEntropyData(values: StrippedEntity<EntropyData>): EntropyData {
	return Object.assign(create(typeModels.EntropyData, EntropyDataTypeRef), values)
}

export type EntropyData = {
	_type: TypeRef<EntropyData>;

	_format: NumberString;
	userEncEntropy: Uint8Array;
	userKeyVersion: NumberString;
}
export const ExternalUserDataTypeRef: TypeRef<ExternalUserData> = new TypeRef("tutanota", "ExternalUserData")

export function createExternalUserData(values: StrippedEntity<ExternalUserData>): ExternalUserData {
	return Object.assign(create(typeModels.ExternalUserData, ExternalUserDataTypeRef), values)
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
export const FileTypeRef: TypeRef<File> = new TypeRef("tutanota", "File")

export function createFile(values: StrippedEntity<File>): File {
	return Object.assign(create(typeModels.File, FileTypeRef), values)
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
	parent:  null | IdTuple;
	subFiles:  null | Subfiles;
}
export const FileSystemTypeRef: TypeRef<FileSystem> = new TypeRef("tutanota", "FileSystem")

export function createFileSystem(values: StrippedEntity<FileSystem>): FileSystem {
	return Object.assign(create(typeModels.FileSystem, FileSystemTypeRef), values)
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
export const GroupInvitationDeleteDataTypeRef: TypeRef<GroupInvitationDeleteData> = new TypeRef("tutanota", "GroupInvitationDeleteData")

export function createGroupInvitationDeleteData(values: StrippedEntity<GroupInvitationDeleteData>): GroupInvitationDeleteData {
	return Object.assign(create(typeModels.GroupInvitationDeleteData, GroupInvitationDeleteDataTypeRef), values)
}

export type GroupInvitationDeleteData = {
	_type: TypeRef<GroupInvitationDeleteData>;

	_format: NumberString;

	receivedInvitation: IdTuple;
}
export const GroupInvitationPostDataTypeRef: TypeRef<GroupInvitationPostData> = new TypeRef("tutanota", "GroupInvitationPostData")

export function createGroupInvitationPostData(values: StrippedEntity<GroupInvitationPostData>): GroupInvitationPostData {
	return Object.assign(create(typeModels.GroupInvitationPostData, GroupInvitationPostDataTypeRef), values)
}

export type GroupInvitationPostData = {
	_type: TypeRef<GroupInvitationPostData>;

	_format: NumberString;

	internalKeyData: InternalRecipientKeyData[];
	sharedGroupData: SharedGroupData;
}
export const GroupInvitationPostReturnTypeRef: TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", "GroupInvitationPostReturn")

export function createGroupInvitationPostReturn(values: StrippedEntity<GroupInvitationPostReturn>): GroupInvitationPostReturn {
	return Object.assign(create(typeModels.GroupInvitationPostReturn, GroupInvitationPostReturnTypeRef), values)
}

export type GroupInvitationPostReturn = {
	_type: TypeRef<GroupInvitationPostReturn>;

	_format: NumberString;

	existingMailAddresses: MailAddress[];
	invalidMailAddresses: MailAddress[];
	invitedMailAddresses: MailAddress[];
}
export const GroupInvitationPutDataTypeRef: TypeRef<GroupInvitationPutData> = new TypeRef("tutanota", "GroupInvitationPutData")

export function createGroupInvitationPutData(values: StrippedEntity<GroupInvitationPutData>): GroupInvitationPutData {
	return Object.assign(create(typeModels.GroupInvitationPutData, GroupInvitationPutDataTypeRef), values)
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
export const GroupSettingsTypeRef: TypeRef<GroupSettings> = new TypeRef("tutanota", "GroupSettings")

export function createGroupSettings(values: StrippedEntity<GroupSettings>): GroupSettings {
	return Object.assign(create(typeModels.GroupSettings, GroupSettingsTypeRef), values)
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
export const HeaderTypeRef: TypeRef<Header> = new TypeRef("tutanota", "Header")

export function createHeader(values: StrippedEntity<Header>): Header {
	return Object.assign(create(typeModels.Header, HeaderTypeRef), values)
}

export type Header = {
	_type: TypeRef<Header>;

	_id: Id;
	compressedHeaders: null | string;
	headers: null | string;
}
export const ImapFolderTypeRef: TypeRef<ImapFolder> = new TypeRef("tutanota", "ImapFolder")

export function createImapFolder(values: StrippedEntity<ImapFolder>): ImapFolder {
	return Object.assign(create(typeModels.ImapFolder, ImapFolderTypeRef), values)
}

export type ImapFolder = {
	_type: TypeRef<ImapFolder>;

	_id: Id;
	lastseenuid: string;
	name: string;
	uidvalidity: string;

	syncInfo: Id;
}
export const ImapSyncConfigurationTypeRef: TypeRef<ImapSyncConfiguration> = new TypeRef("tutanota", "ImapSyncConfiguration")

export function createImapSyncConfiguration(values: StrippedEntity<ImapSyncConfiguration>): ImapSyncConfiguration {
	return Object.assign(create(typeModels.ImapSyncConfiguration, ImapSyncConfigurationTypeRef), values)
}

export type ImapSyncConfiguration = {
	_type: TypeRef<ImapSyncConfiguration>;

	_id: Id;
	host: string;
	password: string;
	port: NumberString;
	user: string;

	imapSyncState:  null | Id;
}
export const ImapSyncStateTypeRef: TypeRef<ImapSyncState> = new TypeRef("tutanota", "ImapSyncState")

export function createImapSyncState(values: StrippedEntity<ImapSyncState>): ImapSyncState {
	return Object.assign(create(typeModels.ImapSyncState, ImapSyncStateTypeRef), values)
}

export type ImapSyncState = {
	_type: TypeRef<ImapSyncState>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	folders: ImapFolder[];
}
export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", "InboxRule")

export function createInboxRule(values: StrippedEntity<InboxRule>): InboxRule {
	return Object.assign(create(typeModels.InboxRule, InboxRuleTypeRef), values)
}

export type InboxRule = {
	_type: TypeRef<InboxRule>;

	_id: Id;
	type: string;
	value: string;

	targetFolder: IdTuple;
}
export const InternalGroupDataTypeRef: TypeRef<InternalGroupData> = new TypeRef("tutanota", "InternalGroupData")

export function createInternalGroupData(values: StrippedEntity<InternalGroupData>): InternalGroupData {
	return Object.assign(create(typeModels.InternalGroupData, InternalGroupDataTypeRef), values)
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

	adminGroup:  null | Id;
}
export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", "InternalRecipientKeyData")

export function createInternalRecipientKeyData(values: StrippedEntity<InternalRecipientKeyData>): InternalRecipientKeyData {
	return Object.assign(create(typeModels.InternalRecipientKeyData, InternalRecipientKeyDataTypeRef), values)
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
export const KnowledgeBaseEntryTypeRef: TypeRef<KnowledgeBaseEntry> = new TypeRef("tutanota", "KnowledgeBaseEntry")

export function createKnowledgeBaseEntry(values: StrippedEntity<KnowledgeBaseEntry>): KnowledgeBaseEntry {
	return Object.assign(create(typeModels.KnowledgeBaseEntry, KnowledgeBaseEntryTypeRef), values)
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
export const KnowledgeBaseEntryKeywordTypeRef: TypeRef<KnowledgeBaseEntryKeyword> = new TypeRef("tutanota", "KnowledgeBaseEntryKeyword")

export function createKnowledgeBaseEntryKeyword(values: StrippedEntity<KnowledgeBaseEntryKeyword>): KnowledgeBaseEntryKeyword {
	return Object.assign(create(typeModels.KnowledgeBaseEntryKeyword, KnowledgeBaseEntryKeywordTypeRef), values)
}

export type KnowledgeBaseEntryKeyword = {
	_type: TypeRef<KnowledgeBaseEntryKeyword>;

	_id: Id;
	keyword: string;
}
export const ListUnsubscribeDataTypeRef: TypeRef<ListUnsubscribeData> = new TypeRef("tutanota", "ListUnsubscribeData")

export function createListUnsubscribeData(values: StrippedEntity<ListUnsubscribeData>): ListUnsubscribeData {
	return Object.assign(create(typeModels.ListUnsubscribeData, ListUnsubscribeDataTypeRef), values)
}

export type ListUnsubscribeData = {
	_type: TypeRef<ListUnsubscribeData>;

	_format: NumberString;
	headers: string;
	recipient: string;

	mail: IdTuple;
}
export const MailTypeRef: TypeRef<Mail> = new TypeRef("tutanota", "Mail")

export function createMail(values: StrippedEntity<Mail>): Mail {
	return Object.assign(create(typeModels.Mail, MailTypeRef), values)
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
	bucketKey:  null | BucketKey;
	conversationEntry: IdTuple;
	firstRecipient:  null | MailAddress;
	mailDetails:  null | IdTuple;
	mailDetailsDraft:  null | IdTuple;
	sender: MailAddress;
	sets: IdTuple[];
}
export const MailAddressTypeRef: TypeRef<MailAddress> = new TypeRef("tutanota", "MailAddress")

export function createMailAddress(values: StrippedEntity<MailAddress>): MailAddress {
	return Object.assign(create(typeModels.MailAddress, MailAddressTypeRef), values)
}

export type MailAddress = {
	_type: TypeRef<MailAddress>;

	_id: Id;
	address: string;
	name: string;

	contact:  null | IdTuple;
}
export const MailAddressPropertiesTypeRef: TypeRef<MailAddressProperties> = new TypeRef("tutanota", "MailAddressProperties")

export function createMailAddressProperties(values: StrippedEntity<MailAddressProperties>): MailAddressProperties {
	return Object.assign(create(typeModels.MailAddressProperties, MailAddressPropertiesTypeRef), values)
}

export type MailAddressProperties = {
	_type: TypeRef<MailAddressProperties>;

	_id: Id;
	mailAddress: string;
	senderName: string;
}
export const MailBagTypeRef: TypeRef<MailBag> = new TypeRef("tutanota", "MailBag")

export function createMailBag(values: StrippedEntity<MailBag>): MailBag {
	return Object.assign(create(typeModels.MailBag, MailBagTypeRef), values)
}

export type MailBag = {
	_type: TypeRef<MailBag>;

	_id: Id;

	mails: Id;
}
export const MailBoxTypeRef: TypeRef<MailBox> = new TypeRef("tutanota", "MailBox")

export function createMailBox(values: StrippedEntity<MailBox>): MailBox {
	return Object.assign(create(typeModels.MailBox, MailBoxTypeRef), values)
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
	currentMailBag:  null | MailBag;
	folders:  null | MailFolderRef;
	mailDetailsDrafts:  null | MailDetailsDraftsRef;
	receivedAttachments: Id;
	sentAttachments: Id;
	spamResults:  null | SpamResults;
}
export const MailDetailsTypeRef: TypeRef<MailDetails> = new TypeRef("tutanota", "MailDetails")

export function createMailDetails(values: StrippedEntity<MailDetails>): MailDetails {
	return Object.assign(create(typeModels.MailDetails, MailDetailsTypeRef), values)
}

export type MailDetails = {
	_type: TypeRef<MailDetails>;

	_id: Id;
	authStatus: NumberString;
	sentDate: Date;

	body: Body;
	headers:  null | Header;
	recipients: Recipients;
	replyTos: EncryptedMailAddress[];
}
export const MailDetailsBlobTypeRef: TypeRef<MailDetailsBlob> = new TypeRef("tutanota", "MailDetailsBlob")

export function createMailDetailsBlob(values: StrippedEntity<MailDetailsBlob>): MailDetailsBlob {
	return Object.assign(create(typeModels.MailDetailsBlob, MailDetailsBlobTypeRef), values)
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
export const MailDetailsDraftTypeRef: TypeRef<MailDetailsDraft> = new TypeRef("tutanota", "MailDetailsDraft")

export function createMailDetailsDraft(values: StrippedEntity<MailDetailsDraft>): MailDetailsDraft {
	return Object.assign(create(typeModels.MailDetailsDraft, MailDetailsDraftTypeRef), values)
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
export const MailDetailsDraftsRefTypeRef: TypeRef<MailDetailsDraftsRef> = new TypeRef("tutanota", "MailDetailsDraftsRef")

export function createMailDetailsDraftsRef(values: StrippedEntity<MailDetailsDraftsRef>): MailDetailsDraftsRef {
	return Object.assign(create(typeModels.MailDetailsDraftsRef, MailDetailsDraftsRefTypeRef), values)
}

export type MailDetailsDraftsRef = {
	_type: TypeRef<MailDetailsDraftsRef>;

	_id: Id;

	list: Id;
}
export const MailFolderTypeRef: TypeRef<MailFolder> = new TypeRef("tutanota", "MailFolder")

export function createMailFolder(values: StrippedEntity<MailFolder>): MailFolder {
	return Object.assign(create(typeModels.MailFolder, MailFolderTypeRef), values)
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
	folderType: NumberString;
	isLabel: boolean;
	isMailSet: boolean;
	name: string;

	entries: Id;
	mails: Id;
	parentFolder:  null | IdTuple;
}
export const MailFolderRefTypeRef: TypeRef<MailFolderRef> = new TypeRef("tutanota", "MailFolderRef")

export function createMailFolderRef(values: StrippedEntity<MailFolderRef>): MailFolderRef {
	return Object.assign(create(typeModels.MailFolderRef, MailFolderRefTypeRef), values)
}

export type MailFolderRef = {
	_type: TypeRef<MailFolderRef>;

	_id: Id;

	folders: Id;
}
export const MailSetEntryTypeRef: TypeRef<MailSetEntry> = new TypeRef("tutanota", "MailSetEntry")

export function createMailSetEntry(values: StrippedEntity<MailSetEntry>): MailSetEntry {
	return Object.assign(create(typeModels.MailSetEntry, MailSetEntryTypeRef), values)
}

export type MailSetEntry = {
	_type: TypeRef<MailSetEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	mail: IdTuple;
}
export const MailboxGroupRootTypeRef: TypeRef<MailboxGroupRoot> = new TypeRef("tutanota", "MailboxGroupRoot")

export function createMailboxGroupRoot(values: StrippedEntity<MailboxGroupRoot>): MailboxGroupRoot {
	return Object.assign(create(typeModels.MailboxGroupRoot, MailboxGroupRootTypeRef), values)
}

export type MailboxGroupRoot = {
	_type: TypeRef<MailboxGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	calendarEventUpdates:  null | CalendarEventUpdateList;
	mailbox: Id;
	mailboxProperties:  null | Id;
	outOfOfficeNotification:  null | Id;
	outOfOfficeNotificationRecipientList:  null | OutOfOfficeNotificationRecipientList;
	serverProperties: Id;
	whitelistRequests: Id;
}
export const MailboxPropertiesTypeRef: TypeRef<MailboxProperties> = new TypeRef("tutanota", "MailboxProperties")

export function createMailboxProperties(values: StrippedEntity<MailboxProperties>): MailboxProperties {
	return Object.assign(create(typeModels.MailboxProperties, MailboxPropertiesTypeRef), values)
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
export const MailboxServerPropertiesTypeRef: TypeRef<MailboxServerProperties> = new TypeRef("tutanota", "MailboxServerProperties")

export function createMailboxServerProperties(values: StrippedEntity<MailboxServerProperties>): MailboxServerProperties {
	return Object.assign(create(typeModels.MailboxServerProperties, MailboxServerPropertiesTypeRef), values)
}

export type MailboxServerProperties = {
	_type: TypeRef<MailboxServerProperties>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	whitelistProtectionEnabled: boolean;
}
export const MoveMailDataTypeRef: TypeRef<MoveMailData> = new TypeRef("tutanota", "MoveMailData")

export function createMoveMailData(values: StrippedEntity<MoveMailData>): MoveMailData {
	return Object.assign(create(typeModels.MoveMailData, MoveMailDataTypeRef), values)
}

export type MoveMailData = {
	_type: TypeRef<MoveMailData>;

	_format: NumberString;

	mails: IdTuple[];
	sourceFolder:  null | IdTuple;
	targetFolder: IdTuple;
}
export const NewDraftAttachmentTypeRef: TypeRef<NewDraftAttachment> = new TypeRef("tutanota", "NewDraftAttachment")

export function createNewDraftAttachment(values: StrippedEntity<NewDraftAttachment>): NewDraftAttachment {
	return Object.assign(create(typeModels.NewDraftAttachment, NewDraftAttachmentTypeRef), values)
}

export type NewDraftAttachment = {
	_type: TypeRef<NewDraftAttachment>;

	_id: Id;
	encCid: null | Uint8Array;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const NewsIdTypeRef: TypeRef<NewsId> = new TypeRef("tutanota", "NewsId")

export function createNewsId(values: StrippedEntity<NewsId>): NewsId {
	return Object.assign(create(typeModels.NewsId, NewsIdTypeRef), values)
}

export type NewsId = {
	_type: TypeRef<NewsId>;

	_id: Id;
	newsItemId: Id;
	newsItemName: string;
}
export const NewsInTypeRef: TypeRef<NewsIn> = new TypeRef("tutanota", "NewsIn")

export function createNewsIn(values: StrippedEntity<NewsIn>): NewsIn {
	return Object.assign(create(typeModels.NewsIn, NewsInTypeRef), values)
}

export type NewsIn = {
	_type: TypeRef<NewsIn>;

	_format: NumberString;
	newsItemId: null | Id;
}
export const NewsOutTypeRef: TypeRef<NewsOut> = new TypeRef("tutanota", "NewsOut")

export function createNewsOut(values: StrippedEntity<NewsOut>): NewsOut {
	return Object.assign(create(typeModels.NewsOut, NewsOutTypeRef), values)
}

export type NewsOut = {
	_type: TypeRef<NewsOut>;

	_format: NumberString;

	newsItemIds: NewsId[];
}
export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", "NotificationMail")

export function createNotificationMail(values: StrippedEntity<NotificationMail>): NotificationMail {
	return Object.assign(create(typeModels.NotificationMail, NotificationMailTypeRef), values)
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
export const OutOfOfficeNotificationTypeRef: TypeRef<OutOfOfficeNotification> = new TypeRef("tutanota", "OutOfOfficeNotification")

export function createOutOfOfficeNotification(values: StrippedEntity<OutOfOfficeNotification>): OutOfOfficeNotification {
	return Object.assign(create(typeModels.OutOfOfficeNotification, OutOfOfficeNotificationTypeRef), values)
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
export const OutOfOfficeNotificationMessageTypeRef: TypeRef<OutOfOfficeNotificationMessage> = new TypeRef("tutanota", "OutOfOfficeNotificationMessage")

export function createOutOfOfficeNotificationMessage(values: StrippedEntity<OutOfOfficeNotificationMessage>): OutOfOfficeNotificationMessage {
	return Object.assign(create(typeModels.OutOfOfficeNotificationMessage, OutOfOfficeNotificationMessageTypeRef), values)
}

export type OutOfOfficeNotificationMessage = {
	_type: TypeRef<OutOfOfficeNotificationMessage>;

	_id: Id;
	message: string;
	subject: string;
	type: NumberString;
}
export const OutOfOfficeNotificationRecipientListTypeRef: TypeRef<OutOfOfficeNotificationRecipientList> = new TypeRef("tutanota", "OutOfOfficeNotificationRecipientList")

export function createOutOfOfficeNotificationRecipientList(values: StrippedEntity<OutOfOfficeNotificationRecipientList>): OutOfOfficeNotificationRecipientList {
	return Object.assign(create(typeModels.OutOfOfficeNotificationRecipientList, OutOfOfficeNotificationRecipientListTypeRef), values)
}

export type OutOfOfficeNotificationRecipientList = {
	_type: TypeRef<OutOfOfficeNotificationRecipientList>;

	_id: Id;

	list: Id;
}
export const PhishingMarkerWebsocketDataTypeRef: TypeRef<PhishingMarkerWebsocketData> = new TypeRef("tutanota", "PhishingMarkerWebsocketData")

export function createPhishingMarkerWebsocketData(values: StrippedEntity<PhishingMarkerWebsocketData>): PhishingMarkerWebsocketData {
	return Object.assign(create(typeModels.PhishingMarkerWebsocketData, PhishingMarkerWebsocketDataTypeRef), values)
}

export type PhishingMarkerWebsocketData = {
	_type: TypeRef<PhishingMarkerWebsocketData>;

	_format: NumberString;
	lastId: Id;

	markers: ReportedMailFieldMarker[];
}
export const PhotosRefTypeRef: TypeRef<PhotosRef> = new TypeRef("tutanota", "PhotosRef")

export function createPhotosRef(values: StrippedEntity<PhotosRef>): PhotosRef {
	return Object.assign(create(typeModels.PhotosRef, PhotosRefTypeRef), values)
}

export type PhotosRef = {
	_type: TypeRef<PhotosRef>;

	_id: Id;

	files: Id;
}
export const ReceiveInfoServiceDataTypeRef: TypeRef<ReceiveInfoServiceData> = new TypeRef("tutanota", "ReceiveInfoServiceData")

export function createReceiveInfoServiceData(values: StrippedEntity<ReceiveInfoServiceData>): ReceiveInfoServiceData {
	return Object.assign(create(typeModels.ReceiveInfoServiceData, ReceiveInfoServiceDataTypeRef), values)
}

export type ReceiveInfoServiceData = {
	_type: TypeRef<ReceiveInfoServiceData>;

	_format: NumberString;
	language: string;
}
export const RecipientsTypeRef: TypeRef<Recipients> = new TypeRef("tutanota", "Recipients")

export function createRecipients(values: StrippedEntity<Recipients>): Recipients {
	return Object.assign(create(typeModels.Recipients, RecipientsTypeRef), values)
}

export type Recipients = {
	_type: TypeRef<Recipients>;

	_id: Id;

	bccRecipients: MailAddress[];
	ccRecipients: MailAddress[];
	toRecipients: MailAddress[];
}
export const RemoteImapSyncInfoTypeRef: TypeRef<RemoteImapSyncInfo> = new TypeRef("tutanota", "RemoteImapSyncInfo")

export function createRemoteImapSyncInfo(values: StrippedEntity<RemoteImapSyncInfo>): RemoteImapSyncInfo {
	return Object.assign(create(typeModels.RemoteImapSyncInfo, RemoteImapSyncInfoTypeRef), values)
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
export const ReportMailPostDataTypeRef: TypeRef<ReportMailPostData> = new TypeRef("tutanota", "ReportMailPostData")

export function createReportMailPostData(values: StrippedEntity<ReportMailPostData>): ReportMailPostData {
	return Object.assign(create(typeModels.ReportMailPostData, ReportMailPostDataTypeRef), values)
}

export type ReportMailPostData = {
	_type: TypeRef<ReportMailPostData>;

	_format: NumberString;
	mailSessionKey: Uint8Array;
	reportType: NumberString;

	mailId: IdTuple;
}
export const ReportedMailFieldMarkerTypeRef: TypeRef<ReportedMailFieldMarker> = new TypeRef("tutanota", "ReportedMailFieldMarker")

export function createReportedMailFieldMarker(values: StrippedEntity<ReportedMailFieldMarker>): ReportedMailFieldMarker {
	return Object.assign(create(typeModels.ReportedMailFieldMarker, ReportedMailFieldMarkerTypeRef), values)
}

export type ReportedMailFieldMarker = {
	_type: TypeRef<ReportedMailFieldMarker>;

	_id: Id;
	marker: string;
	status: NumberString;
}
export const SecureExternalRecipientKeyDataTypeRef: TypeRef<SecureExternalRecipientKeyData> = new TypeRef("tutanota", "SecureExternalRecipientKeyData")

export function createSecureExternalRecipientKeyData(values: StrippedEntity<SecureExternalRecipientKeyData>): SecureExternalRecipientKeyData {
	return Object.assign(create(typeModels.SecureExternalRecipientKeyData, SecureExternalRecipientKeyDataTypeRef), values)
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
export const SendDraftDataTypeRef: TypeRef<SendDraftData> = new TypeRef("tutanota", "SendDraftData")

export function createSendDraftData(values: StrippedEntity<SendDraftData>): SendDraftData {
	return Object.assign(create(typeModels.SendDraftData, SendDraftDataTypeRef), values)
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
export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", "SendDraftReturn")

export function createSendDraftReturn(values: StrippedEntity<SendDraftReturn>): SendDraftReturn {
	return Object.assign(create(typeModels.SendDraftReturn, SendDraftReturnTypeRef), values)
}

export type SendDraftReturn = {
	_type: TypeRef<SendDraftReturn>;

	_format: NumberString;
	messageId: string;
	sentDate: Date;

	notifications: NotificationMail[];
	sentMail: IdTuple;
}
export const SharedGroupDataTypeRef: TypeRef<SharedGroupData> = new TypeRef("tutanota", "SharedGroupData")

export function createSharedGroupData(values: StrippedEntity<SharedGroupData>): SharedGroupData {
	return Object.assign(create(typeModels.SharedGroupData, SharedGroupDataTypeRef), values)
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
export const SpamResultsTypeRef: TypeRef<SpamResults> = new TypeRef("tutanota", "SpamResults")

export function createSpamResults(values: StrippedEntity<SpamResults>): SpamResults {
	return Object.assign(create(typeModels.SpamResults, SpamResultsTypeRef), values)
}

export type SpamResults = {
	_type: TypeRef<SpamResults>;

	_id: Id;

	list: Id;
}
export const SubfilesTypeRef: TypeRef<Subfiles> = new TypeRef("tutanota", "Subfiles")

export function createSubfiles(values: StrippedEntity<Subfiles>): Subfiles {
	return Object.assign(create(typeModels.Subfiles, SubfilesTypeRef), values)
}

export type Subfiles = {
	_type: TypeRef<Subfiles>;

	_id: Id;

	files: Id;
}
export const SymEncInternalRecipientKeyDataTypeRef: TypeRef<SymEncInternalRecipientKeyData> = new TypeRef("tutanota", "SymEncInternalRecipientKeyData")

export function createSymEncInternalRecipientKeyData(values: StrippedEntity<SymEncInternalRecipientKeyData>): SymEncInternalRecipientKeyData {
	return Object.assign(create(typeModels.SymEncInternalRecipientKeyData, SymEncInternalRecipientKeyDataTypeRef), values)
}

export type SymEncInternalRecipientKeyData = {
	_type: TypeRef<SymEncInternalRecipientKeyData>;

	_id: Id;
	mailAddress: string;
	symEncBucketKey: Uint8Array;
	symKeyVersion: NumberString;

	keyGroup: Id;
}
export const TemplateGroupRootTypeRef: TypeRef<TemplateGroupRoot> = new TypeRef("tutanota", "TemplateGroupRoot")

export function createTemplateGroupRoot(values: StrippedEntity<TemplateGroupRoot>): TemplateGroupRoot {
	return Object.assign(create(typeModels.TemplateGroupRoot, TemplateGroupRootTypeRef), values)
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
export const TranslationGetInTypeRef: TypeRef<TranslationGetIn> = new TypeRef("tutanota", "TranslationGetIn")

export function createTranslationGetIn(values: StrippedEntity<TranslationGetIn>): TranslationGetIn {
	return Object.assign(create(typeModels.TranslationGetIn, TranslationGetInTypeRef), values)
}

export type TranslationGetIn = {
	_type: TypeRef<TranslationGetIn>;

	_format: NumberString;
	lang: string;
}
export const TranslationGetOutTypeRef: TypeRef<TranslationGetOut> = new TypeRef("tutanota", "TranslationGetOut")

export function createTranslationGetOut(values: StrippedEntity<TranslationGetOut>): TranslationGetOut {
	return Object.assign(create(typeModels.TranslationGetOut, TranslationGetOutTypeRef), values)
}

export type TranslationGetOut = {
	_type: TypeRef<TranslationGetOut>;

	_format: NumberString;
	giftCardSubject: string;
	invitationSubject: string;
}
export const TutanotaPropertiesTypeRef: TypeRef<TutanotaProperties> = new TypeRef("tutanota", "TutanotaProperties")

export function createTutanotaProperties(values: StrippedEntity<TutanotaProperties>): TutanotaProperties {
	return Object.assign(create(typeModels.TutanotaProperties, TutanotaPropertiesTypeRef), values)
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
	lastPushedMail:  null | IdTuple;
}
export const UpdateMailFolderDataTypeRef: TypeRef<UpdateMailFolderData> = new TypeRef("tutanota", "UpdateMailFolderData")

export function createUpdateMailFolderData(values: StrippedEntity<UpdateMailFolderData>): UpdateMailFolderData {
	return Object.assign(create(typeModels.UpdateMailFolderData, UpdateMailFolderDataTypeRef), values)
}

export type UpdateMailFolderData = {
	_type: TypeRef<UpdateMailFolderData>;

	_format: NumberString;

	folder: IdTuple;
	newParent:  null | IdTuple;
}
export const UserAccountCreateDataTypeRef: TypeRef<UserAccountCreateData> = new TypeRef("tutanota", "UserAccountCreateData")

export function createUserAccountCreateData(values: StrippedEntity<UserAccountCreateData>): UserAccountCreateData {
	return Object.assign(create(typeModels.UserAccountCreateData, UserAccountCreateDataTypeRef), values)
}

export type UserAccountCreateData = {
	_type: TypeRef<UserAccountCreateData>;

	_format: NumberString;
	date: null | Date;

	userData: UserAccountUserData;
	userGroupData: InternalGroupData;
}
export const UserAccountUserDataTypeRef: TypeRef<UserAccountUserData> = new TypeRef("tutanota", "UserAccountUserData")

export function createUserAccountUserData(values: StrippedEntity<UserAccountUserData>): UserAccountUserData {
	return Object.assign(create(typeModels.UserAccountUserData, UserAccountUserDataTypeRef), values)
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
export const UserAreaGroupDataTypeRef: TypeRef<UserAreaGroupData> = new TypeRef("tutanota", "UserAreaGroupData")

export function createUserAreaGroupData(values: StrippedEntity<UserAreaGroupData>): UserAreaGroupData {
	return Object.assign(create(typeModels.UserAreaGroupData, UserAreaGroupDataTypeRef), values)
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

	adminGroup:  null | Id;
}
export const UserAreaGroupDeleteDataTypeRef: TypeRef<UserAreaGroupDeleteData> = new TypeRef("tutanota", "UserAreaGroupDeleteData")

export function createUserAreaGroupDeleteData(values: StrippedEntity<UserAreaGroupDeleteData>): UserAreaGroupDeleteData {
	return Object.assign(create(typeModels.UserAreaGroupDeleteData, UserAreaGroupDeleteDataTypeRef), values)
}

export type UserAreaGroupDeleteData = {
	_type: TypeRef<UserAreaGroupDeleteData>;

	_format: NumberString;

	group: Id;
}
export const UserAreaGroupPostDataTypeRef: TypeRef<UserAreaGroupPostData> = new TypeRef("tutanota", "UserAreaGroupPostData")

export function createUserAreaGroupPostData(values: StrippedEntity<UserAreaGroupPostData>): UserAreaGroupPostData {
	return Object.assign(create(typeModels.UserAreaGroupPostData, UserAreaGroupPostDataTypeRef), values)
}

export type UserAreaGroupPostData = {
	_type: TypeRef<UserAreaGroupPostData>;

	_format: NumberString;

	groupData: UserAreaGroupData;
}
export const UserSettingsGroupRootTypeRef: TypeRef<UserSettingsGroupRoot> = new TypeRef("tutanota", "UserSettingsGroupRoot")

export function createUserSettingsGroupRoot(values: StrippedEntity<UserSettingsGroupRoot>): UserSettingsGroupRoot {
	return Object.assign(create(typeModels.UserSettingsGroupRoot, UserSettingsGroupRootTypeRef), values)
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
