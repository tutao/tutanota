import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { typeModels } from "./TypeModels.js"


export const KeyPairTypeRef: TypeRef<KeyPair> = new TypeRef("sys", 0)

export function createKeyPair(values: StrippedEntity<KeyPair>): KeyPair {
	return Object.assign(create(typeModels[KeyPairTypeRef.typeId], KeyPairTypeRef), values)
}

export type KeyPair = {
	_type: TypeRef<KeyPair>;

	_id: Id;
	pubRsaKey: null | Uint8Array;
	symEncPrivRsaKey: null | Uint8Array;
	pubEccKey: null | Uint8Array;
	symEncPrivEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;
	symEncPrivKyberKey: null | Uint8Array;
}
export const GroupTypeRef: TypeRef<Group> = new TypeRef("sys", 5)

export function createGroup(values: StrippedEntity<Group>): Group {
	return Object.assign(create(typeModels[GroupTypeRef.typeId], GroupTypeRef), values)
}

export type Group = {
	_type: TypeRef<Group>;

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
	formerGroupKeys: null | GroupKeysRef;
	pubAdminGroupEncGKey: null | PubEncKeyData;
}
export const GroupInfoTypeRef: TypeRef<GroupInfo> = new TypeRef("sys", 14)

export function createGroupInfo(values: StrippedEntity<GroupInfo>): GroupInfo {
	return Object.assign(create(typeModels[GroupInfoTypeRef.typeId], GroupInfoTypeRef), values)
}

export type GroupInfo = {
	_type: TypeRef<GroupInfo>;
	_errors: Object;

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

	group: Id;
	mailAddressAliases: MailAddressAlias[];
}
export const GroupMembershipTypeRef: TypeRef<GroupMembership> = new TypeRef("sys", 25)

export function createGroupMembership(values: StrippedEntity<GroupMembership>): GroupMembership {
	return Object.assign(create(typeModels[GroupMembershipTypeRef.typeId], GroupMembershipTypeRef), values)
}

