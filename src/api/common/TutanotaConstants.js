// @flow

import {downcast} from "./utils/Utils"
import type {GroupMembership} from "../entities/sys/GroupMembership"
import type {MailFolder} from "../entities/tutanota/MailFolder"
import type {ContactSocialId} from "../entities/tutanota/ContactSocialId"
import type {AccountingInfo} from "../entities/sys/AccountingInfo"
import type {EmailSenderListElement} from "../entities/sys/EmailSenderListElement"
import type {CertificateInfo} from "../entities/sys/CertificateInfo"
import type {UserSettingsGroupRoot} from "../entities/tutanota/UserSettingsGroupRoot"
import type {CalendarEventAttendee} from "../entities/tutanota/CalendarEventAttendee"

export const reverse = (objectMap: Object): {} => Object.keys(objectMap)
                                                        .reduce((r, k) => Object.assign(r, {[objectMap[k]]: k}), {})

export const MAX_NBR_MOVE_DELETE_MAIL_SERVICE = 50

export const GroupType = Object.freeze({
	User: "0",
	Admin: "1",
	MailingList: "2",
	Customer: "3",
	External: "4",
	Mail: "5",
	Contact: "6",
	File: "7",
	LocalAdmin: "8",
	Calendar: "9"
})
export type GroupTypeEnum = $Values<typeof GroupType>;
export const getMembershipGroupType = (membership: GroupMembership): GroupTypeEnum => downcast(membership.groupType)

export const PermissionType = Object.freeze({
	Public: "0",
	Symmetric: "1",
	Public_Symmetric: "2", // instances without ownerEncSessionKey (e.g. MailBody, FileData) after asymmetric decryption
	Unencrypted: "3",
	External: "5",
	Owner_List: "8"
})
export type PermissionTypeEnum = $Values<typeof PermissionType>;

export const BucketPermissionType = Object.freeze({
	Public: "2",
	External: "3"
})
export type BucketPermissionTypeEnum = $Values<typeof BucketPermissionType>;

export const MailFolderType = Object.freeze({
	CUSTOM: '0',
	INBOX: '1',
	SENT: '2',
	TRASH: '3',
	ARCHIVE: '4',
	SPAM: '5',
	DRAFT: '6'
})
export const getMailFolderType = (folder: MailFolder): MailFolderTypeEnum => downcast(folder.folderType)

export type MailFolderTypeEnum = $Values<typeof MailFolderType>;

export const ReplyType = Object.freeze({
	NONE: '0',
	REPLY: '1',
	FORWARD: '2',
	REPLY_FORWARD: '3'
})
export type ReplyTypeEnum = $Values<typeof ReplyType>;

export const ContactAddressType = Object.freeze({
	PRIVATE: '0',
	WORK: '1',
	OTHER: '2',
	CUSTOM: '3'
})
export type ContactAddressTypeEnum = $Values<typeof ContactAddressType>;

export const ContactPhoneNumberType = Object.freeze({
	PRIVATE: '0',
	WORK: '1',
	MOBILE: '2',
	FAX: '3',
	OTHER: '4',
	CUSTOM: '5'
})
export type ContactPhoneNumberTypeEnum = $Values<typeof ContactPhoneNumberType>;

export const ContactSocialType = Object.freeze({
	TWITTER: '0',
	FACEBOOK: '1',
	XING: '2',
	LINKED_IN: '3',
	OTHER: '4',
	CUSTOM: '5'
})
export type ContactSocialTypeEnum = $Values<typeof ContactSocialType>;
export const getContactSocialType = (contactSocialId: ContactSocialId): ContactSocialTypeEnum => downcast(contactSocialId.type)

export const OperationType = {
	CREATE: '0',
	UPDATE: '1',
	DELETE: '2'
}
export type OperationTypeEnum = $Values<typeof OperationType>;

export const AccountType = Object.freeze({
	FREE: '1',
	STARTER: '2',
	PREMIUM: '3',
	EXTERNAL: '5'
})
export type AccountTypeEnum = $Values<typeof AccountType>;

