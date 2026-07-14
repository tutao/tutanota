import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"


export const KeyPairTypeRef: TypeRef<KeyPair> = new TypeRef("sys", 0)

export function createKeyPair(values: KeyPairParams): KeyPair {
    return Object.assign(create(typeModels[KeyPairTypeRef.typeId], KeyPairTypeRef), values)
}

export type KeyPairParams = {


	pubRsaKey: null | Uint8Array;
	symEncPrivRsaKey: null | Uint8Array;
	pubEccKey: null | Uint8Array;
	symEncPrivEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;
	symEncPrivKyberKey: null | Uint8Array;

	signature: null | PublicKeySignature;
}

export type KeyPair = {
	_type: TypeRef<KeyPair>;
	_original?: KeyPair

	_id: Id;
	pubRsaKey: null | Uint8Array;
	symEncPrivRsaKey: null | Uint8Array;
	pubEccKey: null | Uint8Array;
	symEncPrivEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;
	symEncPrivKyberKey: null | Uint8Array;

	signature: null | PublicKeySignature;
}
export const GroupTypeRef: TypeRef<Group> = new TypeRef("sys", 5)

export function createGroup(values: GroupParams): Group {
    return Object.assign(create(typeModels[GroupTypeRef.typeId], GroupTypeRef), values)
}

export type GroupParams = {


	type: NumberString;
	adminGroupEncGKey: null | Uint8Array;
	enabled: boolean;
	external: boolean;
	adminGroupKeyVersion: null | NumberString;
	groupKeyVersion: NumberString;

	currentKeys: null | KeyPair;
	admin: null | Id;
	user: null | Id;
	customer: null | Id;
	groupInfo: IdTuple;
	invitations: Id;
	members: Id;
	archives: ArchiveType[];
	storageCounter: null | Id;
	formerGroupKeys: GroupKeysRef;
	pubAdminGroupEncGKey: null | PubEncKeyData;
	identityKeyPair: null | IdentityKeyPair;
}

export type Group = {
	_type: TypeRef<Group>;
	_original?: Group

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	type: NumberString;
	adminGroupEncGKey: null | Uint8Array;
	enabled: boolean;
	_ownerGroup: null | Id;
	external: boolean;
	adminGroupKeyVersion: null | NumberString;
	groupKeyVersion: NumberString;

	currentKeys: null | KeyPair;
	admin: null | Id;
	user: null | Id;
	customer: null | Id;
	groupInfo: IdTuple;
	invitations: Id;
	members: Id;
	archives: ArchiveType[];
	storageCounter: null | Id;
	formerGroupKeys: GroupKeysRef;
	pubAdminGroupEncGKey: null | PubEncKeyData;
	identityKeyPair: null | IdentityKeyPair;
}
export const GroupInfoTypeRef: TypeRef<GroupInfo> = new TypeRef("sys", 14)

export function createGroupInfo(values: GroupInfoParams): GroupInfo {
    return Object.assign(create(typeModels[GroupInfoTypeRef.typeId], GroupInfoTypeRef), values)
}

export type GroupInfoParams = {


	_listEncSessionKey: null | Uint8Array;
	name: string;
	mailAddress: null | string;
	created: Date;
	deleted: null | Date;
	groupType: null | NumberString;

	group: Id;
	mailAddressAliases: MailAddressAlias[];
}

export type GroupInfo = {
	_type: TypeRef<GroupInfo>;
	_errors: Object;
	_original?: GroupInfo

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_listEncSessionKey: null | Uint8Array;
	name: string;
	mailAddress: null | string;
	created: Date;
	deleted: null | Date;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	groupType: null | NumberString;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	group: Id;
	mailAddressAliases: MailAddressAlias[];
}
export const GroupMembershipTypeRef: TypeRef<GroupMembership> = new TypeRef("sys", 25)

export function createGroupMembership(values: GroupMembershipParams): GroupMembership {
    return Object.assign(create(typeModels[GroupMembershipTypeRef.typeId], GroupMembershipTypeRef), values)
}

export type GroupMembershipParams = {


	symEncGKey: Uint8Array;
	admin: boolean;
	groupType: null | NumberString;
	capability: null | NumberString;
	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;

	group: Id;
	groupInfo: IdTuple;
	groupMember: IdTuple;
}

export type GroupMembership = {
	_type: TypeRef<GroupMembership>;
	_original?: GroupMembership

	_id: Id;
	symEncGKey: Uint8Array;
	admin: boolean;
	groupType: null | NumberString;
	capability: null | NumberString;
	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;

	group: Id;
	groupInfo: IdTuple;
	groupMember: IdTuple;
}
export const CustomerTypeRef: TypeRef<Customer> = new TypeRef("sys", 31)

export function createCustomer(values: CustomerParams): Customer {
    return Object.assign(create(typeModels[CustomerTypeRef.typeId], CustomerTypeRef), values)
}

export type CustomerParams = {


	type: NumberString;
	approvalStatus: NumberString;
	orderProcessingAgreementNeeded: boolean;
	businessUse: boolean;

	adminGroup: Id;
	customerGroup: Id;
	adminGroups: Id;
	customerGroups: Id;
	userGroups: Id;
	teamGroups: Id;
	customerInfo: IdTuple;
	properties: null | Id;
	serverProperties: null | Id;
	userAreaGroups: null | UserAreaGroups;
	auditLog: null | AuditLogRef;
	customizations: Feature[];
	whitelabelParent: null | WhitelabelParent;
	whitelabelChildren: null | WhitelabelChildrenRef;
	orderProcessingAgreement: null | IdTuple;
	rejectedSenders: null | RejectedSendersRef;
	referralCode: null | Id;
}

export type Customer = {
	_type: TypeRef<Customer>;
	_original?: Customer

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	type: NumberString;
	approvalStatus: NumberString;
	_ownerGroup: null | Id;
	orderProcessingAgreementNeeded: boolean;
	businessUse: boolean;

	adminGroup: Id;
	customerGroup: Id;
	adminGroups: Id;
	customerGroups: Id;
	userGroups: Id;
	teamGroups: Id;
	customerInfo: IdTuple;
	properties: null | Id;
	serverProperties: null | Id;
	userAreaGroups: null | UserAreaGroups;
	auditLog: null | AuditLogRef;
	customizations: Feature[];
	whitelabelParent: null | WhitelabelParent;
	whitelabelChildren: null | WhitelabelChildrenRef;
	orderProcessingAgreement: null | IdTuple;
	rejectedSenders: null | RejectedSendersRef;
	referralCode: null | Id;
}
export const AuthenticatedDeviceTypeRef: TypeRef<AuthenticatedDevice> = new TypeRef("sys", 43)

export function createAuthenticatedDevice(values: AuthenticatedDeviceParams): AuthenticatedDevice {
    return Object.assign(create(typeModels[AuthenticatedDeviceTypeRef.typeId], AuthenticatedDeviceTypeRef), values)
}

export type AuthenticatedDeviceParams = {


	authType: NumberString;
	deviceToken: string;
	deviceKey: Uint8Array;
}

export type AuthenticatedDevice = {
	_type: TypeRef<AuthenticatedDevice>;
	_original?: AuthenticatedDevice

	_id: Id;
	authType: NumberString;
	deviceToken: string;
	deviceKey: Uint8Array;
}
export const LoginTypeRef: TypeRef<Login> = new TypeRef("sys", 48)

export function createLogin(values: LoginParams): Login {
    return Object.assign(create(typeModels[LoginTypeRef.typeId], LoginTypeRef), values)
}

export type LoginParams = {


	time: Date;
}

export type Login = {
	_type: TypeRef<Login>;
	_original?: Login

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	time: Date;
	_ownerGroup: null | Id;
}
export const SecondFactorAuthenticationTypeRef: TypeRef<SecondFactorAuthentication> = new TypeRef("sys", 54)

export function createSecondFactorAuthentication(values: SecondFactorAuthenticationParams): SecondFactorAuthentication {
    return Object.assign(create(typeModels[SecondFactorAuthenticationTypeRef.typeId], SecondFactorAuthenticationTypeRef), values)
}

export type SecondFactorAuthenticationParams = {


	code: string;
	verifyCount: NumberString;
	finished: boolean;
	service: string;
}

export type SecondFactorAuthentication = {
	_type: TypeRef<SecondFactorAuthentication>;
	_original?: SecondFactorAuthentication

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	code: string;
	verifyCount: NumberString;
	finished: boolean;
	service: string;
	_ownerGroup: null | Id;
}
export const VariableExternalAuthInfoTypeRef: TypeRef<VariableExternalAuthInfo> = new TypeRef("sys", 66)

export function createVariableExternalAuthInfo(values: VariableExternalAuthInfoParams): VariableExternalAuthInfo {
    return Object.assign(create(typeModels[VariableExternalAuthInfoTypeRef.typeId], VariableExternalAuthInfoTypeRef), values)
}

export type VariableExternalAuthInfoParams = {


	loggedInVerifier: null | Uint8Array;
	loggedInTimestamp: null | Date;
	loggedInIpAddressHash: null | Uint8Array;
	sentCount: NumberString;
	lastSentTimestamp: Date;
	authUpdateCounter: NumberString;
}

export type VariableExternalAuthInfo = {
	_type: TypeRef<VariableExternalAuthInfo>;
	_original?: VariableExternalAuthInfo

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	loggedInVerifier: null | Uint8Array;
	loggedInTimestamp: null | Date;
	loggedInIpAddressHash: null | Uint8Array;
	sentCount: NumberString;
	lastSentTimestamp: Date;
	authUpdateCounter: NumberString;
	_ownerGroup: null | Id;
}
export const UserExternalAuthInfoTypeRef: TypeRef<UserExternalAuthInfo> = new TypeRef("sys", 77)

export function createUserExternalAuthInfo(values: UserExternalAuthInfoParams): UserExternalAuthInfo {
    return Object.assign(create(typeModels[UserExternalAuthInfoTypeRef.typeId], UserExternalAuthInfoTypeRef), values)
}

export type UserExternalAuthInfoParams = {


	autoAuthenticationId: Id;
	latestSaltHash: null | Uint8Array;
	autoTransmitPassword: null | string;
	authUpdateCounter: NumberString;

	variableAuthInfo: Id;
}

export type UserExternalAuthInfo = {
	_type: TypeRef<UserExternalAuthInfo>;
	_original?: UserExternalAuthInfo

	_id: Id;
	autoAuthenticationId: Id;
	latestSaltHash: null | Uint8Array;
	autoTransmitPassword: null | string;
	authUpdateCounter: NumberString;

	variableAuthInfo: Id;
}
export const UserTypeRef: TypeRef<User> = new TypeRef("sys", 84)

export function createUser(values: UserParams): User {
    return Object.assign(create(typeModels[UserTypeRef.typeId], UserTypeRef), values)
}

export type UserParams = {


	salt: null | Uint8Array;
	verifier: Uint8Array;
	accountType: NumberString;
	enabled: boolean;
	requirePasswordUpdate: boolean;
	kdfVersion: NumberString;

	userGroup: GroupMembership;
	memberships: GroupMembership[];
	authenticatedDevices: AuthenticatedDevice[];
	externalAuthInfo: null | UserExternalAuthInfo;
	customer: null | Id;
	successfulLogins: Id;
	failedLogins: Id;
	secondFactorAuthentications: Id;
	pushIdentifierList: null | PushIdentifierList;
	auth: null | UserAuthentication;
	alarmInfoList: null | UserAlarmInfoListType;
}

export type User = {
	_type: TypeRef<User>;
	_original?: User

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	salt: null | Uint8Array;
	verifier: Uint8Array;
	accountType: NumberString;
	enabled: boolean;
	_ownerGroup: null | Id;
	requirePasswordUpdate: boolean;
	kdfVersion: NumberString;

	userGroup: GroupMembership;
	memberships: GroupMembership[];
	authenticatedDevices: AuthenticatedDevice[];
	externalAuthInfo: null | UserExternalAuthInfo;
	customer: null | Id;
	successfulLogins: Id;
	failedLogins: Id;
	secondFactorAuthentications: Id;
	pushIdentifierList: null | PushIdentifierList;
	auth: null | UserAuthentication;
	alarmInfoList: null | UserAlarmInfoListType;
}
export const ExternalUserReferenceTypeRef: TypeRef<ExternalUserReference> = new TypeRef("sys", 103)

export function createExternalUserReference(values: ExternalUserReferenceParams): ExternalUserReference {
    return Object.assign(create(typeModels[ExternalUserReferenceTypeRef.typeId], ExternalUserReferenceTypeRef), values)
}

export type ExternalUserReferenceParams = {



	user: Id;
	userGroup: Id;
}

export type ExternalUserReference = {
	_type: TypeRef<ExternalUserReference>;
	_original?: ExternalUserReference

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	user: Id;
	userGroup: Id;
}
export const GroupRootTypeRef: TypeRef<GroupRoot> = new TypeRef("sys", 110)

export function createGroupRoot(values: GroupRootParams): GroupRoot {
    return Object.assign(create(typeModels[GroupRootTypeRef.typeId], GroupRootTypeRef), values)
}

export type GroupRootParams = {



	externalGroupInfos: Id;
	externalUserReferences: Id;
	externalUserAreaGroupInfos: null | UserAreaGroups;
}

export type GroupRoot = {
	_type: TypeRef<GroupRoot>;
	_original?: GroupRoot

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	externalGroupInfos: Id;
	externalUserReferences: Id;
	externalUserAreaGroupInfos: null | UserAreaGroups;
}
export const BucketPermissionTypeRef: TypeRef<BucketPermission> = new TypeRef("sys", 118)

export function createBucketPermission(values: BucketPermissionParams): BucketPermission {
    return Object.assign(create(typeModels[BucketPermissionTypeRef.typeId], BucketPermissionTypeRef), values)
}

export type BucketPermissionParams = {


	type: NumberString;
	symEncBucketKey: null | Uint8Array;
	pubEncBucketKey: null | Uint8Array;
	pubKeyVersion: null | NumberString;
	ownerEncBucketKey: null | Uint8Array;
	protocolVersion: NumberString;
	symKeyVersion: null | NumberString;
	senderKeyVersion: null | NumberString;

	group: Id;
}

export type BucketPermission = {
	_type: TypeRef<BucketPermission>;
	_original?: BucketPermission

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	type: NumberString;
	symEncBucketKey: null | Uint8Array;
	pubEncBucketKey: null | Uint8Array;
	pubKeyVersion: null | NumberString;
	_ownerGroup: null | Id;
	ownerEncBucketKey: null | Uint8Array;
	protocolVersion: NumberString;
	ownerKeyVersion: null | NumberString;
	symKeyVersion: null | NumberString;
	senderKeyVersion: null | NumberString;

	group: Id;
}
export const BucketTypeRef: TypeRef<Bucket> = new TypeRef("sys", 129)

export function createBucket(values: BucketParams): Bucket {
    return Object.assign(create(typeModels[BucketTypeRef.typeId], BucketTypeRef), values)
}

export type BucketParams = {



	bucketPermissions: Id;
}

export type Bucket = {
	_type: TypeRef<Bucket>;
	_original?: Bucket

	_id: Id;

	bucketPermissions: Id;
}
export const PermissionTypeRef: TypeRef<Permission> = new TypeRef("sys", 132)

export function createPermission(values: PermissionParams): Permission {
    return Object.assign(create(typeModels[PermissionTypeRef.typeId], PermissionTypeRef), values)
}

export type PermissionParams = {


	type: NumberString;
	symEncSessionKey: null | Uint8Array;
	bucketEncSessionKey: null | Uint8Array;
	ops: null | string;
	listElementTypeId: null | NumberString;
	listElementApplication: null | string;
	symKeyVersion: null | NumberString;

	group: null | Id;
	bucket: null | Bucket;
}

export type Permission = {
	_type: TypeRef<Permission>;
	_original?: Permission

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	type: NumberString;
	symEncSessionKey: null | Uint8Array;
	bucketEncSessionKey: null | Uint8Array;
	ops: null | string;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	listElementTypeId: null | NumberString;
	listElementApplication: null | string;
	_ownerKeyVersion: null | NumberString;
	symKeyVersion: null | NumberString;

	group: null | Id;
	bucket: null | Bucket;
}
export const AccountingInfoTypeRef: TypeRef<AccountingInfo> = new TypeRef("sys", 143)

export function createAccountingInfo(values: AccountingInfoParams): AccountingInfo {
    return Object.assign(create(typeModels[AccountingInfoTypeRef.typeId], AccountingInfoTypeRef), values)
}

export type AccountingInfoParams = {


	lastInvoiceTimestamp: null | Date;
	lastInvoiceNbrOfSentSms: NumberString;
	invoiceName: string;
	invoiceAddress: string;
	invoiceCountry: null | string;
	secondCountryInfo: NumberString;
	invoiceVatIdNo: string;
	paymentMethod: null | NumberString;
	paymentMethodInfo: null | string;
	paymentInterval: NumberString;
	paymentProviderCustomerId: null | string;
	paymentAccountIdentifier: null | string;
	paypalBillingAgreement: null | string;
	_modified: Date;
	lastUsedOffer: null | string;

	invoiceInfo: null | Id;
	appStoreSubscription: null | IdTuple;
}

export type AccountingInfo = {
	_type: TypeRef<AccountingInfo>;
	_errors: Object;
	_original?: AccountingInfo

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	lastInvoiceTimestamp: null | Date;
	lastInvoiceNbrOfSentSms: NumberString;
	invoiceName: string;
	invoiceAddress: string;
	invoiceCountry: null | string;
	secondCountryInfo: NumberString;
	invoiceVatIdNo: string;
	paymentMethod: null | NumberString;
	paymentMethodInfo: null | string;
	paymentInterval: NumberString;
	paymentProviderCustomerId: null | string;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	paymentAccountIdentifier: null | string;
	paypalBillingAgreement: null | string;
	_modified: Date;
	_ownerKeyVersion: null | NumberString;
	lastUsedOffer: null | string;
	_kdfNonce: null | Uint8Array;

	invoiceInfo: null | Id;
	appStoreSubscription: null | IdTuple;
}
export const CustomerInfoTypeRef: TypeRef<CustomerInfo> = new TypeRef("sys", 148)

export function createCustomerInfo(values: CustomerInfoParams): CustomerInfo {
    return Object.assign(create(typeModels[CustomerInfoTypeRef.typeId], CustomerInfoTypeRef), values)
}

export type CustomerInfoParams = {


	company: null | string;
	domain: string;
	creationTime: Date;
	testEndTime: null | Date;
	activationTime: null | Date;
	registrationMailAddress: string;
	deletionTime: null | Date;
	deletionReason: null | string;
	promotionStorageCapacity: NumberString;
	source: string;
	promotionEmailAliases: NumberString;
	usedSharedEmailAliases: NumberString;
	includedEmailAliases: NumberString;
	includedStorageCapacity: NumberString;
	erased: boolean;
	perUserStorageCapacity: NumberString;
	perUserAliasCount: NumberString;
	plan: NumberString;
	promotionId: null | string;
	confirmedHuman: boolean;
	adAttributionCampaignId: null | string;

	customer: Id;
	accountingInfo: Id;
	domainInfos: DomainInfo[];
	bookings: null | BookingsRef;
	takeoverCustomer: null | Id;
	giftCards: null | GiftCardsRef;
	terminationRequest: null | IdTuple;
	referredBy: null | Id;
	customPlan: null | PlanConfiguration;
	supportInfo: null | Id;
	managedByPartner: null | Id;
	partnerManagedCustomers: null | Id;
	revocationRequest: null | IdTuple;
}

export type CustomerInfo = {
	_type: TypeRef<CustomerInfo>;
	_original?: CustomerInfo

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	company: null | string;
	domain: string;
	creationTime: Date;
	testEndTime: null | Date;
	activationTime: null | Date;
	registrationMailAddress: string;
	deletionTime: null | Date;
	deletionReason: null | string;
	promotionStorageCapacity: NumberString;
	source: string;
	promotionEmailAliases: NumberString;
	usedSharedEmailAliases: NumberString;
	_ownerGroup: null | Id;
	includedEmailAliases: NumberString;
	includedStorageCapacity: NumberString;
	erased: boolean;
	perUserStorageCapacity: NumberString;
	perUserAliasCount: NumberString;
	plan: NumberString;
	promotionId: null | string;
	confirmedHuman: boolean;
	adAttributionCampaignId: null | string;

	customer: Id;
	accountingInfo: Id;
	domainInfos: DomainInfo[];
	bookings: null | BookingsRef;
	takeoverCustomer: null | Id;
	giftCards: null | GiftCardsRef;
	terminationRequest: null | IdTuple;
	referredBy: null | Id;
	customPlan: null | PlanConfiguration;
	supportInfo: null | Id;
	managedByPartner: null | Id;
	partnerManagedCustomers: null | Id;
	revocationRequest: null | IdTuple;
}
export const SentGroupInvitationTypeRef: TypeRef<SentGroupInvitation> = new TypeRef("sys", 195)

export function createSentGroupInvitation(values: SentGroupInvitationParams): SentGroupInvitation {
    return Object.assign(create(typeModels[SentGroupInvitationTypeRef.typeId], SentGroupInvitationTypeRef), values)
}

export type SentGroupInvitationParams = {


	inviteeMailAddress: string;
	capability: NumberString;

	sharedGroup: Id;
	receivedInvitation: null | IdTuple;
}

export type SentGroupInvitation = {
	_type: TypeRef<SentGroupInvitation>;
	_original?: SentGroupInvitation

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	inviteeMailAddress: string;
	capability: NumberString;

	sharedGroup: Id;
	receivedInvitation: null | IdTuple;
}
export const MailAddressToGroupTypeRef: TypeRef<MailAddressToGroup> = new TypeRef("sys", 204)

export function createMailAddressToGroup(values: MailAddressToGroupParams): MailAddressToGroup {
    return Object.assign(create(typeModels[MailAddressToGroupTypeRef.typeId], MailAddressToGroupTypeRef), values)
}

export type MailAddressToGroupParams = {



	internalGroup: null | Id;
}

export type MailAddressToGroup = {
	_type: TypeRef<MailAddressToGroup>;
	_original?: MailAddressToGroup

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	internalGroup: null | Id;
}
export const GroupMemberTypeRef: TypeRef<GroupMember> = new TypeRef("sys", 216)

export function createGroupMember(values: GroupMemberParams): GroupMember {
    return Object.assign(create(typeModels[GroupMemberTypeRef.typeId], GroupMemberTypeRef), values)
}

export type GroupMemberParams = {


	capability: null | NumberString;

	userGroupInfo: IdTuple;
	group: Id;
	user: Id;
}

export type GroupMember = {
	_type: TypeRef<GroupMember>;
	_original?: GroupMember

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	capability: null | NumberString;

	userGroupInfo: IdTuple;
	group: Id;
	user: Id;
}
export const RootInstanceTypeRef: TypeRef<RootInstance> = new TypeRef("sys", 231)

export function createRootInstance(values: RootInstanceParams): RootInstance {
    return Object.assign(create(typeModels[RootInstanceTypeRef.typeId], RootInstanceTypeRef), values)
}

export type RootInstanceParams = {


	reference: Id;
}

export type RootInstance = {
	_type: TypeRef<RootInstance>;
	_original?: RootInstance

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	reference: Id;
	_ownerGroup: null | Id;
}
export const VersionInfoTypeRef: TypeRef<VersionInfo> = new TypeRef("sys", 237)

export function createVersionInfo(values: VersionInfoParams): VersionInfo {
    return Object.assign(create(typeModels[VersionInfoTypeRef.typeId], VersionInfoTypeRef), values)
}

export type VersionInfoParams = {


	app: string;
	type: NumberString;
	referenceList: null | Id;
	timestamp: Date;
	operation: string;
	versionData: null | Uint8Array;

	author: Id;
	authorGroupInfo: IdTuple;
}

export type VersionInfo = {
	_type: TypeRef<VersionInfo>;
	_original?: VersionInfo

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	app: string;
	type: NumberString;
	referenceList: null | Id;
	timestamp: Date;
	operation: string;
	versionData: null | Uint8Array;
	_ownerGroup: null | Id;

	author: Id;
	authorGroupInfo: IdTuple;
}
export const SystemKeysReturnTypeRef: TypeRef<SystemKeysReturn> = new TypeRef("sys", 301)

export function createSystemKeysReturn(values: SystemKeysReturnParams): SystemKeysReturn {
    return Object.assign(create(typeModels[SystemKeysReturnTypeRef.typeId], SystemKeysReturnTypeRef), values)
}

export type SystemKeysReturnParams = {


	systemAdminPubRsaKey: null | Uint8Array;
	systemAdminPubKeyVersion: NumberString;
	freeGroupKey: Uint8Array;
	premiumGroupKey: Uint8Array;
	systemAdminPubEccKey: null | Uint8Array;
	systemAdminPubKyberKey: null | Uint8Array;
	freeGroupKeyVersion: NumberString;
	premiumGroupKeyVersion: NumberString;

	freeGroup: null | Id;
	premiumGroup: null | Id;
}

