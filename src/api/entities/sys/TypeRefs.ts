import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef} from "@tutao/tutanota-utils"
import {typeModels} from "./TypeModels.js"


export const AccountingInfoTypeRef: TypeRef<AccountingInfo> = new TypeRef("sys", "AccountingInfo")

export function createAccountingInfo(values?: Partial<AccountingInfo>): AccountingInfo {
	return Object.assign(create(typeModels.AccountingInfo, AccountingInfoTypeRef), values)
}

export type AccountingInfo = {
	_type: TypeRef<AccountingInfo>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_modified: Date;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	business: boolean;
	invoiceAddress: string;
	invoiceCountry: null | string;
	invoiceName: string;
	invoiceVatIdNo: string;
	lastInvoiceNbrOfSentSms: NumberString;
	lastInvoiceTimestamp: null | Date;
	paymentAccountIdentifier: null | string;
	paymentInterval: NumberString;
	paymentMethod: null | NumberString;
	paymentMethodInfo: null | string;
	paymentProviderCustomerId: null | string;
	paypalBillingAgreement: null | string;
	secondCountryInfo: NumberString;

	invoiceInfo:  null | Id;
}
export const AdministratedGroupTypeRef: TypeRef<AdministratedGroup> = new TypeRef("sys", "AdministratedGroup")

export function createAdministratedGroup(values?: Partial<AdministratedGroup>): AdministratedGroup {
	return Object.assign(create(typeModels.AdministratedGroup, AdministratedGroupTypeRef), values)
}

export type AdministratedGroup = {
	_type: TypeRef<AdministratedGroup>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	groupType: NumberString;

	groupInfo: IdTuple;
	localAdminGroup: Id;
}
export const AdministratedGroupsRefTypeRef: TypeRef<AdministratedGroupsRef> = new TypeRef("sys", "AdministratedGroupsRef")

export function createAdministratedGroupsRef(values?: Partial<AdministratedGroupsRef>): AdministratedGroupsRef {
	return Object.assign(create(typeModels.AdministratedGroupsRef, AdministratedGroupsRefTypeRef), values)
}

export type AdministratedGroupsRef = {
	_type: TypeRef<AdministratedGroupsRef>;

	_id: Id;

	items: Id;
}
export const AlarmInfoTypeRef: TypeRef<AlarmInfo> = new TypeRef("sys", "AlarmInfo")

export function createAlarmInfo(values?: Partial<AlarmInfo>): AlarmInfo {
	return Object.assign(create(typeModels.AlarmInfo, AlarmInfoTypeRef), values)
}

export type AlarmInfo = {
	_type: TypeRef<AlarmInfo>;

	_id: Id;
	alarmIdentifier: string;
	trigger: string;

	calendarRef: CalendarEventRef;
}
export const AlarmNotificationTypeRef: TypeRef<AlarmNotification> = new TypeRef("sys", "AlarmNotification")

export function createAlarmNotification(values?: Partial<AlarmNotification>): AlarmNotification {
	return Object.assign(create(typeModels.AlarmNotification, AlarmNotificationTypeRef), values)
}

export type AlarmNotification = {
	_type: TypeRef<AlarmNotification>;

	_id: Id;
	eventEnd: Date;
	eventStart: Date;
	operation: NumberString;
	summary: string;

	alarmInfo: AlarmInfo;
	notificationSessionKeys: NotificationSessionKey[];
	repeatRule:  null | RepeatRule;
	user: Id;
}
export const AlarmServicePostTypeRef: TypeRef<AlarmServicePost> = new TypeRef("sys", "AlarmServicePost")

export function createAlarmServicePost(values?: Partial<AlarmServicePost>): AlarmServicePost {
	return Object.assign(create(typeModels.AlarmServicePost, AlarmServicePostTypeRef), values)
}

export type AlarmServicePost = {
	_type: TypeRef<AlarmServicePost>;
	_errors: Object;

	_format: NumberString;

	alarmNotifications: AlarmNotification[];
}
export const ArchiveRefTypeRef: TypeRef<ArchiveRef> = new TypeRef("sys", "ArchiveRef")

export function createArchiveRef(values?: Partial<ArchiveRef>): ArchiveRef {
	return Object.assign(create(typeModels.ArchiveRef, ArchiveRefTypeRef), values)
}

export type ArchiveRef = {
	_type: TypeRef<ArchiveRef>;

	_id: Id;
	archiveId: Id;
}
export const ArchiveTypeTypeRef: TypeRef<ArchiveType> = new TypeRef("sys", "ArchiveType")

export function createArchiveType(values?: Partial<ArchiveType>): ArchiveType {
	return Object.assign(create(typeModels.ArchiveType, ArchiveTypeTypeRef), values)
}

export type ArchiveType = {
	_type: TypeRef<ArchiveType>;

	_id: Id;

	active: ArchiveRef;
	inactive: ArchiveRef[];
	type: TypeInfo;
}
export const AuditLogEntryTypeRef: TypeRef<AuditLogEntry> = new TypeRef("sys", "AuditLogEntry")

export function createAuditLogEntry(values?: Partial<AuditLogEntry>): AuditLogEntry {
	return Object.assign(create(typeModels.AuditLogEntry, AuditLogEntryTypeRef), values)
}

export type AuditLogEntry = {
	_type: TypeRef<AuditLogEntry>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	action: string;
	actorIpAddress: null | string;
	actorMailAddress: string;
	date: Date;
	modifiedEntity: string;

	groupInfo:  null | IdTuple;
	modifiedGroupInfo:  null | IdTuple;
}
export const AuditLogRefTypeRef: TypeRef<AuditLogRef> = new TypeRef("sys", "AuditLogRef")

export function createAuditLogRef(values?: Partial<AuditLogRef>): AuditLogRef {
	return Object.assign(create(typeModels.AuditLogRef, AuditLogRefTypeRef), values)
}

export type AuditLogRef = {
	_type: TypeRef<AuditLogRef>;

	_id: Id;

	items: Id;
}
export const AuthenticatedDeviceTypeRef: TypeRef<AuthenticatedDevice> = new TypeRef("sys", "AuthenticatedDevice")

export function createAuthenticatedDevice(values?: Partial<AuthenticatedDevice>): AuthenticatedDevice {
	return Object.assign(create(typeModels.AuthenticatedDevice, AuthenticatedDeviceTypeRef), values)
}

export type AuthenticatedDevice = {
	_type: TypeRef<AuthenticatedDevice>;

	_id: Id;
	authType: NumberString;
	deviceKey: Uint8Array;
	deviceToken: string;
}
export const AuthenticationTypeRef: TypeRef<Authentication> = new TypeRef("sys", "Authentication")

export function createAuthentication(values?: Partial<Authentication>): Authentication {
	return Object.assign(create(typeModels.Authentication, AuthenticationTypeRef), values)
}

export type Authentication = {
	_type: TypeRef<Authentication>;

	_id: Id;
	accessToken: null | string;
	authVerifier: null | string;
	externalAuthToken: null | string;

	userId: Id;
}
export const AutoLoginDataDeleteTypeRef: TypeRef<AutoLoginDataDelete> = new TypeRef("sys", "AutoLoginDataDelete")

export function createAutoLoginDataDelete(values?: Partial<AutoLoginDataDelete>): AutoLoginDataDelete {
	return Object.assign(create(typeModels.AutoLoginDataDelete, AutoLoginDataDeleteTypeRef), values)
}

export type AutoLoginDataDelete = {
	_type: TypeRef<AutoLoginDataDelete>;

	_format: NumberString;
	deviceToken: string;
}
export const AutoLoginDataGetTypeRef: TypeRef<AutoLoginDataGet> = new TypeRef("sys", "AutoLoginDataGet")

export function createAutoLoginDataGet(values?: Partial<AutoLoginDataGet>): AutoLoginDataGet {
	return Object.assign(create(typeModels.AutoLoginDataGet, AutoLoginDataGetTypeRef), values)
}

export type AutoLoginDataGet = {
	_type: TypeRef<AutoLoginDataGet>;

	_format: NumberString;
	deviceToken: string;

	userId: Id;
}
export const AutoLoginDataReturnTypeRef: TypeRef<AutoLoginDataReturn> = new TypeRef("sys", "AutoLoginDataReturn")

export function createAutoLoginDataReturn(values?: Partial<AutoLoginDataReturn>): AutoLoginDataReturn {
	return Object.assign(create(typeModels.AutoLoginDataReturn, AutoLoginDataReturnTypeRef), values)
}

export type AutoLoginDataReturn = {
	_type: TypeRef<AutoLoginDataReturn>;

	_format: NumberString;
	deviceKey: Uint8Array;
}
export const AutoLoginPostReturnTypeRef: TypeRef<AutoLoginPostReturn> = new TypeRef("sys", "AutoLoginPostReturn")

export function createAutoLoginPostReturn(values?: Partial<AutoLoginPostReturn>): AutoLoginPostReturn {
	return Object.assign(create(typeModels.AutoLoginPostReturn, AutoLoginPostReturnTypeRef), values)
}

export type AutoLoginPostReturn = {
	_type: TypeRef<AutoLoginPostReturn>;

	_format: NumberString;
	deviceToken: string;
}
export const BlobTypeRef: TypeRef<Blob> = new TypeRef("sys", "Blob")

export function createBlob(values?: Partial<Blob>): Blob {
	return Object.assign(create(typeModels.Blob, BlobTypeRef), values)
}

export type Blob = {
	_type: TypeRef<Blob>;

	_id: Id;
	archiveId: Id;
	blobId: Id;
	size: NumberString;
}
export const BlobReferenceTokenWrapperTypeRef: TypeRef<BlobReferenceTokenWrapper> = new TypeRef("sys", "BlobReferenceTokenWrapper")

export function createBlobReferenceTokenWrapper(values?: Partial<BlobReferenceTokenWrapper>): BlobReferenceTokenWrapper {
	return Object.assign(create(typeModels.BlobReferenceTokenWrapper, BlobReferenceTokenWrapperTypeRef), values)
}

export type BlobReferenceTokenWrapper = {
	_type: TypeRef<BlobReferenceTokenWrapper>;

	_id: Id;
	blobReferenceToken: string;
}
export const BookingTypeRef: TypeRef<Booking> = new TypeRef("sys", "Booking")

export function createBooking(values?: Partial<Booking>): Booking {
	return Object.assign(create(typeModels.Booking, BookingTypeRef), values)
}

export type Booking = {
	_type: TypeRef<Booking>;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	business: boolean;
	createDate: Date;
	endDate: null | Date;
	paymentInterval: NumberString;
	paymentMonths: NumberString;

	items: BookingItem[];
}
export const BookingItemTypeRef: TypeRef<BookingItem> = new TypeRef("sys", "BookingItem")

export function createBookingItem(values?: Partial<BookingItem>): BookingItem {
	return Object.assign(create(typeModels.BookingItem, BookingItemTypeRef), values)
}

export type BookingItem = {
	_type: TypeRef<BookingItem>;

	_id: Id;
	currentCount: NumberString;
	currentInvoicedCount: NumberString;
	featureType: NumberString;
	maxCount: NumberString;
	price: NumberString;
	priceType: NumberString;
	totalInvoicedCount: NumberString;
}
export const BookingServiceDataTypeRef: TypeRef<BookingServiceData> = new TypeRef("sys", "BookingServiceData")

export function createBookingServiceData(values?: Partial<BookingServiceData>): BookingServiceData {
	return Object.assign(create(typeModels.BookingServiceData, BookingServiceDataTypeRef), values)
}

export type BookingServiceData = {
	_type: TypeRef<BookingServiceData>;

	_format: NumberString;
	amount: NumberString;
	date: null | Date;
	featureType: NumberString;
}
export const BookingsRefTypeRef: TypeRef<BookingsRef> = new TypeRef("sys", "BookingsRef")

export function createBookingsRef(values?: Partial<BookingsRef>): BookingsRef {
	return Object.assign(create(typeModels.BookingsRef, BookingsRefTypeRef), values)
}

export type BookingsRef = {
	_type: TypeRef<BookingsRef>;

	_id: Id;

	items: Id;
}
export const BootstrapFeatureTypeRef: TypeRef<BootstrapFeature> = new TypeRef("sys", "BootstrapFeature")

export function createBootstrapFeature(values?: Partial<BootstrapFeature>): BootstrapFeature {
	return Object.assign(create(typeModels.BootstrapFeature, BootstrapFeatureTypeRef), values)
}

export type BootstrapFeature = {
	_type: TypeRef<BootstrapFeature>;

	_id: Id;
	feature: NumberString;
}
export const Braintree3ds2RequestTypeRef: TypeRef<Braintree3ds2Request> = new TypeRef("sys", "Braintree3ds2Request")

export function createBraintree3ds2Request(values?: Partial<Braintree3ds2Request>): Braintree3ds2Request {
	return Object.assign(create(typeModels.Braintree3ds2Request, Braintree3ds2RequestTypeRef), values)
}

export type Braintree3ds2Request = {
	_type: TypeRef<Braintree3ds2Request>;

	_id: Id;
	bin: string;
	clientToken: string;
	nonce: string;
}
export const Braintree3ds2ResponseTypeRef: TypeRef<Braintree3ds2Response> = new TypeRef("sys", "Braintree3ds2Response")

export function createBraintree3ds2Response(values?: Partial<Braintree3ds2Response>): Braintree3ds2Response {
	return Object.assign(create(typeModels.Braintree3ds2Response, Braintree3ds2ResponseTypeRef), values)
}

export type Braintree3ds2Response = {
	_type: TypeRef<Braintree3ds2Response>;

	_id: Id;
	clientToken: string;
	nonce: string;
}
export const BrandingDomainDataTypeRef: TypeRef<BrandingDomainData> = new TypeRef("sys", "BrandingDomainData")

export function createBrandingDomainData(values?: Partial<BrandingDomainData>): BrandingDomainData {
	return Object.assign(create(typeModels.BrandingDomainData, BrandingDomainDataTypeRef), values)
}

export type BrandingDomainData = {
	_type: TypeRef<BrandingDomainData>;

	_format: NumberString;
	domain: string;
	sessionEncPemCertificateChain: null | Uint8Array;
	sessionEncPemPrivateKey: null | Uint8Array;
	systemAdminPubEncSessionKey: Uint8Array;
}
export const BrandingDomainDeleteDataTypeRef: TypeRef<BrandingDomainDeleteData> = new TypeRef("sys", "BrandingDomainDeleteData")

export function createBrandingDomainDeleteData(values?: Partial<BrandingDomainDeleteData>): BrandingDomainDeleteData {
	return Object.assign(create(typeModels.BrandingDomainDeleteData, BrandingDomainDeleteDataTypeRef), values)
}