export const AccountTypeNames = ["System", "Free", "Outlook", "Premium", "Stream", "External"]

export const PaidSubscriptionType = Object.freeze({
	Premium: '0',
	Legacy_Pro: '1',
	Pro: '2',
	Teams: '3'
})
export type PaidSubscriptionTypeEnum = $Values<typeof PaidSubscriptionType>;

export const BookingItemFeatureType = Object.freeze({
	Users: '0',
	Storage: '1',
	Alias: '2',
	SharedMailGroup: '3',
	Branding: '4',
	ContactForm: '5',
	WhitelabelChild: '6',
	LocalAdminGroup: '7',
	Discount: '8',
	Sharing: '9'
})
export type BookingItemFeatureTypeEnum = $Values<typeof BookingItemFeatureType>;
export const BookingItemFeatureByCode: {} = reverse(BookingItemFeatureType)


export const PaymentMethodType = Object.freeze({
	Invoice: '0',
	CreditCard: '1',
	Sepa: '2',
	Paypal: '3'
})
export type PaymentMethodTypeEnum = $Values<typeof PaymentMethodType>;
export const getPaymentMethodType = (accountingInfo: AccountingInfo): PaymentMethodTypeEnum => downcast(accountingInfo.paymentMethod)

export const ValueToPaymentMethodType: {} = reverse(PaymentMethodType)


export const Const = {
	UPGRADE_REMINDER_INTERVAL: 14 * 24 * 60 * 60 * 1000,
	MEMORY_GB_FACTOR: 1000000000,
	MEMORY_WARNING_FACTOR: 0.9,
	COUNTER_USED_MEMORY_INTERNAL: "UsedMemoryInternalNew",
	COUNTER_USED_MEMORY_EXTERNAL: "UsedMemoryExternalNew",
	COUNTER_USED_MEMORY: "UsedMemoryNew",
	CURRENT_DATE: null, // Sets the current date for testing date dependent services. Only available in test environments.
	CURRENCY_SYMBOL_EUR: "€",
}

export const TUTANOTA_MAIL_ADDRESS_DOMAINS = ["tutanota.com", "tutanota.de", "tutamail.com", "tuta.io", "keemail.me"]

export const ConversationType = Object.freeze({
	NEW: '0',
	REPLY: '1',
	FORWARD: '2',
})
export type ConversationTypeEnum = $Values<typeof ConversationType>;

export const MailState = Object.freeze({
	DRAFT: '0',
	SENT: '1',
	RECEIVED: '2',
	SENDING: '3'
})
export type MailStateEnum = $Values<typeof MailState>;

export const ApprovalStatus = Object.freeze({
	REGISTRATION_APPROVED: "0",
	REGISTRATION_APPROVAL_NEEDED: "1",
	SEND_MAILS_APPROVED: "2",
	INVOICE_NOT_PAID: "3",
	SPAM_SENDER: "4",
	DELAYED: "5",
	DELAYED_AND_INITIALLY_ACCESSED: "6",
	REGISTRATION_APPROVAL_NEEDED_AND_INITIALLY_ACCESSED: "7",
	PAID_SUBSCRIPTION_NEEDED: "8",
	INITIAL_PAYMENT_PENDING: "9"
})
export type ApprovalStatusEnum = $Values<typeof ApprovalStatus>;


export const InboxRuleType = Object.freeze({
	FROM_EQUALS: "0",
	RECIPIENT_TO_EQUALS: "1",
	RECIPIENT_CC_EQUALS: "2",
	RECIPIENT_BCC_EQUALS: "3",
	SUBJECT_CONTAINS: "4",
	MAIL_HEADER_CONTAINS: "5"
})
export type InboxRuleTypeEnum = $Values<typeof InboxRuleType>;

export const SpamRuleType = Object.freeze({
	WHITELIST: "1",
	BLACKLIST: "2",
	DISCARD: "3",
})
const SpamRuleValues = Object.values(SpamRuleType)
export type SpamRuleTypeEnum = $Values<typeof SpamRuleType>;