export type SystemKeysReturn = {
	_type: TypeRef<SystemKeysReturn>;
	_original?: SystemKeysReturn

	_format: NumberString;
	systemAdminPubRsaKey: null | Uint8Array;
	systemAdminPubKeyVersion: NumberString;
	freeGroupKey: Uint8Array;
	premiumGroupKey: Uint8Array;
	systemAdminPubEccKey: null | Uint8Array;
	systemAdminPubKyberKey: null | Uint8Array;
	freeGroupKeyVersion: NumberString;
	premiumGroupKeyVersion: NumberString;

	freeGroup: null | Id;
	premiumGroup: null | Id;
}
export const RegistrationServiceDataTypeRef: TypeRef<RegistrationServiceData> = new TypeRef("sys", 316)

export function createRegistrationServiceData(values: RegistrationServiceDataParams): RegistrationServiceData {
    return Object.assign(create(typeModels[RegistrationServiceDataTypeRef.typeId], RegistrationServiceDataTypeRef), values)
}

export type RegistrationServiceDataParams = {


	state: NumberString;
	source: null | string;
}

export type RegistrationServiceData = {
	_type: TypeRef<RegistrationServiceData>;
	_original?: RegistrationServiceData

	_format: NumberString;
	state: NumberString;
	source: null | string;
}
export const RegistrationReturnTypeRef: TypeRef<RegistrationReturn> = new TypeRef("sys", 326)

export function createRegistrationReturn(values: RegistrationReturnParams): RegistrationReturn {
    return Object.assign(create(typeModels[RegistrationReturnTypeRef.typeId], RegistrationReturnTypeRef), values)
}

export type RegistrationReturnParams = {


	authToken: string;
}

export type RegistrationReturn = {
	_type: TypeRef<RegistrationReturn>;
	_original?: RegistrationReturn

	_format: NumberString;
	authToken: string;
}
export const SendRegistrationCodeDataTypeRef: TypeRef<SendRegistrationCodeData> = new TypeRef("sys", 341)

export function createSendRegistrationCodeData(values: SendRegistrationCodeDataParams): SendRegistrationCodeData {
    return Object.assign(create(typeModels[SendRegistrationCodeDataTypeRef.typeId], SendRegistrationCodeDataTypeRef), values)
}

export type SendRegistrationCodeDataParams = {


	authToken: string;
	language: string;
	accountType: NumberString;
	mobilePhoneNumber: string;
}

export type SendRegistrationCodeData = {
	_type: TypeRef<SendRegistrationCodeData>;
	_original?: SendRegistrationCodeData

	_format: NumberString;
	authToken: string;
	language: string;
	accountType: NumberString;
	mobilePhoneNumber: string;
}
export const SendRegistrationCodeReturnTypeRef: TypeRef<SendRegistrationCodeReturn> = new TypeRef("sys", 347)

export function createSendRegistrationCodeReturn(values: SendRegistrationCodeReturnParams): SendRegistrationCodeReturn {
    return Object.assign(create(typeModels[SendRegistrationCodeReturnTypeRef.typeId], SendRegistrationCodeReturnTypeRef), values)
}

export type SendRegistrationCodeReturnParams = {


	authToken: string;
}

export type SendRegistrationCodeReturn = {
	_type: TypeRef<SendRegistrationCodeReturn>;
	_original?: SendRegistrationCodeReturn

	_format: NumberString;
	authToken: string;
}
export const VerifyRegistrationCodeDataTypeRef: TypeRef<VerifyRegistrationCodeData> = new TypeRef("sys", 351)

export function createVerifyRegistrationCodeData(values: VerifyRegistrationCodeDataParams): VerifyRegistrationCodeData {
    return Object.assign(create(typeModels[VerifyRegistrationCodeDataTypeRef.typeId], VerifyRegistrationCodeDataTypeRef), values)
}

export type VerifyRegistrationCodeDataParams = {


	authToken: string;
	code: string;
}

export type VerifyRegistrationCodeData = {
	_type: TypeRef<VerifyRegistrationCodeData>;
	_original?: VerifyRegistrationCodeData

	_format: NumberString;
	authToken: string;
	code: string;
}
export const UserDataDeleteTypeRef: TypeRef<UserDataDelete> = new TypeRef("sys", 404)

export function createUserDataDelete(values: UserDataDeleteParams): UserDataDelete {
    return Object.assign(create(typeModels[UserDataDeleteTypeRef.typeId], UserDataDeleteTypeRef), values)
}

export type UserDataDeleteParams = {


	restore: boolean;
	date: null | Date;

	user: Id;
}

export type UserDataDelete = {
	_type: TypeRef<UserDataDelete>;
	_original?: UserDataDelete

	_format: NumberString;
	restore: boolean;
	date: null | Date;

	user: Id;
}
export const PublicKeyGetInTypeRef: TypeRef<PublicKeyGetIn> = new TypeRef("sys", 409)

export function createPublicKeyGetIn(values: PublicKeyGetInParams): PublicKeyGetIn {
    return Object.assign(create(typeModels[PublicKeyGetInTypeRef.typeId], PublicKeyGetInTypeRef), values)
}

export type PublicKeyGetInParams = {


	identifier: string;
	version: null | NumberString;
	identifierType: NumberString;
}

export type PublicKeyGetIn = {
	_type: TypeRef<PublicKeyGetIn>;
	_original?: PublicKeyGetIn

	_format: NumberString;
	identifier: string;
	version: null | NumberString;
	identifierType: NumberString;
}
export const PublicKeyGetOutTypeRef: TypeRef<PublicKeyGetOut> = new TypeRef("sys", 412)

export function createPublicKeyGetOut(values: PublicKeyGetOutParams): PublicKeyGetOut {
    return Object.assign(create(typeModels[PublicKeyGetOutTypeRef.typeId], PublicKeyGetOutTypeRef), values)
}

export type PublicKeyGetOutParams = {


	pubRsaKey: null | Uint8Array;
	pubKeyVersion: NumberString;
	pubEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;

	signature: null | PublicKeySignature;
}

export type PublicKeyGetOut = {
	_type: TypeRef<PublicKeyGetOut>;
	_original?: PublicKeyGetOut

	_format: NumberString;
	pubRsaKey: null | Uint8Array;
	pubKeyVersion: NumberString;
	pubEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;

	signature: null | PublicKeySignature;
}
export const SaltDataTypeRef: TypeRef<SaltData> = new TypeRef("sys", 417)

export function createSaltData(values: SaltDataParams): SaltData {
    return Object.assign(create(typeModels[SaltDataTypeRef.typeId], SaltDataTypeRef), values)
}

export type SaltDataParams = {


	mailAddress: string;
}

export type SaltData = {
	_type: TypeRef<SaltData>;
	_original?: SaltData

	_format: NumberString;
	mailAddress: string;
}
export const SaltReturnTypeRef: TypeRef<SaltReturn> = new TypeRef("sys", 420)

export function createSaltReturn(values: SaltReturnParams): SaltReturn {
    return Object.assign(create(typeModels[SaltReturnTypeRef.typeId], SaltReturnTypeRef), values)
}

export type SaltReturnParams = {


	salt: Uint8Array;
	kdfVersion: NumberString;
}

export type SaltReturn = {
	_type: TypeRef<SaltReturn>;
	_original?: SaltReturn

	_format: NumberString;
	salt: Uint8Array;
	kdfVersion: NumberString;
}
export const AutoLoginDataGetTypeRef: TypeRef<AutoLoginDataGet> = new TypeRef("sys", 431)

export function createAutoLoginDataGet(values: AutoLoginDataGetParams): AutoLoginDataGet {
    return Object.assign(create(typeModels[AutoLoginDataGetTypeRef.typeId], AutoLoginDataGetTypeRef), values)
}

export type AutoLoginDataGetParams = {


	deviceToken: string;

	userId: Id;
}

export type AutoLoginDataGet = {
	_type: TypeRef<AutoLoginDataGet>;
	_original?: AutoLoginDataGet

	_format: NumberString;
	deviceToken: string;

	userId: Id;
}
export const AutoLoginDataDeleteTypeRef: TypeRef<AutoLoginDataDelete> = new TypeRef("sys", 435)

export function createAutoLoginDataDelete(values: AutoLoginDataDeleteParams): AutoLoginDataDelete {
    return Object.assign(create(typeModels[AutoLoginDataDeleteTypeRef.typeId], AutoLoginDataDeleteTypeRef), values)
}

export type AutoLoginDataDeleteParams = {


	deviceToken: string;
}

export type AutoLoginDataDelete = {
	_type: TypeRef<AutoLoginDataDelete>;
	_original?: AutoLoginDataDelete

	_format: NumberString;
	deviceToken: string;
}
export const AutoLoginDataReturnTypeRef: TypeRef<AutoLoginDataReturn> = new TypeRef("sys", 438)

export function createAutoLoginDataReturn(values: AutoLoginDataReturnParams): AutoLoginDataReturn {
    return Object.assign(create(typeModels[AutoLoginDataReturnTypeRef.typeId], AutoLoginDataReturnTypeRef), values)
}

export type AutoLoginDataReturnParams = {


	deviceKey: Uint8Array;
}

export type AutoLoginDataReturn = {
	_type: TypeRef<AutoLoginDataReturn>;
	_original?: AutoLoginDataReturn

	_format: NumberString;
	deviceKey: Uint8Array;
}
export const AutoLoginPostReturnTypeRef: TypeRef<AutoLoginPostReturn> = new TypeRef("sys", 441)

export function createAutoLoginPostReturn(values: AutoLoginPostReturnParams): AutoLoginPostReturn {
    return Object.assign(create(typeModels[AutoLoginPostReturnTypeRef.typeId], AutoLoginPostReturnTypeRef), values)
}

export type AutoLoginPostReturnParams = {


	deviceToken: string;
}

export type AutoLoginPostReturn = {
	_type: TypeRef<AutoLoginPostReturn>;
	_original?: AutoLoginPostReturn

	_format: NumberString;
	deviceToken: string;
}
export const UpdatePermissionKeyDataTypeRef: TypeRef<UpdatePermissionKeyData> = new TypeRef("sys", 445)

export function createUpdatePermissionKeyData(values: UpdatePermissionKeyDataParams): UpdatePermissionKeyData {
    return Object.assign(create(typeModels[UpdatePermissionKeyDataTypeRef.typeId], UpdatePermissionKeyDataTypeRef), values)
}

export type UpdatePermissionKeyDataParams = {



	permission: IdTuple;
	bucketPermission: IdTuple;
}

export type UpdatePermissionKeyData = {
	_type: TypeRef<UpdatePermissionKeyData>;
	_original?: UpdatePermissionKeyData

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	permission: IdTuple;
	bucketPermission: IdTuple;
}
export const EntityUpdateTypeRef: TypeRef<EntityUpdate> = new TypeRef("sys", 462)

export function createEntityUpdate(values: EntityUpdateParams): EntityUpdate {
    return Object.assign(create(typeModels[EntityUpdateTypeRef.typeId], EntityUpdateTypeRef), values)
}

export type EntityUpdateParams = {


	application: string;
	instanceListId: string;
	instanceId: string;
	operation: NumberString;
	typeId: NumberString;
	instance: null | string;
	blobInstance: null | string;

	patch: null | PatchList;
}

export type EntityUpdate = {
	_type: TypeRef<EntityUpdate>;
	_original?: EntityUpdate

	_id: Id;
	application: string;
	instanceListId: string;
	instanceId: string;
	operation: NumberString;
	typeId: NumberString;
	instance: null | string;
	blobInstance: null | string;

	patch: null | PatchList;
}
export const VersionTypeRef: TypeRef<Version> = new TypeRef("sys", 480)

export function createVersion(values: VersionParams): Version {
    return Object.assign(create(typeModels[VersionTypeRef.typeId], VersionTypeRef), values)
}

export type VersionParams = {


	version: Id;
	timestamp: Date;
	operation: string;

	author: Id;
	authorGroupInfo: IdTuple;
}

export type Version = {
	_type: TypeRef<Version>;
	_original?: Version

	_id: Id;
	version: Id;
	timestamp: Date;
	operation: string;

	author: Id;
	authorGroupInfo: IdTuple;
}
export const VersionDataTypeRef: TypeRef<VersionData> = new TypeRef("sys", 487)

export function createVersionData(values: VersionDataParams): VersionData {
    return Object.assign(create(typeModels[VersionDataTypeRef.typeId], VersionDataTypeRef), values)
}

export type VersionDataParams = {


	application: string;
	typeId: NumberString;
	id: Id;
	listId: null | Id;
}

export type VersionData = {
	_type: TypeRef<VersionData>;
	_original?: VersionData

	_format: NumberString;
	application: string;
	typeId: NumberString;
	id: Id;
	listId: null | Id;
}
export const VersionReturnTypeRef: TypeRef<VersionReturn> = new TypeRef("sys", 493)

export function createVersionReturn(values: VersionReturnParams): VersionReturn {
    return Object.assign(create(typeModels[VersionReturnTypeRef.typeId], VersionReturnTypeRef), values)
}

export type VersionReturnParams = {



	versions: Version[];
}

export type VersionReturn = {
	_type: TypeRef<VersionReturn>;
	_original?: VersionReturn

	_format: NumberString;

	versions: Version[];
}
export const MembershipAddDataTypeRef: TypeRef<MembershipAddData> = new TypeRef("sys", 505)

export function createMembershipAddData(values: MembershipAddDataParams): MembershipAddData {
    return Object.assign(create(typeModels[MembershipAddDataTypeRef.typeId], MembershipAddDataTypeRef), values)
}

export type MembershipAddDataParams = {


	symEncGKey: Uint8Array;
	symKeyVersion: NumberString;
	groupKeyVersion: NumberString;

	user: Id;
	group: Id;
}

export type MembershipAddData = {
	_type: TypeRef<MembershipAddData>;
	_original?: MembershipAddData

	_format: NumberString;
	symEncGKey: Uint8Array;
	symKeyVersion: NumberString;
	groupKeyVersion: NumberString;

	user: Id;
	group: Id;
}
export const ChangePasswordPostInTypeRef: TypeRef<ChangePasswordPostIn> = new TypeRef("sys", 534)

export function createChangePasswordPostIn(values: ChangePasswordPostInParams): ChangePasswordPostIn {
    return Object.assign(create(typeModels[ChangePasswordPostInTypeRef.typeId], ChangePasswordPostInTypeRef), values)
}

export type ChangePasswordPostInParams = {


	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	code: null | string;
	oldVerifier: null | Uint8Array;
	recoverCodeVerifier: null | Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
}

export type ChangePasswordPostIn = {
	_type: TypeRef<ChangePasswordPostIn>;
	_original?: ChangePasswordPostIn

	_format: NumberString;
	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	code: null | string;
	oldVerifier: null | Uint8Array;
	recoverCodeVerifier: null | Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
}
export const SecondFactorAuthDataTypeRef: TypeRef<SecondFactorAuthData> = new TypeRef("sys", 541)

export function createSecondFactorAuthData(values: SecondFactorAuthDataParams): SecondFactorAuthData {
    return Object.assign(create(typeModels[SecondFactorAuthDataTypeRef.typeId], SecondFactorAuthDataTypeRef), values)
}

export type SecondFactorAuthDataParams = {


	type: null | NumberString;
	otpCode: null | NumberString;

	u2f: null | U2fResponseData;
	session: null | IdTuple;
	webauthn: null | WebauthnResponseData;
}

export type SecondFactorAuthData = {
	_type: TypeRef<SecondFactorAuthData>;
	_original?: SecondFactorAuthData

	_format: NumberString;
	type: null | NumberString;
	otpCode: null | NumberString;

	u2f: null | U2fResponseData;
	session: null | IdTuple;
	webauthn: null | WebauthnResponseData;
}
export const SecondFactorAuthAllowedReturnTypeRef: TypeRef<SecondFactorAuthAllowedReturn> = new TypeRef("sys", 546)

export function createSecondFactorAuthAllowedReturn(values: SecondFactorAuthAllowedReturnParams): SecondFactorAuthAllowedReturn {
    return Object.assign(create(typeModels[SecondFactorAuthAllowedReturnTypeRef.typeId], SecondFactorAuthAllowedReturnTypeRef), values)
}

export type SecondFactorAuthAllowedReturnParams = {


	allowed: boolean;
}

export type SecondFactorAuthAllowedReturn = {
	_type: TypeRef<SecondFactorAuthAllowedReturn>;
	_original?: SecondFactorAuthAllowedReturn

	_format: NumberString;
	allowed: boolean;
}
export const ResetPasswordPostInTypeRef: TypeRef<ResetPasswordPostIn> = new TypeRef("sys", 584)

export function createResetPasswordPostIn(values: ResetPasswordPostInParams): ResetPasswordPostIn {
    return Object.assign(create(typeModels[ResetPasswordPostInTypeRef.typeId], ResetPasswordPostInTypeRef), values)
}

export type ResetPasswordPostInParams = {


	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;

	user: Id;
}

export type ResetPasswordPostIn = {
	_type: TypeRef<ResetPasswordPostIn>;
	_original?: ResetPasswordPostIn

	_format: NumberString;
	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;

	user: Id;
}
export const DomainMailAddressAvailabilityDataTypeRef: TypeRef<DomainMailAddressAvailabilityData> = new TypeRef("sys", 599)

export function createDomainMailAddressAvailabilityData(values: DomainMailAddressAvailabilityDataParams): DomainMailAddressAvailabilityData {
    return Object.assign(create(typeModels[DomainMailAddressAvailabilityDataTypeRef.typeId], DomainMailAddressAvailabilityDataTypeRef), values)
}

export type DomainMailAddressAvailabilityDataParams = {


	mailAddress: string;
}

export type DomainMailAddressAvailabilityData = {
	_type: TypeRef<DomainMailAddressAvailabilityData>;
	_original?: DomainMailAddressAvailabilityData

	_format: NumberString;
	mailAddress: string;
}
export const DomainMailAddressAvailabilityReturnTypeRef: TypeRef<DomainMailAddressAvailabilityReturn> = new TypeRef("sys", 602)

export function createDomainMailAddressAvailabilityReturn(values: DomainMailAddressAvailabilityReturnParams): DomainMailAddressAvailabilityReturn {
    return Object.assign(create(typeModels[DomainMailAddressAvailabilityReturnTypeRef.typeId], DomainMailAddressAvailabilityReturnTypeRef), values)
}

export type DomainMailAddressAvailabilityReturnParams = {


	available: boolean;
}

export type DomainMailAddressAvailabilityReturn = {
	_type: TypeRef<DomainMailAddressAvailabilityReturn>;
	_original?: DomainMailAddressAvailabilityReturn

	_format: NumberString;
	available: boolean;
}
export const PushIdentifierTypeRef: TypeRef<PushIdentifier> = new TypeRef("sys", 625)

export function createPushIdentifier(values: PushIdentifierParams): PushIdentifier {
    return Object.assign(create(typeModels[PushIdentifierTypeRef.typeId], PushIdentifierTypeRef), values)
}

export type PushIdentifierParams = {


	pushServiceType: NumberString;
	identifier: string;
	language: string;
	lastNotificationDate: null | Date;
	disabled: boolean;
	displayName: string;
	lastUsageTime: Date;
	app: NumberString;
}

export type PushIdentifier = {
	_type: TypeRef<PushIdentifier>;
	_errors: Object;
	_original?: PushIdentifier

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_owner: Id;
	_area: NumberString;
	pushServiceType: NumberString;
	identifier: string;
	language: string;
	_ownerGroup: null | Id;
	lastNotificationDate: null | Date;
	disabled: boolean;
	_ownerEncSessionKey: null | Uint8Array;
	displayName: string;
	lastUsageTime: Date;
	_ownerKeyVersion: null | NumberString;
	app: NumberString;
	_kdfNonce: null | Uint8Array;
}
export const PushIdentifierListTypeRef: TypeRef<PushIdentifierList> = new TypeRef("sys", 635)

export function createPushIdentifierList(values: PushIdentifierListParams): PushIdentifierList {
    return Object.assign(create(typeModels[PushIdentifierListTypeRef.typeId], PushIdentifierListTypeRef), values)
}

export type PushIdentifierListParams = {



	list: Id;
}

export type PushIdentifierList = {
	_type: TypeRef<PushIdentifierList>;
	_original?: PushIdentifierList

	_id: Id;

	list: Id;
}
export const DeleteCustomerDataTypeRef: TypeRef<DeleteCustomerData> = new TypeRef("sys", 641)

export function createDeleteCustomerData(values: DeleteCustomerDataParams): DeleteCustomerData {
    return Object.assign(create(typeModels[DeleteCustomerDataTypeRef.typeId], DeleteCustomerDataTypeRef), values)
}

export type DeleteCustomerDataParams = {


	undelete: boolean;
	formattedReason: null | string;
	takeoverMailAddress: null | string;
	authVerifier: null | Uint8Array;
	reason: null | NumberString;

	customer: Id;
	surveyData: null | SurveyData;
	abuseDeactivationInfos: AbuseInfo[];
}

export type DeleteCustomerData = {
	_type: TypeRef<DeleteCustomerData>;
	_original?: DeleteCustomerData

	_format: NumberString;
	undelete: boolean;
	formattedReason: null | string;
	takeoverMailAddress: null | string;
	authVerifier: null | Uint8Array;
	reason: null | NumberString;

	customer: Id;
	surveyData: null | SurveyData;
	abuseDeactivationInfos: AbuseInfo[];
}
export const CustomerPropertiesTypeRef: TypeRef<CustomerProperties> = new TypeRef("sys", 656)

export function createCustomerProperties(values: CustomerPropertiesParams): CustomerProperties {
    return Object.assign(create(typeModels[CustomerPropertiesTypeRef.typeId], CustomerPropertiesTypeRef), values)
}

export type CustomerPropertiesParams = {


	externalUserWelcomeMessage: string;
	lastUpgradeReminder: null | Date;
	usageDataOptedOut: boolean;
	requireTwoFactor: boolean;

	smallLogo: null | File;
	bigLogo: null | File;
	notificationMailTemplates: NotificationMailTemplate[];
}

export type CustomerProperties = {
	_type: TypeRef<CustomerProperties>;
	_original?: CustomerProperties

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	externalUserWelcomeMessage: string;
	lastUpgradeReminder: null | Date;
	_ownerGroup: null | Id;
	usageDataOptedOut: boolean;
	requireTwoFactor: boolean;

	smallLogo: null | File;
	bigLogo: null | File;
	notificationMailTemplates: NotificationMailTemplate[];
}
export const ExternalPropertiesReturnTypeRef: TypeRef<ExternalPropertiesReturn> = new TypeRef("sys", 663)

export function createExternalPropertiesReturn(values: ExternalPropertiesReturnParams): ExternalPropertiesReturn {
    return Object.assign(create(typeModels[ExternalPropertiesReturnTypeRef.typeId], ExternalPropertiesReturnTypeRef), values)
}

export type ExternalPropertiesReturnParams = {


	message: string;
	accountType: NumberString;

	smallLogo: null | File;
	bigLogo: null | File;
}

export type ExternalPropertiesReturn = {
	_type: TypeRef<ExternalPropertiesReturn>;
	_original?: ExternalPropertiesReturn

	_format: NumberString;
	message: string;
	accountType: NumberString;

	smallLogo: null | File;
	bigLogo: null | File;
}
export const RegistrationCaptchaServiceDataTypeRef: TypeRef<RegistrationCaptchaServiceData> = new TypeRef("sys", 674)

export function createRegistrationCaptchaServiceData(values: RegistrationCaptchaServiceDataParams): RegistrationCaptchaServiceData {
    return Object.assign(create(typeModels[RegistrationCaptchaServiceDataTypeRef.typeId], RegistrationCaptchaServiceDataTypeRef), values)
}

export type RegistrationCaptchaServiceDataParams = {


	token: string;
	visualChallengeResponse: null | string;
	audioChallengeResponse: null | string;
}

export type RegistrationCaptchaServiceData = {
	_type: TypeRef<RegistrationCaptchaServiceData>;
	_original?: RegistrationCaptchaServiceData

	_format: NumberString;
	token: string;
	visualChallengeResponse: null | string;
	audioChallengeResponse: null | string;
}
export const RegistrationCaptchaServiceReturnTypeRef: TypeRef<RegistrationCaptchaServiceReturn> = new TypeRef("sys", 678)

export function createRegistrationCaptchaServiceReturn(values: RegistrationCaptchaServiceReturnParams): RegistrationCaptchaServiceReturn {
    return Object.assign(create(typeModels[RegistrationCaptchaServiceReturnTypeRef.typeId], RegistrationCaptchaServiceReturnTypeRef), values)
}

export type RegistrationCaptchaServiceReturnParams = {


	token: string;
	challenge: null | Uint8Array;

	visualChallenge: null | CaptchaChallenge;
	audioChallenge: null | CaptchaChallenge;
}

export type RegistrationCaptchaServiceReturn = {
	_type: TypeRef<RegistrationCaptchaServiceReturn>;
	_original?: RegistrationCaptchaServiceReturn

	_format: NumberString;
	token: string;
	challenge: null | Uint8Array;

	visualChallenge: null | CaptchaChallenge;
	audioChallenge: null | CaptchaChallenge;
}
export const MailAddressAliasTypeRef: TypeRef<MailAddressAlias> = new TypeRef("sys", 684)

