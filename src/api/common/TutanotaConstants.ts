//@bundleInto:common-min

import { downcast } from "@tutao/tutanota-utils"
import type { CertificateInfo, CreditCard, EmailSenderListElement, GroupMembership } from "../entities/sys/TypeRefs.js"
import { AccountingInfo, Customer } from "../entities/sys/TypeRefs.js"
import type { CalendarEventAttendee, UserSettingsGroupRoot } from "../entities/tutanota/TypeRefs.js"
import { ContactSocialId, MailFolder } from "../entities/tutanota/TypeRefs.js"
import { isApp, isElectronClient } from "./Env"
import type { Country } from "./CountryList"
import { ProgrammingError } from "./error/ProgrammingError"

export const MAX_NBR_MOVE_DELETE_MAIL_SERVICE = 50

// visible for testing
export const MAX_BLOB_SIZE_BYTES = 1024 * 1024 * 10
export const REQUEST_SIZE_LIMIT_DEFAULT = 1024 * 1024
export const REQUEST_SIZE_LIMIT_MAP: Map<string, number> = new Map([
	["/rest/storage/blobservice", MAX_BLOB_SIZE_BYTES + 100], // overhead for encryption
	["/rest/tutanota/filedataservice", 1024 * 1024 * 25],
	["/rest/tutanota/draftservice", 1024 * 1024], // should be large enough
])

export const getMailFolderType = (folder: MailFolder): MailFolderType => downcast(folder.folderType)

type ObjectPropertyKey = string | number | symbol
export const reverse = <K extends ObjectPropertyKey, V extends ObjectPropertyKey>(objectMap: Record<K, V>): Record<V, K> =>
	Object.keys(objectMap).reduce((r, k) => {
		// @ts-ignore
		const v = objectMap[downcast(k)]
		return Object.assign(r, { [v]: k })
	}, {} as Record<V, K>)

export const enum OutOfOfficeNotificationMessageType {
	Default = "0",
	InsideOrganization = "1",
}

export const OUT_OF_OFFICE_SUBJECT_PREFIX = "Auto-reply: "

export enum GroupType {
	User = "0",
	Admin = "1",
	MailingList = "2",
	Customer = "3",
	External = "4",
	Mail = "5",
	Contact = "6",
	File = "7",
	LocalAdmin = "8",
	Calendar = "9",
	Template = "10",
}

export const GroupTypeNameByCode = reverse(GroupType)

export const getMembershipGroupType = (membership: GroupMembership): GroupType => downcast(membership.groupType)

/**
 * Permission is a kind of a metadata instance. Primarily used for two purposes:
 *  - key sharing
 *  - reference counting in the db
 * */
export const enum PermissionType {
	/** Used in combination with bucket permission to send multiple things encrypted with the same public key. */
	Public = "0",
	/** Used to encrypt an instance for another group (which we are member of). */
	Symmetric = "1",
	/** Used to updating public permission with symmetric key. */
	Public_Symmetric = "2",
	/** Instances without ownerEncSessionKey (e.g. MailBody, FileData) after asymmetric decryption, used for reference counting. */
	Unencrypted = "3",
	/** Sending parts of email for external users. */
	External = "5",
	/** Used to mark the owner of the list. */
	Owner_List = "8",
}

export const enum BucketPermissionType {
	Public = "2",
	External = "3",
}

export enum MailFolderType {
	CUSTOM = "0",
	INBOX = "1",
	SENT = "2",
	TRASH = "3",
	ARCHIVE = "4",
	SPAM = "5",
	DRAFT = "6",
}

export const enum ReplyType {
	NONE = "0",
	REPLY = "1",
	FORWARD = "2",
	REPLY_FORWARD = "3",
}

export const enum ContactAddressType {
	PRIVATE = "0",
	WORK = "1",
	OTHER = "2",
	CUSTOM = "3",
}