export type BrandingDomainDeleteData = {
	_type: TypeRef<BrandingDomainDeleteData>;

	_format: NumberString;
	domain: string;
}
export const BrandingDomainGetReturnTypeRef: TypeRef<BrandingDomainGetReturn> = new TypeRef("sys", "BrandingDomainGetReturn")

export function createBrandingDomainGetReturn(values?: Partial<BrandingDomainGetReturn>): BrandingDomainGetReturn {
	return Object.assign(create(typeModels.BrandingDomainGetReturn, BrandingDomainGetReturnTypeRef), values)
}

export type BrandingDomainGetReturn = {
	_type: TypeRef<BrandingDomainGetReturn>;

	_format: NumberString;

	certificateInfo:  null | CertificateInfo;
}
export const BucketTypeRef: TypeRef<Bucket> = new TypeRef("sys", "Bucket")

export function createBucket(values?: Partial<Bucket>): Bucket {
	return Object.assign(create(typeModels.Bucket, BucketTypeRef), values)
}

export type Bucket = {
	_type: TypeRef<Bucket>;

	_id: Id;

	bucketPermissions: Id;
}
export const BucketKeyTypeRef: TypeRef<BucketKey> = new TypeRef("sys", "BucketKey")

export function createBucketKey(values?: Partial<BucketKey>): BucketKey {
	return Object.assign(create(typeModels.BucketKey, BucketKeyTypeRef), values)
}

export type BucketKey = {
	_type: TypeRef<BucketKey>;

	_id: Id;
	groupEncBucketKey: null | Uint8Array;
	pubEncBucketKey: null | Uint8Array;

	bucketEncSessionKeys: InstanceSessionKey[];
	keyGroup:  null | Id;
}
export const BucketPermissionTypeRef: TypeRef<BucketPermission> = new TypeRef("sys", "BucketPermission")

export function createBucketPermission(values?: Partial<BucketPermission>): BucketPermission {
	return Object.assign(create(typeModels.BucketPermission, BucketPermissionTypeRef), values)
}

export type BucketPermission = {
	_type: TypeRef<BucketPermission>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	ownerEncBucketKey: null | Uint8Array;
	pubEncBucketKey: null | Uint8Array;
	pubKeyVersion: null | NumberString;
	symEncBucketKey: null | Uint8Array;
	type: NumberString;

	group: Id;
}
export const CalendarEventRefTypeRef: TypeRef<CalendarEventRef> = new TypeRef("sys", "CalendarEventRef")

export function createCalendarEventRef(values?: Partial<CalendarEventRef>): CalendarEventRef {
	return Object.assign(create(typeModels.CalendarEventRef, CalendarEventRefTypeRef), values)
}

export type CalendarEventRef = {
	_type: TypeRef<CalendarEventRef>;

	_id: Id;
	elementId: Id;
	listId: Id;
}
export const CertificateInfoTypeRef: TypeRef<CertificateInfo> = new TypeRef("sys", "CertificateInfo")

export function createCertificateInfo(values?: Partial<CertificateInfo>): CertificateInfo {
	return Object.assign(create(typeModels.CertificateInfo, CertificateInfoTypeRef), values)
}

export type CertificateInfo = {
	_type: TypeRef<CertificateInfo>;

	_id: Id;
	expiryDate: null | Date;
	state: NumberString;
	type: NumberString;

	certificate:  null | Id;
}
export const ChallengeTypeRef: TypeRef<Challenge> = new TypeRef("sys", "Challenge")

export function createChallenge(values?: Partial<Challenge>): Challenge {
	return Object.assign(create(typeModels.Challenge, ChallengeTypeRef), values)
}

export type Challenge = {
	_type: TypeRef<Challenge>;

	_id: Id;
	type: NumberString;

	otp:  null | OtpChallenge;
	u2f:  null | U2fChallenge;
}
export const ChangePasswordDataTypeRef: TypeRef<ChangePasswordData> = new TypeRef("sys", "ChangePasswordData")

export function createChangePasswordData(values?: Partial<ChangePasswordData>): ChangePasswordData {
	return Object.assign(create(typeModels.ChangePasswordData, ChangePasswordDataTypeRef), values)
}

export type ChangePasswordData = {
	_type: TypeRef<ChangePasswordData>;

	_format: NumberString;
	code: null | string;
	oldVerifier: null | Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	recoverCodeVerifier: null | Uint8Array;
	salt: Uint8Array;
	verifier: Uint8Array;
}
export const ChatTypeRef: TypeRef<Chat> = new TypeRef("sys", "Chat")

export function createChat(values?: Partial<Chat>): Chat {
	return Object.assign(create(typeModels.Chat, ChatTypeRef), values)
}

export type Chat = {
	_type: TypeRef<Chat>;

	_id: Id;
	recipient: Id;
	sender: Id;
	text: string;
}
export const CloseSessionServicePostTypeRef: TypeRef<CloseSessionServicePost> = new TypeRef("sys", "CloseSessionServicePost")

export function createCloseSessionServicePost(values?: Partial<CloseSessionServicePost>): CloseSessionServicePost {
	return Object.assign(create(typeModels.CloseSessionServicePost, CloseSessionServicePostTypeRef), values)
}

export type CloseSessionServicePost = {
	_type: TypeRef<CloseSessionServicePost>;

	_format: NumberString;
	accessToken: string;

	sessionId: IdTuple;
}
export const CreateCustomerServerPropertiesDataTypeRef: TypeRef<CreateCustomerServerPropertiesData> = new TypeRef("sys", "CreateCustomerServerPropertiesData")

export function createCreateCustomerServerPropertiesData(values?: Partial<CreateCustomerServerPropertiesData>): CreateCustomerServerPropertiesData {
	return Object.assign(create(typeModels.CreateCustomerServerPropertiesData, CreateCustomerServerPropertiesDataTypeRef), values)
}

export type CreateCustomerServerPropertiesData = {
	_type: TypeRef<CreateCustomerServerPropertiesData>;

	_format: NumberString;
	adminGroupEncSessionKey: Uint8Array;
}
export const CreateCustomerServerPropertiesReturnTypeRef: TypeRef<CreateCustomerServerPropertiesReturn> = new TypeRef("sys", "CreateCustomerServerPropertiesReturn")

export function createCreateCustomerServerPropertiesReturn(values?: Partial<CreateCustomerServerPropertiesReturn>): CreateCustomerServerPropertiesReturn {
	return Object.assign(create(typeModels.CreateCustomerServerPropertiesReturn, CreateCustomerServerPropertiesReturnTypeRef), values)
}

export type CreateCustomerServerPropertiesReturn = {
	_type: TypeRef<CreateCustomerServerPropertiesReturn>;

	_format: NumberString;

	id: Id;
}
export const CreateGroupDataTypeRef: TypeRef<CreateGroupData> = new TypeRef("sys", "CreateGroupData")

export function createCreateGroupData(values?: Partial<CreateGroupData>): CreateGroupData {
	return Object.assign(create(typeModels.CreateGroupData, CreateGroupDataTypeRef), values)
}

export type CreateGroupData = {
	_type: TypeRef<CreateGroupData>;

	_id: Id;
	adminEncGKey: Uint8Array;
	customerEncUserGroupInfoSessionKey: null | Uint8Array;
	encryptedName: Uint8Array;
	listEncSessionKey: Uint8Array;
	mailAddress: null | string;
	pubKey: Uint8Array;
	symEncGKey: Uint8Array;
	symEncPrivKey: Uint8Array;
}
export const CreateGroupListDataTypeRef: TypeRef<CreateGroupListData> = new TypeRef("sys", "CreateGroupListData")

export function createCreateGroupListData(values?: Partial<CreateGroupListData>): CreateGroupListData {
	return Object.assign(create(typeModels.CreateGroupListData, CreateGroupListDataTypeRef), values)
}

export type CreateGroupListData = {
	_type: TypeRef<CreateGroupListData>;

	_id: Id;
	adminEncGroupInfoListKey: Uint8Array;
	customerEncGroupInfoListKey: Uint8Array;

	createGroupData:  null | CreateGroupData;
}
export const CreateSessionDataTypeRef: TypeRef<CreateSessionData> = new TypeRef("sys", "CreateSessionData")

export function createCreateSessionData(values?: Partial<CreateSessionData>): CreateSessionData {
	return Object.assign(create(typeModels.CreateSessionData, CreateSessionDataTypeRef), values)
}

export type CreateSessionData = {
	_type: TypeRef<CreateSessionData>;

	_format: NumberString;
	accessKey: null | Uint8Array;
	authToken: null | string;
	authVerifier: null | string;
	clientIdentifier: string;
	mailAddress: null | string;
	recoverCodeVerifier: null | string;

	user:  null | Id;
}
export const CreateSessionReturnTypeRef: TypeRef<CreateSessionReturn> = new TypeRef("sys", "CreateSessionReturn")

export function createCreateSessionReturn(values?: Partial<CreateSessionReturn>): CreateSessionReturn {
	return Object.assign(create(typeModels.CreateSessionReturn, CreateSessionReturnTypeRef), values)
}

export type CreateSessionReturn = {
	_type: TypeRef<CreateSessionReturn>;

	_format: NumberString;
	accessToken: string;

	challenges: Challenge[];
	user: Id;
}
export const CreditCardTypeRef: TypeRef<CreditCard> = new TypeRef("sys", "CreditCard")

export function createCreditCard(values?: Partial<CreditCard>): CreditCard {
	return Object.assign(create(typeModels.CreditCard, CreditCardTypeRef), values)
}

export type CreditCard = {
	_type: TypeRef<CreditCard>;

	_id: Id;
	cardHolderName: string;
	cvv: string;
	expirationMonth: string;
	expirationYear: string;
	number: string;
}
export const CustomDomainCheckGetInTypeRef: TypeRef<CustomDomainCheckGetIn> = new TypeRef("sys", "CustomDomainCheckGetIn")

export function createCustomDomainCheckGetIn(values?: Partial<CustomDomainCheckGetIn>): CustomDomainCheckGetIn {
	return Object.assign(create(typeModels.CustomDomainCheckGetIn, CustomDomainCheckGetInTypeRef), values)
}

export type CustomDomainCheckGetIn = {
	_type: TypeRef<CustomDomainCheckGetIn>;

	_format: NumberString;
	domain: string;

	customer:  null | Id;
}
export const CustomDomainCheckGetOutTypeRef: TypeRef<CustomDomainCheckGetOut> = new TypeRef("sys", "CustomDomainCheckGetOut")

export function createCustomDomainCheckGetOut(values?: Partial<CustomDomainCheckGetOut>): CustomDomainCheckGetOut {
	return Object.assign(create(typeModels.CustomDomainCheckGetOut, CustomDomainCheckGetOutTypeRef), values)
}

export type CustomDomainCheckGetOut = {
	_type: TypeRef<CustomDomainCheckGetOut>;

	_format: NumberString;
	checkResult: NumberString;

	invalidRecords: DnsRecord[];
	missingRecords: DnsRecord[];
	requiredRecords: DnsRecord[];
}
export const CustomDomainDataTypeRef: TypeRef<CustomDomainData> = new TypeRef("sys", "CustomDomainData")

export function createCustomDomainData(values?: Partial<CustomDomainData>): CustomDomainData {
	return Object.assign(create(typeModels.CustomDomainData, CustomDomainDataTypeRef), values)
}

export type CustomDomainData = {
	_type: TypeRef<CustomDomainData>;

	_format: NumberString;
	domain: string;

	catchAllMailGroup:  null | Id;
}
export const CustomDomainReturnTypeRef: TypeRef<CustomDomainReturn> = new TypeRef("sys", "CustomDomainReturn")

export function createCustomDomainReturn(values?: Partial<CustomDomainReturn>): CustomDomainReturn {
	return Object.assign(create(typeModels.CustomDomainReturn, CustomDomainReturnTypeRef), values)
}

export type CustomDomainReturn = {
	_type: TypeRef<CustomDomainReturn>;

	_format: NumberString;
	validationResult: NumberString;

	invalidDnsRecords: StringWrapper[];
}
export const CustomerTypeRef: TypeRef<Customer> = new TypeRef("sys", "Customer")

export function createCustomer(values?: Partial<Customer>): Customer {
	return Object.assign(create(typeModels.Customer, CustomerTypeRef), values)
}

export type Customer = {
	_type: TypeRef<Customer>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	approvalStatus: NumberString;
	businessUse: null | boolean;
	canceledPremiumAccount: boolean;
	orderProcessingAgreementNeeded: boolean;
	type: NumberString;

	adminGroup: Id;
	adminGroups: Id;
	auditLog:  null | AuditLogRef;
	contactFormUserAreaGroups:  null | UserAreaGroups;
	contactFormUserGroups:  null | UserAreaGroups;
	customerGroup: Id;
	customerGroups: Id;
	customerInfo: IdTuple;
	customizations: Feature[];
	orderProcessingAgreement:  null | IdTuple;
	properties:  null | Id;
	rejectedSenders:  null | RejectedSendersRef;
	serverProperties:  null | Id;
	teamGroups: Id;
	userAreaGroups:  null | UserAreaGroups;
	userGroups: Id;
	whitelabelChildren:  null | WhitelabelChildrenRef;
	whitelabelParent:  null | WhitelabelParent;
}
export const CustomerAccountTerminationPostInTypeRef: TypeRef<CustomerAccountTerminationPostIn> = new TypeRef("sys", "CustomerAccountTerminationPostIn")

export function createCustomerAccountTerminationPostIn(values?: Partial<CustomerAccountTerminationPostIn>): CustomerAccountTerminationPostIn {
	return Object.assign(create(typeModels.CustomerAccountTerminationPostIn, CustomerAccountTerminationPostInTypeRef), values)
}

export type CustomerAccountTerminationPostIn = {
	_type: TypeRef<CustomerAccountTerminationPostIn>;

	_format: NumberString;
	terminationDate: null | Date;
}
export const CustomerAccountTerminationPostOutTypeRef: TypeRef<CustomerAccountTerminationPostOut> = new TypeRef("sys", "CustomerAccountTerminationPostOut")

export function createCustomerAccountTerminationPostOut(values?: Partial<CustomerAccountTerminationPostOut>): CustomerAccountTerminationPostOut {
	return Object.assign(create(typeModels.CustomerAccountTerminationPostOut, CustomerAccountTerminationPostOutTypeRef), values)
}

export type CustomerAccountTerminationPostOut = {
	_type: TypeRef<CustomerAccountTerminationPostOut>;

	_format: NumberString;

	terminationRequest: IdTuple;
}
export const CustomerAccountTerminationRequestTypeRef: TypeRef<CustomerAccountTerminationRequest> = new TypeRef("sys", "CustomerAccountTerminationRequest")