export function createMailAddressAlias(values: MailAddressAliasParams): MailAddressAlias {
    return Object.assign(create(typeModels[MailAddressAliasTypeRef.typeId], MailAddressAliasTypeRef), values)
}

export type MailAddressAliasParams = {


	mailAddress: string;
	enabled: boolean;
}

export type MailAddressAlias = {
	_type: TypeRef<MailAddressAlias>;
	_original?: MailAddressAlias

	_id: Id;
	mailAddress: string;
	enabled: boolean;
}
export const MailAddressAliasServiceDataTypeRef: TypeRef<MailAddressAliasServiceData> = new TypeRef("sys", 688)

export function createMailAddressAliasServiceData(values: MailAddressAliasServiceDataParams): MailAddressAliasServiceData {
    return Object.assign(create(typeModels[MailAddressAliasServiceDataTypeRef.typeId], MailAddressAliasServiceDataTypeRef), values)
}

export type MailAddressAliasServiceDataParams = {


	mailAddress: string;

	group: Id;
}

export type MailAddressAliasServiceData = {
	_type: TypeRef<MailAddressAliasServiceData>;
	_original?: MailAddressAliasServiceData

	_format: NumberString;
	mailAddress: string;

	group: Id;
}
export const MailAddressAliasServiceReturnTypeRef: TypeRef<MailAddressAliasServiceReturn> = new TypeRef("sys", 692)

export function createMailAddressAliasServiceReturn(values: MailAddressAliasServiceReturnParams): MailAddressAliasServiceReturn {
    return Object.assign(create(typeModels[MailAddressAliasServiceReturnTypeRef.typeId], MailAddressAliasServiceReturnTypeRef), values)
}

export type MailAddressAliasServiceReturnParams = {


	nbrOfFreeAliases: NumberString;
	totalAliases: NumberString;
	usedAliases: NumberString;
	enabledAliases: NumberString;
}

export type MailAddressAliasServiceReturn = {
	_type: TypeRef<MailAddressAliasServiceReturn>;
	_original?: MailAddressAliasServiceReturn

	_format: NumberString;
	nbrOfFreeAliases: NumberString;
	totalAliases: NumberString;
	usedAliases: NumberString;
	enabledAliases: NumberString;
}
export const DomainInfoTypeRef: TypeRef<DomainInfo> = new TypeRef("sys", 696)

export function createDomainInfo(values: DomainInfoParams): DomainInfo {
    return Object.assign(create(typeModels[DomainInfoTypeRef.typeId], DomainInfoTypeRef), values)
}

export type DomainInfoParams = {


	domain: string;

	catchAllMailGroup: null | Id;
	whitelabelConfig: null | Id;
}

export type DomainInfo = {
	_type: TypeRef<DomainInfo>;
	_original?: DomainInfo

	_id: Id;
	domain: string;

	catchAllMailGroup: null | Id;
	whitelabelConfig: null | Id;
}
export const BookingItemTypeRef: TypeRef<BookingItem> = new TypeRef("sys", 700)

export function createBookingItem(values: BookingItemParams): BookingItem {
    return Object.assign(create(typeModels[BookingItemTypeRef.typeId], BookingItemTypeRef), values)
}

export type BookingItemParams = {


	featureType: NumberString;
	currentCount: NumberString;
	maxCount: NumberString;
	totalInvoicedCount: NumberString;
	currentInvoicedCount: NumberString;
	price: NumberString;
	priceType: NumberString;
}

export type BookingItem = {
	_type: TypeRef<BookingItem>;
	_original?: BookingItem

	_id: Id;
	featureType: NumberString;
	currentCount: NumberString;
	maxCount: NumberString;
	totalInvoicedCount: NumberString;
	currentInvoicedCount: NumberString;
	price: NumberString;
	priceType: NumberString;
}
export const BookingTypeRef: TypeRef<Booking> = new TypeRef("sys", 709)

export function createBooking(values: BookingParams): Booking {
    return Object.assign(create(typeModels[BookingTypeRef.typeId], BookingTypeRef), values)
}

export type BookingParams = {


	createDate: Date;
	paymentMonths: NumberString;
	endDate: null | Date;
	paymentInterval: NumberString;
	bonusMonth: NumberString;
	renewalEnabled: boolean;

	items: BookingItem[];
	subscriptionReference: SubscriptionReference;
}

export type Booking = {
	_type: TypeRef<Booking>;
	_original?: Booking

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_owner: Id;
	_area: NumberString;
	createDate: Date;
	paymentMonths: NumberString;
	endDate: null | Date;
	paymentInterval: NumberString;
	_ownerGroup: null | Id;
	bonusMonth: NumberString;
	renewalEnabled: boolean;

	items: BookingItem[];
	subscriptionReference: SubscriptionReference;
}
export const BookingsRefTypeRef: TypeRef<BookingsRef> = new TypeRef("sys", 722)

export function createBookingsRef(values: BookingsRefParams): BookingsRef {
    return Object.assign(create(typeModels[BookingsRefTypeRef.typeId], BookingsRefTypeRef), values)
}

export type BookingsRefParams = {



	items: Id;
}

export type BookingsRef = {
	_type: TypeRef<BookingsRef>;
	_original?: BookingsRef

	_id: Id;

	items: Id;
}
export const StringWrapperTypeRef: TypeRef<StringWrapper> = new TypeRef("sys", 728)

export function createStringWrapper(values: StringWrapperParams): StringWrapper {
    return Object.assign(create(typeModels[StringWrapperTypeRef.typeId], StringWrapperTypeRef), values)
}

export type StringWrapperParams = {


	value: string;
}

export type StringWrapper = {
	_type: TypeRef<StringWrapper>;
	_original?: StringWrapper

	_id: Id;
	value: string;
}
export const CustomDomainReturnTypeRef: TypeRef<CustomDomainReturn> = new TypeRef("sys", 731)

export function createCustomDomainReturn(values: CustomDomainReturnParams): CustomDomainReturn {
    return Object.assign(create(typeModels[CustomDomainReturnTypeRef.typeId], CustomDomainReturnTypeRef), values)
}

export type CustomDomainReturnParams = {


	validationResult: NumberString;

	invalidDnsRecords: StringWrapper[];
}

export type CustomDomainReturn = {
	_type: TypeRef<CustomDomainReturn>;
	_original?: CustomDomainReturn

	_format: NumberString;
	validationResult: NumberString;

	invalidDnsRecords: StringWrapper[];
}
export const CustomDomainDataTypeRef: TypeRef<CustomDomainData> = new TypeRef("sys", 735)

export function createCustomDomainData(values: CustomDomainDataParams): CustomDomainData {
    return Object.assign(create(typeModels[CustomDomainDataTypeRef.typeId], CustomDomainDataTypeRef), values)
}

export type CustomDomainDataParams = {


	domain: string;

	catchAllMailGroup: null | Id;
}

export type CustomDomainData = {
	_type: TypeRef<CustomDomainData>;
	_original?: CustomDomainData

	_format: NumberString;
	domain: string;

	catchAllMailGroup: null | Id;
}
export const InvoiceInfoTypeRef: TypeRef<InvoiceInfo> = new TypeRef("sys", 752)

export function createInvoiceInfo(values: InvoiceInfoParams): InvoiceInfo {
    return Object.assign(create(typeModels[InvoiceInfoTypeRef.typeId], InvoiceInfoTypeRef), values)
}

export type InvoiceInfoParams = {


	specialPriceUserTotal: null | NumberString;
	specialPriceUserSingle: null | NumberString;
	publishInvoices: boolean;
	specialPriceBrandingPerUser: null | NumberString;
	specialPriceSharedGroupSingle: null | NumberString;
	specialPriceContactFormSingle: null | NumberString;
	specialPriceSharingPerUser: null | NumberString;
	reminderState: NumberString;
	extendedPeriodOfPaymentDays: NumberString;
	persistentPaymentPeriodExtension: boolean;
	specialPriceBusinessPerUser: null | NumberString;
	discountPercentage: null | NumberString;

	paymentErrorInfo: null | PaymentErrorInfo;
}

export type InvoiceInfo = {
	_type: TypeRef<InvoiceInfo>;
	_original?: InvoiceInfo

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	specialPriceUserTotal: null | NumberString;
	specialPriceUserSingle: null | NumberString;
	publishInvoices: boolean;
	_ownerGroup: null | Id;
	specialPriceBrandingPerUser: null | NumberString;
	specialPriceSharedGroupSingle: null | NumberString;
	specialPriceContactFormSingle: null | NumberString;
	specialPriceSharingPerUser: null | NumberString;
	reminderState: NumberString;
	extendedPeriodOfPaymentDays: NumberString;
	persistentPaymentPeriodExtension: boolean;
	specialPriceBusinessPerUser: null | NumberString;
	discountPercentage: null | NumberString;

	paymentErrorInfo: null | PaymentErrorInfo;
}
export const SwitchAccountTypePostInTypeRef: TypeRef<SwitchAccountTypePostIn> = new TypeRef("sys", 772)

export function createSwitchAccountTypePostIn(values: SwitchAccountTypePostInParams): SwitchAccountTypePostIn {
    return Object.assign(create(typeModels[SwitchAccountTypePostInTypeRef.typeId], SwitchAccountTypePostInTypeRef), values)
}

export type SwitchAccountTypePostInParams = {


	accountType: NumberString;
	date: null | Date;
	plan: NumberString;
	customer: null | Id;
	specialPriceUserSingle: null | NumberString;
	app: null | NumberString;

	referralCode: null | Id;
	surveyData: null | SurveyData;
}

export type SwitchAccountTypePostIn = {
	_type: TypeRef<SwitchAccountTypePostIn>;
	_original?: SwitchAccountTypePostIn

	_format: NumberString;
	accountType: NumberString;
	date: null | Date;
	plan: NumberString;
	customer: null | Id;
	specialPriceUserSingle: null | NumberString;
	app: null | NumberString;

	referralCode: null | Id;
	surveyData: null | SurveyData;
}
export const MailAddressAliasServiceDataDeleteTypeRef: TypeRef<MailAddressAliasServiceDataDelete> = new TypeRef("sys", 785)

export function createMailAddressAliasServiceDataDelete(values: MailAddressAliasServiceDataDeleteParams): MailAddressAliasServiceDataDelete {
    return Object.assign(create(typeModels[MailAddressAliasServiceDataDeleteTypeRef.typeId], MailAddressAliasServiceDataDeleteTypeRef), values)
}

export type MailAddressAliasServiceDataDeleteParams = {


	mailAddress: string;
	restore: boolean;

	group: Id;
}

export type MailAddressAliasServiceDataDelete = {
	_type: TypeRef<MailAddressAliasServiceDataDelete>;
	_original?: MailAddressAliasServiceDataDelete

	_format: NumberString;
	mailAddress: string;
	restore: boolean;

	group: Id;
}
export const PaymentDataServiceGetReturnTypeRef: TypeRef<PaymentDataServiceGetReturn> = new TypeRef("sys", 790)

export function createPaymentDataServiceGetReturn(values: PaymentDataServiceGetReturnParams): PaymentDataServiceGetReturn {
    return Object.assign(create(typeModels[PaymentDataServiceGetReturnTypeRef.typeId], PaymentDataServiceGetReturnTypeRef), values)
}

export type PaymentDataServiceGetReturnParams = {


	loginUrl: string;
}

export type PaymentDataServiceGetReturn = {
	_type: TypeRef<PaymentDataServiceGetReturn>;
	_original?: PaymentDataServiceGetReturn

	_format: NumberString;
	loginUrl: string;
}
export const PaymentDataServicePutDataTypeRef: TypeRef<PaymentDataServicePutData> = new TypeRef("sys", 793)

export function createPaymentDataServicePutData(values: PaymentDataServicePutDataParams): PaymentDataServicePutData {
    return Object.assign(create(typeModels[PaymentDataServicePutDataTypeRef.typeId], PaymentDataServicePutDataTypeRef), values)
}

export type PaymentDataServicePutDataParams = {


	invoiceName: string;
	invoiceAddress: string;
	invoiceCountry: null | string;
	invoiceVatIdNo: string;
	paymentMethod: NumberString;
	paymentMethodInfo: null | string;
	paymentInterval: NumberString;
	paymentToken: null | string;
	confirmedCountry: null | string;

	creditCard: null | CreditCard;
}

export type PaymentDataServicePutData = {
	_type: TypeRef<PaymentDataServicePutData>;
	_errors: Object;
	_original?: PaymentDataServicePutData

	_format: NumberString;
	invoiceName: string;
	invoiceAddress: string;
	invoiceCountry: null | string;
	invoiceVatIdNo: string;
	paymentMethod: NumberString;
	paymentMethodInfo: null | string;
	paymentInterval: NumberString;
	paymentToken: null | string;
	confirmedCountry: null | string;

	creditCard: null | CreditCard;
}
export const PaymentDataServicePutReturnTypeRef: TypeRef<PaymentDataServicePutReturn> = new TypeRef("sys", 805)

export function createPaymentDataServicePutReturn(values: PaymentDataServicePutReturnParams): PaymentDataServicePutReturn {
    return Object.assign(create(typeModels[PaymentDataServicePutReturnTypeRef.typeId], PaymentDataServicePutReturnTypeRef), values)
}

export type PaymentDataServicePutReturnParams = {


	result: NumberString;

	braintree3dsRequest: null | Braintree3ds2Request;
}

export type PaymentDataServicePutReturn = {
	_type: TypeRef<PaymentDataServicePutReturn>;
	_original?: PaymentDataServicePutReturn

	_format: NumberString;
	result: NumberString;

	braintree3dsRequest: null | Braintree3ds2Request;
}
export const PriceRequestDataTypeRef: TypeRef<PriceRequestData> = new TypeRef("sys", 836)

export function createPriceRequestData(values: PriceRequestDataParams): PriceRequestData {
    return Object.assign(create(typeModels[PriceRequestDataTypeRef.typeId], PriceRequestDataTypeRef), values)
}

export type PriceRequestDataParams = {


	featureType: NumberString;
	count: NumberString;
	business: null | boolean;
	paymentInterval: null | NumberString;
	accountType: null | NumberString;
	reactivate: boolean;
}

export type PriceRequestData = {
	_type: TypeRef<PriceRequestData>;
	_original?: PriceRequestData

	_id: Id;
	featureType: NumberString;
	count: NumberString;
	business: null | boolean;
	paymentInterval: null | NumberString;
	accountType: null | NumberString;
	reactivate: boolean;
}
export const PriceServiceDataTypeRef: TypeRef<PriceServiceData> = new TypeRef("sys", 843)

export function createPriceServiceData(values: PriceServiceDataParams): PriceServiceData {
    return Object.assign(create(typeModels[PriceServiceDataTypeRef.typeId], PriceServiceDataTypeRef), values)
}

export type PriceServiceDataParams = {


	date: null | Date;

	priceRequest: null | PriceRequestData;
}

export type PriceServiceData = {
	_type: TypeRef<PriceServiceData>;
	_original?: PriceServiceData

	_format: NumberString;
	date: null | Date;

	priceRequest: null | PriceRequestData;
}
export const PriceItemDataTypeRef: TypeRef<PriceItemData> = new TypeRef("sys", 847)

export function createPriceItemData(values: PriceItemDataParams): PriceItemData {
    return Object.assign(create(typeModels[PriceItemDataTypeRef.typeId], PriceItemDataTypeRef), values)
}

export type PriceItemDataParams = {


	featureType: NumberString;
	count: NumberString;
	price: NumberString;
	singleType: boolean;
}

export type PriceItemData = {
	_type: TypeRef<PriceItemData>;
	_original?: PriceItemData

	_id: Id;
	featureType: NumberString;
	count: NumberString;
	price: NumberString;
	singleType: boolean;
}
export const PriceDataTypeRef: TypeRef<PriceData> = new TypeRef("sys", 853)

export function createPriceData(values: PriceDataParams): PriceData {
    return Object.assign(create(typeModels[PriceDataTypeRef.typeId], PriceDataTypeRef), values)
}

export type PriceDataParams = {


	price: NumberString;
	taxIncluded: boolean;
	paymentInterval: NumberString;

	items: PriceItemData[];
}

export type PriceData = {
	_type: TypeRef<PriceData>;
	_original?: PriceData

	_id: Id;
	price: NumberString;
	taxIncluded: boolean;
	paymentInterval: NumberString;

	items: PriceItemData[];
}
export const PriceServiceReturnTypeRef: TypeRef<PriceServiceReturn> = new TypeRef("sys", 859)

export function createPriceServiceReturn(values: PriceServiceReturnParams): PriceServiceReturn {
    return Object.assign(create(typeModels[PriceServiceReturnTypeRef.typeId], PriceServiceReturnTypeRef), values)
}

export type PriceServiceReturnParams = {


	periodEndDate: Date;
	currentPeriodAddedPrice: null | NumberString;

	currentPriceThisPeriod: null | PriceData;
	currentPriceNextPeriod: null | PriceData;
	futurePriceNextPeriod: null | PriceData;
	futurePriceThisPeriod: null | PriceData;
}

export type PriceServiceReturn = {
	_type: TypeRef<PriceServiceReturn>;
	_original?: PriceServiceReturn

	_format: NumberString;
	periodEndDate: Date;
	currentPeriodAddedPrice: null | NumberString;

	currentPriceThisPeriod: null | PriceData;
	currentPriceNextPeriod: null | PriceData;
	futurePriceNextPeriod: null | PriceData;
	futurePriceThisPeriod: null | PriceData;
}
export const MembershipRemoveDataTypeRef: TypeRef<MembershipRemoveData> = new TypeRef("sys", 867)

export function createMembershipRemoveData(values: MembershipRemoveDataParams): MembershipRemoveData {
    return Object.assign(create(typeModels[MembershipRemoveDataTypeRef.typeId], MembershipRemoveDataTypeRef), values)
}

export type MembershipRemoveDataParams = {



	user: Id;
	group: Id;
}

export type MembershipRemoveData = {
	_type: TypeRef<MembershipRemoveData>;
	_original?: MembershipRemoveData

	_format: NumberString;

	user: Id;
	group: Id;
}
export const FileTypeRef: TypeRef<File> = new TypeRef("sys", 917)

export function createFile(values: FileParams): File {
    return Object.assign(create(typeModels[FileTypeRef.typeId], FileTypeRef), values)
}

export type FileParams = {


	name: string;
	mimeType: string;
	data: Uint8Array;
}

export type File = {
	_type: TypeRef<File>;
	_original?: File

	_id: Id;
	name: string;
	mimeType: string;
	data: Uint8Array;
}
export const EmailSenderListElementTypeRef: TypeRef<EmailSenderListElement> = new TypeRef("sys", 949)

export function createEmailSenderListElement(values: EmailSenderListElementParams): EmailSenderListElement {
    return Object.assign(create(typeModels[EmailSenderListElementTypeRef.typeId], EmailSenderListElementTypeRef), values)
}

export type EmailSenderListElementParams = {


	hashedValue: string;
	value: string;
	type: NumberString;
	field: NumberString;
}

export type EmailSenderListElement = {
	_type: TypeRef<EmailSenderListElement>;
	_original?: EmailSenderListElement

	_id: Id;
	hashedValue: string;
	value: string;
	type: NumberString;
	field: NumberString;
}
export const CustomerServerPropertiesTypeRef: TypeRef<CustomerServerProperties> = new TypeRef("sys", 954)

export function createCustomerServerProperties(values: CustomerServerPropertiesParams): CustomerServerProperties {
    return Object.assign(create(typeModels[CustomerServerPropertiesTypeRef.typeId], CustomerServerPropertiesTypeRef), values)
}

export type CustomerServerPropertiesParams = {


	requirePasswordUpdateAfterReset: boolean;
	saveEncryptedIpAddressInSession: boolean;

	emailSenderList: EmailSenderListElement[];
}

export type CustomerServerProperties = {
	_type: TypeRef<CustomerServerProperties>;
	_errors: Object;
	_original?: CustomerServerProperties

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	requirePasswordUpdateAfterReset: boolean;
	saveEncryptedIpAddressInSession: boolean;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	emailSenderList: EmailSenderListElement[];
}
export const CreateCustomerServerPropertiesDataTypeRef: TypeRef<CreateCustomerServerPropertiesData> = new TypeRef("sys", 961)

export function createCreateCustomerServerPropertiesData(values: CreateCustomerServerPropertiesDataParams): CreateCustomerServerPropertiesData {
    return Object.assign(create(typeModels[CreateCustomerServerPropertiesDataTypeRef.typeId], CreateCustomerServerPropertiesDataTypeRef), values)
}

export type CreateCustomerServerPropertiesDataParams = {


	adminGroupEncSessionKey: Uint8Array;
	adminGroupKeyVersion: NumberString;
}

export type CreateCustomerServerPropertiesData = {
	_type: TypeRef<CreateCustomerServerPropertiesData>;
	_original?: CreateCustomerServerPropertiesData

	_format: NumberString;
	adminGroupEncSessionKey: Uint8Array;
	adminGroupKeyVersion: NumberString;
}
export const CreateCustomerServerPropertiesReturnTypeRef: TypeRef<CreateCustomerServerPropertiesReturn> = new TypeRef("sys", 964)

export function createCreateCustomerServerPropertiesReturn(values: CreateCustomerServerPropertiesReturnParams): CreateCustomerServerPropertiesReturn {
    return Object.assign(create(typeModels[CreateCustomerServerPropertiesReturnTypeRef.typeId], CreateCustomerServerPropertiesReturnTypeRef), values)
}

export type CreateCustomerServerPropertiesReturnParams = {



	id: Id;
}

export type CreateCustomerServerPropertiesReturn = {
	_type: TypeRef<CreateCustomerServerPropertiesReturn>;
	_original?: CreateCustomerServerPropertiesReturn

	_format: NumberString;

	id: Id;
}
export const UserAreaGroupsTypeRef: TypeRef<UserAreaGroups> = new TypeRef("sys", 988)

export function createUserAreaGroups(values: UserAreaGroupsParams): UserAreaGroups {
    return Object.assign(create(typeModels[UserAreaGroupsTypeRef.typeId], UserAreaGroupsTypeRef), values)
}

export type UserAreaGroupsParams = {



	list: Id;
}

export type UserAreaGroups = {
	_type: TypeRef<UserAreaGroups>;
	_original?: UserAreaGroups

	_id: Id;

	list: Id;
}
export const DebitServicePutDataTypeRef: TypeRef<DebitServicePutData> = new TypeRef("sys", 1041)

export function createDebitServicePutData(values: DebitServicePutDataParams): DebitServicePutData {
    return Object.assign(create(typeModels[DebitServicePutDataTypeRef.typeId], DebitServicePutDataTypeRef), values)
}

export type DebitServicePutDataParams = {


}

export type DebitServicePutData = {
	_type: TypeRef<DebitServicePutData>;
	_original?: DebitServicePutData

	_format: NumberString;
}
export const EntityEventBatchTypeRef: TypeRef<EntityEventBatch> = new TypeRef("sys", 1079)

export function createEntityEventBatch(values: EntityEventBatchParams): EntityEventBatch {
    return Object.assign(create(typeModels[EntityEventBatchTypeRef.typeId], EntityEventBatchTypeRef), values)
}

export type EntityEventBatchParams = {



	events: EntityUpdate[];
}

export type EntityEventBatch = {
	_type: TypeRef<EntityEventBatch>;
	_original?: EntityEventBatch

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	events: EntityUpdate[];
}
export const AuditLogEntryTypeRef: TypeRef<AuditLogEntry> = new TypeRef("sys", 1101)

export function createAuditLogEntry(values: AuditLogEntryParams): AuditLogEntry {
    return Object.assign(create(typeModels[AuditLogEntryTypeRef.typeId], AuditLogEntryTypeRef), values)
}

export type AuditLogEntryParams = {


	actorMailAddress: string;
	actorIpAddress: null | string;
	action: string;
	modifiedEntity: string;
	date: Date;

	groupInfo: null | IdTuple;
	modifiedGroupInfo: null | IdTuple;
}

export type AuditLogEntry = {
	_type: TypeRef<AuditLogEntry>;
	_errors: Object;
	_original?: AuditLogEntry

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	actorMailAddress: string;
	actorIpAddress: null | string;
	action: string;
	modifiedEntity: string;
	date: Date;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	groupInfo: null | IdTuple;
	modifiedGroupInfo: null | IdTuple;
}
export const AuditLogRefTypeRef: TypeRef<AuditLogRef> = new TypeRef("sys", 1114)

export function createAuditLogRef(values: AuditLogRefParams): AuditLogRef {
    return Object.assign(create(typeModels[AuditLogRefTypeRef.typeId], AuditLogRefTypeRef), values)
}

export type AuditLogRefParams = {



	items: Id;
}

export type AuditLogRef = {
	_type: TypeRef<AuditLogRef>;
	_original?: AuditLogRef

	_id: Id;

	items: Id;
}
export const WhitelabelConfigTypeRef: TypeRef<WhitelabelConfig> = new TypeRef("sys", 1127)

export function createWhitelabelConfig(values: WhitelabelConfigParams): WhitelabelConfig {
    return Object.assign(create(typeModels[WhitelabelConfigTypeRef.typeId], WhitelabelConfigTypeRef), values)
}

