import { ProgrammingError } from "./ProgrammingError-chunk.js";
import { isApp, isElectronClient, isIOSApp } from "./Env-chunk.js";
import { DAY_IN_MILLIS, downcast } from "./dist2-chunk.js";

//#region src/common/api/common/TutanotaConstants.ts
const MAX_NBR_MOVE_DELETE_MAIL_SERVICE = 50;
const MAX_BLOB_SIZE_BYTES = 10485760;
const REQUEST_SIZE_LIMIT_DEFAULT = 1048576;
const REQUEST_SIZE_LIMIT_MAP = new Map([
	["/rest/storage/blobservice", MAX_BLOB_SIZE_BYTES + 100],
	["/rest/tutanota/filedataservice", 26214400],
	["/rest/tutanota/draftservice", 1048576]
]);
const SYSTEM_GROUP_MAIL_ADDRESS = "system@tutanota.de";
const getMailFolderType = (folder) => downcast(folder.folderType);
function isFolder(folder) {
	return folder.folderType !== MailSetKind.ALL && folder.folderType !== MailSetKind.LABEL && folder.folderType !== MailSetKind.Imported;
}
function isLabel(folder) {
	return folder.folderType === MailSetKind.LABEL;
}
const reverse = (objectMap) => Object.keys(objectMap).reduce((r, k) => {
	const v = objectMap[downcast(k)];
	return Object.assign(r, { [v]: k });
}, {});
let OutOfOfficeNotificationMessageType = function(OutOfOfficeNotificationMessageType$1) {
	OutOfOfficeNotificationMessageType$1["Default"] = "0";
	OutOfOfficeNotificationMessageType$1["InsideOrganization"] = "1";
	return OutOfOfficeNotificationMessageType$1;
}({});
const OUT_OF_OFFICE_SUBJECT_PREFIX = "Auto-reply: ";
let GroupType = function(GroupType$1) {
	GroupType$1["User"] = "0";
	GroupType$1["Admin"] = "1";
	GroupType$1["MailingList"] = "2";
	GroupType$1["Customer"] = "3";
	GroupType$1["External"] = "4";
	GroupType$1["Mail"] = "5";
	GroupType$1["Contact"] = "6";
	GroupType$1["File"] = "7";
	GroupType$1["LocalAdmin"] = "8";
	GroupType$1["Calendar"] = "9";
	GroupType$1["Template"] = "10";
	GroupType$1["ContactList"] = "11";
	return GroupType$1;
}({});
const GroupTypeNameByCode = reverse(GroupType);
const getMembershipGroupType = (membership) => downcast(membership.groupType);
let PermissionType = function(PermissionType$1) {
	/** Used in combination with bucket permission to send multiple things encrypted with the same public key. */
	PermissionType$1["Public"] = "0";
	/** Used to encrypt an instance for another group (which we are member of). */
	PermissionType$1["Symmetric"] = "1";
	/** Used to updating public permission with symmetric key. */
	PermissionType$1["Public_Symmetric"] = "2";
	/** Instances without ownerEncSessionKey (e.g. MailBody, FileData) after asymmetric decryption, used for reference counting. */
	PermissionType$1["Unencrypted"] = "3";
	/** Sending parts of email for external users. */
	PermissionType$1["External"] = "5";
	/** Used to mark the owner of the list. */
	PermissionType$1["Owner_List"] = "8";
	return PermissionType$1;
}({});
let BucketPermissionType = function(BucketPermissionType$1) {
	BucketPermissionType$1["Public"] = "2";
	BucketPermissionType$1["External"] = "3";
	return BucketPermissionType$1;
}({});
let MailSetKind = function(MailSetKind$1) {
	MailSetKind$1["CUSTOM"] = "0";
	MailSetKind$1["INBOX"] = "1";
	MailSetKind$1["SENT"] = "2";
	MailSetKind$1["TRASH"] = "3";
	MailSetKind$1["ARCHIVE"] = "4";
	MailSetKind$1["SPAM"] = "5";
	MailSetKind$1["DRAFT"] = "6";
	MailSetKind$1["ALL"] = "7";
	MailSetKind$1["LABEL"] = "8";
	MailSetKind$1["Imported"] = "9";
	return MailSetKind$1;
}({});
function getMailSetKind(folder) {
	return folder.folderType;
}
let ReplyType = function(ReplyType$1) {
	ReplyType$1["NONE"] = "0";
	ReplyType$1["REPLY"] = "1";
	ReplyType$1["FORWARD"] = "2";
	ReplyType$1["REPLY_FORWARD"] = "3";
	return ReplyType$1;
}({});
let ContactAddressType = function(ContactAddressType$1) {
	ContactAddressType$1["PRIVATE"] = "0";
	ContactAddressType$1["WORK"] = "1";
	ContactAddressType$1["OTHER"] = "2";
	ContactAddressType$1["CUSTOM"] = "3";
	return ContactAddressType$1;
}({});
let ContactPhoneNumberType = function(ContactPhoneNumberType$1) {
	ContactPhoneNumberType$1["PRIVATE"] = "0";
	ContactPhoneNumberType$1["WORK"] = "1";
	ContactPhoneNumberType$1["MOBILE"] = "2";
	ContactPhoneNumberType$1["FAX"] = "3";
	ContactPhoneNumberType$1["OTHER"] = "4";
	ContactPhoneNumberType$1["CUSTOM"] = "5";
	return ContactPhoneNumberType$1;
}({});
let ContactSocialType = function(ContactSocialType$1) {
	ContactSocialType$1["TWITTER"] = "0";
	ContactSocialType$1["FACEBOOK"] = "1";
	ContactSocialType$1["XING"] = "2";
	ContactSocialType$1["LINKED_IN"] = "3";
	ContactSocialType$1["OTHER"] = "4";
	ContactSocialType$1["CUSTOM"] = "5";
	return ContactSocialType$1;
}({});
let ContactRelationshipType = function(ContactRelationshipType$1) {
	ContactRelationshipType$1["PARENT"] = "0";
	ContactRelationshipType$1["BROTHER"] = "1";
	ContactRelationshipType$1["SISTER"] = "2";
	ContactRelationshipType$1["CHILD"] = "3";
	ContactRelationshipType$1["FRIEND"] = "4";
	ContactRelationshipType$1["RELATIVE"] = "5";
	ContactRelationshipType$1["SPOUSE"] = "6";
	ContactRelationshipType$1["PARTNER"] = "7";
	ContactRelationshipType$1["ASSISTANT"] = "8";
	ContactRelationshipType$1["MANAGER"] = "9";
	ContactRelationshipType$1["OTHER"] = "10";
	ContactRelationshipType$1["CUSTOM"] = "11";
	return ContactRelationshipType$1;
}({});
let ContactMessengerHandleType = function(ContactMessengerHandleType$1) {
	ContactMessengerHandleType$1["SIGNAL"] = "0";
	ContactMessengerHandleType$1["WHATSAPP"] = "1";
	ContactMessengerHandleType$1["TELEGRAM"] = "2";
	ContactMessengerHandleType$1["DISCORD"] = "3";
	ContactMessengerHandleType$1["OTHER"] = "4";
	ContactMessengerHandleType$1["CUSTOM"] = "5";
	return ContactMessengerHandleType$1;
}({});
let ContactWebsiteType = function(ContactWebsiteType$1) {
	ContactWebsiteType$1["PRIVATE"] = "0";
	ContactWebsiteType$1["WORK"] = "1";
	ContactWebsiteType$1["OTHER"] = "2";
	ContactWebsiteType$1["CUSTOM"] = "3";
	return ContactWebsiteType$1;
}({});
let ContactCustomDateType = function(ContactCustomDateType$1) {
	ContactCustomDateType$1["ANNIVERSARY"] = "0";
	ContactCustomDateType$1["OTHER"] = "1";
	ContactCustomDateType$1["CUSTOM"] = "2";
	return ContactCustomDateType$1;
}({});
const getContactSocialType = (contactSocialId) => downcast(contactSocialId.type);
const getCustomDateType = (customDate) => downcast(customDate.type);
const getRelationshipType = (relationship) => downcast(relationship.type);
let OperationType = function(OperationType$1) {
	OperationType$1["CREATE"] = "0";
	OperationType$1["UPDATE"] = "1";
	OperationType$1["DELETE"] = "2";
	return OperationType$1;
}({});
let KdfType = function(KdfType$1) {
	KdfType$1["Bcrypt"] = "0";
	KdfType$1["Argon2id"] = "1";
	return KdfType$1;
}({});
const DEFAULT_KDF_TYPE = KdfType.Argon2id;
let AccountType = function(AccountType$1) {
	AccountType$1["SYSTEM"] = "0";
	AccountType$1["FREE"] = "1";
	AccountType$1["STARTER"] = "2";
	AccountType$1["PAID"] = "3";
	AccountType$1["EXTERNAL"] = "5";
	return AccountType$1;
}({});
const AccountTypeNames = {
	[AccountType.SYSTEM]: "System",
	[AccountType.FREE]: "Free",
	[AccountType.STARTER]: "Outlook",
	[AccountType.PAID]: "Paid",
	[AccountType.EXTERNAL]: "External"
};
let CustomDomainType = function(CustomDomainType$1) {
	CustomDomainType$1["NONE"] = "0";
	CustomDomainType$1["ONE"] = "1";
	CustomDomainType$1["THREE"] = "2";
	CustomDomainType$1["TEN"] = "3";
	CustomDomainType$1["UNLIMITED"] = "4";
	return CustomDomainType$1;
}({});
const CustomDomainTypeCount = {
	[CustomDomainType.NONE]: 0,
	[CustomDomainType.ONE]: 1,
	[CustomDomainType.THREE]: 3,
	[CustomDomainType.TEN]: 10,
	[CustomDomainType.UNLIMITED]: -1
};
const CustomDomainTypeCountName = {
	[CustomDomainType.NONE]: "0",
	[CustomDomainType.ONE]: "1",
	[CustomDomainType.THREE]: "3",
	[CustomDomainType.TEN]: "10",
	[CustomDomainType.UNLIMITED]: "∞"
};
let PlanType = function(PlanType$1) {
	PlanType$1["Premium"] = "0";
	PlanType$1["Pro"] = "2";
	PlanType$1["Teams"] = "3";
	PlanType$1["PremiumBusiness"] = "4";
	PlanType$1["TeamsBusiness"] = "5";
	PlanType$1["Revolutionary"] = "6";
	PlanType$1["Legend"] = "7";
	PlanType$1["Essential"] = "8";
	PlanType$1["Advanced"] = "9";
	PlanType$1["Unlimited"] = "10";
	PlanType$1["Free"] = "11";
	return PlanType$1;
}({});
const AvailablePlans = [
	PlanType.Free,
	PlanType.Revolutionary,
	PlanType.Legend,
	PlanType.Essential,
	PlanType.Advanced,
	PlanType.Unlimited
];
const NewPaidPlans = [
	PlanType.Revolutionary,
	PlanType.Legend,
	PlanType.Essential,
	PlanType.Advanced,
	PlanType.Unlimited
];
const NewBusinessPlans = [
	PlanType.Essential,
	PlanType.Advanced,
	PlanType.Unlimited
];
const NewPersonalPlans = [
	PlanType.Free,
	PlanType.Revolutionary,
	PlanType.Legend
];
const LegacyPlans = [
	PlanType.Premium,
	PlanType.PremiumBusiness,
	PlanType.Teams,
	PlanType.TeamsBusiness,
	PlanType.Pro
];
const HighlightedPlans = [PlanType.Revolutionary, PlanType.Advanced];
const HighestTierPlans = [PlanType.Legend, PlanType.Unlimited];
const PlanTypeToName = reverse(PlanType);
let SubscriptionType = function(SubscriptionType$1) {
	SubscriptionType$1[SubscriptionType$1["Personal"] = 0] = "Personal";
	SubscriptionType$1[SubscriptionType$1["Business"] = 1] = "Business";
	SubscriptionType$1[SubscriptionType$1["PaidPersonal"] = 2] = "PaidPersonal";
	return SubscriptionType$1;
}({});
let BookingItemFeatureType = function(BookingItemFeatureType$1) {
	BookingItemFeatureType$1["LegacyUsers"] = "0";
	BookingItemFeatureType$1["Storage"] = "1";
	BookingItemFeatureType$1["Alias"] = "2";
	BookingItemFeatureType$1["SharedMailGroup"] = "3";
	BookingItemFeatureType$1["Whitelabel"] = "4";
	BookingItemFeatureType$1["ContactForm"] = "5";
	BookingItemFeatureType$1["WhitelabelChild"] = "6";
	BookingItemFeatureType$1["LocalAdminGroup"] = "7";
	BookingItemFeatureType$1["Discount"] = "8";
	BookingItemFeatureType$1["Sharing"] = "9";
	BookingItemFeatureType$1["Business"] = "10";
	BookingItemFeatureType$1["Revolutionary"] = "11";
	BookingItemFeatureType$1["Legend"] = "12";
	BookingItemFeatureType$1["Essential"] = "13";
	BookingItemFeatureType$1["Advanced"] = "14";
	BookingItemFeatureType$1["Unlimited"] = "15";
	return BookingItemFeatureType$1;
}({});
const BookingItemFeatureByCode = reverse(BookingItemFeatureType);
const getPaymentMethodType = (accountingInfo) => downcast(accountingInfo.paymentMethod);
let PaymentMethodType = function(PaymentMethodType$1) {
	PaymentMethodType$1["Invoice"] = "0";
	PaymentMethodType$1["CreditCard"] = "1";
	PaymentMethodType$1["Sepa"] = "2";
	PaymentMethodType$1["Paypal"] = "3";
	PaymentMethodType$1["AccountBalance"] = "4";
	PaymentMethodType$1["AppStore"] = "5";
	return PaymentMethodType$1;
}({});
async function getDefaultPaymentMethod() {
	if (isIOSApp()) return PaymentMethodType.AppStore;
	return PaymentMethodType.CreditCard;
}
const PaymentMethodTypeToName = reverse(PaymentMethodType);
const Const = {
	INITIAL_UPGRADE_REMINDER_INTERVAL_MS: 14 * DAY_IN_MILLIS,
	REPEATED_UPGRADE_REMINDER_INTERVAL_MS: 90 * DAY_IN_MILLIS,
	MEMORY_GB_FACTOR: 1e9,
	MEMORY_WARNING_FACTOR: .9,
	CURRENT_DATE: null,
	CURRENCY_SYMBOL_EUR: "€",
	DEFAULT_APP_DOMAIN: "app.tuta.com",
	LEGACY_WEBAUTHN_RP_ID: "tutanota.com",
	WEBAUTHN_RP_ID: "tuta.com",
	U2f_APPID_SUFFIX: "/u2f-appid.json",
	U2F_LEGACY_APPID: "https://tutanota.com/u2f-appid.json",
	EXECUTE_KDF_MIGRATION: true
};
const TUTA_MAIL_ADDRESS_DOMAINS = Object.freeze([
	"tuta.com",
	"tutamail.com",
	"tuta.io",
	"tutanota.com",
	"tutanota.de",
	"keemail.me"
]);
const TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS = TUTA_MAIL_ADDRESS_DOMAINS;
const DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN = "tuta.com";
const DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN = "tutamail.com";
let ConversationType = function(ConversationType$1) {
	ConversationType$1["NEW"] = "0";
	ConversationType$1["REPLY"] = "1";
	ConversationType$1["FORWARD"] = "2";
	/**  a message for which no mail exists in Tuta (unknown external mail or deleted mail) */
	ConversationType$1["UNKNOWN"] = "3";
	return ConversationType$1;
}({});
let MailState = function(MailState$1) {
	MailState$1["DRAFT"] = "0";
	MailState$1["SENT"] = "1";
	MailState$1["RECEIVED"] = "2";
	MailState$1["SENDING"] = "3";
	return MailState$1;
}({});
let ApprovalStatus = function(ApprovalStatus$1) {
	ApprovalStatus$1["REGISTRATION_APPROVED"] = "0";
	ApprovalStatus$1["REGISTRATION_APPROVAL_NEEDED"] = "1";
	ApprovalStatus$1["SEND_MAILS_APPROVED"] = "2";
	ApprovalStatus$1["INVOICE_NOT_PAID"] = "3";
	ApprovalStatus$1["SPAM_SENDER"] = "4";
	ApprovalStatus$1["DELAYED"] = "5";
	ApprovalStatus$1["DELAYED_AND_INITIALLY_ACCESSED"] = "6";
	ApprovalStatus$1["REGISTRATION_APPROVAL_NEEDED_AND_INITIALLY_ACCESSED"] = "7";
	ApprovalStatus$1["PAID_SUBSCRIPTION_NEEDED"] = "8";
	ApprovalStatus$1["INITIAL_PAYMENT_PENDING"] = "9";
	ApprovalStatus$1["NO_ACTIVITY"] = "10";
	return ApprovalStatus$1;
}({});
function getCustomerApprovalStatus(customer) {
	return downcast(customer.approvalStatus);
}
let InboxRuleType = function(InboxRuleType$1) {
	InboxRuleType$1["FROM_EQUALS"] = "0";
	InboxRuleType$1["RECIPIENT_TO_EQUALS"] = "1";
	InboxRuleType$1["RECIPIENT_CC_EQUALS"] = "2";
	InboxRuleType$1["RECIPIENT_BCC_EQUALS"] = "3";
	InboxRuleType$1["SUBJECT_CONTAINS"] = "4";
	InboxRuleType$1["MAIL_HEADER_CONTAINS"] = "5";
	return InboxRuleType$1;
}({});
let SpamRuleType = function(SpamRuleType$1) {
	SpamRuleType$1["WHITELIST"] = "1";
	SpamRuleType$1["BLACKLIST"] = "2";
	SpamRuleType$1["DISCARD"] = "3";
	return SpamRuleType$1;
}({});
function getSpamRuleType(spamRule) {
	return getAsEnumValue(SpamRuleType, spamRule.type);
}
let SpamRuleFieldType = function(SpamRuleFieldType$1) {
	SpamRuleFieldType$1["FROM"] = "0";
	SpamRuleFieldType$1["TO"] = "1";
	SpamRuleFieldType$1["CC"] = "2";
	SpamRuleFieldType$1["BCC"] = "3";
	return SpamRuleFieldType$1;
}({});
function getSpamRuleField(spamRule) {
	return downcast(spamRule.field);
}
let ReportMovedMailsType = function(ReportMovedMailsType$1) {
	ReportMovedMailsType$1["ALWAYS_ASK"] = "0";
	ReportMovedMailsType$1["AUTOMATICALLY_ONLY_SPAM"] = "1";
	ReportMovedMailsType$1["NEVER"] = "3";
	return ReportMovedMailsType$1;
}({});
let EmailSignatureType = function(EmailSignatureType$1) {
	EmailSignatureType$1["EMAIL_SIGNATURE_TYPE_DEFAULT"] = "0";
	EmailSignatureType$1["EMAIL_SIGNATURE_TYPE_CUSTOM"] = "1";
	EmailSignatureType$1["EMAIL_SIGNATURE_TYPE_NONE"] = "2";
	return EmailSignatureType$1;
}({});
let CustomDomainValidationResult = function(CustomDomainValidationResult$1) {
	CustomDomainValidationResult$1["CUSTOM_DOMAIN_VALIDATION_RESULT_OK"] = "0";
	CustomDomainValidationResult$1["CUSTOM_DOMAIN_VALIDATION_RESULT_DNS_LOOKUP_FAILED"] = "1";
	CustomDomainValidationResult$1["CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_FOUND"] = "2";
	CustomDomainValidationResult$1["CUSTOM_DOMAIN_VALIDATION_RESULT_NAMESERVER_NOT_FOUND"] = "3";
	CustomDomainValidationResult$1["CUSTOM_DOMAIN_VALIDATION_RESULT_DOMAIN_NOT_AVAILABLE"] = "4";
	CustomDomainValidationResult$1["CUSTOM_DOMAIN_VALIDATION_RESULT_VALIDATION_FAILED"] = "5";
	return CustomDomainValidationResult$1;
}({});
let CustomDomainCheckResult = function(CustomDomainCheckResult$1) {
	CustomDomainCheckResult$1["CUSTOM_DOMAIN_CHECK_RESULT_OK"] = "0";
	CustomDomainCheckResult$1["CUSTOM_DOMAIN_CHECK_RESULT_DNS_LOOKUP_FAILED"] = "1";
	CustomDomainCheckResult$1["CUSTOM_DOMAIN_CHECK_RESULT_DOMAIN_NOT_FOUND"] = "2";
	CustomDomainCheckResult$1["CUSTOM_DOMAIN_CHECK_RESULT_NAMESERVER_NOT_FOUND"] = "3";
	return CustomDomainCheckResult$1;
}({});
let DnsRecordType = function(DnsRecordType$1) {
	DnsRecordType$1["DNS_RECORD_TYPE_MX"] = "0";
	DnsRecordType$1["DNS_RECORD_TYPE_TXT_SPF"] = "1";
	DnsRecordType$1["DNS_RECORD_TYPE_CNAME_DKIM"] = "2";
	DnsRecordType$1["DNS_RECORD_TYPE_TXT_DMARC"] = "3";
	DnsRecordType$1["DNS_RECORD_TYPE_CNAME_MTA_STS"] = "4";
	DnsRecordType$1["DNS_RECORD_TYPE_TXT_VERIFY"] = "5";
	return DnsRecordType$1;
}({});
let SessionState = function(SessionState$1) {
	SessionState$1["SESSION_STATE_ACTIVE"] = "0";
	SessionState$1["SESSION_STATE_EXPIRED"] = "1";
	SessionState$1["SESSION_STATE_DELETED"] = "2";
	SessionState$1["SESSION_STATE_PENDING"] = "3";
	return SessionState$1;
}({});
let PushServiceType = function(PushServiceType$1) {
	PushServiceType$1["ANDROID"] = "0";
	PushServiceType$1["IOS"] = "1";
	PushServiceType$1["EMAIL"] = "2";
	PushServiceType$1["SSE"] = "3";
	return PushServiceType$1;
}({});
let InputFieldType = function(InputFieldType$1) {
	InputFieldType$1["TEXT"] = "0";
	InputFieldType$1["NUMBER"] = "1";
	InputFieldType$1["ENUM"] = "2";
	return InputFieldType$1;
}({});
let SecondFactorType = function(SecondFactorType$1) {
	SecondFactorType$1["u2f"] = "0";
	SecondFactorType$1["totp"] = "1";
	SecondFactorType$1["webauthn"] = "2";
	return SecondFactorType$1;
}({});
const MAX_ATTACHMENT_SIZE = 26214400;
const MAX_LOGO_SIZE = 102400;
const MAX_BASE64_IMAGE_SIZE = MAX_LOGO_SIZE;
const ALLOWED_IMAGE_FORMATS = [
	"png",
	"jpg",
	"jpeg",
	"svg"
];
let FeatureType = function(FeatureType$1) {
	FeatureType$1["DisableContacts"] = "0";
	FeatureType$1["DisableMailExport"] = "1";
	FeatureType$1["InternalCommunication"] = "2";
	FeatureType$1["DeleteMailsOnPasswordReset"] = "3";
	FeatureType$1["WhitelabelParent"] = "4";
	FeatureType$1["WhitelabelChild"] = "5";
	FeatureType$1["ReplyOnly"] = "6";
	FeatureType$1["DisableDefaultSignature"] = "7";
	FeatureType$1["HideBuyDialogs"] = "8";
	FeatureType$1["DisableCalendar"] = "9";
	FeatureType$1["ExternalEmailProvider"] = "10";
	/** This is required for non admin users because they are not allowed to access the bookings. */
	FeatureType$1["BusinessFeatureEnabled"] = "11";
	FeatureType$1["AffiliatePartner"] = "12";
	FeatureType$1["KnowledgeBase"] = "13";
	FeatureType$1["Newsletter"] = "14";
	FeatureType$1["Unused15"] = "15";
	FeatureType$1["Unused16"] = "16";
	FeatureType$1["MultipleUsers"] = "17";
	return FeatureType$1;
}({});
const FULL_INDEXED_TIMESTAMP = 0;
const NOTHING_INDEXED_TIMESTAMP = Math.pow(2, 42) - 1;
const ENTITY_EVENT_BATCH_TTL_DAYS = 45;
let PaymentDataResultType = function(PaymentDataResultType$1) {
	PaymentDataResultType$1["OK"] = "0";
	PaymentDataResultType$1["COUNTRY_MISMATCH"] = "1";
	PaymentDataResultType$1["INVALID_VATID_NUMBER"] = "2";
	PaymentDataResultType$1["CREDIT_CARD_DECLINED"] = "3";
	PaymentDataResultType$1["CREDIT_CARD_CVV_INVALID"] = "4";
	PaymentDataResultType$1["PAYMENT_PROVIDER_NOT_AVAILABLE"] = "5";
	PaymentDataResultType$1["OTHER_PAYMENT_PROVIDER_ERROR"] = "6";
	PaymentDataResultType$1["OTHER_PAYMENT_ACCOUNT_REJECTED"] = "7";
	PaymentDataResultType$1["COULD_NOT_VERIFY_VATID"] = "8";
	PaymentDataResultType$1["CREDIT_CARD_DATE_INVALID"] = "9";
	PaymentDataResultType$1["CREDIT_CARD_NUMBER_INVALID"] = "10";
	PaymentDataResultType$1["CREDIT_CARD_VERIFICATION_LIMIT_REACHED"] = "11";
	return PaymentDataResultType$1;
}({});
let ContactComparisonResult = function(ContactComparisonResult$1) {
	ContactComparisonResult$1["Unique"] = "unique";
	ContactComparisonResult$1["Similar"] = "similar";
	ContactComparisonResult$1["Equal"] = "equal";
	return ContactComparisonResult$1;
}({});
let IndifferentContactComparisonResult = function(IndifferentContactComparisonResult$1) {
	IndifferentContactComparisonResult$1["OneEmpty"] = "oneEmpty";
	IndifferentContactComparisonResult$1["BothEmpty"] = "bothEmpty";
	return IndifferentContactComparisonResult$1;
}({});
let ContactMergeAction = function(ContactMergeAction$1) {
	ContactMergeAction$1["DeleteFirst"] = "deleteFirst";
	ContactMergeAction$1["DeleteSecond"] = "deleteSecond";
	ContactMergeAction$1["Merge"] = "merge";
	ContactMergeAction$1["Skip"] = "skip";
	ContactMergeAction$1["Cancel"] = "cancel";
	return ContactMergeAction$1;
}({});
let InvoiceStatus = function(InvoiceStatus$1) {
	InvoiceStatus$1["CREATED"] = "0";
	InvoiceStatus$1["PUBLISHEDFORAUTOMATIC"] = "1";
	InvoiceStatus$1["PUBLISHEDFORMANUAL"] = "2";
	InvoiceStatus$1["PAID"] = "3";
	InvoiceStatus$1["DEBITFAILED"] = "4";
	InvoiceStatus$1["DISPUTED"] = "5";
	InvoiceStatus$1["CANCELLED"] = "6";
	InvoiceStatus$1["PARTNERMANAGED"] = "7";
	InvoiceStatus$1["FIRSTREMINDER"] = "8";
	InvoiceStatus$1["REFUNDED"] = "9";
	InvoiceStatus$1["DISPUTEACCEPTED"] = "10";
	InvoiceStatus$1["SECONDREMINDER"] = "11";
	return InvoiceStatus$1;
}({});
let CloseEventBusOption = function(CloseEventBusOption$1) {
	CloseEventBusOption$1["Terminate"] = "terminate";
	CloseEventBusOption$1["Reconnect"] = "reconnect";
	CloseEventBusOption$1["Pause"] = "pause";
	return CloseEventBusOption$1;
}({});
let Announcement = function(Announcement$1) {
	Announcement$1["None"] = "0";
	Announcement$1["StorageDeletion"] = "1";
	return Announcement$1;
}({});
let CertificateState = function(CertificateState$1) {
	CertificateState$1["VALID"] = "0";
	CertificateState$1["VALIDATING"] = "1";
	CertificateState$1["INVALID"] = "2";
	return CertificateState$1;
}({});
let CertificateType = function(CertificateType$1) {
	CertificateType$1["MANUAL"] = "0";
	CertificateType$1["LETS_ENCRYPT"] = "1";
	return CertificateType$1;
}({});
let RepeatPeriod = function(RepeatPeriod$1) {
	RepeatPeriod$1["DAILY"] = "0";
	RepeatPeriod$1["WEEKLY"] = "1";
	RepeatPeriod$1["MONTHLY"] = "2";
	RepeatPeriod$1["ANNUALLY"] = "3";
	return RepeatPeriod$1;
}({});
let EndType = function(EndType$1) {
	EndType$1["Never"] = "0";
	EndType$1["Count"] = "1";
	EndType$1["UntilDate"] = "2";
	return EndType$1;
}({});
const defaultCalendarColor = "2196f3";
let EventTextTimeOption = function(EventTextTimeOption$1) {
	EventTextTimeOption$1["START_TIME"] = "startTime";
	EventTextTimeOption$1["END_TIME"] = "endTime";
	EventTextTimeOption$1["START_END_TIME"] = "startAndEndTime";
	return EventTextTimeOption$1;
}({});
let TimeFormat = function(TimeFormat$1) {
	TimeFormat$1["TWENTY_FOUR_HOURS"] = "0";
	TimeFormat$1["TWELVE_HOURS"] = "1";
	return TimeFormat$1;
}({});
let WeekStart = function(WeekStart$1) {
	WeekStart$1["MONDAY"] = "0";
	WeekStart$1["SUNDAY"] = "1";
	WeekStart$1["SATURDAY"] = "2";
	return WeekStart$1;
}({});
function getWeekStart(userSettings) {
	return downcast(userSettings.startOfTheWeek);
}
let ShareCapability = function(ShareCapability$1) {
	ShareCapability$1["Read"] = "0";
	ShareCapability$1["Write"] = "1";
	ShareCapability$1["Invite"] = "2";
	return ShareCapability$1;
}({});
const SECOND_MS = 1e3;
let PostingType = function(PostingType$1) {
	PostingType$1["Generic"] = "0";
	PostingType$1["UsageFee"] = "1";
	PostingType$1["Credit"] = "2";
	PostingType$1["Dispute"] = "3";
	PostingType$1["Suspension"] = "4";
	PostingType$1["Payment"] = "5";
	PostingType$1["Refund"] = "6";
	PostingType$1["SuspensionCancel"] = "7";
	PostingType$1["GiftCard"] = "8";
	PostingType$1["SalesCommission"] = "9";
	return PostingType$1;
}({});
let CounterType = function(CounterType$1) {
	CounterType$1["Default"] = "0";
	CounterType$1["Signup"] = "1";
	CounterType$1["UnreadMails"] = "2";
	CounterType$1["UserStorageLegacy"] = "3";
	CounterType$1["GroupStorageLegacy"] = "4";
	CounterType$1["UserStorage"] = "5";
	CounterType$1["GroupStorage"] = "6";
	return CounterType$1;
}({});
const CounterTypeToName = reverse(CounterType);
let UnsubscribeFailureReason = function(UnsubscribeFailureReason$1) {
	UnsubscribeFailureReason$1["TOO_MANY_ENABLED_USERS"] = "unsubscribe.too_many_users";
	UnsubscribeFailureReason$1["CUSTOM_MAIL_ADDRESS"] = "unsubscribe.custom_mail_address";
	UnsubscribeFailureReason$1["TOO_MANY_CALENDARS"] = "unsubscribe.too_many_calendars";
	UnsubscribeFailureReason$1["CALENDAR_TYPE"] = "unsubscirbe.invalid_calendar_type";
	UnsubscribeFailureReason$1["TOO_MANY_ALIASES"] = "unsubscribe.too_many_aliases";
	UnsubscribeFailureReason$1["TOO_MUCH_STORAGE_USED"] = "unsubscribe.too_much_storage";
	UnsubscribeFailureReason$1["TOO_MANY_DOMAINS"] = "unsubscribe.too_many_domains";
	UnsubscribeFailureReason$1["HAS_TEMPLATE_GROUP"] = "unsubscribe.has_template_group";
	UnsubscribeFailureReason$1["WHITELABEL_DOMAIN_ACTIVE"] = "unsubscribe.whitelabel_domain_active";
	UnsubscribeFailureReason$1["SHARED_GROUP_ACTIVE"] = "unsubscribe.shared_group_active";
	UnsubscribeFailureReason$1["HAS_CONTACT_FORM"] = "unsubscribe.has_contact_form";
	UnsubscribeFailureReason$1["NOT_ENOUGH_CREDIT"] = "unsubscribe.not_enough_credit";
	UnsubscribeFailureReason$1["INVOICE_NOT_PAID"] = "unsubscribe.invoice_not_paid";
	UnsubscribeFailureReason$1["HAS_CONTACT_LIST_GROUP"] = "unsubscribe.has_contact_list_group";
	UnsubscribeFailureReason$1["ACTIVE_APPSTORE_SUBSCRIPTION"] = "unsubscribe.active_appstore_subscription";
	UnsubscribeFailureReason$1["LABEL_LIMIT_EXCEEDED"] = "unsubscribe.label_limit_exceeded";
	return UnsubscribeFailureReason$1;
}({});
let BookingFailureReason = function(BookingFailureReason$1) {
	BookingFailureReason$1["TOO_MANY_DOMAINS"] = "bookingservice.too_many_domains";
	BookingFailureReason$1["TOO_MANY_ALIASES"] = "bookingservice.too_many_aliases";
	BookingFailureReason$1["TOO_MUCH_STORAGE_USED"] = "bookingservice.too_much_storage_used";
	BookingFailureReason$1["SHARED_GROUP_ACTIVE"] = "bookingservice.shared_group_active";
	BookingFailureReason$1["WHITELABEL_DOMAIN_ACTIVE"] = "bookingservice.whitelabel_domain_active";
	BookingFailureReason$1["HAS_TEMPLATE_GROUP"] = "bookingservice.has_template_group";
	return BookingFailureReason$1;
}({});
const Keys = Object.freeze({
	NONE: {
		code: "",
		name: ""
	},
	RETURN: {
		code: "enter",
		name: "⏎"
	},
	BACKSPACE: {
		code: "backspace",
		name: "BACKSPACE"
	},
	TAB: {
		code: "tab",
		name: "↹"
	},
	SHIFT: {
		code: "shift",
		name: "⇧"
	},
	CTRL: {
		code: "control",
		name: "CTRL"
	},
	ALT: {
		code: "alt",
		name: "ALT"
	},
	META: {
		code: "meta",
		name: "⌘"
	},
	ESC: {
		code: "escape",
		name: "ESC"
	},
	SPACE: {
		code: " ",
		name: "Space"
	},
	PAGE_UP: {
		code: "pageup",
		name: "Page ↑"
	},
	PAGE_DOWN: {
		code: "pagedown",
		name: "Page ↓"
	},
	END: {
		code: "end",
		name: "End"
	},
	HOME: {
		code: "home",
		name: "Home"
	},
	LEFT: {
		code: "arrowleft",
		name: "←"
	},
	UP: {
		code: "arrowup",
		name: "↑"
	},
	RIGHT: {
		code: "arrowright",
		name: "→"
	},
	DOWN: {
		code: "arrowdown",
		name: "↓"
	},
	DELETE: {
		code: "delete",
		name: "DEL"
	},
	"0": {
		code: "0",
		name: "0"
	},
	ONE: {
		code: "1",
		name: "1"
	},
	TWO: {
		code: "2",
		name: "2"
	},
	THREE: {
		code: "3",
		name: "3"
	},
	FOUR: {
		code: "4",
		name: "4"
	},
	FIVE: {
		code: "5",
		name: "5"
	},
	SIX: {
		code: "6",
		name: "6"
	},
	A: {
		code: "a",
		name: "A"
	},
	B: {
		code: "b",
		name: "B"
	},
	C: {
		code: "c",
		name: "C"
	},
	D: {
		code: "d",
		name: "D"
	},
	E: {
		code: "e",
		name: "E"
	},
	F: {
		code: "f",
		name: "F"
	},
	H: {
		code: "h",
		name: "H"
	},
	I: {
		code: "i",
		name: "I"
	},
	J: {
		code: "j",
		name: "J"
	},
	K: {
		code: "k",
		name: "K"
	},
	L: {
		code: "l",
		name: "L"
	},
	M: {
		code: "m",
		name: "M"
	},
	N: {
		code: "n",
		name: "N"
	},
	O: {
		code: "o",
		name: "O"
	},
	P: {
		code: "p",
		name: "P"
	},
	Q: {
		code: "q",
		name: "Q"
	},
	R: {
		code: "r",
		name: "R"
	},
	S: {
		code: "s",
		name: "S"
	},
	T: {
		code: "t",
		name: "T"
	},
	U: {
		code: "u",
		name: "U"
	},
	V: {
		code: "v",
		name: "V"
	},
	F1: {
		code: "f1",
		name: "F1"
	},
	F5: {
		code: "f5",
		name: "F5"
	},
	F11: {
		code: "f11",
		name: "F11"
	},
	F12: {
		code: "f12",
		name: "F12"
	}
});
let TabIndex = function(TabIndex$1) {
	TabIndex$1["Programmatic"] = "-1";
	TabIndex$1["Default"] = "0";
	return TabIndex$1;
}({});
let ReportedMailFieldType = function(ReportedMailFieldType$1) {
	/**
	* From header address, authenticated.
	*/
	ReportedMailFieldType$1["FROM_ADDRESS"] = "0";
	/**
	* From header address, not authenticated with DMARC.
	*/
	ReportedMailFieldType$1["FROM_ADDRESS_NON_AUTH"] = "1";
	/**
	* From header address domain
	*/
	ReportedMailFieldType$1["FROM_DOMAIN"] = "2";
	/**
	* From header address domain, not authenticated not authenticated with DMARC.
	*/
	ReportedMailFieldType$1["FROM_DOMAIN_NON_AUTH"] = "3";
	/**
	* Email subject
	*/
	ReportedMailFieldType$1["SUBJECT"] = "4";
	/**
	* Link in the body of email
	*/
	ReportedMailFieldType$1["LINK"] = "5";
	/**
	* Domain of the link in the body
	*/
	ReportedMailFieldType$1["LINK_DOMAIN"] = "6";
	return ReportedMailFieldType$1;
}({});
let MailPhishingStatus = function(MailPhishingStatus$1) {
	MailPhishingStatus$1["UNKNOWN"] = "0";
	MailPhishingStatus$1["SUSPICIOUS"] = "1";
	MailPhishingStatus$1["WHITELISTED"] = "2";
	return MailPhishingStatus$1;
}({});
let PhishingMarkerStatus = function(PhishingMarkerStatus$1) {
	PhishingMarkerStatus$1["ACTIVE"] = "0";
	PhishingMarkerStatus$1["INACTIVE"] = "1";
	return PhishingMarkerStatus$1;
}({});
let MailAuthenticationStatus = function(MailAuthenticationStatus$1) {
	/**
	* Disposition: None. All checks have passed.
	*/
	MailAuthenticationStatus$1["AUTHENTICATED"] = "0";
	/**
	* Authentication has failed because of the domain policy or because of the SPF.
	*/
	MailAuthenticationStatus$1["HARD_FAIL"] = "1";
	/**
	* Authentication has failed because of our own policy, most commonly authentication is "missing".
	*/
	MailAuthenticationStatus$1["SOFT_FAIL"] = "2";
	/**
	* Authentication has failed because From header is not valid so we couldn't do authentication checks.
	*/
	MailAuthenticationStatus$1["INVALID_MAIL_FROM"] = "3";
	/**
	* Authentication has failed because From header is missing. Most likely it is some technical message like bounce mail.
	*/
	MailAuthenticationStatus$1["MISSING_MAIL_FROM"] = "4";
	return MailAuthenticationStatus$1;
}({});
let EncryptionAuthStatus = function(EncryptionAuthStatus$1) {
	/** the entity was encrypted with RSA, it had no authentication*/
	EncryptionAuthStatus$1["RSA_NO_AUTHENTICATION"] = "0";
	/** the entity was encrypted with tuta-crypt and authentication succeeded */
	EncryptionAuthStatus$1["TUTACRYPT_AUTHENTICATION_SUCCEEDED"] = "1";
	/** the entity was encrypted with tuta-crypt and authentication failed */
	EncryptionAuthStatus$1["TUTACRYPT_AUTHENTICATION_FAILED"] = "2";
	/** the entity was encrypted symmetrically, with AES, it had no authentication, e.g. secure external mailboxes */
	EncryptionAuthStatus$1["AES_NO_AUTHENTICATION"] = "3";
	/** the entity was sent by us encrypted with TutaCrypt, so it is authenticated */
	EncryptionAuthStatus$1["TUTACRYPT_SENDER"] = "4";
	return EncryptionAuthStatus$1;
}({});
let MailReportType = function(MailReportType$1) {
	MailReportType$1["PHISHING"] = "0";
	MailReportType$1["SPAM"] = "1";
	return MailReportType$1;
}({});
let DnsRecordValidation = function(DnsRecordValidation$1) {
	DnsRecordValidation$1["OK"] = "✓";
	DnsRecordValidation$1["BAD"] = "✗";
	return DnsRecordValidation$1;
}({});
let CalendarAttendeeStatus = function(CalendarAttendeeStatus$1) {
	/** invite is not sent yet */
	CalendarAttendeeStatus$1["ADDED"] = "0";
	/** already invited but did not respond */
	CalendarAttendeeStatus$1["NEEDS_ACTION"] = "1";
	CalendarAttendeeStatus$1["ACCEPTED"] = "2";
	CalendarAttendeeStatus$1["DECLINED"] = "3";
	CalendarAttendeeStatus$1["TENTATIVE"] = "4";
	return CalendarAttendeeStatus$1;
}({});
function getAttendeeStatus(attendee) {
	return downcast(attendee.status);
}
let CalendarMethod = function(CalendarMethod$1) {
	CalendarMethod$1["PUBLISH"] = "PUBLISH";
	CalendarMethod$1["REQUEST"] = "REQUEST";
	CalendarMethod$1["REPLY"] = "REPLY";
	CalendarMethod$1["ADD"] = "ADD";
	CalendarMethod$1["CANCEL"] = "CANCEL";
	CalendarMethod$1["REFRESH"] = "REFRESH";
	CalendarMethod$1["COUNTER"] = "COUNTER";
	CalendarMethod$1["DECLINECOUNTER"] = "DECLINECOUNTER";
	return CalendarMethod$1;
}({});
let MailMethod = function(MailMethod$1) {
	MailMethod$1["NONE"] = "0";
	MailMethod$1["ICAL_PUBLISH"] = "1";
	MailMethod$1["ICAL_REQUEST"] = "2";
	MailMethod$1["ICAL_REPLY"] = "3";
	MailMethod$1["ICAL_ADD"] = "4";
	MailMethod$1["ICAL_CANCEL"] = "5";
	MailMethod$1["ICAL_REFRESH"] = "6";
	MailMethod$1["ICAL_COUNTER"] = "7";
	MailMethod$1["ICAL_DECLINECOUNTER"] = "8";
	return MailMethod$1;
}({});
function mailMethodToCalendarMethod(mailMethod) {
	switch (mailMethod) {
		case MailMethod.ICAL_PUBLISH: return CalendarMethod.PUBLISH;
		case MailMethod.ICAL_REQUEST: return CalendarMethod.REQUEST;
		case MailMethod.ICAL_REPLY: return CalendarMethod.REPLY;
		case MailMethod.ICAL_ADD: return CalendarMethod.ADD;
		case MailMethod.ICAL_CANCEL: return CalendarMethod.CANCEL;
		case MailMethod.ICAL_REFRESH: return CalendarMethod.REFRESH;
		case MailMethod.ICAL_COUNTER: return CalendarMethod.COUNTER;
		case MailMethod.ICAL_DECLINECOUNTER: return CalendarMethod.DECLINECOUNTER;
		default: throw new ProgrammingError("Unhandled MailMethod: " + mailMethod);
	}
}
function getAsEnumValue(enumValues, value) {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		const enumValue = enumValues[key];
		if (enumValue === value) return enumValue;
	}
	return null;
}
function assertEnumValue(enumValues, value) {
	for (const key of Object.getOwnPropertyNames(enumValues)) {
		const enumValue = enumValues[key];
		if (enumValue === value) return enumValue;
	}
	throw new Error(`Invalid enum value ${value} for ${JSON.stringify(enumValues)}`);
}
let ClientType = function(ClientType$1) {
	ClientType$1["Browser"] = "0";
	ClientType$1["Desktop"] = "1";
	ClientType$1["App"] = "2";
	return ClientType$1;
}({});
function getClientType() {
	return isApp() ? ClientType.App : isElectronClient() ? ClientType.Desktop : ClientType.Browser;
}
let ExternalImageRule = function(ExternalImageRule$1) {
	ExternalImageRule$1["None"] = "0";
	ExternalImageRule$1["Allow"] = "1";
	ExternalImageRule$1["Block"] = "2";
	return ExternalImageRule$1;
}({});
let UsageTestState = function(UsageTestState$1) {
	UsageTestState$1["Created"] = "0";
	UsageTestState$1["Live"] = "1";
	UsageTestState$1["Paused"] = "2";
	UsageTestState$1["Finished"] = "3";
	return UsageTestState$1;
}({});
const UsageTestStateToName = reverse(UsageTestState);
let UsageTestMetricType = function(UsageTestMetricType$1) {
	UsageTestMetricType$1["Number"] = "0";
	UsageTestMetricType$1["Enum"] = "1";
	UsageTestMetricType$1["Likert"] = "2";
	return UsageTestMetricType$1;
}({});
const UsageTestMetricTypeToName = reverse(UsageTestMetricType);
let ArchiveDataType = function(ArchiveDataType$1) {
	ArchiveDataType$1["AuthorityRequests"] = "0";
	ArchiveDataType$1["Attachments"] = "1";
	ArchiveDataType$1["MailDetails"] = "2";
	return ArchiveDataType$1;
}({});
const OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS = 31;
let UsageTestParticipationMode = function(UsageTestParticipationMode$1) {
	UsageTestParticipationMode$1["Once"] = "0";
	UsageTestParticipationMode$1["Unlimited"] = "1";
	return UsageTestParticipationMode$1;
}({});
const UsageTestParticipationModeToName = reverse(UsageTestParticipationMode);
let TerminationPeriodOptions = function(TerminationPeriodOptions$1) {
	TerminationPeriodOptions$1["EndOfCurrentPeriod"] = "0";
	TerminationPeriodOptions$1["FutureDate"] = "1";
	return TerminationPeriodOptions$1;
}({});
function asKdfType(maybe) {
	if (Object.values(KdfType).includes(maybe)) return maybe;
	throw new Error("bad kdf type");
}
let CryptoProtocolVersion = function(CryptoProtocolVersion$1) {
	CryptoProtocolVersion$1["RSA"] = "0";
	CryptoProtocolVersion$1["SYMMETRIC_ENCRYPTION"] = "1";
	CryptoProtocolVersion$1["TUTA_CRYPT"] = "2";
	return CryptoProtocolVersion$1;
}({});
function asCryptoProtoocolVersion(maybe) {
	if (Object.values(CryptoProtocolVersion).includes(maybe)) return maybe;
	throw new Error("bad protocol version");
}
let GroupKeyRotationType = function(GroupKeyRotationType$1) {
	GroupKeyRotationType$1["User"] = "0";
	GroupKeyRotationType$1["AdminGroupKeyRotationSingleUserAccount"] = "1";
	GroupKeyRotationType$1["Team"] = "2";
	GroupKeyRotationType$1["UserArea"] = "3";
	GroupKeyRotationType$1["Customer"] = "4";
	GroupKeyRotationType$1["AdminGroupKeyRotationMultipleUserAccount"] = "5";
	GroupKeyRotationType$1["AdminGroupKeyRotationMultipleAdminAccount"] = "6";
	return GroupKeyRotationType$1;
}({});
const GroupKeyRotationTypeNameByCode = reverse(GroupKeyRotationType);
const EXTERNAL_CALENDAR_SYNC_INTERVAL = 18e5;
const DEFAULT_ERROR = "defaultError";
let PublicKeyIdentifierType = function(PublicKeyIdentifierType$1) {
	PublicKeyIdentifierType$1["MAIL_ADDRESS"] = "0";
	PublicKeyIdentifierType$1["GROUP_ID"] = "1";
	return PublicKeyIdentifierType$1;
}({});
let BlobAccessTokenKind = function(BlobAccessTokenKind$1) {
	BlobAccessTokenKind$1["Archive"] = "0";
	BlobAccessTokenKind$1["Instances"] = "1";
	return BlobAccessTokenKind$1;
}({});
const CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID = "clientOnly_birthdays";
const CLIENT_ONLY_CALENDARS = new Map([[CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID, "birthdayCalendar_label"]]);
const DEFAULT_CLIENT_ONLY_CALENDAR_COLORS = new Map([[CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID, "FF9933"]]);
const MAX_LABELS_PER_MAIL = 5;
let ImportStatus = function(ImportStatus$1) {
	ImportStatus$1[ImportStatus$1["Running"] = 0] = "Running";
	ImportStatus$1[ImportStatus$1["Paused"] = 1] = "Paused";
	ImportStatus$1[ImportStatus$1["Canceled"] = 2] = "Canceled";
	ImportStatus$1[ImportStatus$1["Finished"] = 3] = "Finished";
	return ImportStatus$1;
}({});