export function createCustomerAccountTerminationRequest(values?: Partial<CustomerAccountTerminationRequest>): CustomerAccountTerminationRequest {
	return Object.assign(create(typeModels.CustomerAccountTerminationRequest, CustomerAccountTerminationRequestTypeRef), values)
}

export type CustomerAccountTerminationRequest = {
	_type: TypeRef<CustomerAccountTerminationRequest>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	terminationDate: Date;
	terminationRequestDate: Date;

	customer: Id;
}
export const CustomerDataTypeRef: TypeRef<CustomerData> = new TypeRef("sys", "CustomerData")

export function createCustomerData(values?: Partial<CustomerData>): CustomerData {
	return Object.assign(create(typeModels.CustomerData, CustomerDataTypeRef), values)
}

export type CustomerData = {
	_type: TypeRef<CustomerData>;

	_format: NumberString;
	accountingInfoBucketEncAccountingInfoSessionKey: Uint8Array;
	adminEncAccountingInfoSessionKey: Uint8Array;
	authToken: string;
	company: string;
	date: null | Date;
	domain: string;
	salt: Uint8Array;
	symEncAccountGroupKey: Uint8Array;
	systemCustomerPubEncAccountingInfoBucketKey: Uint8Array;
	systemCustomerPubKeyVersion: NumberString;
	userEncClientKey: Uint8Array;
	verifier: Uint8Array;

	adminGroupList: CreateGroupListData;
	customerGroupList: CreateGroupListData;
	teamGroupList: CreateGroupListData;
	userGroupList: CreateGroupListData;
}
export const CustomerInfoTypeRef: TypeRef<CustomerInfo> = new TypeRef("sys", "CustomerInfo")

export function createCustomerInfo(values?: Partial<CustomerInfo>): CustomerInfo {
	return Object.assign(create(typeModels.CustomerInfo, CustomerInfoTypeRef), values)
}

export type CustomerInfo = {
	_type: TypeRef<CustomerInfo>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	activationTime: null | Date;
	company: null | string;
	creationTime: Date;
	deletionReason: null | string;
	deletionTime: null | Date;
	domain: string;
	erased: boolean;
	includedEmailAliases: NumberString;
	includedStorageCapacity: NumberString;
	promotionEmailAliases: NumberString;
	promotionStorageCapacity: NumberString;
	registrationMailAddress: string;
	source: string;
	testEndTime: null | Date;
	usedSharedEmailAliases: NumberString;

	accountingInfo: Id;
	bookings:  null | BookingsRef;
	customer: Id;
	domainInfos: DomainInfo[];
	giftCards:  null | GiftCardsRef;
	takeoverCustomer:  null | Id;
	terminationRequest:  null | IdTuple;
}
export const CustomerInfoReturnTypeRef: TypeRef<CustomerInfoReturn> = new TypeRef("sys", "CustomerInfoReturn")

export function createCustomerInfoReturn(values?: Partial<CustomerInfoReturn>): CustomerInfoReturn {
	return Object.assign(create(typeModels.CustomerInfoReturn, CustomerInfoReturnTypeRef), values)
}

export type CustomerInfoReturn = {
	_type: TypeRef<CustomerInfoReturn>;

	_format: NumberString;
	sendMailDisabled: boolean;
}
export const CustomerPropertiesTypeRef: TypeRef<CustomerProperties> = new TypeRef("sys", "CustomerProperties")

export function createCustomerProperties(values?: Partial<CustomerProperties>): CustomerProperties {
	return Object.assign(create(typeModels.CustomerProperties, CustomerPropertiesTypeRef), values)
}

export type CustomerProperties = {
	_type: TypeRef<CustomerProperties>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	externalUserWelcomeMessage: string;
	lastUpgradeReminder: null | Date;
	usageDataOptedOut: boolean;

	bigLogo:  null | File;
	notificationMailTemplates: NotificationMailTemplate[];
	smallLogo:  null | File;
}
export const CustomerReturnTypeRef: TypeRef<CustomerReturn> = new TypeRef("sys", "CustomerReturn")

export function createCustomerReturn(values?: Partial<CustomerReturn>): CustomerReturn {
	return Object.assign(create(typeModels.CustomerReturn, CustomerReturnTypeRef), values)
}

export type CustomerReturn = {
	_type: TypeRef<CustomerReturn>;

	_format: NumberString;

	adminUser: Id;
	adminUserGroup: Id;
}
export const CustomerServerPropertiesTypeRef: TypeRef<CustomerServerProperties> = new TypeRef("sys", "CustomerServerProperties")

export function createCustomerServerProperties(values?: Partial<CustomerServerProperties>): CustomerServerProperties {
	return Object.assign(create(typeModels.CustomerServerProperties, CustomerServerPropertiesTypeRef), values)
}

export type CustomerServerProperties = {
	_type: TypeRef<CustomerServerProperties>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	requirePasswordUpdateAfterReset: boolean;
	saveEncryptedIpAddressInSession: boolean;
	whitelabelCode: string;

	emailSenderList: EmailSenderListElement[];
	whitelabelRegistrationDomains: StringWrapper[];
	whitelistedDomains:  null | DomainsRef;
}
export const DateWrapperTypeRef: TypeRef<DateWrapper> = new TypeRef("sys", "DateWrapper")

export function createDateWrapper(values?: Partial<DateWrapper>): DateWrapper {
	return Object.assign(create(typeModels.DateWrapper, DateWrapperTypeRef), values)
}

export type DateWrapper = {
	_type: TypeRef<DateWrapper>;

	_id: Id;
	date: Date;
}
export const DebitServicePutDataTypeRef: TypeRef<DebitServicePutData> = new TypeRef("sys", "DebitServicePutData")

export function createDebitServicePutData(values?: Partial<DebitServicePutData>): DebitServicePutData {
	return Object.assign(create(typeModels.DebitServicePutData, DebitServicePutDataTypeRef), values)
}

export type DebitServicePutData = {
	_type: TypeRef<DebitServicePutData>;

	_format: NumberString;

	invoice:  null | IdTuple;
}
export const DeleteCustomerDataTypeRef: TypeRef<DeleteCustomerData> = new TypeRef("sys", "DeleteCustomerData")

export function createDeleteCustomerData(values?: Partial<DeleteCustomerData>): DeleteCustomerData {
	return Object.assign(create(typeModels.DeleteCustomerData, DeleteCustomerDataTypeRef), values)
}

export type DeleteCustomerData = {
	_type: TypeRef<DeleteCustomerData>;

	_format: NumberString;
	authVerifier: null | Uint8Array;
	reason: string;
	takeoverMailAddress: null | string;
	undelete: boolean;

	customer: Id;
}
export const DnsRecordTypeRef: TypeRef<DnsRecord> = new TypeRef("sys", "DnsRecord")

export function createDnsRecord(values?: Partial<DnsRecord>): DnsRecord {
	return Object.assign(create(typeModels.DnsRecord, DnsRecordTypeRef), values)
}

export type DnsRecord = {
	_type: TypeRef<DnsRecord>;

	_id: Id;
	subdomain: null | string;
	type: NumberString;
	value: string;
}
export const DomainInfoTypeRef: TypeRef<DomainInfo> = new TypeRef("sys", "DomainInfo")

export function createDomainInfo(values?: Partial<DomainInfo>): DomainInfo {
	return Object.assign(create(typeModels.DomainInfo, DomainInfoTypeRef), values)
}

export type DomainInfo = {
	_type: TypeRef<DomainInfo>;

	_id: Id;
	domain: string;
	validatedMxRecord: boolean;

	catchAllMailGroup:  null | Id;
	whitelabelConfig:  null | Id;
}
export const DomainMailAddressAvailabilityDataTypeRef: TypeRef<DomainMailAddressAvailabilityData> = new TypeRef("sys", "DomainMailAddressAvailabilityData")

export function createDomainMailAddressAvailabilityData(values?: Partial<DomainMailAddressAvailabilityData>): DomainMailAddressAvailabilityData {
	return Object.assign(create(typeModels.DomainMailAddressAvailabilityData, DomainMailAddressAvailabilityDataTypeRef), values)
}

export type DomainMailAddressAvailabilityData = {
	_type: TypeRef<DomainMailAddressAvailabilityData>;

	_format: NumberString;
	mailAddress: string;
}
export const DomainMailAddressAvailabilityReturnTypeRef: TypeRef<DomainMailAddressAvailabilityReturn> = new TypeRef("sys", "DomainMailAddressAvailabilityReturn")

export function createDomainMailAddressAvailabilityReturn(values?: Partial<DomainMailAddressAvailabilityReturn>): DomainMailAddressAvailabilityReturn {
	return Object.assign(create(typeModels.DomainMailAddressAvailabilityReturn, DomainMailAddressAvailabilityReturnTypeRef), values)
}

export type DomainMailAddressAvailabilityReturn = {
	_type: TypeRef<DomainMailAddressAvailabilityReturn>;

	_format: NumberString;
	available: boolean;
}
export const DomainsRefTypeRef: TypeRef<DomainsRef> = new TypeRef("sys", "DomainsRef")

export function createDomainsRef(values?: Partial<DomainsRef>): DomainsRef {
	return Object.assign(create(typeModels.DomainsRef, DomainsRefTypeRef), values)
}

export type DomainsRef = {
	_type: TypeRef<DomainsRef>;

	_id: Id;

	items: Id;
}
export const EmailSenderListElementTypeRef: TypeRef<EmailSenderListElement> = new TypeRef("sys", "EmailSenderListElement")

export function createEmailSenderListElement(values?: Partial<EmailSenderListElement>): EmailSenderListElement {
	return Object.assign(create(typeModels.EmailSenderListElement, EmailSenderListElementTypeRef), values)
}

export type EmailSenderListElement = {
	_type: TypeRef<EmailSenderListElement>;

	_id: Id;
	field: NumberString;
	hashedValue: string;
	type: NumberString;
	value: string;
}
export const EntityEventBatchTypeRef: TypeRef<EntityEventBatch> = new TypeRef("sys", "EntityEventBatch")

export function createEntityEventBatch(values?: Partial<EntityEventBatch>): EntityEventBatch {
	return Object.assign(create(typeModels.EntityEventBatch, EntityEventBatchTypeRef), values)
}

export type EntityEventBatch = {
	_type: TypeRef<EntityEventBatch>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	events: EntityUpdate[];
}
export const EntityUpdateTypeRef: TypeRef<EntityUpdate> = new TypeRef("sys", "EntityUpdate")

export function createEntityUpdate(values?: Partial<EntityUpdate>): EntityUpdate {
	return Object.assign(create(typeModels.EntityUpdate, EntityUpdateTypeRef), values)
}

export type EntityUpdate = {
	_type: TypeRef<EntityUpdate>;

	_id: Id;
	application: string;
	instanceId: string;
	instanceListId: string;
	operation: NumberString;
	type: string;
}
export const ExceptionTypeRef: TypeRef<Exception> = new TypeRef("sys", "Exception")

export function createException(values?: Partial<Exception>): Exception {
	return Object.assign(create(typeModels.Exception, ExceptionTypeRef), values)
}

export type Exception = {
	_type: TypeRef<Exception>;

	_id: Id;
	msg: string;
	type: string;
}
export const ExternalPropertiesReturnTypeRef: TypeRef<ExternalPropertiesReturn> = new TypeRef("sys", "ExternalPropertiesReturn")

export function createExternalPropertiesReturn(values?: Partial<ExternalPropertiesReturn>): ExternalPropertiesReturn {
	return Object.assign(create(typeModels.ExternalPropertiesReturn, ExternalPropertiesReturnTypeRef), values)
}

export type ExternalPropertiesReturn = {
	_type: TypeRef<ExternalPropertiesReturn>;

	_format: NumberString;
	accountType: NumberString;
	message: string;

	bigLogo:  null | File;
	smallLogo:  null | File;
}
export const ExternalUserReferenceTypeRef: TypeRef<ExternalUserReference> = new TypeRef("sys", "ExternalUserReference")

export function createExternalUserReference(values?: Partial<ExternalUserReference>): ExternalUserReference {
	return Object.assign(create(typeModels.ExternalUserReference, ExternalUserReferenceTypeRef), values)
}

export type ExternalUserReference = {
	_type: TypeRef<ExternalUserReference>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	user: Id;
	userGroup: Id;
}
export const FeatureTypeRef: TypeRef<Feature> = new TypeRef("sys", "Feature")

export function createFeature(values?: Partial<Feature>): Feature {
	return Object.assign(create(typeModels.Feature, FeatureTypeRef), values)
}

export type Feature = {
	_type: TypeRef<Feature>;

	_id: Id;
	feature: NumberString;
}
export const FileTypeRef: TypeRef<File> = new TypeRef("sys", "File")

export function createFile(values?: Partial<File>): File {
	return Object.assign(create(typeModels.File, FileTypeRef), values)
}

export type File = {
	_type: TypeRef<File>;

	_id: Id;
	data: Uint8Array;
	mimeType: string;
	name: string;
}
export const GeneratedIdWrapperTypeRef: TypeRef<GeneratedIdWrapper> = new TypeRef("sys", "GeneratedIdWrapper")

export function createGeneratedIdWrapper(values?: Partial<GeneratedIdWrapper>): GeneratedIdWrapper {
	return Object.assign(create(typeModels.GeneratedIdWrapper, GeneratedIdWrapperTypeRef), values)
}

export type GeneratedIdWrapper = {
	_type: TypeRef<GeneratedIdWrapper>;

	_id: Id;
	value: Id;
}
export const GiftCardTypeRef: TypeRef<GiftCard> = new TypeRef("sys", "GiftCard")

export function createGiftCard(values?: Partial<GiftCard>): GiftCard {
	return Object.assign(create(typeModels.GiftCard, GiftCardTypeRef), values)
}

export type GiftCard = {
	_type: TypeRef<GiftCard>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	message: string;
	migrated: boolean;
	orderDate: Date;
	status: NumberString;
	value: NumberString;
}
export const GiftCardCreateDataTypeRef: TypeRef<GiftCardCreateData> = new TypeRef("sys", "GiftCardCreateData")

export function createGiftCardCreateData(values?: Partial<GiftCardCreateData>): GiftCardCreateData {
	return Object.assign(create(typeModels.GiftCardCreateData, GiftCardCreateDataTypeRef), values)
}

export type GiftCardCreateData = {
	_type: TypeRef<GiftCardCreateData>;
	_errors: Object;

	_format: NumberString;
	keyHash: Uint8Array;
	message: string;
	ownerEncSessionKey: Uint8Array;
	value: NumberString;
}
export const GiftCardCreateReturnTypeRef: TypeRef<GiftCardCreateReturn> = new TypeRef("sys", "GiftCardCreateReturn")