export type WhitelabelConfigParams = {


	jsonTheme: string;
	metaTags: string;
	germanLanguageCode: null | string;
	imprintUrl: null | string;
	privacyStatementUrl: null | string;
	whitelabelCode: string;

	bootstrapCustomizations: BootstrapFeature[];
	whitelabelRegistrationDomains: StringWrapper[];
}

export type WhitelabelConfig = {
	_type: TypeRef<WhitelabelConfig>;
	_original?: WhitelabelConfig

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	jsonTheme: string;
	metaTags: string;
	germanLanguageCode: null | string;
	imprintUrl: null | string;
	privacyStatementUrl: null | string;
	whitelabelCode: string;

	bootstrapCustomizations: BootstrapFeature[];
	whitelabelRegistrationDomains: StringWrapper[];
}
export const BrandingDomainDataTypeRef: TypeRef<BrandingDomainData> = new TypeRef("sys", 1149)

export function createBrandingDomainData(values: BrandingDomainDataParams): BrandingDomainData {
    return Object.assign(create(typeModels[BrandingDomainDataTypeRef.typeId], BrandingDomainDataTypeRef), values)
}

export type BrandingDomainDataParams = {


	domain: string;
	sessionEncPemCertificateChain: null | Uint8Array;
	sessionEncPemPrivateKey: null | Uint8Array;
	systemAdminPubEncSessionKey: Uint8Array;
	systemAdminPublicProtocolVersion: NumberString;
	systemAdminPubKeyVersion: NumberString;
}

export type BrandingDomainData = {
	_type: TypeRef<BrandingDomainData>;
	_original?: BrandingDomainData

	_format: NumberString;
	domain: string;
	sessionEncPemCertificateChain: null | Uint8Array;
	sessionEncPemPrivateKey: null | Uint8Array;
	systemAdminPubEncSessionKey: Uint8Array;
	systemAdminPublicProtocolVersion: NumberString;
	systemAdminPubKeyVersion: NumberString;
}
export const BrandingDomainDeleteDataTypeRef: TypeRef<BrandingDomainDeleteData> = new TypeRef("sys", 1155)

export function createBrandingDomainDeleteData(values: BrandingDomainDeleteDataParams): BrandingDomainDeleteData {
    return Object.assign(create(typeModels[BrandingDomainDeleteDataTypeRef.typeId], BrandingDomainDeleteDataTypeRef), values)
}

export type BrandingDomainDeleteDataParams = {


	domain: string;
}

export type BrandingDomainDeleteData = {
	_type: TypeRef<BrandingDomainDeleteData>;
	_original?: BrandingDomainDeleteData

	_format: NumberString;
	domain: string;
}
export const U2fRegisteredDeviceTypeRef: TypeRef<U2fRegisteredDevice> = new TypeRef("sys", 1162)

export function createU2fRegisteredDevice(values: U2fRegisteredDeviceParams): U2fRegisteredDevice {
    return Object.assign(create(typeModels[U2fRegisteredDeviceTypeRef.typeId], U2fRegisteredDeviceTypeRef), values)
}

export type U2fRegisteredDeviceParams = {


	keyHandle: Uint8Array;
	appId: string;
	publicKey: Uint8Array;
	counter: NumberString;
	compromised: boolean;
}

export type U2fRegisteredDevice = {
	_type: TypeRef<U2fRegisteredDevice>;
	_original?: U2fRegisteredDevice

	_id: Id;
	keyHandle: Uint8Array;
	appId: string;
	publicKey: Uint8Array;
	counter: NumberString;
	compromised: boolean;
}
export const SecondFactorTypeRef: TypeRef<SecondFactor> = new TypeRef("sys", 1169)

export function createSecondFactor(values: SecondFactorParams): SecondFactor {
    return Object.assign(create(typeModels[SecondFactorTypeRef.typeId], SecondFactorTypeRef), values)
}

export type SecondFactorParams = {


	type: NumberString;
	name: string;
	otpSecret: null | Uint8Array;

	u2f: null | U2fRegisteredDevice;
}

export type SecondFactor = {
	_type: TypeRef<SecondFactor>;
	_original?: SecondFactor

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	type: NumberString;
	name: string;
	otpSecret: null | Uint8Array;

	u2f: null | U2fRegisteredDevice;
}
export const U2fKeyTypeRef: TypeRef<U2fKey> = new TypeRef("sys", 1178)

export function createU2fKey(values: U2fKeyParams): U2fKey {
    return Object.assign(create(typeModels[U2fKeyTypeRef.typeId], U2fKeyTypeRef), values)
}

export type U2fKeyParams = {


	keyHandle: Uint8Array;
	appId: string;

	secondFactor: IdTuple;
}

export type U2fKey = {
	_type: TypeRef<U2fKey>;
	_original?: U2fKey

	_id: Id;
	keyHandle: Uint8Array;
	appId: string;

	secondFactor: IdTuple;
}
export const U2fChallengeTypeRef: TypeRef<U2fChallenge> = new TypeRef("sys", 1183)

export function createU2fChallenge(values: U2fChallengeParams): U2fChallenge {
    return Object.assign(create(typeModels[U2fChallengeTypeRef.typeId], U2fChallengeTypeRef), values)
}

export type U2fChallengeParams = {


	challenge: Uint8Array;

	keys: U2fKey[];
}

export type U2fChallenge = {
	_type: TypeRef<U2fChallenge>;
	_original?: U2fChallenge

	_id: Id;
	challenge: Uint8Array;

	keys: U2fKey[];
}
export const ChallengeTypeRef: TypeRef<Challenge> = new TypeRef("sys", 1187)

export function createChallenge(values: ChallengeParams): Challenge {
    return Object.assign(create(typeModels[ChallengeTypeRef.typeId], ChallengeTypeRef), values)
}

export type ChallengeParams = {


	type: NumberString;

	u2f: null | U2fChallenge;
	otp: null | OtpChallenge;
}

export type Challenge = {
	_type: TypeRef<Challenge>;
	_original?: Challenge

	_id: Id;
	type: NumberString;

	u2f: null | U2fChallenge;
	otp: null | OtpChallenge;
}
export const SessionTypeRef: TypeRef<Session> = new TypeRef("sys", 1191)

export function createSession(values: SessionParams): Session {
    return Object.assign(create(typeModels[SessionTypeRef.typeId], SessionTypeRef), values)
}

export type SessionParams = {


	clientIdentifier: string;
	loginTime: Date;
	loginIpAddress: null | string;
	lastAccessTime: Date;
	accessKey: null | Uint8Array;
	state: NumberString;

	challenges: Challenge[];
	user: Id;
}

export type Session = {
	_type: TypeRef<Session>;
	_errors: Object;
	_original?: Session

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	clientIdentifier: string;
	loginTime: Date;
	loginIpAddress: null | string;
	lastAccessTime: Date;
	accessKey: null | Uint8Array;
	state: NumberString;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	challenges: Challenge[];
	user: Id;
}
export const UserAuthenticationTypeRef: TypeRef<UserAuthentication> = new TypeRef("sys", 1206)

export function createUserAuthentication(values: UserAuthenticationParams): UserAuthentication {
    return Object.assign(create(typeModels[UserAuthenticationTypeRef.typeId], UserAuthenticationTypeRef), values)
}

export type UserAuthenticationParams = {



	sessions: Id;
	secondFactors: Id;
	recoverCode: null | Id;
}

export type UserAuthentication = {
	_type: TypeRef<UserAuthentication>;
	_original?: UserAuthentication

	_id: Id;

	sessions: Id;
	secondFactors: Id;
	recoverCode: null | Id;
}
export const CreateSessionDataTypeRef: TypeRef<CreateSessionData> = new TypeRef("sys", 1211)

export function createCreateSessionData(values: CreateSessionDataParams): CreateSessionData {
    return Object.assign(create(typeModels[CreateSessionDataTypeRef.typeId], CreateSessionDataTypeRef), values)
}

export type CreateSessionDataParams = {


	mailAddress: null | string;
	authVerifier: null | string;
	clientIdentifier: string;
	accessKey: null | Uint8Array;
	authToken: null | string;
	recoverCodeVerifier: null | string;

	user: null | Id;
}

export type CreateSessionData = {
	_type: TypeRef<CreateSessionData>;
	_original?: CreateSessionData

	_format: NumberString;
	mailAddress: null | string;
	authVerifier: null | string;
	clientIdentifier: string;
	accessKey: null | Uint8Array;
	authToken: null | string;
	recoverCodeVerifier: null | string;

	user: null | Id;
}
export const CreateSessionReturnTypeRef: TypeRef<CreateSessionReturn> = new TypeRef("sys", 1219)

export function createCreateSessionReturn(values: CreateSessionReturnParams): CreateSessionReturn {
    return Object.assign(create(typeModels[CreateSessionReturnTypeRef.typeId], CreateSessionReturnTypeRef), values)
}

export type CreateSessionReturnParams = {


	accessToken: string;

	challenges: Challenge[];
	user: Id;
}

export type CreateSessionReturn = {
	_type: TypeRef<CreateSessionReturn>;
	_original?: CreateSessionReturn

	_format: NumberString;
	accessToken: string;

	challenges: Challenge[];
	user: Id;
}
export const U2fResponseDataTypeRef: TypeRef<U2fResponseData> = new TypeRef("sys", 1225)

export function createU2fResponseData(values: U2fResponseDataParams): U2fResponseData {
    return Object.assign(create(typeModels[U2fResponseDataTypeRef.typeId], U2fResponseDataTypeRef), values)
}

export type U2fResponseDataParams = {


	keyHandle: string;
	clientData: string;
	signatureData: string;
}

export type U2fResponseData = {
	_type: TypeRef<U2fResponseData>;
	_original?: U2fResponseData

	_id: Id;
	keyHandle: string;
	clientData: string;
	signatureData: string;
}
export const SecondFactorAuthGetDataTypeRef: TypeRef<SecondFactorAuthGetData> = new TypeRef("sys", 1233)

export function createSecondFactorAuthGetData(values: SecondFactorAuthGetDataParams): SecondFactorAuthGetData {
    return Object.assign(create(typeModels[SecondFactorAuthGetDataTypeRef.typeId], SecondFactorAuthGetDataTypeRef), values)
}

export type SecondFactorAuthGetDataParams = {


	accessToken: string;
}

export type SecondFactorAuthGetData = {
	_type: TypeRef<SecondFactorAuthGetData>;
	_original?: SecondFactorAuthGetData

	_format: NumberString;
	accessToken: string;
}
export const SecondFactorAuthGetReturnTypeRef: TypeRef<SecondFactorAuthGetReturn> = new TypeRef("sys", 1236)

export function createSecondFactorAuthGetReturn(values: SecondFactorAuthGetReturnParams): SecondFactorAuthGetReturn {
    return Object.assign(create(typeModels[SecondFactorAuthGetReturnTypeRef.typeId], SecondFactorAuthGetReturnTypeRef), values)
}

export type SecondFactorAuthGetReturnParams = {


	secondFactorPending: boolean;
}

export type SecondFactorAuthGetReturn = {
	_type: TypeRef<SecondFactorAuthGetReturn>;
	_original?: SecondFactorAuthGetReturn

	_format: NumberString;
	secondFactorPending: boolean;
}
export const OtpChallengeTypeRef: TypeRef<OtpChallenge> = new TypeRef("sys", 1244)

export function createOtpChallenge(values: OtpChallengeParams): OtpChallenge {
    return Object.assign(create(typeModels[OtpChallengeTypeRef.typeId], OtpChallengeTypeRef), values)
}

export type OtpChallengeParams = {



	secondFactors: IdTuple[];
}

export type OtpChallenge = {
	_type: TypeRef<OtpChallenge>;
	_original?: OtpChallenge

	_id: Id;

	secondFactors: IdTuple[];
}
export const BootstrapFeatureTypeRef: TypeRef<BootstrapFeature> = new TypeRef("sys", 1249)

export function createBootstrapFeature(values: BootstrapFeatureParams): BootstrapFeature {
    return Object.assign(create(typeModels[BootstrapFeatureTypeRef.typeId], BootstrapFeatureTypeRef), values)
}

export type BootstrapFeatureParams = {


	feature: NumberString;
}

export type BootstrapFeature = {
	_type: TypeRef<BootstrapFeature>;
	_original?: BootstrapFeature

	_id: Id;
	feature: NumberString;
}
export const FeatureTypeRef: TypeRef<Feature> = new TypeRef("sys", 1253)

export function createFeature(values: FeatureParams): Feature {
    return Object.assign(create(typeModels[FeatureTypeRef.typeId], FeatureTypeRef), values)
}

export type FeatureParams = {


	feature: NumberString;
}

export type Feature = {
	_type: TypeRef<Feature>;
	_original?: Feature

	_id: Id;
	feature: NumberString;
}
export const WhitelabelChildTypeRef: TypeRef<WhitelabelChild> = new TypeRef("sys", 1257)

export function createWhitelabelChild(values: WhitelabelChildParams): WhitelabelChild {
    return Object.assign(create(typeModels[WhitelabelChildTypeRef.typeId], WhitelabelChildTypeRef), values)
}

export type WhitelabelChildParams = {


	mailAddress: string;
	createdDate: Date;
	deletedDate: null | Date;
	comment: string;

	customer: Id;
}

export type WhitelabelChild = {
	_type: TypeRef<WhitelabelChild>;
	_errors: Object;
	_original?: WhitelabelChild

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	mailAddress: string;
	createdDate: Date;
	deletedDate: null | Date;
	comment: string;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	customer: Id;
}
export const WhitelabelChildrenRefTypeRef: TypeRef<WhitelabelChildrenRef> = new TypeRef("sys", 1269)

export function createWhitelabelChildrenRef(values: WhitelabelChildrenRefParams): WhitelabelChildrenRef {
    return Object.assign(create(typeModels[WhitelabelChildrenRefTypeRef.typeId], WhitelabelChildrenRefTypeRef), values)
}

export type WhitelabelChildrenRefParams = {



	items: Id;
}

export type WhitelabelChildrenRef = {
	_type: TypeRef<WhitelabelChildrenRef>;
	_original?: WhitelabelChildrenRef

	_id: Id;

	items: Id;
}
export const WhitelabelParentTypeRef: TypeRef<WhitelabelParent> = new TypeRef("sys", 1272)

export function createWhitelabelParent(values: WhitelabelParentParams): WhitelabelParent {
    return Object.assign(create(typeModels[WhitelabelParentTypeRef.typeId], WhitelabelParentTypeRef), values)
}

export type WhitelabelParentParams = {



	customer: Id;
	whitelabelChildInParent: IdTuple;
}

export type WhitelabelParent = {
	_type: TypeRef<WhitelabelParent>;
	_original?: WhitelabelParent

	_id: Id;

	customer: Id;
	whitelabelChildInParent: IdTuple;
}
export const CreditCardTypeRef: TypeRef<CreditCard> = new TypeRef("sys", 1313)

export function createCreditCard(values: CreditCardParams): CreditCard {
    return Object.assign(create(typeModels[CreditCardTypeRef.typeId], CreditCardTypeRef), values)
}

export type CreditCardParams = {


	cardHolderName: string;
	number: string;
	cvv: string;
	expirationMonth: string;
	expirationYear: string;
}

export type CreditCard = {
	_type: TypeRef<CreditCard>;
	_original?: CreditCard

	_id: Id;
	cardHolderName: string;
	number: string;
	cvv: string;
	expirationMonth: string;
	expirationYear: string;
}
export const LocationServiceGetReturnTypeRef: TypeRef<LocationServiceGetReturn> = new TypeRef("sys", 1321)

export function createLocationServiceGetReturn(values: LocationServiceGetReturnParams): LocationServiceGetReturn {
    return Object.assign(create(typeModels[LocationServiceGetReturnTypeRef.typeId], LocationServiceGetReturnTypeRef), values)
}

export type LocationServiceGetReturnParams = {


	country: string;
}

export type LocationServiceGetReturn = {
	_type: TypeRef<LocationServiceGetReturn>;
	_original?: LocationServiceGetReturn

	_format: NumberString;
	country: string;
}
export const OrderProcessingAgreementTypeRef: TypeRef<OrderProcessingAgreement> = new TypeRef("sys", 1326)

export function createOrderProcessingAgreement(values: OrderProcessingAgreementParams): OrderProcessingAgreement {
    return Object.assign(create(typeModels[OrderProcessingAgreementTypeRef.typeId], OrderProcessingAgreementTypeRef), values)
}

export type OrderProcessingAgreementParams = {


	version: string;
	customerAddress: string;
	signatureDate: Date;

	signerUserGroupInfo: IdTuple;
	customer: Id;
}

export type OrderProcessingAgreement = {
	_type: TypeRef<OrderProcessingAgreement>;
	_errors: Object;
	_original?: OrderProcessingAgreement

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	version: string;
	customerAddress: string;
	signatureDate: Date;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	signerUserGroupInfo: IdTuple;
	customer: Id;
}
export const SignOrderProcessingAgreementDataTypeRef: TypeRef<SignOrderProcessingAgreementData> = new TypeRef("sys", 1342)

export function createSignOrderProcessingAgreementData(values: SignOrderProcessingAgreementDataParams): SignOrderProcessingAgreementData {
    return Object.assign(create(typeModels[SignOrderProcessingAgreementDataTypeRef.typeId], SignOrderProcessingAgreementDataTypeRef), values)
}

export type SignOrderProcessingAgreementDataParams = {


	version: string;
	customerAddress: string;
}

export type SignOrderProcessingAgreementData = {
	_type: TypeRef<SignOrderProcessingAgreementData>;
	_original?: SignOrderProcessingAgreementData

	_format: NumberString;
	version: string;
	customerAddress: string;
}
export const GeneratedIdWrapperTypeRef: TypeRef<GeneratedIdWrapper> = new TypeRef("sys", 1349)

export function createGeneratedIdWrapper(values: GeneratedIdWrapperParams): GeneratedIdWrapper {
    return Object.assign(create(typeModels[GeneratedIdWrapperTypeRef.typeId], GeneratedIdWrapperTypeRef), values)
}

export type GeneratedIdWrapperParams = {


	value: Id;
}

export type GeneratedIdWrapper = {
	_type: TypeRef<GeneratedIdWrapper>;
	_original?: GeneratedIdWrapper

	_id: Id;
	value: Id;
}
export const SseConnectDataTypeRef: TypeRef<SseConnectData> = new TypeRef("sys", 1352)

export function createSseConnectData(values: SseConnectDataParams): SseConnectData {
    return Object.assign(create(typeModels[SseConnectDataTypeRef.typeId], SseConnectDataTypeRef), values)
}

export type SseConnectDataParams = {


	identifier: string;

	userIds: GeneratedIdWrapper[];
}

export type SseConnectData = {
	_type: TypeRef<SseConnectData>;
	_original?: SseConnectData

	_format: NumberString;
	identifier: string;

	userIds: GeneratedIdWrapper[];
}
export const NotificationInfoTypeRef: TypeRef<NotificationInfo> = new TypeRef("sys", 1364)

export function createNotificationInfo(values: NotificationInfoParams): NotificationInfo {
    return Object.assign(create(typeModels[NotificationInfoTypeRef.typeId], NotificationInfoTypeRef), values)
}

export type NotificationInfoParams = {


	mailAddress: string;
	userId: Id;

	mailId: null | IdTupleWrapper;
}

export type NotificationInfo = {
	_type: TypeRef<NotificationInfo>;
	_original?: NotificationInfo

	_id: Id;
	mailAddress: string;
	userId: Id;

	mailId: null | IdTupleWrapper;
}
export const RecoverCodeTypeRef: TypeRef<RecoverCode> = new TypeRef("sys", 1407)

export function createRecoverCode(values: RecoverCodeParams): RecoverCode {
    return Object.assign(create(typeModels[RecoverCodeTypeRef.typeId], RecoverCodeTypeRef), values)
}

export type RecoverCodeParams = {


	userEncRecoverCode: Uint8Array;
	recoverCodeEncUserGroupKey: Uint8Array;
	verifier: Uint8Array;
	userKeyVersion: NumberString;
}

export type RecoverCode = {
	_type: TypeRef<RecoverCode>;
	_original?: RecoverCode

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	userEncRecoverCode: Uint8Array;
	recoverCodeEncUserGroupKey: Uint8Array;
	verifier: Uint8Array;
	userKeyVersion: NumberString;
}
export const ResetFactorsDeleteDataTypeRef: TypeRef<ResetFactorsDeleteData> = new TypeRef("sys", 1419)

export function createResetFactorsDeleteData(values: ResetFactorsDeleteDataParams): ResetFactorsDeleteData {
    return Object.assign(create(typeModels[ResetFactorsDeleteDataTypeRef.typeId], ResetFactorsDeleteDataTypeRef), values)
}

export type ResetFactorsDeleteDataParams = {


	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: string;
}

export type ResetFactorsDeleteData = {
	_type: TypeRef<ResetFactorsDeleteData>;
	_original?: ResetFactorsDeleteData

	_format: NumberString;
	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: string;
}
export const UpgradePriceServiceDataTypeRef: TypeRef<UpgradePriceServiceData> = new TypeRef("sys", 1456)

export function createUpgradePriceServiceData(values: UpgradePriceServiceDataParams): UpgradePriceServiceData {
    return Object.assign(create(typeModels[UpgradePriceServiceDataTypeRef.typeId], UpgradePriceServiceDataTypeRef), values)
}

export type UpgradePriceServiceDataParams = {


	date: null | Date;
	campaign: null | string;

	referralCode: null | Id;
}

export type UpgradePriceServiceData = {
	_type: TypeRef<UpgradePriceServiceData>;
	_original?: UpgradePriceServiceData

	_format: NumberString;
	date: null | Date;
	campaign: null | string;

	referralCode: null | Id;
}
export const PlanPricesTypeRef: TypeRef<PlanPrices> = new TypeRef("sys", 1460)

export function createPlanPrices(values: PlanPricesParams): PlanPrices {
    return Object.assign(create(typeModels[PlanPricesTypeRef.typeId], PlanPricesTypeRef), values)
}

export type PlanPricesParams = {


	monthlyReferencePrice: NumberString;
	monthlyPrice: NumberString;
	firstYearDiscount: NumberString;
	additionalUserPriceMonthly: NumberString;
	includedAliases: NumberString;
	includedStorage: NumberString;
	sharing: boolean;
	business: boolean;
	whitelabel: boolean;
	customDomains: NumberString;
	planName: string;
	businessPlan: boolean;

	planConfiguration: PlanConfiguration;
}

export type PlanPrices = {
	_type: TypeRef<PlanPrices>;
	_original?: PlanPrices

	_id: Id;
	monthlyReferencePrice: NumberString;
	monthlyPrice: NumberString;
	firstYearDiscount: NumberString;
	additionalUserPriceMonthly: NumberString;
	includedAliases: NumberString;
	includedStorage: NumberString;
	sharing: boolean;
	business: boolean;
	whitelabel: boolean;
	customDomains: NumberString;
	planName: string;
	businessPlan: boolean;

	planConfiguration: PlanConfiguration;
}
export const UpgradePriceServiceReturnTypeRef: TypeRef<UpgradePriceServiceReturn> = new TypeRef("sys", 1469)

export function createUpgradePriceServiceReturn(values: UpgradePriceServiceReturnParams): UpgradePriceServiceReturn {
    return Object.assign(create(typeModels[UpgradePriceServiceReturnTypeRef.typeId], UpgradePriceServiceReturnTypeRef), values)
}

export type UpgradePriceServiceReturnParams = {


	messageTextId: null | string;
	business: boolean;
	bonusMonthsForYearlyPlan: NumberString;
	firstMonthForFreeForYearlyPlan: boolean;
	hasGlobalFirstYearDiscount: boolean;
	globalCampaignName: null | string;

	premiumPrices: PlanPrices;
	proPrices: PlanPrices;
	teamsPrices: PlanPrices;
	premiumBusinessPrices: PlanPrices;
	teamsBusinessPrices: PlanPrices;
	freePrices: PlanPrices;
	revolutionaryPrices: PlanPrices;
	legendaryPrices: PlanPrices;
	essentialPrices: PlanPrices;
	advancedPrices: PlanPrices;
	unlimitedPrices: PlanPrices;
	plans: PlanPrices[];
}

export type UpgradePriceServiceReturn = {
	_type: TypeRef<UpgradePriceServiceReturn>;
	_original?: UpgradePriceServiceReturn

	_format: NumberString;
	messageTextId: null | string;
	business: boolean;
	bonusMonthsForYearlyPlan: NumberString;
	firstMonthForFreeForYearlyPlan: boolean;
	hasGlobalFirstYearDiscount: boolean;
	globalCampaignName: null | string;

	premiumPrices: PlanPrices;
	proPrices: PlanPrices;
	teamsPrices: PlanPrices;
	premiumBusinessPrices: PlanPrices;
	teamsBusinessPrices: PlanPrices;
	freePrices: PlanPrices;
	revolutionaryPrices: PlanPrices;
	legendaryPrices: PlanPrices;
	essentialPrices: PlanPrices;
	advancedPrices: PlanPrices;
	unlimitedPrices: PlanPrices;
	plans: PlanPrices[];
}
export const RegistrationCaptchaServiceGetDataTypeRef: TypeRef<RegistrationCaptchaServiceGetData> = new TypeRef("sys", 1479)