export const enum ContactPhoneNumberType {
	PRIVATE = "0",
	WORK = "1",
	MOBILE = "2",
	FAX = "3",
	OTHER = "4",
	CUSTOM = "5",
}

export const enum ContactSocialType {
	TWITTER = "0",
	FACEBOOK = "1",
	XING = "2",
	LINKED_IN = "3",
	OTHER = "4",
	CUSTOM = "5",
}

export const getContactSocialType = (contactSocialId: ContactSocialId): ContactSocialType => downcast(contactSocialId.type)

export const enum OperationType {
	CREATE = "0",
	UPDATE = "1",
	DELETE = "2",
}

export enum AccountType {
	SYSTEM = "0",
	FREE = "1",
	STARTER = "2",
	PREMIUM = "3",
	EXTERNAL = "5",
}

export const AccountTypeNames: Record<AccountType, string> = {
	[AccountType.SYSTEM]: "System",
	[AccountType.FREE]: "Free",
	[AccountType.STARTER]: "Outlook",
	[AccountType.PREMIUM]: "Premium",
	[AccountType.EXTERNAL]: "External",
}

export const enum PaidSubscriptionType {
	Premium = "0",
	Legacy_Pro = "1",
	Pro = "2",
	Teams = "3",
	Premium_Business = "4",
	Teams_Business = "5",
}

export enum BookingItemFeatureType {
	Users = "0",
	Storage = "1",
	Alias = "2",
	SharedMailGroup = "3",
	Whitelabel = "4",
	ContactForm = "5",
	WhitelabelChild = "6",
	LocalAdminGroup = "7",
	Discount = "8",
	Sharing = "9",
	Business = "10",
}

export const BookingItemFeatureByCode = reverse(BookingItemFeatureType)
export const getPaymentMethodType = (accountingInfo: AccountingInfo): PaymentMethodType => downcast<PaymentMethodType>(accountingInfo.paymentMethod)

export enum PaymentMethodType {
	Invoice = "0",
	CreditCard = "1",
	Sepa = "2",
	Paypal = "3",
	AccountBalance = "4",
}

export const PaymentMethodTypeToName = reverse(PaymentMethodType)

export const Const = {
	UPGRADE_REMINDER_INTERVAL: 14 * 24 * 60 * 60 * 1000,
	MEMORY_GB_FACTOR: 1000000000,
	MEMORY_WARNING_FACTOR: 0.9,
	COUNTER_USED_MEMORY_INTERNAL: "UsedMemoryInternalNew",
	COUNTER_USED_MEMORY_EXTERNAL: "UsedMemoryExternalNew",
	COUNTER_USED_MEMORY: "UsedMemoryNew",
	// Sets the current date for testing date dependent services. Only available in test environments.
	CURRENT_DATE: null,
	CURRENCY_SYMBOL_EUR: "€",
} as const

export const TUTANOTA_MAIL_ADDRESS_DOMAINS = ["tutanota.com", "tutanota.de", "tutamail.com", "tuta.io", "keemail.me"]

export const enum ConversationType {
	NEW = "0",
	REPLY = "1",
	FORWARD = "2",
	/**  a message for which no mail exists in Tutanota (unknown external mail or deleted mail) */
	UNKNOWN = "3",
}

export const enum MailState {
	DRAFT = "0",
	SENT = "1",
	RECEIVED = "2",
	SENDING = "3",
}

// Keep non-const for admin
export enum ApprovalStatus {
	REGISTRATION_APPROVED = "0",
	REGISTRATION_APPROVAL_NEEDED = "1",
	SEND_MAILS_APPROVED = "2",
	INVOICE_NOT_PAID = "3",
	SPAM_SENDER = "4",
	DELAYED = "5",
	DELAYED_AND_INITIALLY_ACCESSED = "6",
	REGISTRATION_APPROVAL_NEEDED_AND_INITIALLY_ACCESSED = "7",
	PAID_SUBSCRIPTION_NEEDED = "8",
	INITIAL_PAYMENT_PENDING = "9",
	NO_ACTIVITY = "10",
}

