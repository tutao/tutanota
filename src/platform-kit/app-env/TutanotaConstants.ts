import { TimeConstants } from "./TimeConstants.js"
import { isAdminClient, isApp, isDesktop } from "./Env"

/**
 * parameter names are shortened to reduce size
 */
export type Country = {
	/** name */
	n: string
	/** abbreviation */
	a: string
	/** type */
	t: number
	/** DecimalSeparator */
	d: number
}

type ObjectPropertyKey = string | number | symbol
export const reverse = <K extends ObjectPropertyKey, V extends ObjectPropertyKey>(objectMap: Record<K, V>): Record<V, K> =>
	Object.keys(objectMap).reduce(
		(r, k) => {
			const v = objectMap[k as any as K]
			return Object.assign(r, { [v]: k })
		},
		{} as Record<V, K>,
	)

export type ConstType = {
	INITIAL_UPGRADE_REMINDER_INTERVAL_MS: number
	REPEATED_UPGRADE_REMINDER_INTERVAL_MS: number
	MEMORY_GB_FACTOR: number
	MEMORY_WARNING_FACTOR: number
	CURRENT_DATE: Date | null
	CURRENCY_SYMBOL_EUR: string
	DEFAULT_APP_DOMAIN: string
	LEGACY_WEBAUTHN_RP_ID: string
	WEBAUTHN_RP_ID: string
	U2f_APPID_SUFFIX: string
	U2F_LEGACY_APPID: string
	EXECUTE_KDF_MIGRATION: boolean
}

export const Const: ConstType = {
	INITIAL_UPGRADE_REMINDER_INTERVAL_MS: 14 * TimeConstants.DAY_IN_MILLIS,
	REPEATED_UPGRADE_REMINDER_INTERVAL_MS: 90 * TimeConstants.DAY_IN_MILLIS,
	MEMORY_GB_FACTOR: 1000000000,
	MEMORY_WARNING_FACTOR: 0.9,
	// Sets the current date for testing date dependent services. Only available in test environments.
	CURRENT_DATE: null,
	CURRENCY_SYMBOL_EUR: "€",
	DEFAULT_APP_DOMAIN: "app.tuta.com",
	LEGACY_WEBAUTHN_RP_ID: "tutanota.com",
	WEBAUTHN_RP_ID: "tuta.com",
	U2f_APPID_SUFFIX: "/u2f-appid.json",
	// this is fetched from the website assets (even though the server has a hardcoded response for this)
	// we keep it at tutanota.com since we're matching on it in the code and old keys are saved with this
	// URL as appId.
	// we'll still get the contents
	// because it will be redirected to tuta.com after new domain deploy.
	U2F_LEGACY_APPID: "https://tutanota.com/u2f-appid.json",
	EXECUTE_KDF_MIGRATION: true,
} as const

export const TUTA_MAIL_ADDRESS_DOMAINS: ReadonlyArray<string> = Object.freeze([
	"tuta.com",
	"tutamail.com",
	"tuta.io",
	"tutanota.com",
	"tutanota.de",
	"keemail.me",
])
export const TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS = TUTA_MAIL_ADDRESS_DOMAINS
export const DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN = "tuta.com"
export const DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN = "tutamail.com"

// Keep non-const for admin
export enum ApprovalStatus {
	REGISTRATION_APPROVED = "0",
	REGISTRATION_APPROVAL_NEEDED = "1",
	SEND_MAILS_APPROVED = "2",
	INVOICE_NOT_PAID = "3",
	SPAM_SENDER = "4",
	// this was DELAYED
	UNUSED_DEPRECATED = "5",
	DELAYED = "6",
	// this was REGISTRATION_APPROVAL_NEEDED_AND_INITIALLY_ACCESSED
	UNUSED2_DEPRECATED = "7",
	PAID_SUBSCRIPTION_NEEDED = "8",
	INITIAL_PAYMENT_PENDING = "9",
	NO_ACTIVITY = "10",
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
	webauthn = "2", // actually refers to u2f in client
}

export enum IdentityKeySourceOfTrust {
	Manual = 0,
	TOFU = 1,
	Not_Supported = 2,
}

export enum IdentityKeyVerificationMethod {
	text = "0",
	qr = "1",
}