export function createRegistrationCaptchaServiceGetData(values: RegistrationCaptchaServiceGetDataParams): RegistrationCaptchaServiceGetData {
    return Object.assign(create(typeModels[RegistrationCaptchaServiceGetDataTypeRef.typeId], RegistrationCaptchaServiceGetDataTypeRef), values)
}

export type RegistrationCaptchaServiceGetDataParams = {


	campaignToken: null | string;
	mailAddress: string;
	signupToken: null | string;
	paidSubscriptionSelected: boolean;
	businessUseSelected: boolean;
	timelockChallengeSolution: null | string;
	language: string;
	isAutomatedBrowser: boolean;

	adAttribution: null | AdAttribution;
}

export type RegistrationCaptchaServiceGetData = {
	_type: TypeRef<RegistrationCaptchaServiceGetData>;
	_original?: RegistrationCaptchaServiceGetData

	_format: NumberString;
	campaignToken: null | string;
	mailAddress: string;
	signupToken: null | string;
	paidSubscriptionSelected: boolean;
	businessUseSelected: boolean;
	timelockChallengeSolution: null | string;
	language: string;
	isAutomatedBrowser: boolean;

	adAttribution: null | AdAttribution;
}
export const WebsocketEntityDataTypeRef: TypeRef<WebsocketEntityData> = new TypeRef("sys", 1483)

export function createWebsocketEntityData(values: WebsocketEntityDataParams): WebsocketEntityData {
    return Object.assign(create(typeModels[WebsocketEntityDataTypeRef.typeId], WebsocketEntityDataTypeRef), values)
}

export type WebsocketEntityDataParams = {


	eventBatchId: Id;
	eventBatchOwner: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	entityUpdates: EntityUpdate[];
}

export type WebsocketEntityData = {
	_type: TypeRef<WebsocketEntityData>;
	_original?: WebsocketEntityData

	_format: NumberString;
	eventBatchId: Id;
	eventBatchOwner: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	entityUpdates: EntityUpdate[];
}
export const WebsocketCounterValueTypeRef: TypeRef<WebsocketCounterValue> = new TypeRef("sys", 1488)

export function createWebsocketCounterValue(values: WebsocketCounterValueParams): WebsocketCounterValue {
    return Object.assign(create(typeModels[WebsocketCounterValueTypeRef.typeId], WebsocketCounterValueTypeRef), values)
}

export type WebsocketCounterValueParams = {


	counterId: Id;
	count: NumberString;
}

export type WebsocketCounterValue = {
	_type: TypeRef<WebsocketCounterValue>;
	_original?: WebsocketCounterValue

	_id: Id;
	counterId: Id;
	count: NumberString;
}
export const WebsocketCounterDataTypeRef: TypeRef<WebsocketCounterData> = new TypeRef("sys", 1492)

export function createWebsocketCounterData(values: WebsocketCounterDataParams): WebsocketCounterData {
    return Object.assign(create(typeModels[WebsocketCounterDataTypeRef.typeId], WebsocketCounterDataTypeRef), values)
}

export type WebsocketCounterDataParams = {


	mailGroup: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	counterValues: WebsocketCounterValue[];
}

export type WebsocketCounterData = {
	_type: TypeRef<WebsocketCounterData>;
	_original?: WebsocketCounterData

	_format: NumberString;
	mailGroup: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	counterValues: WebsocketCounterValue[];
}
export const CertificateInfoTypeRef: TypeRef<CertificateInfo> = new TypeRef("sys", 1500)

export function createCertificateInfo(values: CertificateInfoParams): CertificateInfo {
    return Object.assign(create(typeModels[CertificateInfoTypeRef.typeId], CertificateInfoTypeRef), values)
}

export type CertificateInfoParams = {


	expiryDate: null | Date;
	state: NumberString;
	type: NumberString;

	certificate: null | Id;
}

export type CertificateInfo = {
	_type: TypeRef<CertificateInfo>;
	_original?: CertificateInfo

	_id: Id;
	expiryDate: null | Date;
	state: NumberString;
	type: NumberString;

	certificate: null | Id;
}
export const NotificationMailTemplateTypeRef: TypeRef<NotificationMailTemplate> = new TypeRef("sys", 1517)

export function createNotificationMailTemplate(values: NotificationMailTemplateParams): NotificationMailTemplate {
    return Object.assign(create(typeModels[NotificationMailTemplateTypeRef.typeId], NotificationMailTemplateTypeRef), values)
}

export type NotificationMailTemplateParams = {


	language: string;
	body: string;
	subject: string;
}

export type NotificationMailTemplate = {
	_type: TypeRef<NotificationMailTemplate>;
	_original?: NotificationMailTemplate

	_id: Id;
	language: string;
	body: string;
	subject: string;
}
export const CalendarEventRefTypeRef: TypeRef<CalendarEventRef> = new TypeRef("sys", 1532)

export function createCalendarEventRef(values: CalendarEventRefParams): CalendarEventRef {
    return Object.assign(create(typeModels[CalendarEventRefTypeRef.typeId], CalendarEventRefTypeRef), values)
}

export type CalendarEventRefParams = {


	elementId: Id;
	listId: Id;
}

export type CalendarEventRef = {
	_type: TypeRef<CalendarEventRef>;
	_original?: CalendarEventRef

	_id: Id;
	elementId: Id;
	listId: Id;
}
export const AlarmInfoTypeRef: TypeRef<AlarmInfo> = new TypeRef("sys", 1536)

export function createAlarmInfo(values: AlarmInfoParams): AlarmInfo {
    return Object.assign(create(typeModels[AlarmInfoTypeRef.typeId], AlarmInfoTypeRef), values)
}

export type AlarmInfoParams = {


	trigger: string;
	alarmIdentifier: string;

	calendarRef: CalendarEventRef;
}

export type AlarmInfo = {
	_type: TypeRef<AlarmInfo>;
	_original?: AlarmInfo

	_id: Id;
	trigger: string;
	alarmIdentifier: string;

	calendarRef: CalendarEventRef;
}
export const UserAlarmInfoTypeRef: TypeRef<UserAlarmInfo> = new TypeRef("sys", 1541)

export function createUserAlarmInfo(values: UserAlarmInfoParams): UserAlarmInfo {
    return Object.assign(create(typeModels[UserAlarmInfoTypeRef.typeId], UserAlarmInfoTypeRef), values)
}

export type UserAlarmInfoParams = {



	alarmInfo: AlarmInfo;
}

export type UserAlarmInfo = {
	_type: TypeRef<UserAlarmInfo>;
	_errors: Object;
	_original?: UserAlarmInfo

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	alarmInfo: AlarmInfo;
}
export const UserAlarmInfoListTypeTypeRef: TypeRef<UserAlarmInfoListType> = new TypeRef("sys", 1549)

export function createUserAlarmInfoListType(values: UserAlarmInfoListTypeParams): UserAlarmInfoListType {
    return Object.assign(create(typeModels[UserAlarmInfoListTypeTypeRef.typeId], UserAlarmInfoListTypeTypeRef), values)
}

export type UserAlarmInfoListTypeParams = {



	alarms: Id;
}

export type UserAlarmInfoListType = {
	_type: TypeRef<UserAlarmInfoListType>;
	_original?: UserAlarmInfoListType

	_id: Id;

	alarms: Id;
}
export const NotificationSessionKeyTypeRef: TypeRef<NotificationSessionKey> = new TypeRef("sys", 1553)

export function createNotificationSessionKey(values: NotificationSessionKeyParams): NotificationSessionKey {
    return Object.assign(create(typeModels[NotificationSessionKeyTypeRef.typeId], NotificationSessionKeyTypeRef), values)
}

export type NotificationSessionKeyParams = {


	pushIdentifierSessionEncSessionKey: Uint8Array;

	pushIdentifier: IdTuple;
}

export type NotificationSessionKey = {
	_type: TypeRef<NotificationSessionKey>;
	_original?: NotificationSessionKey

	_id: Id;
	pushIdentifierSessionEncSessionKey: Uint8Array;

	pushIdentifier: IdTuple;
}
export const RepeatRuleTypeRef: TypeRef<RepeatRule> = new TypeRef("sys", 1557)

export function createRepeatRule(values: RepeatRuleParams): RepeatRule {
    return Object.assign(create(typeModels[RepeatRuleTypeRef.typeId], RepeatRuleTypeRef), values)
}

export type RepeatRuleParams = {


	frequency: NumberString;
	endType: NumberString;
	endValue: null | NumberString;
	interval: NumberString;
	timeZone: string;

	excludedDates: DateWrapper[];
	advancedRules: CalendarAdvancedRepeatRule[];
}

export type RepeatRule = {
	_type: TypeRef<RepeatRule>;
	_original?: RepeatRule

	_id: Id;
	frequency: NumberString;
	endType: NumberString;
	endValue: null | NumberString;
	interval: NumberString;
	timeZone: string;

	excludedDates: DateWrapper[];
	advancedRules: CalendarAdvancedRepeatRule[];
}
export const AlarmNotificationTypeRef: TypeRef<AlarmNotification> = new TypeRef("sys", 1564)

export function createAlarmNotification(values: AlarmNotificationParams): AlarmNotification {
    return Object.assign(create(typeModels[AlarmNotificationTypeRef.typeId], AlarmNotificationTypeRef), values)
}

export type AlarmNotificationParams = {


	operation: NumberString;
	summary: string;
	eventStart: Date;
	eventEnd: Date;

	alarmInfo: AlarmInfo;
	repeatRule: null | RepeatRule;
	notificationSessionKeys: NotificationSessionKey[];
	user: Id;
}

export type AlarmNotification = {
	_type: TypeRef<AlarmNotification>;
	_original?: AlarmNotification

	_id: Id;
	operation: NumberString;
	summary: string;
	eventStart: Date;
	eventEnd: Date;

	alarmInfo: AlarmInfo;
	repeatRule: null | RepeatRule;
	notificationSessionKeys: NotificationSessionKey[];
	user: Id;
}
export const AlarmServicePostTypeRef: TypeRef<AlarmServicePost> = new TypeRef("sys", 1576)

export function createAlarmServicePost(values: AlarmServicePostParams): AlarmServicePost {
    return Object.assign(create(typeModels[AlarmServicePostTypeRef.typeId], AlarmServicePostTypeRef), values)
}

export type AlarmServicePostParams = {



	alarmNotifications: AlarmNotification[];
	userAlarmInfoData: UserAlarmInfoData[];
}

export type AlarmServicePost = {
	_type: TypeRef<AlarmServicePost>;
	_errors: Object;
	_original?: AlarmServicePost

	_format: NumberString;

	alarmNotifications: AlarmNotification[];
	userAlarmInfoData: UserAlarmInfoData[];
}
export const DnsRecordTypeRef: TypeRef<DnsRecord> = new TypeRef("sys", 1581)

export function createDnsRecord(values: DnsRecordParams): DnsRecord {
    return Object.assign(create(typeModels[DnsRecordTypeRef.typeId], DnsRecordTypeRef), values)
}

export type DnsRecordParams = {


	subdomain: null | string;
	type: NumberString;
	value: string;
}

export type DnsRecord = {
	_type: TypeRef<DnsRecord>;
	_original?: DnsRecord

	_id: Id;
	subdomain: null | string;
	type: NumberString;
	value: string;
}
export const CustomDomainCheckGetInTypeRef: TypeRef<CustomDomainCheckGetIn> = new TypeRef("sys", 1586)

export function createCustomDomainCheckGetIn(values: CustomDomainCheckGetInParams): CustomDomainCheckGetIn {
    return Object.assign(create(typeModels[CustomDomainCheckGetInTypeRef.typeId], CustomDomainCheckGetInTypeRef), values)
}

export type CustomDomainCheckGetInParams = {


	domain: string;

	customer: null | Id;
}

export type CustomDomainCheckGetIn = {
	_type: TypeRef<CustomDomainCheckGetIn>;
	_original?: CustomDomainCheckGetIn

	_format: NumberString;
	domain: string;

	customer: null | Id;
}
export const CustomDomainCheckGetOutTypeRef: TypeRef<CustomDomainCheckGetOut> = new TypeRef("sys", 1589)

export function createCustomDomainCheckGetOut(values: CustomDomainCheckGetOutParams): CustomDomainCheckGetOut {
    return Object.assign(create(typeModels[CustomDomainCheckGetOutTypeRef.typeId], CustomDomainCheckGetOutTypeRef), values)
}

export type CustomDomainCheckGetOutParams = {


	checkResult: NumberString;

	missingRecords: DnsRecord[];
	invalidRecords: DnsRecord[];
	requiredRecords: DnsRecord[];
}

export type CustomDomainCheckGetOut = {
	_type: TypeRef<CustomDomainCheckGetOut>;
	_original?: CustomDomainCheckGetOut

	_format: NumberString;
	checkResult: NumberString;

	missingRecords: DnsRecord[];
	invalidRecords: DnsRecord[];
	requiredRecords: DnsRecord[];
}
export const CloseSessionServicePostTypeRef: TypeRef<CloseSessionServicePost> = new TypeRef("sys", 1595)

export function createCloseSessionServicePost(values: CloseSessionServicePostParams): CloseSessionServicePost {
    return Object.assign(create(typeModels[CloseSessionServicePostTypeRef.typeId], CloseSessionServicePostTypeRef), values)
}

export type CloseSessionServicePostParams = {


	accessToken: string;

	sessionId: IdTuple;
}

export type CloseSessionServicePost = {
	_type: TypeRef<CloseSessionServicePost>;
	_original?: CloseSessionServicePost

	_format: NumberString;
	accessToken: string;

	sessionId: IdTuple;
}
export const ReceivedGroupInvitationTypeRef: TypeRef<ReceivedGroupInvitation> = new TypeRef("sys", 1602)

export function createReceivedGroupInvitation(values: ReceivedGroupInvitationParams): ReceivedGroupInvitation {
    return Object.assign(create(typeModels[ReceivedGroupInvitationTypeRef.typeId], ReceivedGroupInvitationTypeRef), values)
}

export type ReceivedGroupInvitationParams = {


	sharedGroupKey: Uint8Array;
	sharedGroupName: string;
	inviterMailAddress: string;
	inviterName: string;
	inviteeMailAddress: string;
	capability: NumberString;
	groupType: null | NumberString;
	sharedGroupKeyVersion: NumberString;

	sharedGroup: Id;
	sentInvitation: IdTuple;
}

export type ReceivedGroupInvitation = {
	_type: TypeRef<ReceivedGroupInvitation>;
	_errors: Object;
	_original?: ReceivedGroupInvitation

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	sharedGroupKey: Uint8Array;
	sharedGroupName: string;
	inviterMailAddress: string;
	inviterName: string;
	inviteeMailAddress: string;
	capability: NumberString;
	groupType: null | NumberString;
	_ownerKeyVersion: null | NumberString;
	sharedGroupKeyVersion: NumberString;
	_kdfNonce: null | Uint8Array;

	sharedGroup: Id;
	sentInvitation: IdTuple;
}
export const UserGroupRootTypeRef: TypeRef<UserGroupRoot> = new TypeRef("sys", 1618)

export function createUserGroupRoot(values: UserGroupRootParams): UserGroupRoot {
    return Object.assign(create(typeModels[UserGroupRootTypeRef.typeId], UserGroupRootTypeRef), values)
}

export type UserGroupRootParams = {



	invitations: Id;
	keyRotations: KeyRotationsRef;
	groupKeyUpdates: null | GroupKeyUpdatesRef;
}

export type UserGroupRoot = {
	_type: TypeRef<UserGroupRoot>;
	_original?: UserGroupRoot

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	invitations: Id;
	keyRotations: KeyRotationsRef;
	groupKeyUpdates: null | GroupKeyUpdatesRef;
}
export const PaymentErrorInfoTypeRef: TypeRef<PaymentErrorInfo> = new TypeRef("sys", 1632)

export function createPaymentErrorInfo(values: PaymentErrorInfoParams): PaymentErrorInfo {
    return Object.assign(create(typeModels[PaymentErrorInfoTypeRef.typeId], PaymentErrorInfoTypeRef), values)
}

export type PaymentErrorInfoParams = {


	errorTime: Date;
	errorCode: string;
	thirdPartyErrorId: string;
}

export type PaymentErrorInfo = {
	_type: TypeRef<PaymentErrorInfo>;
	_original?: PaymentErrorInfo

	_id: Id;
	errorTime: Date;
	errorCode: string;
	thirdPartyErrorId: string;
}
export const InvoiceItemTypeRef: TypeRef<InvoiceItem> = new TypeRef("sys", 1641)

export function createInvoiceItem(values: InvoiceItemParams): InvoiceItem {
    return Object.assign(create(typeModels[InvoiceItemTypeRef.typeId], InvoiceItemTypeRef), values)
}

export type InvoiceItemParams = {


	amount: NumberString;
	type: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
	singleType: boolean;
}

export type InvoiceItem = {
	_type: TypeRef<InvoiceItem>;
	_original?: InvoiceItem

	_id: Id;
	amount: NumberString;
	type: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
	singleType: boolean;
}
export const InvoiceTypeRef: TypeRef<Invoice> = new TypeRef("sys", 1650)

export function createInvoice(values: InvoiceParams): Invoice {
    return Object.assign(create(typeModels[InvoiceTypeRef.typeId], InvoiceTypeRef), values)
}

export type InvoiceParams = {


	type: NumberString;
	date: Date;
	paymentMethod: NumberString;
	country: string;
	address: string;
	business: boolean;
	vatIdNumber: null | string;
	vatRate: NumberString;
	vat: NumberString;
	subTotal: NumberString;
	grandTotal: NumberString;
	adminUser: null | string;
	reason: null | string;

	items: InvoiceItem[];
	customer: Id;
	bookings: IdTuple[];
}

export type Invoice = {
	_type: TypeRef<Invoice>;
	_errors: Object;
	_original?: Invoice

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	type: NumberString;
	date: Date;
	paymentMethod: NumberString;
	country: string;
	address: string;
	business: boolean;
	vatIdNumber: null | string;
	vatRate: NumberString;
	vat: NumberString;
	subTotal: NumberString;
	grandTotal: NumberString;
	adminUser: null | string;
	reason: null | string;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	items: InvoiceItem[];
	customer: Id;
	bookings: IdTuple[];
}
export const MissedNotificationTypeRef: TypeRef<MissedNotification> = new TypeRef("sys", 1693)

export function createMissedNotification(values: MissedNotificationParams): MissedNotification {
    return Object.assign(create(typeModels[MissedNotificationTypeRef.typeId], MissedNotificationTypeRef), values)
}

export type MissedNotificationParams = {


	lastProcessedNotificationId: null | Id;

	notificationInfos: NotificationInfo[];
	alarmNotifications: AlarmNotification[];
}

export type MissedNotification = {
	_type: TypeRef<MissedNotification>;
	_errors: Object;
	_original?: MissedNotification

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	lastProcessedNotificationId: null | Id;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	notificationInfos: NotificationInfo[];
	alarmNotifications: AlarmNotification[];
}
export const BrandingDomainGetReturnTypeRef: TypeRef<BrandingDomainGetReturn> = new TypeRef("sys", 1723)

export function createBrandingDomainGetReturn(values: BrandingDomainGetReturnParams): BrandingDomainGetReturn {
    return Object.assign(create(typeModels[BrandingDomainGetReturnTypeRef.typeId], BrandingDomainGetReturnTypeRef), values)
}

export type BrandingDomainGetReturnParams = {



	certificateInfo: null | CertificateInfo;
}

export type BrandingDomainGetReturn = {
	_type: TypeRef<BrandingDomainGetReturn>;
	_original?: BrandingDomainGetReturn

	_format: NumberString;

	certificateInfo: null | CertificateInfo;
}
export const RejectedSenderTypeRef: TypeRef<RejectedSender> = new TypeRef("sys", 1736)

export function createRejectedSender(values: RejectedSenderParams): RejectedSender {
    return Object.assign(create(typeModels[RejectedSenderTypeRef.typeId], RejectedSenderTypeRef), values)
}

export type RejectedSenderParams = {


	senderMailAddress: string;
	senderIp: string;
	senderHostname: string;
	recipientMailAddress: string;
	reason: string;
}

export type RejectedSender = {
	_type: TypeRef<RejectedSender>;
	_original?: RejectedSender

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	senderMailAddress: string;
	senderIp: string;
	senderHostname: string;
	recipientMailAddress: string;
	reason: string;
}
export const RejectedSendersRefTypeRef: TypeRef<RejectedSendersRef> = new TypeRef("sys", 1747)

export function createRejectedSendersRef(values: RejectedSendersRefParams): RejectedSendersRef {
    return Object.assign(create(typeModels[RejectedSendersRefTypeRef.typeId], RejectedSendersRefTypeRef), values)
}

export type RejectedSendersRefParams = {



	items: Id;
}

export type RejectedSendersRef = {
	_type: TypeRef<RejectedSendersRef>;
	_original?: RejectedSendersRef

	_id: Id;

	items: Id;
}
export const SecondFactorAuthDeleteDataTypeRef: TypeRef<SecondFactorAuthDeleteData> = new TypeRef("sys", 1755)

export function createSecondFactorAuthDeleteData(values: SecondFactorAuthDeleteDataParams): SecondFactorAuthDeleteData {
    return Object.assign(create(typeModels[SecondFactorAuthDeleteDataTypeRef.typeId], SecondFactorAuthDeleteDataTypeRef), values)
}

export type SecondFactorAuthDeleteDataParams = {



	session: IdTuple;
}

export type SecondFactorAuthDeleteData = {
	_type: TypeRef<SecondFactorAuthDeleteData>;
	_original?: SecondFactorAuthDeleteData

	_format: NumberString;

	session: IdTuple;
}
export const TakeOverDeletedAddressDataTypeRef: TypeRef<TakeOverDeletedAddressData> = new TypeRef("sys", 1759)

export function createTakeOverDeletedAddressData(values: TakeOverDeletedAddressDataParams): TakeOverDeletedAddressData {
    return Object.assign(create(typeModels[TakeOverDeletedAddressDataTypeRef.typeId], TakeOverDeletedAddressDataTypeRef), values)
}

export type TakeOverDeletedAddressDataParams = {


	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: null | string;
	targetAccountMailAddress: string;
}

export type TakeOverDeletedAddressData = {
	_type: TypeRef<TakeOverDeletedAddressData>;
	_original?: TakeOverDeletedAddressData

	_format: NumberString;
	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: null | string;
	targetAccountMailAddress: string;
}
export const WebsocketLeaderStatusTypeRef: TypeRef<WebsocketLeaderStatus> = new TypeRef("sys", 1766)

export function createWebsocketLeaderStatus(values: WebsocketLeaderStatusParams): WebsocketLeaderStatus {
    return Object.assign(create(typeModels[WebsocketLeaderStatusTypeRef.typeId], WebsocketLeaderStatusTypeRef), values)
}

export type WebsocketLeaderStatusParams = {


	leaderStatus: boolean;
	applicationVersionSum: null | NumberString;
	applicationTypesHash: null | string;
}

export type WebsocketLeaderStatus = {
	_type: TypeRef<WebsocketLeaderStatus>;
	_original?: WebsocketLeaderStatus

	_format: NumberString;
	leaderStatus: boolean;
	applicationVersionSum: null | NumberString;
	applicationTypesHash: null | string;
}
export const GiftCardTypeRef: TypeRef<GiftCard> = new TypeRef("sys", 1769)

export function createGiftCard(values: GiftCardParams): GiftCard {
    return Object.assign(create(typeModels[GiftCardTypeRef.typeId], GiftCardTypeRef), values)
}

export type GiftCardParams = {


	status: NumberString;
	value: NumberString;
	message: string;
	orderDate: Date;
	migrated: boolean;
}

export type GiftCard = {
	_type: TypeRef<GiftCard>;
	_errors: Object;
	_original?: GiftCard

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	status: NumberString;
	value: NumberString;
	message: string;
	orderDate: Date;
	migrated: boolean;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;
}
export const GiftCardsRefTypeRef: TypeRef<GiftCardsRef> = new TypeRef("sys", 1791)

export function createGiftCardsRef(values: GiftCardsRefParams): GiftCardsRef {
    return Object.assign(create(typeModels[GiftCardsRefTypeRef.typeId], GiftCardsRefTypeRef), values)
}

export type GiftCardsRefParams = {



	items: Id;
}

export type GiftCardsRef = {
	_type: TypeRef<GiftCardsRef>;
	_original?: GiftCardsRef

	_id: Id;

	items: Id;
}
export const GiftCardOptionTypeRef: TypeRef<GiftCardOption> = new TypeRef("sys", 1795)

export function createGiftCardOption(values: GiftCardOptionParams): GiftCardOption {
    return Object.assign(create(typeModels[GiftCardOptionTypeRef.typeId], GiftCardOptionTypeRef), values)
}

export type GiftCardOptionParams = {


	value: NumberString;
}

