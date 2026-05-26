import { PresentableKeyVerificationState, ProgrammingError, TimeFormat } from "../../platform-kits/app-env"
import { isSameTypeRef } from "../../platform-kits/meta"
import { downcast } from "../../platform-kits/utils"
import { Contact, File, FileTypeRef, UserSettingsGroupRoot } from "./TypeRefs"
import { DataFile } from "./MailBundle"

export const MAX_NBR_OF_MAILS_SYNC_OPERATION = 50
export const MAX_NBR_OF_CONVERSATIONS = 50

export const enum OutOfOfficeNotificationMessageType {
	Default = "0",
	InsideOrganization = "1",
}

export const OUT_OF_OFFICE_SUBJECT_PREFIX = "Auto-reply: "

export enum MailSetKind {
	CUSTOM = "0",
	INBOX = "1",
	SENT = "2",
	TRASH = "3",
	ARCHIVE = "4",
	SPAM = "5",
	DRAFT = "6",
	ALL = "7",
	LABEL = "8",
	IMPORTED = "9",
	SCHEDULED = "10",
}

export const SYSTEM_FOLDERS = [
	MailSetKind.INBOX,
	MailSetKind.SENT,
	MailSetKind.TRASH,
	MailSetKind.ARCHIVE,
	MailSetKind.SPAM,
	MailSetKind.DRAFT,
	MailSetKind.SCHEDULED,
] as const
export type SystemFolderType = (typeof SYSTEM_FOLDERS)[number]

export const enum ReplyType {
	NONE = "0",
	REPLY = "1",
	FORWARD = "2",
	REPLY_FORWARD = "3",
}

/** Mirrored in ContactEnums.kt and StructuredContactTypes.swift (must be kept in sync) */
export const enum ContactAddressType {
	PRIVATE = "0",
	WORK = "1",
	OTHER = "2",
	CUSTOM = "3",
}

/** Mirrored in ContactEnums.kt and StructuredContactTypes.swift (must be kept in sync) */
export const enum ContactPhoneNumberType {
	PRIVATE = "0",
	WORK = "1",
	MOBILE = "2",
	FAX = "3",
	OTHER = "4",
	CUSTOM = "5",
}

export enum ContactSocialType {
	TWITTER = "0",
	FACEBOOK = "1",
	XING = "2",
	LINKED_IN = "3",
	BLUESKY = "4",
	FEDIVERSE = "5",
	OTHER = "6",
	CUSTOM = "7",
}

/** Mirrored in ContactEnums.kt and StructuredContactTypes.swift (must be kept in sync) */
export const enum ContactRelationshipType {
	PARENT = "0",
	BROTHER = "1",
	SISTER = "2",
	CHILD = "3",
	FRIEND = "4",
	RELATIVE = "5",
	SPOUSE = "6",
	PARTNER = "7",
	ASSISTANT = "8",
	MANAGER = "9",
	OTHER = "10",
	CUSTOM = "11",
}

/** Mirrored in ContactEnums.kt and StructuredContactTypes.swift (must be kept in sync) */
export const enum ContactMessengerHandleType {
	SIGNAL = "0",
	WHATSAPP = "1",
	TELEGRAM = "2",
	DISCORD = "3",
	MATRIX = "4",
	OTHER = "5",
	CUSTOM = "6",
}

/** Mirrored in ContactEnums.kt and StructuredContactTypes.swift (must be kept in sync) */
export const enum ContactWebsiteType {
	PRIVATE = "0",
	WORK = "1",
	OTHER = "2",
	CUSTOM = "3",
}

/** Mirrored in ContactEnums.kt and StructuredContactTypes.swift (must be kept in sync) */
export const enum ContactCustomDateType {
	ANNIVERSARY = "0",
	OTHER = "1",
	CUSTOM = "2",
}

export const enum ConversationType {
	NEW = "0",
	REPLY = "1",
	FORWARD = "2",
	/**  a message for which no mail exists in Tuta (unknown external mail or deleted mail) */
	UNKNOWN = "3",
}