//#endregion
export { ALLOWED_IMAGE_FORMATS, AccountType, AccountTypeNames, ApprovalStatus, ArchiveDataType, AvailablePlans, BlobAccessTokenKind, BookingFailureReason, BookingItemFeatureType, BucketPermissionType, CLIENT_ONLY_CALENDARS, CLIENT_ONLY_CALENDAR_BIRTHDAYS_BASE_ID, CalendarAttendeeStatus, CalendarMethod, CertificateState, CertificateType, CloseEventBusOption, Const, ContactAddressType, ContactComparisonResult, ContactCustomDateType, ContactMergeAction, ContactMessengerHandleType, ContactPhoneNumberType, ContactRelationshipType, ContactSocialType, ContactWebsiteType, ConversationType, CounterType, CryptoProtocolVersion, CustomDomainCheckResult, CustomDomainTypeCount, CustomDomainValidationResult, DEFAULT_CLIENT_ONLY_CALENDAR_COLORS, DEFAULT_ERROR, DEFAULT_FREE_MAIL_ADDRESS_SIGNUP_DOMAIN, DEFAULT_KDF_TYPE, DEFAULT_PAID_MAIL_ADDRESS_SIGNUP_DOMAIN, DnsRecordType, DnsRecordValidation, ENTITY_EVENT_BATCH_TTL_DAYS, EXTERNAL_CALENDAR_SYNC_INTERVAL, EmailSignatureType, EncryptionAuthStatus, EndType, EventTextTimeOption, ExternalImageRule, FULL_INDEXED_TIMESTAMP, FeatureType, GroupKeyRotationType, GroupType, GroupTypeNameByCode, HighestTierPlans, HighlightedPlans, ImportStatus, InboxRuleType, IndifferentContactComparisonResult, KdfType, Keys, LegacyPlans, MAX_ATTACHMENT_SIZE, MAX_BASE64_IMAGE_SIZE, MAX_BLOB_SIZE_BYTES, MAX_LABELS_PER_MAIL, MAX_LOGO_SIZE, MAX_NBR_MOVE_DELETE_MAIL_SERVICE, MailAuthenticationStatus, MailMethod, MailPhishingStatus, MailReportType, MailSetKind, MailState, NOTHING_INDEXED_TIMESTAMP, NewBusinessPlans, NewPaidPlans, NewPersonalPlans, OFFLINE_STORAGE_DEFAULT_TIME_RANGE_DAYS, OUT_OF_OFFICE_SUBJECT_PREFIX, OperationType, OutOfOfficeNotificationMessageType, PaymentDataResultType, PaymentMethodType, PaymentMethodTypeToName, PermissionType, PhishingMarkerStatus, PlanType, PlanTypeToName, PostingType, PublicKeyIdentifierType, PushServiceType, REQUEST_SIZE_LIMIT_DEFAULT, REQUEST_SIZE_LIMIT_MAP, RepeatPeriod, ReplyType, ReportMovedMailsType, ReportedMailFieldType, SECOND_MS, SYSTEM_GROUP_MAIL_ADDRESS, SecondFactorType, SessionState, ShareCapability, SpamRuleFieldType, SpamRuleType, SubscriptionType, TUTA_MAIL_ADDRESS_DOMAINS, TUTA_MAIL_ADDRESS_SIGNUP_DOMAINS, TabIndex, TerminationPeriodOptions, TimeFormat, UnsubscribeFailureReason, WeekStart, asCryptoProtoocolVersion, asKdfType, assertEnumValue, defaultCalendarColor, getAsEnumValue, getAttendeeStatus, getClientType, getContactSocialType, getCustomDateType, getCustomerApprovalStatus, getDefaultPaymentMethod, getMailFolderType, getMailSetKind, getMembershipGroupType, getPaymentMethodType, getRelationshipType, getSpamRuleField, getSpamRuleType, getWeekStart, isFolder, isLabel, mailMethodToCalendarMethod, reverse };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVHV0YW5vdGFDb25zdGFudHMtY2h1bmsuanMiLCJuYW1lcyI6WyJSRVFVRVNUX1NJWkVfTElNSVRfTUFQOiBNYXA8c3RyaW5nLCBudW1iZXI+IiwiZm9sZGVyOiBNYWlsRm9sZGVyIiwib2JqZWN0TWFwOiBSZWNvcmQ8SywgVj4iLCJtZW1iZXJzaGlwOiBHcm91cE1lbWJlcnNoaXAiLCJjb250YWN0U29jaWFsSWQ6IENvbnRhY3RTb2NpYWxJZCIsImN1c3RvbURhdGU6IENvbnRhY3RDdXN0b21EYXRlIiwicmVsYXRpb25zaGlwOiBDb250YWN0UmVsYXRpb25zaGlwIiwiQWNjb3VudFR5cGVOYW1lczogUmVjb3JkPEFjY291bnRUeXBlLCBzdHJpbmc+IiwiQ3VzdG9tRG9tYWluVHlwZUNvdW50OiBSZWNvcmQ8Q3VzdG9tRG9tYWluVHlwZSwgbnVtYmVyPiIsIkN1c3RvbURvbWFpblR5cGVDb3VudE5hbWU6IFJlY29yZDxDdXN0b21Eb21haW5UeXBlLCBzdHJpbmc+IiwiQXZhaWxhYmxlUGxhbnM6IEF2YWlsYWJsZVBsYW5UeXBlW10iLCJOZXdQYWlkUGxhbnM6IEF2YWlsYWJsZVBsYW5UeXBlW10iLCJOZXdCdXNpbmVzc1BsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdIiwiTmV3UGVyc29uYWxQbGFuczogQXZhaWxhYmxlUGxhblR5cGVbXSIsIkhpZ2hsaWdodGVkUGxhbnM6IEF2YWlsYWJsZVBsYW5UeXBlW10iLCJIaWdoZXN0VGllclBsYW5zOiBQbGFuVHlwZVtdIiwiYWNjb3VudGluZ0luZm86IEFjY291bnRpbmdJbmZvIiwiQ29uc3Q6IENvbnN0VHlwZSIsIlRVVEFfTUFJTF9BRERSRVNTX0RPTUFJTlM6IFJlYWRvbmx5QXJyYXk8c3RyaW5nPiIsImN1c3RvbWVyOiBDdXN0b21lciIsInNwYW1SdWxlOiBFbWFpbFNlbmRlckxpc3RFbGVtZW50IiwiRlVMTF9JTkRFWEVEX1RJTUVTVEFNUDogbnVtYmVyIiwiTk9USElOR19JTkRFWEVEX1RJTUVTVEFNUDogbnVtYmVyIiwiRU5USVRZX0VWRU5UX0JBVENIX1RUTF9EQVlTOiBudW1iZXIiLCJ1c2VyU2V0dGluZ3M6IFVzZXJTZXR0aW5nc0dyb3VwUm9vdCIsImF0dGVuZGVlOiBDYWxlbmRhckV2ZW50QXR0ZW5kZWUiLCJtYWlsTWV0aG9kOiBNYWlsTWV0aG9kIiwiZW51bVZhbHVlczogUmVjb3JkPEssIFY+IiwidmFsdWU6IHN0cmluZyIsIm1heWJlOiBzdHJpbmciLCJtYXliZTogTnVtYmVyU3RyaW5nIiwiQ0xJRU5UX09OTFlfQ0FMRU5EQVJTOiBNYXA8SWQsIFRyYW5zbGF0aW9uS2V5PiIsIkRFRkFVTFRfQ0xJRU5UX09OTFlfQ0FMRU5EQVJfQ09MT1JTOiBNYXA8SWQsIHN0cmluZz4iXSwic291cmNlcyI6WyIuLi9zcmMvY29tbW9uL2FwaS9jb21tb24vVHV0YW5vdGFDb25zdGFudHMudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy9AYnVuZGxlSW50bzpjb21tb24tbWluXG5cbmltcG9ydCB7IERBWV9JTl9NSUxMSVMsIGRvd25jYXN0IH0gZnJvbSBcIkB0dXRhby90dXRhbm90YS11dGlsc1wiXG5pbXBvcnQgdHlwZSB7IENlcnRpZmljYXRlSW5mbywgQ3JlZGl0Q2FyZCwgRW1haWxTZW5kZXJMaXN0RWxlbWVudCwgR3JvdXBNZW1iZXJzaGlwIH0gZnJvbSBcIi4uL2VudGl0aWVzL3N5cy9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBBY2NvdW50aW5nSW5mbywgQ3VzdG9tZXIgfSBmcm9tIFwiLi4vZW50aXRpZXMvc3lzL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB0eXBlIHsgQ2FsZW5kYXJFdmVudEF0dGVuZGVlLCBDb250YWN0Q3VzdG9tRGF0ZSwgQ29udGFjdFJlbGF0aW9uc2hpcCwgVXNlclNldHRpbmdzR3JvdXBSb290IH0gZnJvbSBcIi4uL2VudGl0aWVzL3R1dGFub3RhL1R5cGVSZWZzLmpzXCJcbmltcG9ydCB7IENvbnRhY3RTb2NpYWxJZCwgTWFpbEZvbGRlciB9IGZyb20gXCIuLi9lbnRpdGllcy90dXRhbm90YS9UeXBlUmVmcy5qc1wiXG5pbXBvcnQgeyBpc0FwcCwgaXNFbGVjdHJvbkNsaWVudCwgaXNJT1NBcHAgfSBmcm9tIFwiLi9FbnZcIlxuaW1wb3J0IHR5cGUgeyBDb3VudHJ5IH0gZnJvbSBcIi4vQ291bnRyeUxpc3RcIlxuaW1wb3J0IHsgUHJvZ3JhbW1pbmdFcnJvciB9IGZyb20gXCIuL2Vycm9yL1Byb2dyYW1taW5nRXJyb3JcIlxuaW1wb3J0IHsgVHJhbnNsYXRpb25LZXkgfSBmcm9tIFwiLi4vLi4vbWlzYy9MYW5ndWFnZVZpZXdNb2RlbC5qc1wiXG5cbmV4cG9ydCBjb25zdCBNQVhfTkJSX01PVkVfREVMRVRFX01BSUxfU0VSVklDRSA9IDUwXG5cbi8vIHZpc2libGUgZm9yIHRlc3RpbmdcbmV4cG9ydCBjb25zdCBNQVhfQkxPQl9TSVpFX0JZVEVTID0gMTAyNCAqIDEwMjQgKiAxMFxuZXhwb3J0IGNvbnN0IFJFUVVFU1RfU0laRV9MSU1JVF9ERUZBVUxUID0gMTAyNCAqIDEwMjRcbmV4cG9ydCBjb25zdCBSRVFVRVNUX1NJWkVfTElNSVRfTUFQOiBNYXA8c3RyaW5nLCBudW1iZXI+ID0gbmV3IE1hcChbXG5cdFtcIi9yZXN0L3N0b3JhZ2UvYmxvYnNlcnZpY2VcIiwgTUFYX0JMT0JfU0laRV9CWVRFUyArIDEwMF0sIC8vIG92ZXJoZWFkIGZvciBlbmNyeXB0aW9uXG5cdFtcIi9yZXN0L3R1dGFub3RhL2ZpbGVkYXRhc2VydmljZVwiLCAxMDI0ICogMTAyNCAqIDI1XSxcblx0W1wiL3Jlc3QvdHV0YW5vdGEvZHJhZnRzZXJ2aWNlXCIsIDEwMjQgKiAxMDI0XSwgLy8gc2hvdWxkIGJlIGxhcmdlIGVub3VnaFxuXSlcblxuZXhwb3J0IGNvbnN0IFNZU1RFTV9HUk9VUF9NQUlMX0FERFJFU1MgPSBcInN5c3RlbUB0dXRhbm90YS5kZVwiXG5cbmV4cG9ydCBjb25zdCBnZXRNYWlsRm9sZGVyVHlwZSA9IChmb2xkZXI6IE1haWxGb2xkZXIpOiBNYWlsU2V0S2luZCA9PiBkb3duY2FzdChmb2xkZXIuZm9sZGVyVHlwZSlcblxuZXhwb3J0IGZ1bmN0aW9uIGlzRm9sZGVyKGZvbGRlcjogTWFpbEZvbGRlcik6IGJvb2xlYW4ge1xuXHRyZXR1cm4gZm9sZGVyLmZvbGRlclR5cGUgIT09IE1haWxTZXRLaW5kLkFMTCAmJiBmb2xkZXIuZm9sZGVyVHlwZSAhPT0gTWFpbFNldEtpbmQuTEFCRUwgJiYgZm9sZGVyLmZvbGRlclR5cGUgIT09IE1haWxTZXRLaW5kLkltcG9ydGVkXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0xhYmVsKGZvbGRlcjogTWFpbEZvbGRlcik6IGJvb2xlYW4ge1xuXHRyZXR1cm4gZm9sZGVyLmZvbGRlclR5cGUgPT09IE1haWxTZXRLaW5kLkxBQkVMXG59XG5cbnR5cGUgT2JqZWN0UHJvcGVydHlLZXkgPSBzdHJpbmcgfCBudW1iZXIgfCBzeW1ib2xcbmV4cG9ydCBjb25zdCByZXZlcnNlID0gPEsgZXh0ZW5kcyBPYmplY3RQcm9wZXJ0eUtleSwgViBleHRlbmRzIE9iamVjdFByb3BlcnR5S2V5PihvYmplY3RNYXA6IFJlY29yZDxLLCBWPik6IFJlY29yZDxWLCBLPiA9PlxuXHRPYmplY3Qua2V5cyhvYmplY3RNYXApLnJlZHVjZSgociwgaykgPT4ge1xuXHRcdC8vIEB0cy1pZ25vcmVcblx0XHRjb25zdCB2ID0gb2JqZWN0TWFwW2Rvd25jYXN0KGspXVxuXHRcdHJldHVybiBPYmplY3QuYXNzaWduKHIsIHsgW3ZdOiBrIH0pXG5cdH0sIHt9IGFzIFJlY29yZDxWLCBLPilcblxuZXhwb3J0IGNvbnN0IGVudW0gT3V0T2ZPZmZpY2VOb3RpZmljYXRpb25NZXNzYWdlVHlwZSB7XG5cdERlZmF1bHQgPSBcIjBcIixcblx0SW5zaWRlT3JnYW5pemF0aW9uID0gXCIxXCIsXG59XG5cbmV4cG9ydCBjb25zdCBPVVRfT0ZfT0ZGSUNFX1NVQkpFQ1RfUFJFRklYID0gXCJBdXRvLXJlcGx5OiBcIlxuXG5leHBvcnQgZW51bSBHcm91cFR5cGUge1xuXHRVc2VyID0gXCIwXCIsXG5cdEFkbWluID0gXCIxXCIsXG5cdE1haWxpbmdMaXN0ID0gXCIyXCIsXG5cdEN1c3RvbWVyID0gXCIzXCIsXG5cdEV4dGVybmFsID0gXCI0XCIsXG5cdE1haWwgPSBcIjVcIixcblx0Q29udGFjdCA9IFwiNlwiLFxuXHRGaWxlID0gXCI3XCIsXG5cdExvY2FsQWRtaW4gPSBcIjhcIixcblx0Q2FsZW5kYXIgPSBcIjlcIixcblx0VGVtcGxhdGUgPSBcIjEwXCIsXG5cdENvbnRhY3RMaXN0ID0gXCIxMVwiLFxufVxuXG5leHBvcnQgY29uc3QgR3JvdXBUeXBlTmFtZUJ5Q29kZSA9IHJldmVyc2UoR3JvdXBUeXBlKVxuXG5leHBvcnQgY29uc3QgZ2V0TWVtYmVyc2hpcEdyb3VwVHlwZSA9IChtZW1iZXJzaGlwOiBHcm91cE1lbWJlcnNoaXApOiBHcm91cFR5cGUgPT4gZG93bmNhc3QobWVtYmVyc2hpcC5ncm91cFR5cGUpXG5cbi8qKlxuICogUGVybWlzc2lvbiBpcyBhIGtpbmQgb2YgYSBtZXRhZGF0YSBpbnN0YW5jZS4gUHJpbWFyaWx5IHVzZWQgZm9yIHR3byBwdXJwb3NlczpcbiAqICAtIGtleSBzaGFyaW5nXG4gKiAgLSByZWZlcmVuY2UgY291bnRpbmcgaW4gdGhlIGRiXG4gKiAqL1xuZXhwb3J0IGNvbnN0IGVudW0gUGVybWlzc2lvblR5cGUge1xuXHQvKiogVXNlZCBpbiBjb21iaW5hdGlvbiB3aXRoIGJ1Y2tldCBwZXJtaXNzaW9uIHRvIHNlbmQgbXVsdGlwbGUgdGhpbmdzIGVuY3J5cHRlZCB3aXRoIHRoZSBzYW1lIHB1YmxpYyBrZXkuICovXG5cdFB1YmxpYyA9IFwiMFwiLFxuXHQvKiogVXNlZCB0byBlbmNyeXB0IGFuIGluc3RhbmNlIGZvciBhbm90aGVyIGdyb3VwICh3aGljaCB3ZSBhcmUgbWVtYmVyIG9mKS4gKi9cblx0U3ltbWV0cmljID0gXCIxXCIsXG5cdC8qKiBVc2VkIHRvIHVwZGF0aW5nIHB1YmxpYyBwZXJtaXNzaW9uIHdpdGggc3ltbWV0cmljIGtleS4gKi9cblx0UHVibGljX1N5bW1ldHJpYyA9IFwiMlwiLFxuXHQvKiogSW5zdGFuY2VzIHdpdGhvdXQgb3duZXJFbmNTZXNzaW9uS2V5IChlLmcuIE1haWxCb2R5LCBGaWxlRGF0YSkgYWZ0ZXIgYXN5bW1ldHJpYyBkZWNyeXB0aW9uLCB1c2VkIGZvciByZWZlcmVuY2UgY291bnRpbmcuICovXG5cdFVuZW5jcnlwdGVkID0gXCIzXCIsXG5cdC8qKiBTZW5kaW5nIHBhcnRzIG9mIGVtYWlsIGZvciBleHRlcm5hbCB1c2Vycy4gKi9cblx0RXh0ZXJuYWwgPSBcIjVcIixcblx0LyoqIFVzZWQgdG8gbWFyayB0aGUgb3duZXIgb2YgdGhlIGxpc3QuICovXG5cdE93bmVyX0xpc3QgPSBcIjhcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQnVja2V0UGVybWlzc2lvblR5cGUge1xuXHRQdWJsaWMgPSBcIjJcIixcblx0RXh0ZXJuYWwgPSBcIjNcIixcbn1cblxuZXhwb3J0IGVudW0gTWFpbFNldEtpbmQge1xuXHRDVVNUT00gPSBcIjBcIixcblx0SU5CT1ggPSBcIjFcIixcblx0U0VOVCA9IFwiMlwiLFxuXHRUUkFTSCA9IFwiM1wiLFxuXHRBUkNISVZFID0gXCI0XCIsXG5cdFNQQU0gPSBcIjVcIixcblx0RFJBRlQgPSBcIjZcIixcblx0QUxMID0gXCI3XCIsXG5cdExBQkVMID0gXCI4XCIsXG5cdEltcG9ydGVkID0gXCI5XCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRNYWlsU2V0S2luZChmb2xkZXI6IE1haWxGb2xkZXIpOiBNYWlsU2V0S2luZCB7XG5cdHJldHVybiBmb2xkZXIuZm9sZGVyVHlwZSBhcyBNYWlsU2V0S2luZFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBSZXBseVR5cGUge1xuXHROT05FID0gXCIwXCIsXG5cdFJFUExZID0gXCIxXCIsXG5cdEZPUldBUkQgPSBcIjJcIixcblx0UkVQTFlfRk9SV0FSRCA9IFwiM1wiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDb250YWN0QWRkcmVzc1R5cGUge1xuXHRQUklWQVRFID0gXCIwXCIsXG5cdFdPUksgPSBcIjFcIixcblx0T1RIRVIgPSBcIjJcIixcblx0Q1VTVE9NID0gXCIzXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIENvbnRhY3RQaG9uZU51bWJlclR5cGUge1xuXHRQUklWQVRFID0gXCIwXCIsXG5cdFdPUksgPSBcIjFcIixcblx0TU9CSUxFID0gXCIyXCIsXG5cdEZBWCA9IFwiM1wiLFxuXHRPVEhFUiA9IFwiNFwiLFxuXHRDVVNUT00gPSBcIjVcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQ29udGFjdFNvY2lhbFR5cGUge1xuXHRUV0lUVEVSID0gXCIwXCIsXG5cdEZBQ0VCT09LID0gXCIxXCIsXG5cdFhJTkcgPSBcIjJcIixcblx0TElOS0VEX0lOID0gXCIzXCIsXG5cdE9USEVSID0gXCI0XCIsXG5cdENVU1RPTSA9IFwiNVwiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDb250YWN0UmVsYXRpb25zaGlwVHlwZSB7XG5cdFBBUkVOVCA9IFwiMFwiLFxuXHRCUk9USEVSID0gXCIxXCIsXG5cdFNJU1RFUiA9IFwiMlwiLFxuXHRDSElMRCA9IFwiM1wiLFxuXHRGUklFTkQgPSBcIjRcIixcblx0UkVMQVRJVkUgPSBcIjVcIixcblx0U1BPVVNFID0gXCI2XCIsXG5cdFBBUlRORVIgPSBcIjdcIixcblx0QVNTSVNUQU5UID0gXCI4XCIsXG5cdE1BTkFHRVIgPSBcIjlcIixcblx0T1RIRVIgPSBcIjEwXCIsXG5cdENVU1RPTSA9IFwiMTFcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQ29udGFjdE1lc3NlbmdlckhhbmRsZVR5cGUge1xuXHRTSUdOQUwgPSBcIjBcIixcblx0V0hBVFNBUFAgPSBcIjFcIixcblx0VEVMRUdSQU0gPSBcIjJcIixcblx0RElTQ09SRCA9IFwiM1wiLFxuXHRPVEhFUiA9IFwiNFwiLFxuXHRDVVNUT00gPSBcIjVcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQ29udGFjdFdlYnNpdGVUeXBlIHtcblx0UFJJVkFURSA9IFwiMFwiLFxuXHRXT1JLID0gXCIxXCIsXG5cdE9USEVSID0gXCIyXCIsXG5cdENVU1RPTSA9IFwiM1wiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDb250YWN0Q3VzdG9tRGF0ZVR5cGUge1xuXHRBTk5JVkVSU0FSWSA9IFwiMFwiLFxuXHRPVEhFUiA9IFwiMVwiLFxuXHRDVVNUT00gPSBcIjJcIixcbn1cblxuZXhwb3J0IGNvbnN0IGdldENvbnRhY3RTb2NpYWxUeXBlID0gKGNvbnRhY3RTb2NpYWxJZDogQ29udGFjdFNvY2lhbElkKTogQ29udGFjdFNvY2lhbFR5cGUgPT4gZG93bmNhc3QoY29udGFjdFNvY2lhbElkLnR5cGUpXG5leHBvcnQgY29uc3QgZ2V0Q3VzdG9tRGF0ZVR5cGUgPSAoY3VzdG9tRGF0ZTogQ29udGFjdEN1c3RvbURhdGUpOiBDb250YWN0Q3VzdG9tRGF0ZVR5cGUgPT4gZG93bmNhc3QoY3VzdG9tRGF0ZS50eXBlKVxuZXhwb3J0IGNvbnN0IGdldFJlbGF0aW9uc2hpcFR5cGUgPSAocmVsYXRpb25zaGlwOiBDb250YWN0UmVsYXRpb25zaGlwKTogQ29udGFjdFJlbGF0aW9uc2hpcFR5cGUgPT4gZG93bmNhc3QocmVsYXRpb25zaGlwLnR5cGUpXG5cbmV4cG9ydCBjb25zdCBlbnVtIE9wZXJhdGlvblR5cGUge1xuXHRDUkVBVEUgPSBcIjBcIixcblx0VVBEQVRFID0gXCIxXCIsXG5cdERFTEVURSA9IFwiMlwiLFxufVxuXG5leHBvcnQgZW51bSBLZGZUeXBlIHtcblx0QmNyeXB0ID0gXCIwXCIsXG5cdEFyZ29uMmlkID0gXCIxXCIsXG59XG5cbi8vIFRoZSBLZGYgdHlwZSB0byB1c2Ugd2hlbiBkZXJpdmluZyBuZXcoISkga2V5cyBmcm9tIHBhc3N3b3Jkc1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfS0RGX1RZUEUgPSBLZGZUeXBlLkFyZ29uMmlkXG5cbmV4cG9ydCBlbnVtIEFjY291bnRUeXBlIHtcblx0U1lTVEVNID0gXCIwXCIsXG5cdEZSRUUgPSBcIjFcIixcblx0U1RBUlRFUiA9IFwiMlwiLFxuXHRQQUlEID0gXCIzXCIsXG5cdEVYVEVSTkFMID0gXCI1XCIsXG59XG5cbmV4cG9ydCBjb25zdCBBY2NvdW50VHlwZU5hbWVzOiBSZWNvcmQ8QWNjb3VudFR5cGUsIHN0cmluZz4gPSB7XG5cdFtBY2NvdW50VHlwZS5TWVNURU1dOiBcIlN5c3RlbVwiLFxuXHRbQWNjb3VudFR5cGUuRlJFRV06IFwiRnJlZVwiLFxuXHRbQWNjb3VudFR5cGUuU1RBUlRFUl06IFwiT3V0bG9va1wiLFxuXHRbQWNjb3VudFR5cGUuUEFJRF06IFwiUGFpZFwiLFxuXHRbQWNjb3VudFR5cGUuRVhURVJOQUxdOiBcIkV4dGVybmFsXCIsXG59XG5cbmV4cG9ydCBlbnVtIEN1c3RvbURvbWFpblR5cGUge1xuXHROT05FID0gXCIwXCIsXG5cdE9ORSA9IFwiMVwiLFxuXHRUSFJFRSA9IFwiMlwiLFxuXHRURU4gPSBcIjNcIixcblx0VU5MSU1JVEVEID0gXCI0XCIsXG59XG5cbmV4cG9ydCBjb25zdCBDdXN0b21Eb21haW5UeXBlQ291bnQ6IFJlY29yZDxDdXN0b21Eb21haW5UeXBlLCBudW1iZXI+ID0ge1xuXHRbQ3VzdG9tRG9tYWluVHlwZS5OT05FXTogMCxcblx0W0N1c3RvbURvbWFpblR5cGUuT05FXTogMSxcblx0W0N1c3RvbURvbWFpblR5cGUuVEhSRUVdOiAzLFxuXHRbQ3VzdG9tRG9tYWluVHlwZS5URU5dOiAxMCxcblx0W0N1c3RvbURvbWFpblR5cGUuVU5MSU1JVEVEXTogLTEsXG59XG5cbmV4cG9ydCBjb25zdCBDdXN0b21Eb21haW5UeXBlQ291bnROYW1lOiBSZWNvcmQ8Q3VzdG9tRG9tYWluVHlwZSwgc3RyaW5nPiA9IHtcblx0W0N1c3RvbURvbWFpblR5cGUuTk9ORV06IFwiMFwiLFxuXHRbQ3VzdG9tRG9tYWluVHlwZS5PTkVdOiBcIjFcIixcblx0W0N1c3RvbURvbWFpblR5cGUuVEhSRUVdOiBcIjNcIixcblx0W0N1c3RvbURvbWFpblR5cGUuVEVOXTogXCIxMFwiLFxuXHRbQ3VzdG9tRG9tYWluVHlwZS5VTkxJTUlURURdOiBcIuKInlwiLFxufVxuXG5leHBvcnQgZW51bSBQbGFuVHlwZSB7XG5cdFByZW1pdW0gPSBcIjBcIixcblx0UHJvID0gXCIyXCIsXG5cdFRlYW1zID0gXCIzXCIsXG5cdFByZW1pdW1CdXNpbmVzcyA9IFwiNFwiLFxuXHRUZWFtc0J1c2luZXNzID0gXCI1XCIsXG5cdFJldm9sdXRpb25hcnkgPSBcIjZcIixcblx0TGVnZW5kID0gXCI3XCIsXG5cdEVzc2VudGlhbCA9IFwiOFwiLFxuXHRBZHZhbmNlZCA9IFwiOVwiLFxuXHRVbmxpbWl0ZWQgPSBcIjEwXCIsXG5cdEZyZWUgPSBcIjExXCIsXG59XG5cbmV4cG9ydCB0eXBlIFBsYW5OYW1lID0ga2V5b2YgdHlwZW9mIFBsYW5UeXBlXG5leHBvcnQgdHlwZSBBdmFpbGFibGVQbGFuVHlwZSA9IEV4Y2x1ZGU8UGxhblR5cGUsIFBsYW5UeXBlLlByZW1pdW0gfCBQbGFuVHlwZS5Qcm8gfCBQbGFuVHlwZS5UZWFtcyB8IFBsYW5UeXBlLlByZW1pdW1CdXNpbmVzcyB8IFBsYW5UeXBlLlRlYW1zQnVzaW5lc3M+XG5leHBvcnQgY29uc3QgQXZhaWxhYmxlUGxhbnM6IEF2YWlsYWJsZVBsYW5UeXBlW10gPSBbXG5cdFBsYW5UeXBlLkZyZWUsXG5cdFBsYW5UeXBlLlJldm9sdXRpb25hcnksXG5cdFBsYW5UeXBlLkxlZ2VuZCxcblx0UGxhblR5cGUuRXNzZW50aWFsLFxuXHRQbGFuVHlwZS5BZHZhbmNlZCxcblx0UGxhblR5cGUuVW5saW1pdGVkLFxuXVxuZXhwb3J0IGNvbnN0IE5ld1BhaWRQbGFuczogQXZhaWxhYmxlUGxhblR5cGVbXSA9IFtQbGFuVHlwZS5SZXZvbHV0aW9uYXJ5LCBQbGFuVHlwZS5MZWdlbmQsIFBsYW5UeXBlLkVzc2VudGlhbCwgUGxhblR5cGUuQWR2YW5jZWQsIFBsYW5UeXBlLlVubGltaXRlZF1cbmV4cG9ydCBjb25zdCBOZXdCdXNpbmVzc1BsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdID0gW1BsYW5UeXBlLkVzc2VudGlhbCwgUGxhblR5cGUuQWR2YW5jZWQsIFBsYW5UeXBlLlVubGltaXRlZF1cbmV4cG9ydCBjb25zdCBOZXdQZXJzb25hbFBsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdID0gW1BsYW5UeXBlLkZyZWUsIFBsYW5UeXBlLlJldm9sdXRpb25hcnksIFBsYW5UeXBlLkxlZ2VuZF1cblxuZXhwb3J0IGNvbnN0IExlZ2FjeVBsYW5zID0gW1BsYW5UeXBlLlByZW1pdW0sIFBsYW5UeXBlLlByZW1pdW1CdXNpbmVzcywgUGxhblR5cGUuVGVhbXMsIFBsYW5UeXBlLlRlYW1zQnVzaW5lc3MsIFBsYW5UeXBlLlByb11cbmV4cG9ydCBjb25zdCBIaWdobGlnaHRlZFBsYW5zOiBBdmFpbGFibGVQbGFuVHlwZVtdID0gW1BsYW5UeXBlLlJldm9sdXRpb25hcnksIFBsYW5UeXBlLkFkdmFuY2VkXVxuZXhwb3J0IGNvbnN0IEhpZ2hlc3RUaWVyUGxhbnM6IFBsYW5UeXBlW10gPSBbUGxhblR5cGUuTGVnZW5kLCBQbGFuVHlwZS5VbmxpbWl0ZWRdXG5cbmV4cG9ydCBjb25zdCBQbGFuVHlwZVRvTmFtZSA9IHJldmVyc2UoUGxhblR5cGUpXG5cbmV4cG9ydCBlbnVtIFN1YnNjcmlwdGlvblR5cGUge1xuXHRQZXJzb25hbCxcblx0QnVzaW5lc3MsXG5cdFBhaWRQZXJzb25hbCxcbn1cblxuZXhwb3J0IGVudW0gQm9va2luZ0l0ZW1GZWF0dXJlVHlwZSB7XG5cdExlZ2FjeVVzZXJzID0gXCIwXCIsXG5cdFN0b3JhZ2UgPSBcIjFcIixcblx0QWxpYXMgPSBcIjJcIixcblx0U2hhcmVkTWFpbEdyb3VwID0gXCIzXCIsXG5cdFdoaXRlbGFiZWwgPSBcIjRcIixcblx0Q29udGFjdEZvcm0gPSBcIjVcIixcblx0V2hpdGVsYWJlbENoaWxkID0gXCI2XCIsXG5cdExvY2FsQWRtaW5Hcm91cCA9IFwiN1wiLFxuXHREaXNjb3VudCA9IFwiOFwiLFxuXHRTaGFyaW5nID0gXCI5XCIsXG5cdEJ1c2luZXNzID0gXCIxMFwiLFxuXHRSZXZvbHV0aW9uYXJ5ID0gXCIxMVwiLFxuXHRMZWdlbmQgPSBcIjEyXCIsXG5cdEVzc2VudGlhbCA9IFwiMTNcIixcblx0QWR2YW5jZWQgPSBcIjE0XCIsXG5cdFVubGltaXRlZCA9IFwiMTVcIixcbn1cblxuZXhwb3J0IGNvbnN0IEJvb2tpbmdJdGVtRmVhdHVyZUJ5Q29kZSA9IHJldmVyc2UoQm9va2luZ0l0ZW1GZWF0dXJlVHlwZSlcbmV4cG9ydCBjb25zdCBnZXRQYXltZW50TWV0aG9kVHlwZSA9IChhY2NvdW50aW5nSW5mbzogQWNjb3VudGluZ0luZm8pOiBQYXltZW50TWV0aG9kVHlwZSA9PiBkb3duY2FzdDxQYXltZW50TWV0aG9kVHlwZT4oYWNjb3VudGluZ0luZm8ucGF5bWVudE1ldGhvZClcblxuZXhwb3J0IGVudW0gUGF5bWVudE1ldGhvZFR5cGUge1xuXHRJbnZvaWNlID0gXCIwXCIsXG5cdENyZWRpdENhcmQgPSBcIjFcIixcblx0U2VwYSA9IFwiMlwiLFxuXHRQYXlwYWwgPSBcIjNcIixcblx0QWNjb3VudEJhbGFuY2UgPSBcIjRcIixcblx0QXBwU3RvcmUgPSBcIjVcIixcbn1cblxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGdldERlZmF1bHRQYXltZW50TWV0aG9kKCk6IFByb21pc2U8UGF5bWVudE1ldGhvZFR5cGU+IHtcblx0aWYgKGlzSU9TQXBwKCkpIHtcblx0XHRyZXR1cm4gUGF5bWVudE1ldGhvZFR5cGUuQXBwU3RvcmVcblx0fVxuXG5cdHJldHVybiBQYXltZW50TWV0aG9kVHlwZS5DcmVkaXRDYXJkXG59XG5cbmV4cG9ydCBjb25zdCBQYXltZW50TWV0aG9kVHlwZVRvTmFtZSA9IHJldmVyc2UoUGF5bWVudE1ldGhvZFR5cGUpXG5cbnR5cGUgQ29uc3RUeXBlID0ge1xuXHRJTklUSUFMX1VQR1JBREVfUkVNSU5ERVJfSU5URVJWQUxfTVM6IG51bWJlclxuXHRSRVBFQVRFRF9VUEdSQURFX1JFTUlOREVSX0lOVEVSVkFMX01TOiBudW1iZXJcblx0TUVNT1JZX0dCX0ZBQ1RPUjogbnVtYmVyXG5cdE1FTU9SWV9XQVJOSU5HX0ZBQ1RPUjogbnVtYmVyXG5cdENVUlJFTlRfREFURTogRGF0ZSB8IG51bGxcblx0Q1VSUkVOQ1lfU1lNQk9MX0VVUjogc3RyaW5nXG5cdERFRkFVTFRfQVBQX0RPTUFJTjogc3RyaW5nXG5cdExFR0FDWV9XRUJBVVRITl9SUF9JRDogc3RyaW5nXG5cdFdFQkFVVEhOX1JQX0lEOiBzdHJpbmdcblx0VTJmX0FQUElEX1NVRkZJWDogc3RyaW5nXG5cdFUyRl9MRUdBQ1lfQVBQSUQ6IHN0cmluZ1xuXHRFWEVDVVRFX0tERl9NSUdSQVRJT046IGJvb2xlYW5cbn1cblxuZXhwb3J0IGNvbnN0IENvbnN0OiBDb25zdFR5cGUgPSB7XG5cdElOSVRJQUxfVVBHUkFERV9SRU1JTkRFUl9JTlRFUlZBTF9NUzogMTQgKiBEQVlfSU5fTUlMTElTLFxuXHRSRVBFQVRFRF9VUEdSQURFX1JFTUlOREVSX0lOVEVSVkFMX01TOiA5MCAqIERBWV9JTl9NSUxMSVMsXG5cdE1FTU9SWV9HQl9GQUNUT1I6IDEwMDAwMDAwMDAsXG5cdE1FTU9SWV9XQVJOSU5HX0ZBQ1RPUjogMC45LFxuXHQvLyBTZXRzIHRoZSBjdXJyZW50IGRhdGUgZm9yIHRlc3RpbmcgZGF0ZSBkZXBlbmRlbnQgc2VydmljZXMuIE9ubHkgYXZhaWxhYmxlIGluIHRlc3QgZW52aXJvbm1lbnRzLlxuXHRDVVJSRU5UX0RBVEU6IG51bGwsXG5cdENVUlJFTkNZX1NZTUJPTF9FVVI6IFwi4oKsXCIsXG5cdERFRkFVTFRfQVBQX0RPTUFJTjogXCJhcHAudHV0YS5jb21cIixcblx0TEVHQUNZX1dFQkFVVEhOX1JQX0lEOiBcInR1dGFub3RhLmNvbVwiLFxuXHRXRUJBVVRITl9SUF9JRDogXCJ0dXRhLmNvbVwiLFxuXHRVMmZfQVBQSURfU1VGRklYOiBcIi91MmYtYXBwaWQuanNvblwiLFxuXHQvLyB0aGlzIGlzIGZldGNoZWQgZnJvbSB0aGUgd2Vic2l0ZSBhc3NldHMgKGV2ZW4gdGhvdWdoIHRoZSBzZXJ2ZXIgaGFzIGEgaGFyZGNvZGVkIHJlc3BvbnNlIGZvciB0aGlzKVxuXHQvLyB3ZSBrZWVwIGl0IGF0IHR1dGFub3RhLmNvbSBzaW5jZSB3ZSdyZSBtYXRjaGluZyBvbiBpdCBpbiB0aGUgY29kZSBhbmQgb2xkIGtleXMgYXJlIHNhdmVkIHdpdGggdGhpc1xuXHQvLyBVUkwgYXMgYXBwSWQuXG5cdC8vIHdlJ2xsIHN0aWxsIGdldCB0aGUgY29udGVudHNcblx0Ly8gYmVjYXVzZSBpdCB3aWxsIGJlIHJlZGlyZWN0ZWQgdG8gdHV0YS5jb20gYWZ0ZXIgbmV3IGRvbWFpbiBkZXBsb3kuXG5cdFUyRl9MRUdBQ1lfQVBQSUQ6IFwiaHR0cHM6Ly90dXRhbm90YS5jb20vdTJmLWFwcGlkLmpzb25cIixcblx0RVhFQ1VURV9LREZfTUlHUkFUSU9OOiB0cnVlLFxufSBhcyBjb25zdFxuXG5leHBvcnQgY29uc3QgVFVUQV9NQUlMX0FERFJFU1NfRE9NQUlOUzogUmVhZG9ubHlBcnJheTxzdHJpbmc+ID0gT2JqZWN0LmZyZWV6ZShbXG5cdFwidHV0YS5jb21cIixcblx0XCJ0dXRhbWFpbC5jb21cIixcblx0XCJ0dXRhLmlvXCIsXG5cdFwidHV0YW5vdGEuY29tXCIsXG5cdFwidHV0YW5vdGEuZGVcIixcblx0XCJrZWVtYWlsLm1lXCIsXG5dKVxuZXhwb3J0IGNvbnN0IFRVVEFfTUFJTF9BRERSRVNTX1NJR05VUF9ET01BSU5TID0gVFVUQV9NQUlMX0FERFJFU1NfRE9NQUlOU1xuZXhwb3J0IGNvbnN0IERFRkFVTFRfUEFJRF9NQUlMX0FERFJFU1NfU0lHTlVQX0RPTUFJTiA9IFwidHV0YS5jb21cIlxuZXhwb3J0IGNvbnN0IERFRkFVTFRfRlJFRV9NQUlMX0FERFJFU1NfU0lHTlVQX0RPTUFJTiA9IFwidHV0YW1haWwuY29tXCJcblxuZXhwb3J0IGNvbnN0IGVudW0gQ29udmVyc2F0aW9uVHlwZSB7XG5cdE5FVyA9IFwiMFwiLFxuXHRSRVBMWSA9IFwiMVwiLFxuXHRGT1JXQVJEID0gXCIyXCIsXG5cdC8qKiAgYSBtZXNzYWdlIGZvciB3aGljaCBubyBtYWlsIGV4aXN0cyBpbiBUdXRhICh1bmtub3duIGV4dGVybmFsIG1haWwgb3IgZGVsZXRlZCBtYWlsKSAqL1xuXHRVTktOT1dOID0gXCIzXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIE1haWxTdGF0ZSB7XG5cdERSQUZUID0gXCIwXCIsXG5cdFNFTlQgPSBcIjFcIixcblx0UkVDRUlWRUQgPSBcIjJcIixcblx0U0VORElORyA9IFwiM1wiLFxufVxuXG4vLyBLZWVwIG5vbi1jb25zdCBmb3IgYWRtaW5cbmV4cG9ydCBlbnVtIEFwcHJvdmFsU3RhdHVzIHtcblx0UkVHSVNUUkFUSU9OX0FQUFJPVkVEID0gXCIwXCIsXG5cdFJFR0lTVFJBVElPTl9BUFBST1ZBTF9ORUVERUQgPSBcIjFcIixcblx0U0VORF9NQUlMU19BUFBST1ZFRCA9IFwiMlwiLFxuXHRJTlZPSUNFX05PVF9QQUlEID0gXCIzXCIsXG5cdFNQQU1fU0VOREVSID0gXCI0XCIsXG5cdERFTEFZRUQgPSBcIjVcIixcblx0REVMQVlFRF9BTkRfSU5JVElBTExZX0FDQ0VTU0VEID0gXCI2XCIsXG5cdFJFR0lTVFJBVElPTl9BUFBST1ZBTF9ORUVERURfQU5EX0lOSVRJQUxMWV9BQ0NFU1NFRCA9IFwiN1wiLFxuXHRQQUlEX1NVQlNDUklQVElPTl9ORUVERUQgPSBcIjhcIixcblx0SU5JVElBTF9QQVlNRU5UX1BFTkRJTkcgPSBcIjlcIixcblx0Tk9fQUNUSVZJVFkgPSBcIjEwXCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDdXN0b21lckFwcHJvdmFsU3RhdHVzKGN1c3RvbWVyOiBDdXN0b21lcik6IEFwcHJvdmFsU3RhdHVzIHtcblx0cmV0dXJuIGRvd25jYXN0KGN1c3RvbWVyLmFwcHJvdmFsU3RhdHVzKVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBJbmJveFJ1bGVUeXBlIHtcblx0RlJPTV9FUVVBTFMgPSBcIjBcIixcblx0UkVDSVBJRU5UX1RPX0VRVUFMUyA9IFwiMVwiLFxuXHRSRUNJUElFTlRfQ0NfRVFVQUxTID0gXCIyXCIsXG5cdFJFQ0lQSUVOVF9CQ0NfRVFVQUxTID0gXCIzXCIsXG5cdFNVQkpFQ1RfQ09OVEFJTlMgPSBcIjRcIixcblx0TUFJTF9IRUFERVJfQ09OVEFJTlMgPSBcIjVcIixcbn1cblxuZXhwb3J0IGVudW0gU3BhbVJ1bGVUeXBlIHtcblx0V0hJVEVMSVNUID0gXCIxXCIsXG5cdEJMQUNLTElTVCA9IFwiMlwiLFxuXHRESVNDQVJEID0gXCIzXCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRTcGFtUnVsZVR5cGUoc3BhbVJ1bGU6IEVtYWlsU2VuZGVyTGlzdEVsZW1lbnQpOiBTcGFtUnVsZVR5cGUgfCBudWxsIHtcblx0cmV0dXJuIGdldEFzRW51bVZhbHVlKFNwYW1SdWxlVHlwZSwgc3BhbVJ1bGUudHlwZSlcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gU3BhbVJ1bGVGaWVsZFR5cGUge1xuXHRGUk9NID0gXCIwXCIsXG5cdFRPID0gXCIxXCIsXG5cdENDID0gXCIyXCIsXG5cdEJDQyA9IFwiM1wiLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U3BhbVJ1bGVGaWVsZChzcGFtUnVsZTogRW1haWxTZW5kZXJMaXN0RWxlbWVudCk6IFNwYW1SdWxlRmllbGRUeXBlIHtcblx0cmV0dXJuIGRvd25jYXN0KHNwYW1SdWxlLmZpZWxkKVxufVxuXG5leHBvcnQgY29uc3QgZW51bSBSZXBvcnRNb3ZlZE1haWxzVHlwZSB7XG5cdEFMV0FZU19BU0sgPSBcIjBcIixcblx0QVVUT01BVElDQUxMWV9PTkxZX1NQQU0gPSBcIjFcIixcblx0TkVWRVIgPSBcIjNcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gRW1haWxTaWduYXR1cmVUeXBlIHtcblx0RU1BSUxfU0lHTkFUVVJFX1RZUEVfREVGQVVMVCA9IFwiMFwiLFxuXHRFTUFJTF9TSUdOQVRVUkVfVFlQRV9DVVNUT00gPSBcIjFcIixcblx0RU1BSUxfU0lHTkFUVVJFX1RZUEVfTk9ORSA9IFwiMlwiLFxufVxuXG5leHBvcnQgZW51bSBDdXN0b21Eb21haW5WYWxpZGF0aW9uUmVzdWx0IHtcblx0Q1VTVE9NX0RPTUFJTl9WQUxJREFUSU9OX1JFU1VMVF9PSyA9IFwiMFwiLFxuXHRDVVNUT01fRE9NQUlOX1ZBTElEQVRJT05fUkVTVUxUX0ROU19MT09LVVBfRkFJTEVEID0gXCIxXCIsXG5cdENVU1RPTV9ET01BSU5fVkFMSURBVElPTl9SRVNVTFRfRE9NQUlOX05PVF9GT1VORCA9IFwiMlwiLFxuXHRDVVNUT01fRE9NQUlOX1ZBTElEQVRJT05fUkVTVUxUX05BTUVTRVJWRVJfTk9UX0ZPVU5EID0gXCIzXCIsXG5cdENVU1RPTV9ET01BSU5fVkFMSURBVElPTl9SRVNVTFRfRE9NQUlOX05PVF9BVkFJTEFCTEUgPSBcIjRcIixcblx0Q1VTVE9NX0RPTUFJTl9WQUxJREFUSU9OX1JFU1VMVF9WQUxJREFUSU9OX0ZBSUxFRCA9IFwiNVwiLFxufVxuXG5leHBvcnQgZW51bSBDdXN0b21Eb21haW5DaGVja1Jlc3VsdCB7XG5cdENVU1RPTV9ET01BSU5fQ0hFQ0tfUkVTVUxUX09LID0gXCIwXCIsXG5cdENVU1RPTV9ET01BSU5fQ0hFQ0tfUkVTVUxUX0ROU19MT09LVVBfRkFJTEVEID0gXCIxXCIsXG5cdENVU1RPTV9ET01BSU5fQ0hFQ0tfUkVTVUxUX0RPTUFJTl9OT1RfRk9VTkQgPSBcIjJcIixcblx0Q1VTVE9NX0RPTUFJTl9DSEVDS19SRVNVTFRfTkFNRVNFUlZFUl9OT1RfRk9VTkQgPSBcIjNcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gRG5zUmVjb3JkVHlwZSB7XG5cdEROU19SRUNPUkRfVFlQRV9NWCA9IFwiMFwiLFxuXHRETlNfUkVDT1JEX1RZUEVfVFhUX1NQRiA9IFwiMVwiLFxuXHRETlNfUkVDT1JEX1RZUEVfQ05BTUVfREtJTSA9IFwiMlwiLFxuXHRETlNfUkVDT1JEX1RZUEVfVFhUX0RNQVJDID0gXCIzXCIsXG5cdEROU19SRUNPUkRfVFlQRV9DTkFNRV9NVEFfU1RTID0gXCI0XCIsXG5cdEROU19SRUNPUkRfVFlQRV9UWFRfVkVSSUZZID0gXCI1XCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFNlc3Npb25TdGF0ZSB7XG5cdFNFU1NJT05fU1RBVEVfQUNUSVZFID0gXCIwXCIsXG5cdFNFU1NJT05fU1RBVEVfRVhQSVJFRCA9IFwiMVwiLFxuXHRTRVNTSU9OX1NUQVRFX0RFTEVURUQgPSBcIjJcIixcblx0U0VTU0lPTl9TVEFURV9QRU5ESU5HID0gXCIzXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFB1c2hTZXJ2aWNlVHlwZSB7XG5cdEFORFJPSUQgPSBcIjBcIixcblx0SU9TID0gXCIxXCIsXG5cdEVNQUlMID0gXCIyXCIsXG5cdFNTRSA9IFwiM1wiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBJbnB1dEZpZWxkVHlwZSB7XG5cdFRFWFQgPSBcIjBcIixcblx0TlVNQkVSID0gXCIxXCIsXG5cdEVOVU0gPSBcIjJcIixcbn1cblxuZXhwb3J0IGVudW0gU2Vjb25kRmFjdG9yVHlwZSB7XG5cdHUyZiA9IFwiMFwiLFxuXHR0b3RwID0gXCIxXCIsXG5cdHdlYmF1dGhuID0gXCIyXCIsIC8vIGFjdHVhbGx5IHJlZmVycyB0byB1MmYgaW4gY2xpZW50XG59XG5cbmV4cG9ydCBjb25zdCBNQVhfQVRUQUNITUVOVF9TSVpFID0gMTAyNCAqIDEwMjQgKiAyNVxuZXhwb3J0IGNvbnN0IE1BWF9MT0dPX1NJWkUgPSAxMDI0ICogMTAwXG5leHBvcnQgY29uc3QgTUFYX0JBU0U2NF9JTUFHRV9TSVpFID0gTUFYX0xPR09fU0laRVxuZXhwb3J0IGNvbnN0IEFMTE9XRURfSU1BR0VfRk9STUFUUyA9IFtcInBuZ1wiLCBcImpwZ1wiLCBcImpwZWdcIiwgXCJzdmdcIl1cblxuLy8gS2VlcCBub24tY29uc3QgZm9yIGFkbWluXG5leHBvcnQgZW51bSBGZWF0dXJlVHlwZSB7XG5cdERpc2FibGVDb250YWN0cyA9IFwiMFwiLFxuXHREaXNhYmxlTWFpbEV4cG9ydCA9IFwiMVwiLFxuXHRJbnRlcm5hbENvbW11bmljYXRpb24gPSBcIjJcIixcblx0RGVsZXRlTWFpbHNPblBhc3N3b3JkUmVzZXQgPSBcIjNcIixcblx0V2hpdGVsYWJlbFBhcmVudCA9IFwiNFwiLFxuXHRXaGl0ZWxhYmVsQ2hpbGQgPSBcIjVcIixcblx0UmVwbHlPbmx5ID0gXCI2XCIsXG5cdERpc2FibGVEZWZhdWx0U2lnbmF0dXJlID0gXCI3XCIsXG5cdEhpZGVCdXlEaWFsb2dzID0gXCI4XCIsXG5cdERpc2FibGVDYWxlbmRhciA9IFwiOVwiLFxuXHRFeHRlcm5hbEVtYWlsUHJvdmlkZXIgPSBcIjEwXCIsXG5cblx0LyoqIFRoaXMgaXMgcmVxdWlyZWQgZm9yIG5vbiBhZG1pbiB1c2VycyBiZWNhdXNlIHRoZXkgYXJlIG5vdCBhbGxvd2VkIHRvIGFjY2VzcyB0aGUgYm9va2luZ3MuICovXG5cdEJ1c2luZXNzRmVhdHVyZUVuYWJsZWQgPSBcIjExXCIsXG5cdEFmZmlsaWF0ZVBhcnRuZXIgPSBcIjEyXCIsXG5cdEtub3dsZWRnZUJhc2UgPSBcIjEzXCIsXG5cdE5ld3NsZXR0ZXIgPSBcIjE0XCIsXG5cdFVudXNlZDE1ID0gXCIxNVwiLFxuXHRVbnVzZWQxNiA9IFwiMTZcIixcblx0TXVsdGlwbGVVc2VycyA9IFwiMTdcIiwgLy8gTXVsdGktdXNlciBzdXBwb3J0IGZvciBuZXcgcGVyc29uYWwgcGxhbnMuXG59XG5cbmV4cG9ydCBjb25zdCBGVUxMX0lOREVYRURfVElNRVNUQU1QOiBudW1iZXIgPSAwXG5leHBvcnQgY29uc3QgTk9USElOR19JTkRFWEVEX1RJTUVTVEFNUDogbnVtYmVyID0gTWF0aC5wb3coMiwgNDIpIC0gMSAvLyBtYXhpbXVtIFRpbWVzdGFtcCBpcyA0MiBiaXQgbG9uZyAoc2VlIEdlbmVyYXRlZElkRGF0YS5qYXZhKVxuXG5leHBvcnQgY29uc3QgRU5USVRZX0VWRU5UX0JBVENIX1RUTF9EQVlTOiBudW1iZXIgPSA0NSAvLyA0NSBkYXlzIChzZWUgSW5zdGFuY2VEYk1hcHBlckV2ZW50Tm90aWZpZXIuamF2YSlcblxuZXhwb3J0IGNvbnN0IGVudW0gUGF5bWVudERhdGFSZXN1bHRUeXBlIHtcblx0T0sgPSBcIjBcIixcblx0Q09VTlRSWV9NSVNNQVRDSCA9IFwiMVwiLFxuXHRJTlZBTElEX1ZBVElEX05VTUJFUiA9IFwiMlwiLFxuXHRDUkVESVRfQ0FSRF9ERUNMSU5FRCA9IFwiM1wiLFxuXHRDUkVESVRfQ0FSRF9DVlZfSU5WQUxJRCA9IFwiNFwiLFxuXHRQQVlNRU5UX1BST1ZJREVSX05PVF9BVkFJTEFCTEUgPSBcIjVcIixcblx0T1RIRVJfUEFZTUVOVF9QUk9WSURFUl9FUlJPUiA9IFwiNlwiLFxuXHRPVEhFUl9QQVlNRU5UX0FDQ09VTlRfUkVKRUNURUQgPSBcIjdcIixcblx0Q09VTERfTk9UX1ZFUklGWV9WQVRJRCA9IFwiOFwiLFxuXHRDUkVESVRfQ0FSRF9EQVRFX0lOVkFMSUQgPSBcIjlcIixcblx0Q1JFRElUX0NBUkRfTlVNQkVSX0lOVkFMSUQgPSBcIjEwXCIsXG5cdENSRURJVF9DQVJEX1ZFUklGSUNBVElPTl9MSU1JVF9SRUFDSEVEID0gXCIxMVwiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDb250YWN0Q29tcGFyaXNvblJlc3VsdCB7XG5cdFVuaXF1ZSA9IFwidW5pcXVlXCIsXG5cdFNpbWlsYXIgPSBcInNpbWlsYXJcIixcblx0RXF1YWwgPSBcImVxdWFsXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEluZGlmZmVyZW50Q29udGFjdENvbXBhcmlzb25SZXN1bHQge1xuXHRPbmVFbXB0eSA9IFwib25lRW1wdHlcIixcblx0Qm90aEVtcHR5ID0gXCJib3RoRW1wdHlcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQ29udGFjdE1lcmdlQWN0aW9uIHtcblx0RGVsZXRlRmlyc3QgPSBcImRlbGV0ZUZpcnN0XCIsXG5cdERlbGV0ZVNlY29uZCA9IFwiZGVsZXRlU2Vjb25kXCIsXG5cdE1lcmdlID0gXCJtZXJnZVwiLFxuXHRTa2lwID0gXCJza2lwXCIsXG5cdENhbmNlbCA9IFwiY2FuY2VsXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEludm9pY2VTdGF0dXMge1xuXHRDUkVBVEVEID0gXCIwXCIsXG5cdFBVQkxJU0hFREZPUkFVVE9NQVRJQyA9IFwiMVwiLFxuXHRQVUJMSVNIRURGT1JNQU5VQUwgPSBcIjJcIixcblx0UEFJRCA9IFwiM1wiLFxuXHRERUJJVEZBSUxFRCA9IFwiNFwiLFxuXHRESVNQVVRFRCA9IFwiNVwiLFxuXHRDQU5DRUxMRUQgPSBcIjZcIixcblx0UEFSVE5FUk1BTkFHRUQgPSBcIjdcIixcblx0RklSU1RSRU1JTkRFUiA9IFwiOFwiLFxuXHRSRUZVTkRFRCA9IFwiOVwiLFxuXHRESVNQVVRFQUNDRVBURUQgPSBcIjEwXCIsXG5cdFNFQ09ORFJFTUlOREVSID0gXCIxMVwiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBDbG9zZUV2ZW50QnVzT3B0aW9uIHtcblx0VGVybWluYXRlID0gXCJ0ZXJtaW5hdGVcIixcblx0UmVjb25uZWN0ID0gXCJyZWNvbm5lY3RcIixcblx0UGF1c2UgPSBcInBhdXNlXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEFubm91bmNlbWVudCB7XG5cdE5vbmUgPSBcIjBcIixcblx0U3RvcmFnZURlbGV0aW9uID0gXCIxXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIENlcnRpZmljYXRlU3RhdGUge1xuXHRWQUxJRCA9IFwiMFwiLFxuXHRWQUxJREFUSU5HID0gXCIxXCIsXG5cdElOVkFMSUQgPSBcIjJcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gQ2VydGlmaWNhdGVUeXBlIHtcblx0TUFOVUFMID0gXCIwXCIsXG5cdExFVFNfRU5DUllQVCA9IFwiMVwiLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0Q2VydGlmaWNhdGVUeXBlKGNlcnRpZmljYXRlSW5mbzogQ2VydGlmaWNhdGVJbmZvKTogQ2VydGlmaWNhdGVUeXBlIHtcblx0cmV0dXJuIGRvd25jYXN0KGNlcnRpZmljYXRlSW5mby50eXBlKVxufVxuXG5leHBvcnQgZW51bSBSZXBlYXRQZXJpb2Qge1xuXHREQUlMWSA9IFwiMFwiLFxuXHRXRUVLTFkgPSBcIjFcIixcblx0TU9OVEhMWSA9IFwiMlwiLFxuXHRBTk5VQUxMWSA9IFwiM1wiLFxufVxuXG5leHBvcnQgY29uc3QgZW51bSBFbmRUeXBlIHtcblx0TmV2ZXIgPSBcIjBcIixcblx0Q291bnQgPSBcIjFcIixcblx0VW50aWxEYXRlID0gXCIyXCIsXG59XG5cbmV4cG9ydCBjb25zdCBkZWZhdWx0Q2FsZW5kYXJDb2xvciA9IFwiMjE5NmYzXCJcblxuZXhwb3J0IGNvbnN0IGVudW0gRXZlbnRUZXh0VGltZU9wdGlvbiB7XG5cdFNUQVJUX1RJTUUgPSBcInN0YXJ0VGltZVwiLFxuXHRFTkRfVElNRSA9IFwiZW5kVGltZVwiLFxuXHRTVEFSVF9FTkRfVElNRSA9IFwic3RhcnRBbmRFbmRUaW1lXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFRpbWVGb3JtYXQge1xuXHRUV0VOVFlfRk9VUl9IT1VSUyA9IFwiMFwiLFxuXHRUV0VMVkVfSE9VUlMgPSBcIjFcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gV2Vla1N0YXJ0IHtcblx0TU9OREFZID0gXCIwXCIsXG5cdFNVTkRBWSA9IFwiMVwiLFxuXHRTQVRVUkRBWSA9IFwiMlwiLFxufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0V2Vla1N0YXJ0KHVzZXJTZXR0aW5nczogVXNlclNldHRpbmdzR3JvdXBSb290KTogV2Vla1N0YXJ0IHtcblx0cmV0dXJuIGRvd25jYXN0KHVzZXJTZXR0aW5ncy5zdGFydE9mVGhlV2Vlaylcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gU2hhcmVDYXBhYmlsaXR5IHtcblx0UmVhZCA9IFwiMFwiLFxuXHRXcml0ZSA9IFwiMVwiLFxuXHRJbnZpdGUgPSBcIjJcIixcbn1cblxuZXhwb3J0IGNvbnN0IFNFQ09ORF9NUyA9IDEwMDBcblxuZXhwb3J0IGNvbnN0IGVudW0gUG9zdGluZ1R5cGUge1xuXHRHZW5lcmljID0gXCIwXCIsXG5cdFVzYWdlRmVlID0gXCIxXCIsXG5cdENyZWRpdCA9IFwiMlwiLFxuXHREaXNwdXRlID0gXCIzXCIsXG5cdFN1c3BlbnNpb24gPSBcIjRcIixcblx0UGF5bWVudCA9IFwiNVwiLFxuXHRSZWZ1bmQgPSBcIjZcIixcblx0U3VzcGVuc2lvbkNhbmNlbCA9IFwiN1wiLFxuXHRHaWZ0Q2FyZCA9IFwiOFwiLFxuXHRTYWxlc0NvbW1pc3Npb24gPSBcIjlcIixcbn1cblxuZXhwb3J0IGVudW0gQ291bnRlclR5cGUge1xuXHREZWZhdWx0ID0gXCIwXCIsXG5cdFNpZ251cCA9IFwiMVwiLFxuXHRVbnJlYWRNYWlscyA9IFwiMlwiLFxuXHRVc2VyU3RvcmFnZUxlZ2FjeSA9IFwiM1wiLFxuXHRHcm91cFN0b3JhZ2VMZWdhY3kgPSBcIjRcIixcblx0VXNlclN0b3JhZ2UgPSBcIjVcIixcblx0R3JvdXBTdG9yYWdlID0gXCI2XCIsXG59XG5cbmV4cG9ydCBjb25zdCBDb3VudGVyVHlwZVRvTmFtZSA9IHJldmVyc2UoQ291bnRlclR5cGUpXG5cbmV4cG9ydCBjb25zdCBlbnVtIFVuc3Vic2NyaWJlRmFpbHVyZVJlYXNvbiB7XG5cdFRPT19NQU5ZX0VOQUJMRURfVVNFUlMgPSBcInVuc3Vic2NyaWJlLnRvb19tYW55X3VzZXJzXCIsXG5cdENVU1RPTV9NQUlMX0FERFJFU1MgPSBcInVuc3Vic2NyaWJlLmN1c3RvbV9tYWlsX2FkZHJlc3NcIixcblx0VE9PX01BTllfQ0FMRU5EQVJTID0gXCJ1bnN1YnNjcmliZS50b29fbWFueV9jYWxlbmRhcnNcIixcblx0Q0FMRU5EQVJfVFlQRSA9IFwidW5zdWJzY2lyYmUuaW52YWxpZF9jYWxlbmRhcl90eXBlXCIsXG5cdFRPT19NQU5ZX0FMSUFTRVMgPSBcInVuc3Vic2NyaWJlLnRvb19tYW55X2FsaWFzZXNcIixcblx0VE9PX01VQ0hfU1RPUkFHRV9VU0VEID0gXCJ1bnN1YnNjcmliZS50b29fbXVjaF9zdG9yYWdlXCIsXG5cdFRPT19NQU5ZX0RPTUFJTlMgPSBcInVuc3Vic2NyaWJlLnRvb19tYW55X2RvbWFpbnNcIixcblx0SEFTX1RFTVBMQVRFX0dST1VQID0gXCJ1bnN1YnNjcmliZS5oYXNfdGVtcGxhdGVfZ3JvdXBcIixcblx0V0hJVEVMQUJFTF9ET01BSU5fQUNUSVZFID0gXCJ1bnN1YnNjcmliZS53aGl0ZWxhYmVsX2RvbWFpbl9hY3RpdmVcIixcblx0U0hBUkVEX0dST1VQX0FDVElWRSA9IFwidW5zdWJzY3JpYmUuc2hhcmVkX2dyb3VwX2FjdGl2ZVwiLFxuXHRIQVNfQ09OVEFDVF9GT1JNID0gXCJ1bnN1YnNjcmliZS5oYXNfY29udGFjdF9mb3JtXCIsXG5cdE5PVF9FTk9VR0hfQ1JFRElUID0gXCJ1bnN1YnNjcmliZS5ub3RfZW5vdWdoX2NyZWRpdFwiLFxuXHRJTlZPSUNFX05PVF9QQUlEID0gXCJ1bnN1YnNjcmliZS5pbnZvaWNlX25vdF9wYWlkXCIsXG5cdEhBU19DT05UQUNUX0xJU1RfR1JPVVAgPSBcInVuc3Vic2NyaWJlLmhhc19jb250YWN0X2xpc3RfZ3JvdXBcIixcblx0QUNUSVZFX0FQUFNUT1JFX1NVQlNDUklQVElPTiA9IFwidW5zdWJzY3JpYmUuYWN0aXZlX2FwcHN0b3JlX3N1YnNjcmlwdGlvblwiLFxuXHRMQUJFTF9MSU1JVF9FWENFRURFRCA9IFwidW5zdWJzY3JpYmUubGFiZWxfbGltaXRfZXhjZWVkZWRcIixcbn1cblxuLy8gbGVnYWN5LCBzaG91bGQgYmUgZGVsZXRlZCBhZnRlciBjbGllbnRzIG9sZGVyIHRoYW4gMy4xMTQgaGF2ZSBiZWVuIGRpc2FibGVkLlxuZXhwb3J0IGNvbnN0IGVudW0gQm9va2luZ0ZhaWx1cmVSZWFzb24ge1xuXHRUT09fTUFOWV9ET01BSU5TID0gXCJib29raW5nc2VydmljZS50b29fbWFueV9kb21haW5zXCIsXG5cdFRPT19NQU5ZX0FMSUFTRVMgPSBcImJvb2tpbmdzZXJ2aWNlLnRvb19tYW55X2FsaWFzZXNcIixcblx0VE9PX01VQ0hfU1RPUkFHRV9VU0VEID0gXCJib29raW5nc2VydmljZS50b29fbXVjaF9zdG9yYWdlX3VzZWRcIixcblx0U0hBUkVEX0dST1VQX0FDVElWRSA9IFwiYm9va2luZ3NlcnZpY2Uuc2hhcmVkX2dyb3VwX2FjdGl2ZVwiLFxuXHRXSElURUxBQkVMX0RPTUFJTl9BQ1RJVkUgPSBcImJvb2tpbmdzZXJ2aWNlLndoaXRlbGFiZWxfZG9tYWluX2FjdGl2ZVwiLFxuXHRIQVNfVEVNUExBVEVfR1JPVVAgPSBcImJvb2tpbmdzZXJ2aWNlLmhhc190ZW1wbGF0ZV9ncm91cFwiLFxufVxuXG4vLyBUaGUgJ2NvZGUnIGZvciB0aGUga2V5cyBpcyBLZXlib2FyZEV2ZW50LmtleVxuZXhwb3J0IGNvbnN0IEtleXMgPSBPYmplY3QuZnJlZXplKHtcblx0Tk9ORToge1xuXHRcdGNvZGU6IFwiXCIsXG5cdFx0bmFtZTogXCJcIixcblx0fSxcblx0UkVUVVJOOiB7XG5cdFx0Y29kZTogXCJlbnRlclwiLFxuXHRcdG5hbWU6IFwi4o+OXCIsXG5cdH0sXG5cdEJBQ0tTUEFDRToge1xuXHRcdGNvZGU6IFwiYmFja3NwYWNlXCIsXG5cdFx0bmFtZTogXCJCQUNLU1BBQ0VcIixcblx0fSxcblx0VEFCOiB7XG5cdFx0Y29kZTogXCJ0YWJcIixcblx0XHRuYW1lOiBcIuKGuVwiLFxuXHR9LFxuXHRTSElGVDoge1xuXHRcdGNvZGU6IFwic2hpZnRcIixcblx0XHRuYW1lOiBcIuKHp1wiLFxuXHR9LFxuXHRDVFJMOiB7XG5cdFx0Y29kZTogXCJjb250cm9sXCIsXG5cdFx0bmFtZTogXCJDVFJMXCIsXG5cdH0sXG5cdEFMVDoge1xuXHRcdGNvZGU6IFwiYWx0XCIsXG5cdFx0bmFtZTogXCJBTFRcIixcblx0fSxcblx0TUVUQToge1xuXHRcdGNvZGU6IFwibWV0YVwiLFxuXHRcdG5hbWU6IFwiXFx1MjMxOFwiLFxuXHR9LFxuXHQvLyBjb21tYW5kIGtleSAobGVmdCkgKE9TWClcblx0RVNDOiB7XG5cdFx0Y29kZTogXCJlc2NhcGVcIixcblx0XHRuYW1lOiBcIkVTQ1wiLFxuXHR9LFxuXHRTUEFDRToge1xuXHRcdGNvZGU6IFwiIFwiLFxuXHRcdG5hbWU6IFwiU3BhY2VcIixcblx0fSxcblx0UEFHRV9VUDoge1xuXHRcdGNvZGU6IFwicGFnZXVwXCIsXG5cdFx0bmFtZTogXCJQYWdlIOKGkVwiLFxuXHR9LFxuXHRQQUdFX0RPV046IHtcblx0XHRjb2RlOiBcInBhZ2Vkb3duXCIsXG5cdFx0bmFtZTogXCJQYWdlIOKGk1wiLFxuXHR9LFxuXHRFTkQ6IHtcblx0XHRjb2RlOiBcImVuZFwiLFxuXHRcdG5hbWU6IFwiRW5kXCIsXG5cdH0sXG5cdEhPTUU6IHtcblx0XHRjb2RlOiBcImhvbWVcIixcblx0XHRuYW1lOiBcIkhvbWVcIixcblx0fSxcblx0TEVGVDoge1xuXHRcdGNvZGU6IFwiYXJyb3dsZWZ0XCIsXG5cdFx0bmFtZTogXCLihpBcIixcblx0fSxcblx0VVA6IHtcblx0XHRjb2RlOiBcImFycm93dXBcIixcblx0XHRuYW1lOiBcIuKGkVwiLFxuXHR9LFxuXHRSSUdIVDoge1xuXHRcdGNvZGU6IFwiYXJyb3dyaWdodFwiLFxuXHRcdG5hbWU6IFwi4oaSXCIsXG5cdH0sXG5cdERPV046IHtcblx0XHRjb2RlOiBcImFycm93ZG93blwiLFxuXHRcdG5hbWU6IFwi4oaTXCIsXG5cdH0sXG5cdERFTEVURToge1xuXHRcdGNvZGU6IFwiZGVsZXRlXCIsXG5cdFx0bmFtZTogXCJERUxcIixcblx0fSxcblx0XCIwXCI6IHtcblx0XHRjb2RlOiBcIjBcIixcblx0XHRuYW1lOiBcIjBcIixcblx0fSxcblx0T05FOiB7XG5cdFx0Y29kZTogXCIxXCIsXG5cdFx0bmFtZTogXCIxXCIsXG5cdH0sXG5cdFRXTzoge1xuXHRcdGNvZGU6IFwiMlwiLFxuXHRcdG5hbWU6IFwiMlwiLFxuXHR9LFxuXHRUSFJFRToge1xuXHRcdGNvZGU6IFwiM1wiLFxuXHRcdG5hbWU6IFwiM1wiLFxuXHR9LFxuXHRGT1VSOiB7XG5cdFx0Y29kZTogXCI0XCIsXG5cdFx0bmFtZTogXCI0XCIsXG5cdH0sXG5cdEZJVkU6IHtcblx0XHRjb2RlOiBcIjVcIixcblx0XHRuYW1lOiBcIjVcIixcblx0fSxcblx0U0lYOiB7XG5cdFx0Y29kZTogXCI2XCIsXG5cdFx0bmFtZTogXCI2XCIsXG5cdH0sXG5cdEE6IHtcblx0XHRjb2RlOiBcImFcIixcblx0XHRuYW1lOiBcIkFcIixcblx0fSxcblx0Qjoge1xuXHRcdGNvZGU6IFwiYlwiLFxuXHRcdG5hbWU6IFwiQlwiLFxuXHR9LFxuXHRDOiB7XG5cdFx0Y29kZTogXCJjXCIsXG5cdFx0bmFtZTogXCJDXCIsXG5cdH0sXG5cdEQ6IHtcblx0XHRjb2RlOiBcImRcIixcblx0XHRuYW1lOiBcIkRcIixcblx0fSxcblx0RToge1xuXHRcdGNvZGU6IFwiZVwiLFxuXHRcdG5hbWU6IFwiRVwiLFxuXHR9LFxuXHRGOiB7XG5cdFx0Y29kZTogXCJmXCIsXG5cdFx0bmFtZTogXCJGXCIsXG5cdH0sXG5cdEg6IHtcblx0XHRjb2RlOiBcImhcIixcblx0XHRuYW1lOiBcIkhcIixcblx0fSxcblx0SToge1xuXHRcdGNvZGU6IFwiaVwiLFxuXHRcdG5hbWU6IFwiSVwiLFxuXHR9LFxuXHRKOiB7XG5cdFx0Y29kZTogXCJqXCIsXG5cdFx0bmFtZTogXCJKXCIsXG5cdH0sXG5cdEs6IHtcblx0XHRjb2RlOiBcImtcIixcblx0XHRuYW1lOiBcIktcIixcblx0fSxcblx0TDoge1xuXHRcdGNvZGU6IFwibFwiLFxuXHRcdG5hbWU6IFwiTFwiLFxuXHR9LFxuXHRNOiB7XG5cdFx0Y29kZTogXCJtXCIsXG5cdFx0bmFtZTogXCJNXCIsXG5cdH0sXG5cdE46IHtcblx0XHRjb2RlOiBcIm5cIixcblx0XHRuYW1lOiBcIk5cIixcblx0fSxcblx0Tzoge1xuXHRcdGNvZGU6IFwib1wiLFxuXHRcdG5hbWU6IFwiT1wiLFxuXHR9LFxuXHRQOiB7XG5cdFx0Y29kZTogXCJwXCIsXG5cdFx0bmFtZTogXCJQXCIsXG5cdH0sXG5cdFE6IHtcblx0XHRjb2RlOiBcInFcIixcblx0XHRuYW1lOiBcIlFcIixcblx0fSxcblx0Ujoge1xuXHRcdGNvZGU6IFwiclwiLFxuXHRcdG5hbWU6IFwiUlwiLFxuXHR9LFxuXHRTOiB7XG5cdFx0Y29kZTogXCJzXCIsXG5cdFx0bmFtZTogXCJTXCIsXG5cdH0sXG5cdFQ6IHtcblx0XHRjb2RlOiBcInRcIixcblx0XHRuYW1lOiBcIlRcIixcblx0fSxcblx0VToge1xuXHRcdGNvZGU6IFwidVwiLFxuXHRcdG5hbWU6IFwiVVwiLFxuXHR9LFxuXHRWOiB7XG5cdFx0Y29kZTogXCJ2XCIsXG5cdFx0bmFtZTogXCJWXCIsXG5cdH0sXG5cdEYxOiB7XG5cdFx0Y29kZTogXCJmMVwiLFxuXHRcdG5hbWU6IFwiRjFcIixcblx0fSxcblx0RjU6IHtcblx0XHRjb2RlOiBcImY1XCIsXG5cdFx0bmFtZTogXCJGNVwiLFxuXHR9LFxuXHRGMTE6IHtcblx0XHRjb2RlOiBcImYxMVwiLFxuXHRcdG5hbWU6IFwiRjExXCIsXG5cdH0sXG5cdEYxMjoge1xuXHRcdGNvZGU6IFwiZjEyXCIsXG5cdFx0bmFtZTogXCJGMTJcIixcblx0fSxcbn0pXG5cbi8vIFNlZTogaHR0cHM6Ly93ZWJhaW0ub3JnL3RlY2huaXF1ZXMva2V5Ym9hcmQvdGFiaW5kZXgjb3ZlcnZpZXdcblxuZXhwb3J0IGNvbnN0IGVudW0gVGFiSW5kZXgge1xuXHRQcm9ncmFtbWF0aWMgPSBcIi0xXCIsXG5cdC8vIGZvY3VzIG9uIGVsZW1lbnQgY2FuIG9ubHkgYmUgc2V0IHByb2dyYW1tYXRpY2FsbHlcblx0RGVmYXVsdCA9IFwiMFwiLCAvLyByZWd1bGFyIHRhYiBvcmRlclxufVxuXG4vLyBLZWVwIG5vbi1jb25zdCBmb3IgYWRtaW5cbmV4cG9ydCBlbnVtIFJlcG9ydGVkTWFpbEZpZWxkVHlwZSB7XG5cdC8qKlxuXHQgKiBGcm9tIGhlYWRlciBhZGRyZXNzLCBhdXRoZW50aWNhdGVkLlxuXHQgKi9cblx0RlJPTV9BRERSRVNTID0gXCIwXCIsXG5cblx0LyoqXG5cdCAqIEZyb20gaGVhZGVyIGFkZHJlc3MsIG5vdCBhdXRoZW50aWNhdGVkIHdpdGggRE1BUkMuXG5cdCAqL1xuXHRGUk9NX0FERFJFU1NfTk9OX0FVVEggPSBcIjFcIixcblxuXHQvKipcblx0ICogRnJvbSBoZWFkZXIgYWRkcmVzcyBkb21haW5cblx0ICovXG5cdEZST01fRE9NQUlOID0gXCIyXCIsXG5cblx0LyoqXG5cdCAqIEZyb20gaGVhZGVyIGFkZHJlc3MgZG9tYWluLCBub3QgYXV0aGVudGljYXRlZCBub3QgYXV0aGVudGljYXRlZCB3aXRoIERNQVJDLlxuXHQgKi9cblx0RlJPTV9ET01BSU5fTk9OX0FVVEggPSBcIjNcIixcblxuXHQvKipcblx0ICogRW1haWwgc3ViamVjdFxuXHQgKi9cblx0U1VCSkVDVCA9IFwiNFwiLFxuXG5cdC8qKlxuXHQgKiBMaW5rIGluIHRoZSBib2R5IG9mIGVtYWlsXG5cdCAqL1xuXHRMSU5LID0gXCI1XCIsXG5cblx0LyoqXG5cdCAqIERvbWFpbiBvZiB0aGUgbGluayBpbiB0aGUgYm9keVxuXHQgKi9cblx0TElOS19ET01BSU4gPSBcIjZcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gTWFpbFBoaXNoaW5nU3RhdHVzIHtcblx0VU5LTk9XTiA9IFwiMFwiLFxuXHRTVVNQSUNJT1VTID0gXCIxXCIsXG5cdFdISVRFTElTVEVEID0gXCIyXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIFBoaXNoaW5nTWFya2VyU3RhdHVzIHtcblx0QUNUSVZFID0gXCIwXCIsXG5cdElOQUNUSVZFID0gXCIxXCIsXG59XG5cbi8vIEtlZXAgbm9uLWNvbnN0IGZvciBhZG1pblxuZXhwb3J0IGVudW0gTWFpbEF1dGhlbnRpY2F0aW9uU3RhdHVzIHtcblx0LyoqXG5cdCAqIERpc3Bvc2l0aW9uOiBOb25lLiBBbGwgY2hlY2tzIGhhdmUgcGFzc2VkLlxuXHQgKi9cblx0QVVUSEVOVElDQVRFRCA9IFwiMFwiLFxuXG5cdC8qKlxuXHQgKiBBdXRoZW50aWNhdGlvbiBoYXMgZmFpbGVkIGJlY2F1c2Ugb2YgdGhlIGRvbWFpbiBwb2xpY3kgb3IgYmVjYXVzZSBvZiB0aGUgU1BGLlxuXHQgKi9cblx0SEFSRF9GQUlMID0gXCIxXCIsXG5cblx0LyoqXG5cdCAqIEF1dGhlbnRpY2F0aW9uIGhhcyBmYWlsZWQgYmVjYXVzZSBvZiBvdXIgb3duIHBvbGljeSwgbW9zdCBjb21tb25seSBhdXRoZW50aWNhdGlvbiBpcyBcIm1pc3NpbmdcIi5cblx0ICovXG5cdFNPRlRfRkFJTCA9IFwiMlwiLFxuXG5cdC8qKlxuXHQgKiBBdXRoZW50aWNhdGlvbiBoYXMgZmFpbGVkIGJlY2F1c2UgRnJvbSBoZWFkZXIgaXMgbm90IHZhbGlkIHNvIHdlIGNvdWxkbid0IGRvIGF1dGhlbnRpY2F0aW9uIGNoZWNrcy5cblx0ICovXG5cdElOVkFMSURfTUFJTF9GUk9NID0gXCIzXCIsXG5cblx0LyoqXG5cdCAqIEF1dGhlbnRpY2F0aW9uIGhhcyBmYWlsZWQgYmVjYXVzZSBGcm9tIGhlYWRlciBpcyBtaXNzaW5nLiBNb3N0IGxpa2VseSBpdCBpcyBzb21lIHRlY2huaWNhbCBtZXNzYWdlIGxpa2UgYm91bmNlIG1haWwuXG5cdCAqL1xuXHRNSVNTSU5HX01BSUxfRlJPTSA9IFwiNFwiLFxufVxuXG4vKipcbiAqIFRoZSBzdGF0dXMgb2YgdGhlIGF1dGhlbnRpY2F0aW9uIHdoZW4gZGVjcnlwdGluZyBhbiBlbmQtdG8tZW5kIGVuY3J5cHRlZCBtZXNzYWdlLlxuICogQXV0aGVudGljYXRpb24gd2FzIG9ubHkgaW50cm9kdWNlZCB3aGVuIHN3aXRjaGluZyB0byBQUS5cbiAqL1xuZXhwb3J0IGVudW0gRW5jcnlwdGlvbkF1dGhTdGF0dXMge1xuXHQvKiogdGhlIGVudGl0eSB3YXMgZW5jcnlwdGVkIHdpdGggUlNBLCBpdCBoYWQgbm8gYXV0aGVudGljYXRpb24qL1xuXHRSU0FfTk9fQVVUSEVOVElDQVRJT04gPSBcIjBcIixcblx0LyoqIHRoZSBlbnRpdHkgd2FzIGVuY3J5cHRlZCB3aXRoIHR1dGEtY3J5cHQgYW5kIGF1dGhlbnRpY2F0aW9uIHN1Y2NlZWRlZCAqL1xuXHRUVVRBQ1JZUFRfQVVUSEVOVElDQVRJT05fU1VDQ0VFREVEID0gXCIxXCIsXG5cdC8qKiB0aGUgZW50aXR5IHdhcyBlbmNyeXB0ZWQgd2l0aCB0dXRhLWNyeXB0IGFuZCBhdXRoZW50aWNhdGlvbiBmYWlsZWQgKi9cblx0VFVUQUNSWVBUX0FVVEhFTlRJQ0FUSU9OX0ZBSUxFRCA9IFwiMlwiLFxuXHQvKiogdGhlIGVudGl0eSB3YXMgZW5jcnlwdGVkIHN5bW1ldHJpY2FsbHksIHdpdGggQUVTLCBpdCBoYWQgbm8gYXV0aGVudGljYXRpb24sIGUuZy4gc2VjdXJlIGV4dGVybmFsIG1haWxib3hlcyAqL1xuXHRBRVNfTk9fQVVUSEVOVElDQVRJT04gPSBcIjNcIixcblx0LyoqIHRoZSBlbnRpdHkgd2FzIHNlbnQgYnkgdXMgZW5jcnlwdGVkIHdpdGggVHV0YUNyeXB0LCBzbyBpdCBpcyBhdXRoZW50aWNhdGVkICovXG5cdFRVVEFDUllQVF9TRU5ERVIgPSBcIjRcIixcbn1cblxuZXhwb3J0IGNvbnN0IGVudW0gTWFpbFJlcG9ydFR5cGUge1xuXHRQSElTSElORyA9IFwiMFwiLFxuXHRTUEFNID0gXCIxXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIERuc1JlY29yZFZhbGlkYXRpb24ge1xuXHRPSyA9IFwi4pyTXCIsXG5cdEJBRCA9IFwi4pyXXCIsXG59XG5cbmV4cG9ydCBlbnVtIENhbGVuZGFyQXR0ZW5kZWVTdGF0dXMge1xuXHQvKiogaW52aXRlIGlzIG5vdCBzZW50IHlldCAqL1xuXHRBRERFRCA9IFwiMFwiLFxuXG5cdC8qKiBhbHJlYWR5IGludml0ZWQgYnV0IGRpZCBub3QgcmVzcG9uZCAqL1xuXHRORUVEU19BQ1RJT04gPSBcIjFcIixcblx0QUNDRVBURUQgPSBcIjJcIixcblx0REVDTElORUQgPSBcIjNcIixcblx0VEVOVEFUSVZFID0gXCI0XCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRBdHRlbmRlZVN0YXR1cyhhdHRlbmRlZTogQ2FsZW5kYXJFdmVudEF0dGVuZGVlKTogQ2FsZW5kYXJBdHRlbmRlZVN0YXR1cyB7XG5cdHJldHVybiBkb3duY2FzdChhdHRlbmRlZS5zdGF0dXMpXG59XG5cbmV4cG9ydCBlbnVtIENhbGVuZGFyTWV0aG9kIHtcblx0UFVCTElTSCA9IFwiUFVCTElTSFwiLFxuXHRSRVFVRVNUID0gXCJSRVFVRVNUXCIsXG5cdFJFUExZID0gXCJSRVBMWVwiLFxuXHRBREQgPSBcIkFERFwiLFxuXHRDQU5DRUwgPSBcIkNBTkNFTFwiLFxuXHRSRUZSRVNIID0gXCJSRUZSRVNIXCIsXG5cdENPVU5URVIgPSBcIkNPVU5URVJcIixcblx0REVDTElORUNPVU5URVIgPSBcIkRFQ0xJTkVDT1VOVEVSXCIsXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIE1haWxNZXRob2Qge1xuXHROT05FID0gXCIwXCIsXG5cdElDQUxfUFVCTElTSCA9IFwiMVwiLFxuXHRJQ0FMX1JFUVVFU1QgPSBcIjJcIixcblx0SUNBTF9SRVBMWSA9IFwiM1wiLFxuXHRJQ0FMX0FERCA9IFwiNFwiLFxuXHRJQ0FMX0NBTkNFTCA9IFwiNVwiLFxuXHRJQ0FMX1JFRlJFU0ggPSBcIjZcIixcblx0SUNBTF9DT1VOVEVSID0gXCI3XCIsXG5cdElDQUxfREVDTElORUNPVU5URVIgPSBcIjhcIixcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIG1haWxNZXRob2RUb0NhbGVuZGFyTWV0aG9kKG1haWxNZXRob2Q6IE1haWxNZXRob2QpOiBDYWxlbmRhck1ldGhvZCB7XG5cdHN3aXRjaCAobWFpbE1ldGhvZCkge1xuXHRcdGNhc2UgTWFpbE1ldGhvZC5JQ0FMX1BVQkxJU0g6XG5cdFx0XHRyZXR1cm4gQ2FsZW5kYXJNZXRob2QuUFVCTElTSFxuXHRcdGNhc2UgTWFpbE1ldGhvZC5JQ0FMX1JFUVVFU1Q6XG5cdFx0XHRyZXR1cm4gQ2FsZW5kYXJNZXRob2QuUkVRVUVTVFxuXHRcdGNhc2UgTWFpbE1ldGhvZC5JQ0FMX1JFUExZOlxuXHRcdFx0cmV0dXJuIENhbGVuZGFyTWV0aG9kLlJFUExZXG5cdFx0Y2FzZSBNYWlsTWV0aG9kLklDQUxfQUREOlxuXHRcdFx0cmV0dXJuIENhbGVuZGFyTWV0aG9kLkFERFxuXHRcdGNhc2UgTWFpbE1ldGhvZC5JQ0FMX0NBTkNFTDpcblx0XHRcdHJldHVybiBDYWxlbmRhck1ldGhvZC5DQU5DRUxcblx0XHRjYXNlIE1haWxNZXRob2QuSUNBTF9SRUZSRVNIOlxuXHRcdFx0cmV0dXJuIENhbGVuZGFyTWV0aG9kLlJFRlJFU0hcblx0XHRjYXNlIE1haWxNZXRob2QuSUNBTF9DT1VOVEVSOlxuXHRcdFx0cmV0dXJuIENhbGVuZGFyTWV0aG9kLkNPVU5URVJcblx0XHRjYXNlIE1haWxNZXRob2QuSUNBTF9ERUNMSU5FQ09VTlRFUjpcblx0XHRcdHJldHVybiBDYWxlbmRhck1ldGhvZC5ERUNMSU5FQ09VTlRFUlxuXHRcdGRlZmF1bHQ6XG5cdFx0XHR0aHJvdyBuZXcgUHJvZ3JhbW1pbmdFcnJvcihcIlVuaGFuZGxlZCBNYWlsTWV0aG9kOiBcIiArIG1haWxNZXRob2QpXG5cdH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEFzRW51bVZhbHVlPEsgZXh0ZW5kcyBrZXlvZiBhbnksIFY+KGVudW1WYWx1ZXM6IFJlY29yZDxLLCBWPiwgdmFsdWU6IHN0cmluZyk6IFYgfCBudWxsIHtcblx0Zm9yIChjb25zdCBrZXkgb2YgT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoZW51bVZhbHVlcykpIHtcblx0XHQvLyBAdHMtaWdub3JlXG5cdFx0Y29uc3QgZW51bVZhbHVlID0gZW51bVZhbHVlc1trZXldXG5cblx0XHRpZiAoZW51bVZhbHVlID09PSB2YWx1ZSkge1xuXHRcdFx0cmV0dXJuIGVudW1WYWx1ZVxuXHRcdH1cblx0fVxuXG5cdHJldHVybiBudWxsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFbnVtVmFsdWU8SyBleHRlbmRzIGtleW9mIGFueSwgVj4oZW51bVZhbHVlczogUmVjb3JkPEssIFY+LCB2YWx1ZTogc3RyaW5nKTogViB7XG5cdGZvciAoY29uc3Qga2V5IG9mIE9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKGVudW1WYWx1ZXMpKSB7XG5cdFx0Ly8gQHRzLWlnbm9yZVxuXHRcdGNvbnN0IGVudW1WYWx1ZSA9IGVudW1WYWx1ZXNba2V5XVxuXG5cdFx0aWYgKGVudW1WYWx1ZSA9PT0gdmFsdWUpIHtcblx0XHRcdHJldHVybiBlbnVtVmFsdWVcblx0XHR9XG5cdH1cblxuXHR0aHJvdyBuZXcgRXJyb3IoYEludmFsaWQgZW51bSB2YWx1ZSAke3ZhbHVlfSBmb3IgJHtKU09OLnN0cmluZ2lmeShlbnVtVmFsdWVzKX1gKVxufVxuXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RW51bUtleTxLIGV4dGVuZHMgc3RyaW5nLCBWPihvYmo6IFJlY29yZDxLLCBWPiwga2V5OiBzdHJpbmcpOiBLIHtcblx0aWYgKGtleSBpbiBvYmopIHtcblx0XHRyZXR1cm4gZG93bmNhc3Qoa2V5KVxuXHR9IGVsc2Uge1xuXHRcdHRocm93IEVycm9yKFwiTm90IHZhbGlkIGVudW0gdmFsdWU6IFwiICsga2V5KVxuXHR9XG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIENsaWVudFR5cGUge1xuXHRCcm93c2VyID0gXCIwXCIsXG5cdERlc2t0b3AgPSBcIjFcIixcblx0QXBwID0gXCIyXCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRDbGllbnRUeXBlKCk6IENsaWVudFR5cGUge1xuXHRyZXR1cm4gaXNBcHAoKSA/IENsaWVudFR5cGUuQXBwIDogaXNFbGVjdHJvbkNsaWVudCgpID8gQ2xpZW50VHlwZS5EZXNrdG9wIDogQ2xpZW50VHlwZS5Ccm93c2VyXG59XG5cbmV4cG9ydCBjb25zdCBlbnVtIEV4dGVybmFsSW1hZ2VSdWxlIHtcblx0Tm9uZSA9IFwiMFwiLFxuXHRBbGxvdyA9IFwiMVwiLFxuXHRCbG9jayA9IFwiMlwiLFxufVxuXG5leHBvcnQgdHlwZSBQYXlQYWxEYXRhID0ge1xuXHRhY2NvdW50OiBzdHJpbmdcbn1cblxuZXhwb3J0IHR5cGUgSW52b2ljZURhdGEgPSB7XG5cdGludm9pY2VBZGRyZXNzOiBzdHJpbmdcblx0Y291bnRyeTogQ291bnRyeSB8IG51bGxcblx0dmF0TnVtYmVyOiBzdHJpbmcgLy8gb25seSBmb3IgRVUgY291bnRyaWVzIG90aGVyd2lzZSBlbXB0eVxufVxuXG5leHBvcnQgdHlwZSBQYXltZW50RGF0YSA9IHtcblx0cGF5bWVudE1ldGhvZDogUGF5bWVudE1ldGhvZFR5cGVcblx0Y3JlZGl0Q2FyZERhdGE6IENyZWRpdENhcmQgfCBudWxsXG59XG5cbmV4cG9ydCBlbnVtIFVzYWdlVGVzdFN0YXRlIHtcblx0Q3JlYXRlZCA9IFwiMFwiLFxuXHRMaXZlID0gXCIxXCIsXG5cdFBhdXNlZCA9IFwiMlwiLFxuXHRGaW5pc2hlZCA9IFwiM1wiLFxufVxuXG5leHBvcnQgY29uc3QgVXNhZ2VUZXN0U3RhdGVUb05hbWUgPSByZXZlcnNlKFVzYWdlVGVzdFN0YXRlKVxuXG5leHBvcnQgZW51bSBVc2FnZVRlc3RNZXRyaWNUeXBlIHtcblx0TnVtYmVyID0gXCIwXCIsXG5cdEVudW0gPSBcIjFcIixcblx0TGlrZXJ0ID0gXCIyXCIsXG59XG5cbmV4cG9ydCBjb25zdCBVc2FnZVRlc3RNZXRyaWNUeXBlVG9OYW1lID0gcmV2ZXJzZShVc2FnZVRlc3RNZXRyaWNUeXBlKVxuXG5leHBvcnQgY29uc3QgZW51bSBBcmNoaXZlRGF0YVR5cGUge1xuXHRBdXRob3JpdHlSZXF1ZXN0cyA9IFwiMFwiLFxuXHRBdHRhY2htZW50cyA9IFwiMVwiLFxuXHRNYWlsRGV0YWlscyA9IFwiMlwiLFxufVxuXG5leHBvcnQgY29uc3QgT0ZGTElORV9TVE9SQUdFX0RFRkFVTFRfVElNRV9SQU5HRV9EQVlTID0gMzFcblxuZXhwb3J0IGVudW0gVXNhZ2VUZXN0UGFydGljaXBhdGlvbk1vZGUge1xuXHRPbmNlID0gXCIwXCIsXG5cdFVubGltaXRlZCA9IFwiMVwiLFxufVxuXG5leHBvcnQgY29uc3QgVXNhZ2VUZXN0UGFydGljaXBhdGlvbk1vZGVUb05hbWUgPSByZXZlcnNlKFVzYWdlVGVzdFBhcnRpY2lwYXRpb25Nb2RlKVxuXG5leHBvcnQgZW51bSBUZXJtaW5hdGlvblBlcmlvZE9wdGlvbnMge1xuXHRFbmRPZkN1cnJlbnRQZXJpb2QgPSBcIjBcIixcblx0RnV0dXJlRGF0ZSA9IFwiMVwiLFxufVxuXG4vKipcbiAqIENvbnZlcnQgdGhlIGlucHV0IHRvIEtkZlR5cGUuXG4gKlxuICogVGhpcyBhY3R1YWxseSByZXR1cm5zIHRoZSBpbnB1dCB3aXRob3V0IG1vZGlmeWluZyBpdCwgYXMgaXQgd3JhcHMgYXJvdW5kIFR5cGVTY3JpcHQncyAnYXMnIG9wZXJhdG9yLCBidXRcbiAqIGl0IGFsc28gZG9lcyBhIHJ1bnRpbWUgY2hlY2ssIGd1YXJhbnRlZWluZyB0aGF0IHRoZSBpbnB1dCBpcyB0cnVseSBhIEtkZlR5cGUuXG4gKlxuICogQHBhcmFtIG1heWJlIGtkZiB0eXBlXG4gKiBAcmV0dXJuIGBtYXliZWAgYXMgS2RmVHlwZVxuICogQHRocm93cyBFcnJvciBpZiB0aGUgaW5wdXQgZG9lc24ndCBjb3JyZXNwb25kIHRvIGEgS2RmVHlwZVxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNLZGZUeXBlKG1heWJlOiBzdHJpbmcpOiBLZGZUeXBlIHtcblx0aWYgKE9iamVjdC52YWx1ZXMoS2RmVHlwZSkuaW5jbHVkZXMobWF5YmUgYXMgS2RmVHlwZSkpIHtcblx0XHRyZXR1cm4gbWF5YmUgYXMgS2RmVHlwZVxuXHR9XG5cdHRocm93IG5ldyBFcnJvcihcImJhZCBrZGYgdHlwZVwiKVxufVxuXG5leHBvcnQgZW51bSBDcnlwdG9Qcm90b2NvbFZlcnNpb24ge1xuXHRSU0EgPSBcIjBcIixcblx0U1lNTUVUUklDX0VOQ1JZUFRJT04gPSBcIjFcIiwgLy8gc2VjdXJlIGV4dGVybmFsXG5cdFRVVEFfQ1JZUFQgPSBcIjJcIiwgLy8gaHlicmlkIFBRIHByb3RvY29sIChLeWJlciArIHgyNTUxOSlcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGFzQ3J5cHRvUHJvdG9vY29sVmVyc2lvbihtYXliZTogTnVtYmVyU3RyaW5nKTogQ3J5cHRvUHJvdG9jb2xWZXJzaW9uIHtcblx0aWYgKE9iamVjdC52YWx1ZXMoQ3J5cHRvUHJvdG9jb2xWZXJzaW9uKS5pbmNsdWRlcyhtYXliZSBhcyBDcnlwdG9Qcm90b2NvbFZlcnNpb24pKSB7XG5cdFx0cmV0dXJuIG1heWJlIGFzIENyeXB0b1Byb3RvY29sVmVyc2lvblxuXHR9XG5cdHRocm93IG5ldyBFcnJvcihcImJhZCBwcm90b2NvbCB2ZXJzaW9uXCIpXG59XG5cbmV4cG9ydCBlbnVtIEdyb3VwS2V5Um90YXRpb25UeXBlIHtcblx0VXNlciA9IFwiMFwiLFxuXHRBZG1pbkdyb3VwS2V5Um90YXRpb25TaW5nbGVVc2VyQWNjb3VudCA9IFwiMVwiLCAvLyBzY2hlZHVsZWQgZm9yIGFjY291bnRzIHRoYXQgb25seSBoYXZlIG9uZSB1c2VyIChpbmNsLiBkZWFjdGl2YXRlZCB1c2Vycylcblx0VGVhbSA9IFwiMlwiLFxuXHRVc2VyQXJlYSA9IFwiM1wiLFxuXHRDdXN0b21lciA9IFwiNFwiLFxuXHRBZG1pbkdyb3VwS2V5Um90YXRpb25NdWx0aXBsZVVzZXJBY2NvdW50ID0gXCI1XCIsIC8vIHNjaGVkdWxlZCBmb3IgYWNjb3VudHMgdGhhdCBoYXZlIG11bHRpcGxlIHVzZXJzIGJ1dCBvbmx5IGEgc2luZ2xlIGFkbWluIHVzZXJcblx0QWRtaW5Hcm91cEtleVJvdGF0aW9uTXVsdGlwbGVBZG1pbkFjY291bnQgPSBcIjZcIiwgLy8gc2NoZWR1bGVkIGZvciBhY2NvdW50cyB0aGF0IGhhdmUgbXVsdGlwbGUgYWRtaW4gdXNlcnNcbn1cblxuZXhwb3J0IGNvbnN0IEdyb3VwS2V5Um90YXRpb25UeXBlTmFtZUJ5Q29kZSA9IHJldmVyc2UoR3JvdXBLZXlSb3RhdGlvblR5cGUpXG5cbmV4cG9ydCBjb25zdCBFWFRFUk5BTF9DQUxFTkRBUl9TWU5DX0lOVEVSVkFMID0gNjAgKiAzMCAqIDEwMDAgLy8gMzAgbWludXRlc1xuXG5leHBvcnQgY29uc3QgREVGQVVMVF9FUlJPUiA9IFwiZGVmYXVsdEVycm9yXCJcblxuZXhwb3J0IGVudW0gUHVibGljS2V5SWRlbnRpZmllclR5cGUge1xuXHRNQUlMX0FERFJFU1MgPSBcIjBcIixcblx0R1JPVVBfSUQgPSBcIjFcIixcbn1cblxuZXhwb3J0IGVudW0gQmxvYkFjY2Vzc1Rva2VuS2luZCB7XG5cdEFyY2hpdmUgPSBcIjBcIixcblx0SW5zdGFuY2VzID0gXCIxXCIsXG59XG5cbmV4cG9ydCBmdW5jdGlvbiBhc1B1YmxpY0tleUlkZW50aWZpZXIobWF5YmU6IE51bWJlclN0cmluZyk6IFB1YmxpY0tleUlkZW50aWZpZXJUeXBlIHtcblx0aWYgKE9iamVjdC52YWx1ZXMoUHVibGljS2V5SWRlbnRpZmllclR5cGUpLmluY2x1ZGVzKG1heWJlIGFzIFB1YmxpY0tleUlkZW50aWZpZXJUeXBlKSkge1xuXHRcdHJldHVybiBtYXliZSBhcyBQdWJsaWNLZXlJZGVudGlmaWVyVHlwZVxuXHR9XG5cdHRocm93IG5ldyBFcnJvcihcImJhZCBrZXkgaWRlbnRpZmllciB0eXBlXCIpXG59XG5cbmV4cG9ydCBjb25zdCBDTElFTlRfT05MWV9DQUxFTkRBUl9CSVJUSERBWVNfQkFTRV9JRCA9IFwiY2xpZW50T25seV9iaXJ0aGRheXNcIlxuZXhwb3J0IGNvbnN0IENMSUVOVF9PTkxZX0NBTEVOREFSUzogTWFwPElkLCBUcmFuc2xhdGlvbktleT4gPSBuZXcgTWFwKFtbQ0xJRU5UX09OTFlfQ0FMRU5EQVJfQklSVEhEQVlTX0JBU0VfSUQsIFwiYmlydGhkYXlDYWxlbmRhcl9sYWJlbFwiXV0pXG5leHBvcnQgY29uc3QgREVGQVVMVF9DTElFTlRfT05MWV9DQUxFTkRBUl9DT0xPUlM6IE1hcDxJZCwgc3RyaW5nPiA9IG5ldyBNYXAoW1tDTElFTlRfT05MWV9DQUxFTkRBUl9CSVJUSERBWVNfQkFTRV9JRCwgXCJGRjk5MzNcIl1dKVxuXG5leHBvcnQgY29uc3QgTUFYX0xBQkVMU19QRVJfTUFJTCA9IDVcblxuZXhwb3J0IGNvbnN0IGVudW0gSW1wb3J0U3RhdHVzIHtcblx0UnVubmluZyA9IDAsXG5cdFBhdXNlZCA9IDEsXG5cdENhbmNlbGVkID0gMixcblx0RmluaXNoZWQgPSAzLFxufVxuIl0sIm1hcHBp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TUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELE1BQU07RUFDTCxNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0QsTUFBTTtFQUNMLE1BQU07RUFDTixNQUFNO0NBQ047Q0FDRCxJQUFJO0VBQ0gsTUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELE9BQU87RUFDTixNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0QsTUFBTTtFQUNMLE1BQU07RUFDTixNQUFNO0NBQ047Q0FDRCxRQUFRO0VBQ1AsTUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELEtBQUs7RUFDSixNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0QsS0FBSztFQUNKLE1BQU07RUFDTixNQUFNO0NBQ047Q0FDRCxLQUFLO0VBQ0osTUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELE9BQU87RUFDTixNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0QsTUFBTTtFQUNMLE1BQU07RUFDTixNQUFNO0NBQ047Q0FDRCxNQUFNO0VBQ0wsTUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELEtBQUs7RUFDSixNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0QsR0FBRztFQUNGLE1BQU07RUFDTixNQUFNO0NBQ047Q0FDRCxHQUFHO0VBQ0YsTUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELEdBQUc7RUFDRixNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0QsR0FBRztFQUNGLE1BQU07RUFDTixNQUFNO0NBQ047Q0FDRCxHQUFHO0VBQ0YsTUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELEdBQUc7RUFDRixNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0QsR0FBRztFQUNGLE1BQU07RUFDTixNQUFNO0NBQ047Q0FDRCxHQUFHO0VBQ0YsTUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELEdBQUc7RUFDRixNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0QsR0FBRztFQUNGLE1BQU07RUFDTixNQUFNO0NBQ047Q0FDRCxHQUFHO0VBQ0YsTUFBTTtFQUNOLE1BQU07Q0FDTjtDQUNELEdBQUc7RUFDRixNQUFNO0VBQ04sTUFBTTtDQUNOO0NBQ0Qs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