export function getSpamRuleType(spamRule: EmailSenderListElement): ?SpamRuleTypeEnum {
	if (spamRule.type in SpamRuleValues) {
		return downcast(spamRule.type)
	} else {
		return null
	}
}

export const SpamRuleFieldType = Object.freeze({
	FROM: "0",
	TO: "1",
	CC: "2",
	BCC: "3",
})
export type SpamRuleFieldTypeEnum = $Values<typeof SpamRuleFieldType>;

export function getSparmRuleField(spamRule: EmailSenderListElement): SpamRuleFieldTypeEnum {
	return downcast(spamRule.field)
}

export const EmailSignatureType = Object.freeze({
	EMAIL_SIGNATURE_TYPE_DEFAULT: "0",
	EMAIL_SIGNATURE_TYPE_CUSTOM: "1",
	EMAIL_SIGNATURE_TYPE_NONE: "2",
})
export type EmailSignatureTypeEnum = $Values<typeof EmailSignatureType>;

export const CustomDomainValidationResult = Object.freeze({
	CUSTOM_DOMAIN_VALIDATION_RESULT_OK: "0",
	CUSTOM_DOMAIN_VALIDATION_RESULT_DNS_LOOKUP_FAILED: "1",
	CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_FOUND: "2",
	CUSTOM_DOMAIN_VALIDATION_RESULT_NAMESERVER_NOT_FOUND: "3",
	CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE: "4",
	CUSTOM_DOMAIN_VALIDATION_RESULT_VALIDATION_FAILED: "5"
})
export type CustomDomainValidationResultEnum = $Values<typeof CustomDomainValidationResult>;

export const CustomDomainCheckResult = Object.freeze({
	CUSTOM_DOMAIN_CHECK_RESULT_OK: "0",
	CUSTOM_DOMAIN_CHECK_RESULT_DNS_LOOKUP_FAILED: "1",
	CUSTOM_DOMAIN_CHECK_RESULT_DOMAIN_NOT_FOUND: "2",
	CUSTOM_DOMAIN_CHECK_RESULT_NAMESERVER_NOT_FOUND: "3",
})
export type CustomDomainCheckResultEnum = $Values<typeof CustomDomainCheckResult>;

export const DnsRecordType = Object.freeze({
	DNS_RECORD_TYPE_MX: "0",
	DNS_RECORD_TYPE_TXT_SPF: "1",
	DNS_RECORD_TYPE_CNAME_DKIM: "2",
	DNS_RECORD_TYPE_TXT_DMARC: "3",
	DNS_RECORD_TYPE_CNAME_MTA_STS: "4",
})
export type DnsRecordTypeEnum = $Values<typeof DnsRecordType>;

export const DnsRecordTypeToName = Object.freeze({
	"0": "MX",
	"1": "TXT",
	"2": "CNAME",
	"3": "TXT",
	"4": "CNAME"
})

export const SessionState = Object.freeze({
	SESSION_STATE_ACTIVE: "0",
	SESSION_STATE_EXPIRED: "1",
	SESSION_STATE_DELETED: "2",
	SESSION_STATE_PENDING: "3",
})
export type SessionStateEnum = $Values<typeof SessionState>;

export const PushServiceType = Object.freeze({
	ANDROID: "0",
	IOS: "1",
	EMAIL: "2",
	SSE: "3"
})
export type PushServiceTypeEnum = $Values<typeof PushServiceType>;

export const InputFieldType = Object.freeze({
	TEXT: "0",
	NUMBER: "1",
	ENUM: "2"
})
export type InputFieldTypeEnum = $Values<typeof InputFieldType>;

export const EntropySrc = Object.freeze({
	mouse: "mouse",
	touch: "touch",
	key: "key",
	random: "random",
	static: "static",
	time: "time",
	accelerometer: "accel"
})
export type EntropySrcEnum = $Values<typeof EntropySrc>;