export function createGiftCardCreateReturn(values?: Partial<GiftCardCreateReturn>): GiftCardCreateReturn {
	return Object.assign(create(typeModels.GiftCardCreateReturn, GiftCardCreateReturnTypeRef), values)
}

export type GiftCardCreateReturn = {
	_type: TypeRef<GiftCardCreateReturn>;

	_format: NumberString;

	giftCard: IdTuple;
}
export const GiftCardDeleteDataTypeRef: TypeRef<GiftCardDeleteData> = new TypeRef("sys", "GiftCardDeleteData")

export function createGiftCardDeleteData(values?: Partial<GiftCardDeleteData>): GiftCardDeleteData {
	return Object.assign(create(typeModels.GiftCardDeleteData, GiftCardDeleteDataTypeRef), values)
}

export type GiftCardDeleteData = {
	_type: TypeRef<GiftCardDeleteData>;

	_format: NumberString;

	giftCard: IdTuple;
}
export const GiftCardGetReturnTypeRef: TypeRef<GiftCardGetReturn> = new TypeRef("sys", "GiftCardGetReturn")

export function createGiftCardGetReturn(values?: Partial<GiftCardGetReturn>): GiftCardGetReturn {
	return Object.assign(create(typeModels.GiftCardGetReturn, GiftCardGetReturnTypeRef), values)
}

export type GiftCardGetReturn = {
	_type: TypeRef<GiftCardGetReturn>;

	_format: NumberString;
	maxPerPeriod: NumberString;
	period: NumberString;

	options: GiftCardOption[];
}
export const GiftCardOptionTypeRef: TypeRef<GiftCardOption> = new TypeRef("sys", "GiftCardOption")

export function createGiftCardOption(values?: Partial<GiftCardOption>): GiftCardOption {
	return Object.assign(create(typeModels.GiftCardOption, GiftCardOptionTypeRef), values)
}

export type GiftCardOption = {
	_type: TypeRef<GiftCardOption>;

	_id: Id;
	value: NumberString;
}
export const GiftCardRedeemDataTypeRef: TypeRef<GiftCardRedeemData> = new TypeRef("sys", "GiftCardRedeemData")

export function createGiftCardRedeemData(values?: Partial<GiftCardRedeemData>): GiftCardRedeemData {
	return Object.assign(create(typeModels.GiftCardRedeemData, GiftCardRedeemDataTypeRef), values)
}

export type GiftCardRedeemData = {
	_type: TypeRef<GiftCardRedeemData>;

	_format: NumberString;
	countryCode: string;
	keyHash: Uint8Array;

	giftCardInfo: Id;
}
export const GiftCardRedeemGetReturnTypeRef: TypeRef<GiftCardRedeemGetReturn> = new TypeRef("sys", "GiftCardRedeemGetReturn")

export function createGiftCardRedeemGetReturn(values?: Partial<GiftCardRedeemGetReturn>): GiftCardRedeemGetReturn {
	return Object.assign(create(typeModels.GiftCardRedeemGetReturn, GiftCardRedeemGetReturnTypeRef), values)
}

export type GiftCardRedeemGetReturn = {
	_type: TypeRef<GiftCardRedeemGetReturn>;
	_errors: Object;

	_format: NumberString;
	message: string;
	value: NumberString;

	giftCard: IdTuple;
}
export const GiftCardsRefTypeRef: TypeRef<GiftCardsRef> = new TypeRef("sys", "GiftCardsRef")

export function createGiftCardsRef(values?: Partial<GiftCardsRef>): GiftCardsRef {
	return Object.assign(create(typeModels.GiftCardsRef, GiftCardsRefTypeRef), values)
}

export type GiftCardsRef = {
	_type: TypeRef<GiftCardsRef>;

	_id: Id;

	items: Id;
}
export const GroupTypeRef: TypeRef<Group> = new TypeRef("sys", "Group")

export function createGroup(values?: Partial<Group>): Group {
	return Object.assign(create(typeModels.Group, GroupTypeRef), values)
}

export type Group = {
	_type: TypeRef<Group>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	adminGroupEncGKey: null | Uint8Array;
	enabled: boolean;
	external: boolean;
	type: NumberString;

	admin:  null | Id;
	administratedGroups:  null | AdministratedGroupsRef;
	archives: ArchiveType[];
	customer:  null | Id;
	groupInfo: IdTuple;
	invitations: Id;
	keys: KeyPair[];
	members: Id;
	user:  null | Id;
}
export const GroupInfoTypeRef: TypeRef<GroupInfo> = new TypeRef("sys", "GroupInfo")

export function createGroupInfo(values?: Partial<GroupInfo>): GroupInfo {
	return Object.assign(create(typeModels.GroupInfo, GroupInfoTypeRef), values)
}

export type GroupInfo = {
	_type: TypeRef<GroupInfo>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_listEncSessionKey: null | Uint8Array;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	created: Date;
	deleted: null | Date;
	groupType: null | NumberString;
	mailAddress: null | string;
	name: string;

	group: Id;
	localAdmin:  null | Id;
	mailAddressAliases: MailAddressAlias[];
}
export const GroupMemberTypeRef: TypeRef<GroupMember> = new TypeRef("sys", "GroupMember")

export function createGroupMember(values?: Partial<GroupMember>): GroupMember {
	return Object.assign(create(typeModels.GroupMember, GroupMemberTypeRef), values)
}

export type GroupMember = {
	_type: TypeRef<GroupMember>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	capability: null | NumberString;

	group: Id;
	user: Id;
	userGroupInfo: IdTuple;
}
export const GroupMembershipTypeRef: TypeRef<GroupMembership> = new TypeRef("sys", "GroupMembership")

export function createGroupMembership(values?: Partial<GroupMembership>): GroupMembership {
	return Object.assign(create(typeModels.GroupMembership, GroupMembershipTypeRef), values)
}

export type GroupMembership = {
	_type: TypeRef<GroupMembership>;

	_id: Id;
	admin: boolean;
	capability: null | NumberString;
	groupType: null | NumberString;
	symEncGKey: Uint8Array;

	group: Id;
	groupInfo: IdTuple;
	groupMember: IdTuple;
}
export const GroupRootTypeRef: TypeRef<GroupRoot> = new TypeRef("sys", "GroupRoot")

export function createGroupRoot(values?: Partial<GroupRoot>): GroupRoot {
	return Object.assign(create(typeModels.GroupRoot, GroupRootTypeRef), values)
}

export type GroupRoot = {
	_type: TypeRef<GroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	externalGroupInfos: Id;
	externalUserAreaGroupInfos:  null | UserAreaGroups;
	externalUserReferences: Id;
}
export const InstanceSessionKeyTypeRef: TypeRef<InstanceSessionKey> = new TypeRef("sys", "InstanceSessionKey")

export function createInstanceSessionKey(values?: Partial<InstanceSessionKey>): InstanceSessionKey {
	return Object.assign(create(typeModels.InstanceSessionKey, InstanceSessionKeyTypeRef), values)
}

export type InstanceSessionKey = {
	_type: TypeRef<InstanceSessionKey>;

	_id: Id;
	instanceId: Id;
	instanceList: Id;
	symEncSessionKey: Uint8Array;

	typeInfo: TypeInfo;
}
export const InvoiceTypeRef: TypeRef<Invoice> = new TypeRef("sys", "Invoice")

export function createInvoice(values?: Partial<Invoice>): Invoice {
	return Object.assign(create(typeModels.Invoice, InvoiceTypeRef), values)
}

export type Invoice = {
	_type: TypeRef<Invoice>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	address: string;
	adminUser: null | string;
	business: boolean;
	country: string;
	date: Date;
	grandTotal: NumberString;
	paymentMethod: NumberString;
	reason: null | string;
	subTotal: NumberString;
	type: NumberString;
	vat: NumberString;
	vatIdNumber: null | string;
	vatRate: NumberString;

	bookings: IdTuple[];
	customer: Id;
	items: InvoiceItem[];
}
export const InvoiceInfoTypeRef: TypeRef<InvoiceInfo> = new TypeRef("sys", "InvoiceInfo")

export function createInvoiceInfo(values?: Partial<InvoiceInfo>): InvoiceInfo {
	return Object.assign(create(typeModels.InvoiceInfo, InvoiceInfoTypeRef), values)
}

export type InvoiceInfo = {
	_type: TypeRef<InvoiceInfo>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	extendedPeriodOfPaymentDays: NumberString;
	persistentPaymentPeriodExtension: boolean;
	publishInvoices: boolean;
	reminderState: NumberString;
	specialPriceBrandingPerUser: null | NumberString;
	specialPriceBusinessPerUser: null | NumberString;
	specialPriceContactFormSingle: null | NumberString;
	specialPriceSharedGroupSingle: null | NumberString;
	specialPriceSharingPerUser: null | NumberString;
	specialPriceUserSingle: null | NumberString;
	specialPriceUserTotal: null | NumberString;

	invoices: Id;
	paymentErrorInfo:  null | PaymentErrorInfo;
}
export const InvoiceItemTypeRef: TypeRef<InvoiceItem> = new TypeRef("sys", "InvoiceItem")

export function createInvoiceItem(values?: Partial<InvoiceItem>): InvoiceItem {
	return Object.assign(create(typeModels.InvoiceItem, InvoiceItemTypeRef), values)
}

export type InvoiceItem = {
	_type: TypeRef<InvoiceItem>;

	_id: Id;
	amount: NumberString;
	endDate: null | Date;
	singlePrice: null | NumberString;
	singleType: boolean;
	startDate: null | Date;
	totalPrice: NumberString;
	type: NumberString;
}
export const KeyPairTypeRef: TypeRef<KeyPair> = new TypeRef("sys", "KeyPair")

export function createKeyPair(values?: Partial<KeyPair>): KeyPair {
	return Object.assign(create(typeModels.KeyPair, KeyPairTypeRef), values)
}

export type KeyPair = {
	_type: TypeRef<KeyPair>;

	_id: Id;
	pubKey: Uint8Array;
	symEncPrivKey: Uint8Array;
	version: NumberString;
}
export const LocationServiceGetReturnTypeRef: TypeRef<LocationServiceGetReturn> = new TypeRef("sys", "LocationServiceGetReturn")

export function createLocationServiceGetReturn(values?: Partial<LocationServiceGetReturn>): LocationServiceGetReturn {
	return Object.assign(create(typeModels.LocationServiceGetReturn, LocationServiceGetReturnTypeRef), values)
}

export type LocationServiceGetReturn = {
	_type: TypeRef<LocationServiceGetReturn>;

	_format: NumberString;
	country: string;
}
export const LoginTypeRef: TypeRef<Login> = new TypeRef("sys", "Login")

export function createLogin(values?: Partial<Login>): Login {
	return Object.assign(create(typeModels.Login, LoginTypeRef), values)
}

export type Login = {
	_type: TypeRef<Login>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	time: Date;
}
export const MailAddressAliasTypeRef: TypeRef<MailAddressAlias> = new TypeRef("sys", "MailAddressAlias")

export function createMailAddressAlias(values?: Partial<MailAddressAlias>): MailAddressAlias {
	return Object.assign(create(typeModels.MailAddressAlias, MailAddressAliasTypeRef), values)
}

export type MailAddressAlias = {
	_type: TypeRef<MailAddressAlias>;

	_id: Id;
	enabled: boolean;
	mailAddress: string;
}
export const MailAddressAliasServiceDataTypeRef: TypeRef<MailAddressAliasServiceData> = new TypeRef("sys", "MailAddressAliasServiceData")

export function createMailAddressAliasServiceData(values?: Partial<MailAddressAliasServiceData>): MailAddressAliasServiceData {
	return Object.assign(create(typeModels.MailAddressAliasServiceData, MailAddressAliasServiceDataTypeRef), values)
}

export type MailAddressAliasServiceData = {
	_type: TypeRef<MailAddressAliasServiceData>;

	_format: NumberString;
	mailAddress: string;

	group: Id;
}
export const MailAddressAliasServiceDataDeleteTypeRef: TypeRef<MailAddressAliasServiceDataDelete> = new TypeRef("sys", "MailAddressAliasServiceDataDelete")

export function createMailAddressAliasServiceDataDelete(values?: Partial<MailAddressAliasServiceDataDelete>): MailAddressAliasServiceDataDelete {
	return Object.assign(create(typeModels.MailAddressAliasServiceDataDelete, MailAddressAliasServiceDataDeleteTypeRef), values)
}

export type MailAddressAliasServiceDataDelete = {
	_type: TypeRef<MailAddressAliasServiceDataDelete>;

	_format: NumberString;
	mailAddress: string;
	restore: boolean;

	group: Id;
}
export const MailAddressAliasServiceReturnTypeRef: TypeRef<MailAddressAliasServiceReturn> = new TypeRef("sys", "MailAddressAliasServiceReturn")

export function createMailAddressAliasServiceReturn(values?: Partial<MailAddressAliasServiceReturn>): MailAddressAliasServiceReturn {
	return Object.assign(create(typeModels.MailAddressAliasServiceReturn, MailAddressAliasServiceReturnTypeRef), values)
}

export type MailAddressAliasServiceReturn = {
	_type: TypeRef<MailAddressAliasServiceReturn>;

	_format: NumberString;
	enabledAliases: NumberString;
	nbrOfFreeAliases: NumberString;
	totalAliases: NumberString;
	usedAliases: NumberString;
}
export const MailAddressAvailabilityTypeRef: TypeRef<MailAddressAvailability> = new TypeRef("sys", "MailAddressAvailability")

export function createMailAddressAvailability(values?: Partial<MailAddressAvailability>): MailAddressAvailability {
	return Object.assign(create(typeModels.MailAddressAvailability, MailAddressAvailabilityTypeRef), values)
}

export type MailAddressAvailability = {
	_type: TypeRef<MailAddressAvailability>;

	_id: Id;
	available: boolean;
	mailAddress: string;
}
export const MailAddressToGroupTypeRef: TypeRef<MailAddressToGroup> = new TypeRef("sys", "MailAddressToGroup")

export function createMailAddressToGroup(values?: Partial<MailAddressToGroup>): MailAddressToGroup {
	return Object.assign(create(typeModels.MailAddressToGroup, MailAddressToGroupTypeRef), values)
}

export type MailAddressToGroup = {
	_type: TypeRef<MailAddressToGroup>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	internalGroup:  null | Id;
}
export const MembershipAddDataTypeRef: TypeRef<MembershipAddData> = new TypeRef("sys", "MembershipAddData")