export const enum MailState {
	/** BEWARE: mails queued to be sent have a state of SENDING _before_ mail details is stored as a blob */
	DRAFT = "0",
	SENT = "1",
	RECEIVED = "2",
	SENDING = "3",
}

export const enum InboxRuleType {
	FROM_EQUALS = "0",
	RECIPIENT_TO_EQUALS = "1",
	RECIPIENT_CC_EQUALS = "2",
	RECIPIENT_BCC_EQUALS = "3",
	SUBJECT_CONTAINS = "4",
	MAIL_HEADER_CONTAINS = "5",
}

export enum SpamRuleType {
	WHITELIST = "1",
	BLACKLIST = "2",
	DISCARD = "3",
}

export const enum SpamRuleFieldType {
	FROM = "0",
	TO = "1",
	CC = "2",
	BCC = "3",
}

export const enum ReportMovedMailsType {
	ALWAYS_ASK = "0",
	AUTOMATICALLY_ONLY_SPAM = "1",
	NEVER = "3",
}

export const enum EmailSignatureType {
	EMAIL_SIGNATURE_TYPE_DEFAULT = "0",
	EMAIL_SIGNATURE_TYPE_CUSTOM = "1",
	EMAIL_SIGNATURE_TYPE_NONE = "2",
}

export const MAX_ATTACHMENT_SIZE = 1024 * 1024 * 25

// Keep non-const for admin
export enum ReportedMailFieldType {
	/**
	 * From header address, authenticated.
	 */
	FROM_ADDRESS = "0",

	/**
	 * From header address, not authenticated with DMARC.
	 */
	FROM_ADDRESS_NON_AUTH = "1",

	/**
	 * From header address domain
	 */
	FROM_DOMAIN = "2",

	/**
	 * From header address domain, not authenticated not authenticated with DMARC.
	 */
	FROM_DOMAIN_NON_AUTH = "3",

	/**
	 * Email subject
	 */
	SUBJECT = "4",

	/**
	 * Link in the body of email
	 */
	LINK = "5",

	/**
	 * Domain of the link in the body
	 */
	LINK_DOMAIN = "6",
}

export const enum MailPhishingStatus {
	UNKNOWN = "0",
	SUSPICIOUS = "1",
	WHITELISTED = "2",
}

export const enum PhishingMarkerStatus {
	ACTIVE = "0",
	INACTIVE = "1",
}

export const enum MailReportType {
	PHISHING = "0",
	SPAM = "1",
}

export enum CalendarAttendeeStatus {
	/** invite is not sent yet */
	ADDED = "0",

	/** already invited but did not respond */
	NEEDS_ACTION = "1",
	ACCEPTED = "2",
	DECLINED = "3",
	TENTATIVE = "4",
}

export enum CalendarMethod {
	PUBLISH = "PUBLISH",
	REQUEST = "REQUEST",
	REPLY = "REPLY",
	ADD = "ADD",
	CANCEL = "CANCEL",
	REFRESH = "REFRESH",
	COUNTER = "COUNTER",
	DECLINECOUNTER = "DECLINECOUNTER",
}

export const enum MailMethod {
	NONE = "0",
	ICAL_PUBLISH = "1",
	ICAL_REQUEST = "2",
	ICAL_REPLY = "3",
	ICAL_ADD = "4",
	ICAL_CANCEL = "5",
	ICAL_REFRESH = "6",
	ICAL_COUNTER = "7",
	ICAL_DECLINECOUNTER = "8",
}

export function mailMethodToCalendarMethod(mailMethod: MailMethod): CalendarMethod {
	switch (mailMethod) {
		case MailMethod.ICAL_PUBLISH:
			return CalendarMethod.PUBLISH
		case MailMethod.ICAL_REQUEST:
			return CalendarMethod.REQUEST
		case MailMethod.ICAL_REPLY:
			return CalendarMethod.REPLY
		case MailMethod.ICAL_ADD:
			return CalendarMethod.ADD
		case MailMethod.ICAL_CANCEL:
			return CalendarMethod.CANCEL
		case MailMethod.ICAL_REFRESH:
			return CalendarMethod.REFRESH
		case MailMethod.ICAL_COUNTER:
			return CalendarMethod.COUNTER
		case MailMethod.ICAL_DECLINECOUNTER:
			return CalendarMethod.DECLINECOUNTER
		default:
			throw new ProgrammingError("Unhandled MailMethod: " + mailMethod)
	}
}