export const SecondFactorType = Object.freeze({
	u2f: "0",
	totp: "1"
})
export type SecondFactorTypeEnum = $Values<typeof SecondFactorType>;

export const MAX_ATTACHMENT_SIZE = 1024 * 1024 * 25
export const MAX_LOGO_SIZE = 1024 * 100
export const MAX_BASE64_IMAGE_SIZE = MAX_LOGO_SIZE

export const ALLOWED_IMAGE_FORMATS = ["png", "jpg", "jpeg", "svg"]

export const FeatureType = Object.freeze({
	DisableContacts: "0",
	DisableMailExport: "1",
	InternalCommunication: "2",
	DeleteMailsOnPasswordReset: "3",
	WhitelabelParent: "4",
	WhitelabelChild: "5",
	ReplyOnly: "6",
	DisableDefaultSignature: "7",
	HideBuyDialogs: "8",
	DisableCalendar: "9",
})
export type FeatureTypeEnum = $Values<typeof FeatureType>;
export const ValueToFeatureType: {} = reverse(FeatureType)

export const BootstrapFeatureType = Object.freeze({
	DisableSavePassword: "0",
})
export type BootstrapFeatureTypeEnum = $Values<typeof BootstrapFeatureType>;

export const FULL_INDEXED_TIMESTAMP: number = 0
export const NOTHING_INDEXED_TIMESTAMP: number = Math.pow(2, 42) - 1 // maximum Timestamp is 42 bit long (see GeneratedIdData.java)


export const PaymentDataResultType = Object.freeze({
	OK: "0",
	COUNTRY_MISMATCH: "1",
	INVALID_VATID_NUMBER: "2",
	CREDIT_CARD_DECLINED: "3",
	CREDIT_CARD_CVV_INVALID: "4",
	PAYMENT_PROVIDER_NOT_AVAILABLE: "5",
	OTHER_PAYMENT_PROVIDER_ERROR: "6",
	OTHER_PAYMENT_ACCOUNT_REJECTED: "7",
	COULD_NOT_VERIFY_VATID: "8",
	CREDIT_CARD_DATE_INVALID: "9",
	CREDIT_CARD_NUMBER_INVALID: "10"
})

export const ContactComparisonResult = Object.freeze({
	Unique: "unique",
	Similar: "similar",
	Equal: "equal",
})
export type ContactComparisonResultEnum = $Values<typeof ContactComparisonResult>;

export const IndifferentContactComparisonResult = Object.freeze({
	OneEmpty: "oneEmpty",
	BothEmpty: "bothEmpty",
})
export type IndifferentContactComparisonResultEnum = $Values<typeof IndifferentContactComparisonResult>;

export const ContactMergeAction = Object.freeze({
	DeleteFirst: "deleteFirst",
	DeleteSecond: "deleteSecond",
	Merge: "merge",
	Skip: "skip",
	Cancel: "cancel"
})
export type ContactMergeActionEnum = $Values<typeof ContactMergeAction>;


export const InvoiceStatus = Object.freeze({
	CREATED: "0",
	PUBLISHEDFORAUTOMATIC: "1",
	PUBLISHEDFORMANUAL: "2",
	PAID: "3",
	DEBITFAILED: "4",
	DISPUTED: "5",
	CANCELLED: "6",
	PARTNERMANAGED: "7",
	FIRSTREMINDER: "8",
	REFUNDED: "9",
	DISPUTEACCEPTED: "10",
	SECONDREMINDER: "11"
})
export type InvoiceStatusEnum = $Values<typeof InvoiceStatus>;
export const ValueToInvoiceStatus: {} = reverse(FeatureType)

export const CloseEventBusOption = Object.freeze({
	Terminate: "terminate",
	Reconnect: "reconnect",
	Pause: "pause"
})
export type CloseEventBusOptionEnum = $Values<typeof CloseEventBusOption>;

export const Announcement = Object.freeze({
	None: '0',
	StorageDeletion: '1'
})

export const CertificateState = Object.freeze({
	VALID: '0',
	VALIDATING: '1',
	INVALID: '2'
})
export type CertificateStateEnum = $Values<typeof CertificateState>