export function createMembershipAddData(values?: Partial<MembershipAddData>): MembershipAddData {
	return Object.assign(create(typeModels.MembershipAddData, MembershipAddDataTypeRef), values)
}

export type MembershipAddData = {
	_type: TypeRef<MembershipAddData>;

	_format: NumberString;
	symEncGKey: Uint8Array;

	group: Id;
	user: Id;
}
export const MembershipRemoveDataTypeRef: TypeRef<MembershipRemoveData> = new TypeRef("sys", "MembershipRemoveData")

export function createMembershipRemoveData(values?: Partial<MembershipRemoveData>): MembershipRemoveData {
	return Object.assign(create(typeModels.MembershipRemoveData, MembershipRemoveDataTypeRef), values)
}

export type MembershipRemoveData = {
	_type: TypeRef<MembershipRemoveData>;

	_format: NumberString;

	group: Id;
	user: Id;
}
export const MissedNotificationTypeRef: TypeRef<MissedNotification> = new TypeRef("sys", "MissedNotification")

export function createMissedNotification(values?: Partial<MissedNotification>): MissedNotification {
	return Object.assign(create(typeModels.MissedNotification, MissedNotificationTypeRef), values)
}

export type MissedNotification = {
	_type: TypeRef<MissedNotification>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	changeTime: Date;
	confirmationId: Id;
	lastProcessedNotificationId: null | Id;

	alarmNotifications: AlarmNotification[];
	notificationInfos: NotificationInfo[];
}
export const MultipleMailAddressAvailabilityDataTypeRef: TypeRef<MultipleMailAddressAvailabilityData> = new TypeRef("sys", "MultipleMailAddressAvailabilityData")

export function createMultipleMailAddressAvailabilityData(values?: Partial<MultipleMailAddressAvailabilityData>): MultipleMailAddressAvailabilityData {
	return Object.assign(create(typeModels.MultipleMailAddressAvailabilityData, MultipleMailAddressAvailabilityDataTypeRef), values)
}

export type MultipleMailAddressAvailabilityData = {
	_type: TypeRef<MultipleMailAddressAvailabilityData>;

	_format: NumberString;

	mailAddresses: StringWrapper[];
}
export const MultipleMailAddressAvailabilityReturnTypeRef: TypeRef<MultipleMailAddressAvailabilityReturn> = new TypeRef("sys", "MultipleMailAddressAvailabilityReturn")

export function createMultipleMailAddressAvailabilityReturn(values?: Partial<MultipleMailAddressAvailabilityReturn>): MultipleMailAddressAvailabilityReturn {
	return Object.assign(create(typeModels.MultipleMailAddressAvailabilityReturn, MultipleMailAddressAvailabilityReturnTypeRef), values)
}

export type MultipleMailAddressAvailabilityReturn = {
	_type: TypeRef<MultipleMailAddressAvailabilityReturn>;

	_format: NumberString;

	availabilities: MailAddressAvailability[];
}
export const NotificationInfoTypeRef: TypeRef<NotificationInfo> = new TypeRef("sys", "NotificationInfo")

export function createNotificationInfo(values?: Partial<NotificationInfo>): NotificationInfo {
	return Object.assign(create(typeModels.NotificationInfo, NotificationInfoTypeRef), values)
}

export type NotificationInfo = {
	_type: TypeRef<NotificationInfo>;

	_id: Id;
	counter: NumberString;
	mailAddress: string;
	userId: Id;
}
export const NotificationMailTemplateTypeRef: TypeRef<NotificationMailTemplate> = new TypeRef("sys", "NotificationMailTemplate")

export function createNotificationMailTemplate(values?: Partial<NotificationMailTemplate>): NotificationMailTemplate {
	return Object.assign(create(typeModels.NotificationMailTemplate, NotificationMailTemplateTypeRef), values)
}

export type NotificationMailTemplate = {
	_type: TypeRef<NotificationMailTemplate>;

	_id: Id;
	body: string;
	language: string;
	subject: string;
}
export const NotificationSessionKeyTypeRef: TypeRef<NotificationSessionKey> = new TypeRef("sys", "NotificationSessionKey")

export function createNotificationSessionKey(values?: Partial<NotificationSessionKey>): NotificationSessionKey {
	return Object.assign(create(typeModels.NotificationSessionKey, NotificationSessionKeyTypeRef), values)
}

export type NotificationSessionKey = {
	_type: TypeRef<NotificationSessionKey>;

	_id: Id;
	pushIdentifierSessionEncSessionKey: Uint8Array;

	pushIdentifier: IdTuple;
}
export const OrderProcessingAgreementTypeRef: TypeRef<OrderProcessingAgreement> = new TypeRef("sys", "OrderProcessingAgreement")

export function createOrderProcessingAgreement(values?: Partial<OrderProcessingAgreement>): OrderProcessingAgreement {
	return Object.assign(create(typeModels.OrderProcessingAgreement, OrderProcessingAgreementTypeRef), values)
}

export type OrderProcessingAgreement = {
	_type: TypeRef<OrderProcessingAgreement>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	customerAddress: string;
	signatureDate: Date;
	version: string;

	customer: Id;
	signerUserGroupInfo: IdTuple;
}
export const OtpChallengeTypeRef: TypeRef<OtpChallenge> = new TypeRef("sys", "OtpChallenge")

export function createOtpChallenge(values?: Partial<OtpChallenge>): OtpChallenge {
	return Object.assign(create(typeModels.OtpChallenge, OtpChallengeTypeRef), values)
}

export type OtpChallenge = {
	_type: TypeRef<OtpChallenge>;

	_id: Id;

	secondFactors: IdTuple[];
}
export const PaymentDataServiceGetDataTypeRef: TypeRef<PaymentDataServiceGetData> = new TypeRef("sys", "PaymentDataServiceGetData")

export function createPaymentDataServiceGetData(values?: Partial<PaymentDataServiceGetData>): PaymentDataServiceGetData {
	return Object.assign(create(typeModels.PaymentDataServiceGetData, PaymentDataServiceGetDataTypeRef), values)
}

export type PaymentDataServiceGetData = {
	_type: TypeRef<PaymentDataServiceGetData>;

	_format: NumberString;
	clientType: null | NumberString;
}
export const PaymentDataServiceGetReturnTypeRef: TypeRef<PaymentDataServiceGetReturn> = new TypeRef("sys", "PaymentDataServiceGetReturn")

export function createPaymentDataServiceGetReturn(values?: Partial<PaymentDataServiceGetReturn>): PaymentDataServiceGetReturn {
	return Object.assign(create(typeModels.PaymentDataServiceGetReturn, PaymentDataServiceGetReturnTypeRef), values)
}

export type PaymentDataServiceGetReturn = {
	_type: TypeRef<PaymentDataServiceGetReturn>;

	_format: NumberString;
	loginUrl: string;
}
export const PaymentDataServicePostDataTypeRef: TypeRef<PaymentDataServicePostData> = new TypeRef("sys", "PaymentDataServicePostData")

export function createPaymentDataServicePostData(values?: Partial<PaymentDataServicePostData>): PaymentDataServicePostData {
	return Object.assign(create(typeModels.PaymentDataServicePostData, PaymentDataServicePostDataTypeRef), values)
}

export type PaymentDataServicePostData = {
	_type: TypeRef<PaymentDataServicePostData>;

	_format: NumberString;

	braintree3dsResponse: Braintree3ds2Response;
}
export const PaymentDataServicePutDataTypeRef: TypeRef<PaymentDataServicePutData> = new TypeRef("sys", "PaymentDataServicePutData")

export function createPaymentDataServicePutData(values?: Partial<PaymentDataServicePutData>): PaymentDataServicePutData {
	return Object.assign(create(typeModels.PaymentDataServicePutData, PaymentDataServicePutDataTypeRef), values)
}

export type PaymentDataServicePutData = {
	_type: TypeRef<PaymentDataServicePutData>;
	_errors: Object;

	_format: NumberString;
	business: boolean;
	confirmedCountry: null | string;
	invoiceAddress: string;
	invoiceCountry: string;
	invoiceName: string;
	invoiceVatIdNo: string;
	paymentInterval: NumberString;
	paymentMethod: NumberString;
	paymentMethodInfo: null | string;
	paymentToken: null | string;

	creditCard:  null | CreditCard;
}
export const PaymentDataServicePutReturnTypeRef: TypeRef<PaymentDataServicePutReturn> = new TypeRef("sys", "PaymentDataServicePutReturn")

export function createPaymentDataServicePutReturn(values?: Partial<PaymentDataServicePutReturn>): PaymentDataServicePutReturn {
	return Object.assign(create(typeModels.PaymentDataServicePutReturn, PaymentDataServicePutReturnTypeRef), values)
}

export type PaymentDataServicePutReturn = {
	_type: TypeRef<PaymentDataServicePutReturn>;

	_format: NumberString;
	result: NumberString;

	braintree3dsRequest:  null | Braintree3ds2Request;
}
export const PaymentErrorInfoTypeRef: TypeRef<PaymentErrorInfo> = new TypeRef("sys", "PaymentErrorInfo")

export function createPaymentErrorInfo(values?: Partial<PaymentErrorInfo>): PaymentErrorInfo {
	return Object.assign(create(typeModels.PaymentErrorInfo, PaymentErrorInfoTypeRef), values)
}

export type PaymentErrorInfo = {
	_type: TypeRef<PaymentErrorInfo>;

	_id: Id;
	errorCode: string;
	errorTime: Date;
	thirdPartyErrorId: string;
}
export const PdfInvoiceServiceDataTypeRef: TypeRef<PdfInvoiceServiceData> = new TypeRef("sys", "PdfInvoiceServiceData")

export function createPdfInvoiceServiceData(values?: Partial<PdfInvoiceServiceData>): PdfInvoiceServiceData {
	return Object.assign(create(typeModels.PdfInvoiceServiceData, PdfInvoiceServiceDataTypeRef), values)
}

export type PdfInvoiceServiceData = {
	_type: TypeRef<PdfInvoiceServiceData>;

	_format: NumberString;
	invoiceNumber: string;

	invoice:  null | IdTuple;
}
export const PdfInvoiceServiceReturnTypeRef: TypeRef<PdfInvoiceServiceReturn> = new TypeRef("sys", "PdfInvoiceServiceReturn")

export function createPdfInvoiceServiceReturn(values?: Partial<PdfInvoiceServiceReturn>): PdfInvoiceServiceReturn {
	return Object.assign(create(typeModels.PdfInvoiceServiceReturn, PdfInvoiceServiceReturnTypeRef), values)
}

export type PdfInvoiceServiceReturn = {
	_type: TypeRef<PdfInvoiceServiceReturn>;
	_errors: Object;

	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerPublicEncSessionKey: null | Uint8Array;
	data: Uint8Array;
}
export const PermissionTypeRef: TypeRef<Permission> = new TypeRef("sys", "Permission")

export function createPermission(values?: Partial<Permission>): Permission {
	return Object.assign(create(typeModels.Permission, PermissionTypeRef), values)
}

export type Permission = {
	_type: TypeRef<Permission>;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	bucketEncSessionKey: null | Uint8Array;
	listElementApplication: null | string;
	listElementTypeId: null | NumberString;
	ops: null | string;
	symEncSessionKey: null | Uint8Array;
	type: NumberString;

	bucket:  null | Bucket;
	group:  null | Id;
}
export const PhoneNumberTypeRef: TypeRef<PhoneNumber> = new TypeRef("sys", "PhoneNumber")

export function createPhoneNumber(values?: Partial<PhoneNumber>): PhoneNumber {
	return Object.assign(create(typeModels.PhoneNumber, PhoneNumberTypeRef), values)
}

export type PhoneNumber = {
	_type: TypeRef<PhoneNumber>;

	_id: Id;
	number: string;
}
export const PlanPricesTypeRef: TypeRef<PlanPrices> = new TypeRef("sys", "PlanPrices")

export function createPlanPrices(values?: Partial<PlanPrices>): PlanPrices {
	return Object.assign(create(typeModels.PlanPrices, PlanPricesTypeRef), values)
}

export type PlanPrices = {
	_type: TypeRef<PlanPrices>;

	_id: Id;
	additionalUserPriceMonthly: NumberString;
	contactFormPriceMonthly: NumberString;
	firstYearDiscount: NumberString;
	includedAliases: NumberString;
	includedStorage: NumberString;
	monthlyPrice: NumberString;
	monthlyReferencePrice: NumberString;
}
export const PremiumFeatureDataTypeRef: TypeRef<PremiumFeatureData> = new TypeRef("sys", "PremiumFeatureData")

export function createPremiumFeatureData(values?: Partial<PremiumFeatureData>): PremiumFeatureData {
	return Object.assign(create(typeModels.PremiumFeatureData, PremiumFeatureDataTypeRef), values)
}

export type PremiumFeatureData = {
	_type: TypeRef<PremiumFeatureData>;

	_format: NumberString;
	activationCode: string;
	featureName: string;
}
export const PremiumFeatureReturnTypeRef: TypeRef<PremiumFeatureReturn> = new TypeRef("sys", "PremiumFeatureReturn")

export function createPremiumFeatureReturn(values?: Partial<PremiumFeatureReturn>): PremiumFeatureReturn {
	return Object.assign(create(typeModels.PremiumFeatureReturn, PremiumFeatureReturnTypeRef), values)
}

export type PremiumFeatureReturn = {
	_type: TypeRef<PremiumFeatureReturn>;

	_format: NumberString;
	activatedFeature: NumberString;
}
export const PriceDataTypeRef: TypeRef<PriceData> = new TypeRef("sys", "PriceData")

export function createPriceData(values?: Partial<PriceData>): PriceData {
	return Object.assign(create(typeModels.PriceData, PriceDataTypeRef), values)
}

export type PriceData = {
	_type: TypeRef<PriceData>;

	_id: Id;
	paymentInterval: NumberString;
	price: NumberString;
	taxIncluded: boolean;

	items: PriceItemData[];
}
export const PriceItemDataTypeRef: TypeRef<PriceItemData> = new TypeRef("sys", "PriceItemData")

export function createPriceItemData(values?: Partial<PriceItemData>): PriceItemData {
	return Object.assign(create(typeModels.PriceItemData, PriceItemDataTypeRef), values)
}

export type PriceItemData = {
	_type: TypeRef<PriceItemData>;

	_id: Id;
	count: NumberString;
	featureType: NumberString;
	price: NumberString;
	singleType: boolean;
}
export const PriceRequestDataTypeRef: TypeRef<PriceRequestData> = new TypeRef("sys", "PriceRequestData")