export const enum IdentityKeyQrVerificationResult {
	QR_OK = "0",
	QR_MALFORMED_PAYLOAD = "1",
	QR_MAIL_ADDRESS_NOT_FOUND = "2",
	QR_FINGERPRINT_MISMATCH = "3",
}

export enum EncryptionKeyVerificationState {
	NO_ENTRY, // No identity key exists
	VERIFIED_MANUAL, // Identity is manually trusted and verified
	VERIFIED_TOFU, // Identity is trusted and verified via TOFU
	NOT_SUPPORTED, // Identity key verification is not supported, e.g. when loading via group id instead of mail address as identifier or when we do not have access to a trust database
}

/* For displaying the key verification result in the UI */
export enum PresentableKeyVerificationState {
	NONE = "0",
	SECURE = "1",
	ALERT = "2",
}

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
	AffiliatePartner = "12",
	KnowledgeBase = "13",
	Newsletter = "14",
	Unused15 = "15",
	Unused16 = "16",
	MultipleUsers = "17", // Multi-user support for new personal plans.
	KeyVerification = "18", // Enables key verification for internal testing and volunteers
	SpamClientClassification = "19",
	QuickActions = "20",
	ReceivesNoTutaNewsletters = "21",
	DriveInternalBeta = "22", // Enables drive access for internal testing
	SolutionPartner = "23",
}

export const GENERATED_ID_MAX_TIMESTAMP: number = Math.pow(2, 42) - 1 // maximum Timestamp is 42 bit long (see GeneratedIdData.java)
export const GENERATED_ID_MIN_TIMESTAMP: number = 0

export const FULL_INDEXED_TIMESTAMP: number = GENERATED_ID_MIN_TIMESTAMP
export const NOTHING_INDEXED_TIMESTAMP: number = GENERATED_ID_MAX_TIMESTAMP

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

export enum RepeatPeriod {
	DAILY = "0",
	WEEKLY = "1",
	MONTHLY = "2",
	ANNUALLY = "3",
}

export enum Weekday {
	MONDAY = "MO",
	TUESDAY = "TU",
	WEDNESDAY = "WE",
	THURSDAY = "TH",
	FRIDAY = "FR",
	SATURDAY = "SA",
	SUNDAY = "SU",
}

export const enum EndType {
	Never = "0",
	Count = "1",
	UntilDate = "2",
}

export const DEFAULT_CALENDAR_COLOR = "2196f3"

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

export const enum ShareCapability {
	Read = "0",
	Write = "1",
	Invite = "2",
}

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
	SalesCommission = "9",
}

export const enum UnsubscribeFailureReason {
	TOO_MANY_ENABLED_USERS = "unsubscribe.too_many_users",
	CUSTOM_MAIL_ADDRESS = "unsubscribe.custom_mail_address",
	TOO_MANY_CALENDARS = "unsubscribe.too_many_calendars",
	CALENDAR_TYPE = "unsubscirbe.invalid_calendar_type",
	TOO_MANY_ALIASES = "unsubscribe.too_many_aliases",
	TOO_MUCH_STORAGE_USED = "unsubscribe.too_much_storage",
	TOO_MANY_DOMAINS = "unsubscribe.too_many_domains",
	HAS_TEMPLATE_GROUP = "unsubscribe.has_template_group",
	WHITELABEL_DOMAIN_ACTIVE = "unsubscribe.whitelabel_domain_active",
	SHARED_GROUP_ACTIVE = "unsubscribe.shared_group_active",
	HAS_CONTACT_FORM = "unsubscribe.has_contact_form",
	NOT_ENOUGH_CREDIT = "unsubscribe.not_enough_credit",
	INVOICE_NOT_PAID = "unsubscribe.invoice_not_paid",
	HAS_CONTACT_LIST_GROUP = "unsubscribe.has_contact_list_group",
	ACTIVE_APPSTORE_SUBSCRIPTION = "unsubscribe.active_appstore_subscription",
	LABEL_LIMIT_EXCEEDED = "unsubscribe.label_limit_exceeded",
	HAS_SCHEDULED_MAILS = "unsubscribe.has_scheduled_mails",
	DRIVE_NOT_EMPTY = "unsubscribe.drive_not_empty",
}