export const CertificateType = Object.freeze({
	MANUAL: '0',
	LETS_ENCRYPT: '1',
})
export type CertificateTypeEnum = $Values<typeof CertificateType>

export function getCertificateType(certificateInfo: CertificateInfo): CertificateTypeEnum {
	return downcast(certificateInfo.type)
}

export const RepeatPeriod = Object.freeze({
	DAILY: "0",
	WEEKLY: "1",
	MONTHLY: "2",
	ANNUALLY: "3",
})
export type RepeatPeriodEnum = $Values<typeof RepeatPeriod>

export const EndType = Object.freeze({
	Never: "0",
	Count: "1",
	UntilDate: "2"
})
export type EndTypeEnum = $Values<typeof EndType>

export const defaultCalendarColor = "2196f3"


export const AlarmInterval = Object.freeze({
	FIVE_MINUTES: "5M",
	TEN_MINUTES: "10M",
	THIRTY_MINUTES: "30M",
	ONE_HOUR: "1H",
	ONE_DAY: "1D",
	TWO_DAYS: "2D",
	THREE_DAYS: "3D",
	ONE_WEEK: "1W",
})
export type AlarmIntervalEnum = $Values<typeof AlarmInterval>
export const AlarmIntervalByCode: {} = reverse(AlarmInterval)

export const EventTextTimeOption = Object.freeze({
	NO_TIME: "noTime",
	START_TIME: "startTime",
	END_TIME: "endTime",
	START_END_TIME: "startAndEndTime",
	ALL_DAY: "allDay"
})
export type EventTextTimeOptionEnum = $Values<typeof EventTextTimeOption>;

export const TimeFormat = Object.freeze({
	TWENTY_FOUR_HOURS: '0',
	TWELVE_HOURS: '1',
})
export type TimeFormatEnum = $Values<typeof TimeFormat>

export const WeekStart = Object.freeze({
	MONDAY: '0',
	SUNDAY: '1',
	SATURDAY: '2'
})

export function getWeekStart(userSettings: UserSettingsGroupRoot): WeekStartEnum {
	return downcast(userSettings.startOfTheWeek)
}


export type WeekStartEnum = $Values<typeof WeekStart>

export const ShareCapability = Object.freeze({
	Read: '0',
	Write: '1',
	Invite: '2'
})

export type ShareCapabilityEnum = $Values<typeof ShareCapability>


export const SECOND_MS = 1000

export const PostingType = Object.freeze({
	Generic: "0",
	UsageFee: "1",
	Credit: "2",
	Dispute: "3",
	Suspension: "4",
	Payment: "5",
	Refund: "6",
	SuspensionCancel: "7"
})
export type PostingTypeEnum = $Values<typeof PostingType>

export const CounterType_UnreadMails = "2"