export type GiftCardOption = {
	_type: TypeRef<GiftCardOption>;
	_original?: GiftCardOption

	_id: Id;
	value: NumberString;
}
export const GiftCardGetReturnTypeRef: TypeRef<GiftCardGetReturn> = new TypeRef("sys", 1798)

export function createGiftCardGetReturn(values: GiftCardGetReturnParams): GiftCardGetReturn {
    return Object.assign(create(typeModels[GiftCardGetReturnTypeRef.typeId], GiftCardGetReturnTypeRef), values)
}

export type GiftCardGetReturnParams = {


	maxPerPeriod: NumberString;
	period: NumberString;

	options: GiftCardOption[];
}

export type GiftCardGetReturn = {
	_type: TypeRef<GiftCardGetReturn>;
	_original?: GiftCardGetReturn

	_format: NumberString;
	maxPerPeriod: NumberString;
	period: NumberString;

	options: GiftCardOption[];
}
export const GiftCardCreateDataTypeRef: TypeRef<GiftCardCreateData> = new TypeRef("sys", 1803)

export function createGiftCardCreateData(values: GiftCardCreateDataParams): GiftCardCreateData {
    return Object.assign(create(typeModels[GiftCardCreateDataTypeRef.typeId], GiftCardCreateDataTypeRef), values)
}

export type GiftCardCreateDataParams = {


	message: string;
	value: NumberString;
	keyHash: Uint8Array;
}

export type GiftCardCreateData = {
	_type: TypeRef<GiftCardCreateData>;
	_errors: Object;
	_original?: GiftCardCreateData

	_format: NumberString;
	message: string;
	ownerEncSessionKey: Uint8Array;
	value: NumberString;
	keyHash: Uint8Array;
	ownerKeyVersion: NumberString;
}
export const GiftCardDeleteDataTypeRef: TypeRef<GiftCardDeleteData> = new TypeRef("sys", 1810)

export function createGiftCardDeleteData(values: GiftCardDeleteDataParams): GiftCardDeleteData {
    return Object.assign(create(typeModels[GiftCardDeleteDataTypeRef.typeId], GiftCardDeleteDataTypeRef), values)
}

export type GiftCardDeleteDataParams = {



	giftCard: IdTuple;
}

export type GiftCardDeleteData = {
	_type: TypeRef<GiftCardDeleteData>;
	_original?: GiftCardDeleteData

	_format: NumberString;

	giftCard: IdTuple;
}
export const GiftCardCreateReturnTypeRef: TypeRef<GiftCardCreateReturn> = new TypeRef("sys", 1813)

export function createGiftCardCreateReturn(values: GiftCardCreateReturnParams): GiftCardCreateReturn {
    return Object.assign(create(typeModels[GiftCardCreateReturnTypeRef.typeId], GiftCardCreateReturnTypeRef), values)
}

export type GiftCardCreateReturnParams = {



	giftCard: IdTuple;
}

export type GiftCardCreateReturn = {
	_type: TypeRef<GiftCardCreateReturn>;
	_original?: GiftCardCreateReturn

	_format: NumberString;

	giftCard: IdTuple;
}
export const GiftCardRedeemDataTypeRef: TypeRef<GiftCardRedeemData> = new TypeRef("sys", 1817)

export function createGiftCardRedeemData(values: GiftCardRedeemDataParams): GiftCardRedeemData {
    return Object.assign(create(typeModels[GiftCardRedeemDataTypeRef.typeId], GiftCardRedeemDataTypeRef), values)
}

export type GiftCardRedeemDataParams = {


	keyHash: Uint8Array;
	countryCode: string;

	giftCardInfo: Id;
}

export type GiftCardRedeemData = {
	_type: TypeRef<GiftCardRedeemData>;
	_original?: GiftCardRedeemData

	_format: NumberString;
	keyHash: Uint8Array;
	countryCode: string;

	giftCardInfo: Id;
}
export const GiftCardRedeemGetReturnTypeRef: TypeRef<GiftCardRedeemGetReturn> = new TypeRef("sys", 1821)

export function createGiftCardRedeemGetReturn(values: GiftCardRedeemGetReturnParams): GiftCardRedeemGetReturn {
    return Object.assign(create(typeModels[GiftCardRedeemGetReturnTypeRef.typeId], GiftCardRedeemGetReturnTypeRef), values)
}

export type GiftCardRedeemGetReturnParams = {


	message: string;
	value: NumberString;

	giftCard: IdTuple;
}

export type GiftCardRedeemGetReturn = {
	_type: TypeRef<GiftCardRedeemGetReturn>;
	_errors: Object;
	_original?: GiftCardRedeemGetReturn

	_format: NumberString;
	message: string;
	value: NumberString;

	giftCard: IdTuple;
}
export const Braintree3ds2RequestTypeRef: TypeRef<Braintree3ds2Request> = new TypeRef("sys", 1828)

export function createBraintree3ds2Request(values: Braintree3ds2RequestParams): Braintree3ds2Request {
    return Object.assign(create(typeModels[Braintree3ds2RequestTypeRef.typeId], Braintree3ds2RequestTypeRef), values)
}

export type Braintree3ds2RequestParams = {


	clientToken: string;
	nonce: string;
	bin: string;
}

export type Braintree3ds2Request = {
	_type: TypeRef<Braintree3ds2Request>;
	_original?: Braintree3ds2Request

	_id: Id;
	clientToken: string;
	nonce: string;
	bin: string;
}
export const Braintree3ds2ResponseTypeRef: TypeRef<Braintree3ds2Response> = new TypeRef("sys", 1833)

export function createBraintree3ds2Response(values: Braintree3ds2ResponseParams): Braintree3ds2Response {
    return Object.assign(create(typeModels[Braintree3ds2ResponseTypeRef.typeId], Braintree3ds2ResponseTypeRef), values)
}

export type Braintree3ds2ResponseParams = {


	clientToken: string;
	nonce: string;
}

export type Braintree3ds2Response = {
	_type: TypeRef<Braintree3ds2Response>;
	_original?: Braintree3ds2Response

	_id: Id;
	clientToken: string;
	nonce: string;
}
export const PaymentDataServicePostDataTypeRef: TypeRef<PaymentDataServicePostData> = new TypeRef("sys", 1837)

export function createPaymentDataServicePostData(values: PaymentDataServicePostDataParams): PaymentDataServicePostData {
    return Object.assign(create(typeModels[PaymentDataServicePostDataTypeRef.typeId], PaymentDataServicePostDataTypeRef), values)
}

export type PaymentDataServicePostDataParams = {



	braintree3dsResponse: Braintree3ds2Response;
}

export type PaymentDataServicePostData = {
	_type: TypeRef<PaymentDataServicePostData>;
	_original?: PaymentDataServicePostData

	_format: NumberString;

	braintree3dsResponse: Braintree3ds2Response;
}
export const PaymentDataServiceGetDataTypeRef: TypeRef<PaymentDataServiceGetData> = new TypeRef("sys", 1861)

export function createPaymentDataServiceGetData(values: PaymentDataServiceGetDataParams): PaymentDataServiceGetData {
    return Object.assign(create(typeModels[PaymentDataServiceGetDataTypeRef.typeId], PaymentDataServiceGetDataTypeRef), values)
}

export type PaymentDataServiceGetDataParams = {


	clientType: null | NumberString;
	subscriptionApp: NumberString;
}

export type PaymentDataServiceGetData = {
	_type: TypeRef<PaymentDataServiceGetData>;
	_original?: PaymentDataServiceGetData

	_format: NumberString;
	clientType: null | NumberString;
	subscriptionApp: NumberString;
}
export const TypeInfoTypeRef: TypeRef<TypeInfo> = new TypeRef("sys", 1869)

export function createTypeInfo(values: TypeInfoParams): TypeInfo {
    return Object.assign(create(typeModels[TypeInfoTypeRef.typeId], TypeInfoTypeRef), values)
}

export type TypeInfoParams = {


	application: string;
	typeId: NumberString;
}

export type TypeInfo = {
	_type: TypeRef<TypeInfo>;
	_original?: TypeInfo

	_id: Id;
	application: string;
	typeId: NumberString;
}
export const ArchiveRefTypeRef: TypeRef<ArchiveRef> = new TypeRef("sys", 1873)

export function createArchiveRef(values: ArchiveRefParams): ArchiveRef {
    return Object.assign(create(typeModels[ArchiveRefTypeRef.typeId], ArchiveRefTypeRef), values)
}

export type ArchiveRefParams = {


	archiveId: Id;
}

export type ArchiveRef = {
	_type: TypeRef<ArchiveRef>;
	_original?: ArchiveRef

	_id: Id;
	archiveId: Id;
}
export const ArchiveTypeTypeRef: TypeRef<ArchiveType> = new TypeRef("sys", 1876)

export function createArchiveType(values: ArchiveTypeParams): ArchiveType {
    return Object.assign(create(typeModels[ArchiveTypeTypeRef.typeId], ArchiveTypeTypeRef), values)
}

export type ArchiveTypeParams = {



	type: TypeInfo;
	active: ArchiveRef;
	inactive: ArchiveRef[];
}

export type ArchiveType = {
	_type: TypeRef<ArchiveType>;
	_original?: ArchiveType

	_id: Id;

	type: TypeInfo;
	active: ArchiveRef;
	inactive: ArchiveRef[];
}
export const BlobTypeRef: TypeRef<Blob> = new TypeRef("sys", 1882)

export function createBlob(values: BlobParams): Blob {
    return Object.assign(create(typeModels[BlobTypeRef.typeId], BlobTypeRef), values)
}

export type BlobParams = {


	archiveId: Id;
	size: NumberString;
	blobId: Id;
}

export type Blob = {
	_type: TypeRef<Blob>;
	_original?: Blob

	_id: Id;
	archiveId: Id;
	size: NumberString;
	blobId: Id;
}
export const WebauthnResponseDataTypeRef: TypeRef<WebauthnResponseData> = new TypeRef("sys", 1899)

export function createWebauthnResponseData(values: WebauthnResponseDataParams): WebauthnResponseData {
    return Object.assign(create(typeModels[WebauthnResponseDataTypeRef.typeId], WebauthnResponseDataTypeRef), values)
}

export type WebauthnResponseDataParams = {


	keyHandle: Uint8Array;
	clientData: Uint8Array;
	authenticatorData: Uint8Array;
	signature: Uint8Array;
}

export type WebauthnResponseData = {
	_type: TypeRef<WebauthnResponseData>;
	_original?: WebauthnResponseData

	_id: Id;
	keyHandle: Uint8Array;
	clientData: Uint8Array;
	authenticatorData: Uint8Array;
	signature: Uint8Array;
}
export const BlobReferenceTokenWrapperTypeRef: TypeRef<BlobReferenceTokenWrapper> = new TypeRef("sys", 1990)

export function createBlobReferenceTokenWrapper(values: BlobReferenceTokenWrapperParams): BlobReferenceTokenWrapper {
    return Object.assign(create(typeModels[BlobReferenceTokenWrapperTypeRef.typeId], BlobReferenceTokenWrapperTypeRef), values)
}

export type BlobReferenceTokenWrapperParams = {


	blobReferenceToken: string;
}

export type BlobReferenceTokenWrapper = {
	_type: TypeRef<BlobReferenceTokenWrapper>;
	_original?: BlobReferenceTokenWrapper

	_id: Id;
	blobReferenceToken: string;
}
export const CustomerAccountTerminationRequestTypeRef: TypeRef<CustomerAccountTerminationRequest> = new TypeRef("sys", 2005)

export function createCustomerAccountTerminationRequest(values: CustomerAccountTerminationRequestParams): CustomerAccountTerminationRequest {
    return Object.assign(create(typeModels[CustomerAccountTerminationRequestTypeRef.typeId], CustomerAccountTerminationRequestTypeRef), values)
}

export type CustomerAccountTerminationRequestParams = {


	terminationDate: Date;
	terminationRequestDate: Date;

	customer: Id;
}

export type CustomerAccountTerminationRequest = {
	_type: TypeRef<CustomerAccountTerminationRequest>;
	_original?: CustomerAccountTerminationRequest

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	terminationDate: Date;
	terminationRequestDate: Date;

	customer: Id;
}
export const CustomerAccountTerminationPostInTypeRef: TypeRef<CustomerAccountTerminationPostIn> = new TypeRef("sys", 2015)

export function createCustomerAccountTerminationPostIn(values: CustomerAccountTerminationPostInParams): CustomerAccountTerminationPostIn {
    return Object.assign(create(typeModels[CustomerAccountTerminationPostInTypeRef.typeId], CustomerAccountTerminationPostInTypeRef), values)
}

export type CustomerAccountTerminationPostInParams = {


	terminationDate: null | Date;

	surveyData: null | SurveyData;
}

export type CustomerAccountTerminationPostIn = {
	_type: TypeRef<CustomerAccountTerminationPostIn>;
	_original?: CustomerAccountTerminationPostIn

	_format: NumberString;
	terminationDate: null | Date;

	surveyData: null | SurveyData;
}
export const CustomerAccountTerminationPostOutTypeRef: TypeRef<CustomerAccountTerminationPostOut> = new TypeRef("sys", 2018)

export function createCustomerAccountTerminationPostOut(values: CustomerAccountTerminationPostOutParams): CustomerAccountTerminationPostOut {
    return Object.assign(create(typeModels[CustomerAccountTerminationPostOutTypeRef.typeId], CustomerAccountTerminationPostOutTypeRef), values)
}

export type CustomerAccountTerminationPostOutParams = {



	terminationRequest: IdTuple;
}

export type CustomerAccountTerminationPostOut = {
	_type: TypeRef<CustomerAccountTerminationPostOut>;
	_original?: CustomerAccountTerminationPostOut

	_format: NumberString;

	terminationRequest: IdTuple;
}
export const MailAddressAvailabilityTypeRef: TypeRef<MailAddressAvailability> = new TypeRef("sys", 2026)

export function createMailAddressAvailability(values: MailAddressAvailabilityParams): MailAddressAvailability {
    return Object.assign(create(typeModels[MailAddressAvailabilityTypeRef.typeId], MailAddressAvailabilityTypeRef), values)
}

export type MailAddressAvailabilityParams = {


	mailAddress: string;
	available: boolean;
}

export type MailAddressAvailability = {
	_type: TypeRef<MailAddressAvailability>;
	_original?: MailAddressAvailability

	_id: Id;
	mailAddress: string;
	available: boolean;
}
export const MultipleMailAddressAvailabilityDataTypeRef: TypeRef<MultipleMailAddressAvailabilityData> = new TypeRef("sys", 2030)

export function createMultipleMailAddressAvailabilityData(values: MultipleMailAddressAvailabilityDataParams): MultipleMailAddressAvailabilityData {
    return Object.assign(create(typeModels[MultipleMailAddressAvailabilityDataTypeRef.typeId], MultipleMailAddressAvailabilityDataTypeRef), values)
}

export type MultipleMailAddressAvailabilityDataParams = {


	signupToken: null | string;

	mailAddresses: StringWrapper[];
}

export type MultipleMailAddressAvailabilityData = {
	_type: TypeRef<MultipleMailAddressAvailabilityData>;
	_original?: MultipleMailAddressAvailabilityData

	_format: NumberString;
	signupToken: null | string;

	mailAddresses: StringWrapper[];
}
export const MultipleMailAddressAvailabilityReturnTypeRef: TypeRef<MultipleMailAddressAvailabilityReturn> = new TypeRef("sys", 2033)

export function createMultipleMailAddressAvailabilityReturn(values: MultipleMailAddressAvailabilityReturnParams): MultipleMailAddressAvailabilityReturn {
    return Object.assign(create(typeModels[MultipleMailAddressAvailabilityReturnTypeRef.typeId], MultipleMailAddressAvailabilityReturnTypeRef), values)
}

export type MultipleMailAddressAvailabilityReturnParams = {



	availabilities: MailAddressAvailability[];
}

export type MultipleMailAddressAvailabilityReturn = {
	_type: TypeRef<MultipleMailAddressAvailabilityReturn>;
	_original?: MultipleMailAddressAvailabilityReturn

	_format: NumberString;

	availabilities: MailAddressAvailability[];
}
export const InstanceSessionKeyTypeRef: TypeRef<InstanceSessionKey> = new TypeRef("sys", 2037)

export function createInstanceSessionKey(values: InstanceSessionKeyParams): InstanceSessionKey {
    return Object.assign(create(typeModels[InstanceSessionKeyTypeRef.typeId], InstanceSessionKeyTypeRef), values)
}

export type InstanceSessionKeyParams = {


	instanceList: Id;
	instanceId: Id;
	symEncSessionKey: Uint8Array;
	encryptionAuthStatus: null | Uint8Array;
	symKeyVersion: NumberString;
	keyVerificationState: null | Uint8Array;

	typeInfo: TypeInfo;
}

export type InstanceSessionKey = {
	_type: TypeRef<InstanceSessionKey>;
	_original?: InstanceSessionKey

	_id: Id;
	instanceList: Id;
	instanceId: Id;
	symEncSessionKey: Uint8Array;
	encryptionAuthStatus: null | Uint8Array;
	symKeyVersion: NumberString;
	keyVerificationState: null | Uint8Array;

	typeInfo: TypeInfo;
}
export const BucketKeyTypeRef: TypeRef<BucketKey> = new TypeRef("sys", 2043)

export function createBucketKey(values: BucketKeyParams): BucketKey {
    return Object.assign(create(typeModels[BucketKeyTypeRef.typeId], BucketKeyTypeRef), values)
}

export type BucketKeyParams = {


	pubEncBucketKey: null | Uint8Array;
	groupEncBucketKey: null | Uint8Array;
	protocolVersion: NumberString;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;

	keyGroup: null | Id;
	bucketEncSessionKeys: InstanceSessionKey[];
}

export type BucketKey = {
	_type: TypeRef<BucketKey>;
	_original?: BucketKey

	_id: Id;
	pubEncBucketKey: null | Uint8Array;
	groupEncBucketKey: null | Uint8Array;
	protocolVersion: NumberString;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;

	keyGroup: null | Id;
	bucketEncSessionKeys: InstanceSessionKey[];
}
export const UpdateSessionKeysPostInTypeRef: TypeRef<UpdateSessionKeysPostIn> = new TypeRef("sys", 2049)

export function createUpdateSessionKeysPostIn(values: UpdateSessionKeysPostInParams): UpdateSessionKeysPostIn {
    return Object.assign(create(typeModels[UpdateSessionKeysPostInTypeRef.typeId], UpdateSessionKeysPostInTypeRef), values)
}

export type UpdateSessionKeysPostInParams = {



	ownerEncSessionKeys: InstanceSessionKey[];
}

export type UpdateSessionKeysPostIn = {
	_type: TypeRef<UpdateSessionKeysPostIn>;
	_original?: UpdateSessionKeysPostIn

	_format: NumberString;

	ownerEncSessionKeys: InstanceSessionKey[];
}
export const ReferralCodeGetInTypeRef: TypeRef<ReferralCodeGetIn> = new TypeRef("sys", 2062)

export function createReferralCodeGetIn(values: ReferralCodeGetInParams): ReferralCodeGetIn {
    return Object.assign(create(typeModels[ReferralCodeGetInTypeRef.typeId], ReferralCodeGetInTypeRef), values)
}

export type ReferralCodeGetInParams = {



	referralCode: Id;
}

export type ReferralCodeGetIn = {
	_type: TypeRef<ReferralCodeGetIn>;
	_original?: ReferralCodeGetIn

	_format: NumberString;

	referralCode: Id;
}
export const ReferralCodePostInTypeRef: TypeRef<ReferralCodePostIn> = new TypeRef("sys", 2065)

export function createReferralCodePostIn(values: ReferralCodePostInParams): ReferralCodePostIn {
    return Object.assign(create(typeModels[ReferralCodePostInTypeRef.typeId], ReferralCodePostInTypeRef), values)
}

export type ReferralCodePostInParams = {


}

export type ReferralCodePostIn = {
	_type: TypeRef<ReferralCodePostIn>;
	_original?: ReferralCodePostIn

	_format: NumberString;
}
export const ReferralCodePostOutTypeRef: TypeRef<ReferralCodePostOut> = new TypeRef("sys", 2067)

export function createReferralCodePostOut(values: ReferralCodePostOutParams): ReferralCodePostOut {
    return Object.assign(create(typeModels[ReferralCodePostOutTypeRef.typeId], ReferralCodePostOutTypeRef), values)
}

export type ReferralCodePostOutParams = {



	referralCode: Id;
}

export type ReferralCodePostOut = {
	_type: TypeRef<ReferralCodePostOut>;
	_original?: ReferralCodePostOut

	_format: NumberString;

	referralCode: Id;
}
export const DateWrapperTypeRef: TypeRef<DateWrapper> = new TypeRef("sys", 2073)

export function createDateWrapper(values: DateWrapperParams): DateWrapper {
    return Object.assign(create(typeModels[DateWrapperTypeRef.typeId], DateWrapperTypeRef), values)
}

export type DateWrapperParams = {


	date: Date;
}

export type DateWrapper = {
	_type: TypeRef<DateWrapper>;
	_original?: DateWrapper

	_id: Id;
	date: Date;
}
export const MailAddressAliasGetInTypeRef: TypeRef<MailAddressAliasGetIn> = new TypeRef("sys", 2095)

export function createMailAddressAliasGetIn(values: MailAddressAliasGetInParams): MailAddressAliasGetIn {
    return Object.assign(create(typeModels[MailAddressAliasGetInTypeRef.typeId], MailAddressAliasGetInTypeRef), values)
}

export type MailAddressAliasGetInParams = {



	targetGroup: Id;
}

export type MailAddressAliasGetIn = {
	_type: TypeRef<MailAddressAliasGetIn>;
	_original?: MailAddressAliasGetIn

	_format: NumberString;

	targetGroup: Id;
}
export const PlanConfigurationTypeRef: TypeRef<PlanConfiguration> = new TypeRef("sys", 2104)

export function createPlanConfiguration(values: PlanConfigurationParams): PlanConfiguration {
    return Object.assign(create(typeModels[PlanConfigurationTypeRef.typeId], PlanConfigurationTypeRef), values)
}

export type PlanConfigurationParams = {


	nbrOfAliases: NumberString;
	storageGb: NumberString;
	sharing: boolean;
	eventInvites: boolean;
	whitelabel: boolean;
	customDomainType: NumberString;
	multiUser: boolean;
	templates: boolean;
	autoResponder: boolean;
	contactList: boolean;
	maxLabels: NumberString;
	scheduledMails: boolean;
	drive: boolean;
}

export type PlanConfiguration = {
	_type: TypeRef<PlanConfiguration>;
	_original?: PlanConfiguration

	_id: Id;
	nbrOfAliases: NumberString;
	storageGb: NumberString;
	sharing: boolean;
	eventInvites: boolean;
	whitelabel: boolean;
	customDomainType: NumberString;
	multiUser: boolean;
	templates: boolean;
	autoResponder: boolean;
	contactList: boolean;
	maxLabels: NumberString;
	scheduledMails: boolean;
	drive: boolean;
}
export const PlanServiceGetOutTypeRef: TypeRef<PlanServiceGetOut> = new TypeRef("sys", 2115)

export function createPlanServiceGetOut(values: PlanServiceGetOutParams): PlanServiceGetOut {
    return Object.assign(create(typeModels[PlanServiceGetOutTypeRef.typeId], PlanServiceGetOutTypeRef), values)
}

export type PlanServiceGetOutParams = {



	config: PlanConfiguration;
}

export type PlanServiceGetOut = {
	_type: TypeRef<PlanServiceGetOut>;
	_original?: PlanServiceGetOut

	_format: NumberString;

	config: PlanConfiguration;
}
export const PublicKeyPutInTypeRef: TypeRef<PublicKeyPutIn> = new TypeRef("sys", 2150)

export function createPublicKeyPutIn(values: PublicKeyPutInParams): PublicKeyPutIn {
    return Object.assign(create(typeModels[PublicKeyPutInTypeRef.typeId], PublicKeyPutInTypeRef), values)
}

export type PublicKeyPutInParams = {


	pubEccKey: Uint8Array;
	symEncPrivEccKey: Uint8Array;

	keyGroup: Id;
}

export type PublicKeyPutIn = {
	_type: TypeRef<PublicKeyPutIn>;
	_original?: PublicKeyPutIn

	_format: NumberString;
	pubEccKey: Uint8Array;
	symEncPrivEccKey: Uint8Array;

	keyGroup: Id;
}
export const InvoiceDataItemTypeRef: TypeRef<InvoiceDataItem> = new TypeRef("sys", 2162)

export function createInvoiceDataItem(values: InvoiceDataItemParams): InvoiceDataItem {
    return Object.assign(create(typeModels[InvoiceDataItemTypeRef.typeId], InvoiceDataItemTypeRef), values)
}

export type InvoiceDataItemParams = {


	amount: NumberString;
	itemType: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
}

export type InvoiceDataItem = {
	_type: TypeRef<InvoiceDataItem>;
	_original?: InvoiceDataItem

	_id: Id;
	amount: NumberString;
	itemType: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
}
export const InvoiceDataGetOutTypeRef: TypeRef<InvoiceDataGetOut> = new TypeRef("sys", 2170)