export const enum ExternalImageRule {
	None = "0",
	Allow = "1",
	Block = "2",
}

export const enum NewsletterBannerRule {
	Allow = "0",
	Block = "1",
}

export const enum ImportStatus {
	Running = 0,
	Paused = 1,
	Canceled = 2,
	Finished = 3,
}

export enum SpamDecision {
	NONE = "0",
	WHITELIST = "1",
	BLACKLIST = "2",
	DISCARD = "3",
}

export enum ProcessingState {
	INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_MADE = "0",
	INBOX_RULE_NOT_PROCESSED = "1",
	INBOX_RULE_APPLIED = "2",
	INBOX_RULE_PROCESSED_AND_SPAM_PREDICTION_PENDING = "3",
	INBOX_RULE_NOT_PROCESSED_AND_DO_NOT_RUN_SPAM_PREDICTION = "4",
}

export type MailboxExportState =
	| {
			type: "running"
			userId: Id
			mailboxId: Id
			exportDirectoryPath: string
			mailBagId: Id
			mailId: Id
			exportedMails: number
			failedCount: number
			failedMailIds: IdTuple[]
	  }
	| {
			type: "finished"
			userId: Id
			mailboxId: Id
			exportDirectoryPath: string
			failedCount: number
			failedMailIds: IdTuple[]
	  }
	| {
			type: "locked"
			userId: Id
	  }

// .msg export is handled in DesktopFileExport because it uses APIs that can't be loaded web side
export type MailExportMode = "msg" | "eml"

/**
 * a reference by path to a file on disk
 */
export interface FileReference {
	readonly _type: "FileReference"
	name: string
	mimeType: string
	location: string
	size: number
	cid?: string
}

export type Attachment = File | DataFile | FileReference

export const enum RecipientType {
	UNKNOWN = "unknown",
	INTERNAL = "internal",
	EXTERNAL = "external",
}

export interface Recipient {
	readonly address: string
	readonly name: string
	readonly type: RecipientType
	readonly contact: Contact | null
	readonly verificationState: PresentableKeyVerificationState
}

/**
 * A more convenient representation of a recipient,
 * For when you don't have all the recipient data yet
 * Generally should be used as an input, rather than as an output
 */
export interface PartialRecipient {
	address: string
	name?: string | None
	type?: RecipientType | None
	contact?: Contact | IdTuple | None
}

export type RecipientList = Array<PartialRecipient>
/**
 * A collection of recipients
 * When it's a single list, will generally be interpreted as "to" recipients
 */
export type VerificationRecipients =
	| {
			to?: RecipientList
			cc?: RecipientList
			bcc?: RecipientList
	  }
	| RecipientList

export function isTutanotaFile(file: Attachment): file is File {
	return (
		file._type &&
		typeof file._type === "object" &&
		Object.hasOwn(file._type, "app") &&
		Object.hasOwn(file._type, "typeId") &&
		isSameTypeRef(downcast(file._type), FileTypeRef)
	)
}

export function isDataFile(file: Attachment): file is DataFile {
	return file._type === "DataFile"
}

export function assertOnlyDataFiles(files: Array<Attachment>): asserts files is Array<DataFile> {
	if (files.some((f) => !isDataFile(f))) throw new TypeError("not only DataFiles")
}

export function isFileReference(file: Attachment | WebFile): file is FileReference {
	return file._type === "FileReference"
}

export function assertOnlyFileReferences(files: Array<Attachment>): asserts files is Array<FileReference> {
	if (files.some((f) => !isFileReference(f))) throw new TypeError("not only FileReference")
}

export interface WebFile {
	readonly _type: "WebFile"
	file: globalThis.File
}

export function getHourCycle(userSettings: UserSettingsGroupRoot): "h12" | "h23" {
	return userSettings.timeFormat === TimeFormat.TWELVE_HOURS ? "h12" : "h23"
}