export const UnsubscribeFailureReason = Object.freeze({
	TOO_MANY_ENABLED_USERS: "unsubscribe.too_many_users",
	CUSTOM_MAIL_ADDRESS: "unsubscribe.custom_mail_address",
	TOO_MANY_CALENDARS: "unsubscribe.too_many_calendars",
	CALENDAR_TYPE: "unsubscirbe.invalid_calendar_type",
	TOO_MANY_ALIASES: "unsubscribe.too_many_aliases",
	FEATURE: "unsubscribe.feature",
})
export type UnsubscrubeFailureReasonEnum = $Values<typeof UnsubscribeFailureReason>
export const Keys = Object.freeze({
	NONE: {code: -1, name: ""},
	RETURN: {code: 13, name: "⏎"},
	TAB: {code: 9, name: "↹"},
	SHIFT: {code: 16, name: "⇧"},
	CTRL: {code: 17, name: "CTRL"},
	ALT: {code: 17, name: "ALT"},
	META: {code: 91, name: '\u2318'}, // command key (left) (OSX)
	ESC: {code: 27, name: "ESC"},
	SPACE: {code: 32, name: "Space"},
	PAGE_UP: {code: 33, name: "Page ↑"},
	PAGE_DOWN: {code: 34, name: "Page ↓"},
	END: {code: 35, name: "End"},
	HOME: {code: 36, name: "Home"},
	LEFT: {code: 37, name: "←"},
	UP: {code: 38, name: "↑"},
	RIGHT: {code: 39, name: "→"},
	DOWN: {code: 40, name: "↓"},
	DELETE: {code: 46, name: "DEL"},
	"0": {code: 48, name: "0"},
	ONE: {code: 49, name: "1"},
	TWO: {code: 50, name: "2"},
	THREE: {code: 51, name: "3"},
	FOUR: {code: 52, name: "4"},
	FIVE: {code: 53, name: "5"},
	SIX: {code: 54, name: "6"},
	A: {code: 65, name: "A"},
	B: {code: 66, name: "B"},
	C: {code: 67, name: "C"},
	E: {code: 69, name: "E"},
	F: {code: 70, name: "F"},
	H: {code: 72, name: "H"},
	I: {code: 73, name: "I"},
	J: {code: 74, name: "J"},
	K: {code: 75, name: "K"},
	L: {code: 76, name: "L"},
	M: {code: 77, name: "M"},
	N: {code: 78, name: "N"},
	O: {code: 79, name: "O"},
	P: {code: 80, name: "P"},
	R: {code: 82, name: "R"},
	S: {code: 83, name: "S"},
	T: {code: 84, name: "T"},
	U: {code: 85, name: "U"},
	V: {code: 86, name: "V"},
	F1: {code: 112, name: "F1"},
	F5: {code: 116, name: "F5"},
	F11: {code: 122, name: "F11"},
	F12: {code: 123, name: "F12"},
})
export type KeysEnum = $Values<typeof Keys>

// See: https://webaim.org/techniques/keyboard/tabindex#overview
export const TabIndex = Object.freeze({
	Programmatic: "-1", // focus on element can only be set programmatically
	Default: "0", // regular tab order
})

export const ReportedMailFieldType = Object.freeze({
	/**
	 * From header address, authenticated.
	 */
	FROM_ADDRESS: "0",
	/**
	 * From header address, not authenticated with DMARC.
	 */
	FROM_ADDRESS_NON_AUTH: "1",
	/**
	 * From header address domain
	 */
	FROM_DOMAIN: "2",
	/**
	 * From header address domain, not authenticated not authenticated with DMARC.
	 */
	FROM_DOMAIN_NON_AUTH: "3",
	/**
	 * Email subject
	 */
	SUBJECT: "4",
	/**
	 * Link in the body of email
	 */
	LINK: "5",
	/**
	 * Domain of the link in the body
	 */
	LINK_DOMAIN: "6",
})
export type ReportedMailFieldTypeEnum = $Values<typeof ReportedMailFieldType>

export const MailPhishingStatus = Object.freeze({
	UNKNOWN: "0",
	SUSPICIOUS: "1",
	WHITELISTED: "2",
})
export type MailPhishingStatusEnum = $Values<typeof MailPhishingStatus>

export const PhishingMarkerStatus = Object.freeze({
	ACTIVE: "0",
	INACTIVE: "1",
})
export type PhishingMarkerStatusEnum = $Values<typeof PhishingMarkerStatus>

export const MailAuthenticationStatus = Object.freeze({
	/**
	 * Disposition: None. All checks have passed.
	 */
	AUTHENTICATED: "0",
	/**
	 * Authentication has failed because of the domain policy or because of the SPF.
	 */
	HARD_FAIL: "1",
	/**
	 * Authentication has failed because of our own policy, most commonly authentication is "missing".
	 */
	SOFT_FAIL: "2",
	/**
	 * Authentication has failed because From header is not valid so we couldn't do authentication checks.
	 */
	INVALID_MAIL_FROM: "3",
	/**
	 * Authentication has failed because From header is missing. Most likely it is some technical message like bounce mail.
	 */
	MISSING_MAIL_FROM: "4",
})
export type MailAuthenticationStatusEnum = $Values<typeof MailAuthenticationStatus>