// legacy, should be deleted after clients older than 3.114 have been disabled.
export const enum BookingFailureReason {
	TOO_MANY_DOMAINS = "bookingservice.too_many_domains",
	TOO_MANY_ALIASES = "bookingservice.too_many_aliases",
	TOO_MUCH_STORAGE_USED = "bookingservice.too_much_storage_used",
	SHARED_GROUP_ACTIVE = "bookingservice.shared_group_active",
	WHITELABEL_DOMAIN_ACTIVE = "bookingservice.whitelabel_domain_active",
	HAS_TEMPLATE_GROUP = "bookingservice.has_template_group",
}

// See: https://webaim.org/techniques/keyboard/tabindex#overview

export const enum TabIndex {
	Programmatic = "-1",
	// focus on element can only be set programmatically
	Default = "0", // regular tab order
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

/**
 * The status of the authentication when decrypting an end-to-end encrypted message.
 * Authentication was only introduced when switching to PQ.
 */
export enum EncryptionAuthStatus {
	/** the entity was encrypted with RSA, it had no authentication*/
	RSA_NO_AUTHENTICATION = "0",
	/** the entity was encrypted with tuta-crypt and authentication succeeded */
	TUTACRYPT_AUTHENTICATION_SUCCEEDED = "1",
	/** the entity was encrypted with tuta-crypt and authentication failed */
	TUTACRYPT_AUTHENTICATION_FAILED = "2",
	/** the entity was encrypted symmetrically, with AES, it had no authentication, e.g. secure external mailboxes */
	AES_NO_AUTHENTICATION = "3",
	/** the entity was sent by us encrypted with TutaCrypt, so it is authenticated */
	TUTACRYPT_SENDER = "4",
	/** the entity was encrypted with RSA although TutaCrypt keys were available */
	RSA_DESPITE_TUTACRYPT = "5",
}

export const enum DnsRecordValidation {
	OK = "✓",
	BAD = "✗",
}

export const enum ClientType {
	Browser = "0",
	Desktop = "1",
	App = "2",
}

export type PayPalData = {
	account: string
}

export type InvoiceData = {
	invoiceAddress: string
	country: Country | null
	vatNumber: string // only for EU countries otherwise empty
}

export enum UsageTestState {
	Created = "0",
	Live = "1",
	Paused = "2",
	Finished = "3",
	Finalized = "4",
}

export enum UsageTestMetricType {
	NUMBER = "0",
	ENUM = "1",
	LIKERT = "2",
	STRING = "3",
}

export const FREE_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS = 31

export const PAID_OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS = 2 * 365

export enum UsageTestParticipationMode {
	Once = "0",
	Unlimited = "1",
}

export enum TerminationPeriodOptions {
	EndOfCurrentPeriod = "0",
	FutureDate = "1",
}

export enum CryptoProtocolVersion {
	RSA = "0",
	SYMMETRIC_ENCRYPTION = "1", // secure external
	TUTA_CRYPT = "2", // hybrid PQ protocol (Kyber + x25519)
}

export enum GroupKeyRotationType {
	User = "0",
	AdminGroupKeyRotationSingleUserAccount = "1", // scheduled for accounts that only have one user (incl. deactivated users)
	Team = "2",
	UserArea = "3",
	Customer = "4",
	AdminGroupKeyRotationMultipleUserAccount = "5", // scheduled for accounts that have multiple users but only a single admin user
	AdminGroupKeyRotationMultipleAdminAccount = "6", // scheduled for accounts that have multiple admin users
}

export const EXTERNAL_CALENDAR_SYNC_INTERVAL = 60 * 30 * 1000 // 30 minutes

export const DEFAULT_ERROR = "defaultError"

export const BIRTHDAY_CALENDAR_BASE_ID = "birthday_calendar"
export const DEFAULT_BIRTHDAY_CALENDAR_COLOR = "FF9933"

export const MAX_LABELS_PER_MAIL = 5

export const TUTA_MAIL_GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=de.tutao.tutanota"
export const TUTA_MAIL_APP_STORE_URL = "https://apps.apple.com/app/secure-mail-client-tuta/id922429609"
export const TUTA_CALENDAR_GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=de.tutao.calendar"
export const TUTA_CALENDAR_APP_STORE_URL = "https://apps.apple.com/app/tuta-calendar-planner-app/id6657977811"

export enum RolloutType {
	UserIdentityKeyCreation = "0",
	SharedMailboxIdentityKeyCreation = "1",
	AdminOrUserGroupKeyRotation = "2",
	OtherGroupKeyRotation = "3",
	GroupKeyUpdatePending = "4",
	EncryptionOfAttributesViaAead = "5",
}

export enum DeactivationReason {
	UserRequest,
	AntiSpam,
	Unused,
	PaymentDispute,
	Custom,
	MassSignup,
}

export const PLAN_SELECTOR_SELECTED_BOX_SCALE = "1.03"

export const CANCEL_UPLOAD_EVENT = "CANCEL_UPLOAD_EVENT"
/**
 * We pick a max word frequency of 2^5 so that we can compress it together
 * with the index (which is 2^11 =2048) into two bytes
 */
export const MAX_WORD_FREQUENCY = 31
export const DEFAULT_VECTOR_MAX_LENGTH = 2048
export const UNDO_SEND_TIMEOUT_SECONDS = 10

export const enum OperationStatus {
	SUCCESS = "0",
	PROGRESS = "1",
	FAILURE = "2",
}

export enum UpgradePromptType {
	ADD_USER_WITH_NEW_DOMAIN,
	SHARED_MAILBOX,
	NEW_PLANS_NEWS,
	IMPORT,
	MORE_STORAGE_NEEDED,
	UPGRADE_REMINDER,
	TEMPLATE_LIST,
	MORE_CUSTOM_DOMAINS_NEEDED,
	MORE_ALIASES_NEEDED,
	EXTEND_OFFLINE_DATA_RANGE,
	CUSTOM_DOMAINS,
	OUT_OF_OFFICE_NOTIFICATIONS,
	NOTIFICATION_EMAILS,
	INBOX_RULES,
	EXTEND_MAIL_SEARCH_RANGE,
	CALENDAR_SEARCH,
	MORE_LABELS_NEEDED,
	SEND_LATER,
	CONTACT_LISTS,
	PURCHASE_GIFT_CARDS,
	VIEW_INVOICE,
	ACCEPT_GROUP_INVITATION,
	CALENDAR_EVENT_INVITATIONS,
	CHANGE_PAYMENT_METHOD,
	WHITELABEL,
	ALIASES,
	ADD_ALIAS_WITH_NEW_DOMAIN,
	CUSTOM_NOTIFICATION_EMAIL,
	BIRTHDAY_CALENDAR,
	CALENDAR_SHARING,
	MULTIPLE_CALENDARS,
	EXTERNAL_CALENDARS,
	CALENDAR_EVENT_INVITATION_REPLY,
	EDIT_CALENDAR_EVENT_REQUIRING_SUBSCRIPTION,
	NEW_CALENDAR_EVENT_REQUIRING_SUBSCRIPTION,
	EMAIL_SUPPORT,
	SUPPORT_TUTA,
	DRAWER_MENU_UPGRADE_BUTTON,
	SUBSCRIPTION_VIEWER,
	APPLE_IN_APP_EVENT,
	DRIVE,
}

/**
 * Enum that describes the different methods for encrypting the intermediate key used for credentials encryption.
 */
export enum CredentialEncryptionMode {
	/**
	 * Credentials key can be decrypted without user interaction if the device is in an unlocked state.
	 */
	DEVICE_LOCK = "DEVICE_LOCK",

	/**
	 * Credentials key can only be decrypted after authenticating using the system password/device pin.
	 * Depending on the platform authenticating using system password will keep the user authenticated for
	 * a certain period of time, i.e. the user might NOT have to enter the system password each time.
	 */
	SYSTEM_PASSWORD = "SYSTEM_PASSWORD",

	/**
	 * Credentials key can only be decrypted using biometric evidence. Depending on the device, there might be
	 * a fallback option to use the system password/device pin as an alternative. In contrast to SYSTEM_PASSWORD
	 * mode every access to the credentials key must be individually authenticated - even when using the fallback.
	 */
	BIOMETRICS = "BIOMETRICS",

	/**
	 * Credentials key is secured with a separate password / pin that is independent of the state of the system
	 * keychain.
	 */
	APP_PASSWORD = "APP_PASSWORD",
}

export const UsageTestParticipationModeToName = reverse(UsageTestParticipationMode)
export const UsageTestMetricTypeToName = reverse(UsageTestMetricType)
export const UsageTestStateToName = reverse(UsageTestState)

export function getClientType(): ClientType {
	return isApp() ? ClientType.App : isDesktop() || isAdminClient() ? ClientType.Desktop : ClientType.Browser
}
