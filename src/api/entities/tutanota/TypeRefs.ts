import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef} from "@tutao/tutanota-utils"
import {typeModels} from "./TypeModels.js"
import {DateWrapper} from '../sys/TypeRefs.js'
import {Blob} from '../sys/TypeRefs.js'
import {BucketKey} from '../sys/TypeRefs.js'
import {BlobReferenceTokenWrapper} from '../sys/TypeRefs.js'

export const AttachmentKeyDataTypeRef: TypeRef<AttachmentKeyData> = new TypeRef("tutanota", "AttachmentKeyData")

export function createAttachmentKeyData(values?: Partial<AttachmentKeyData>): AttachmentKeyData {
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

export function createBirthday(values?: Partial<Birthday>): Birthday {
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

export function createBody(values?: Partial<Body>): Body {
	return Object.assign(create(typeModels.Body, BodyTypeRef), values)
}

export type Body = {
	_type: TypeRef<Body>;

	_id: Id;
	compressedText: null | string;
	text: null | string;
}
export const CalendarDeleteDataTypeRef: TypeRef<CalendarDeleteData> = new TypeRef("tutanota", "CalendarDeleteData")

export function createCalendarDeleteData(values?: Partial<CalendarDeleteData>): CalendarDeleteData {
	return Object.assign(create(typeModels.CalendarDeleteData, CalendarDeleteDataTypeRef), values)
}

export type CalendarDeleteData = {
	_type: TypeRef<CalendarDeleteData>;

	_format: NumberString;

	groupRootId: Id;
}
export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", "CalendarEvent")

export function createCalendarEvent(values?: Partial<CalendarEvent>): CalendarEvent {
	return Object.assign(create(typeModels.CalendarEvent, CalendarEventTypeRef), values)
}

export type CalendarEvent = {
	_type: TypeRef<CalendarEvent>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	description: string;
	endTime: Date;
	hashedUid: null | Uint8Array;
	invitedConfidentially: null | boolean;
	location: string;
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

export function createCalendarEventAttendee(values?: Partial<CalendarEventAttendee>): CalendarEventAttendee {
	return Object.assign(create(typeModels.CalendarEventAttendee, CalendarEventAttendeeTypeRef), values)
}

export type CalendarEventAttendee = {
	_type: TypeRef<CalendarEventAttendee>;

	_id: Id;
	status: NumberString;

	address: EncryptedMailAddress;
}
export const CalendarEventIndexRefTypeRef: TypeRef<CalendarEventIndexRef> = new TypeRef("tutanota", "CalendarEventIndexRef")

export function createCalendarEventIndexRef(values?: Partial<CalendarEventIndexRef>): CalendarEventIndexRef {
	return Object.assign(create(typeModels.CalendarEventIndexRef, CalendarEventIndexRefTypeRef), values)
}

export type CalendarEventIndexRef = {
	_type: TypeRef<CalendarEventIndexRef>;

	_id: Id;

	list: Id;
}
export const CalendarEventUidIndexTypeRef: TypeRef<CalendarEventUidIndex> = new TypeRef("tutanota", "CalendarEventUidIndex")

export function createCalendarEventUidIndex(values?: Partial<CalendarEventUidIndex>): CalendarEventUidIndex {
	return Object.assign(create(typeModels.CalendarEventUidIndex, CalendarEventUidIndexTypeRef), values)
}

export type CalendarEventUidIndex = {
	_type: TypeRef<CalendarEventUidIndex>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	calendarEvent: IdTuple;
}
export const CalendarEventUpdateTypeRef: TypeRef<CalendarEventUpdate> = new TypeRef("tutanota", "CalendarEventUpdate")

export function createCalendarEventUpdate(values?: Partial<CalendarEventUpdate>): CalendarEventUpdate {
	return Object.assign(create(typeModels.CalendarEventUpdate, CalendarEventUpdateTypeRef), values)
}

export type CalendarEventUpdate = {
	_type: TypeRef<CalendarEventUpdate>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	sender: string;

	file: IdTuple;
}
export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", "CalendarEventUpdateList")

export function createCalendarEventUpdateList(values?: Partial<CalendarEventUpdateList>): CalendarEventUpdateList {
	return Object.assign(create(typeModels.CalendarEventUpdateList, CalendarEventUpdateListTypeRef), values)
}

export type CalendarEventUpdateList = {
	_type: TypeRef<CalendarEventUpdateList>;

	_id: Id;

	list: Id;
}
export const CalendarGroupRootTypeRef: TypeRef<CalendarGroupRoot> = new TypeRef("tutanota", "CalendarGroupRoot")

export function createCalendarGroupRoot(values?: Partial<CalendarGroupRoot>): CalendarGroupRoot {
	return Object.assign(create(typeModels.CalendarGroupRoot, CalendarGroupRootTypeRef), values)
}

export type CalendarGroupRoot = {
	_type: TypeRef<CalendarGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	index:  null | CalendarEventIndexRef;
	longEvents: Id;
	shortEvents: Id;
}
export const CalendarRepeatRuleTypeRef: TypeRef<CalendarRepeatRule> = new TypeRef("tutanota", "CalendarRepeatRule")

export function createCalendarRepeatRule(values?: Partial<CalendarRepeatRule>): CalendarRepeatRule {
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

export function createContact(values?: Partial<Contact>): Contact {
	return Object.assign(create(typeModels.Contact, ContactTypeRef), values)
}

export type Contact = {
	_type: TypeRef<Contact>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	autoTransmitPassword: string;
	birthdayIso: null | string;
	comment: string;
	company: string;
	firstName: string;
	lastName: string;
	nickname: null | string;
	oldBirthdayDate: null | Date;
	presharedPassword: null | string;
	role: string;
	title: null | string;

	addresses: ContactAddress[];
	mailAddresses: ContactMailAddress[];
	oldBirthdayAggregate:  null | Birthday;
	phoneNumbers: ContactPhoneNumber[];
	photo:  null | IdTuple;
	socialIds: ContactSocialId[];
}
export const ContactAddressTypeRef: TypeRef<ContactAddress> = new TypeRef("tutanota", "ContactAddress")

export function createContactAddress(values?: Partial<ContactAddress>): ContactAddress {
	return Object.assign(create(typeModels.ContactAddress, ContactAddressTypeRef), values)
}

export type ContactAddress = {
	_type: TypeRef<ContactAddress>;

	_id: Id;
	address: string;
	customTypeName: string;
	type: NumberString;
}
export const ContactFormTypeRef: TypeRef<ContactForm> = new TypeRef("tutanota", "ContactForm")

export function createContactForm(values?: Partial<ContactForm>): ContactForm {
	return Object.assign(create(typeModels.ContactForm, ContactFormTypeRef), values)
}

export type ContactForm = {
	_type: TypeRef<ContactForm>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	path: string;

	delegationGroups_removed: Id[];
	languages: ContactFormLanguage[];
	participantGroupInfos: IdTuple[];
	targetGroup: Id;
	targetGroupInfo:  null | IdTuple;
}
export const ContactFormAccountDataTypeRef: TypeRef<ContactFormAccountData> = new TypeRef("tutanota", "ContactFormAccountData")

export function createContactFormAccountData(values?: Partial<ContactFormAccountData>): ContactFormAccountData {
	return Object.assign(create(typeModels.ContactFormAccountData, ContactFormAccountDataTypeRef), values)
}

export type ContactFormAccountData = {
	_type: TypeRef<ContactFormAccountData>;

	_format: NumberString;

	contactForm: IdTuple;
	userData: ContactFormUserData;
	userGroupData: InternalGroupData;
}
export const ContactFormAccountReturnTypeRef: TypeRef<ContactFormAccountReturn> = new TypeRef("tutanota", "ContactFormAccountReturn")

export function createContactFormAccountReturn(values?: Partial<ContactFormAccountReturn>): ContactFormAccountReturn {
	return Object.assign(create(typeModels.ContactFormAccountReturn, ContactFormAccountReturnTypeRef), values)
}

export type ContactFormAccountReturn = {
	_type: TypeRef<ContactFormAccountReturn>;

	_format: NumberString;
	requestMailAddress: string;
	responseMailAddress: string;
}
export const ContactFormLanguageTypeRef: TypeRef<ContactFormLanguage> = new TypeRef("tutanota", "ContactFormLanguage")

export function createContactFormLanguage(values?: Partial<ContactFormLanguage>): ContactFormLanguage {
	return Object.assign(create(typeModels.ContactFormLanguage, ContactFormLanguageTypeRef), values)
}

export type ContactFormLanguage = {
	_type: TypeRef<ContactFormLanguage>;

	_id: Id;
	code: string;
	footerHtml: string;
	headerHtml: string;
	helpHtml: string;
	pageTitle: string;
}
export const ContactFormUserDataTypeRef: TypeRef<ContactFormUserData> = new TypeRef("tutanota", "ContactFormUserData")

export function createContactFormUserData(values?: Partial<ContactFormUserData>): ContactFormUserData {
	return Object.assign(create(typeModels.ContactFormUserData, ContactFormUserDataTypeRef), values)
}

export type ContactFormUserData = {
	_type: TypeRef<ContactFormUserData>;

	_id: Id;
	mailEncMailBoxSessionKey: Uint8Array;
	ownerEncMailGroupInfoSessionKey: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	salt: Uint8Array;
	userEncClientKey: Uint8Array;
	userEncEntropy: Uint8Array;
	userEncMailGroupKey: Uint8Array;
	userEncTutanotaPropertiesSessionKey: Uint8Array;
	verifier: Uint8Array;
}
export const ContactListTypeRef: TypeRef<ContactList> = new TypeRef("tutanota", "ContactList")

export function createContactList(values?: Partial<ContactList>): ContactList {
	return Object.assign(create(typeModels.ContactList, ContactListTypeRef), values)
}

export type ContactList = {
	_type: TypeRef<ContactList>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	contacts: Id;
	photos:  null | PhotosRef;
}
export const ContactMailAddressTypeRef: TypeRef<ContactMailAddress> = new TypeRef("tutanota", "ContactMailAddress")

export function createContactMailAddress(values?: Partial<ContactMailAddress>): ContactMailAddress {
	return Object.assign(create(typeModels.ContactMailAddress, ContactMailAddressTypeRef), values)
}

export type ContactMailAddress = {
	_type: TypeRef<ContactMailAddress>;

	_id: Id;
	address: string;
	customTypeName: string;
	type: NumberString;
}
export const ContactPhoneNumberTypeRef: TypeRef<ContactPhoneNumber> = new TypeRef("tutanota", "ContactPhoneNumber")

export function createContactPhoneNumber(values?: Partial<ContactPhoneNumber>): ContactPhoneNumber {
	return Object.assign(create(typeModels.ContactPhoneNumber, ContactPhoneNumberTypeRef), values)
}

export type ContactPhoneNumber = {
	_type: TypeRef<ContactPhoneNumber>;

	_id: Id;
	customTypeName: string;
	number: string;
	type: NumberString;
}
export const ContactSocialIdTypeRef: TypeRef<ContactSocialId> = new TypeRef("tutanota", "ContactSocialId")

export function createContactSocialId(values?: Partial<ContactSocialId>): ContactSocialId {
	return Object.assign(create(typeModels.ContactSocialId, ContactSocialIdTypeRef), values)
}

export type ContactSocialId = {
	_type: TypeRef<ContactSocialId>;

	_id: Id;
	customTypeName: string;
	socialId: string;
	type: NumberString;
}
export const ConversationEntryTypeRef: TypeRef<ConversationEntry> = new TypeRef("tutanota", "ConversationEntry")

export function createConversationEntry(values?: Partial<ConversationEntry>): ConversationEntry {
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

export function createCreateExternalUserGroupData(values?: Partial<CreateExternalUserGroupData>): CreateExternalUserGroupData {
	return Object.assign(create(typeModels.CreateExternalUserGroupData, CreateExternalUserGroupDataTypeRef), values)
}

export type CreateExternalUserGroupData = {
	_type: TypeRef<CreateExternalUserGroupData>;

	_id: Id;
	externalPwEncUserGroupKey: Uint8Array;
	internalUserEncUserGroupKey: Uint8Array;
	mailAddress: string;
}
export const CreateFileDataTypeRef: TypeRef<CreateFileData> = new TypeRef("tutanota", "CreateFileData")

export function createCreateFileData(values?: Partial<CreateFileData>): CreateFileData {
	return Object.assign(create(typeModels.CreateFileData, CreateFileDataTypeRef), values)
}

export type CreateFileData = {
	_type: TypeRef<CreateFileData>;
	_errors: Object;

	_format: NumberString;
	fileName: string;
	group: Id;
	mimeType: string;
	ownerEncSessionKey: Uint8Array;

	fileData: Id;
	parentFolder:  null | IdTuple;
}
export const CreateGroupPostReturnTypeRef: TypeRef<CreateGroupPostReturn> = new TypeRef("tutanota", "CreateGroupPostReturn")

export function createCreateGroupPostReturn(values?: Partial<CreateGroupPostReturn>): CreateGroupPostReturn {
	return Object.assign(create(typeModels.CreateGroupPostReturn, CreateGroupPostReturnTypeRef), values)
}

export type CreateGroupPostReturn = {
	_type: TypeRef<CreateGroupPostReturn>;
	_errors: Object;

	_format: NumberString;

	group: Id;
}
export const CreateLocalAdminGroupDataTypeRef: TypeRef<CreateLocalAdminGroupData> = new TypeRef("tutanota", "CreateLocalAdminGroupData")

export function createCreateLocalAdminGroupData(values?: Partial<CreateLocalAdminGroupData>): CreateLocalAdminGroupData {
	return Object.assign(create(typeModels.CreateLocalAdminGroupData, CreateLocalAdminGroupDataTypeRef), values)
}

export type CreateLocalAdminGroupData = {
	_type: TypeRef<CreateLocalAdminGroupData>;

	_format: NumberString;
	encryptedName: Uint8Array;

	groupData: InternalGroupData;
}
export const CreateMailFolderDataTypeRef: TypeRef<CreateMailFolderData> = new TypeRef("tutanota", "CreateMailFolderData")

export function createCreateMailFolderData(values?: Partial<CreateMailFolderData>): CreateMailFolderData {
	return Object.assign(create(typeModels.CreateMailFolderData, CreateMailFolderDataTypeRef), values)
}

export type CreateMailFolderData = {
	_type: TypeRef<CreateMailFolderData>;
	_errors: Object;

	_format: NumberString;
	folderName: string;
	ownerEncSessionKey: Uint8Array;
	ownerGroup: null | Id;

	parentFolder:  null | IdTuple;
}
export const CreateMailFolderReturnTypeRef: TypeRef<CreateMailFolderReturn> = new TypeRef("tutanota", "CreateMailFolderReturn")

export function createCreateMailFolderReturn(values?: Partial<CreateMailFolderReturn>): CreateMailFolderReturn {
	return Object.assign(create(typeModels.CreateMailFolderReturn, CreateMailFolderReturnTypeRef), values)
}

export type CreateMailFolderReturn = {
	_type: TypeRef<CreateMailFolderReturn>;
	_errors: Object;

	_format: NumberString;

	newFolder: IdTuple;
}
export const CreateMailGroupDataTypeRef: TypeRef<CreateMailGroupData> = new TypeRef("tutanota", "CreateMailGroupData")

export function createCreateMailGroupData(values?: Partial<CreateMailGroupData>): CreateMailGroupData {
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

export function createCustomerAccountCreateData(values?: Partial<CustomerAccountCreateData>): CustomerAccountCreateData {
	return Object.assign(create(typeModels.CustomerAccountCreateData, CustomerAccountCreateDataTypeRef), values)
}

export type CustomerAccountCreateData = {
	_type: TypeRef<CustomerAccountCreateData>;

	_format: NumberString;
	adminEncAccountingInfoSessionKey: Uint8Array;
	adminEncCustomerServerPropertiesSessionKey: Uint8Array;
	authToken: string;
	code: string;
	date: null | Date;
	lang: string;
	systemAdminPubEncAccountingInfoSessionKey: Uint8Array;
	userEncAccountGroupKey: Uint8Array;
	userEncAdminGroupKey: Uint8Array;

	adminGroupData: InternalGroupData;
	customerGroupData: InternalGroupData;
	userData: UserAccountUserData;
	userGroupData: InternalGroupData;
}
export const CustomerContactFormGroupRootTypeRef: TypeRef<CustomerContactFormGroupRoot> = new TypeRef("tutanota", "CustomerContactFormGroupRoot")

export function createCustomerContactFormGroupRoot(values?: Partial<CustomerContactFormGroupRoot>): CustomerContactFormGroupRoot {
	return Object.assign(create(typeModels.CustomerContactFormGroupRoot, CustomerContactFormGroupRootTypeRef), values)
}

export type CustomerContactFormGroupRoot = {
	_type: TypeRef<CustomerContactFormGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	contactFormConversations:  null | DeleteContactFormConversationIndex;
	contactForms: Id;
}
export const DataBlockTypeRef: TypeRef<DataBlock> = new TypeRef("tutanota", "DataBlock")

export function createDataBlock(values?: Partial<DataBlock>): DataBlock {
	return Object.assign(create(typeModels.DataBlock, DataBlockTypeRef), values)
}

export type DataBlock = {
	_type: TypeRef<DataBlock>;

	_id: Id;
	blockData: Id;
	size: NumberString;
}
export const DeleteContactFormConversationIndexTypeRef: TypeRef<DeleteContactFormConversationIndex> = new TypeRef("tutanota", "DeleteContactFormConversationIndex")

export function createDeleteContactFormConversationIndex(values?: Partial<DeleteContactFormConversationIndex>): DeleteContactFormConversationIndex {
	return Object.assign(create(typeModels.DeleteContactFormConversationIndex, DeleteContactFormConversationIndexTypeRef), values)
}

export type DeleteContactFormConversationIndex = {
	_type: TypeRef<DeleteContactFormConversationIndex>;

	_id: Id;

	items: Id;
}
export const DeleteContactFormConversationIndexEntryTypeRef: TypeRef<DeleteContactFormConversationIndexEntry> = new TypeRef("tutanota", "DeleteContactFormConversationIndexEntry")

export function createDeleteContactFormConversationIndexEntry(values?: Partial<DeleteContactFormConversationIndexEntry>): DeleteContactFormConversationIndexEntry {
	return Object.assign(create(typeModels.DeleteContactFormConversationIndexEntry, DeleteContactFormConversationIndexEntryTypeRef), values)
}

export type DeleteContactFormConversationIndexEntry = {
	_type: TypeRef<DeleteContactFormConversationIndexEntry>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
}
export const DeleteGroupDataTypeRef: TypeRef<DeleteGroupData> = new TypeRef("tutanota", "DeleteGroupData")

export function createDeleteGroupData(values?: Partial<DeleteGroupData>): DeleteGroupData {
	return Object.assign(create(typeModels.DeleteGroupData, DeleteGroupDataTypeRef), values)
}

export type DeleteGroupData = {
	_type: TypeRef<DeleteGroupData>;

	_format: NumberString;
	restore: boolean;

	group: Id;
}
export const DeleteMailDataTypeRef: TypeRef<DeleteMailData> = new TypeRef("tutanota", "DeleteMailData")

export function createDeleteMailData(values?: Partial<DeleteMailData>): DeleteMailData {
	return Object.assign(create(typeModels.DeleteMailData, DeleteMailDataTypeRef), values)
}

export type DeleteMailData = {
	_type: TypeRef<DeleteMailData>;

	_format: NumberString;

	folder:  null | IdTuple;
	mails: IdTuple[];
}
export const DeleteMailFolderDataTypeRef: TypeRef<DeleteMailFolderData> = new TypeRef("tutanota", "DeleteMailFolderData")

export function createDeleteMailFolderData(values?: Partial<DeleteMailFolderData>): DeleteMailFolderData {
	return Object.assign(create(typeModels.DeleteMailFolderData, DeleteMailFolderDataTypeRef), values)
}

export type DeleteMailFolderData = {
	_type: TypeRef<DeleteMailFolderData>;
	_errors: Object;

	_format: NumberString;

	folders: IdTuple[];
}
export const DraftAttachmentTypeRef: TypeRef<DraftAttachment> = new TypeRef("tutanota", "DraftAttachment")

export function createDraftAttachment(values?: Partial<DraftAttachment>): DraftAttachment {
	return Object.assign(create(typeModels.DraftAttachment, DraftAttachmentTypeRef), values)
}

export type DraftAttachment = {
	_type: TypeRef<DraftAttachment>;

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;

	existingFile:  null | IdTuple;
	newFile:  null | NewDraftAttachment;
}
export const DraftCreateDataTypeRef: TypeRef<DraftCreateData> = new TypeRef("tutanota", "DraftCreateData")

export function createDraftCreateData(values?: Partial<DraftCreateData>): DraftCreateData {
	return Object.assign(create(typeModels.DraftCreateData, DraftCreateDataTypeRef), values)
}

export type DraftCreateData = {
	_type: TypeRef<DraftCreateData>;
	_errors: Object;

	_format: NumberString;
	conversationType: NumberString;
	ownerEncSessionKey: Uint8Array;
	previousMessageId: null | string;
	symEncSessionKey: Uint8Array;

	draftData: DraftData;
}
export const DraftCreateReturnTypeRef: TypeRef<DraftCreateReturn> = new TypeRef("tutanota", "DraftCreateReturn")

export function createDraftCreateReturn(values?: Partial<DraftCreateReturn>): DraftCreateReturn {
	return Object.assign(create(typeModels.DraftCreateReturn, DraftCreateReturnTypeRef), values)
}

export type DraftCreateReturn = {
	_type: TypeRef<DraftCreateReturn>;

	_format: NumberString;

	draft: IdTuple;
}
export const DraftDataTypeRef: TypeRef<DraftData> = new TypeRef("tutanota", "DraftData")

export function createDraftData(values?: Partial<DraftData>): DraftData {
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

export function createDraftRecipient(values?: Partial<DraftRecipient>): DraftRecipient {
	return Object.assign(create(typeModels.DraftRecipient, DraftRecipientTypeRef), values)
}

export type DraftRecipient = {
	_type: TypeRef<DraftRecipient>;

	_id: Id;
	mailAddress: string;
	name: string;
}
export const DraftUpdateDataTypeRef: TypeRef<DraftUpdateData> = new TypeRef("tutanota", "DraftUpdateData")

export function createDraftUpdateData(values?: Partial<DraftUpdateData>): DraftUpdateData {
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

export function createDraftUpdateReturn(values?: Partial<DraftUpdateReturn>): DraftUpdateReturn {
	return Object.assign(create(typeModels.DraftUpdateReturn, DraftUpdateReturnTypeRef), values)
}

export type DraftUpdateReturn = {
	_type: TypeRef<DraftUpdateReturn>;
	_errors: Object;

	_format: NumberString;

	attachments: IdTuple[];
}
export const EmailTemplateTypeRef: TypeRef<EmailTemplate> = new TypeRef("tutanota", "EmailTemplate")

export function createEmailTemplate(values?: Partial<EmailTemplate>): EmailTemplate {
	return Object.assign(create(typeModels.EmailTemplate, EmailTemplateTypeRef), values)
}

export type EmailTemplate = {
	_type: TypeRef<EmailTemplate>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	tag: string;
	title: string;

	contents: EmailTemplateContent[];
}
export const EmailTemplateContentTypeRef: TypeRef<EmailTemplateContent> = new TypeRef("tutanota", "EmailTemplateContent")

export function createEmailTemplateContent(values?: Partial<EmailTemplateContent>): EmailTemplateContent {
	return Object.assign(create(typeModels.EmailTemplateContent, EmailTemplateContentTypeRef), values)
}

export type EmailTemplateContent = {
	_type: TypeRef<EmailTemplateContent>;

	_id: Id;
	languageCode: string;
	text: string;
}
export const EncryptTutanotaPropertiesDataTypeRef: TypeRef<EncryptTutanotaPropertiesData> = new TypeRef("tutanota", "EncryptTutanotaPropertiesData")

export function createEncryptTutanotaPropertiesData(values?: Partial<EncryptTutanotaPropertiesData>): EncryptTutanotaPropertiesData {
	return Object.assign(create(typeModels.EncryptTutanotaPropertiesData, EncryptTutanotaPropertiesDataTypeRef), values)
}

export type EncryptTutanotaPropertiesData = {
	_type: TypeRef<EncryptTutanotaPropertiesData>;

	_format: NumberString;
	symEncSessionKey: Uint8Array;

	properties: Id;
}
export const EncryptedMailAddressTypeRef: TypeRef<EncryptedMailAddress> = new TypeRef("tutanota", "EncryptedMailAddress")

export function createEncryptedMailAddress(values?: Partial<EncryptedMailAddress>): EncryptedMailAddress {
	return Object.assign(create(typeModels.EncryptedMailAddress, EncryptedMailAddressTypeRef), values)
}

export type EncryptedMailAddress = {
	_type: TypeRef<EncryptedMailAddress>;

	_id: Id;
	address: string;
	name: string;
}
export const EntropyDataTypeRef: TypeRef<EntropyData> = new TypeRef("tutanota", "EntropyData")

export function createEntropyData(values?: Partial<EntropyData>): EntropyData {
	return Object.assign(create(typeModels.EntropyData, EntropyDataTypeRef), values)
}

export type EntropyData = {
	_type: TypeRef<EntropyData>;

	_format: NumberString;
	groupEncEntropy: Uint8Array;
}
export const ExternalUserDataTypeRef: TypeRef<ExternalUserData> = new TypeRef("tutanota", "ExternalUserData")

export function createExternalUserData(values?: Partial<ExternalUserData>): ExternalUserData {
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
	userEncClientKey: Uint8Array;
	verifier: Uint8Array;

	userGroupData: CreateExternalUserGroupData;
}
export const FileTypeRef: TypeRef<File> = new TypeRef("tutanota", "File")

export function createFile(values?: Partial<File>): File {
	return Object.assign(create(typeModels.File, FileTypeRef), values)
}

export type File = {
	_type: TypeRef<File>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	cid: null | string;
	mimeType: null | string;
	name: string;
	size: NumberString;

	blobs: Blob[];
	data:  null | Id;
	parent:  null | IdTuple;
	subFiles:  null | Subfiles;
}
export const FileDataTypeRef: TypeRef<FileData> = new TypeRef("tutanota", "FileData")

export function createFileData(values?: Partial<FileData>): FileData {
	return Object.assign(create(typeModels.FileData, FileDataTypeRef), values)
}

export type FileData = {
	_type: TypeRef<FileData>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	size: NumberString;
	unreferenced: boolean;

	blocks: DataBlock[];
}
export const FileDataDataGetTypeRef: TypeRef<FileDataDataGet> = new TypeRef("tutanota", "FileDataDataGet")

export function createFileDataDataGet(values?: Partial<FileDataDataGet>): FileDataDataGet {
	return Object.assign(create(typeModels.FileDataDataGet, FileDataDataGetTypeRef), values)
}

export type FileDataDataGet = {
	_type: TypeRef<FileDataDataGet>;
	_errors: Object;

	_format: NumberString;
	base64: boolean;

	file: IdTuple;
}
export const FileDataDataPostTypeRef: TypeRef<FileDataDataPost> = new TypeRef("tutanota", "FileDataDataPost")

export function createFileDataDataPost(values?: Partial<FileDataDataPost>): FileDataDataPost {
	return Object.assign(create(typeModels.FileDataDataPost, FileDataDataPostTypeRef), values)
}

export type FileDataDataPost = {
	_type: TypeRef<FileDataDataPost>;
	_errors: Object;

	_format: NumberString;
	group: Id;
	size: NumberString;
}
export const FileDataDataReturnTypeRef: TypeRef<FileDataDataReturn> = new TypeRef("tutanota", "FileDataDataReturn")

export function createFileDataDataReturn(values?: Partial<FileDataDataReturn>): FileDataDataReturn {
	return Object.assign(create(typeModels.FileDataDataReturn, FileDataDataReturnTypeRef), values)
}

export type FileDataDataReturn = {
	_type: TypeRef<FileDataDataReturn>;
	_errors: Object;

	_format: NumberString;
	size: NumberString;
}
export const FileDataReturnPostTypeRef: TypeRef<FileDataReturnPost> = new TypeRef("tutanota", "FileDataReturnPost")

export function createFileDataReturnPost(values?: Partial<FileDataReturnPost>): FileDataReturnPost {
	return Object.assign(create(typeModels.FileDataReturnPost, FileDataReturnPostTypeRef), values)
}

export type FileDataReturnPost = {
	_type: TypeRef<FileDataReturnPost>;
	_errors: Object;

	_format: NumberString;

	fileData: Id;
}
export const FileSystemTypeRef: TypeRef<FileSystem> = new TypeRef("tutanota", "FileSystem")

export function createFileSystem(values?: Partial<FileSystem>): FileSystem {
	return Object.assign(create(typeModels.FileSystem, FileSystemTypeRef), values)
}

export type FileSystem = {
	_type: TypeRef<FileSystem>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	files: Id;
}
export const GroupInvitationDeleteDataTypeRef: TypeRef<GroupInvitationDeleteData> = new TypeRef("tutanota", "GroupInvitationDeleteData")

export function createGroupInvitationDeleteData(values?: Partial<GroupInvitationDeleteData>): GroupInvitationDeleteData {
	return Object.assign(create(typeModels.GroupInvitationDeleteData, GroupInvitationDeleteDataTypeRef), values)
}

export type GroupInvitationDeleteData = {
	_type: TypeRef<GroupInvitationDeleteData>;

	_format: NumberString;

	receivedInvitation: IdTuple;
}
export const GroupInvitationPostDataTypeRef: TypeRef<GroupInvitationPostData> = new TypeRef("tutanota", "GroupInvitationPostData")

export function createGroupInvitationPostData(values?: Partial<GroupInvitationPostData>): GroupInvitationPostData {
	return Object.assign(create(typeModels.GroupInvitationPostData, GroupInvitationPostDataTypeRef), values)
}

export type GroupInvitationPostData = {
	_type: TypeRef<GroupInvitationPostData>;

	_format: NumberString;

	internalKeyData: InternalRecipientKeyData[];
	sharedGroupData: SharedGroupData;
}
export const GroupInvitationPostReturnTypeRef: TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", "GroupInvitationPostReturn")

export function createGroupInvitationPostReturn(values?: Partial<GroupInvitationPostReturn>): GroupInvitationPostReturn {
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

export function createGroupInvitationPutData(values?: Partial<GroupInvitationPutData>): GroupInvitationPutData {
	return Object.assign(create(typeModels.GroupInvitationPutData, GroupInvitationPutDataTypeRef), values)
}

export type GroupInvitationPutData = {
	_type: TypeRef<GroupInvitationPutData>;

	_format: NumberString;
	sharedGroupEncInviteeGroupInfoKey: Uint8Array;
	userGroupEncGroupKey: Uint8Array;

	receivedInvitation: IdTuple;
}
export const GroupSettingsTypeRef: TypeRef<GroupSettings> = new TypeRef("tutanota", "GroupSettings")

export function createGroupSettings(values?: Partial<GroupSettings>): GroupSettings {
	return Object.assign(create(typeModels.GroupSettings, GroupSettingsTypeRef), values)
}

export type GroupSettings = {
	_type: TypeRef<GroupSettings>;

	_id: Id;
	color: string;
	name: null | string;

	group: Id;
}
export const HeaderTypeRef: TypeRef<Header> = new TypeRef("tutanota", "Header")

export function createHeader(values?: Partial<Header>): Header {
	return Object.assign(create(typeModels.Header, HeaderTypeRef), values)
}

export type Header = {
	_type: TypeRef<Header>;

	_id: Id;
	compressedHeaders: null | string;
	headers: null | string;
}
export const ImapFolderTypeRef: TypeRef<ImapFolder> = new TypeRef("tutanota", "ImapFolder")

export function createImapFolder(values?: Partial<ImapFolder>): ImapFolder {
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

export function createImapSyncConfiguration(values?: Partial<ImapSyncConfiguration>): ImapSyncConfiguration {
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

export function createImapSyncState(values?: Partial<ImapSyncState>): ImapSyncState {
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
export const ImportAttachmentTypeRef: TypeRef<ImportAttachment> = new TypeRef("tutanota", "ImportAttachment")

export function createImportAttachment(values?: Partial<ImportAttachment>): ImportAttachment {
	return Object.assign(create(typeModels.ImportAttachment, ImportAttachmentTypeRef), values)
}

export type ImportAttachment = {
	_type: TypeRef<ImportAttachment>;

	_id: Id;
	ownerEncFileSessionKey: Uint8Array;

	existingFile:  null | IdTuple;
	newFile:  null | NewImportAttachment;
}
export const ImportImapAccountTypeRef: TypeRef<ImportImapAccount> = new TypeRef("tutanota", "ImportImapAccount")

export function createImportImapAccount(values?: Partial<ImportImapAccount>): ImportImapAccount {
	return Object.assign(create(typeModels.ImportImapAccount, ImportImapAccountTypeRef), values)
}

export type ImportImapAccount = {
	_type: TypeRef<ImportImapAccount>;

	_id: Id;
	accessToken: null | string;
	host: string;
	password: null | string;
	port: NumberString;
	userName: string;
}
export const ImportImapAccountSyncStateTypeRef: TypeRef<ImportImapAccountSyncState> = new TypeRef("tutanota", "ImportImapAccountSyncState")

export function createImportImapAccountSyncState(values?: Partial<ImportImapAccountSyncState>): ImportImapAccountSyncState {
	return Object.assign(create(typeModels.ImportImapAccountSyncState, ImportImapAccountSyncStateTypeRef), values)
}

export type ImportImapAccountSyncState = {
	_type: TypeRef<ImportImapAccountSyncState>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	importedMailCount: NumberString;
	maxQuota: NumberString;
	postponedUntil: NumberString;

	imapAccount: ImportImapAccount;
	imapFolderSyncStateList: Id;
	importedImapAttachmentHashToIdMap: Id;
	rootImportMailFolder:  null | IdTuple;
}
export const ImportImapAttachmentHashToIdTypeRef: TypeRef<ImportImapAttachmentHashToId> = new TypeRef("tutanota", "ImportImapAttachmentHashToId")

export function createImportImapAttachmentHashToId(values?: Partial<ImportImapAttachmentHashToId>): ImportImapAttachmentHashToId {
	return Object.assign(create(typeModels.ImportImapAttachmentHashToId, ImportImapAttachmentHashToIdTypeRef), values)
}

export type ImportImapAttachmentHashToId = {
	_type: TypeRef<ImportImapAttachmentHashToId>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	imapAttachmentHash: string;

	attachment: IdTuple;
}
export const ImportImapDeleteInTypeRef: TypeRef<ImportImapDeleteIn> = new TypeRef("tutanota", "ImportImapDeleteIn")

export function createImportImapDeleteIn(values?: Partial<ImportImapDeleteIn>): ImportImapDeleteIn {
	return Object.assign(create(typeModels.ImportImapDeleteIn, ImportImapDeleteInTypeRef), values)
}

export type ImportImapDeleteIn = {
	_type: TypeRef<ImportImapDeleteIn>;
	_errors: Object;

	_format: NumberString;

	imapAccountSyncState: Id;
}
export const ImportImapFolderDeleteInTypeRef: TypeRef<ImportImapFolderDeleteIn> = new TypeRef("tutanota", "ImportImapFolderDeleteIn")

export function createImportImapFolderDeleteIn(values?: Partial<ImportImapFolderDeleteIn>): ImportImapFolderDeleteIn {
	return Object.assign(create(typeModels.ImportImapFolderDeleteIn, ImportImapFolderDeleteInTypeRef), values)
}

export type ImportImapFolderDeleteIn = {
	_type: TypeRef<ImportImapFolderDeleteIn>;

	_format: NumberString;

	imapFolderSyncState: IdTuple;
}
export const ImportImapFolderPostInTypeRef: TypeRef<ImportImapFolderPostIn> = new TypeRef("tutanota", "ImportImapFolderPostIn")

export function createImportImapFolderPostIn(values?: Partial<ImportImapFolderPostIn>): ImportImapFolderPostIn {
	return Object.assign(create(typeModels.ImportImapFolderPostIn, ImportImapFolderPostInTypeRef), values)
}

export type ImportImapFolderPostIn = {
	_type: TypeRef<ImportImapFolderPostIn>;
	_errors: Object;

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerGroup: Id;
	path: string;

	imapAccountSyncState: Id;
	mailFolder: IdTuple;
}
export const ImportImapFolderPostOutTypeRef: TypeRef<ImportImapFolderPostOut> = new TypeRef("tutanota", "ImportImapFolderPostOut")

export function createImportImapFolderPostOut(values?: Partial<ImportImapFolderPostOut>): ImportImapFolderPostOut {
	return Object.assign(create(typeModels.ImportImapFolderPostOut, ImportImapFolderPostOutTypeRef), values)
}

export type ImportImapFolderPostOut = {
	_type: TypeRef<ImportImapFolderPostOut>;

	_format: NumberString;

	imapFolderSyncState: IdTuple;
}
export const ImportImapFolderSyncStateTypeRef: TypeRef<ImportImapFolderSyncState> = new TypeRef("tutanota", "ImportImapFolderSyncState")

export function createImportImapFolderSyncState(values?: Partial<ImportImapFolderSyncState>): ImportImapFolderSyncState {
	return Object.assign(create(typeModels.ImportImapFolderSyncState, ImportImapFolderSyncStateTypeRef), values)
}

export type ImportImapFolderSyncState = {
	_type: TypeRef<ImportImapFolderSyncState>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	highestmodseq: null | NumberString;
	path: string;
	uidnext: null | NumberString;
	uidvalidity: null | NumberString;

	importedImapUidToMailIdsMap: Id;
	mailFolder: IdTuple;
}
export const ImportImapPostInTypeRef: TypeRef<ImportImapPostIn> = new TypeRef("tutanota", "ImportImapPostIn")

export function createImportImapPostIn(values?: Partial<ImportImapPostIn>): ImportImapPostIn {
	return Object.assign(create(typeModels.ImportImapPostIn, ImportImapPostInTypeRef), values)
}

export type ImportImapPostIn = {
	_type: TypeRef<ImportImapPostIn>;
	_errors: Object;

	_format: NumberString;
	maxQuota: NumberString;
	ownerEncImapAccountSyncStateSessionKey: Uint8Array;
	ownerGroup: Id;
	postponedUntil: NumberString;

	imapAccount: ImportImapAccount;
	rootImportMailFolder:  null | IdTuple;
}
export const ImportImapPostOutTypeRef: TypeRef<ImportImapPostOut> = new TypeRef("tutanota", "ImportImapPostOut")

export function createImportImapPostOut(values?: Partial<ImportImapPostOut>): ImportImapPostOut {
	return Object.assign(create(typeModels.ImportImapPostOut, ImportImapPostOutTypeRef), values)
}

export type ImportImapPostOut = {
	_type: TypeRef<ImportImapPostOut>;

	_format: NumberString;

	imapAccountSyncState: Id;
}
export const ImportImapUidToMailIdsTypeRef: TypeRef<ImportImapUidToMailIds> = new TypeRef("tutanota", "ImportImapUidToMailIds")

export function createImportImapUidToMailIds(values?: Partial<ImportImapUidToMailIds>): ImportImapUidToMailIds {
	return Object.assign(create(typeModels.ImportImapUidToMailIds, ImportImapUidToMailIdsTypeRef), values)
}

export type ImportImapUidToMailIds = {
	_type: TypeRef<ImportImapUidToMailIds>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	imapModSeq: null | NumberString;
	imapUid: NumberString;

	mail: IdTuple;
}
export const ImportMailDataTypeRef: TypeRef<ImportMailData> = new TypeRef("tutanota", "ImportMailData")

export function createImportMailData(values?: Partial<ImportMailData>): ImportMailData {
	return Object.assign(create(typeModels.ImportMailData, ImportMailDataTypeRef), values)
}

export type ImportMailData = {
	_type: TypeRef<ImportMailData>;

	_id: Id;
	bodyText: string;
	compressedBodyText: null | string;
	compressedHeaders: string;
	confidential: boolean;
	differentEnvelopeSender: null | string;
	inReplyTo: null | string;
	messageId: null | string;
	method: NumberString;
	phishingStatus: NumberString;
	receivedDate: Date;
	replyType: NumberString;
	senderMailAddress: string;
	senderName: string;
	sentDate: Date;
	state: NumberString;
	subject: string;
	unread: boolean;

	bccRecipients: DraftRecipient[];
	ccRecipients: DraftRecipient[];
	importedAttachments: ImportAttachment[];
	references: ImportMailDataMailReference[];
	replyTos: EncryptedMailAddress[];
	toRecipients: DraftRecipient[];
}
export const ImportMailDataMailReferenceTypeRef: TypeRef<ImportMailDataMailReference> = new TypeRef("tutanota", "ImportMailDataMailReference")

export function createImportMailDataMailReference(values?: Partial<ImportMailDataMailReference>): ImportMailDataMailReference {
	return Object.assign(create(typeModels.ImportMailDataMailReference, ImportMailDataMailReferenceTypeRef), values)
}

export type ImportMailDataMailReference = {
	_type: TypeRef<ImportMailDataMailReference>;

	_id: Id;
	reference: string;
}
export const ImportMailPostInTypeRef: TypeRef<ImportMailPostIn> = new TypeRef("tutanota", "ImportMailPostIn")

export function createImportMailPostIn(values?: Partial<ImportMailPostIn>): ImportMailPostIn {
	return Object.assign(create(typeModels.ImportMailPostIn, ImportMailPostInTypeRef), values)
}

export type ImportMailPostIn = {
	_type: TypeRef<ImportMailPostIn>;
	_errors: Object;

	_format: NumberString;
	imapModSeq: null | NumberString;
	imapUid: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerGroup: Id;

	imapFolderSyncState: IdTuple;
	mailData: ImportMailData;
}
export const ImportMailPostOutTypeRef: TypeRef<ImportMailPostOut> = new TypeRef("tutanota", "ImportMailPostOut")

export function createImportMailPostOut(values?: Partial<ImportMailPostOut>): ImportMailPostOut {
	return Object.assign(create(typeModels.ImportMailPostOut, ImportMailPostOutTypeRef), values)
}

export type ImportMailPostOut = {
	_type: TypeRef<ImportMailPostOut>;

	_format: NumberString;

	mail: IdTuple;
}
export const InboxRuleTypeRef: TypeRef<InboxRule> = new TypeRef("tutanota", "InboxRule")

export function createInboxRule(values?: Partial<InboxRule>): InboxRule {
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

export function createInternalGroupData(values?: Partial<InternalGroupData>): InternalGroupData {
	return Object.assign(create(typeModels.InternalGroupData, InternalGroupDataTypeRef), values)
}

export type InternalGroupData = {
	_type: TypeRef<InternalGroupData>;

	_id: Id;
	adminEncGroupKey: Uint8Array;
	groupEncPrivateKey: Uint8Array;
	ownerEncGroupInfoSessionKey: Uint8Array;
	publicKey: Uint8Array;

	adminGroup:  null | Id;
}
export const InternalRecipientKeyDataTypeRef: TypeRef<InternalRecipientKeyData> = new TypeRef("tutanota", "InternalRecipientKeyData")

export function createInternalRecipientKeyData(values?: Partial<InternalRecipientKeyData>): InternalRecipientKeyData {
	return Object.assign(create(typeModels.InternalRecipientKeyData, InternalRecipientKeyDataTypeRef), values)
}

export type InternalRecipientKeyData = {
	_type: TypeRef<InternalRecipientKeyData>;

	_id: Id;
	mailAddress: string;
	pubEncBucketKey: Uint8Array;
	pubKeyVersion: NumberString;
}
export const KnowledgeBaseEntryTypeRef: TypeRef<KnowledgeBaseEntry> = new TypeRef("tutanota", "KnowledgeBaseEntry")

export function createKnowledgeBaseEntry(values?: Partial<KnowledgeBaseEntry>): KnowledgeBaseEntry {
	return Object.assign(create(typeModels.KnowledgeBaseEntry, KnowledgeBaseEntryTypeRef), values)
}

export type KnowledgeBaseEntry = {
	_type: TypeRef<KnowledgeBaseEntry>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	description: string;
	title: string;

	keywords: KnowledgeBaseEntryKeyword[];
}
export const KnowledgeBaseEntryKeywordTypeRef: TypeRef<KnowledgeBaseEntryKeyword> = new TypeRef("tutanota", "KnowledgeBaseEntryKeyword")

export function createKnowledgeBaseEntryKeyword(values?: Partial<KnowledgeBaseEntryKeyword>): KnowledgeBaseEntryKeyword {
	return Object.assign(create(typeModels.KnowledgeBaseEntryKeyword, KnowledgeBaseEntryKeywordTypeRef), values)
}

export type KnowledgeBaseEntryKeyword = {
	_type: TypeRef<KnowledgeBaseEntryKeyword>;

	_id: Id;
	keyword: string;
}
export const ListUnsubscribeDataTypeRef: TypeRef<ListUnsubscribeData> = new TypeRef("tutanota", "ListUnsubscribeData")

export function createListUnsubscribeData(values?: Partial<ListUnsubscribeData>): ListUnsubscribeData {
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

export function createMail(values?: Partial<Mail>): Mail {
	return Object.assign(create(typeModels.Mail, MailTypeRef), values)
}

export type Mail = {
	_type: TypeRef<Mail>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	authStatus: null | NumberString;
	confidential: boolean;
	differentEnvelopeSender: null | string;
	listUnsubscribe: boolean;
	method: NumberString;
	movedTime: null | Date;
	phishingStatus: NumberString;
	receivedDate: Date;
	recipientCount: NumberString;
	replyType: NumberString;
	sentDate: null | Date;
	state: NumberString;
	subject: string;
	unread: boolean;

	attachments: IdTuple[];
	bccRecipients: MailAddress[];
	body:  null | Id;
	bucketKey:  null | BucketKey;
	ccRecipients: MailAddress[];
	conversationEntry: IdTuple;
	firstRecipient:  null | MailAddress;
	headers:  null | Id;
	mailDetails:  null | IdTuple;
	mailDetailsDraft:  null | IdTuple;
	replyTos: EncryptedMailAddress[];
	restrictions:  null | MailRestriction;
	sender: MailAddress;
	toRecipients: MailAddress[];
}
export const MailAddressTypeRef: TypeRef<MailAddress> = new TypeRef("tutanota", "MailAddress")

export function createMailAddress(values?: Partial<MailAddress>): MailAddress {
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

export function createMailAddressProperties(values?: Partial<MailAddressProperties>): MailAddressProperties {
	return Object.assign(create(typeModels.MailAddressProperties, MailAddressPropertiesTypeRef), values)
}

export type MailAddressProperties = {
	_type: TypeRef<MailAddressProperties>;

	_id: Id;
	mailAddress: string;
	senderName: string;
}
export const MailBodyTypeRef: TypeRef<MailBody> = new TypeRef("tutanota", "MailBody")

export function createMailBody(values?: Partial<MailBody>): MailBody {
	return Object.assign(create(typeModels.MailBody, MailBodyTypeRef), values)
}

export type MailBody = {
	_type: TypeRef<MailBody>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: Id;
	_owner: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	compressedText: null | string;
	text: null | string;
}
export const MailBoxTypeRef: TypeRef<MailBox> = new TypeRef("tutanota", "MailBox")

export function createMailBox(values?: Partial<MailBox>): MailBox {
	return Object.assign(create(typeModels.MailBox, MailBoxTypeRef), values)
}

export type MailBox = {
	_type: TypeRef<MailBox>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	lastInfoDate: Date;
	symEncShareBucketKey: null | Uint8Array;

	folders:  null | MailFolderRef;
	mailDetailsDrafts:  null | MailDetailsDraftsRef;
	mails: Id;
	receivedAttachments: Id;
	sentAttachments: Id;
	spamResults:  null | SpamResults;
}
export const MailDetailsTypeRef: TypeRef<MailDetails> = new TypeRef("tutanota", "MailDetails")

export function createMailDetails(values?: Partial<MailDetails>): MailDetails {
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

export function createMailDetailsBlob(values?: Partial<MailDetailsBlob>): MailDetailsBlob {
	return Object.assign(create(typeModels.MailDetailsBlob, MailDetailsBlobTypeRef), values)
}

export type MailDetailsBlob = {
	_type: TypeRef<MailDetailsBlob>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	details: MailDetails;
}
export const MailDetailsDraftTypeRef: TypeRef<MailDetailsDraft> = new TypeRef("tutanota", "MailDetailsDraft")

export function createMailDetailsDraft(values?: Partial<MailDetailsDraft>): MailDetailsDraft {
	return Object.assign(create(typeModels.MailDetailsDraft, MailDetailsDraftTypeRef), values)
}

export type MailDetailsDraft = {
	_type: TypeRef<MailDetailsDraft>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	details: MailDetails;
}
export const MailDetailsDraftsRefTypeRef: TypeRef<MailDetailsDraftsRef> = new TypeRef("tutanota", "MailDetailsDraftsRef")

export function createMailDetailsDraftsRef(values?: Partial<MailDetailsDraftsRef>): MailDetailsDraftsRef {
	return Object.assign(create(typeModels.MailDetailsDraftsRef, MailDetailsDraftsRefTypeRef), values)
}

export type MailDetailsDraftsRef = {
	_type: TypeRef<MailDetailsDraftsRef>;

	_id: Id;

	list: Id;
}
export const MailFolderTypeRef: TypeRef<MailFolder> = new TypeRef("tutanota", "MailFolder")

export function createMailFolder(values?: Partial<MailFolder>): MailFolder {
	return Object.assign(create(typeModels.MailFolder, MailFolderTypeRef), values)
}

export type MailFolder = {
	_type: TypeRef<MailFolder>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	folderType: NumberString;
	name: string;

	mails: Id;
	parentFolder:  null | IdTuple;
	subFolders: Id;
}
export const MailFolderRefTypeRef: TypeRef<MailFolderRef> = new TypeRef("tutanota", "MailFolderRef")

export function createMailFolderRef(values?: Partial<MailFolderRef>): MailFolderRef {
	return Object.assign(create(typeModels.MailFolderRef, MailFolderRefTypeRef), values)
}

export type MailFolderRef = {
	_type: TypeRef<MailFolderRef>;

	_id: Id;

	folders: Id;
}
export const MailHeadersTypeRef: TypeRef<MailHeaders> = new TypeRef("tutanota", "MailHeaders")

export function createMailHeaders(values?: Partial<MailHeaders>): MailHeaders {
	return Object.assign(create(typeModels.MailHeaders, MailHeadersTypeRef), values)
}

export type MailHeaders = {
	_type: TypeRef<MailHeaders>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	compressedHeaders: null | string;
	headers: null | string;
}
export const MailRestrictionTypeRef: TypeRef<MailRestriction> = new TypeRef("tutanota", "MailRestriction")

export function createMailRestriction(values?: Partial<MailRestriction>): MailRestriction {
	return Object.assign(create(typeModels.MailRestriction, MailRestrictionTypeRef), values)
}

export type MailRestriction = {
	_type: TypeRef<MailRestriction>;

	_id: Id;

	delegationGroups_removed: Id[];
	participantGroupInfos: IdTuple[];
}
export const MailboxGroupRootTypeRef: TypeRef<MailboxGroupRoot> = new TypeRef("tutanota", "MailboxGroupRoot")

export function createMailboxGroupRoot(values?: Partial<MailboxGroupRoot>): MailboxGroupRoot {
	return Object.assign(create(typeModels.MailboxGroupRoot, MailboxGroupRootTypeRef), values)
}

export type MailboxGroupRoot = {
	_type: TypeRef<MailboxGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	calendarEventUpdates:  null | CalendarEventUpdateList;
	contactFormUserContactForm:  null | IdTuple;
	imapAccountSyncState:  null | Id;
	mailbox: Id;
	mailboxProperties:  null | Id;
	outOfOfficeNotification:  null | Id;
	outOfOfficeNotificationRecipientList:  null | OutOfOfficeNotificationRecipientList;
	participatingContactForms: IdTuple[];
	serverProperties: Id;
	targetMailGroupContactForm:  null | IdTuple;
	whitelistRequests: Id;
}
export const MailboxPropertiesTypeRef: TypeRef<MailboxProperties> = new TypeRef("tutanota", "MailboxProperties")

export function createMailboxProperties(values?: Partial<MailboxProperties>): MailboxProperties {
	return Object.assign(create(typeModels.MailboxProperties, MailboxPropertiesTypeRef), values)
}

export type MailboxProperties = {
	_type: TypeRef<MailboxProperties>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	reportMovedMails: NumberString;

	mailAddressProperties: MailAddressProperties[];
}
export const MailboxServerPropertiesTypeRef: TypeRef<MailboxServerProperties> = new TypeRef("tutanota", "MailboxServerProperties")

export function createMailboxServerProperties(values?: Partial<MailboxServerProperties>): MailboxServerProperties {
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

export function createMoveMailData(values?: Partial<MoveMailData>): MoveMailData {
	return Object.assign(create(typeModels.MoveMailData, MoveMailDataTypeRef), values)
}

export type MoveMailData = {
	_type: TypeRef<MoveMailData>;

	_format: NumberString;

	mails: IdTuple[];
	targetFolder: IdTuple;
}
export const NewDraftAttachmentTypeRef: TypeRef<NewDraftAttachment> = new TypeRef("tutanota", "NewDraftAttachment")

export function createNewDraftAttachment(values?: Partial<NewDraftAttachment>): NewDraftAttachment {
	return Object.assign(create(typeModels.NewDraftAttachment, NewDraftAttachmentTypeRef), values)
}

export type NewDraftAttachment = {
	_type: TypeRef<NewDraftAttachment>;

	_id: Id;
	encCid: null | Uint8Array;
	encFileName: Uint8Array;
	encMimeType: Uint8Array;

	fileData:  null | Id;
	referenceTokens: BlobReferenceTokenWrapper[];
}
export const NewImportAttachmentTypeRef: TypeRef<NewImportAttachment> = new TypeRef("tutanota", "NewImportAttachment")

export function createNewImportAttachment(values?: Partial<NewImportAttachment>): NewImportAttachment {
	return Object.assign(create(typeModels.NewImportAttachment, NewImportAttachmentTypeRef), values)
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
export const NewsIdTypeRef: TypeRef<NewsId> = new TypeRef("tutanota", "NewsId")

export function createNewsId(values?: Partial<NewsId>): NewsId {
	return Object.assign(create(typeModels.NewsId, NewsIdTypeRef), values)
}

export type NewsId = {
	_type: TypeRef<NewsId>;

	_id: Id;
	newsItemId: Id;
	newsItemName: string;
}
export const NewsInTypeRef: TypeRef<NewsIn> = new TypeRef("tutanota", "NewsIn")

export function createNewsIn(values?: Partial<NewsIn>): NewsIn {
	return Object.assign(create(typeModels.NewsIn, NewsInTypeRef), values)
}

export type NewsIn = {
	_type: TypeRef<NewsIn>;

	_format: NumberString;
	newsItemId: null | Id;
}
export const NewsOutTypeRef: TypeRef<NewsOut> = new TypeRef("tutanota", "NewsOut")

export function createNewsOut(values?: Partial<NewsOut>): NewsOut {
	return Object.assign(create(typeModels.NewsOut, NewsOutTypeRef), values)
}

export type NewsOut = {
	_type: TypeRef<NewsOut>;

	_format: NumberString;

	newsItemIds: NewsId[];
}
export const NotificationMailTypeRef: TypeRef<NotificationMail> = new TypeRef("tutanota", "NotificationMail")

export function createNotificationMail(values?: Partial<NotificationMail>): NotificationMail {
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

export function createOutOfOfficeNotification(values?: Partial<OutOfOfficeNotification>): OutOfOfficeNotification {
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

export function createOutOfOfficeNotificationMessage(values?: Partial<OutOfOfficeNotificationMessage>): OutOfOfficeNotificationMessage {
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

export function createOutOfOfficeNotificationRecipientList(values?: Partial<OutOfOfficeNotificationRecipientList>): OutOfOfficeNotificationRecipientList {
	return Object.assign(create(typeModels.OutOfOfficeNotificationRecipientList, OutOfOfficeNotificationRecipientListTypeRef), values)
}

export type OutOfOfficeNotificationRecipientList = {
	_type: TypeRef<OutOfOfficeNotificationRecipientList>;

	_id: Id;

	list: Id;
}
export const PasswordAutoAuthenticationReturnTypeRef: TypeRef<PasswordAutoAuthenticationReturn> = new TypeRef("tutanota", "PasswordAutoAuthenticationReturn")

export function createPasswordAutoAuthenticationReturn(values?: Partial<PasswordAutoAuthenticationReturn>): PasswordAutoAuthenticationReturn {
	return Object.assign(create(typeModels.PasswordAutoAuthenticationReturn, PasswordAutoAuthenticationReturnTypeRef), values)
}

export type PasswordAutoAuthenticationReturn = {
	_type: TypeRef<PasswordAutoAuthenticationReturn>;

	_format: NumberString;
}
export const PasswordChannelPhoneNumberTypeRef: TypeRef<PasswordChannelPhoneNumber> = new TypeRef("tutanota", "PasswordChannelPhoneNumber")

export function createPasswordChannelPhoneNumber(values?: Partial<PasswordChannelPhoneNumber>): PasswordChannelPhoneNumber {
	return Object.assign(create(typeModels.PasswordChannelPhoneNumber, PasswordChannelPhoneNumberTypeRef), values)
}

export type PasswordChannelPhoneNumber = {
	_type: TypeRef<PasswordChannelPhoneNumber>;

	_id: Id;
	number: string;
}
export const PasswordChannelReturnTypeRef: TypeRef<PasswordChannelReturn> = new TypeRef("tutanota", "PasswordChannelReturn")

export function createPasswordChannelReturn(values?: Partial<PasswordChannelReturn>): PasswordChannelReturn {
	return Object.assign(create(typeModels.PasswordChannelReturn, PasswordChannelReturnTypeRef), values)
}

export type PasswordChannelReturn = {
	_type: TypeRef<PasswordChannelReturn>;

	_format: NumberString;

	phoneNumberChannels: PasswordChannelPhoneNumber[];
}
export const PasswordMessagingDataTypeRef: TypeRef<PasswordMessagingData> = new TypeRef("tutanota", "PasswordMessagingData")

export function createPasswordMessagingData(values?: Partial<PasswordMessagingData>): PasswordMessagingData {
	return Object.assign(create(typeModels.PasswordMessagingData, PasswordMessagingDataTypeRef), values)
}

export type PasswordMessagingData = {
	_type: TypeRef<PasswordMessagingData>;

	_format: NumberString;
	language: string;
	numberId: Id;
	symKeyForPasswordTransmission: Uint8Array;
}
export const PasswordMessagingReturnTypeRef: TypeRef<PasswordMessagingReturn> = new TypeRef("tutanota", "PasswordMessagingReturn")

export function createPasswordMessagingReturn(values?: Partial<PasswordMessagingReturn>): PasswordMessagingReturn {
	return Object.assign(create(typeModels.PasswordMessagingReturn, PasswordMessagingReturnTypeRef), values)
}

export type PasswordMessagingReturn = {
	_type: TypeRef<PasswordMessagingReturn>;

	_format: NumberString;
	autoAuthenticationId: Id;
}
export const PasswordRetrievalDataTypeRef: TypeRef<PasswordRetrievalData> = new TypeRef("tutanota", "PasswordRetrievalData")

export function createPasswordRetrievalData(values?: Partial<PasswordRetrievalData>): PasswordRetrievalData {
	return Object.assign(create(typeModels.PasswordRetrievalData, PasswordRetrievalDataTypeRef), values)
}

export type PasswordRetrievalData = {
	_type: TypeRef<PasswordRetrievalData>;

	_format: NumberString;
	autoAuthenticationId: Id;
}
export const PasswordRetrievalReturnTypeRef: TypeRef<PasswordRetrievalReturn> = new TypeRef("tutanota", "PasswordRetrievalReturn")

export function createPasswordRetrievalReturn(values?: Partial<PasswordRetrievalReturn>): PasswordRetrievalReturn {
	return Object.assign(create(typeModels.PasswordRetrievalReturn, PasswordRetrievalReturnTypeRef), values)
}

export type PasswordRetrievalReturn = {
	_type: TypeRef<PasswordRetrievalReturn>;

	_format: NumberString;
	transmissionKeyEncryptedPassword: string;
}
export const PhishingMarkerTypeRef: TypeRef<PhishingMarker> = new TypeRef("tutanota", "PhishingMarker")

export function createPhishingMarker(values?: Partial<PhishingMarker>): PhishingMarker {
	return Object.assign(create(typeModels.PhishingMarker, PhishingMarkerTypeRef), values)
}

export type PhishingMarker = {
	_type: TypeRef<PhishingMarker>;

	_id: Id;
	marker: string;
	status: NumberString;
}
export const PhishingMarkerWebsocketDataTypeRef: TypeRef<PhishingMarkerWebsocketData> = new TypeRef("tutanota", "PhishingMarkerWebsocketData")

export function createPhishingMarkerWebsocketData(values?: Partial<PhishingMarkerWebsocketData>): PhishingMarkerWebsocketData {
	return Object.assign(create(typeModels.PhishingMarkerWebsocketData, PhishingMarkerWebsocketDataTypeRef), values)
}

export type PhishingMarkerWebsocketData = {
	_type: TypeRef<PhishingMarkerWebsocketData>;

	_format: NumberString;
	lastId: Id;

	markers: PhishingMarker[];
}
export const PhotosRefTypeRef: TypeRef<PhotosRef> = new TypeRef("tutanota", "PhotosRef")

export function createPhotosRef(values?: Partial<PhotosRef>): PhotosRef {
	return Object.assign(create(typeModels.PhotosRef, PhotosRefTypeRef), values)
}

export type PhotosRef = {
	_type: TypeRef<PhotosRef>;

	_id: Id;

	files: Id;
}
export const ReceiveInfoServiceDataTypeRef: TypeRef<ReceiveInfoServiceData> = new TypeRef("tutanota", "ReceiveInfoServiceData")

export function createReceiveInfoServiceData(values?: Partial<ReceiveInfoServiceData>): ReceiveInfoServiceData {
	return Object.assign(create(typeModels.ReceiveInfoServiceData, ReceiveInfoServiceDataTypeRef), values)
}

export type ReceiveInfoServiceData = {
	_type: TypeRef<ReceiveInfoServiceData>;

	_format: NumberString;
	language: string;
}
export const RecipientsTypeRef: TypeRef<Recipients> = new TypeRef("tutanota", "Recipients")

export function createRecipients(values?: Partial<Recipients>): Recipients {
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

export function createRemoteImapSyncInfo(values?: Partial<RemoteImapSyncInfo>): RemoteImapSyncInfo {
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

export function createReportMailPostData(values?: Partial<ReportMailPostData>): ReportMailPostData {
	return Object.assign(create(typeModels.ReportMailPostData, ReportMailPostDataTypeRef), values)
}

export type ReportMailPostData = {
	_type: TypeRef<ReportMailPostData>;

	_format: NumberString;
	mailSessionKey: Uint8Array;
	reportType: NumberString;

	mailId: IdTuple;
}
export const SecureExternalRecipientKeyDataTypeRef: TypeRef<SecureExternalRecipientKeyData> = new TypeRef("tutanota", "SecureExternalRecipientKeyData")

export function createSecureExternalRecipientKeyData(values?: Partial<SecureExternalRecipientKeyData>): SecureExternalRecipientKeyData {
	return Object.assign(create(typeModels.SecureExternalRecipientKeyData, SecureExternalRecipientKeyDataTypeRef), values)
}

export type SecureExternalRecipientKeyData = {
	_type: TypeRef<SecureExternalRecipientKeyData>;

	_id: Id;
	autoTransmitPassword: null | string;
	mailAddress: string;
	ownerEncBucketKey: null | Uint8Array;
	passwordVerifier: Uint8Array;
	pwEncCommunicationKey: null | Uint8Array;
	salt: null | Uint8Array;
	saltHash: null | Uint8Array;
	symEncBucketKey: null | Uint8Array;

	passwordChannelPhoneNumbers: PasswordChannelPhoneNumber[];
}
export const SendDraftDataTypeRef: TypeRef<SendDraftData> = new TypeRef("tutanota", "SendDraftData")

export function createSendDraftData(values?: Partial<SendDraftData>): SendDraftData {
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

	attachmentKeyData: AttachmentKeyData[];
	internalRecipientKeyData: InternalRecipientKeyData[];
	mail: IdTuple;
	secureExternalRecipientKeyData: SecureExternalRecipientKeyData[];
}
export const SendDraftReturnTypeRef: TypeRef<SendDraftReturn> = new TypeRef("tutanota", "SendDraftReturn")

export function createSendDraftReturn(values?: Partial<SendDraftReturn>): SendDraftReturn {
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

export function createSharedGroupData(values?: Partial<SharedGroupData>): SharedGroupData {
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
}
export const SpamResultsTypeRef: TypeRef<SpamResults> = new TypeRef("tutanota", "SpamResults")

export function createSpamResults(values?: Partial<SpamResults>): SpamResults {
	return Object.assign(create(typeModels.SpamResults, SpamResultsTypeRef), values)
}

export type SpamResults = {
	_type: TypeRef<SpamResults>;

	_id: Id;

	list: Id;
}
export const SubfilesTypeRef: TypeRef<Subfiles> = new TypeRef("tutanota", "Subfiles")

export function createSubfiles(values?: Partial<Subfiles>): Subfiles {
	return Object.assign(create(typeModels.Subfiles, SubfilesTypeRef), values)
}

export type Subfiles = {
	_type: TypeRef<Subfiles>;

	_id: Id;

	files: Id;
}
export const TemplateGroupRootTypeRef: TypeRef<TemplateGroupRoot> = new TypeRef("tutanota", "TemplateGroupRoot")

export function createTemplateGroupRoot(values?: Partial<TemplateGroupRoot>): TemplateGroupRoot {
	return Object.assign(create(typeModels.TemplateGroupRoot, TemplateGroupRootTypeRef), values)
}

export type TemplateGroupRoot = {
	_type: TypeRef<TemplateGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	knowledgeBase: Id;
	templates: Id;
}
export const TutanotaPropertiesTypeRef: TypeRef<TutanotaProperties> = new TypeRef("tutanota", "TutanotaProperties")

export function createTutanotaProperties(values?: Partial<TutanotaProperties>): TutanotaProperties {
	return Object.assign(create(typeModels.TutanotaProperties, TutanotaPropertiesTypeRef), values)
}

export type TutanotaProperties = {
	_type: TypeRef<TutanotaProperties>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	customEmailSignature: string;
	defaultSender: null | string;
	defaultUnconfidential: boolean;
	emailSignatureType: NumberString;
	groupEncEntropy: null | Uint8Array;
	lastSeenAnnouncement: NumberString;
	noAutomaticContacts: boolean;
	notificationMailLanguage: null | string;
	sendPlaintextOnly: boolean;

	imapSyncConfig: ImapSyncConfiguration[];
	inboxRules: InboxRule[];
	lastPushedMail:  null | IdTuple;
}
export const UpdateMailFolderDataTypeRef: TypeRef<UpdateMailFolderData> = new TypeRef("tutanota", "UpdateMailFolderData")

export function createUpdateMailFolderData(values?: Partial<UpdateMailFolderData>): UpdateMailFolderData {
	return Object.assign(create(typeModels.UpdateMailFolderData, UpdateMailFolderDataTypeRef), values)
}

export type UpdateMailFolderData = {
	_type: TypeRef<UpdateMailFolderData>;

	_format: NumberString;

	folder: IdTuple;
	newParent:  null | IdTuple;
}
export const UserAccountCreateDataTypeRef: TypeRef<UserAccountCreateData> = new TypeRef("tutanota", "UserAccountCreateData")

export function createUserAccountCreateData(values?: Partial<UserAccountCreateData>): UserAccountCreateData {
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

export function createUserAccountUserData(values?: Partial<UserAccountUserData>): UserAccountUserData {
	return Object.assign(create(typeModels.UserAccountUserData, UserAccountUserDataTypeRef), values)
}

export type UserAccountUserData = {
	_type: TypeRef<UserAccountUserData>;

	_id: Id;
	contactEncContactListSessionKey: Uint8Array;
	customerEncContactGroupInfoSessionKey: Uint8Array;
	customerEncFileGroupInfoSessionKey: Uint8Array;
	customerEncMailGroupInfoSessionKey: Uint8Array;
	encryptedName: Uint8Array;
	fileEncFileSystemSessionKey: Uint8Array;
	mailAddress: string;
	mailEncMailBoxSessionKey: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	recoverCodeEncUserGroupKey: Uint8Array;
	recoverCodeVerifier: Uint8Array;
	salt: Uint8Array;
	userEncClientKey: Uint8Array;
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

export function createUserAreaGroupData(values?: Partial<UserAreaGroupData>): UserAreaGroupData {
	return Object.assign(create(typeModels.UserAreaGroupData, UserAreaGroupDataTypeRef), values)
}

export type UserAreaGroupData = {
	_type: TypeRef<UserAreaGroupData>;

	_id: Id;
	adminEncGroupKey: null | Uint8Array;
	customerEncGroupInfoSessionKey: Uint8Array;
	groupEncGroupRootSessionKey: Uint8Array;
	groupInfoEncName: Uint8Array;
	userEncGroupKey: Uint8Array;

	adminGroup:  null | Id;
}
export const UserAreaGroupDeleteDataTypeRef: TypeRef<UserAreaGroupDeleteData> = new TypeRef("tutanota", "UserAreaGroupDeleteData")

export function createUserAreaGroupDeleteData(values?: Partial<UserAreaGroupDeleteData>): UserAreaGroupDeleteData {
	return Object.assign(create(typeModels.UserAreaGroupDeleteData, UserAreaGroupDeleteDataTypeRef), values)
}

export type UserAreaGroupDeleteData = {
	_type: TypeRef<UserAreaGroupDeleteData>;

	_format: NumberString;

	group: Id;
}
export const UserAreaGroupPostDataTypeRef: TypeRef<UserAreaGroupPostData> = new TypeRef("tutanota", "UserAreaGroupPostData")

export function createUserAreaGroupPostData(values?: Partial<UserAreaGroupPostData>): UserAreaGroupPostData {
	return Object.assign(create(typeModels.UserAreaGroupPostData, UserAreaGroupPostDataTypeRef), values)
}

export type UserAreaGroupPostData = {
	_type: TypeRef<UserAreaGroupPostData>;

	_format: NumberString;

	groupData: UserAreaGroupData;
}
export const UserSettingsGroupRootTypeRef: TypeRef<UserSettingsGroupRoot> = new TypeRef("tutanota", "UserSettingsGroupRoot")

export function createUserSettingsGroupRoot(values?: Partial<UserSettingsGroupRoot>): UserSettingsGroupRoot {
	return Object.assign(create(typeModels.UserSettingsGroupRoot, UserSettingsGroupRootTypeRef), values)
}

export type UserSettingsGroupRoot = {
	_type: TypeRef<UserSettingsGroupRoot>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	startOfTheWeek: NumberString;
	timeFormat: NumberString;
	usageDataOptedIn: null | boolean;

	groupSettings: GroupSettings[];
}