export function createInvoiceDataGetOut(values: InvoiceDataGetOutParams): InvoiceDataGetOut {
    return Object.assign(create(typeModels[InvoiceDataGetOutTypeRef.typeId], InvoiceDataGetOutTypeRef), values)
}

export type InvoiceDataGetOutParams = {


	invoiceId: Id;
	invoiceType: NumberString;
	date: Date;
	paymentMethod: NumberString;
	country: string;
	address: string;
	vatIdNumber: null | string;
	vatRate: NumberString;
	vat: NumberString;
	subTotal: NumberString;
	grandTotal: NumberString;
	vatType: NumberString;

	items: InvoiceDataItem[];
}

export type InvoiceDataGetOut = {
	_type: TypeRef<InvoiceDataGetOut>;
	_original?: InvoiceDataGetOut

	_format: NumberString;
	invoiceId: Id;
	invoiceType: NumberString;
	date: Date;
	paymentMethod: NumberString;
	country: string;
	address: string;
	vatIdNumber: null | string;
	vatRate: NumberString;
	vat: NumberString;
	subTotal: NumberString;
	grandTotal: NumberString;
	vatType: NumberString;

	items: InvoiceDataItem[];
}
export const InvoiceDataGetInTypeRef: TypeRef<InvoiceDataGetIn> = new TypeRef("sys", 2185)

export function createInvoiceDataGetIn(values: InvoiceDataGetInParams): InvoiceDataGetIn {
    return Object.assign(create(typeModels[InvoiceDataGetInTypeRef.typeId], InvoiceDataGetInTypeRef), values)
}

export type InvoiceDataGetInParams = {


	invoiceNumber: string;
}

export type InvoiceDataGetIn = {
	_type: TypeRef<InvoiceDataGetIn>;
	_original?: InvoiceDataGetIn

	_format: NumberString;
	invoiceNumber: string;
}
export const ChangeKdfPostInTypeRef: TypeRef<ChangeKdfPostIn> = new TypeRef("sys", 2198)

export function createChangeKdfPostIn(values: ChangeKdfPostInParams): ChangeKdfPostIn {
    return Object.assign(create(typeModels[ChangeKdfPostInTypeRef.typeId], ChangeKdfPostInTypeRef), values)
}

export type ChangeKdfPostInParams = {


	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	oldVerifier: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
}

export type ChangeKdfPostIn = {
	_type: TypeRef<ChangeKdfPostIn>;
	_original?: ChangeKdfPostIn

	_format: NumberString;
	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	oldVerifier: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
}
export const GroupKeyTypeRef: TypeRef<GroupKey> = new TypeRef("sys", 2255)

export function createGroupKey(values: GroupKeyParams): GroupKey {
    return Object.assign(create(typeModels[GroupKeyTypeRef.typeId], GroupKeyTypeRef), values)
}

export type GroupKeyParams = {


	ownerEncGKey: Uint8Array;
	adminGroupEncGKey: null | Uint8Array;
	adminGroupKeyVersion: null | NumberString;

	keyPair: null | KeyPair;
	pubAdminGroupEncGKey: null | PubEncKeyData;
}

export type GroupKey = {
	_type: TypeRef<GroupKey>;
	_original?: GroupKey

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	ownerEncGKey: Uint8Array;
	ownerKeyVersion: NumberString;
	adminGroupEncGKey: null | Uint8Array;
	adminGroupKeyVersion: null | NumberString;

	keyPair: null | KeyPair;
	pubAdminGroupEncGKey: null | PubEncKeyData;
}
export const GroupKeysRefTypeRef: TypeRef<GroupKeysRef> = new TypeRef("sys", 2267)

export function createGroupKeysRef(values: GroupKeysRefParams): GroupKeysRef {
    return Object.assign(create(typeModels[GroupKeysRefTypeRef.typeId], GroupKeysRefTypeRef), values)
}

export type GroupKeysRefParams = {



	list: Id;
}

export type GroupKeysRef = {
	_type: TypeRef<GroupKeysRef>;
	_original?: GroupKeysRef

	_id: Id;

	list: Id;
}
export const KeyRotationTypeRef: TypeRef<KeyRotation> = new TypeRef("sys", 2283)

export function createKeyRotation(values: KeyRotationParams): KeyRotation {
    return Object.assign(create(typeModels[KeyRotationTypeRef.typeId], KeyRotationTypeRef), values)
}

export type KeyRotationParams = {


	targetKeyVersion: NumberString;
	groupKeyRotationType: NumberString;

	adminPubKeyMac: null | KeyMac;
	distEncAdminGroupSymKey: null | PubEncKeyData;
	distKeyMac: null | KeyMac;
	adminDistKeyPair: null | KeyPair;
}

export type KeyRotation = {
	_type: TypeRef<KeyRotation>;
	_original?: KeyRotation

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	targetKeyVersion: NumberString;
	groupKeyRotationType: NumberString;

	adminPubKeyMac: null | KeyMac;
	distEncAdminGroupSymKey: null | PubEncKeyData;
	distKeyMac: null | KeyMac;
	adminDistKeyPair: null | KeyPair;
}
export const KeyRotationsRefTypeRef: TypeRef<KeyRotationsRef> = new TypeRef("sys", 2291)

export function createKeyRotationsRef(values: KeyRotationsRefParams): KeyRotationsRef {
    return Object.assign(create(typeModels[KeyRotationsRefTypeRef.typeId], KeyRotationsRefTypeRef), values)
}

export type KeyRotationsRefParams = {



	list: Id;
}

export type KeyRotationsRef = {
	_type: TypeRef<KeyRotationsRef>;
	_original?: KeyRotationsRef

	_id: Id;

	list: Id;
}
export const SurveyDataTypeRef: TypeRef<SurveyData> = new TypeRef("sys", 2295)

export function createSurveyData(values: SurveyDataParams): SurveyData {
    return Object.assign(create(typeModels[SurveyDataTypeRef.typeId], SurveyDataTypeRef), values)
}

export type SurveyDataParams = {


	category: NumberString;
	reason: NumberString;
	details: null | string;
	version: NumberString;
	clientVersion: string;
	clientPlatform: NumberString;
}

export type SurveyData = {
	_type: TypeRef<SurveyData>;
	_original?: SurveyData

	_id: Id;
	category: NumberString;
	reason: NumberString;
	details: null | string;
	version: NumberString;
	clientVersion: string;
	clientPlatform: NumberString;
}
export const IdTupleWrapperTypeRef: TypeRef<IdTupleWrapper> = new TypeRef("sys", 2315)

export function createIdTupleWrapper(values: IdTupleWrapperParams): IdTupleWrapper {
    return Object.assign(create(typeModels[IdTupleWrapperTypeRef.typeId], IdTupleWrapperTypeRef), values)
}

export type IdTupleWrapperParams = {


	listId: Id;
	listElementId: Id;
}

export type IdTupleWrapper = {
	_type: TypeRef<IdTupleWrapper>;
	_original?: IdTupleWrapper

	_id: Id;
	listId: Id;
	listElementId: Id;
}
export const UserGroupKeyDistributionTypeRef: TypeRef<UserGroupKeyDistribution> = new TypeRef("sys", 2320)

export function createUserGroupKeyDistribution(values: UserGroupKeyDistributionParams): UserGroupKeyDistribution {
    return Object.assign(create(typeModels[UserGroupKeyDistributionTypeRef.typeId], UserGroupKeyDistributionTypeRef), values)
}

export type UserGroupKeyDistributionParams = {


	distributionEncUserGroupKey: Uint8Array;
	userGroupKeyVersion: NumberString;
}

export type UserGroupKeyDistribution = {
	_type: TypeRef<UserGroupKeyDistribution>;
	_original?: UserGroupKeyDistribution

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	distributionEncUserGroupKey: Uint8Array;
	userGroupKeyVersion: NumberString;
}
export const GroupKeyRotationDataTypeRef: TypeRef<GroupKeyRotationData> = new TypeRef("sys", 2328)

export function createGroupKeyRotationData(values: GroupKeyRotationDataParams): GroupKeyRotationData {
    return Object.assign(create(typeModels[GroupKeyRotationDataTypeRef.typeId], GroupKeyRotationDataTypeRef), values)
}

export type GroupKeyRotationDataParams = {


	groupKeyVersion: NumberString;
	groupEncPreviousGroupKey: Uint8Array;
	adminGroupEncGroupKey: null | Uint8Array;
	adminGroupKeyVersion: null | NumberString;

	group: Id;
	keyPair: null | KeyPair;
	groupKeyUpdatesForMembers: GroupKeyUpdateData[];
	groupMembershipUpdateData: GroupMembershipUpdateData[];
}

export type GroupKeyRotationData = {
	_type: TypeRef<GroupKeyRotationData>;
	_original?: GroupKeyRotationData

	_id: Id;
	groupKeyVersion: NumberString;
	groupEncPreviousGroupKey: Uint8Array;
	adminGroupEncGroupKey: null | Uint8Array;
	adminGroupKeyVersion: null | NumberString;

	group: Id;
	keyPair: null | KeyPair;
	groupKeyUpdatesForMembers: GroupKeyUpdateData[];
	groupMembershipUpdateData: GroupMembershipUpdateData[];
}
export const GroupKeyRotationPostInTypeRef: TypeRef<GroupKeyRotationPostIn> = new TypeRef("sys", 2338)

export function createGroupKeyRotationPostIn(values: GroupKeyRotationPostInParams): GroupKeyRotationPostIn {
    return Object.assign(create(typeModels[GroupKeyRotationPostInTypeRef.typeId], GroupKeyRotationPostInTypeRef), values)
}

export type GroupKeyRotationPostInParams = {



	groupKeyUpdates: GroupKeyRotationData[];
}

export type GroupKeyRotationPostIn = {
	_type: TypeRef<GroupKeyRotationPostIn>;
	_original?: GroupKeyRotationPostIn

	_format: NumberString;

	groupKeyUpdates: GroupKeyRotationData[];
}
export const GroupKeyRotationInfoGetOutTypeRef: TypeRef<GroupKeyRotationInfoGetOut> = new TypeRef("sys", 2342)

export function createGroupKeyRotationInfoGetOut(values: GroupKeyRotationInfoGetOutParams): GroupKeyRotationInfoGetOut {
    return Object.assign(create(typeModels[GroupKeyRotationInfoGetOutTypeRef.typeId], GroupKeyRotationInfoGetOutTypeRef), values)
}

export type GroupKeyRotationInfoGetOutParams = {


	userOrAdminGroupKeyRotationScheduled: boolean;

	groupKeyUpdates: IdTuple[];
}

export type GroupKeyRotationInfoGetOut = {
	_type: TypeRef<GroupKeyRotationInfoGetOut>;
	_original?: GroupKeyRotationInfoGetOut

	_format: NumberString;
	userOrAdminGroupKeyRotationScheduled: boolean;

	groupKeyUpdates: IdTuple[];
}
export const RecoverCodeDataTypeRef: TypeRef<RecoverCodeData> = new TypeRef("sys", 2346)

export function createRecoverCodeData(values: RecoverCodeDataParams): RecoverCodeData {
    return Object.assign(create(typeModels[RecoverCodeDataTypeRef.typeId], RecoverCodeDataTypeRef), values)
}

export type RecoverCodeDataParams = {


	userKeyVersion: NumberString;
	recoveryCodeEncUserGroupKey: Uint8Array;
	userEncRecoveryCode: Uint8Array;
	recoveryCodeVerifier: Uint8Array;
}

export type RecoverCodeData = {
	_type: TypeRef<RecoverCodeData>;
	_original?: RecoverCodeData

	_id: Id;
	userKeyVersion: NumberString;
	recoveryCodeEncUserGroupKey: Uint8Array;
	userEncRecoveryCode: Uint8Array;
	recoveryCodeVerifier: Uint8Array;
}
export const UserGroupKeyRotationDataTypeRef: TypeRef<UserGroupKeyRotationData> = new TypeRef("sys", 2352)

export function createUserGroupKeyRotationData(values: UserGroupKeyRotationDataParams): UserGroupKeyRotationData {
    return Object.assign(create(typeModels[UserGroupKeyRotationDataTypeRef.typeId], UserGroupKeyRotationDataTypeRef), values)
}

export type UserGroupKeyRotationDataParams = {


	passphraseEncUserGroupKey: Uint8Array;
	distributionKeyEncUserGroupKey: Uint8Array;
	userGroupKeyVersion: NumberString;
	userGroupEncPreviousGroupKey: Uint8Array;
	adminGroupEncUserGroupKey: null | Uint8Array;
	adminGroupKeyVersion: NumberString;
	authVerifier: Uint8Array;
	userGroupEncAdminGroupKey: null | Uint8Array;

	keyPair: KeyPair;
	group: Id;
	recoverCodeData: null | RecoverCodeData;
	pubAdminGroupEncUserGroupKey: null | PubEncKeyData;
}

export type UserGroupKeyRotationData = {
	_type: TypeRef<UserGroupKeyRotationData>;
	_original?: UserGroupKeyRotationData

	_id: Id;
	passphraseEncUserGroupKey: Uint8Array;
	distributionKeyEncUserGroupKey: Uint8Array;
	userGroupKeyVersion: NumberString;
	userGroupEncPreviousGroupKey: Uint8Array;
	adminGroupEncUserGroupKey: null | Uint8Array;
	adminGroupKeyVersion: NumberString;
	authVerifier: Uint8Array;
	userGroupEncAdminGroupKey: null | Uint8Array;

	keyPair: KeyPair;
	group: Id;
	recoverCodeData: null | RecoverCodeData;
	pubAdminGroupEncUserGroupKey: null | PubEncKeyData;
}
export const AdminGroupKeyRotationPostInTypeRef: TypeRef<AdminGroupKeyRotationPostIn> = new TypeRef("sys", 2364)

export function createAdminGroupKeyRotationPostIn(values: AdminGroupKeyRotationPostInParams): AdminGroupKeyRotationPostIn {
    return Object.assign(create(typeModels[AdminGroupKeyRotationPostInTypeRef.typeId], AdminGroupKeyRotationPostInTypeRef), values)
}

export type AdminGroupKeyRotationPostInParams = {



	adminGroupKeyData: GroupKeyRotationData;
	userGroupKeyData: UserGroupKeyRotationData;
	adminPubKeyMacList: KeyMac[];
	distribution: AdminGroupKeyDistributionElement[];
}

export type AdminGroupKeyRotationPostIn = {
	_type: TypeRef<AdminGroupKeyRotationPostIn>;
	_original?: AdminGroupKeyRotationPostIn

	_format: NumberString;

	adminGroupKeyData: GroupKeyRotationData;
	userGroupKeyData: UserGroupKeyRotationData;
	adminPubKeyMacList: KeyMac[];
	distribution: AdminGroupKeyDistributionElement[];
}
export const GroupKeyUpdateTypeRef: TypeRef<GroupKeyUpdate> = new TypeRef("sys", 2369)

export function createGroupKeyUpdate(values: GroupKeyUpdateParams): GroupKeyUpdate {
    return Object.assign(create(typeModels[GroupKeyUpdateTypeRef.typeId], GroupKeyUpdateTypeRef), values)
}

export type GroupKeyUpdateParams = {


	groupKey: Uint8Array;
	groupKeyVersion: NumberString;

	bucketKey: BucketKey;
}

export type GroupKeyUpdate = {
	_type: TypeRef<GroupKeyUpdate>;
	_errors: Object;
	_original?: GroupKeyUpdate

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	groupKey: Uint8Array;
	groupKeyVersion: NumberString;
	_kdfNonce: null | Uint8Array;

	bucketKey: BucketKey;
}
export const GroupKeyUpdatesRefTypeRef: TypeRef<GroupKeyUpdatesRef> = new TypeRef("sys", 2380)

export function createGroupKeyUpdatesRef(values: GroupKeyUpdatesRefParams): GroupKeyUpdatesRef {
    return Object.assign(create(typeModels[GroupKeyUpdatesRefTypeRef.typeId], GroupKeyUpdatesRefTypeRef), values)
}

export type GroupKeyUpdatesRefParams = {



	list: Id;
}

export type GroupKeyUpdatesRef = {
	_type: TypeRef<GroupKeyUpdatesRef>;
	_original?: GroupKeyUpdatesRef

	_id: Id;

	list: Id;
}
export const PubEncKeyDataTypeRef: TypeRef<PubEncKeyData> = new TypeRef("sys", 2384)

export function createPubEncKeyData(values: PubEncKeyDataParams): PubEncKeyData {
    return Object.assign(create(typeModels[PubEncKeyDataTypeRef.typeId], PubEncKeyDataTypeRef), values)
}

export type PubEncKeyDataParams = {


	recipientIdentifier: string;
	pubEncSymKey: Uint8Array;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;
	protocolVersion: NumberString;
	recipientIdentifierType: NumberString;
	senderIdentifier: null | string;
	senderIdentifierType: null | NumberString;

	symKeyMac: null | KeyMac;
}

export type PubEncKeyData = {
	_type: TypeRef<PubEncKeyData>;
	_original?: PubEncKeyData

	_id: Id;
	recipientIdentifier: string;
	pubEncSymKey: Uint8Array;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;
	protocolVersion: NumberString;
	recipientIdentifierType: NumberString;
	senderIdentifier: null | string;
	senderIdentifierType: null | NumberString;

	symKeyMac: null | KeyMac;
}
export const GroupKeyUpdateDataTypeRef: TypeRef<GroupKeyUpdateData> = new TypeRef("sys", 2391)

export function createGroupKeyUpdateData(values: GroupKeyUpdateDataParams): GroupKeyUpdateData {
    return Object.assign(create(typeModels[GroupKeyUpdateDataTypeRef.typeId], GroupKeyUpdateDataTypeRef), values)
}

export type GroupKeyUpdateDataParams = {


	sessionKeyEncGroupKeyVersion: NumberString;
	sessionKeyEncGroupKey: Uint8Array;
	bucketKeyEncSessionKey: Uint8Array;

	pubEncBucketKeyData: PubEncKeyData;
}

export type GroupKeyUpdateData = {
	_type: TypeRef<GroupKeyUpdateData>;
	_original?: GroupKeyUpdateData

	_id: Id;
	sessionKeyEncGroupKeyVersion: NumberString;
	sessionKeyEncGroupKey: Uint8Array;
	bucketKeyEncSessionKey: Uint8Array;

	pubEncBucketKeyData: PubEncKeyData;
}
export const GroupMembershipKeyDataTypeRef: TypeRef<GroupMembershipKeyData> = new TypeRef("sys", 2398)

export function createGroupMembershipKeyData(values: GroupMembershipKeyDataParams): GroupMembershipKeyData {
    return Object.assign(create(typeModels[GroupMembershipKeyDataTypeRef.typeId], GroupMembershipKeyDataTypeRef), values)
}

export type GroupMembershipKeyDataParams = {


	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;
	symEncGKey: Uint8Array;

	group: Id;
}

export type GroupMembershipKeyData = {
	_type: TypeRef<GroupMembershipKeyData>;
	_original?: GroupMembershipKeyData

	_id: Id;
	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;
	symEncGKey: Uint8Array;

	group: Id;
}
export const MembershipPutInTypeRef: TypeRef<MembershipPutIn> = new TypeRef("sys", 2404)

export function createMembershipPutIn(values: MembershipPutInParams): MembershipPutIn {
    return Object.assign(create(typeModels[MembershipPutInTypeRef.typeId], MembershipPutInTypeRef), values)
}

export type MembershipPutInParams = {



	groupKeyUpdates: GroupMembershipKeyData[];
}

export type MembershipPutIn = {
	_type: TypeRef<MembershipPutIn>;
	_original?: MembershipPutIn

	_format: NumberString;

	groupKeyUpdates: GroupMembershipKeyData[];
}
export const GroupMembershipUpdateDataTypeRef: TypeRef<GroupMembershipUpdateData> = new TypeRef("sys", 2427)

export function createGroupMembershipUpdateData(values: GroupMembershipUpdateDataParams): GroupMembershipUpdateData {
    return Object.assign(create(typeModels[GroupMembershipUpdateDataTypeRef.typeId], GroupMembershipUpdateDataTypeRef), values)
}

export type GroupMembershipUpdateDataParams = {


	userEncGroupKey: Uint8Array;
	userKeyVersion: NumberString;

	userId: Id;
}

export type GroupMembershipUpdateData = {
	_type: TypeRef<GroupMembershipUpdateData>;
	_original?: GroupMembershipUpdateData

	_id: Id;
	userEncGroupKey: Uint8Array;
	userKeyVersion: NumberString;

	userId: Id;
}
export const AffiliatePartnerKpiMonthSummaryTypeRef: TypeRef<AffiliatePartnerKpiMonthSummary> = new TypeRef("sys", 2453)

export function createAffiliatePartnerKpiMonthSummary(values: AffiliatePartnerKpiMonthSummaryParams): AffiliatePartnerKpiMonthSummary {
    return Object.assign(create(typeModels[AffiliatePartnerKpiMonthSummaryTypeRef.typeId], AffiliatePartnerKpiMonthSummaryTypeRef), values)
}

export type AffiliatePartnerKpiMonthSummaryParams = {


	monthTimestamp: NumberString;
	newFree: NumberString;
	newPaid: NumberString;
	totalFree: NumberString;
	totalPaid: NumberString;
	commission: NumberString;
}

export type AffiliatePartnerKpiMonthSummary = {
	_type: TypeRef<AffiliatePartnerKpiMonthSummary>;
	_original?: AffiliatePartnerKpiMonthSummary

	_id: Id;
	monthTimestamp: NumberString;
	newFree: NumberString;
	newPaid: NumberString;
	totalFree: NumberString;
	totalPaid: NumberString;
	commission: NumberString;
}
export const AffiliatePartnerKpiServiceGetOutTypeRef: TypeRef<AffiliatePartnerKpiServiceGetOut> = new TypeRef("sys", 2461)

export function createAffiliatePartnerKpiServiceGetOut(values: AffiliatePartnerKpiServiceGetOutParams): AffiliatePartnerKpiServiceGetOut {
    return Object.assign(create(typeModels[AffiliatePartnerKpiServiceGetOutTypeRef.typeId], AffiliatePartnerKpiServiceGetOutTypeRef), values)
}

export type AffiliatePartnerKpiServiceGetOutParams = {


	promotionId: string;
	accumulatedCommission: NumberString;
	creditedCommission: NumberString;

	kpis: AffiliatePartnerKpiMonthSummary[];
}

export type AffiliatePartnerKpiServiceGetOut = {
	_type: TypeRef<AffiliatePartnerKpiServiceGetOut>;
	_original?: AffiliatePartnerKpiServiceGetOut

	_format: NumberString;
	promotionId: string;
	accumulatedCommission: NumberString;
	creditedCommission: NumberString;

	kpis: AffiliatePartnerKpiMonthSummary[];
}
export const UserGroupKeyRotationPostInTypeRef: TypeRef<UserGroupKeyRotationPostIn> = new TypeRef("sys", 2471)

export function createUserGroupKeyRotationPostIn(values: UserGroupKeyRotationPostInParams): UserGroupKeyRotationPostIn {
    return Object.assign(create(typeModels[UserGroupKeyRotationPostInTypeRef.typeId], UserGroupKeyRotationPostInTypeRef), values)
}

export type UserGroupKeyRotationPostInParams = {



	userGroupKeyData: UserGroupKeyRotationData;
}

export type UserGroupKeyRotationPostIn = {
	_type: TypeRef<UserGroupKeyRotationPostIn>;
	_original?: UserGroupKeyRotationPostIn

	_format: NumberString;

	userGroupKeyData: UserGroupKeyRotationData;
}
export const KeyMacTypeRef: TypeRef<KeyMac> = new TypeRef("sys", 2477)

export function createKeyMac(values: KeyMacParams): KeyMac {
    return Object.assign(create(typeModels[KeyMacTypeRef.typeId], KeyMacTypeRef), values)
}

export type KeyMacParams = {


	taggedKeyVersion: NumberString;
	tag: Uint8Array;
	taggingKeyVersion: NumberString;

	taggingGroup: Id;
}

export type KeyMac = {
	_type: TypeRef<KeyMac>;
	_original?: KeyMac

	_id: Id;
	taggedKeyVersion: NumberString;
	tag: Uint8Array;
	taggingKeyVersion: NumberString;

	taggingGroup: Id;
}
export const AppStoreSubscriptionGetOutTypeRef: TypeRef<AppStoreSubscriptionGetOut> = new TypeRef("sys", 2497)

export function createAppStoreSubscriptionGetOut(values: AppStoreSubscriptionGetOutParams): AppStoreSubscriptionGetOut {
    return Object.assign(create(typeModels[AppStoreSubscriptionGetOutTypeRef.typeId], AppStoreSubscriptionGetOutTypeRef), values)
}

export type AppStoreSubscriptionGetOutParams = {


	app: NumberString;
}

export type AppStoreSubscriptionGetOut = {
	_type: TypeRef<AppStoreSubscriptionGetOut>;
	_original?: AppStoreSubscriptionGetOut

	_format: NumberString;
	app: NumberString;
}
export const AppStoreSubscriptionGetInTypeRef: TypeRef<AppStoreSubscriptionGetIn> = new TypeRef("sys", 2500)