export type GroupMembership = {
	_type: TypeRef<GroupMembership>;

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

export function createCustomer(values: StrippedEntity<Customer>): Customer {
	return Object.assign(create(typeModels[CustomerTypeRef.typeId], CustomerTypeRef), values)
}

export type Customer = {
	_type: TypeRef<Customer>;

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

export function createAuthenticatedDevice(values: StrippedEntity<AuthenticatedDevice>): AuthenticatedDevice {
	return Object.assign(create(typeModels[AuthenticatedDeviceTypeRef.typeId], AuthenticatedDeviceTypeRef), values)
}

export type AuthenticatedDevice = {
	_type: TypeRef<AuthenticatedDevice>;

	_id: Id;
	authType: NumberString;
	deviceToken: string;
	deviceKey: Uint8Array;
}
export const LoginTypeRef: TypeRef<Login> = new TypeRef("sys", 48)

export function createLogin(values: StrippedEntity<Login>): Login {
	return Object.assign(create(typeModels[LoginTypeRef.typeId], LoginTypeRef), values)
}

export type Login = {
	_type: TypeRef<Login>;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	time: Date;
	_ownerGroup: null | Id;
}
export const SecondFactorAuthenticationTypeRef: TypeRef<SecondFactorAuthentication> = new TypeRef("sys", 54)

export function createSecondFactorAuthentication(values: StrippedEntity<SecondFactorAuthentication>): SecondFactorAuthentication {
	return Object.assign(create(typeModels[SecondFactorAuthenticationTypeRef.typeId], SecondFactorAuthenticationTypeRef), values)
}

export type SecondFactorAuthentication = {
	_type: TypeRef<SecondFactorAuthentication>;

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

export function createVariableExternalAuthInfo(values: StrippedEntity<VariableExternalAuthInfo>): VariableExternalAuthInfo {
	return Object.assign(create(typeModels[VariableExternalAuthInfoTypeRef.typeId], VariableExternalAuthInfoTypeRef), values)
}

export type VariableExternalAuthInfo = {
	_type: TypeRef<VariableExternalAuthInfo>;

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

export function createUserExternalAuthInfo(values: StrippedEntity<UserExternalAuthInfo>): UserExternalAuthInfo {
	return Object.assign(create(typeModels[UserExternalAuthInfoTypeRef.typeId], UserExternalAuthInfoTypeRef), values)
}

export type UserExternalAuthInfo = {
	_type: TypeRef<UserExternalAuthInfo>;

	_id: Id;
	autoAuthenticationId: Id;
	latestSaltHash: null | Uint8Array;
	autoTransmitPassword: null | string;
	authUpdateCounter: NumberString;

	variableAuthInfo: Id;
}
export const UserTypeRef: TypeRef<User> = new TypeRef("sys", 84)

export function createUser(values: StrippedEntity<User>): User {
	return Object.assign(create(typeModels[UserTypeRef.typeId], UserTypeRef), values)
}

export type User = {
	_type: TypeRef<User>;

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

export function createExternalUserReference(values: StrippedEntity<ExternalUserReference>): ExternalUserReference {
	return Object.assign(create(typeModels[ExternalUserReferenceTypeRef.typeId], ExternalUserReferenceTypeRef), values)
}

export type ExternalUserReference = {
	_type: TypeRef<ExternalUserReference>;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	user: Id;
	userGroup: Id;
}
export const GroupRootTypeRef: TypeRef<GroupRoot> = new TypeRef("sys", 110)

export function createGroupRoot(values: StrippedEntity<GroupRoot>): GroupRoot {
	return Object.assign(create(typeModels[GroupRootTypeRef.typeId], GroupRootTypeRef), values)
}

export type GroupRoot = {
	_type: TypeRef<GroupRoot>;

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	externalGroupInfos: Id;
	externalUserReferences: Id;
	externalUserAreaGroupInfos: null | UserAreaGroups;
}
export const BucketPermissionTypeRef: TypeRef<BucketPermission> = new TypeRef("sys", 118)

export function createBucketPermission(values: StrippedEntity<BucketPermission>): BucketPermission {
	return Object.assign(create(typeModels[BucketPermissionTypeRef.typeId], BucketPermissionTypeRef), values)
}

export type BucketPermission = {
	_type: TypeRef<BucketPermission>;

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

export function createBucket(values: StrippedEntity<Bucket>): Bucket {
	return Object.assign(create(typeModels[BucketTypeRef.typeId], BucketTypeRef), values)
}

export type Bucket = {
	_type: TypeRef<Bucket>;

	_id: Id;

	bucketPermissions: Id;
}
export const PermissionTypeRef: TypeRef<Permission> = new TypeRef("sys", 132)

export function createPermission(values: StrippedEntity<Permission>): Permission {
	return Object.assign(create(typeModels[PermissionTypeRef.typeId], PermissionTypeRef), values)
}

export type Permission = {
	_type: TypeRef<Permission>;

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

export function createAccountingInfo(values: StrippedEntity<AccountingInfo>): AccountingInfo {
	return Object.assign(create(typeModels[AccountingInfoTypeRef.typeId], AccountingInfoTypeRef), values)
}

export type AccountingInfo = {
	_type: TypeRef<AccountingInfo>;
	_errors: Object;

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

	invoiceInfo: null | Id;
	appStoreSubscription: null | IdTuple;
}
export const CustomerInfoTypeRef: TypeRef<CustomerInfo> = new TypeRef("sys", 148)

export function createCustomerInfo(values: StrippedEntity<CustomerInfo>): CustomerInfo {
	return Object.assign(create(typeModels[CustomerInfoTypeRef.typeId], CustomerInfoTypeRef), values)
}

export type CustomerInfo = {
	_type: TypeRef<CustomerInfo>;

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
}
export const SentGroupInvitationTypeRef: TypeRef<SentGroupInvitation> = new TypeRef("sys", 195)

export function createSentGroupInvitation(values: StrippedEntity<SentGroupInvitation>): SentGroupInvitation {
	return Object.assign(create(typeModels[SentGroupInvitationTypeRef.typeId], SentGroupInvitationTypeRef), values)
}

export type SentGroupInvitation = {
	_type: TypeRef<SentGroupInvitation>;

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

export function createMailAddressToGroup(values: StrippedEntity<MailAddressToGroup>): MailAddressToGroup {
	return Object.assign(create(typeModels[MailAddressToGroupTypeRef.typeId], MailAddressToGroupTypeRef), values)
}

export type MailAddressToGroup = {
	_type: TypeRef<MailAddressToGroup>;

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	internalGroup: null | Id;
}
export const GroupMemberTypeRef: TypeRef<GroupMember> = new TypeRef("sys", 216)

export function createGroupMember(values: StrippedEntity<GroupMember>): GroupMember {
	return Object.assign(create(typeModels[GroupMemberTypeRef.typeId], GroupMemberTypeRef), values)
}

export type GroupMember = {
	_type: TypeRef<GroupMember>;

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

export function createRootInstance(values: StrippedEntity<RootInstance>): RootInstance {
	return Object.assign(create(typeModels[RootInstanceTypeRef.typeId], RootInstanceTypeRef), values)
}

export type RootInstance = {
	_type: TypeRef<RootInstance>;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	reference: Id;
	_ownerGroup: null | Id;
}
export const VersionInfoTypeRef: TypeRef<VersionInfo> = new TypeRef("sys", 237)

export function createVersionInfo(values: StrippedEntity<VersionInfo>): VersionInfo {
	return Object.assign(create(typeModels[VersionInfoTypeRef.typeId], VersionInfoTypeRef), values)
}

export type VersionInfo = {
	_type: TypeRef<VersionInfo>;

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

export function createSystemKeysReturn(values: StrippedEntity<SystemKeysReturn>): SystemKeysReturn {
	return Object.assign(create(typeModels[SystemKeysReturnTypeRef.typeId], SystemKeysReturnTypeRef), values)
}

export type SystemKeysReturn = {
	_type: TypeRef<SystemKeysReturn>;

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

export function createRegistrationServiceData(values: StrippedEntity<RegistrationServiceData>): RegistrationServiceData {
	return Object.assign(create(typeModels[RegistrationServiceDataTypeRef.typeId], RegistrationServiceDataTypeRef), values)
}

export type RegistrationServiceData = {
	_type: TypeRef<RegistrationServiceData>;

	_format: NumberString;
	state: NumberString;
	source: null | string;
}
export const RegistrationReturnTypeRef: TypeRef<RegistrationReturn> = new TypeRef("sys", 326)

export function createRegistrationReturn(values: StrippedEntity<RegistrationReturn>): RegistrationReturn {
	return Object.assign(create(typeModels[RegistrationReturnTypeRef.typeId], RegistrationReturnTypeRef), values)
}

export type RegistrationReturn = {
	_type: TypeRef<RegistrationReturn>;

	_format: NumberString;
	authToken: string;
}
export const SendRegistrationCodeDataTypeRef: TypeRef<SendRegistrationCodeData> = new TypeRef("sys", 341)

export function createSendRegistrationCodeData(values: StrippedEntity<SendRegistrationCodeData>): SendRegistrationCodeData {
	return Object.assign(create(typeModels[SendRegistrationCodeDataTypeRef.typeId], SendRegistrationCodeDataTypeRef), values)
}

export type SendRegistrationCodeData = {
	_type: TypeRef<SendRegistrationCodeData>;

	_format: NumberString;
	authToken: string;
	language: string;
	accountType: NumberString;
	mobilePhoneNumber: string;
}
export const SendRegistrationCodeReturnTypeRef: TypeRef<SendRegistrationCodeReturn> = new TypeRef("sys", 347)

export function createSendRegistrationCodeReturn(values: StrippedEntity<SendRegistrationCodeReturn>): SendRegistrationCodeReturn {
	return Object.assign(create(typeModels[SendRegistrationCodeReturnTypeRef.typeId], SendRegistrationCodeReturnTypeRef), values)
}

export type SendRegistrationCodeReturn = {
	_type: TypeRef<SendRegistrationCodeReturn>;

	_format: NumberString;
	authToken: string;
}
export const VerifyRegistrationCodeDataTypeRef: TypeRef<VerifyRegistrationCodeData> = new TypeRef("sys", 351)

export function createVerifyRegistrationCodeData(values: StrippedEntity<VerifyRegistrationCodeData>): VerifyRegistrationCodeData {
	return Object.assign(create(typeModels[VerifyRegistrationCodeDataTypeRef.typeId], VerifyRegistrationCodeDataTypeRef), values)
}

export type VerifyRegistrationCodeData = {
	_type: TypeRef<VerifyRegistrationCodeData>;

	_format: NumberString;
	authToken: string;
	code: string;
}
export const UserDataDeleteTypeRef: TypeRef<UserDataDelete> = new TypeRef("sys", 404)

export function createUserDataDelete(values: StrippedEntity<UserDataDelete>): UserDataDelete {
	return Object.assign(create(typeModels[UserDataDeleteTypeRef.typeId], UserDataDeleteTypeRef), values)
}

export type UserDataDelete = {
	_type: TypeRef<UserDataDelete>;

	_format: NumberString;
	restore: boolean;
	date: null | Date;

	user: Id;
}
export const PublicKeyGetInTypeRef: TypeRef<PublicKeyGetIn> = new TypeRef("sys", 409)

export function createPublicKeyGetIn(values: StrippedEntity<PublicKeyGetIn>): PublicKeyGetIn {
	return Object.assign(create(typeModels[PublicKeyGetInTypeRef.typeId], PublicKeyGetInTypeRef), values)
}

export type PublicKeyGetIn = {
	_type: TypeRef<PublicKeyGetIn>;

	_format: NumberString;
	identifier: string;
	version: null | NumberString;
	identifierType: NumberString;
}
export const PublicKeyGetOutTypeRef: TypeRef<PublicKeyGetOut> = new TypeRef("sys", 412)

export function createPublicKeyGetOut(values: StrippedEntity<PublicKeyGetOut>): PublicKeyGetOut {
	return Object.assign(create(typeModels[PublicKeyGetOutTypeRef.typeId], PublicKeyGetOutTypeRef), values)
}

export type PublicKeyGetOut = {
	_type: TypeRef<PublicKeyGetOut>;

	_format: NumberString;
	pubRsaKey: null | Uint8Array;
	pubKeyVersion: NumberString;
	pubEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;
}
export const SaltDataTypeRef: TypeRef<SaltData> = new TypeRef("sys", 417)

export function createSaltData(values: StrippedEntity<SaltData>): SaltData {
	return Object.assign(create(typeModels[SaltDataTypeRef.typeId], SaltDataTypeRef), values)
}

export type SaltData = {
	_type: TypeRef<SaltData>;

	_format: NumberString;
	mailAddress: string;
}
export const SaltReturnTypeRef: TypeRef<SaltReturn> = new TypeRef("sys", 420)

export function createSaltReturn(values: StrippedEntity<SaltReturn>): SaltReturn {
	return Object.assign(create(typeModels[SaltReturnTypeRef.typeId], SaltReturnTypeRef), values)
}

export type SaltReturn = {
	_type: TypeRef<SaltReturn>;

	_format: NumberString;
	salt: Uint8Array;
	kdfVersion: NumberString;
}
export const AutoLoginDataGetTypeRef: TypeRef<AutoLoginDataGet> = new TypeRef("sys", 431)

export function createAutoLoginDataGet(values: StrippedEntity<AutoLoginDataGet>): AutoLoginDataGet {
	return Object.assign(create(typeModels[AutoLoginDataGetTypeRef.typeId], AutoLoginDataGetTypeRef), values)
}

export type AutoLoginDataGet = {
	_type: TypeRef<AutoLoginDataGet>;

	_format: NumberString;
	deviceToken: string;

	userId: Id;
}
export const AutoLoginDataDeleteTypeRef: TypeRef<AutoLoginDataDelete> = new TypeRef("sys", 435)

export function createAutoLoginDataDelete(values: StrippedEntity<AutoLoginDataDelete>): AutoLoginDataDelete {
	return Object.assign(create(typeModels[AutoLoginDataDeleteTypeRef.typeId], AutoLoginDataDeleteTypeRef), values)
}

export type AutoLoginDataDelete = {
	_type: TypeRef<AutoLoginDataDelete>;

	_format: NumberString;
	deviceToken: string;
}
export const AutoLoginDataReturnTypeRef: TypeRef<AutoLoginDataReturn> = new TypeRef("sys", 438)

export function createAutoLoginDataReturn(values: StrippedEntity<AutoLoginDataReturn>): AutoLoginDataReturn {
	return Object.assign(create(typeModels[AutoLoginDataReturnTypeRef.typeId], AutoLoginDataReturnTypeRef), values)
}

export type AutoLoginDataReturn = {
	_type: TypeRef<AutoLoginDataReturn>;

	_format: NumberString;
	deviceKey: Uint8Array;
}
export const AutoLoginPostReturnTypeRef: TypeRef<AutoLoginPostReturn> = new TypeRef("sys", 441)

export function createAutoLoginPostReturn(values: StrippedEntity<AutoLoginPostReturn>): AutoLoginPostReturn {
	return Object.assign(create(typeModels[AutoLoginPostReturnTypeRef.typeId], AutoLoginPostReturnTypeRef), values)
}

export type AutoLoginPostReturn = {
	_type: TypeRef<AutoLoginPostReturn>;

	_format: NumberString;
	deviceToken: string;
}
export const UpdatePermissionKeyDataTypeRef: TypeRef<UpdatePermissionKeyData> = new TypeRef("sys", 445)

export function createUpdatePermissionKeyData(values: StrippedEntity<UpdatePermissionKeyData>): UpdatePermissionKeyData {
	return Object.assign(create(typeModels[UpdatePermissionKeyDataTypeRef.typeId], UpdatePermissionKeyDataTypeRef), values)
}

export type UpdatePermissionKeyData = {
	_type: TypeRef<UpdatePermissionKeyData>;

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	permission: IdTuple;
	bucketPermission: IdTuple;
}
export const AuthenticationTypeRef: TypeRef<Authentication> = new TypeRef("sys", 453)

export function createAuthentication(values: StrippedEntity<Authentication>): Authentication {
	return Object.assign(create(typeModels[AuthenticationTypeRef.typeId], AuthenticationTypeRef), values)
}

export type Authentication = {
	_type: TypeRef<Authentication>;

	_id: Id;
	authVerifier: null | string;
	externalAuthToken: null | string;
	accessToken: null | string;

	userId: Id;
}
export const ChatTypeRef: TypeRef<Chat> = new TypeRef("sys", 457)

export function createChat(values: StrippedEntity<Chat>): Chat {
	return Object.assign(create(typeModels[ChatTypeRef.typeId], ChatTypeRef), values)
}

export type Chat = {
	_type: TypeRef<Chat>;

	_id: Id;
	sender: Id;
	recipient: Id;
	text: string;
}
export const EntityUpdateTypeRef: TypeRef<EntityUpdate> = new TypeRef("sys", 462)

export function createEntityUpdate(values: StrippedEntity<EntityUpdate>): EntityUpdate {
	return Object.assign(create(typeModels[EntityUpdateTypeRef.typeId], EntityUpdateTypeRef), values)
}

export type EntityUpdate = {
	_type: TypeRef<EntityUpdate>;

	_id: Id;
	application: string;
	type: string;
	instanceListId: string;
	instanceId: string;
	operation: NumberString;
	typeId: NumberString;
}
export const ExceptionTypeRef: TypeRef<Exception> = new TypeRef("sys", 468)

export function createException(values: StrippedEntity<Exception>): Exception {
	return Object.assign(create(typeModels[ExceptionTypeRef.typeId], ExceptionTypeRef), values)
}

export type Exception = {
	_type: TypeRef<Exception>;

	_id: Id;
	type: string;
	msg: string;
}
export const VersionTypeRef: TypeRef<Version> = new TypeRef("sys", 480)

export function createVersion(values: StrippedEntity<Version>): Version {
	return Object.assign(create(typeModels[VersionTypeRef.typeId], VersionTypeRef), values)
}

export type Version = {
	_type: TypeRef<Version>;

	_id: Id;
	version: Id;
	timestamp: Date;
	operation: string;

	author: Id;
	authorGroupInfo: IdTuple;
}
export const VersionDataTypeRef: TypeRef<VersionData> = new TypeRef("sys", 487)

export function createVersionData(values: StrippedEntity<VersionData>): VersionData {
	return Object.assign(create(typeModels[VersionDataTypeRef.typeId], VersionDataTypeRef), values)
}

export type VersionData = {
	_type: TypeRef<VersionData>;

	_format: NumberString;
	application: string;
	typeId: NumberString;
	id: Id;
	listId: null | Id;
}
export const VersionReturnTypeRef: TypeRef<VersionReturn> = new TypeRef("sys", 493)

export function createVersionReturn(values: StrippedEntity<VersionReturn>): VersionReturn {
	return Object.assign(create(typeModels[VersionReturnTypeRef.typeId], VersionReturnTypeRef), values)
}

export type VersionReturn = {
	_type: TypeRef<VersionReturn>;

	_format: NumberString;

	versions: Version[];
}
export const MembershipAddDataTypeRef: TypeRef<MembershipAddData> = new TypeRef("sys", 505)

export function createMembershipAddData(values: StrippedEntity<MembershipAddData>): MembershipAddData {
	return Object.assign(create(typeModels[MembershipAddDataTypeRef.typeId], MembershipAddDataTypeRef), values)
}

export type MembershipAddData = {
	_type: TypeRef<MembershipAddData>;

	_format: NumberString;
	symEncGKey: Uint8Array;
	symKeyVersion: NumberString;
	groupKeyVersion: NumberString;

	user: Id;
	group: Id;
}
export const ChangePasswordPostInTypeRef: TypeRef<ChangePasswordPostIn> = new TypeRef("sys", 534)

export function createChangePasswordPostIn(values: StrippedEntity<ChangePasswordPostIn>): ChangePasswordPostIn {
	return Object.assign(create(typeModels[ChangePasswordPostInTypeRef.typeId], ChangePasswordPostInTypeRef), values)
}

export type ChangePasswordPostIn = {
	_type: TypeRef<ChangePasswordPostIn>;

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

export function createSecondFactorAuthData(values: StrippedEntity<SecondFactorAuthData>): SecondFactorAuthData {
	return Object.assign(create(typeModels[SecondFactorAuthDataTypeRef.typeId], SecondFactorAuthDataTypeRef), values)
}

export type SecondFactorAuthData = {
	_type: TypeRef<SecondFactorAuthData>;

	_format: NumberString;
	type: null | NumberString;
	otpCode: null | NumberString;

	u2f: null | U2fResponseData;
	session: null | IdTuple;
	webauthn: null | WebauthnResponseData;
}
export const SecondFactorAuthAllowedReturnTypeRef: TypeRef<SecondFactorAuthAllowedReturn> = new TypeRef("sys", 546)

export function createSecondFactorAuthAllowedReturn(values: StrippedEntity<SecondFactorAuthAllowedReturn>): SecondFactorAuthAllowedReturn {
	return Object.assign(create(typeModels[SecondFactorAuthAllowedReturnTypeRef.typeId], SecondFactorAuthAllowedReturnTypeRef), values)
}

export type SecondFactorAuthAllowedReturn = {
	_type: TypeRef<SecondFactorAuthAllowedReturn>;

	_format: NumberString;
	allowed: boolean;
}
export const ResetPasswordPostInTypeRef: TypeRef<ResetPasswordPostIn> = new TypeRef("sys", 584)

export function createResetPasswordPostIn(values: StrippedEntity<ResetPasswordPostIn>): ResetPasswordPostIn {
	return Object.assign(create(typeModels[ResetPasswordPostInTypeRef.typeId], ResetPasswordPostInTypeRef), values)
}

export type ResetPasswordPostIn = {
	_type: TypeRef<ResetPasswordPostIn>;

	_format: NumberString;
	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;

	user: Id;
}
export const DomainMailAddressAvailabilityDataTypeRef: TypeRef<DomainMailAddressAvailabilityData> = new TypeRef("sys", 599)

export function createDomainMailAddressAvailabilityData(values: StrippedEntity<DomainMailAddressAvailabilityData>): DomainMailAddressAvailabilityData {
	return Object.assign(create(typeModels[DomainMailAddressAvailabilityDataTypeRef.typeId], DomainMailAddressAvailabilityDataTypeRef), values)
}

export type DomainMailAddressAvailabilityData = {
	_type: TypeRef<DomainMailAddressAvailabilityData>;

	_format: NumberString;
	mailAddress: string;
}
export const DomainMailAddressAvailabilityReturnTypeRef: TypeRef<DomainMailAddressAvailabilityReturn> = new TypeRef("sys", 602)

export function createDomainMailAddressAvailabilityReturn(values: StrippedEntity<DomainMailAddressAvailabilityReturn>): DomainMailAddressAvailabilityReturn {
	return Object.assign(create(typeModels[DomainMailAddressAvailabilityReturnTypeRef.typeId], DomainMailAddressAvailabilityReturnTypeRef), values)
}

export type DomainMailAddressAvailabilityReturn = {
	_type: TypeRef<DomainMailAddressAvailabilityReturn>;

	_format: NumberString;
	available: boolean;
}
export const PushIdentifierTypeRef: TypeRef<PushIdentifier> = new TypeRef("sys", 625)

export function createPushIdentifier(values: StrippedEntity<PushIdentifier>): PushIdentifier {
	return Object.assign(create(typeModels[PushIdentifierTypeRef.typeId], PushIdentifierTypeRef), values)
}

export type PushIdentifier = {
	_type: TypeRef<PushIdentifier>;
	_errors: Object;

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
}
export const PushIdentifierListTypeRef: TypeRef<PushIdentifierList> = new TypeRef("sys", 635)

export function createPushIdentifierList(values: StrippedEntity<PushIdentifierList>): PushIdentifierList {
	return Object.assign(create(typeModels[PushIdentifierListTypeRef.typeId], PushIdentifierListTypeRef), values)
}

export type PushIdentifierList = {
	_type: TypeRef<PushIdentifierList>;

	_id: Id;

	list: Id;
}
export const DeleteCustomerDataTypeRef: TypeRef<DeleteCustomerData> = new TypeRef("sys", 641)

export function createDeleteCustomerData(values: StrippedEntity<DeleteCustomerData>): DeleteCustomerData {
	return Object.assign(create(typeModels[DeleteCustomerDataTypeRef.typeId], DeleteCustomerDataTypeRef), values)
}

export type DeleteCustomerData = {
	_type: TypeRef<DeleteCustomerData>;

	_format: NumberString;
	undelete: boolean;
	reason: null | string;
	takeoverMailAddress: null | string;
	authVerifier: null | Uint8Array;

	customer: Id;
	surveyData: null | SurveyData;
}
export const CustomerPropertiesTypeRef: TypeRef<CustomerProperties> = new TypeRef("sys", 656)

export function createCustomerProperties(values: StrippedEntity<CustomerProperties>): CustomerProperties {
	return Object.assign(create(typeModels[CustomerPropertiesTypeRef.typeId], CustomerPropertiesTypeRef), values)
}

export type CustomerProperties = {
	_type: TypeRef<CustomerProperties>;

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	externalUserWelcomeMessage: string;
	lastUpgradeReminder: null | Date;
	_ownerGroup: null | Id;
	usageDataOptedOut: boolean;

	smallLogo: null | File;
	bigLogo: null | File;
	notificationMailTemplates: NotificationMailTemplate[];
}
export const ExternalPropertiesReturnTypeRef: TypeRef<ExternalPropertiesReturn> = new TypeRef("sys", 663)

export function createExternalPropertiesReturn(values: StrippedEntity<ExternalPropertiesReturn>): ExternalPropertiesReturn {
	return Object.assign(create(typeModels[ExternalPropertiesReturnTypeRef.typeId], ExternalPropertiesReturnTypeRef), values)
}

export type ExternalPropertiesReturn = {
	_type: TypeRef<ExternalPropertiesReturn>;

	_format: NumberString;
	message: string;
	accountType: NumberString;

	smallLogo: null | File;
	bigLogo: null | File;
}
export const RegistrationCaptchaServiceDataTypeRef: TypeRef<RegistrationCaptchaServiceData> = new TypeRef("sys", 674)

export function createRegistrationCaptchaServiceData(values: StrippedEntity<RegistrationCaptchaServiceData>): RegistrationCaptchaServiceData {
	return Object.assign(create(typeModels[RegistrationCaptchaServiceDataTypeRef.typeId], RegistrationCaptchaServiceDataTypeRef), values)
}

export type RegistrationCaptchaServiceData = {
	_type: TypeRef<RegistrationCaptchaServiceData>;

	_format: NumberString;
	token: string;
	response: string;
}
export const RegistrationCaptchaServiceReturnTypeRef: TypeRef<RegistrationCaptchaServiceReturn> = new TypeRef("sys", 678)

export function createRegistrationCaptchaServiceReturn(values: StrippedEntity<RegistrationCaptchaServiceReturn>): RegistrationCaptchaServiceReturn {
	return Object.assign(create(typeModels[RegistrationCaptchaServiceReturnTypeRef.typeId], RegistrationCaptchaServiceReturnTypeRef), values)
}

export type RegistrationCaptchaServiceReturn = {
	_type: TypeRef<RegistrationCaptchaServiceReturn>;

	_format: NumberString;
	token: string;
	challenge: null | Uint8Array;
}
export const MailAddressAliasTypeRef: TypeRef<MailAddressAlias> = new TypeRef("sys", 684)

export function createMailAddressAlias(values: StrippedEntity<MailAddressAlias>): MailAddressAlias {
	return Object.assign(create(typeModels[MailAddressAliasTypeRef.typeId], MailAddressAliasTypeRef), values)
}

export type MailAddressAlias = {
	_type: TypeRef<MailAddressAlias>;

	_id: Id;
	mailAddress: string;
	enabled: boolean;
}
export const MailAddressAliasServiceDataTypeRef: TypeRef<MailAddressAliasServiceData> = new TypeRef("sys", 688)

export function createMailAddressAliasServiceData(values: StrippedEntity<MailAddressAliasServiceData>): MailAddressAliasServiceData {
	return Object.assign(create(typeModels[MailAddressAliasServiceDataTypeRef.typeId], MailAddressAliasServiceDataTypeRef), values)
}

export type MailAddressAliasServiceData = {
	_type: TypeRef<MailAddressAliasServiceData>;

	_format: NumberString;
	mailAddress: string;

	group: Id;
}
export const MailAddressAliasServiceReturnTypeRef: TypeRef<MailAddressAliasServiceReturn> = new TypeRef("sys", 692)

export function createMailAddressAliasServiceReturn(values: StrippedEntity<MailAddressAliasServiceReturn>): MailAddressAliasServiceReturn {
	return Object.assign(create(typeModels[MailAddressAliasServiceReturnTypeRef.typeId], MailAddressAliasServiceReturnTypeRef), values)
}

export type MailAddressAliasServiceReturn = {
	_type: TypeRef<MailAddressAliasServiceReturn>;

	_format: NumberString;
	nbrOfFreeAliases: NumberString;
	totalAliases: NumberString;
	usedAliases: NumberString;
	enabledAliases: NumberString;
}
export const DomainInfoTypeRef: TypeRef<DomainInfo> = new TypeRef("sys", 696)

export function createDomainInfo(values: StrippedEntity<DomainInfo>): DomainInfo {
	return Object.assign(create(typeModels[DomainInfoTypeRef.typeId], DomainInfoTypeRef), values)
}

export type DomainInfo = {
	_type: TypeRef<DomainInfo>;

	_id: Id;
	domain: string;

	catchAllMailGroup: null | Id;
	whitelabelConfig: null | Id;
}
export const BookingItemTypeRef: TypeRef<BookingItem> = new TypeRef("sys", 700)

export function createBookingItem(values: StrippedEntity<BookingItem>): BookingItem {
	return Object.assign(create(typeModels[BookingItemTypeRef.typeId], BookingItemTypeRef), values)
}

export type BookingItem = {
	_type: TypeRef<BookingItem>;

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

export function createBooking(values: StrippedEntity<Booking>): Booking {
	return Object.assign(create(typeModels[BookingTypeRef.typeId], BookingTypeRef), values)
}

export type Booking = {
	_type: TypeRef<Booking>;

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

	items: BookingItem[];
}
export const BookingsRefTypeRef: TypeRef<BookingsRef> = new TypeRef("sys", 722)

export function createBookingsRef(values: StrippedEntity<BookingsRef>): BookingsRef {
	return Object.assign(create(typeModels[BookingsRefTypeRef.typeId], BookingsRefTypeRef), values)
}

export type BookingsRef = {
	_type: TypeRef<BookingsRef>;

	_id: Id;

	items: Id;
}
export const StringWrapperTypeRef: TypeRef<StringWrapper> = new TypeRef("sys", 728)

export function createStringWrapper(values: StrippedEntity<StringWrapper>): StringWrapper {
	return Object.assign(create(typeModels[StringWrapperTypeRef.typeId], StringWrapperTypeRef), values)
}

export type StringWrapper = {
	_type: TypeRef<StringWrapper>;

	_id: Id;
	value: string;
}
export const CustomDomainReturnTypeRef: TypeRef<CustomDomainReturn> = new TypeRef("sys", 731)

export function createCustomDomainReturn(values: StrippedEntity<CustomDomainReturn>): CustomDomainReturn {
	return Object.assign(create(typeModels[CustomDomainReturnTypeRef.typeId], CustomDomainReturnTypeRef), values)
}

export type CustomDomainReturn = {
	_type: TypeRef<CustomDomainReturn>;

	_format: NumberString;
	validationResult: NumberString;

	invalidDnsRecords: StringWrapper[];
}
export const CustomDomainDataTypeRef: TypeRef<CustomDomainData> = new TypeRef("sys", 735)

export function createCustomDomainData(values: StrippedEntity<CustomDomainData>): CustomDomainData {
	return Object.assign(create(typeModels[CustomDomainDataTypeRef.typeId], CustomDomainDataTypeRef), values)
}

export type CustomDomainData = {
	_type: TypeRef<CustomDomainData>;

	_format: NumberString;
	domain: string;

	catchAllMailGroup: null | Id;
}
export const InvoiceInfoTypeRef: TypeRef<InvoiceInfo> = new TypeRef("sys", 752)

export function createInvoiceInfo(values: StrippedEntity<InvoiceInfo>): InvoiceInfo {
	return Object.assign(create(typeModels[InvoiceInfoTypeRef.typeId], InvoiceInfoTypeRef), values)
}

export type InvoiceInfo = {
	_type: TypeRef<InvoiceInfo>;

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

export function createSwitchAccountTypePostIn(values: StrippedEntity<SwitchAccountTypePostIn>): SwitchAccountTypePostIn {
	return Object.assign(create(typeModels[SwitchAccountTypePostInTypeRef.typeId], SwitchAccountTypePostInTypeRef), values)
}

export type SwitchAccountTypePostIn = {
	_type: TypeRef<SwitchAccountTypePostIn>;

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

export function createMailAddressAliasServiceDataDelete(values: StrippedEntity<MailAddressAliasServiceDataDelete>): MailAddressAliasServiceDataDelete {
	return Object.assign(create(typeModels[MailAddressAliasServiceDataDeleteTypeRef.typeId], MailAddressAliasServiceDataDeleteTypeRef), values)
}

export type MailAddressAliasServiceDataDelete = {
	_type: TypeRef<MailAddressAliasServiceDataDelete>;

	_format: NumberString;
	mailAddress: string;
	restore: boolean;

	group: Id;
}
export const PaymentDataServiceGetReturnTypeRef: TypeRef<PaymentDataServiceGetReturn> = new TypeRef("sys", 790)

export function createPaymentDataServiceGetReturn(values: StrippedEntity<PaymentDataServiceGetReturn>): PaymentDataServiceGetReturn {
	return Object.assign(create(typeModels[PaymentDataServiceGetReturnTypeRef.typeId], PaymentDataServiceGetReturnTypeRef), values)
}

export type PaymentDataServiceGetReturn = {
	_type: TypeRef<PaymentDataServiceGetReturn>;

	_format: NumberString;
	loginUrl: string;
}
export const PaymentDataServicePutDataTypeRef: TypeRef<PaymentDataServicePutData> = new TypeRef("sys", 793)

export function createPaymentDataServicePutData(values: StrippedEntity<PaymentDataServicePutData>): PaymentDataServicePutData {
	return Object.assign(create(typeModels[PaymentDataServicePutDataTypeRef.typeId], PaymentDataServicePutDataTypeRef), values)
}

export type PaymentDataServicePutData = {
	_type: TypeRef<PaymentDataServicePutData>;
	_errors: Object;

	_format: NumberString;
	invoiceName: string;
	invoiceAddress: string;
	invoiceCountry: string;
	invoiceVatIdNo: string;
	paymentMethod: NumberString;
	paymentMethodInfo: null | string;
	paymentInterval: NumberString;
	paymentToken: null | string;
	confirmedCountry: null | string;

	creditCard: null | CreditCard;
}
export const PaymentDataServicePutReturnTypeRef: TypeRef<PaymentDataServicePutReturn> = new TypeRef("sys", 805)

export function createPaymentDataServicePutReturn(values: StrippedEntity<PaymentDataServicePutReturn>): PaymentDataServicePutReturn {
	return Object.assign(create(typeModels[PaymentDataServicePutReturnTypeRef.typeId], PaymentDataServicePutReturnTypeRef), values)
}

export type PaymentDataServicePutReturn = {
	_type: TypeRef<PaymentDataServicePutReturn>;

	_format: NumberString;
	result: NumberString;

	braintree3dsRequest: null | Braintree3ds2Request;
}
export const PriceRequestDataTypeRef: TypeRef<PriceRequestData> = new TypeRef("sys", 836)

export function createPriceRequestData(values: StrippedEntity<PriceRequestData>): PriceRequestData {
	return Object.assign(create(typeModels[PriceRequestDataTypeRef.typeId], PriceRequestDataTypeRef), values)
}

export type PriceRequestData = {
	_type: TypeRef<PriceRequestData>;

	_id: Id;
	featureType: NumberString;
	count: NumberString;
	business: null | boolean;
	paymentInterval: null | NumberString;
	accountType: null | NumberString;
	reactivate: boolean;
}
export const PriceServiceDataTypeRef: TypeRef<PriceServiceData> = new TypeRef("sys", 843)

export function createPriceServiceData(values: StrippedEntity<PriceServiceData>): PriceServiceData {
	return Object.assign(create(typeModels[PriceServiceDataTypeRef.typeId], PriceServiceDataTypeRef), values)
}

export type PriceServiceData = {
	_type: TypeRef<PriceServiceData>;

	_format: NumberString;
	date: null | Date;

	priceRequest: null | PriceRequestData;
}
export const PriceItemDataTypeRef: TypeRef<PriceItemData> = new TypeRef("sys", 847)

export function createPriceItemData(values: StrippedEntity<PriceItemData>): PriceItemData {
	return Object.assign(create(typeModels[PriceItemDataTypeRef.typeId], PriceItemDataTypeRef), values)
}

export type PriceItemData = {
	_type: TypeRef<PriceItemData>;

	_id: Id;
	featureType: NumberString;
	count: NumberString;
	price: NumberString;
	singleType: boolean;
}
export const PriceDataTypeRef: TypeRef<PriceData> = new TypeRef("sys", 853)

export function createPriceData(values: StrippedEntity<PriceData>): PriceData {
	return Object.assign(create(typeModels[PriceDataTypeRef.typeId], PriceDataTypeRef), values)
}

export type PriceData = {
	_type: TypeRef<PriceData>;

	_id: Id;
	price: NumberString;
	taxIncluded: boolean;
	paymentInterval: NumberString;

	items: PriceItemData[];
}
export const PriceServiceReturnTypeRef: TypeRef<PriceServiceReturn> = new TypeRef("sys", 859)

export function createPriceServiceReturn(values: StrippedEntity<PriceServiceReturn>): PriceServiceReturn {
	return Object.assign(create(typeModels[PriceServiceReturnTypeRef.typeId], PriceServiceReturnTypeRef), values)
}

export type PriceServiceReturn = {
	_type: TypeRef<PriceServiceReturn>;

	_format: NumberString;
	periodEndDate: Date;
	currentPeriodAddedPrice: null | NumberString;

	currentPriceThisPeriod: null | PriceData;
	currentPriceNextPeriod: null | PriceData;
	futurePriceNextPeriod: null | PriceData;
}
export const MembershipRemoveDataTypeRef: TypeRef<MembershipRemoveData> = new TypeRef("sys", 867)

export function createMembershipRemoveData(values: StrippedEntity<MembershipRemoveData>): MembershipRemoveData {
	return Object.assign(create(typeModels[MembershipRemoveDataTypeRef.typeId], MembershipRemoveDataTypeRef), values)
}

export type MembershipRemoveData = {
	_type: TypeRef<MembershipRemoveData>;

	_format: NumberString;

	user: Id;
	group: Id;
}
export const FileTypeRef: TypeRef<File> = new TypeRef("sys", 917)

export function createFile(values: StrippedEntity<File>): File {
	return Object.assign(create(typeModels[FileTypeRef.typeId], FileTypeRef), values)
}

export type File = {
	_type: TypeRef<File>;

	_id: Id;
	name: string;
	mimeType: string;
	data: Uint8Array;
}
export const EmailSenderListElementTypeRef: TypeRef<EmailSenderListElement> = new TypeRef("sys", 949)

export function createEmailSenderListElement(values: StrippedEntity<EmailSenderListElement>): EmailSenderListElement {
	return Object.assign(create(typeModels[EmailSenderListElementTypeRef.typeId], EmailSenderListElementTypeRef), values)
}

export type EmailSenderListElement = {
	_type: TypeRef<EmailSenderListElement>;

	_id: Id;
	hashedValue: string;
	value: string;
	type: NumberString;
	field: NumberString;
}
export const CustomerServerPropertiesTypeRef: TypeRef<CustomerServerProperties> = new TypeRef("sys", 954)

export function createCustomerServerProperties(values: StrippedEntity<CustomerServerProperties>): CustomerServerProperties {
	return Object.assign(create(typeModels[CustomerServerPropertiesTypeRef.typeId], CustomerServerPropertiesTypeRef), values)
}

export type CustomerServerProperties = {
	_type: TypeRef<CustomerServerProperties>;
	_errors: Object;

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	requirePasswordUpdateAfterReset: boolean;
	saveEncryptedIpAddressInSession: boolean;
	_ownerKeyVersion: null | NumberString;

	emailSenderList: EmailSenderListElement[];
}
export const CreateCustomerServerPropertiesDataTypeRef: TypeRef<CreateCustomerServerPropertiesData> = new TypeRef("sys", 961)

export function createCreateCustomerServerPropertiesData(values: StrippedEntity<CreateCustomerServerPropertiesData>): CreateCustomerServerPropertiesData {
	return Object.assign(create(typeModels[CreateCustomerServerPropertiesDataTypeRef.typeId], CreateCustomerServerPropertiesDataTypeRef), values)
}

export type CreateCustomerServerPropertiesData = {
	_type: TypeRef<CreateCustomerServerPropertiesData>;

	_format: NumberString;
	adminGroupEncSessionKey: Uint8Array;
	adminGroupKeyVersion: NumberString;
}
export const CreateCustomerServerPropertiesReturnTypeRef: TypeRef<CreateCustomerServerPropertiesReturn> = new TypeRef("sys", 964)

export function createCreateCustomerServerPropertiesReturn(values: StrippedEntity<CreateCustomerServerPropertiesReturn>): CreateCustomerServerPropertiesReturn {
	return Object.assign(create(typeModels[CreateCustomerServerPropertiesReturnTypeRef.typeId], CreateCustomerServerPropertiesReturnTypeRef), values)
}

export type CreateCustomerServerPropertiesReturn = {
	_type: TypeRef<CreateCustomerServerPropertiesReturn>;

	_format: NumberString;

	id: Id;
}
export const UserAreaGroupsTypeRef: TypeRef<UserAreaGroups> = new TypeRef("sys", 988)

export function createUserAreaGroups(values: StrippedEntity<UserAreaGroups>): UserAreaGroups {
	return Object.assign(create(typeModels[UserAreaGroupsTypeRef.typeId], UserAreaGroupsTypeRef), values)
}

export type UserAreaGroups = {
	_type: TypeRef<UserAreaGroups>;

	_id: Id;

	list: Id;
}
export const DebitServicePutDataTypeRef: TypeRef<DebitServicePutData> = new TypeRef("sys", 1041)

export function createDebitServicePutData(values: StrippedEntity<DebitServicePutData>): DebitServicePutData {
	return Object.assign(create(typeModels[DebitServicePutDataTypeRef.typeId], DebitServicePutDataTypeRef), values)
}

export type DebitServicePutData = {
	_type: TypeRef<DebitServicePutData>;

	_format: NumberString;
}
export const EntityEventBatchTypeRef: TypeRef<EntityEventBatch> = new TypeRef("sys", 1079)

export function createEntityEventBatch(values: StrippedEntity<EntityEventBatch>): EntityEventBatch {
	return Object.assign(create(typeModels[EntityEventBatchTypeRef.typeId], EntityEventBatchTypeRef), values)
}

export type EntityEventBatch = {
	_type: TypeRef<EntityEventBatch>;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	events: EntityUpdate[];
}
export const AuditLogEntryTypeRef: TypeRef<AuditLogEntry> = new TypeRef("sys", 1101)

export function createAuditLogEntry(values: StrippedEntity<AuditLogEntry>): AuditLogEntry {
	return Object.assign(create(typeModels[AuditLogEntryTypeRef.typeId], AuditLogEntryTypeRef), values)
}

export type AuditLogEntry = {
	_type: TypeRef<AuditLogEntry>;
	_errors: Object;

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

	groupInfo: null | IdTuple;
	modifiedGroupInfo: null | IdTuple;
}
export const AuditLogRefTypeRef: TypeRef<AuditLogRef> = new TypeRef("sys", 1114)

export function createAuditLogRef(values: StrippedEntity<AuditLogRef>): AuditLogRef {
	return Object.assign(create(typeModels[AuditLogRefTypeRef.typeId], AuditLogRefTypeRef), values)
}

export type AuditLogRef = {
	_type: TypeRef<AuditLogRef>;

	_id: Id;

	items: Id;
}
export const WhitelabelConfigTypeRef: TypeRef<WhitelabelConfig> = new TypeRef("sys", 1127)

export function createWhitelabelConfig(values: StrippedEntity<WhitelabelConfig>): WhitelabelConfig {
	return Object.assign(create(typeModels[WhitelabelConfigTypeRef.typeId], WhitelabelConfigTypeRef), values)
}

export type WhitelabelConfig = {
	_type: TypeRef<WhitelabelConfig>;

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

export function createBrandingDomainData(values: StrippedEntity<BrandingDomainData>): BrandingDomainData {
	return Object.assign(create(typeModels[BrandingDomainDataTypeRef.typeId], BrandingDomainDataTypeRef), values)
}

export type BrandingDomainData = {
	_type: TypeRef<BrandingDomainData>;

	_format: NumberString;
	domain: string;
	sessionEncPemCertificateChain: null | Uint8Array;
	sessionEncPemPrivateKey: null | Uint8Array;
	systemAdminPubEncSessionKey: Uint8Array;
	systemAdminPublicProtocolVersion: NumberString;
	systemAdminPubKeyVersion: NumberString;
}
export const BrandingDomainDeleteDataTypeRef: TypeRef<BrandingDomainDeleteData> = new TypeRef("sys", 1155)

export function createBrandingDomainDeleteData(values: StrippedEntity<BrandingDomainDeleteData>): BrandingDomainDeleteData {
	return Object.assign(create(typeModels[BrandingDomainDeleteDataTypeRef.typeId], BrandingDomainDeleteDataTypeRef), values)
}

export type BrandingDomainDeleteData = {
	_type: TypeRef<BrandingDomainDeleteData>;

	_format: NumberString;
	domain: string;
}
export const U2fRegisteredDeviceTypeRef: TypeRef<U2fRegisteredDevice> = new TypeRef("sys", 1162)

export function createU2fRegisteredDevice(values: StrippedEntity<U2fRegisteredDevice>): U2fRegisteredDevice {
	return Object.assign(create(typeModels[U2fRegisteredDeviceTypeRef.typeId], U2fRegisteredDeviceTypeRef), values)
}

export type U2fRegisteredDevice = {
	_type: TypeRef<U2fRegisteredDevice>;

	_id: Id;
	keyHandle: Uint8Array;
	appId: string;
	publicKey: Uint8Array;
	counter: NumberString;
	compromised: boolean;
}
export const SecondFactorTypeRef: TypeRef<SecondFactor> = new TypeRef("sys", 1169)

export function createSecondFactor(values: StrippedEntity<SecondFactor>): SecondFactor {
	return Object.assign(create(typeModels[SecondFactorTypeRef.typeId], SecondFactorTypeRef), values)
}

export type SecondFactor = {
	_type: TypeRef<SecondFactor>;

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

export function createU2fKey(values: StrippedEntity<U2fKey>): U2fKey {
	return Object.assign(create(typeModels[U2fKeyTypeRef.typeId], U2fKeyTypeRef), values)
}

export type U2fKey = {
	_type: TypeRef<U2fKey>;

	_id: Id;
	keyHandle: Uint8Array;
	appId: string;

	secondFactor: IdTuple;
}
export const U2fChallengeTypeRef: TypeRef<U2fChallenge> = new TypeRef("sys", 1183)

export function createU2fChallenge(values: StrippedEntity<U2fChallenge>): U2fChallenge {
	return Object.assign(create(typeModels[U2fChallengeTypeRef.typeId], U2fChallengeTypeRef), values)
}

export type U2fChallenge = {
	_type: TypeRef<U2fChallenge>;

	_id: Id;
	challenge: Uint8Array;

	keys: U2fKey[];
}
export const ChallengeTypeRef: TypeRef<Challenge> = new TypeRef("sys", 1187)

export function createChallenge(values: StrippedEntity<Challenge>): Challenge {
	return Object.assign(create(typeModels[ChallengeTypeRef.typeId], ChallengeTypeRef), values)
}

export type Challenge = {
	_type: TypeRef<Challenge>;

	_id: Id;
	type: NumberString;

	u2f: null | U2fChallenge;
	otp: null | OtpChallenge;
}
export const SessionTypeRef: TypeRef<Session> = new TypeRef("sys", 1191)

export function createSession(values: StrippedEntity<Session>): Session {
	return Object.assign(create(typeModels[SessionTypeRef.typeId], SessionTypeRef), values)
}

export type Session = {
	_type: TypeRef<Session>;
	_errors: Object;

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

	challenges: Challenge[];
	user: Id;
}
export const UserAuthenticationTypeRef: TypeRef<UserAuthentication> = new TypeRef("sys", 1206)

export function createUserAuthentication(values: StrippedEntity<UserAuthentication>): UserAuthentication {
	return Object.assign(create(typeModels[UserAuthenticationTypeRef.typeId], UserAuthenticationTypeRef), values)
}

export type UserAuthentication = {
	_type: TypeRef<UserAuthentication>;

	_id: Id;

	sessions: Id;
	secondFactors: Id;
	recoverCode: null | Id;
}
export const CreateSessionDataTypeRef: TypeRef<CreateSessionData> = new TypeRef("sys", 1211)

export function createCreateSessionData(values: StrippedEntity<CreateSessionData>): CreateSessionData {
	return Object.assign(create(typeModels[CreateSessionDataTypeRef.typeId], CreateSessionDataTypeRef), values)
}

export type CreateSessionData = {
	_type: TypeRef<CreateSessionData>;

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

export function createCreateSessionReturn(values: StrippedEntity<CreateSessionReturn>): CreateSessionReturn {
	return Object.assign(create(typeModels[CreateSessionReturnTypeRef.typeId], CreateSessionReturnTypeRef), values)
}

export type CreateSessionReturn = {
	_type: TypeRef<CreateSessionReturn>;

	_format: NumberString;
	accessToken: string;

	challenges: Challenge[];
	user: Id;
}
export const U2fResponseDataTypeRef: TypeRef<U2fResponseData> = new TypeRef("sys", 1225)

export function createU2fResponseData(values: StrippedEntity<U2fResponseData>): U2fResponseData {
	return Object.assign(create(typeModels[U2fResponseDataTypeRef.typeId], U2fResponseDataTypeRef), values)
}

export type U2fResponseData = {
	_type: TypeRef<U2fResponseData>;

	_id: Id;
	keyHandle: string;
	clientData: string;
	signatureData: string;
}
export const SecondFactorAuthGetDataTypeRef: TypeRef<SecondFactorAuthGetData> = new TypeRef("sys", 1233)

export function createSecondFactorAuthGetData(values: StrippedEntity<SecondFactorAuthGetData>): SecondFactorAuthGetData {
	return Object.assign(create(typeModels[SecondFactorAuthGetDataTypeRef.typeId], SecondFactorAuthGetDataTypeRef), values)
}

export type SecondFactorAuthGetData = {
	_type: TypeRef<SecondFactorAuthGetData>;

	_format: NumberString;
	accessToken: string;
}
export const SecondFactorAuthGetReturnTypeRef: TypeRef<SecondFactorAuthGetReturn> = new TypeRef("sys", 1236)

export function createSecondFactorAuthGetReturn(values: StrippedEntity<SecondFactorAuthGetReturn>): SecondFactorAuthGetReturn {
	return Object.assign(create(typeModels[SecondFactorAuthGetReturnTypeRef.typeId], SecondFactorAuthGetReturnTypeRef), values)
}

export type SecondFactorAuthGetReturn = {
	_type: TypeRef<SecondFactorAuthGetReturn>;

	_format: NumberString;
	secondFactorPending: boolean;
}
export const OtpChallengeTypeRef: TypeRef<OtpChallenge> = new TypeRef("sys", 1244)

export function createOtpChallenge(values: StrippedEntity<OtpChallenge>): OtpChallenge {
	return Object.assign(create(typeModels[OtpChallengeTypeRef.typeId], OtpChallengeTypeRef), values)
}

export type OtpChallenge = {
	_type: TypeRef<OtpChallenge>;

	_id: Id;

	secondFactors: IdTuple[];
}
export const BootstrapFeatureTypeRef: TypeRef<BootstrapFeature> = new TypeRef("sys", 1249)

export function createBootstrapFeature(values: StrippedEntity<BootstrapFeature>): BootstrapFeature {
	return Object.assign(create(typeModels[BootstrapFeatureTypeRef.typeId], BootstrapFeatureTypeRef), values)
}

export type BootstrapFeature = {
	_type: TypeRef<BootstrapFeature>;

	_id: Id;
	feature: NumberString;
}
export const FeatureTypeRef: TypeRef<Feature> = new TypeRef("sys", 1253)

export function createFeature(values: StrippedEntity<Feature>): Feature {
	return Object.assign(create(typeModels[FeatureTypeRef.typeId], FeatureTypeRef), values)
}

export type Feature = {
	_type: TypeRef<Feature>;

	_id: Id;
	feature: NumberString;
}
export const WhitelabelChildTypeRef: TypeRef<WhitelabelChild> = new TypeRef("sys", 1257)

export function createWhitelabelChild(values: StrippedEntity<WhitelabelChild>): WhitelabelChild {
	return Object.assign(create(typeModels[WhitelabelChildTypeRef.typeId], WhitelabelChildTypeRef), values)
}

export type WhitelabelChild = {
	_type: TypeRef<WhitelabelChild>;
	_errors: Object;

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

	customer: Id;
}
export const WhitelabelChildrenRefTypeRef: TypeRef<WhitelabelChildrenRef> = new TypeRef("sys", 1269)

export function createWhitelabelChildrenRef(values: StrippedEntity<WhitelabelChildrenRef>): WhitelabelChildrenRef {
	return Object.assign(create(typeModels[WhitelabelChildrenRefTypeRef.typeId], WhitelabelChildrenRefTypeRef), values)
}

export type WhitelabelChildrenRef = {
	_type: TypeRef<WhitelabelChildrenRef>;

	_id: Id;

	items: Id;
}
export const WhitelabelParentTypeRef: TypeRef<WhitelabelParent> = new TypeRef("sys", 1272)

export function createWhitelabelParent(values: StrippedEntity<WhitelabelParent>): WhitelabelParent {
	return Object.assign(create(typeModels[WhitelabelParentTypeRef.typeId], WhitelabelParentTypeRef), values)
}

export type WhitelabelParent = {
	_type: TypeRef<WhitelabelParent>;

	_id: Id;

	customer: Id;
	whitelabelChildInParent: IdTuple;
}
export const CreditCardTypeRef: TypeRef<CreditCard> = new TypeRef("sys", 1313)

export function createCreditCard(values: StrippedEntity<CreditCard>): CreditCard {
	return Object.assign(create(typeModels[CreditCardTypeRef.typeId], CreditCardTypeRef), values)
}

export type CreditCard = {
	_type: TypeRef<CreditCard>;

	_id: Id;
	cardHolderName: string;
	number: string;
	cvv: string;
	expirationMonth: string;
	expirationYear: string;
}
export const LocationServiceGetReturnTypeRef: TypeRef<LocationServiceGetReturn> = new TypeRef("sys", 1321)

export function createLocationServiceGetReturn(values: StrippedEntity<LocationServiceGetReturn>): LocationServiceGetReturn {
	return Object.assign(create(typeModels[LocationServiceGetReturnTypeRef.typeId], LocationServiceGetReturnTypeRef), values)
}

export type LocationServiceGetReturn = {
	_type: TypeRef<LocationServiceGetReturn>;

	_format: NumberString;
	country: string;
}
export const OrderProcessingAgreementTypeRef: TypeRef<OrderProcessingAgreement> = new TypeRef("sys", 1326)

export function createOrderProcessingAgreement(values: StrippedEntity<OrderProcessingAgreement>): OrderProcessingAgreement {
	return Object.assign(create(typeModels[OrderProcessingAgreementTypeRef.typeId], OrderProcessingAgreementTypeRef), values)
}

export type OrderProcessingAgreement = {
	_type: TypeRef<OrderProcessingAgreement>;
	_errors: Object;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	version: string;
	customerAddress: string;
	signatureDate: Date;
	_ownerKeyVersion: null | NumberString;

	signerUserGroupInfo: IdTuple;
	customer: Id;
}
export const SignOrderProcessingAgreementDataTypeRef: TypeRef<SignOrderProcessingAgreementData> = new TypeRef("sys", 1342)

export function createSignOrderProcessingAgreementData(values: StrippedEntity<SignOrderProcessingAgreementData>): SignOrderProcessingAgreementData {
	return Object.assign(create(typeModels[SignOrderProcessingAgreementDataTypeRef.typeId], SignOrderProcessingAgreementDataTypeRef), values)
}

export type SignOrderProcessingAgreementData = {
	_type: TypeRef<SignOrderProcessingAgreementData>;

	_format: NumberString;
	version: string;
	customerAddress: string;
}
export const GeneratedIdWrapperTypeRef: TypeRef<GeneratedIdWrapper> = new TypeRef("sys", 1349)

export function createGeneratedIdWrapper(values: StrippedEntity<GeneratedIdWrapper>): GeneratedIdWrapper {
	return Object.assign(create(typeModels[GeneratedIdWrapperTypeRef.typeId], GeneratedIdWrapperTypeRef), values)
}

export type GeneratedIdWrapper = {
	_type: TypeRef<GeneratedIdWrapper>;

	_id: Id;
	value: Id;
}
export const SseConnectDataTypeRef: TypeRef<SseConnectData> = new TypeRef("sys", 1352)

export function createSseConnectData(values: StrippedEntity<SseConnectData>): SseConnectData {
	return Object.assign(create(typeModels[SseConnectDataTypeRef.typeId], SseConnectDataTypeRef), values)
}

export type SseConnectData = {
	_type: TypeRef<SseConnectData>;

	_format: NumberString;
	identifier: string;

	userIds: GeneratedIdWrapper[];
}
export const NotificationInfoTypeRef: TypeRef<NotificationInfo> = new TypeRef("sys", 1364)

export function createNotificationInfo(values: StrippedEntity<NotificationInfo>): NotificationInfo {
	return Object.assign(create(typeModels[NotificationInfoTypeRef.typeId], NotificationInfoTypeRef), values)
}

export type NotificationInfo = {
	_type: TypeRef<NotificationInfo>;

	_id: Id;
	mailAddress: string;
	userId: Id;

	mailId: null | IdTupleWrapper;
}
export const RecoverCodeTypeRef: TypeRef<RecoverCode> = new TypeRef("sys", 1407)

export function createRecoverCode(values: StrippedEntity<RecoverCode>): RecoverCode {
	return Object.assign(create(typeModels[RecoverCodeTypeRef.typeId], RecoverCodeTypeRef), values)
}

export type RecoverCode = {
	_type: TypeRef<RecoverCode>;

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

export function createResetFactorsDeleteData(values: StrippedEntity<ResetFactorsDeleteData>): ResetFactorsDeleteData {
	return Object.assign(create(typeModels[ResetFactorsDeleteDataTypeRef.typeId], ResetFactorsDeleteDataTypeRef), values)
}

export type ResetFactorsDeleteData = {
	_type: TypeRef<ResetFactorsDeleteData>;

	_format: NumberString;
	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: string;
}
export const UpgradePriceServiceDataTypeRef: TypeRef<UpgradePriceServiceData> = new TypeRef("sys", 1456)

export function createUpgradePriceServiceData(values: StrippedEntity<UpgradePriceServiceData>): UpgradePriceServiceData {
	return Object.assign(create(typeModels[UpgradePriceServiceDataTypeRef.typeId], UpgradePriceServiceDataTypeRef), values)
}

export type UpgradePriceServiceData = {
	_type: TypeRef<UpgradePriceServiceData>;

	_format: NumberString;
	date: null | Date;
	campaign: null | string;

	referralCode: null | Id;
}
export const PlanPricesTypeRef: TypeRef<PlanPrices> = new TypeRef("sys", 1460)

export function createPlanPrices(values: StrippedEntity<PlanPrices>): PlanPrices {
	return Object.assign(create(typeModels[PlanPricesTypeRef.typeId], PlanPricesTypeRef), values)
}

export type PlanPrices = {
	_type: TypeRef<PlanPrices>;

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

export function createUpgradePriceServiceReturn(values: StrippedEntity<UpgradePriceServiceReturn>): UpgradePriceServiceReturn {
	return Object.assign(create(typeModels[UpgradePriceServiceReturnTypeRef.typeId], UpgradePriceServiceReturnTypeRef), values)
}

export type UpgradePriceServiceReturn = {
	_type: TypeRef<UpgradePriceServiceReturn>;

	_format: NumberString;
	messageTextId: null | string;
	business: boolean;
	bonusMonthsForYearlyPlan: NumberString;

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

export function createRegistrationCaptchaServiceGetData(values: StrippedEntity<RegistrationCaptchaServiceGetData>): RegistrationCaptchaServiceGetData {
	return Object.assign(create(typeModels[RegistrationCaptchaServiceGetDataTypeRef.typeId], RegistrationCaptchaServiceGetDataTypeRef), values)
}

export type RegistrationCaptchaServiceGetData = {
	_type: TypeRef<RegistrationCaptchaServiceGetData>;

	_format: NumberString;
	token: null | string;
	mailAddress: string;
	signupToken: null | string;
	paidSubscriptionSelected: boolean;
	businessUseSelected: boolean;
}
export const WebsocketEntityDataTypeRef: TypeRef<WebsocketEntityData> = new TypeRef("sys", 1483)

export function createWebsocketEntityData(values: StrippedEntity<WebsocketEntityData>): WebsocketEntityData {
	return Object.assign(create(typeModels[WebsocketEntityDataTypeRef.typeId], WebsocketEntityDataTypeRef), values)
}

export type WebsocketEntityData = {
	_type: TypeRef<WebsocketEntityData>;

	_format: NumberString;
	eventBatchId: Id;
	eventBatchOwner: Id;

	eventBatch: EntityUpdate[];
}
export const WebsocketCounterValueTypeRef: TypeRef<WebsocketCounterValue> = new TypeRef("sys", 1488)

export function createWebsocketCounterValue(values: StrippedEntity<WebsocketCounterValue>): WebsocketCounterValue {
	return Object.assign(create(typeModels[WebsocketCounterValueTypeRef.typeId], WebsocketCounterValueTypeRef), values)
}

export type WebsocketCounterValue = {
	_type: TypeRef<WebsocketCounterValue>;

	_id: Id;
	counterId: Id;
	count: NumberString;
}
export const WebsocketCounterDataTypeRef: TypeRef<WebsocketCounterData> = new TypeRef("sys", 1492)

export function createWebsocketCounterData(values: StrippedEntity<WebsocketCounterData>): WebsocketCounterData {
	return Object.assign(create(typeModels[WebsocketCounterDataTypeRef.typeId], WebsocketCounterDataTypeRef), values)
}

export type WebsocketCounterData = {
	_type: TypeRef<WebsocketCounterData>;

	_format: NumberString;
	mailGroup: Id;

	counterValues: WebsocketCounterValue[];
}
export const CertificateInfoTypeRef: TypeRef<CertificateInfo> = new TypeRef("sys", 1500)

export function createCertificateInfo(values: StrippedEntity<CertificateInfo>): CertificateInfo {
	return Object.assign(create(typeModels[CertificateInfoTypeRef.typeId], CertificateInfoTypeRef), values)
}

export type CertificateInfo = {
	_type: TypeRef<CertificateInfo>;

	_id: Id;
	expiryDate: null | Date;
	state: NumberString;
	type: NumberString;

	certificate: null | Id;
}
export const NotificationMailTemplateTypeRef: TypeRef<NotificationMailTemplate> = new TypeRef("sys", 1517)

export function createNotificationMailTemplate(values: StrippedEntity<NotificationMailTemplate>): NotificationMailTemplate {
	return Object.assign(create(typeModels[NotificationMailTemplateTypeRef.typeId], NotificationMailTemplateTypeRef), values)
}

export type NotificationMailTemplate = {
	_type: TypeRef<NotificationMailTemplate>;

	_id: Id;
	language: string;
	body: string;
	subject: string;
}
export const CalendarEventRefTypeRef: TypeRef<CalendarEventRef> = new TypeRef("sys", 1532)

export function createCalendarEventRef(values: StrippedEntity<CalendarEventRef>): CalendarEventRef {
	return Object.assign(create(typeModels[CalendarEventRefTypeRef.typeId], CalendarEventRefTypeRef), values)
}

export type CalendarEventRef = {
	_type: TypeRef<CalendarEventRef>;

	_id: Id;
	elementId: Id;
	listId: Id;
}
export const AlarmInfoTypeRef: TypeRef<AlarmInfo> = new TypeRef("sys", 1536)

export function createAlarmInfo(values: StrippedEntity<AlarmInfo>): AlarmInfo {
	return Object.assign(create(typeModels[AlarmInfoTypeRef.typeId], AlarmInfoTypeRef), values)
}

export type AlarmInfo = {
	_type: TypeRef<AlarmInfo>;

	_id: Id;
	trigger: string;
	alarmIdentifier: string;

	calendarRef: CalendarEventRef;
}
export const UserAlarmInfoTypeRef: TypeRef<UserAlarmInfo> = new TypeRef("sys", 1541)

export function createUserAlarmInfo(values: StrippedEntity<UserAlarmInfo>): UserAlarmInfo {
	return Object.assign(create(typeModels[UserAlarmInfoTypeRef.typeId], UserAlarmInfoTypeRef), values)
}

export type UserAlarmInfo = {
	_type: TypeRef<UserAlarmInfo>;
	_errors: Object;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;

	alarmInfo: AlarmInfo;
}
export const UserAlarmInfoListTypeTypeRef: TypeRef<UserAlarmInfoListType> = new TypeRef("sys", 1549)

export function createUserAlarmInfoListType(values: StrippedEntity<UserAlarmInfoListType>): UserAlarmInfoListType {
	return Object.assign(create(typeModels[UserAlarmInfoListTypeTypeRef.typeId], UserAlarmInfoListTypeTypeRef), values)
}

export type UserAlarmInfoListType = {
	_type: TypeRef<UserAlarmInfoListType>;

	_id: Id;

	alarms: Id;
}
export const NotificationSessionKeyTypeRef: TypeRef<NotificationSessionKey> = new TypeRef("sys", 1553)

export function createNotificationSessionKey(values: StrippedEntity<NotificationSessionKey>): NotificationSessionKey {
	return Object.assign(create(typeModels[NotificationSessionKeyTypeRef.typeId], NotificationSessionKeyTypeRef), values)
}

export type NotificationSessionKey = {
	_type: TypeRef<NotificationSessionKey>;

	_id: Id;
	pushIdentifierSessionEncSessionKey: Uint8Array;

	pushIdentifier: IdTuple;
}
export const RepeatRuleTypeRef: TypeRef<RepeatRule> = new TypeRef("sys", 1557)

export function createRepeatRule(values: StrippedEntity<RepeatRule>): RepeatRule {
	return Object.assign(create(typeModels[RepeatRuleTypeRef.typeId], RepeatRuleTypeRef), values)
}

export type RepeatRule = {
	_type: TypeRef<RepeatRule>;

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

export function createAlarmNotification(values: StrippedEntity<AlarmNotification>): AlarmNotification {
	return Object.assign(create(typeModels[AlarmNotificationTypeRef.typeId], AlarmNotificationTypeRef), values)
}

export type AlarmNotification = {
	_type: TypeRef<AlarmNotification>;

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

export function createAlarmServicePost(values: StrippedEntity<AlarmServicePost>): AlarmServicePost {
	return Object.assign(create(typeModels[AlarmServicePostTypeRef.typeId], AlarmServicePostTypeRef), values)
}

export type AlarmServicePost = {
	_type: TypeRef<AlarmServicePost>;
	_errors: Object;

	_format: NumberString;

	alarmNotifications: AlarmNotification[];
}
export const DnsRecordTypeRef: TypeRef<DnsRecord> = new TypeRef("sys", 1581)

export function createDnsRecord(values: StrippedEntity<DnsRecord>): DnsRecord {
	return Object.assign(create(typeModels[DnsRecordTypeRef.typeId], DnsRecordTypeRef), values)
}

export type DnsRecord = {
	_type: TypeRef<DnsRecord>;

	_id: Id;
	subdomain: null | string;
	type: NumberString;
	value: string;
}
export const CustomDomainCheckGetInTypeRef: TypeRef<CustomDomainCheckGetIn> = new TypeRef("sys", 1586)

export function createCustomDomainCheckGetIn(values: StrippedEntity<CustomDomainCheckGetIn>): CustomDomainCheckGetIn {
	return Object.assign(create(typeModels[CustomDomainCheckGetInTypeRef.typeId], CustomDomainCheckGetInTypeRef), values)
}

export type CustomDomainCheckGetIn = {
	_type: TypeRef<CustomDomainCheckGetIn>;

	_format: NumberString;
	domain: string;

	customer: null | Id;
}
export const CustomDomainCheckGetOutTypeRef: TypeRef<CustomDomainCheckGetOut> = new TypeRef("sys", 1589)

export function createCustomDomainCheckGetOut(values: StrippedEntity<CustomDomainCheckGetOut>): CustomDomainCheckGetOut {
	return Object.assign(create(typeModels[CustomDomainCheckGetOutTypeRef.typeId], CustomDomainCheckGetOutTypeRef), values)
}

export type CustomDomainCheckGetOut = {
	_type: TypeRef<CustomDomainCheckGetOut>;

	_format: NumberString;
	checkResult: NumberString;

	missingRecords: DnsRecord[];
	invalidRecords: DnsRecord[];
	requiredRecords: DnsRecord[];
}
export const CloseSessionServicePostTypeRef: TypeRef<CloseSessionServicePost> = new TypeRef("sys", 1595)

export function createCloseSessionServicePost(values: StrippedEntity<CloseSessionServicePost>): CloseSessionServicePost {
	return Object.assign(create(typeModels[CloseSessionServicePostTypeRef.typeId], CloseSessionServicePostTypeRef), values)
}

export type CloseSessionServicePost = {
	_type: TypeRef<CloseSessionServicePost>;

	_format: NumberString;
	accessToken: string;

	sessionId: IdTuple;
}
export const ReceivedGroupInvitationTypeRef: TypeRef<ReceivedGroupInvitation> = new TypeRef("sys", 1602)

export function createReceivedGroupInvitation(values: StrippedEntity<ReceivedGroupInvitation>): ReceivedGroupInvitation {
	return Object.assign(create(typeModels[ReceivedGroupInvitationTypeRef.typeId], ReceivedGroupInvitationTypeRef), values)
}

export type ReceivedGroupInvitation = {
	_type: TypeRef<ReceivedGroupInvitation>;
	_errors: Object;

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

	sharedGroup: Id;
	sentInvitation: IdTuple;
}
export const UserGroupRootTypeRef: TypeRef<UserGroupRoot> = new TypeRef("sys", 1618)

export function createUserGroupRoot(values: StrippedEntity<UserGroupRoot>): UserGroupRoot {
	return Object.assign(create(typeModels[UserGroupRootTypeRef.typeId], UserGroupRootTypeRef), values)
}

export type UserGroupRoot = {
	_type: TypeRef<UserGroupRoot>;

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	invitations: Id;
	keyRotations: null | KeyRotationsRef;
	groupKeyUpdates: null | GroupKeyUpdatesRef;
}
export const PaymentErrorInfoTypeRef: TypeRef<PaymentErrorInfo> = new TypeRef("sys", 1632)

export function createPaymentErrorInfo(values: StrippedEntity<PaymentErrorInfo>): PaymentErrorInfo {
	return Object.assign(create(typeModels[PaymentErrorInfoTypeRef.typeId], PaymentErrorInfoTypeRef), values)
}

export type PaymentErrorInfo = {
	_type: TypeRef<PaymentErrorInfo>;

	_id: Id;
	errorTime: Date;
	errorCode: string;
	thirdPartyErrorId: string;
}
export const InvoiceItemTypeRef: TypeRef<InvoiceItem> = new TypeRef("sys", 1641)

export function createInvoiceItem(values: StrippedEntity<InvoiceItem>): InvoiceItem {
	return Object.assign(create(typeModels[InvoiceItemTypeRef.typeId], InvoiceItemTypeRef), values)
}

export type InvoiceItem = {
	_type: TypeRef<InvoiceItem>;

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

export function createInvoice(values: StrippedEntity<Invoice>): Invoice {
	return Object.assign(create(typeModels[InvoiceTypeRef.typeId], InvoiceTypeRef), values)
}

export type Invoice = {
	_type: TypeRef<Invoice>;
	_errors: Object;

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

	items: InvoiceItem[];
	customer: Id;
	bookings: IdTuple[];
}
export const MissedNotificationTypeRef: TypeRef<MissedNotification> = new TypeRef("sys", 1693)

export function createMissedNotification(values: StrippedEntity<MissedNotification>): MissedNotification {
	return Object.assign(create(typeModels[MissedNotificationTypeRef.typeId], MissedNotificationTypeRef), values)
}

export type MissedNotification = {
	_type: TypeRef<MissedNotification>;
	_errors: Object;

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	lastProcessedNotificationId: null | Id;
	_ownerKeyVersion: null | NumberString;

	notificationInfos: NotificationInfo[];
	alarmNotifications: AlarmNotification[];
}
export const BrandingDomainGetReturnTypeRef: TypeRef<BrandingDomainGetReturn> = new TypeRef("sys", 1723)

export function createBrandingDomainGetReturn(values: StrippedEntity<BrandingDomainGetReturn>): BrandingDomainGetReturn {
	return Object.assign(create(typeModels[BrandingDomainGetReturnTypeRef.typeId], BrandingDomainGetReturnTypeRef), values)
}

export type BrandingDomainGetReturn = {
	_type: TypeRef<BrandingDomainGetReturn>;

	_format: NumberString;

	certificateInfo: null | CertificateInfo;
}
export const RejectedSenderTypeRef: TypeRef<RejectedSender> = new TypeRef("sys", 1736)

export function createRejectedSender(values: StrippedEntity<RejectedSender>): RejectedSender {
	return Object.assign(create(typeModels[RejectedSenderTypeRef.typeId], RejectedSenderTypeRef), values)
}

export type RejectedSender = {
	_type: TypeRef<RejectedSender>;

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

export function createRejectedSendersRef(values: StrippedEntity<RejectedSendersRef>): RejectedSendersRef {
	return Object.assign(create(typeModels[RejectedSendersRefTypeRef.typeId], RejectedSendersRefTypeRef), values)
}

export type RejectedSendersRef = {
	_type: TypeRef<RejectedSendersRef>;

	_id: Id;

	items: Id;
}
export const SecondFactorAuthDeleteDataTypeRef: TypeRef<SecondFactorAuthDeleteData> = new TypeRef("sys", 1755)

export function createSecondFactorAuthDeleteData(values: StrippedEntity<SecondFactorAuthDeleteData>): SecondFactorAuthDeleteData {
	return Object.assign(create(typeModels[SecondFactorAuthDeleteDataTypeRef.typeId], SecondFactorAuthDeleteDataTypeRef), values)
}

export type SecondFactorAuthDeleteData = {
	_type: TypeRef<SecondFactorAuthDeleteData>;

	_format: NumberString;

	session: IdTuple;
}
export const TakeOverDeletedAddressDataTypeRef: TypeRef<TakeOverDeletedAddressData> = new TypeRef("sys", 1759)

export function createTakeOverDeletedAddressData(values: StrippedEntity<TakeOverDeletedAddressData>): TakeOverDeletedAddressData {
	return Object.assign(create(typeModels[TakeOverDeletedAddressDataTypeRef.typeId], TakeOverDeletedAddressDataTypeRef), values)
}

export type TakeOverDeletedAddressData = {
	_type: TypeRef<TakeOverDeletedAddressData>;

	_format: NumberString;
	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: null | string;
	targetAccountMailAddress: string;
}
export const WebsocketLeaderStatusTypeRef: TypeRef<WebsocketLeaderStatus> = new TypeRef("sys", 1766)

export function createWebsocketLeaderStatus(values: StrippedEntity<WebsocketLeaderStatus>): WebsocketLeaderStatus {
	return Object.assign(create(typeModels[WebsocketLeaderStatusTypeRef.typeId], WebsocketLeaderStatusTypeRef), values)
}

export type WebsocketLeaderStatus = {
	_type: TypeRef<WebsocketLeaderStatus>;

	_format: NumberString;
	leaderStatus: boolean;
}
export const GiftCardTypeRef: TypeRef<GiftCard> = new TypeRef("sys", 1769)

export function createGiftCard(values: StrippedEntity<GiftCard>): GiftCard {
	return Object.assign(create(typeModels[GiftCardTypeRef.typeId], GiftCardTypeRef), values)
}

export type GiftCard = {
	_type: TypeRef<GiftCard>;
	_errors: Object;

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
}
export const GiftCardsRefTypeRef: TypeRef<GiftCardsRef> = new TypeRef("sys", 1791)

export function createGiftCardsRef(values: StrippedEntity<GiftCardsRef>): GiftCardsRef {
	return Object.assign(create(typeModels[GiftCardsRefTypeRef.typeId], GiftCardsRefTypeRef), values)
}

export type GiftCardsRef = {
	_type: TypeRef<GiftCardsRef>;

	_id: Id;

	items: Id;
}
export const GiftCardOptionTypeRef: TypeRef<GiftCardOption> = new TypeRef("sys", 1795)

export function createGiftCardOption(values: StrippedEntity<GiftCardOption>): GiftCardOption {
	return Object.assign(create(typeModels[GiftCardOptionTypeRef.typeId], GiftCardOptionTypeRef), values)
}

export type GiftCardOption = {
	_type: TypeRef<GiftCardOption>;

	_id: Id;
	value: NumberString;
}
export const GiftCardGetReturnTypeRef: TypeRef<GiftCardGetReturn> = new TypeRef("sys", 1798)

export function createGiftCardGetReturn(values: StrippedEntity<GiftCardGetReturn>): GiftCardGetReturn {
	return Object.assign(create(typeModels[GiftCardGetReturnTypeRef.typeId], GiftCardGetReturnTypeRef), values)
}

export type GiftCardGetReturn = {
	_type: TypeRef<GiftCardGetReturn>;

	_format: NumberString;
	maxPerPeriod: NumberString;
	period: NumberString;

	options: GiftCardOption[];
}
export const GiftCardCreateDataTypeRef: TypeRef<GiftCardCreateData> = new TypeRef("sys", 1803)

export function createGiftCardCreateData(values: StrippedEntity<GiftCardCreateData>): GiftCardCreateData {
	return Object.assign(create(typeModels[GiftCardCreateDataTypeRef.typeId], GiftCardCreateDataTypeRef), values)
}

export type GiftCardCreateData = {
	_type: TypeRef<GiftCardCreateData>;
	_errors: Object;

	_format: NumberString;
	message: string;
	ownerEncSessionKey: Uint8Array;
	value: NumberString;
	keyHash: Uint8Array;
	ownerKeyVersion: NumberString;
}
export const GiftCardDeleteDataTypeRef: TypeRef<GiftCardDeleteData> = new TypeRef("sys", 1810)

export function createGiftCardDeleteData(values: StrippedEntity<GiftCardDeleteData>): GiftCardDeleteData {
	return Object.assign(create(typeModels[GiftCardDeleteDataTypeRef.typeId], GiftCardDeleteDataTypeRef), values)
}

export type GiftCardDeleteData = {
	_type: TypeRef<GiftCardDeleteData>;

	_format: NumberString;

	giftCard: IdTuple;
}
export const GiftCardCreateReturnTypeRef: TypeRef<GiftCardCreateReturn> = new TypeRef("sys", 1813)

export function createGiftCardCreateReturn(values: StrippedEntity<GiftCardCreateReturn>): GiftCardCreateReturn {
	return Object.assign(create(typeModels[GiftCardCreateReturnTypeRef.typeId], GiftCardCreateReturnTypeRef), values)
}

export type GiftCardCreateReturn = {
	_type: TypeRef<GiftCardCreateReturn>;

	_format: NumberString;

	giftCard: IdTuple;
}
export const GiftCardRedeemDataTypeRef: TypeRef<GiftCardRedeemData> = new TypeRef("sys", 1817)

export function createGiftCardRedeemData(values: StrippedEntity<GiftCardRedeemData>): GiftCardRedeemData {
	return Object.assign(create(typeModels[GiftCardRedeemDataTypeRef.typeId], GiftCardRedeemDataTypeRef), values)
}

export type GiftCardRedeemData = {
	_type: TypeRef<GiftCardRedeemData>;

	_format: NumberString;
	keyHash: Uint8Array;
	countryCode: string;

	giftCardInfo: Id;
}
export const GiftCardRedeemGetReturnTypeRef: TypeRef<GiftCardRedeemGetReturn> = new TypeRef("sys", 1821)

export function createGiftCardRedeemGetReturn(values: StrippedEntity<GiftCardRedeemGetReturn>): GiftCardRedeemGetReturn {
	return Object.assign(create(typeModels[GiftCardRedeemGetReturnTypeRef.typeId], GiftCardRedeemGetReturnTypeRef), values)
}

export type GiftCardRedeemGetReturn = {
	_type: TypeRef<GiftCardRedeemGetReturn>;
	_errors: Object;

	_format: NumberString;
	message: string;
	value: NumberString;

	giftCard: IdTuple;
}
export const Braintree3ds2RequestTypeRef: TypeRef<Braintree3ds2Request> = new TypeRef("sys", 1828)

export function createBraintree3ds2Request(values: StrippedEntity<Braintree3ds2Request>): Braintree3ds2Request {
	return Object.assign(create(typeModels[Braintree3ds2RequestTypeRef.typeId], Braintree3ds2RequestTypeRef), values)
}

export type Braintree3ds2Request = {
	_type: TypeRef<Braintree3ds2Request>;

	_id: Id;
	clientToken: string;
	nonce: string;
	bin: string;
}
export const Braintree3ds2ResponseTypeRef: TypeRef<Braintree3ds2Response> = new TypeRef("sys", 1833)

export function createBraintree3ds2Response(values: StrippedEntity<Braintree3ds2Response>): Braintree3ds2Response {
	return Object.assign(create(typeModels[Braintree3ds2ResponseTypeRef.typeId], Braintree3ds2ResponseTypeRef), values)
}

export type Braintree3ds2Response = {
	_type: TypeRef<Braintree3ds2Response>;

	_id: Id;
	clientToken: string;
	nonce: string;
}
export const PaymentDataServicePostDataTypeRef: TypeRef<PaymentDataServicePostData> = new TypeRef("sys", 1837)

export function createPaymentDataServicePostData(values: StrippedEntity<PaymentDataServicePostData>): PaymentDataServicePostData {
	return Object.assign(create(typeModels[PaymentDataServicePostDataTypeRef.typeId], PaymentDataServicePostDataTypeRef), values)
}

export type PaymentDataServicePostData = {
	_type: TypeRef<PaymentDataServicePostData>;

	_format: NumberString;

	braintree3dsResponse: Braintree3ds2Response;
}
export const PaymentDataServiceGetDataTypeRef: TypeRef<PaymentDataServiceGetData> = new TypeRef("sys", 1861)

export function createPaymentDataServiceGetData(values: StrippedEntity<PaymentDataServiceGetData>): PaymentDataServiceGetData {
	return Object.assign(create(typeModels[PaymentDataServiceGetDataTypeRef.typeId], PaymentDataServiceGetDataTypeRef), values)
}

export type PaymentDataServiceGetData = {
	_type: TypeRef<PaymentDataServiceGetData>;

	_format: NumberString;
	clientType: null | NumberString;
}
export const TypeInfoTypeRef: TypeRef<TypeInfo> = new TypeRef("sys", 1869)

export function createTypeInfo(values: StrippedEntity<TypeInfo>): TypeInfo {
	return Object.assign(create(typeModels[TypeInfoTypeRef.typeId], TypeInfoTypeRef), values)
}

export type TypeInfo = {
	_type: TypeRef<TypeInfo>;

	_id: Id;
	application: string;
	typeId: NumberString;
}
export const ArchiveRefTypeRef: TypeRef<ArchiveRef> = new TypeRef("sys", 1873)

export function createArchiveRef(values: StrippedEntity<ArchiveRef>): ArchiveRef {
	return Object.assign(create(typeModels[ArchiveRefTypeRef.typeId], ArchiveRefTypeRef), values)
}

export type ArchiveRef = {
	_type: TypeRef<ArchiveRef>;

	_id: Id;
	archiveId: Id;
}
export const ArchiveTypeTypeRef: TypeRef<ArchiveType> = new TypeRef("sys", 1876)

export function createArchiveType(values: StrippedEntity<ArchiveType>): ArchiveType {
	return Object.assign(create(typeModels[ArchiveTypeTypeRef.typeId], ArchiveTypeTypeRef), values)
}

export type ArchiveType = {
	_type: TypeRef<ArchiveType>;

	_id: Id;

	type: TypeInfo;
	active: ArchiveRef;
	inactive: ArchiveRef[];
}
export const BlobTypeRef: TypeRef<Blob> = new TypeRef("sys", 1882)

export function createBlob(values: StrippedEntity<Blob>): Blob {
	return Object.assign(create(typeModels[BlobTypeRef.typeId], BlobTypeRef), values)
}

export type Blob = {
	_type: TypeRef<Blob>;

	_id: Id;
	archiveId: Id;
	size: NumberString;
	blobId: Id;
}
export const WebauthnResponseDataTypeRef: TypeRef<WebauthnResponseData> = new TypeRef("sys", 1899)

export function createWebauthnResponseData(values: StrippedEntity<WebauthnResponseData>): WebauthnResponseData {
	return Object.assign(create(typeModels[WebauthnResponseDataTypeRef.typeId], WebauthnResponseDataTypeRef), values)
}

export type WebauthnResponseData = {
	_type: TypeRef<WebauthnResponseData>;

	_id: Id;
	keyHandle: Uint8Array;
	clientData: Uint8Array;
	authenticatorData: Uint8Array;
	signature: Uint8Array;
}
export const BlobReferenceTokenWrapperTypeRef: TypeRef<BlobReferenceTokenWrapper> = new TypeRef("sys", 1990)

export function createBlobReferenceTokenWrapper(values: StrippedEntity<BlobReferenceTokenWrapper>): BlobReferenceTokenWrapper {
	return Object.assign(create(typeModels[BlobReferenceTokenWrapperTypeRef.typeId], BlobReferenceTokenWrapperTypeRef), values)
}

export type BlobReferenceTokenWrapper = {
	_type: TypeRef<BlobReferenceTokenWrapper>;

	_id: Id;
	blobReferenceToken: string;
}
export const CustomerAccountTerminationRequestTypeRef: TypeRef<CustomerAccountTerminationRequest> = new TypeRef("sys", 2005)

export function createCustomerAccountTerminationRequest(values: StrippedEntity<CustomerAccountTerminationRequest>): CustomerAccountTerminationRequest {
	return Object.assign(create(typeModels[CustomerAccountTerminationRequestTypeRef.typeId], CustomerAccountTerminationRequestTypeRef), values)
}

export type CustomerAccountTerminationRequest = {
	_type: TypeRef<CustomerAccountTerminationRequest>;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	terminationDate: Date;
	terminationRequestDate: Date;

	customer: Id;
}
export const CustomerAccountTerminationPostInTypeRef: TypeRef<CustomerAccountTerminationPostIn> = new TypeRef("sys", 2015)

export function createCustomerAccountTerminationPostIn(values: StrippedEntity<CustomerAccountTerminationPostIn>): CustomerAccountTerminationPostIn {
	return Object.assign(create(typeModels[CustomerAccountTerminationPostInTypeRef.typeId], CustomerAccountTerminationPostInTypeRef), values)
}

export type CustomerAccountTerminationPostIn = {
	_type: TypeRef<CustomerAccountTerminationPostIn>;

	_format: NumberString;
	terminationDate: null | Date;

	surveyData: null | SurveyData;
}
export const CustomerAccountTerminationPostOutTypeRef: TypeRef<CustomerAccountTerminationPostOut> = new TypeRef("sys", 2018)

export function createCustomerAccountTerminationPostOut(values: StrippedEntity<CustomerAccountTerminationPostOut>): CustomerAccountTerminationPostOut {
	return Object.assign(create(typeModels[CustomerAccountTerminationPostOutTypeRef.typeId], CustomerAccountTerminationPostOutTypeRef), values)
}

export type CustomerAccountTerminationPostOut = {
	_type: TypeRef<CustomerAccountTerminationPostOut>;

	_format: NumberString;

	terminationRequest: IdTuple;
}
export const MailAddressAvailabilityTypeRef: TypeRef<MailAddressAvailability> = new TypeRef("sys", 2026)

export function createMailAddressAvailability(values: StrippedEntity<MailAddressAvailability>): MailAddressAvailability {
	return Object.assign(create(typeModels[MailAddressAvailabilityTypeRef.typeId], MailAddressAvailabilityTypeRef), values)
}

export type MailAddressAvailability = {
	_type: TypeRef<MailAddressAvailability>;

	_id: Id;
	mailAddress: string;
	available: boolean;
}
export const MultipleMailAddressAvailabilityDataTypeRef: TypeRef<MultipleMailAddressAvailabilityData> = new TypeRef("sys", 2030)

export function createMultipleMailAddressAvailabilityData(values: StrippedEntity<MultipleMailAddressAvailabilityData>): MultipleMailAddressAvailabilityData {
	return Object.assign(create(typeModels[MultipleMailAddressAvailabilityDataTypeRef.typeId], MultipleMailAddressAvailabilityDataTypeRef), values)
}

export type MultipleMailAddressAvailabilityData = {
	_type: TypeRef<MultipleMailAddressAvailabilityData>;

	_format: NumberString;

	mailAddresses: StringWrapper[];
}
export const MultipleMailAddressAvailabilityReturnTypeRef: TypeRef<MultipleMailAddressAvailabilityReturn> = new TypeRef("sys", 2033)

export function createMultipleMailAddressAvailabilityReturn(values: StrippedEntity<MultipleMailAddressAvailabilityReturn>): MultipleMailAddressAvailabilityReturn {
	return Object.assign(create(typeModels[MultipleMailAddressAvailabilityReturnTypeRef.typeId], MultipleMailAddressAvailabilityReturnTypeRef), values)
}

export type MultipleMailAddressAvailabilityReturn = {
	_type: TypeRef<MultipleMailAddressAvailabilityReturn>;

	_format: NumberString;

	availabilities: MailAddressAvailability[];
}
export const InstanceSessionKeyTypeRef: TypeRef<InstanceSessionKey> = new TypeRef("sys", 2037)

export function createInstanceSessionKey(values: StrippedEntity<InstanceSessionKey>): InstanceSessionKey {
	return Object.assign(create(typeModels[InstanceSessionKeyTypeRef.typeId], InstanceSessionKeyTypeRef), values)
}

export type InstanceSessionKey = {
	_type: TypeRef<InstanceSessionKey>;

	_id: Id;
	instanceList: Id;
	instanceId: Id;
	symEncSessionKey: Uint8Array;
	encryptionAuthStatus: null | Uint8Array;
	symKeyVersion: NumberString;

	typeInfo: TypeInfo;
}
export const BucketKeyTypeRef: TypeRef<BucketKey> = new TypeRef("sys", 2043)

export function createBucketKey(values: StrippedEntity<BucketKey>): BucketKey {
	return Object.assign(create(typeModels[BucketKeyTypeRef.typeId], BucketKeyTypeRef), values)
}

export type BucketKey = {
	_type: TypeRef<BucketKey>;

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

export function createUpdateSessionKeysPostIn(values: StrippedEntity<UpdateSessionKeysPostIn>): UpdateSessionKeysPostIn {
	return Object.assign(create(typeModels[UpdateSessionKeysPostInTypeRef.typeId], UpdateSessionKeysPostInTypeRef), values)
}

export type UpdateSessionKeysPostIn = {
	_type: TypeRef<UpdateSessionKeysPostIn>;

	_format: NumberString;

	ownerEncSessionKeys: InstanceSessionKey[];
}
export const ReferralCodeGetInTypeRef: TypeRef<ReferralCodeGetIn> = new TypeRef("sys", 2062)

export function createReferralCodeGetIn(values: StrippedEntity<ReferralCodeGetIn>): ReferralCodeGetIn {
	return Object.assign(create(typeModels[ReferralCodeGetInTypeRef.typeId], ReferralCodeGetInTypeRef), values)
}

export type ReferralCodeGetIn = {
	_type: TypeRef<ReferralCodeGetIn>;

	_format: NumberString;

	referralCode: Id;
}
export const ReferralCodePostInTypeRef: TypeRef<ReferralCodePostIn> = new TypeRef("sys", 2065)

export function createReferralCodePostIn(values: StrippedEntity<ReferralCodePostIn>): ReferralCodePostIn {
	return Object.assign(create(typeModels[ReferralCodePostInTypeRef.typeId], ReferralCodePostInTypeRef), values)
}

export type ReferralCodePostIn = {
	_type: TypeRef<ReferralCodePostIn>;

	_format: NumberString;
}
export const ReferralCodePostOutTypeRef: TypeRef<ReferralCodePostOut> = new TypeRef("sys", 2067)

export function createReferralCodePostOut(values: StrippedEntity<ReferralCodePostOut>): ReferralCodePostOut {
	return Object.assign(create(typeModels[ReferralCodePostOutTypeRef.typeId], ReferralCodePostOutTypeRef), values)
}

export type ReferralCodePostOut = {
	_type: TypeRef<ReferralCodePostOut>;

	_format: NumberString;

	referralCode: Id;
}
export const DateWrapperTypeRef: TypeRef<DateWrapper> = new TypeRef("sys", 2073)

export function createDateWrapper(values: StrippedEntity<DateWrapper>): DateWrapper {
	return Object.assign(create(typeModels[DateWrapperTypeRef.typeId], DateWrapperTypeRef), values)
}

export type DateWrapper = {
	_type: TypeRef<DateWrapper>;

	_id: Id;
	date: Date;
}
export const MailAddressAliasGetInTypeRef: TypeRef<MailAddressAliasGetIn> = new TypeRef("sys", 2095)

export function createMailAddressAliasGetIn(values: StrippedEntity<MailAddressAliasGetIn>): MailAddressAliasGetIn {
	return Object.assign(create(typeModels[MailAddressAliasGetInTypeRef.typeId], MailAddressAliasGetInTypeRef), values)
}

export type MailAddressAliasGetIn = {
	_type: TypeRef<MailAddressAliasGetIn>;

	_format: NumberString;

	targetGroup: Id;
}
export const PlanConfigurationTypeRef: TypeRef<PlanConfiguration> = new TypeRef("sys", 2104)

export function createPlanConfiguration(values: StrippedEntity<PlanConfiguration>): PlanConfiguration {
	return Object.assign(create(typeModels[PlanConfigurationTypeRef.typeId], PlanConfigurationTypeRef), values)
}

export type PlanConfiguration = {
	_type: TypeRef<PlanConfiguration>;

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
}
export const PlanServiceGetOutTypeRef: TypeRef<PlanServiceGetOut> = new TypeRef("sys", 2115)

export function createPlanServiceGetOut(values: StrippedEntity<PlanServiceGetOut>): PlanServiceGetOut {
	return Object.assign(create(typeModels[PlanServiceGetOutTypeRef.typeId], PlanServiceGetOutTypeRef), values)
}

export type PlanServiceGetOut = {
	_type: TypeRef<PlanServiceGetOut>;

	_format: NumberString;

	config: PlanConfiguration;
}
export const PublicKeyPutInTypeRef: TypeRef<PublicKeyPutIn> = new TypeRef("sys", 2150)

export function createPublicKeyPutIn(values: StrippedEntity<PublicKeyPutIn>): PublicKeyPutIn {
	return Object.assign(create(typeModels[PublicKeyPutInTypeRef.typeId], PublicKeyPutInTypeRef), values)
}

export type PublicKeyPutIn = {
	_type: TypeRef<PublicKeyPutIn>;

	_format: NumberString;
	pubEccKey: Uint8Array;
	symEncPrivEccKey: Uint8Array;

	keyGroup: Id;
}
export const InvoiceDataItemTypeRef: TypeRef<InvoiceDataItem> = new TypeRef("sys", 2162)

export function createInvoiceDataItem(values: StrippedEntity<InvoiceDataItem>): InvoiceDataItem {
	return Object.assign(create(typeModels[InvoiceDataItemTypeRef.typeId], InvoiceDataItemTypeRef), values)
}

export type InvoiceDataItem = {
	_type: TypeRef<InvoiceDataItem>;

	_id: Id;
	amount: NumberString;
	itemType: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
}
export const InvoiceDataGetOutTypeRef: TypeRef<InvoiceDataGetOut> = new TypeRef("sys", 2170)

export function createInvoiceDataGetOut(values: StrippedEntity<InvoiceDataGetOut>): InvoiceDataGetOut {
	return Object.assign(create(typeModels[InvoiceDataGetOutTypeRef.typeId], InvoiceDataGetOutTypeRef), values)
}

export type InvoiceDataGetOut = {
	_type: TypeRef<InvoiceDataGetOut>;

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

export function createInvoiceDataGetIn(values: StrippedEntity<InvoiceDataGetIn>): InvoiceDataGetIn {
	return Object.assign(create(typeModels[InvoiceDataGetInTypeRef.typeId], InvoiceDataGetInTypeRef), values)
}

export type InvoiceDataGetIn = {
	_type: TypeRef<InvoiceDataGetIn>;

	_format: NumberString;
	invoiceNumber: string;
}
export const ChangeKdfPostInTypeRef: TypeRef<ChangeKdfPostIn> = new TypeRef("sys", 2198)

export function createChangeKdfPostIn(values: StrippedEntity<ChangeKdfPostIn>): ChangeKdfPostIn {
	return Object.assign(create(typeModels[ChangeKdfPostInTypeRef.typeId], ChangeKdfPostInTypeRef), values)
}

export type ChangeKdfPostIn = {
	_type: TypeRef<ChangeKdfPostIn>;

	_format: NumberString;
	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	oldVerifier: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
}
export const GroupKeyTypeRef: TypeRef<GroupKey> = new TypeRef("sys", 2255)

export function createGroupKey(values: StrippedEntity<GroupKey>): GroupKey {
	return Object.assign(create(typeModels[GroupKeyTypeRef.typeId], GroupKeyTypeRef), values)
}

export type GroupKey = {
	_type: TypeRef<GroupKey>;

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

export function createGroupKeysRef(values: StrippedEntity<GroupKeysRef>): GroupKeysRef {
	return Object.assign(create(typeModels[GroupKeysRefTypeRef.typeId], GroupKeysRefTypeRef), values)
}

export type GroupKeysRef = {
	_type: TypeRef<GroupKeysRef>;

	_id: Id;

	list: Id;
}
export const KeyRotationTypeRef: TypeRef<KeyRotation> = new TypeRef("sys", 2283)

export function createKeyRotation(values: StrippedEntity<KeyRotation>): KeyRotation {
	return Object.assign(create(typeModels[KeyRotationTypeRef.typeId], KeyRotationTypeRef), values)
}

export type KeyRotation = {
	_type: TypeRef<KeyRotation>;

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

export function createKeyRotationsRef(values: StrippedEntity<KeyRotationsRef>): KeyRotationsRef {
	return Object.assign(create(typeModels[KeyRotationsRefTypeRef.typeId], KeyRotationsRefTypeRef), values)
}

export type KeyRotationsRef = {
	_type: TypeRef<KeyRotationsRef>;

	_id: Id;

	list: Id;
}
export const SurveyDataTypeRef: TypeRef<SurveyData> = new TypeRef("sys", 2295)

export function createSurveyData(values: StrippedEntity<SurveyData>): SurveyData {
	return Object.assign(create(typeModels[SurveyDataTypeRef.typeId], SurveyDataTypeRef), values)
}

export type SurveyData = {
	_type: TypeRef<SurveyData>;

	_id: Id;
	category: NumberString;
	reason: NumberString;
	details: null | string;
	version: NumberString;
}
export const IdTupleWrapperTypeRef: TypeRef<IdTupleWrapper> = new TypeRef("sys", 2315)

export function createIdTupleWrapper(values: StrippedEntity<IdTupleWrapper>): IdTupleWrapper {
	return Object.assign(create(typeModels[IdTupleWrapperTypeRef.typeId], IdTupleWrapperTypeRef), values)
}

export type IdTupleWrapper = {
	_type: TypeRef<IdTupleWrapper>;

	_id: Id;
	listId: Id;
	listElementId: Id;
}
export const UserGroupKeyDistributionTypeRef: TypeRef<UserGroupKeyDistribution> = new TypeRef("sys", 2320)

export function createUserGroupKeyDistribution(values: StrippedEntity<UserGroupKeyDistribution>): UserGroupKeyDistribution {
	return Object.assign(create(typeModels[UserGroupKeyDistributionTypeRef.typeId], UserGroupKeyDistributionTypeRef), values)
}

export type UserGroupKeyDistribution = {
	_type: TypeRef<UserGroupKeyDistribution>;

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	distributionEncUserGroupKey: Uint8Array;
	userGroupKeyVersion: NumberString;
}
export const GroupKeyRotationDataTypeRef: TypeRef<GroupKeyRotationData> = new TypeRef("sys", 2328)

export function createGroupKeyRotationData(values: StrippedEntity<GroupKeyRotationData>): GroupKeyRotationData {
	return Object.assign(create(typeModels[GroupKeyRotationDataTypeRef.typeId], GroupKeyRotationDataTypeRef), values)
}

export type GroupKeyRotationData = {
	_type: TypeRef<GroupKeyRotationData>;

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

export function createGroupKeyRotationPostIn(values: StrippedEntity<GroupKeyRotationPostIn>): GroupKeyRotationPostIn {
	return Object.assign(create(typeModels[GroupKeyRotationPostInTypeRef.typeId], GroupKeyRotationPostInTypeRef), values)
}

export type GroupKeyRotationPostIn = {
	_type: TypeRef<GroupKeyRotationPostIn>;

	_format: NumberString;

	groupKeyUpdates: GroupKeyRotationData[];
}
export const GroupKeyRotationInfoGetOutTypeRef: TypeRef<GroupKeyRotationInfoGetOut> = new TypeRef("sys", 2342)

export function createGroupKeyRotationInfoGetOut(values: StrippedEntity<GroupKeyRotationInfoGetOut>): GroupKeyRotationInfoGetOut {
	return Object.assign(create(typeModels[GroupKeyRotationInfoGetOutTypeRef.typeId], GroupKeyRotationInfoGetOutTypeRef), values)
}

export type GroupKeyRotationInfoGetOut = {
	_type: TypeRef<GroupKeyRotationInfoGetOut>;

	_format: NumberString;
	userOrAdminGroupKeyRotationScheduled: boolean;

	groupKeyUpdates: IdTuple[];
}
export const RecoverCodeDataTypeRef: TypeRef<RecoverCodeData> = new TypeRef("sys", 2346)

export function createRecoverCodeData(values: StrippedEntity<RecoverCodeData>): RecoverCodeData {
	return Object.assign(create(typeModels[RecoverCodeDataTypeRef.typeId], RecoverCodeDataTypeRef), values)
}

export type RecoverCodeData = {
	_type: TypeRef<RecoverCodeData>;

	_id: Id;
	userKeyVersion: NumberString;
	recoveryCodeEncUserGroupKey: Uint8Array;
	userEncRecoveryCode: Uint8Array;
	recoveryCodeVerifier: Uint8Array;
}
export const UserGroupKeyRotationDataTypeRef: TypeRef<UserGroupKeyRotationData> = new TypeRef("sys", 2352)

export function createUserGroupKeyRotationData(values: StrippedEntity<UserGroupKeyRotationData>): UserGroupKeyRotationData {
	return Object.assign(create(typeModels[UserGroupKeyRotationDataTypeRef.typeId], UserGroupKeyRotationDataTypeRef), values)
}

export type UserGroupKeyRotationData = {
	_type: TypeRef<UserGroupKeyRotationData>;

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

export function createAdminGroupKeyRotationPostIn(values: StrippedEntity<AdminGroupKeyRotationPostIn>): AdminGroupKeyRotationPostIn {
	return Object.assign(create(typeModels[AdminGroupKeyRotationPostInTypeRef.typeId], AdminGroupKeyRotationPostInTypeRef), values)
}

export type AdminGroupKeyRotationPostIn = {
	_type: TypeRef<AdminGroupKeyRotationPostIn>;

	_format: NumberString;

	adminGroupKeyData: GroupKeyRotationData;
	userGroupKeyData: UserGroupKeyRotationData;
	adminPubKeyMacList: KeyMac[];
	distribution: AdminGroupKeyDistributionElement[];
}
export const GroupKeyUpdateTypeRef: TypeRef<GroupKeyUpdate> = new TypeRef("sys", 2369)

export function createGroupKeyUpdate(values: StrippedEntity<GroupKeyUpdate>): GroupKeyUpdate {
	return Object.assign(create(typeModels[GroupKeyUpdateTypeRef.typeId], GroupKeyUpdateTypeRef), values)
}

export type GroupKeyUpdate = {
	_type: TypeRef<GroupKeyUpdate>;
	_errors: Object;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	groupKey: Uint8Array;
	groupKeyVersion: NumberString;

	bucketKey: BucketKey;
}
export const GroupKeyUpdatesRefTypeRef: TypeRef<GroupKeyUpdatesRef> = new TypeRef("sys", 2380)

export function createGroupKeyUpdatesRef(values: StrippedEntity<GroupKeyUpdatesRef>): GroupKeyUpdatesRef {
	return Object.assign(create(typeModels[GroupKeyUpdatesRefTypeRef.typeId], GroupKeyUpdatesRefTypeRef), values)
}

export type GroupKeyUpdatesRef = {
	_type: TypeRef<GroupKeyUpdatesRef>;

	_id: Id;

	list: Id;
}
export const PubEncKeyDataTypeRef: TypeRef<PubEncKeyData> = new TypeRef("sys", 2384)

export function createPubEncKeyData(values: StrippedEntity<PubEncKeyData>): PubEncKeyData {
	return Object.assign(create(typeModels[PubEncKeyDataTypeRef.typeId], PubEncKeyDataTypeRef), values)
}

export type PubEncKeyData = {
	_type: TypeRef<PubEncKeyData>;

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

export function createGroupKeyUpdateData(values: StrippedEntity<GroupKeyUpdateData>): GroupKeyUpdateData {
	return Object.assign(create(typeModels[GroupKeyUpdateDataTypeRef.typeId], GroupKeyUpdateDataTypeRef), values)
}

export type GroupKeyUpdateData = {
	_type: TypeRef<GroupKeyUpdateData>;

	_id: Id;
	sessionKeyEncGroupKeyVersion: NumberString;
	sessionKeyEncGroupKey: Uint8Array;
	bucketKeyEncSessionKey: Uint8Array;

	pubEncBucketKeyData: PubEncKeyData;
}
export const GroupMembershipKeyDataTypeRef: TypeRef<GroupMembershipKeyData> = new TypeRef("sys", 2398)

export function createGroupMembershipKeyData(values: StrippedEntity<GroupMembershipKeyData>): GroupMembershipKeyData {
	return Object.assign(create(typeModels[GroupMembershipKeyDataTypeRef.typeId], GroupMembershipKeyDataTypeRef), values)
}

export type GroupMembershipKeyData = {
	_type: TypeRef<GroupMembershipKeyData>;

	_id: Id;
	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;
	symEncGKey: Uint8Array;

	group: Id;
}
export const MembershipPutInTypeRef: TypeRef<MembershipPutIn> = new TypeRef("sys", 2404)

export function createMembershipPutIn(values: StrippedEntity<MembershipPutIn>): MembershipPutIn {
	return Object.assign(create(typeModels[MembershipPutInTypeRef.typeId], MembershipPutInTypeRef), values)
}

export type MembershipPutIn = {
	_type: TypeRef<MembershipPutIn>;

	_format: NumberString;

	groupKeyUpdates: GroupMembershipKeyData[];
}
export const GroupMembershipUpdateDataTypeRef: TypeRef<GroupMembershipUpdateData> = new TypeRef("sys", 2427)

export function createGroupMembershipUpdateData(values: StrippedEntity<GroupMembershipUpdateData>): GroupMembershipUpdateData {
	return Object.assign(create(typeModels[GroupMembershipUpdateDataTypeRef.typeId], GroupMembershipUpdateDataTypeRef), values)
}

export type GroupMembershipUpdateData = {
	_type: TypeRef<GroupMembershipUpdateData>;

	_id: Id;
	userEncGroupKey: Uint8Array;
	userKeyVersion: NumberString;

	userId: Id;
}
export const AffiliatePartnerKpiMonthSummaryTypeRef: TypeRef<AffiliatePartnerKpiMonthSummary> = new TypeRef("sys", 2453)

export function createAffiliatePartnerKpiMonthSummary(values: StrippedEntity<AffiliatePartnerKpiMonthSummary>): AffiliatePartnerKpiMonthSummary {
	return Object.assign(create(typeModels[AffiliatePartnerKpiMonthSummaryTypeRef.typeId], AffiliatePartnerKpiMonthSummaryTypeRef), values)
}

export type AffiliatePartnerKpiMonthSummary = {
	_type: TypeRef<AffiliatePartnerKpiMonthSummary>;

	_id: Id;
	monthTimestamp: NumberString;
	newFree: NumberString;
	newPaid: NumberString;
	totalFree: NumberString;
	totalPaid: NumberString;
	commission: NumberString;
}
export const AffiliatePartnerKpiServiceGetOutTypeRef: TypeRef<AffiliatePartnerKpiServiceGetOut> = new TypeRef("sys", 2461)

export function createAffiliatePartnerKpiServiceGetOut(values: StrippedEntity<AffiliatePartnerKpiServiceGetOut>): AffiliatePartnerKpiServiceGetOut {
	return Object.assign(create(typeModels[AffiliatePartnerKpiServiceGetOutTypeRef.typeId], AffiliatePartnerKpiServiceGetOutTypeRef), values)
}

export type AffiliatePartnerKpiServiceGetOut = {
	_type: TypeRef<AffiliatePartnerKpiServiceGetOut>;

	_format: NumberString;
	promotionId: string;
	accumulatedCommission: NumberString;
	creditedCommission: NumberString;

	kpis: AffiliatePartnerKpiMonthSummary[];
}
export const UserGroupKeyRotationPostInTypeRef: TypeRef<UserGroupKeyRotationPostIn> = new TypeRef("sys", 2471)

export function createUserGroupKeyRotationPostIn(values: StrippedEntity<UserGroupKeyRotationPostIn>): UserGroupKeyRotationPostIn {
	return Object.assign(create(typeModels[UserGroupKeyRotationPostInTypeRef.typeId], UserGroupKeyRotationPostInTypeRef), values)
}

export type UserGroupKeyRotationPostIn = {
	_type: TypeRef<UserGroupKeyRotationPostIn>;

	_format: NumberString;

	userGroupKeyData: UserGroupKeyRotationData;
}
export const KeyMacTypeRef: TypeRef<KeyMac> = new TypeRef("sys", 2477)

export function createKeyMac(values: StrippedEntity<KeyMac>): KeyMac {
	return Object.assign(create(typeModels[KeyMacTypeRef.typeId], KeyMacTypeRef), values)
}

export type KeyMac = {
	_type: TypeRef<KeyMac>;

	_id: Id;
	taggedKeyVersion: NumberString;
	tag: Uint8Array;
	taggingKeyVersion: NumberString;

	taggingGroup: Id;
}
export const AppStoreSubscriptionGetOutTypeRef: TypeRef<AppStoreSubscriptionGetOut> = new TypeRef("sys", 2497)

export function createAppStoreSubscriptionGetOut(values: StrippedEntity<AppStoreSubscriptionGetOut>): AppStoreSubscriptionGetOut {
	return Object.assign(create(typeModels[AppStoreSubscriptionGetOutTypeRef.typeId], AppStoreSubscriptionGetOutTypeRef), values)
}

export type AppStoreSubscriptionGetOut = {
	_type: TypeRef<AppStoreSubscriptionGetOut>;

	_format: NumberString;
	app: NumberString;
}
export const AppStoreSubscriptionGetInTypeRef: TypeRef<AppStoreSubscriptionGetIn> = new TypeRef("sys", 2500)

export function createAppStoreSubscriptionGetIn(values: StrippedEntity<AppStoreSubscriptionGetIn>): AppStoreSubscriptionGetIn {
	return Object.assign(create(typeModels[AppStoreSubscriptionGetInTypeRef.typeId], AppStoreSubscriptionGetInTypeRef), values)
}

export type AppStoreSubscriptionGetIn = {
	_type: TypeRef<AppStoreSubscriptionGetIn>;

	_format: NumberString;
	subscriptionId: string;
}
export const VerifierTokenServiceOutTypeRef: TypeRef<VerifierTokenServiceOut> = new TypeRef("sys", 2510)

export function createVerifierTokenServiceOut(values: StrippedEntity<VerifierTokenServiceOut>): VerifierTokenServiceOut {
	return Object.assign(create(typeModels[VerifierTokenServiceOutTypeRef.typeId], VerifierTokenServiceOutTypeRef), values)
}

export type VerifierTokenServiceOut = {
	_type: TypeRef<VerifierTokenServiceOut>;

	_format: NumberString;
	token: string;
}
export const VerifierTokenServiceInTypeRef: TypeRef<VerifierTokenServiceIn> = new TypeRef("sys", 2517)

export function createVerifierTokenServiceIn(values: StrippedEntity<VerifierTokenServiceIn>): VerifierTokenServiceIn {
	return Object.assign(create(typeModels[VerifierTokenServiceInTypeRef.typeId], VerifierTokenServiceInTypeRef), values)
}

export type VerifierTokenServiceIn = {
	_type: TypeRef<VerifierTokenServiceIn>;

	_format: NumberString;
	authVerifier: Uint8Array;
}
export const CalendarAdvancedRepeatRuleTypeRef: TypeRef<CalendarAdvancedRepeatRule> = new TypeRef("sys", 2521)

export function createCalendarAdvancedRepeatRule(values: StrippedEntity<CalendarAdvancedRepeatRule>): CalendarAdvancedRepeatRule {
	return Object.assign(create(typeModels[CalendarAdvancedRepeatRuleTypeRef.typeId], CalendarAdvancedRepeatRuleTypeRef), values)
}

export type CalendarAdvancedRepeatRule = {
	_type: TypeRef<CalendarAdvancedRepeatRule>;

	_id: Id;
	ruleType: NumberString;
	interval: string;
}
export const AdminGroupKeyDistributionElementTypeRef: TypeRef<AdminGroupKeyDistributionElement> = new TypeRef("sys", 2531)

export function createAdminGroupKeyDistributionElement(values: StrippedEntity<AdminGroupKeyDistributionElement>): AdminGroupKeyDistributionElement {
	return Object.assign(create(typeModels[AdminGroupKeyDistributionElementTypeRef.typeId], AdminGroupKeyDistributionElementTypeRef), values)
}

export type AdminGroupKeyDistributionElement = {
	_type: TypeRef<AdminGroupKeyDistributionElement>;

	_id: Id;

	userGroupId: Id;
	distEncAdminGroupKey: PubEncKeyData;
}
export const AdminGroupKeyRotationPutInTypeRef: TypeRef<AdminGroupKeyRotationPutIn> = new TypeRef("sys", 2536)

export function createAdminGroupKeyRotationPutIn(values: StrippedEntity<AdminGroupKeyRotationPutIn>): AdminGroupKeyRotationPutIn {
	return Object.assign(create(typeModels[AdminGroupKeyRotationPutInTypeRef.typeId], AdminGroupKeyRotationPutInTypeRef), values)
}

export type AdminGroupKeyRotationPutIn = {
	_type: TypeRef<AdminGroupKeyRotationPutIn>;

	_format: NumberString;

	distKeyMac: KeyMac;
	adminDistKeyPair: KeyPair;
}
export const PubDistributionKeyTypeRef: TypeRef<PubDistributionKey> = new TypeRef("sys", 2540)

export function createPubDistributionKey(values: StrippedEntity<PubDistributionKey>): PubDistributionKey {
	return Object.assign(create(typeModels[PubDistributionKeyTypeRef.typeId], PubDistributionKeyTypeRef), values)
}

export type PubDistributionKey = {
	_type: TypeRef<PubDistributionKey>;

	_id: Id;
	pubEccKey: Uint8Array;
	pubKyberKey: Uint8Array;

	userGroupId: Id;
	pubKeyMac: KeyMac;
}
export const AdminGroupKeyRotationGetOutTypeRef: TypeRef<AdminGroupKeyRotationGetOut> = new TypeRef("sys", 2546)

export function createAdminGroupKeyRotationGetOut(values: StrippedEntity<AdminGroupKeyRotationGetOut>): AdminGroupKeyRotationGetOut {
	return Object.assign(create(typeModels[AdminGroupKeyRotationGetOutTypeRef.typeId], AdminGroupKeyRotationGetOutTypeRef), values)
}

export type AdminGroupKeyRotationGetOut = {
	_type: TypeRef<AdminGroupKeyRotationGetOut>;

	_format: NumberString;

	userGroupIdsMissingDistributionKeys: Id[];
	distributionKeys: PubDistributionKey[];
}