export const MailReportType = Object.freeze({
	PHISHING: "0",
	SPAM: "1",
})

export const DnsRecordValidation = Object.freeze({
	OK: "✓",
	BAD: "✗",
})
export type DnsRecordValidationTypeEnum = $Values<typeof DnsRecordValidation>;


export type MailReportTypeEnum = $Values<typeof MailReportType>
export const CalendarAttendeeStatus = Object.freeze({
	/** invite is not sent yet */
	ADDED: "0",
	/** already invited but did not respond */
	NEEDS_ACTION: "1",
	ACCEPTED: "2",
	DECLINED: "3",
	TENTATIVE: "4"
})

export type CalendarAttendeeStatusEnum = $Values<typeof CalendarAttendeeStatus>
export const attendeeStatusByCode: {} = reverse(CalendarAttendeeStatus)

export function getAttendeeStatus(attendee: CalendarEventAttendee): CalendarAttendeeStatusEnum {
	return downcast(attendee.status)
}

export const CalendarMethod = Object.freeze({
	PUBLISH: "PUBLISH",
	REQUEST: "REQUEST",
	REPLY: "REPLY",
	ADD: "ADD",
	CANCEL: "CANCEL",
	REFRESH: "REFRESH",
	COUNTER: "COUNTER",
	DECLINECOUNTER: "DECLINECOUNTER"
})

export type CalendarMethodEnum = $Values<typeof CalendarMethod>

export const MailMethod = Object.freeze({
	NONE: "0",
	ICAL_PUBLISH: "1",
	ICAL_REQUEST: "2",
	ICAL_REPLY: "3",
	ICAL_ADD: "4",
	ICAL_CANCEL: "5",
	ICAL_REFRESH: "6",
	ICAL_COUNTER: "7",
	ICAL_DECLINECOUNTER: "8"
})

const icalToMailMethodMapping = Object.freeze({
	PUBLISH: MailMethod.ICAL_PUBLISH,
	REQUEST: MailMethod.ICAL_REQUEST,
	REPLY: MailMethod.ICAL_REPLY,
	ADD: MailMethod.ICAL_ADD,
	CANCEL: MailMethod.ICAL_CANCEL,
	REFRESH: MailMethod.ICAL_REFRESH,
	COUNTER: MailMethod.ICAL_COUNTER,
	DECLINECOUNTER: MailMethod.ICAL_COUNTER
})

const mailMethodToIcalMapping: {[$ElementType<typeof icalToMailMethodMapping, $Keys<typeof icalToMailMethodMapping>>]: $Keys<typeof icalToMailMethodMapping>} = reverse(icalToMailMethodMapping)

export function mailMethodToCalendarMethod(mailMethod: MailMethodEnum): CalendarMethodEnum {
	const calendarMethod = mailMethodToIcalMapping[mailMethod]
	if (calendarMethod == null) {
		throw new Error(`No conversion to calendar method from ${mailMethod}`)
	}
	return calendarMethod
}

export function calendarMethodToMailMethod(calendarMethod: CalendarMethodEnum): MailMethodEnum {
	const mapping = {
		PUBLISH: MailMethod.ICAL_PUBLISH,
		REQUEST: MailMethod.ICAL_REQUEST,
		REPLY: MailMethod.ICAL_REPLY,
		ADD: MailMethod.ICAL_ADD,
		CANCEL: MailMethod.ICAL_CANCEL,
		REFRESH: MailMethod.ICAL_REFRESH,
		COUNTER: MailMethod.ICAL_COUNTER,
		DECLINECOUNTER: MailMethod.ICAL_COUNTER
	}
	return mapping[calendarMethod]
}

export type MailMethodEnum = $Values<typeof MailMethod>

export function getAsEnumValue<K, V>(enumValues: {[K]: V}, value: string): ?V {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		const enumValue = enumValues[key]
		if (enumValue === value) {
			return enumValue
		}
	}
	return null
}