export function createAppStoreSubscriptionGetIn(values: AppStoreSubscriptionGetInParams): AppStoreSubscriptionGetIn {
    return Object.assign(create(typeModels[AppStoreSubscriptionGetInTypeRef.typeId], AppStoreSubscriptionGetInTypeRef), values)
}

export type AppStoreSubscriptionGetInParams = {


	subscriptionId: string;
}

export type AppStoreSubscriptionGetIn = {
	_type: TypeRef<AppStoreSubscriptionGetIn>;
	_original?: AppStoreSubscriptionGetIn

	_format: NumberString;
	subscriptionId: string;
}
export const VerifierTokenServiceOutTypeRef: TypeRef<VerifierTokenServiceOut> = new TypeRef("sys", 2510)

export function createVerifierTokenServiceOut(values: VerifierTokenServiceOutParams): VerifierTokenServiceOut {
    return Object.assign(create(typeModels[VerifierTokenServiceOutTypeRef.typeId], VerifierTokenServiceOutTypeRef), values)
}

export type VerifierTokenServiceOutParams = {


	token: string;
}

export type VerifierTokenServiceOut = {
	_type: TypeRef<VerifierTokenServiceOut>;
	_original?: VerifierTokenServiceOut

	_format: NumberString;
	token: string;
}
export const VerifierTokenServiceInTypeRef: TypeRef<VerifierTokenServiceIn> = new TypeRef("sys", 2517)

export function createVerifierTokenServiceIn(values: VerifierTokenServiceInParams): VerifierTokenServiceIn {
    return Object.assign(create(typeModels[VerifierTokenServiceInTypeRef.typeId], VerifierTokenServiceInTypeRef), values)
}

export type VerifierTokenServiceInParams = {


	authVerifier: Uint8Array;
}

export type VerifierTokenServiceIn = {
	_type: TypeRef<VerifierTokenServiceIn>;
	_original?: VerifierTokenServiceIn

	_format: NumberString;
	authVerifier: Uint8Array;
}
export const CalendarAdvancedRepeatRuleTypeRef: TypeRef<CalendarAdvancedRepeatRule> = new TypeRef("sys", 2521)

export function createCalendarAdvancedRepeatRule(values: CalendarAdvancedRepeatRuleParams): CalendarAdvancedRepeatRule {
    return Object.assign(create(typeModels[CalendarAdvancedRepeatRuleTypeRef.typeId], CalendarAdvancedRepeatRuleTypeRef), values)
}

export type CalendarAdvancedRepeatRuleParams = {


	ruleType: NumberString;
	interval: string;
}

export type CalendarAdvancedRepeatRule = {
	_type: TypeRef<CalendarAdvancedRepeatRule>;
	_original?: CalendarAdvancedRepeatRule

	_id: Id;
	ruleType: NumberString;
	interval: string;
}
export const AdminGroupKeyDistributionElementTypeRef: TypeRef<AdminGroupKeyDistributionElement> = new TypeRef("sys", 2531)

export function createAdminGroupKeyDistributionElement(values: AdminGroupKeyDistributionElementParams): AdminGroupKeyDistributionElement {
    return Object.assign(create(typeModels[AdminGroupKeyDistributionElementTypeRef.typeId], AdminGroupKeyDistributionElementTypeRef), values)
}

export type AdminGroupKeyDistributionElementParams = {



	userGroupId: Id;
	distEncAdminGroupKey: PubEncKeyData;
}

export type AdminGroupKeyDistributionElement = {
	_type: TypeRef<AdminGroupKeyDistributionElement>;
	_original?: AdminGroupKeyDistributionElement

	_id: Id;

	userGroupId: Id;
	distEncAdminGroupKey: PubEncKeyData;
}
export const AdminGroupKeyRotationPutInTypeRef: TypeRef<AdminGroupKeyRotationPutIn> = new TypeRef("sys", 2536)

export function createAdminGroupKeyRotationPutIn(values: AdminGroupKeyRotationPutInParams): AdminGroupKeyRotationPutIn {
    return Object.assign(create(typeModels[AdminGroupKeyRotationPutInTypeRef.typeId], AdminGroupKeyRotationPutInTypeRef), values)
}

export type AdminGroupKeyRotationPutInParams = {



	distKeyMac: KeyMac;
	adminDistKeyPair: KeyPair;
}

export type AdminGroupKeyRotationPutIn = {
	_type: TypeRef<AdminGroupKeyRotationPutIn>;
	_original?: AdminGroupKeyRotationPutIn

	_format: NumberString;

	distKeyMac: KeyMac;
	adminDistKeyPair: KeyPair;
}
export const PubDistributionKeyTypeRef: TypeRef<PubDistributionKey> = new TypeRef("sys", 2540)

export function createPubDistributionKey(values: PubDistributionKeyParams): PubDistributionKey {
    return Object.assign(create(typeModels[PubDistributionKeyTypeRef.typeId], PubDistributionKeyTypeRef), values)
}

export type PubDistributionKeyParams = {


	pubEccKey: Uint8Array;
	pubKyberKey: Uint8Array;

	userGroupId: Id;
	pubKeyMac: KeyMac;
}

export type PubDistributionKey = {
	_type: TypeRef<PubDistributionKey>;
	_original?: PubDistributionKey

	_id: Id;
	pubEccKey: Uint8Array;
	pubKyberKey: Uint8Array;

	userGroupId: Id;
	pubKeyMac: KeyMac;
}
export const AdminGroupKeyRotationGetOutTypeRef: TypeRef<AdminGroupKeyRotationGetOut> = new TypeRef("sys", 2546)

export function createAdminGroupKeyRotationGetOut(values: AdminGroupKeyRotationGetOutParams): AdminGroupKeyRotationGetOut {
    return Object.assign(create(typeModels[AdminGroupKeyRotationGetOutTypeRef.typeId], AdminGroupKeyRotationGetOutTypeRef), values)
}

export type AdminGroupKeyRotationGetOutParams = {



	userGroupIdsMissingDistributionKeys: Id[];
	distributionKeys: PubDistributionKey[];
}

export type AdminGroupKeyRotationGetOut = {
	_type: TypeRef<AdminGroupKeyRotationGetOut>;
	_original?: AdminGroupKeyRotationGetOut

	_format: NumberString;

	userGroupIdsMissingDistributionKeys: Id[];
	distributionKeys: PubDistributionKey[];
}
export const SurveyDataPostInTypeRef: TypeRef<SurveyDataPostIn> = new TypeRef("sys", 2563)

export function createSurveyDataPostIn(values: SurveyDataPostInParams): SurveyDataPostIn {
    return Object.assign(create(typeModels[SurveyDataPostInTypeRef.typeId], SurveyDataPostInTypeRef), values)
}

export type SurveyDataPostInParams = {



	surveyData: SurveyData;
}

export type SurveyDataPostIn = {
	_type: TypeRef<SurveyDataPostIn>;
	_original?: SurveyDataPostIn

	_format: NumberString;

	surveyData: SurveyData;
}
export const PatchTypeRef: TypeRef<Patch> = new TypeRef("sys", 2567)

export function createPatch(values: PatchParams): Patch {
    return Object.assign(create(typeModels[PatchTypeRef.typeId], PatchTypeRef), values)
}

export type PatchParams = {


	patchOperation: NumberString;
	attributePath: string;
	value: null | string;
}

export type Patch = {
	_type: TypeRef<Patch>;
	_original?: Patch

	_id: Id;
	patchOperation: NumberString;
	attributePath: string;
	value: null | string;
}
export const IdentityKeyPairTypeRef: TypeRef<IdentityKeyPair> = new TypeRef("sys", 2575)

export function createIdentityKeyPair(values: IdentityKeyPairParams): IdentityKeyPair {
    return Object.assign(create(typeModels[IdentityKeyPairTypeRef.typeId], IdentityKeyPairTypeRef), values)
}

export type IdentityKeyPairParams = {


	identityKeyVersion: NumberString;
	encryptingKeyVersion: NumberString;
	publicEd25519Key: Uint8Array;
	privateEd25519Key: Uint8Array;

	publicKeyMac: KeyMac;
}

export type IdentityKeyPair = {
	_type: TypeRef<IdentityKeyPair>;
	_original?: IdentityKeyPair

	_id: Id;
	identityKeyVersion: NumberString;
	encryptingKeyVersion: NumberString;
	publicEd25519Key: Uint8Array;
	privateEd25519Key: Uint8Array;

	publicKeyMac: KeyMac;
}
export const PublicKeySignatureTypeRef: TypeRef<PublicKeySignature> = new TypeRef("sys", 2582)

export function createPublicKeySignature(values: PublicKeySignatureParams): PublicKeySignature {
    return Object.assign(create(typeModels[PublicKeySignatureTypeRef.typeId], PublicKeySignatureTypeRef), values)
}

export type PublicKeySignatureParams = {


	signature: Uint8Array;
	signingKeyVersion: NumberString;
	signatureType: NumberString;
	publicKeyVersion: NumberString;
}

export type PublicKeySignature = {
	_type: TypeRef<PublicKeySignature>;
	_original?: PublicKeySignature

	_id: Id;
	signature: Uint8Array;
	signingKeyVersion: NumberString;
	signatureType: NumberString;
	publicKeyVersion: NumberString;
}
export const IdentityKeyGetInTypeRef: TypeRef<IdentityKeyGetIn> = new TypeRef("sys", 2590)

export function createIdentityKeyGetIn(values: IdentityKeyGetInParams): IdentityKeyGetIn {
    return Object.assign(create(typeModels[IdentityKeyGetInTypeRef.typeId], IdentityKeyGetInTypeRef), values)
}

export type IdentityKeyGetInParams = {


	version: null | NumberString;
	identifierType: NumberString;
	identifier: string;
}

export type IdentityKeyGetIn = {
	_type: TypeRef<IdentityKeyGetIn>;
	_original?: IdentityKeyGetIn

	_format: NumberString;
	version: null | NumberString;
	identifierType: NumberString;
	identifier: string;
}
export const IdentityKeyGetOutTypeRef: TypeRef<IdentityKeyGetOut> = new TypeRef("sys", 2595)

export function createIdentityKeyGetOut(values: IdentityKeyGetOutParams): IdentityKeyGetOut {
    return Object.assign(create(typeModels[IdentityKeyGetOutTypeRef.typeId], IdentityKeyGetOutTypeRef), values)
}

export type IdentityKeyGetOutParams = {


	publicIdentityKey: Uint8Array;
	publicIdentityKeyVersion: NumberString;
}

export type IdentityKeyGetOut = {
	_type: TypeRef<IdentityKeyGetOut>;
	_original?: IdentityKeyGetOut

	_format: NumberString;
	publicIdentityKey: Uint8Array;
	publicIdentityKeyVersion: NumberString;
}
export const IdentityKeyPostInTypeRef: TypeRef<IdentityKeyPostIn> = new TypeRef("sys", 2599)

export function createIdentityKeyPostIn(values: IdentityKeyPostInParams): IdentityKeyPostIn {
    return Object.assign(create(typeModels[IdentityKeyPostInTypeRef.typeId], IdentityKeyPostInTypeRef), values)
}

export type IdentityKeyPostInParams = {



	identityKeyPair: IdentityKeyPair;
	signatures: PublicKeySignature[];
}

export type IdentityKeyPostIn = {
	_type: TypeRef<IdentityKeyPostIn>;
	_original?: IdentityKeyPostIn

	_format: NumberString;

	identityKeyPair: IdentityKeyPair;
	signatures: PublicKeySignature[];
}
export const RolloutTypeRef: TypeRef<Rollout> = new TypeRef("sys", 2604)

export function createRollout(values: RolloutParams): Rollout {
    return Object.assign(create(typeModels[RolloutTypeRef.typeId], RolloutTypeRef), values)
}

export type RolloutParams = {


	rolloutType: NumberString;
}

export type Rollout = {
	_type: TypeRef<Rollout>;
	_original?: Rollout

	_id: Id;
	rolloutType: NumberString;
}
export const RolloutGetOutTypeRef: TypeRef<RolloutGetOut> = new TypeRef("sys", 2607)

export function createRolloutGetOut(values: RolloutGetOutParams): RolloutGetOut {
    return Object.assign(create(typeModels[RolloutGetOutTypeRef.typeId], RolloutGetOutTypeRef), values)
}

export type RolloutGetOutParams = {



	rollouts: Rollout[];
}

export type RolloutGetOut = {
	_type: TypeRef<RolloutGetOut>;
	_original?: RolloutGetOut

	_format: NumberString;

	rollouts: Rollout[];
}
export const PatchListTypeRef: TypeRef<PatchList> = new TypeRef("sys", 2614)

export function createPatchList(values: PatchListParams): PatchList {
    return Object.assign(create(typeModels[PatchListTypeRef.typeId], PatchListTypeRef), values)
}

export type PatchListParams = {



	patches: Patch[];
}

export type PatchList = {
	_type: TypeRef<PatchList>;
	_original?: PatchList

	_id: Id;

	patches: Patch[];
}
export const CaptchaChallengeTypeRef: TypeRef<CaptchaChallenge> = new TypeRef("sys", 2619)

export function createCaptchaChallenge(values: CaptchaChallengeParams): CaptchaChallenge {
    return Object.assign(create(typeModels[CaptchaChallengeTypeRef.typeId], CaptchaChallengeTypeRef), values)
}

export type CaptchaChallengeParams = {


	challenge: Uint8Array;
	description: string;
}

export type CaptchaChallenge = {
	_type: TypeRef<CaptchaChallenge>;
	_original?: CaptchaChallenge

	_id: Id;
	challenge: Uint8Array;
	description: string;
}
export const TimelockCaptchaGetInTypeRef: TypeRef<TimelockCaptchaGetIn> = new TypeRef("sys", 2629)

export function createTimelockCaptchaGetIn(values: TimelockCaptchaGetInParams): TimelockCaptchaGetIn {
    return Object.assign(create(typeModels[TimelockCaptchaGetInTypeRef.typeId], TimelockCaptchaGetInTypeRef), values)
}

export type TimelockCaptchaGetInParams = {


	signupToken: string;
	timeToSolveCalibrationChallenge: null | NumberString;

	deviceInfo: null | ClientPerformanceInfo;
}

export type TimelockCaptchaGetIn = {
	_type: TypeRef<TimelockCaptchaGetIn>;
	_original?: TimelockCaptchaGetIn

	_format: NumberString;
	signupToken: string;
	timeToSolveCalibrationChallenge: null | NumberString;

	deviceInfo: null | ClientPerformanceInfo;
}
export const TimelockCaptchaGetOutTypeRef: TypeRef<TimelockCaptchaGetOut> = new TypeRef("sys", 2632)

export function createTimelockCaptchaGetOut(values: TimelockCaptchaGetOutParams): TimelockCaptchaGetOut {
    return Object.assign(create(typeModels[TimelockCaptchaGetOutTypeRef.typeId], TimelockCaptchaGetOutTypeRef), values)
}

export type TimelockCaptchaGetOutParams = {


	difficulty: string;
	modulus: string;
	base: string;
}

export type TimelockCaptchaGetOut = {
	_type: TypeRef<TimelockCaptchaGetOut>;
	_original?: TimelockCaptchaGetOut

	_format: NumberString;
	difficulty: string;
	modulus: string;
	base: string;
}
export const ClientPerformanceInfoTypeRef: TypeRef<ClientPerformanceInfo> = new TypeRef("sys", 2641)

export function createClientPerformanceInfo(values: ClientPerformanceInfoParams): ClientPerformanceInfo {
    return Object.assign(create(typeModels[ClientPerformanceInfoTypeRef.typeId], ClientPerformanceInfoTypeRef), values)
}

export type ClientPerformanceInfoParams = {


	isAutomatedBrowser: boolean;
}

export type ClientPerformanceInfo = {
	_type: TypeRef<ClientPerformanceInfo>;
	_original?: ClientPerformanceInfo

	_id: Id;
	isAutomatedBrowser: boolean;
}
export const AbuseInfoTypeRef: TypeRef<AbuseInfo> = new TypeRef("sys", 2650)

export function createAbuseInfo(values: AbuseInfoParams): AbuseInfo {
    return Object.assign(create(typeModels[AbuseInfoTypeRef.typeId], AbuseInfoTypeRef), values)
}

export type AbuseInfoParams = {


	criterion: string;
	value: string;
}

export type AbuseInfo = {
	_type: TypeRef<AbuseInfo>;
	_original?: AbuseInfo

	_id: Id;
	criterion: string;
	value: string;
}
export const PartnerManagedCustomerTypeRef: TypeRef<PartnerManagedCustomer> = new TypeRef("sys", 2672)

export function createPartnerManagedCustomer(values: PartnerManagedCustomerParams): PartnerManagedCustomer {
    return Object.assign(create(typeModels[PartnerManagedCustomerTypeRef.typeId], PartnerManagedCustomerTypeRef), values)
}

export type PartnerManagedCustomerParams = {



	customerInfo: IdTuple;
}

export type PartnerManagedCustomer = {
	_type: TypeRef<PartnerManagedCustomer>;
	_errors: Object;
	_original?: PartnerManagedCustomer

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	customerInfo: IdTuple;
}
export const AdAttributionTypeRef: TypeRef<AdAttribution> = new TypeRef("sys", 2684)

export function createAdAttribution(values: AdAttributionParams): AdAttribution {
    return Object.assign(create(typeModels[AdAttributionTypeRef.typeId], AdAttributionTypeRef), values)
}

export type AdAttributionParams = {


	attributionId: string;
	attributionType: NumberString;
}

export type AdAttribution = {
	_type: TypeRef<AdAttribution>;
	_original?: AdAttribution

	_id: Id;
	attributionId: string;
	attributionType: NumberString;
}
export const OperationStatusUpdateTypeRef: TypeRef<OperationStatusUpdate> = new TypeRef("sys", 2692)

export function createOperationStatusUpdate(values: OperationStatusUpdateParams): OperationStatusUpdate {
    return Object.assign(create(typeModels[OperationStatusUpdateTypeRef.typeId], OperationStatusUpdateTypeRef), values)
}

export type OperationStatusUpdateParams = {


	applicationVersionSum: NumberString;
	applicationTypesHash: string;
	operationId: Id;
	status: NumberString;
	statusCode: null | NumberString;
	reason: null | string;
}

export type OperationStatusUpdate = {
	_type: TypeRef<OperationStatusUpdate>;
	_original?: OperationStatusUpdate

	_format: NumberString;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;
	operationId: Id;
	status: NumberString;
	statusCode: null | NumberString;
	reason: null | string;
}
export const UserAlarmInfoDataTypeRef: TypeRef<UserAlarmInfoData> = new TypeRef("sys", 2722)

export function createUserAlarmInfoData(values: UserAlarmInfoDataParams): UserAlarmInfoData {
    return Object.assign(create(typeModels[UserAlarmInfoDataTypeRef.typeId], UserAlarmInfoDataTypeRef), values)
}

export type UserAlarmInfoDataParams = {


	encryptedTrigger: Uint8Array;
	alarmIdentifier: string;

	ownerGroup: Id;
	calendarEventRef: CalendarEventRef;
}

export type UserAlarmInfoData = {
	_type: TypeRef<UserAlarmInfoData>;
	_original?: UserAlarmInfoData

	_id: Id;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	encryptedTrigger: Uint8Array;
	alarmIdentifier: string;

	ownerGroup: Id;
	calendarEventRef: CalendarEventRef;
}
export const SubscriptionReferenceTypeRef: TypeRef<SubscriptionReference> = new TypeRef("sys", 2733)

export function createSubscriptionReference(values: SubscriptionReferenceParams): SubscriptionReference {
    return Object.assign(create(typeModels[SubscriptionReferenceTypeRef.typeId], SubscriptionReferenceTypeRef), values)
}

export type SubscriptionReferenceParams = {


	subscriptionProvider: NumberString;
	foreignKey: null | string;
	subscriptionApp: NumberString;
}

export type SubscriptionReference = {
	_type: TypeRef<SubscriptionReference>;
	_original?: SubscriptionReference

	_id: Id;
	subscriptionProvider: NumberString;
	foreignKey: null | string;
	subscriptionApp: NumberString;
}
export const RenewalPreferenceServicePostInTypeRef: TypeRef<RenewalPreferenceServicePostIn> = new TypeRef("sys", 2740)

export function createRenewalPreferenceServicePostIn(values: RenewalPreferenceServicePostInParams): RenewalPreferenceServicePostIn {
    return Object.assign(create(typeModels[RenewalPreferenceServicePostInTypeRef.typeId], RenewalPreferenceServicePostInTypeRef), values)
}

export type RenewalPreferenceServicePostInParams = {


	isEnabled: boolean;
	customerId: Id;
}

export type RenewalPreferenceServicePostIn = {
	_type: TypeRef<RenewalPreferenceServicePostIn>;
	_original?: RenewalPreferenceServicePostIn

	_format: NumberString;
	isEnabled: boolean;
	customerId: Id;
}
export const InstanceKdfNonceTypeRef: TypeRef<InstanceKdfNonce> = new TypeRef("sys", 2746)

export function createInstanceKdfNonce(values: InstanceKdfNonceParams): InstanceKdfNonce {
    return Object.assign(create(typeModels[InstanceKdfNonceTypeRef.typeId], InstanceKdfNonceTypeRef), values)
}

export type InstanceKdfNonceParams = {


	instanceList: null | Id;
	instanceId: Id;
	kdfNonce: Uint8Array;

	typeInfo: TypeInfo;
}

export type InstanceKdfNonce = {
	_type: TypeRef<InstanceKdfNonce>;
	_original?: InstanceKdfNonce

	_id: Id;
	instanceList: null | Id;
	instanceId: Id;
	kdfNonce: Uint8Array;

	typeInfo: TypeInfo;
}
export const UpdateKdfNoncePostInTypeRef: TypeRef<UpdateKdfNoncePostIn> = new TypeRef("sys", 2752)

export function createUpdateKdfNoncePostIn(values: UpdateKdfNoncePostInParams): UpdateKdfNoncePostIn {
    return Object.assign(create(typeModels[UpdateKdfNoncePostInTypeRef.typeId], UpdateKdfNoncePostInTypeRef), values)
}

export type UpdateKdfNoncePostInParams = {



	instanceKdfNonce: InstanceKdfNonce;
}

export type UpdateKdfNoncePostIn = {
	_type: TypeRef<UpdateKdfNoncePostIn>;
	_original?: UpdateKdfNoncePostIn

	_format: NumberString;

	instanceKdfNonce: InstanceKdfNonce;
}
export const UpdateKdfNoncePostOutTypeRef: TypeRef<UpdateKdfNoncePostOut> = new TypeRef("sys", 2755)

export function createUpdateKdfNoncePostOut(values: UpdateKdfNoncePostOutParams): UpdateKdfNoncePostOut {
    return Object.assign(create(typeModels[UpdateKdfNoncePostOutTypeRef.typeId], UpdateKdfNoncePostOutTypeRef), values)
}

export type UpdateKdfNoncePostOutParams = {


	kdfNonce: Uint8Array;
}

export type UpdateKdfNoncePostOut = {
	_type: TypeRef<UpdateKdfNoncePostOut>;
	_original?: UpdateKdfNoncePostOut

	_format: NumberString;
	kdfNonce: Uint8Array;
}
export const SubscriptionRevocationRequestTypeRef: TypeRef<SubscriptionRevocationRequest> = new TypeRef("sys", 2759)

export function createSubscriptionRevocationRequest(values: SubscriptionRevocationRequestParams): SubscriptionRevocationRequest {
    return Object.assign(create(typeModels[SubscriptionRevocationRequestTypeRef.typeId], SubscriptionRevocationRequestTypeRef), values)
}

export type SubscriptionRevocationRequestParams = {


	revocationRequestDate: Date;
	isRefundProcessed: boolean;
	latestDowngradeFailedNotification: null | Date;
	downgradeGracePeriodEnd: null | Date;

	customer: Id;
}

export type SubscriptionRevocationRequest = {
	_type: TypeRef<SubscriptionRevocationRequest>;
	_original?: SubscriptionRevocationRequest

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	revocationRequestDate: Date;
	isRefundProcessed: boolean;
	latestDowngradeFailedNotification: null | Date;
	downgradeGracePeriodEnd: null | Date;

	customer: Id;
}
export const SubscriptionRevocationServicePostInTypeRef: TypeRef<SubscriptionRevocationServicePostIn> = new TypeRef("sys", 2771)

export function createSubscriptionRevocationServicePostIn(values: SubscriptionRevocationServicePostInParams): SubscriptionRevocationServicePostIn {
    return Object.assign(create(typeModels[SubscriptionRevocationServicePostInTypeRef.typeId], SubscriptionRevocationServicePostInTypeRef), values)
}

export type SubscriptionRevocationServicePostInParams = {



	surveyData: null | SurveyData;
}

export type SubscriptionRevocationServicePostIn = {
	_type: TypeRef<SubscriptionRevocationServicePostIn>;
	_original?: SubscriptionRevocationServicePostIn

	_format: NumberString;

	surveyData: null | SurveyData;
}