export function createPriceRequestData(values?: Partial<PriceRequestData>): PriceRequestData {
	return Object.assign(create(typeModels.PriceRequestData, PriceRequestDataTypeRef), values)
}

export type PriceRequestData = {
	_type: TypeRef<PriceRequestData>;

	_id: Id;
	accountType: null | NumberString;
	business: null | boolean;
	count: NumberString;
	featureType: NumberString;
	paymentInterval: null | NumberString;
	reactivate: boolean;
}
export const PriceServiceDataTypeRef: TypeRef<PriceServiceData> = new TypeRef("sys", "PriceServiceData")

export function createPriceServiceData(values?: Partial<PriceServiceData>): PriceServiceData {
	return Object.assign(create(typeModels.PriceServiceData, PriceServiceDataTypeRef), values)
}

export type PriceServiceData = {
	_type: TypeRef<PriceServiceData>;

	_format: NumberString;
	date: null | Date;

	priceRequest:  null | PriceRequestData;
}
export const PriceServiceReturnTypeRef: TypeRef<PriceServiceReturn> = new TypeRef("sys", "PriceServiceReturn")

export function createPriceServiceReturn(values?: Partial<PriceServiceReturn>): PriceServiceReturn {
	return Object.assign(create(typeModels.PriceServiceReturn, PriceServiceReturnTypeRef), values)
}

export type PriceServiceReturn = {
	_type: TypeRef<PriceServiceReturn>;

	_format: NumberString;
	currentPeriodAddedPrice: null | NumberString;
	periodEndDate: Date;

	currentPriceNextPeriod:  null | PriceData;
	currentPriceThisPeriod:  null | PriceData;
	futurePriceNextPeriod:  null | PriceData;
}
export const PublicKeyDataTypeRef: TypeRef<PublicKeyData> = new TypeRef("sys", "PublicKeyData")

export function createPublicKeyData(values?: Partial<PublicKeyData>): PublicKeyData {
	return Object.assign(create(typeModels.PublicKeyData, PublicKeyDataTypeRef), values)
}

export type PublicKeyData = {
	_type: TypeRef<PublicKeyData>;

	_format: NumberString;
	mailAddress: string;
}
export const PublicKeyReturnTypeRef: TypeRef<PublicKeyReturn> = new TypeRef("sys", "PublicKeyReturn")

export function createPublicKeyReturn(values?: Partial<PublicKeyReturn>): PublicKeyReturn {
	return Object.assign(create(typeModels.PublicKeyReturn, PublicKeyReturnTypeRef), values)
}

export type PublicKeyReturn = {
	_type: TypeRef<PublicKeyReturn>;

	_format: NumberString;
	pubKey: Uint8Array;
	pubKeyVersion: NumberString;
}
export const PushIdentifierTypeRef: TypeRef<PushIdentifier> = new TypeRef("sys", "PushIdentifier")

export function createPushIdentifier(values?: Partial<PushIdentifier>): PushIdentifier {
	return Object.assign(create(typeModels.PushIdentifier, PushIdentifierTypeRef), values)
}

export type PushIdentifier = {
	_type: TypeRef<PushIdentifier>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	disabled: boolean;
	displayName: string;
	identifier: string;
	language: string;
	lastNotificationDate: null | Date;
	lastUsageTime: Date;
	pushServiceType: NumberString;
}
export const PushIdentifierListTypeRef: TypeRef<PushIdentifierList> = new TypeRef("sys", "PushIdentifierList")

export function createPushIdentifierList(values?: Partial<PushIdentifierList>): PushIdentifierList {
	return Object.assign(create(typeModels.PushIdentifierList, PushIdentifierListTypeRef), values)
}

export type PushIdentifierList = {
	_type: TypeRef<PushIdentifierList>;

	_id: Id;

	list: Id;
}
export const ReceivedGroupInvitationTypeRef: TypeRef<ReceivedGroupInvitation> = new TypeRef("sys", "ReceivedGroupInvitation")

export function createReceivedGroupInvitation(values?: Partial<ReceivedGroupInvitation>): ReceivedGroupInvitation {
	return Object.assign(create(typeModels.ReceivedGroupInvitation, ReceivedGroupInvitationTypeRef), values)
}

export type ReceivedGroupInvitation = {
	_type: TypeRef<ReceivedGroupInvitation>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	capability: NumberString;
	groupType: null | NumberString;
	inviteeMailAddress: string;
	inviterMailAddress: string;
	inviterName: string;
	sharedGroupKey: Uint8Array;
	sharedGroupName: string;

	sentInvitation: IdTuple;
	sharedGroup: Id;
}
export const RecoverCodeTypeRef: TypeRef<RecoverCode> = new TypeRef("sys", "RecoverCode")

export function createRecoverCode(values?: Partial<RecoverCode>): RecoverCode {
	return Object.assign(create(typeModels.RecoverCode, RecoverCodeTypeRef), values)
}

export type RecoverCode = {
	_type: TypeRef<RecoverCode>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	recoverCodeEncUserGroupKey: Uint8Array;
	userEncRecoverCode: Uint8Array;
	verifier: Uint8Array;
}
export const RegistrationCaptchaServiceDataTypeRef: TypeRef<RegistrationCaptchaServiceData> = new TypeRef("sys", "RegistrationCaptchaServiceData")

export function createRegistrationCaptchaServiceData(values?: Partial<RegistrationCaptchaServiceData>): RegistrationCaptchaServiceData {
	return Object.assign(create(typeModels.RegistrationCaptchaServiceData, RegistrationCaptchaServiceDataTypeRef), values)
}

export type RegistrationCaptchaServiceData = {
	_type: TypeRef<RegistrationCaptchaServiceData>;

	_format: NumberString;
	response: string;
	token: string;
}
export const RegistrationCaptchaServiceGetDataTypeRef: TypeRef<RegistrationCaptchaServiceGetData> = new TypeRef("sys", "RegistrationCaptchaServiceGetData")

export function createRegistrationCaptchaServiceGetData(values?: Partial<RegistrationCaptchaServiceGetData>): RegistrationCaptchaServiceGetData {
	return Object.assign(create(typeModels.RegistrationCaptchaServiceGetData, RegistrationCaptchaServiceGetDataTypeRef), values)
}

export type RegistrationCaptchaServiceGetData = {
	_type: TypeRef<RegistrationCaptchaServiceGetData>;

	_format: NumberString;
	businessUseSelected: boolean;
	mailAddress: string;
	paidSubscriptionSelected: boolean;
	signupToken: null | string;
	token: null | string;
}
export const RegistrationCaptchaServiceReturnTypeRef: TypeRef<RegistrationCaptchaServiceReturn> = new TypeRef("sys", "RegistrationCaptchaServiceReturn")

export function createRegistrationCaptchaServiceReturn(values?: Partial<RegistrationCaptchaServiceReturn>): RegistrationCaptchaServiceReturn {
	return Object.assign(create(typeModels.RegistrationCaptchaServiceReturn, RegistrationCaptchaServiceReturnTypeRef), values)
}

export type RegistrationCaptchaServiceReturn = {
	_type: TypeRef<RegistrationCaptchaServiceReturn>;

	_format: NumberString;
	challenge: null | Uint8Array;
	token: string;
}
export const RegistrationConfigReturnTypeRef: TypeRef<RegistrationConfigReturn> = new TypeRef("sys", "RegistrationConfigReturn")

export function createRegistrationConfigReturn(values?: Partial<RegistrationConfigReturn>): RegistrationConfigReturn {
	return Object.assign(create(typeModels.RegistrationConfigReturn, RegistrationConfigReturnTypeRef), values)
}

export type RegistrationConfigReturn = {
	_type: TypeRef<RegistrationConfigReturn>;

	_format: NumberString;
	freeEnabled: boolean;
	starterEnabled: boolean;
}
export const RegistrationReturnTypeRef: TypeRef<RegistrationReturn> = new TypeRef("sys", "RegistrationReturn")

export function createRegistrationReturn(values?: Partial<RegistrationReturn>): RegistrationReturn {
	return Object.assign(create(typeModels.RegistrationReturn, RegistrationReturnTypeRef), values)
}

export type RegistrationReturn = {
	_type: TypeRef<RegistrationReturn>;

	_format: NumberString;
	authToken: string;
}
export const RegistrationServiceDataTypeRef: TypeRef<RegistrationServiceData> = new TypeRef("sys", "RegistrationServiceData")

export function createRegistrationServiceData(values?: Partial<RegistrationServiceData>): RegistrationServiceData {
	return Object.assign(create(typeModels.RegistrationServiceData, RegistrationServiceDataTypeRef), values)
}

export type RegistrationServiceData = {
	_type: TypeRef<RegistrationServiceData>;

	_format: NumberString;
	source: null | string;
	starterDomain: string;
	state: NumberString;
}
export const RejectedSenderTypeRef: TypeRef<RejectedSender> = new TypeRef("sys", "RejectedSender")

export function createRejectedSender(values?: Partial<RejectedSender>): RejectedSender {
	return Object.assign(create(typeModels.RejectedSender, RejectedSenderTypeRef), values)
}

export type RejectedSender = {
	_type: TypeRef<RejectedSender>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	reason: string;
	recipientMailAddress: string;
	senderHostname: string;
	senderIp: string;
	senderMailAddress: string;
}
export const RejectedSendersRefTypeRef: TypeRef<RejectedSendersRef> = new TypeRef("sys", "RejectedSendersRef")

export function createRejectedSendersRef(values?: Partial<RejectedSendersRef>): RejectedSendersRef {
	return Object.assign(create(typeModels.RejectedSendersRef, RejectedSendersRefTypeRef), values)
}

export type RejectedSendersRef = {
	_type: TypeRef<RejectedSendersRef>;

	_id: Id;

	items: Id;
}
export const RepeatRuleTypeRef: TypeRef<RepeatRule> = new TypeRef("sys", "RepeatRule")

export function createRepeatRule(values?: Partial<RepeatRule>): RepeatRule {
	return Object.assign(create(typeModels.RepeatRule, RepeatRuleTypeRef), values)
}

export type RepeatRule = {
	_type: TypeRef<RepeatRule>;

	_id: Id;
	endType: NumberString;
	endValue: null | NumberString;
	frequency: NumberString;
	interval: NumberString;
	timeZone: string;

	excludedDates: DateWrapper[];
}
export const ResetFactorsDeleteDataTypeRef: TypeRef<ResetFactorsDeleteData> = new TypeRef("sys", "ResetFactorsDeleteData")

export function createResetFactorsDeleteData(values?: Partial<ResetFactorsDeleteData>): ResetFactorsDeleteData {
	return Object.assign(create(typeModels.ResetFactorsDeleteData, ResetFactorsDeleteDataTypeRef), values)
}

export type ResetFactorsDeleteData = {
	_type: TypeRef<ResetFactorsDeleteData>;

	_format: NumberString;
	authVerifier: string;
	mailAddress: string;
	recoverCodeVerifier: string;
}
export const ResetPasswordDataTypeRef: TypeRef<ResetPasswordData> = new TypeRef("sys", "ResetPasswordData")

export function createResetPasswordData(values?: Partial<ResetPasswordData>): ResetPasswordData {
	return Object.assign(create(typeModels.ResetPasswordData, ResetPasswordDataTypeRef), values)
}

export type ResetPasswordData = {
	_type: TypeRef<ResetPasswordData>;

	_format: NumberString;
	pwEncUserGroupKey: Uint8Array;
	salt: Uint8Array;
	verifier: Uint8Array;

	user: Id;
}
export const RootInstanceTypeRef: TypeRef<RootInstance> = new TypeRef("sys", "RootInstance")

export function createRootInstance(values?: Partial<RootInstance>): RootInstance {
	return Object.assign(create(typeModels.RootInstance, RootInstanceTypeRef), values)
}

export type RootInstance = {
	_type: TypeRef<RootInstance>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	reference: Id;
}
export const SaltDataTypeRef: TypeRef<SaltData> = new TypeRef("sys", "SaltData")

export function createSaltData(values?: Partial<SaltData>): SaltData {
	return Object.assign(create(typeModels.SaltData, SaltDataTypeRef), values)
}

export type SaltData = {
	_type: TypeRef<SaltData>;

	_format: NumberString;
	mailAddress: string;
}
export const SaltReturnTypeRef: TypeRef<SaltReturn> = new TypeRef("sys", "SaltReturn")

export function createSaltReturn(values?: Partial<SaltReturn>): SaltReturn {
	return Object.assign(create(typeModels.SaltReturn, SaltReturnTypeRef), values)
}

export type SaltReturn = {
	_type: TypeRef<SaltReturn>;

	_format: NumberString;
	salt: Uint8Array;
}
export const SecondFactorTypeRef: TypeRef<SecondFactor> = new TypeRef("sys", "SecondFactor")

export function createSecondFactor(values?: Partial<SecondFactor>): SecondFactor {
	return Object.assign(create(typeModels.SecondFactor, SecondFactorTypeRef), values)
}

export type SecondFactor = {
	_type: TypeRef<SecondFactor>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	name: string;
	otpSecret: null | Uint8Array;
	type: NumberString;

	u2f:  null | U2fRegisteredDevice;
}
export const SecondFactorAuthAllowedReturnTypeRef: TypeRef<SecondFactorAuthAllowedReturn> = new TypeRef("sys", "SecondFactorAuthAllowedReturn")

export function createSecondFactorAuthAllowedReturn(values?: Partial<SecondFactorAuthAllowedReturn>): SecondFactorAuthAllowedReturn {
	return Object.assign(create(typeModels.SecondFactorAuthAllowedReturn, SecondFactorAuthAllowedReturnTypeRef), values)
}

export type SecondFactorAuthAllowedReturn = {
	_type: TypeRef<SecondFactorAuthAllowedReturn>;

	_format: NumberString;
	allowed: boolean;
}
export const SecondFactorAuthDataTypeRef: TypeRef<SecondFactorAuthData> = new TypeRef("sys", "SecondFactorAuthData")

export function createSecondFactorAuthData(values?: Partial<SecondFactorAuthData>): SecondFactorAuthData {
	return Object.assign(create(typeModels.SecondFactorAuthData, SecondFactorAuthDataTypeRef), values)
}

export type SecondFactorAuthData = {
	_type: TypeRef<SecondFactorAuthData>;

	_format: NumberString;
	otpCode: null | NumberString;
	type: null | NumberString;

	session:  null | IdTuple;
	u2f:  null | U2fResponseData;
	webauthn:  null | WebauthnResponseData;
}
export const SecondFactorAuthDeleteDataTypeRef: TypeRef<SecondFactorAuthDeleteData> = new TypeRef("sys", "SecondFactorAuthDeleteData")