export function getCustomerApprovalStatus(customer: Customer): ApprovalStatus {
	return downcast(customer.approvalStatus)
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

export function getSpamRuleType(spamRule: EmailSenderListElement): SpamRuleType | null {
	return getAsEnumValue(SpamRuleType, spamRule.type)
}

export const enum SpamRuleFieldType {
	FROM = "0",
	TO = "1",
	CC = "2",
	BCC = "3",
}

export function getSpamRuleField(spamRule: EmailSenderListElement): SpamRuleFieldType {
	return downcast(spamRule.field)
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

export enum CustomDomainValidationResult {
	CUSTOM_DOMAIN_VALIDATION_RESULT_OK = "0",
	CUSTOM_DOMAIN_VALIDATION_RESULT_DNS_LOOKUP_FAILED = "1",
	CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_FOUND = "2",
	CUSTOM_DOMAIN_VALIDATION_RESULT_NAMESERVER_NOT_FOUND = "3",
	CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE = "4",
	CUSTOM_DOMAIN_VALIDATION_RESULT_VALIDATION_FAILED = "5",
}

export enum CustomDomainCheckResult {
	CUSTOM_DOMAIN_CHECK_RESULT_OK = "0",
	CUSTOM_DOMAIN_CHECK_RESULT_DNS_LOOKUP_FAILED = "1",
	CUSTOM_DOMAIN_CHECK_RESULT_DOMAIN_NOT_FOUND = "2",
	CUSTOM_DOMAIN_CHECK_RESULT_NAMESERVER_NOT_FOUND = "3",
}

export const enum DnsRecordType {
	DNS_RECORD_TYPE_MX = "0",
	DNS_RECORD_TYPE_TXT_SPF = "1",
	DNS_RECORD_TYPE_CNAME_DKIM = "2",
	DNS_RECORD_TYPE_TXT_DMARC = "3",
	DNS_RECORD_TYPE_CNAME_MTA_STS = "4",
	DNS_RECORD_TYPE_TXT_VERIFY = "5",
}

export const enum SessionState {
	SESSION_STATE_ACTIVE = "0",
	SESSION_STATE_EXPIRED = "1",
	SESSION_STATE_DELETED = "2",
	SESSION_STATE_PENDING = "3",
}

export const enum PushServiceType {
	ANDROID = "0",
	IOS = "1",
	EMAIL = "2",
	SSE = "3",
}

export const enum InputFieldType {
	TEXT = "0",
	NUMBER = "1",
	ENUM = "2",
}

export enum SecondFactorType {
	u2f = "0",
	totp = "1",
	webauthn = "2",
}

export const SecondFactorTypeNames = ["U2F", "TOTP"]
export const MAX_ATTACHMENT_SIZE = 1024 * 1024 * 25
export const MAX_LOGO_SIZE = 1024 * 100
export const MAX_BASE64_IMAGE_SIZE = MAX_LOGO_SIZE
export const ALLOWED_IMAGE_FORMATS = ["png", "jpg", "jpeg", "svg"]

// Keep non-const for admin
export enum FeatureType {
	DisableContacts = "0",
	DisableMailExport = "1",
	InternalCommunication = "2",
	DeleteMailsOnPasswordReset = "3",
	WhitelabelParent = "4",
	WhitelabelChild = "5",
	ReplyOnly = "6",
	DisableDefaultSignature = "7",
	HideBuyDialogs = "8",
	DisableCalendar = "9",
	ExternalEmailProvider = "10",

	/** This is required for non admin users because they are not allowed to access the bookings. */
	BusinessFeatureEnabled = "11",
	PremiumLegacy = "12",
	KnowledgeBase = "13",
	Newsletter = "14",
	Blobs = "15", // enables blob attachments for mails
	MailDetails = "16", // enable new mail model support
}

export const enum BootstrapFeatureType {
	DisableSavePassword = "0",
}

export const FULL_INDEXED_TIMESTAMP: number = 0
export const NOTHING_INDEXED_TIMESTAMP: number = Math.pow(2, 42) - 1 // maximum Timestamp is 42 bit long (see GeneratedIdData.java)

export const ENTITY_EVENT_BATCH_TTL_DAYS: number = 45 // 45 days (see InstanceDbMapperEventNotifier.java)

export const enum PaymentDataResultType {
	OK = "0",
	COUNTRY_MISMATCH = "1",
	INVALID_VATID_NUMBER = "2",
	CREDIT_CARD_DECLINED = "3",
	CREDIT_CARD_CVV_INVALID = "4",
	PAYMENT_PROVIDER_NOT_AVAILABLE = "5",
	OTHER_PAYMENT_PROVIDER_ERROR = "6",
	OTHER_PAYMENT_ACCOUNT_REJECTED = "7",
	COULD_NOT_VERIFY_VATID = "8",
	CREDIT_CARD_DATE_INVALID = "9",
	CREDIT_CARD_NUMBER_INVALID = "10",
	CREDIT_CARD_VERIFICATION_LIMIT_REACHED = "11",
}

export const enum ContactComparisonResult {
	Unique = "unique",
	Similar = "similar",
	Equal = "equal",
}

export const enum IndifferentContactComparisonResult {
	OneEmpty = "oneEmpty",
	BothEmpty = "bothEmpty",
}

export const enum ContactMergeAction {
	DeleteFirst = "deleteFirst",
	DeleteSecond = "deleteSecond",
	Merge = "merge",
	Skip = "skip",
	Cancel = "cancel",
}

export const enum InvoiceStatus {
	CREATED = "0",
	PUBLISHEDFORAUTOMATIC = "1",
	PUBLISHEDFORMANUAL = "2",
	PAID = "3",
	DEBITFAILED = "4",
	DISPUTED = "5",
	CANCELLED = "6",
	PARTNERMANAGED = "7",
	FIRSTREMINDER = "8",
	REFUNDED = "9",
	DISPUTEACCEPTED = "10",
	SECONDREMINDER = "11",
}

export const enum CloseEventBusOption {
	Terminate = "terminate",
	Reconnect = "reconnect",
	Pause = "pause",
}

export const enum Announcement {
	None = "0",
	StorageDeletion = "1",
}

export const enum CertificateState {
	VALID = "0",
	VALIDATING = "1",
	INVALID = "2",
}

export const enum CertificateType {
	MANUAL = "0",
	LETS_ENCRYPT = "1",
}

export function getCertificateType(certificateInfo: CertificateInfo): CertificateType {
	return downcast(certificateInfo.type)
}

export enum RepeatPeriod {
	DAILY = "0",
	WEEKLY = "1",
	MONTHLY = "2",
	ANNUALLY = "3",
}

export const enum EndType {
	Never = "0",
	Count = "1",
	UntilDate = "2",
}

export const defaultCalendarColor = "2196f3"

export const enum AlarmInterval {
	FIVE_MINUTES = "5M",
	TEN_MINUTES = "10M",
	THIRTY_MINUTES = "30M",
	ONE_HOUR = "1H",
	ONE_DAY = "1D",
	TWO_DAYS = "2D",
	THREE_DAYS = "3D",
	ONE_WEEK = "1W",
}

export const enum EventTextTimeOption {
	START_TIME = "startTime",
	END_TIME = "endTime",
	START_END_TIME = "startAndEndTime",
}

export const enum TimeFormat {
	TWENTY_FOUR_HOURS = "0",
	TWELVE_HOURS = "1",
}

export const enum WeekStart {
	MONDAY = "0",
	SUNDAY = "1",
	SATURDAY = "2",
}

export function getWeekStart(userSettings: UserSettingsGroupRoot): WeekStart {
	return downcast(userSettings.startOfTheWeek)
}

export const enum ShareCapability {
	Read = "0",
	Write = "1",
	Invite = "2",
}

export const SECOND_MS = 1000

export const enum PostingType {
	Generic = "0",
	UsageFee = "1",
	Credit = "2",
	Dispute = "3",
	Suspension = "4",
	Payment = "5",
	Refund = "6",
	SuspensionCancel = "7",
	GiftCard = "8",
}

export const CounterType_UnreadMails = "2"

export const enum UnsubscribeFailureReason {
	TOO_MANY_ENABLED_USERS = "unsubscribe.too_many_users",
	CUSTOM_MAIL_ADDRESS = "unsubscribe.custom_mail_address",
	TOO_MANY_CALENDARS = "unsubscribe.too_many_calendars",
	CALENDAR_TYPE = "unsubscirbe.invalid_calendar_type",
	TOO_MANY_ALIASES = "unsubscribe.too_many_aliases",
	FEATURE = "unsubscribe.feature",
}

export const Keys = Object.freeze({
	NONE: {
		code: -1,
		name: "",
	},
	RETURN: {
		code: 13,
		name: "⏎",
	},
	BACKSPACE: {
		code: 8,
		name: "BACKSPACE",
	},
	TAB: {
		code: 9,
		name: "↹",
	},
	SHIFT: {
		code: 16,
		name: "⇧",
	},
	CTRL: {
		code: 17,
		name: "CTRL",
	},
	ALT: {
		code: 17,
		name: "ALT",
	},
	META: {
		code: 91,
		name: "\u2318",
	},
	// command key (left) (OSX)
	ESC: {
		code: 27,
		name: "ESC",
	},
	SPACE: {
		code: 32,
		name: "Space",
	},
	PAGE_UP: {
		code: 33,
		name: "Page ↑",
	},
	PAGE_DOWN: {
		code: 34,
		name: "Page ↓",
	},
	END: {
		code: 35,
		name: "End",
	},
	HOME: {
		code: 36,
		name: "Home",
	},
	LEFT: {
		code: 37,
		name: "←",
	},
	UP: {
		code: 38,
		name: "↑",
	},
	RIGHT: {
		code: 39,
		name: "→",
	},
	DOWN: {
		code: 40,
		name: "↓",
	},
	DELETE: {
		code: 46,
		name: "DEL",
	},
	"0": {
		code: 48,
		name: "0",
	},
	ONE: {
		code: 49,
		name: "1",
	},
	TWO: {
		code: 50,
		name: "2",
	},
	THREE: {
		code: 51,
		name: "3",
	},
	FOUR: {
		code: 52,
		name: "4",
	},
	FIVE: {
		code: 53,
		name: "5",
	},
	SIX: {
		code: 54,
		name: "6",
	},
	A: {
		code: 65,
		name: "A",
	},
	B: {
		code: 66,
		name: "B",
	},
	C: {
		code: 67,
		name: "C",
	},
	E: {
		code: 69,
		name: "E",
	},
	F: {
		code: 70,
		name: "F",
	},
	H: {
		code: 72,
		name: "H",
	},
	I: {
		code: 73,
		name: "I",
	},
	J: {
		code: 74,
		name: "J",
	},
	K: {
		code: 75,
		name: "K",
	},
	L: {
		code: 76,
		name: "L",
	},
	M: {
		code: 77,
		name: "M",
	},
	N: {
		code: 78,
		name: "N",
	},
	O: {
		code: 79,
		name: "O",
	},
	P: {
		code: 80,
		name: "P",
	},
	Q: {
		code: 81,
		name: "Q",
	},
	R: {
		code: 82,
		name: "R",
	},
	S: {
		code: 83,
		name: "S",
	},
	T: {
		code: 84,
		name: "T",
	},
	U: {
		code: 85,
		name: "U",
	},
	V: {
		code: 86,
		name: "V",
	},
	F1: {
		code: 112,
		name: "F1",
	},
	F5: {
		code: 116,
		name: "F5",
	},
	F11: {
		code: 122,
		name: "F11",
	},
	F12: {
		code: 123,
		name: "F12",
	},
})

// See: https://webaim.org/techniques/keyboard/tabindex#overview

export const enum TabIndex {
	Programmatic = "-1",
	// focus on element can only be set programmatically
	Default = "0", // regular tab order
}

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

// Keep non-const for admin
export enum MailAuthenticationStatus {
	/**
	 * Disposition: None. All checks have passed.
	 */
	AUTHENTICATED = "0",

	/**
	 * Authentication has failed because of the domain policy or because of the SPF.
	 */
	HARD_FAIL = "1",

	/**
	 * Authentication has failed because of our own policy, most commonly authentication is "missing".
	 */
	SOFT_FAIL = "2",

	/**
	 * Authentication has failed because From header is not valid so we couldn't do authentication checks.
	 */
	INVALID_MAIL_FROM = "3",

	/**
	 * Authentication has failed because From header is missing. Most likely it is some technical message like bounce mail.
	 */
	MISSING_MAIL_FROM = "4",
}

export const enum MailReportType {
	PHISHING = "0",
	SPAM = "1",
}

export const enum DnsRecordValidation {
	OK = "✓",
	BAD = "✗",
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

export function getAttendeeStatus(attendee: CalendarEventAttendee): CalendarAttendeeStatus {
	return downcast(attendee.status)
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

export function getAsEnumValue<K extends keyof any, V>(enumValues: Record<K, V>, value: string): V | null {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		// @ts-ignore
		const enumValue = enumValues[key]

		if (enumValue === value) {
			return enumValue
		}
	}

	return null
}

export function assertEnumValue<K extends keyof any, V>(enumValues: Record<K, V>, value: string): V {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		// @ts-ignore
		const enumValue = enumValues[key]

		if (enumValue === value) {
			return enumValue
		}
	}

	throw new Error(`Invalid enum value ${value} for ${JSON.stringify(enumValues)}`)
}

export function assertEnumKey<K extends string, V>(obj: Record<K, V>, key: string): K {
	if (key in obj) {
		return downcast(key)
	} else {
		throw Error("Not valid enum value: " + key)
	}
}

export const enum ClientType {
	Browser = "0",
	Desktop = "1",
	App = "2",
}

export function getClientType(): ClientType {
	return isApp() ? ClientType.App : isElectronClient() ? ClientType.Desktop : ClientType.Browser
}

export const enum ExternalImageRule {
	None = "0",
	Allow = "1",
	Block = "2",
}

export type PayPalData = {
	account: string
}

export type InvoiceData = {
	invoiceAddress: string
	country: Country | null
	vatNumber: string // only for EU countries otherwise empty
}

export type PaymentData = {
	paymentMethod: PaymentMethodType
	creditCardData: CreditCard | null
}

export enum UsageTestState {
	Created = "0",
	Live = "1",
	Paused = "2",
	Finished = "3",
}

export const UsageTestStateToName = reverse(UsageTestState)

export enum UsageTestMetricType {
	Number = "0",
	Enum = "1",
	Likert = "2",
}

export const UsageTestMetricTypeToName = reverse(UsageTestMetricType)

export const enum ArchiveDataType {
	AuthorityRequests = "0",
	Attachments = "1",
	MailDetails = "2",
}

export const OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS = 31

export enum UsageTestParticipationMode {
	Once = "0",
	Unlimited = "1",
}

export const UsageTestParticipationModeToName = reverse(UsageTestParticipationMode)

export enum TerminationPeriodOptions {
	EndOfCurrentPeriod = "0",
	FutureDate = "1",
}