export function createSecondFactorAuthDeleteData(values?: Partial<SecondFactorAuthDeleteData>): SecondFactorAuthDeleteData {
	return Object.assign(create(typeModels.SecondFactorAuthDeleteData, SecondFactorAuthDeleteDataTypeRef), values)
}

export type SecondFactorAuthDeleteData = {
	_type: TypeRef<SecondFactorAuthDeleteData>;

	_format: NumberString;

	session: IdTuple;
}
export const SecondFactorAuthGetDataTypeRef: TypeRef<SecondFactorAuthGetData> = new TypeRef("sys", "SecondFactorAuthGetData")

export function createSecondFactorAuthGetData(values?: Partial<SecondFactorAuthGetData>): SecondFactorAuthGetData {
	return Object.assign(create(typeModels.SecondFactorAuthGetData, SecondFactorAuthGetDataTypeRef), values)
}

export type SecondFactorAuthGetData = {
	_type: TypeRef<SecondFactorAuthGetData>;

	_format: NumberString;
	accessToken: string;
}
export const SecondFactorAuthGetReturnTypeRef: TypeRef<SecondFactorAuthGetReturn> = new TypeRef("sys", "SecondFactorAuthGetReturn")

export function createSecondFactorAuthGetReturn(values?: Partial<SecondFactorAuthGetReturn>): SecondFactorAuthGetReturn {
	return Object.assign(create(typeModels.SecondFactorAuthGetReturn, SecondFactorAuthGetReturnTypeRef), values)
}

export type SecondFactorAuthGetReturn = {
	_type: TypeRef<SecondFactorAuthGetReturn>;

	_format: NumberString;
	secondFactorPending: boolean;
}
export const SecondFactorAuthenticationTypeRef: TypeRef<SecondFactorAuthentication> = new TypeRef("sys", "SecondFactorAuthentication")

export function createSecondFactorAuthentication(values?: Partial<SecondFactorAuthentication>): SecondFactorAuthentication {
	return Object.assign(create(typeModels.SecondFactorAuthentication, SecondFactorAuthenticationTypeRef), values)
}

export type SecondFactorAuthentication = {
	_type: TypeRef<SecondFactorAuthentication>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	code: string;
	finished: boolean;
	service: string;
	verifyCount: NumberString;
}
export const SendRegistrationCodeDataTypeRef: TypeRef<SendRegistrationCodeData> = new TypeRef("sys", "SendRegistrationCodeData")

export function createSendRegistrationCodeData(values?: Partial<SendRegistrationCodeData>): SendRegistrationCodeData {
	return Object.assign(create(typeModels.SendRegistrationCodeData, SendRegistrationCodeDataTypeRef), values)
}

export type SendRegistrationCodeData = {
	_type: TypeRef<SendRegistrationCodeData>;

	_format: NumberString;
	accountType: NumberString;
	authToken: string;
	language: string;
	mobilePhoneNumber: string;
}
export const SendRegistrationCodeReturnTypeRef: TypeRef<SendRegistrationCodeReturn> = new TypeRef("sys", "SendRegistrationCodeReturn")

export function createSendRegistrationCodeReturn(values?: Partial<SendRegistrationCodeReturn>): SendRegistrationCodeReturn {
	return Object.assign(create(typeModels.SendRegistrationCodeReturn, SendRegistrationCodeReturnTypeRef), values)
}

export type SendRegistrationCodeReturn = {
	_type: TypeRef<SendRegistrationCodeReturn>;

	_format: NumberString;
	authToken: string;
}
export const SentGroupInvitationTypeRef: TypeRef<SentGroupInvitation> = new TypeRef("sys", "SentGroupInvitation")

export function createSentGroupInvitation(values?: Partial<SentGroupInvitation>): SentGroupInvitation {
	return Object.assign(create(typeModels.SentGroupInvitation, SentGroupInvitationTypeRef), values)
}

export type SentGroupInvitation = {
	_type: TypeRef<SentGroupInvitation>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	capability: NumberString;
	inviteeMailAddress: string;

	receivedInvitation:  null | IdTuple;
	sharedGroup: Id;
}
export const SessionTypeRef: TypeRef<Session> = new TypeRef("sys", "Session")

export function createSession(values?: Partial<Session>): Session {
	return Object.assign(create(typeModels.Session, SessionTypeRef), values)
}

export type Session = {
	_type: TypeRef<Session>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	accessKey: null | Uint8Array;
	clientIdentifier: string;
	lastAccessTime: Date;
	loginIpAddress: null | string;
	loginTime: Date;
	state: NumberString;

	challenges: Challenge[];
	user: Id;
}
export const SignOrderProcessingAgreementDataTypeRef: TypeRef<SignOrderProcessingAgreementData> = new TypeRef("sys", "SignOrderProcessingAgreementData")

export function createSignOrderProcessingAgreementData(values?: Partial<SignOrderProcessingAgreementData>): SignOrderProcessingAgreementData {
	return Object.assign(create(typeModels.SignOrderProcessingAgreementData, SignOrderProcessingAgreementDataTypeRef), values)
}

export type SignOrderProcessingAgreementData = {
	_type: TypeRef<SignOrderProcessingAgreementData>;

	_format: NumberString;
	customerAddress: string;
	version: string;
}
export const SseConnectDataTypeRef: TypeRef<SseConnectData> = new TypeRef("sys", "SseConnectData")

export function createSseConnectData(values?: Partial<SseConnectData>): SseConnectData {
	return Object.assign(create(typeModels.SseConnectData, SseConnectDataTypeRef), values)
}

export type SseConnectData = {
	_type: TypeRef<SseConnectData>;

	_format: NumberString;
	identifier: string;

	userIds: GeneratedIdWrapper[];
}
export const StringConfigValueTypeRef: TypeRef<StringConfigValue> = new TypeRef("sys", "StringConfigValue")

export function createStringConfigValue(values?: Partial<StringConfigValue>): StringConfigValue {
	return Object.assign(create(typeModels.StringConfigValue, StringConfigValueTypeRef), values)
}

export type StringConfigValue = {
	_type: TypeRef<StringConfigValue>;

	_id: Id;
	name: string;
	value: string;
}
export const StringWrapperTypeRef: TypeRef<StringWrapper> = new TypeRef("sys", "StringWrapper")

export function createStringWrapper(values?: Partial<StringWrapper>): StringWrapper {
	return Object.assign(create(typeModels.StringWrapper, StringWrapperTypeRef), values)
}

export type StringWrapper = {
	_type: TypeRef<StringWrapper>;

	_id: Id;
	value: string;
}
export const SwitchAccountTypeDataTypeRef: TypeRef<SwitchAccountTypeData> = new TypeRef("sys", "SwitchAccountTypeData")

export function createSwitchAccountTypeData(values?: Partial<SwitchAccountTypeData>): SwitchAccountTypeData {
	return Object.assign(create(typeModels.SwitchAccountTypeData, SwitchAccountTypeDataTypeRef), values)
}

export type SwitchAccountTypeData = {
	_type: TypeRef<SwitchAccountTypeData>;

	_format: NumberString;
	accountType: NumberString;
	date: null | Date;
	subscriptionType: NumberString;
}
export const SystemKeysReturnTypeRef: TypeRef<SystemKeysReturn> = new TypeRef("sys", "SystemKeysReturn")

export function createSystemKeysReturn(values?: Partial<SystemKeysReturn>): SystemKeysReturn {
	return Object.assign(create(typeModels.SystemKeysReturn, SystemKeysReturnTypeRef), values)
}

export type SystemKeysReturn = {
	_type: TypeRef<SystemKeysReturn>;

	_format: NumberString;
	freeGroupKey: Uint8Array;
	premiumGroupKey: Uint8Array;
	starterGroupKey: Uint8Array;
	systemAdminPubKey: Uint8Array;
	systemAdminPubKeyVersion: NumberString;

	freeGroup:  null | Id;
	premiumGroup:  null | Id;
}
export const TakeOverDeletedAddressDataTypeRef: TypeRef<TakeOverDeletedAddressData> = new TypeRef("sys", "TakeOverDeletedAddressData")

export function createTakeOverDeletedAddressData(values?: Partial<TakeOverDeletedAddressData>): TakeOverDeletedAddressData {
	return Object.assign(create(typeModels.TakeOverDeletedAddressData, TakeOverDeletedAddressDataTypeRef), values)
}

export type TakeOverDeletedAddressData = {
	_type: TypeRef<TakeOverDeletedAddressData>;

	_format: NumberString;
	authVerifier: string;
	mailAddress: string;
	recoverCodeVerifier: null | string;
	targetAccountMailAddress: string;
}
export const TypeInfoTypeRef: TypeRef<TypeInfo> = new TypeRef("sys", "TypeInfo")

export function createTypeInfo(values?: Partial<TypeInfo>): TypeInfo {
	return Object.assign(create(typeModels.TypeInfo, TypeInfoTypeRef), values)
}

export type TypeInfo = {
	_type: TypeRef<TypeInfo>;

	_id: Id;
	application: string;
	typeId: NumberString;
}
export const U2fChallengeTypeRef: TypeRef<U2fChallenge> = new TypeRef("sys", "U2fChallenge")

export function createU2fChallenge(values?: Partial<U2fChallenge>): U2fChallenge {
	return Object.assign(create(typeModels.U2fChallenge, U2fChallengeTypeRef), values)
}

export type U2fChallenge = {
	_type: TypeRef<U2fChallenge>;

	_id: Id;
	challenge: Uint8Array;

	keys: U2fKey[];
}
export const U2fKeyTypeRef: TypeRef<U2fKey> = new TypeRef("sys", "U2fKey")

export function createU2fKey(values?: Partial<U2fKey>): U2fKey {
	return Object.assign(create(typeModels.U2fKey, U2fKeyTypeRef), values)
}

export type U2fKey = {
	_type: TypeRef<U2fKey>;

	_id: Id;
	appId: string;
	keyHandle: Uint8Array;

	secondFactor: IdTuple;
}
export const U2fRegisteredDeviceTypeRef: TypeRef<U2fRegisteredDevice> = new TypeRef("sys", "U2fRegisteredDevice")

export function createU2fRegisteredDevice(values?: Partial<U2fRegisteredDevice>): U2fRegisteredDevice {
	return Object.assign(create(typeModels.U2fRegisteredDevice, U2fRegisteredDeviceTypeRef), values)
}

export type U2fRegisteredDevice = {
	_type: TypeRef<U2fRegisteredDevice>;

	_id: Id;
	appId: string;
	compromised: boolean;
	counter: NumberString;
	keyHandle: Uint8Array;
	publicKey: Uint8Array;
}
export const U2fResponseDataTypeRef: TypeRef<U2fResponseData> = new TypeRef("sys", "U2fResponseData")

export function createU2fResponseData(values?: Partial<U2fResponseData>): U2fResponseData {
	return Object.assign(create(typeModels.U2fResponseData, U2fResponseDataTypeRef), values)
}

export type U2fResponseData = {
	_type: TypeRef<U2fResponseData>;

	_id: Id;
	clientData: string;
	keyHandle: string;
	signatureData: string;
}
export const UpdateAdminshipDataTypeRef: TypeRef<UpdateAdminshipData> = new TypeRef("sys", "UpdateAdminshipData")

export function createUpdateAdminshipData(values?: Partial<UpdateAdminshipData>): UpdateAdminshipData {
	return Object.assign(create(typeModels.UpdateAdminshipData, UpdateAdminshipDataTypeRef), values)
}

export type UpdateAdminshipData = {
	_type: TypeRef<UpdateAdminshipData>;

	_format: NumberString;
	newAdminGroupEncGKey: Uint8Array;

	group: Id;
	newAdminGroup: Id;
}
export const UpdatePermissionKeyDataTypeRef: TypeRef<UpdatePermissionKeyData> = new TypeRef("sys", "UpdatePermissionKeyData")

export function createUpdatePermissionKeyData(values?: Partial<UpdatePermissionKeyData>): UpdatePermissionKeyData {
	return Object.assign(create(typeModels.UpdatePermissionKeyData, UpdatePermissionKeyDataTypeRef), values)
}

export type UpdatePermissionKeyData = {
	_type: TypeRef<UpdatePermissionKeyData>;

	_format: NumberString;
	ownerEncSessionKey: null | Uint8Array;
	symEncSessionKey: null | Uint8Array;

	bucketPermission: IdTuple;
	permission: IdTuple;
}
export const UpdateSessionKeysPostInTypeRef: TypeRef<UpdateSessionKeysPostIn> = new TypeRef("sys", "UpdateSessionKeysPostIn")

export function createUpdateSessionKeysPostIn(values?: Partial<UpdateSessionKeysPostIn>): UpdateSessionKeysPostIn {
	return Object.assign(create(typeModels.UpdateSessionKeysPostIn, UpdateSessionKeysPostInTypeRef), values)
}

export type UpdateSessionKeysPostIn = {
	_type: TypeRef<UpdateSessionKeysPostIn>;

	_format: NumberString;

	ownerEncSessionKeys: InstanceSessionKey[];
}
export const UpgradePriceServiceDataTypeRef: TypeRef<UpgradePriceServiceData> = new TypeRef("sys", "UpgradePriceServiceData")

export function createUpgradePriceServiceData(values?: Partial<UpgradePriceServiceData>): UpgradePriceServiceData {
	return Object.assign(create(typeModels.UpgradePriceServiceData, UpgradePriceServiceDataTypeRef), values)
}

export type UpgradePriceServiceData = {
	_type: TypeRef<UpgradePriceServiceData>;

	_format: NumberString;
	campaign: null | string;
	date: null | Date;
}
export const UpgradePriceServiceReturnTypeRef: TypeRef<UpgradePriceServiceReturn> = new TypeRef("sys", "UpgradePriceServiceReturn")

export function createUpgradePriceServiceReturn(values?: Partial<UpgradePriceServiceReturn>): UpgradePriceServiceReturn {
	return Object.assign(create(typeModels.UpgradePriceServiceReturn, UpgradePriceServiceReturnTypeRef), values)
}

export type UpgradePriceServiceReturn = {
	_type: TypeRef<UpgradePriceServiceReturn>;

	_format: NumberString;
	business: boolean;
	messageTextId: null | string;

	premiumBusinessPrices: PlanPrices;
	premiumPrices: PlanPrices;
	proPrices: PlanPrices;
	teamsBusinessPrices: PlanPrices;
	teamsPrices: PlanPrices;
}
export const UserTypeRef: TypeRef<User> = new TypeRef("sys", "User")

export function createUser(values?: Partial<User>): User {
	return Object.assign(create(typeModels.User, UserTypeRef), values)
}

export type User = {
	_type: TypeRef<User>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	accountType: NumberString;
	enabled: boolean;
	requirePasswordUpdate: boolean;
	salt: null | Uint8Array;
	userEncClientKey: Uint8Array;
	verifier: Uint8Array;

	alarmInfoList:  null | UserAlarmInfoListType;
	auth:  null | UserAuthentication;
	authenticatedDevices: AuthenticatedDevice[];
	customer:  null | Id;
	externalAuthInfo:  null | UserExternalAuthInfo;
	failedLogins: Id;
	memberships: GroupMembership[];
	phoneNumbers: PhoneNumber[];
	pushIdentifierList:  null | PushIdentifierList;
	secondFactorAuthentications: Id;
	successfulLogins: Id;
	userGroup: GroupMembership;
}
export const UserAlarmInfoTypeRef: TypeRef<UserAlarmInfo> = new TypeRef("sys", "UserAlarmInfo")

export function createUserAlarmInfo(values?: Partial<UserAlarmInfo>): UserAlarmInfo {
	return Object.assign(create(typeModels.UserAlarmInfo, UserAlarmInfoTypeRef), values)
}

export type UserAlarmInfo = {
	_type: TypeRef<UserAlarmInfo>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	alarmInfo: AlarmInfo;
}
export const UserAlarmInfoListTypeTypeRef: TypeRef<UserAlarmInfoListType> = new TypeRef("sys", "UserAlarmInfoListType")

export function createUserAlarmInfoListType(values?: Partial<UserAlarmInfoListType>): UserAlarmInfoListType {
	return Object.assign(create(typeModels.UserAlarmInfoListType, UserAlarmInfoListTypeTypeRef), values)
}

export type UserAlarmInfoListType = {
	_type: TypeRef<UserAlarmInfoListType>;

	_id: Id;

	alarms: Id;
}
export const UserAreaGroupsTypeRef: TypeRef<UserAreaGroups> = new TypeRef("sys", "UserAreaGroups")

export function createUserAreaGroups(values?: Partial<UserAreaGroups>): UserAreaGroups {
	return Object.assign(create(typeModels.UserAreaGroups, UserAreaGroupsTypeRef), values)
}

export type UserAreaGroups = {
	_type: TypeRef<UserAreaGroups>;

	_id: Id;

	list: Id;
}
export const UserAuthenticationTypeRef: TypeRef<UserAuthentication> = new TypeRef("sys", "UserAuthentication")

export function createUserAuthentication(values?: Partial<UserAuthentication>): UserAuthentication {
	return Object.assign(create(typeModels.UserAuthentication, UserAuthenticationTypeRef), values)
}

export type UserAuthentication = {
	_type: TypeRef<UserAuthentication>;

	_id: Id;

	recoverCode:  null | Id;
	secondFactors: Id;
	sessions: Id;
}
export const UserDataTypeRef: TypeRef<UserData> = new TypeRef("sys", "UserData")

export function createUserData(values?: Partial<UserData>): UserData {
	return Object.assign(create(typeModels.UserData, UserDataTypeRef), values)
}

export type UserData = {
	_type: TypeRef<UserData>;

	_format: NumberString;
	date: null | Date;
	mobilePhoneNumber: string;
	salt: Uint8Array;
	userEncClientKey: Uint8Array;
	userEncCustomerGroupKey: Uint8Array;
	verifier: Uint8Array;

	userGroupData:  null | CreateGroupData;
}
export const UserDataDeleteTypeRef: TypeRef<UserDataDelete> = new TypeRef("sys", "UserDataDelete")

export function createUserDataDelete(values?: Partial<UserDataDelete>): UserDataDelete {
	return Object.assign(create(typeModels.UserDataDelete, UserDataDeleteTypeRef), values)
}

export type UserDataDelete = {
	_type: TypeRef<UserDataDelete>;

	_format: NumberString;
	date: null | Date;
	restore: boolean;

	user: Id;
}
export const UserExternalAuthInfoTypeRef: TypeRef<UserExternalAuthInfo> = new TypeRef("sys", "UserExternalAuthInfo")

export function createUserExternalAuthInfo(values?: Partial<UserExternalAuthInfo>): UserExternalAuthInfo {
	return Object.assign(create(typeModels.UserExternalAuthInfo, UserExternalAuthInfoTypeRef), values)
}

export type UserExternalAuthInfo = {
	_type: TypeRef<UserExternalAuthInfo>;

	_id: Id;
	authUpdateCounter: NumberString;
	autoAuthenticationId: Id;
	autoTransmitPassword: null | string;
	latestSaltHash: null | Uint8Array;

	variableAuthInfo: Id;
}
export const UserGroupRootTypeRef: TypeRef<UserGroupRoot> = new TypeRef("sys", "UserGroupRoot")

export function createUserGroupRoot(values?: Partial<UserGroupRoot>): UserGroupRoot {
	return Object.assign(create(typeModels.UserGroupRoot, UserGroupRootTypeRef), values)
}

export type UserGroupRoot = {
	_type: TypeRef<UserGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	invitations: Id;
}
export const UserIdDataTypeRef: TypeRef<UserIdData> = new TypeRef("sys", "UserIdData")

export function createUserIdData(values?: Partial<UserIdData>): UserIdData {
	return Object.assign(create(typeModels.UserIdData, UserIdDataTypeRef), values)
}

export type UserIdData = {
	_type: TypeRef<UserIdData>;

	_format: NumberString;
	mailAddress: string;
}
export const UserIdReturnTypeRef: TypeRef<UserIdReturn> = new TypeRef("sys", "UserIdReturn")

export function createUserIdReturn(values?: Partial<UserIdReturn>): UserIdReturn {
	return Object.assign(create(typeModels.UserIdReturn, UserIdReturnTypeRef), values)
}

export type UserIdReturn = {
	_type: TypeRef<UserIdReturn>;

	_format: NumberString;

	userId: Id;
}
export const UserReturnTypeRef: TypeRef<UserReturn> = new TypeRef("sys", "UserReturn")

export function createUserReturn(values?: Partial<UserReturn>): UserReturn {
	return Object.assign(create(typeModels.UserReturn, UserReturnTypeRef), values)
}

export type UserReturn = {
	_type: TypeRef<UserReturn>;

	_format: NumberString;

	user: Id;
	userGroup: Id;
}
export const VariableExternalAuthInfoTypeRef: TypeRef<VariableExternalAuthInfo> = new TypeRef("sys", "VariableExternalAuthInfo")

export function createVariableExternalAuthInfo(values?: Partial<VariableExternalAuthInfo>): VariableExternalAuthInfo {
	return Object.assign(create(typeModels.VariableExternalAuthInfo, VariableExternalAuthInfoTypeRef), values)
}

export type VariableExternalAuthInfo = {
	_type: TypeRef<VariableExternalAuthInfo>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	authUpdateCounter: NumberString;
	lastSentTimestamp: Date;
	loggedInIpAddressHash: null | Uint8Array;
	loggedInTimestamp: null | Date;
	loggedInVerifier: null | Uint8Array;
	sentCount: NumberString;
}
export const VerifyRegistrationCodeDataTypeRef: TypeRef<VerifyRegistrationCodeData> = new TypeRef("sys", "VerifyRegistrationCodeData")

export function createVerifyRegistrationCodeData(values?: Partial<VerifyRegistrationCodeData>): VerifyRegistrationCodeData {
	return Object.assign(create(typeModels.VerifyRegistrationCodeData, VerifyRegistrationCodeDataTypeRef), values)
}

export type VerifyRegistrationCodeData = {
	_type: TypeRef<VerifyRegistrationCodeData>;

	_format: NumberString;
	authToken: string;
	code: string;
}
export const VersionTypeRef: TypeRef<Version> = new TypeRef("sys", "Version")

export function createVersion(values?: Partial<Version>): Version {
	return Object.assign(create(typeModels.Version, VersionTypeRef), values)
}

export type Version = {
	_type: TypeRef<Version>;

	_id: Id;
	operation: string;
	timestamp: Date;
	version: Id;

	author: Id;
	authorGroupInfo: IdTuple;
}
export const VersionDataTypeRef: TypeRef<VersionData> = new TypeRef("sys", "VersionData")

export function createVersionData(values?: Partial<VersionData>): VersionData {
	return Object.assign(create(typeModels.VersionData, VersionDataTypeRef), values)
}

export type VersionData = {
	_type: TypeRef<VersionData>;

	_format: NumberString;
	application: string;
	id: Id;
	listId: null | Id;
	typeId: NumberString;
}
export const VersionInfoTypeRef: TypeRef<VersionInfo> = new TypeRef("sys", "VersionInfo")

export function createVersionInfo(values?: Partial<VersionInfo>): VersionInfo {
	return Object.assign(create(typeModels.VersionInfo, VersionInfoTypeRef), values)
}

export type VersionInfo = {
	_type: TypeRef<VersionInfo>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	app: string;
	operation: string;
	referenceList: null | Id;
	timestamp: Date;
	type: NumberString;
	versionData: null | Uint8Array;

	author: Id;
	authorGroupInfo: IdTuple;
}
export const VersionReturnTypeRef: TypeRef<VersionReturn> = new TypeRef("sys", "VersionReturn")

export function createVersionReturn(values?: Partial<VersionReturn>): VersionReturn {
	return Object.assign(create(typeModels.VersionReturn, VersionReturnTypeRef), values)
}

export type VersionReturn = {
	_type: TypeRef<VersionReturn>;

	_format: NumberString;

	versions: Version[];
}
export const WebauthnResponseDataTypeRef: TypeRef<WebauthnResponseData> = new TypeRef("sys", "WebauthnResponseData")

export function createWebauthnResponseData(values?: Partial<WebauthnResponseData>): WebauthnResponseData {
	return Object.assign(create(typeModels.WebauthnResponseData, WebauthnResponseDataTypeRef), values)
}

export type WebauthnResponseData = {
	_type: TypeRef<WebauthnResponseData>;

	_id: Id;
	authenticatorData: Uint8Array;
	clientData: Uint8Array;
	keyHandle: Uint8Array;
	signature: Uint8Array;
}
export const WebsocketCounterDataTypeRef: TypeRef<WebsocketCounterData> = new TypeRef("sys", "WebsocketCounterData")

export function createWebsocketCounterData(values?: Partial<WebsocketCounterData>): WebsocketCounterData {
	return Object.assign(create(typeModels.WebsocketCounterData, WebsocketCounterDataTypeRef), values)
}

export type WebsocketCounterData = {
	_type: TypeRef<WebsocketCounterData>;

	_format: NumberString;
	mailGroup: Id;

	counterValues: WebsocketCounterValue[];
}
export const WebsocketCounterValueTypeRef: TypeRef<WebsocketCounterValue> = new TypeRef("sys", "WebsocketCounterValue")

export function createWebsocketCounterValue(values?: Partial<WebsocketCounterValue>): WebsocketCounterValue {
	return Object.assign(create(typeModels.WebsocketCounterValue, WebsocketCounterValueTypeRef), values)
}

export type WebsocketCounterValue = {
	_type: TypeRef<WebsocketCounterValue>;

	_id: Id;
	count: NumberString;
	mailListId: Id;
}
export const WebsocketEntityDataTypeRef: TypeRef<WebsocketEntityData> = new TypeRef("sys", "WebsocketEntityData")

export function createWebsocketEntityData(values?: Partial<WebsocketEntityData>): WebsocketEntityData {
	return Object.assign(create(typeModels.WebsocketEntityData, WebsocketEntityDataTypeRef), values)
}

export type WebsocketEntityData = {
	_type: TypeRef<WebsocketEntityData>;

	_format: NumberString;
	eventBatchId: Id;
	eventBatchOwner: Id;

	eventBatch: EntityUpdate[];
}
export const WebsocketLeaderStatusTypeRef: TypeRef<WebsocketLeaderStatus> = new TypeRef("sys", "WebsocketLeaderStatus")

export function createWebsocketLeaderStatus(values?: Partial<WebsocketLeaderStatus>): WebsocketLeaderStatus {
	return Object.assign(create(typeModels.WebsocketLeaderStatus, WebsocketLeaderStatusTypeRef), values)
}

export type WebsocketLeaderStatus = {
	_type: TypeRef<WebsocketLeaderStatus>;

	_format: NumberString;
	leaderStatus: boolean;
}
export const WhitelabelChildTypeRef: TypeRef<WhitelabelChild> = new TypeRef("sys", "WhitelabelChild")

export function createWhitelabelChild(values?: Partial<WhitelabelChild>): WhitelabelChild {
	return Object.assign(create(typeModels.WhitelabelChild, WhitelabelChildTypeRef), values)
}

export type WhitelabelChild = {
	_type: TypeRef<WhitelabelChild>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	comment: string;
	createdDate: Date;
	deletedDate: null | Date;
	mailAddress: string;

	customer: Id;
}
export const WhitelabelChildrenRefTypeRef: TypeRef<WhitelabelChildrenRef> = new TypeRef("sys", "WhitelabelChildrenRef")

export function createWhitelabelChildrenRef(values?: Partial<WhitelabelChildrenRef>): WhitelabelChildrenRef {
	return Object.assign(create(typeModels.WhitelabelChildrenRef, WhitelabelChildrenRefTypeRef), values)
}

export type WhitelabelChildrenRef = {
	_type: TypeRef<WhitelabelChildrenRef>;

	_id: Id;

	items: Id;
}
export const WhitelabelConfigTypeRef: TypeRef<WhitelabelConfig> = new TypeRef("sys", "WhitelabelConfig")

export function createWhitelabelConfig(values?: Partial<WhitelabelConfig>): WhitelabelConfig {
	return Object.assign(create(typeModels.WhitelabelConfig, WhitelabelConfigTypeRef), values)
}

export type WhitelabelConfig = {
	_type: TypeRef<WhitelabelConfig>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	germanLanguageCode: null | string;
	imprintUrl: null | string;
	jsonTheme: string;
	metaTags: string;
	privacyStatementUrl: null | string;
	whitelabelCode: string;

	bootstrapCustomizations: BootstrapFeature[];
	certificateInfo:  null | CertificateInfo;
	whitelabelRegistrationDomains: StringWrapper[];
}
export const WhitelabelParentTypeRef: TypeRef<WhitelabelParent> = new TypeRef("sys", "WhitelabelParent")

export function createWhitelabelParent(values?: Partial<WhitelabelParent>): WhitelabelParent {
	return Object.assign(create(typeModels.WhitelabelParent, WhitelabelParentTypeRef), values)
}

export type WhitelabelParent = {
	_type: TypeRef<WhitelabelParent>;

	_id: Id;

	customer: Id;
	whitelabelChildInParent: IdTuple;
}
