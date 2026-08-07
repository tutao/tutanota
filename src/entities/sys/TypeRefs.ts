import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId, DataTransferId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"
import { Nullable } from "@tutao/utils"


export const KeyPairTypeRef: TypeRef<KeyPair> = new TypeRef("sys", 0)

export function createKeyPair(values: KeyPairParams): KeyPair {
    return Object.assign(create(typeModels[KeyPairTypeRef.typeId], KeyPairTypeRef), values)
}


export type KeyPairParams = {


	pubRsaKey: null | Uint8Array<ArrayBuffer>;
	symEncPrivRsaKey: null | Uint8Array<ArrayBuffer>;
	pubEccKey: null | Uint8Array<ArrayBuffer>;
	symEncPrivEccKey: null | Uint8Array<ArrayBuffer>;
	pubKyberKey: null | Uint8Array<ArrayBuffer>;
	symEncPrivKyberKey: null | Uint8Array<ArrayBuffer>;
	


	signature: null | PublicKeySignature;
}

export type KeyPair = {
    // == values

	_id: Id;
	pubRsaKey: null | Uint8Array<ArrayBuffer>;
	symEncPrivRsaKey: null | Uint8Array<ArrayBuffer>;
	pubEccKey: null | Uint8Array<ArrayBuffer>;
	symEncPrivEccKey: null | Uint8Array<ArrayBuffer>;
	pubKyberKey: null | Uint8Array<ArrayBuffer>;
	symEncPrivKyberKey: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	signature: null | PublicKeySignature;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<KeyPair>;
    _original: Nullable<KeyPair>
    isAdapter: false,
}
export const GroupTypeRef: TypeRef<Group> = new TypeRef("sys", 5)

export function createGroup(values: GroupParams): Group {
    return Object.assign(create(typeModels[GroupTypeRef.typeId], GroupTypeRef), values)
}


export type GroupParams = {


	type: NumberString;
	adminGroupEncGKey: null | Uint8Array<ArrayBuffer>;
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	type: NumberString;
	adminGroupEncGKey: null | Uint8Array<ArrayBuffer>;
	enabled: boolean;
	_ownerGroup: null | Id;
	external: boolean;
	adminGroupKeyVersion: null | NumberString;
	groupKeyVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

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


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Group>;
    _original: Nullable<Group>
    isAdapter: false,
}
export const GroupInfoTypeRef: TypeRef<GroupInfo> = new TypeRef("sys", 14)

export function createGroupInfo(values: GroupInfoParams): GroupInfo {
    return Object.assign(create(typeModels[GroupInfoTypeRef.typeId], GroupInfoTypeRef), values)
}


export type GroupInfoParams = {


	_listEncSessionKey: null | Uint8Array<ArrayBuffer>;
	name: string;
	mailAddress: null | string;
	created: Date;
	deleted: null | Date;
	groupType: null | NumberString;
	


	group: Id;
	mailAddressAliases: MailAddressAlias[];
}

export type GroupInfo = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_listEncSessionKey: null | Uint8Array<ArrayBuffer>;
	name: string;
	mailAddress: null | string;
	created: Date;
	deleted: null | Date;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	groupType: null | NumberString;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	group: Id;
	mailAddressAliases: MailAddressAlias[];


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupInfo>;
    _errors: Object;
    _original: Nullable<GroupInfo>
    isAdapter: false,
}
export const GroupMembershipTypeRef: TypeRef<GroupMembership> = new TypeRef("sys", 25)

export function createGroupMembership(values: GroupMembershipParams): GroupMembership {
    return Object.assign(create(typeModels[GroupMembershipTypeRef.typeId], GroupMembershipTypeRef), values)
}


export type GroupMembershipParams = {


	symEncGKey: Uint8Array<ArrayBuffer>;
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
    // == values

	_id: Id;
	symEncGKey: Uint8Array<ArrayBuffer>;
	admin: boolean;
	groupType: null | NumberString;
	capability: null | NumberString;
	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	group: Id;
	groupInfo: IdTuple;
	groupMember: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupMembership>;
    _original: Nullable<GroupMembership>
    isAdapter: false,
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	type: NumberString;
	approvalStatus: NumberString;
	_ownerGroup: null | Id;
	orderProcessingAgreementNeeded: boolean;
	businessUse: boolean;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

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


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Customer>;
    _original: Nullable<Customer>
    isAdapter: false,
}
export const AuthenticatedDeviceTypeRef: TypeRef<AuthenticatedDevice> = new TypeRef("sys", 43)

export function createAuthenticatedDevice(values: AuthenticatedDeviceParams): AuthenticatedDevice {
    return Object.assign(create(typeModels[AuthenticatedDeviceTypeRef.typeId], AuthenticatedDeviceTypeRef), values)
}


export type AuthenticatedDeviceParams = {


	authType: NumberString;
	deviceToken: string;
	deviceKey: Uint8Array<ArrayBuffer>;
	

}

export type AuthenticatedDevice = {
    // == values

	_id: Id;
	authType: NumberString;
	deviceToken: string;
	deviceKey: Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AuthenticatedDevice>;
    _original: Nullable<AuthenticatedDevice>
    isAdapter: false,
}
export const LoginTypeRef: TypeRef<Login> = new TypeRef("sys", 48)

export function createLogin(values: LoginParams): Login {
    return Object.assign(create(typeModels[LoginTypeRef.typeId], LoginTypeRef), values)
}


export type LoginParams = {


	time: Date;
	

}

export type Login = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	time: Date;
	_ownerGroup: null | Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Login>;
    _original: Nullable<Login>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	code: string;
	verifyCount: NumberString;
	finished: boolean;
	service: string;
	_ownerGroup: null | Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SecondFactorAuthentication>;
    _original: Nullable<SecondFactorAuthentication>
    isAdapter: false,
}
export const VariableExternalAuthInfoTypeRef: TypeRef<VariableExternalAuthInfo> = new TypeRef("sys", 66)

export function createVariableExternalAuthInfo(values: VariableExternalAuthInfoParams): VariableExternalAuthInfo {
    return Object.assign(create(typeModels[VariableExternalAuthInfoTypeRef.typeId], VariableExternalAuthInfoTypeRef), values)
}


export type VariableExternalAuthInfoParams = {


	loggedInVerifier: null | Uint8Array<ArrayBuffer>;
	loggedInTimestamp: null | Date;
	loggedInIpAddressHash: null | Uint8Array<ArrayBuffer>;
	sentCount: NumberString;
	lastSentTimestamp: Date;
	authUpdateCounter: NumberString;
	

}

export type VariableExternalAuthInfo = {
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	loggedInVerifier: null | Uint8Array<ArrayBuffer>;
	loggedInTimestamp: null | Date;
	loggedInIpAddressHash: null | Uint8Array<ArrayBuffer>;
	sentCount: NumberString;
	lastSentTimestamp: Date;
	authUpdateCounter: NumberString;
	_ownerGroup: null | Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<VariableExternalAuthInfo>;
    _original: Nullable<VariableExternalAuthInfo>
    isAdapter: false,
}
export const UserExternalAuthInfoTypeRef: TypeRef<UserExternalAuthInfo> = new TypeRef("sys", 77)

export function createUserExternalAuthInfo(values: UserExternalAuthInfoParams): UserExternalAuthInfo {
    return Object.assign(create(typeModels[UserExternalAuthInfoTypeRef.typeId], UserExternalAuthInfoTypeRef), values)
}


export type UserExternalAuthInfoParams = {


	autoAuthenticationId: Id;
	latestSaltHash: null | Uint8Array<ArrayBuffer>;
	autoTransmitPassword: null | string;
	authUpdateCounter: NumberString;
	


	variableAuthInfo: Id;
}

export type UserExternalAuthInfo = {
    // == values

	_id: Id;
	autoAuthenticationId: Id;
	latestSaltHash: null | Uint8Array<ArrayBuffer>;
	autoTransmitPassword: null | string;
	authUpdateCounter: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	variableAuthInfo: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserExternalAuthInfo>;
    _original: Nullable<UserExternalAuthInfo>
    isAdapter: false,
}
export const UserTypeRef: TypeRef<User> = new TypeRef("sys", 84)

export function createUser(values: UserParams): User {
    return Object.assign(create(typeModels[UserTypeRef.typeId], UserTypeRef), values)
}


export type UserParams = {


	salt: null | Uint8Array<ArrayBuffer>;
	verifier: Uint8Array<ArrayBuffer>;
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	salt: null | Uint8Array<ArrayBuffer>;
	verifier: Uint8Array<ArrayBuffer>;
	accountType: NumberString;
	enabled: boolean;
	_ownerGroup: null | Id;
	requirePasswordUpdate: boolean;
	kdfVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

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


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<User>;
    _original: Nullable<User>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	user: Id;
	userGroup: Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ExternalUserReference>;
    _original: Nullable<ExternalUserReference>
    isAdapter: false,
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	externalGroupInfos: Id;
	externalUserReferences: Id;
	externalUserAreaGroupInfos: null | UserAreaGroups;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupRoot>;
    _original: Nullable<GroupRoot>
    isAdapter: false,
}
export const BucketPermissionTypeRef: TypeRef<BucketPermission> = new TypeRef("sys", 118)

export function createBucketPermission(values: BucketPermissionParams): BucketPermission {
    return Object.assign(create(typeModels[BucketPermissionTypeRef.typeId], BucketPermissionTypeRef), values)
}


export type BucketPermissionParams = {


	type: NumberString;
	symEncBucketKey: null | Uint8Array<ArrayBuffer>;
	pubEncBucketKey: null | Uint8Array<ArrayBuffer>;
	pubKeyVersion: null | NumberString;
	ownerEncBucketKey: null | Uint8Array<ArrayBuffer>;
	protocolVersion: NumberString;
	symKeyVersion: null | NumberString;
	senderKeyVersion: null | NumberString;
	


	group: Id;
}

export type BucketPermission = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	type: NumberString;
	symEncBucketKey: null | Uint8Array<ArrayBuffer>;
	pubEncBucketKey: null | Uint8Array<ArrayBuffer>;
	pubKeyVersion: null | NumberString;
	_ownerGroup: null | Id;
	ownerEncBucketKey: null | Uint8Array<ArrayBuffer>;
	protocolVersion: NumberString;
	ownerKeyVersion: null | NumberString;
	symKeyVersion: null | NumberString;
	senderKeyVersion: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	group: Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BucketPermission>;
    _original: Nullable<BucketPermission>
    isAdapter: false,
}
export const BucketTypeRef: TypeRef<Bucket> = new TypeRef("sys", 129)

export function createBucket(values: BucketParams): Bucket {
    return Object.assign(create(typeModels[BucketTypeRef.typeId], BucketTypeRef), values)
}


export type BucketParams = {


	


	bucketPermissions: Id;
}

export type Bucket = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	bucketPermissions: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Bucket>;
    _original: Nullable<Bucket>
    isAdapter: false,
}
export const PermissionTypeRef: TypeRef<Permission> = new TypeRef("sys", 132)

export function createPermission(values: PermissionParams): Permission {
    return Object.assign(create(typeModels[PermissionTypeRef.typeId], PermissionTypeRef), values)
}


export type PermissionParams = {


	type: NumberString;
	symEncSessionKey: null | Uint8Array<ArrayBuffer>;
	bucketEncSessionKey: null | Uint8Array<ArrayBuffer>;
	ops: null | string;
	listElementTypeId: null | NumberString;
	listElementApplication: null | string;
	symKeyVersion: null | NumberString;
	


	group: null | Id;
	bucket: null | Bucket;
}

export type Permission = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	type: NumberString;
	symEncSessionKey: null | Uint8Array<ArrayBuffer>;
	bucketEncSessionKey: null | Uint8Array<ArrayBuffer>;
	ops: null | string;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	listElementTypeId: null | NumberString;
	listElementApplication: null | string;
	_ownerKeyVersion: null | NumberString;
	symKeyVersion: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	group: null | Id;
	bucket: null | Bucket;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Permission>;
    _original: Nullable<Permission>
    isAdapter: false,
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
    // == values

	_id: ElementId;
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
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	paymentAccountIdentifier: null | string;
	paypalBillingAgreement: null | string;
	_modified: Date;
	_ownerKeyVersion: null | NumberString;
	lastUsedOffer: null | string;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	invoiceInfo: null | Id;
	appStoreSubscription: null | IdTuple;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AccountingInfo>;
    _errors: Object;
    _original: Nullable<AccountingInfo>
    isAdapter: false,
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
	renewalReminderSentForSubscriptionEnd: null | Date;
	


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
    // == values

	_id: ListElementId;
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
	renewalReminderSentForSubscriptionEnd: null | Date;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

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


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomerInfo>;
    _original: Nullable<CustomerInfo>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	inviteeMailAddress: string;
	capability: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	sharedGroup: Id;
	receivedInvitation: null | IdTuple;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SentGroupInvitation>;
    _original: Nullable<SentGroupInvitation>
    isAdapter: false,
}
export const MailAddressToGroupTypeRef: TypeRef<MailAddressToGroup> = new TypeRef("sys", 204)

export function createMailAddressToGroup(values: MailAddressToGroupParams): MailAddressToGroup {
    return Object.assign(create(typeModels[MailAddressToGroupTypeRef.typeId], MailAddressToGroupTypeRef), values)
}


export type MailAddressToGroupParams = {


	


	internalGroup: null | Id;
}

export type MailAddressToGroup = {
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	internalGroup: null | Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MailAddressToGroup>;
    _original: Nullable<MailAddressToGroup>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	capability: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	userGroupInfo: IdTuple;
	group: Id;
	user: Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupMember>;
    _original: Nullable<GroupMember>
    isAdapter: false,
}
export const RootInstanceTypeRef: TypeRef<RootInstance> = new TypeRef("sys", 231)

export function createRootInstance(values: RootInstanceParams): RootInstance {
    return Object.assign(create(typeModels[RootInstanceTypeRef.typeId], RootInstanceTypeRef), values)
}


export type RootInstanceParams = {


	reference: Id;
	

}

export type RootInstance = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	reference: Id;
	_ownerGroup: null | Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RootInstance>;
    _original: Nullable<RootInstance>
    isAdapter: false,
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
	versionData: null | Uint8Array<ArrayBuffer>;
	


	author: Id;
	authorGroupInfo: IdTuple;
}

export type VersionInfo = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	app: string;
	type: NumberString;
	referenceList: null | Id;
	timestamp: Date;
	operation: string;
	versionData: null | Uint8Array<ArrayBuffer>;
	_ownerGroup: null | Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	author: Id;
	authorGroupInfo: IdTuple;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<VersionInfo>;
    _original: Nullable<VersionInfo>
    isAdapter: false,
}
export const SystemKeysReturnTypeRef: TypeRef<SystemKeysReturn> = new TypeRef("sys", 301)

export function createSystemKeysReturn(values: SystemKeysReturnParams): SystemKeysReturn {
    return Object.assign(create(typeModels[SystemKeysReturnTypeRef.typeId], SystemKeysReturnTypeRef), values)
}


export type SystemKeysReturnParams = {


	systemAdminPubRsaKey: null | Uint8Array<ArrayBuffer>;
	systemAdminPubKeyVersion: NumberString;
	freeGroupKey: Uint8Array<ArrayBuffer>;
	premiumGroupKey: Uint8Array<ArrayBuffer>;
	systemAdminPubEccKey: null | Uint8Array<ArrayBuffer>;
	systemAdminPubKyberKey: null | Uint8Array<ArrayBuffer>;
	freeGroupKeyVersion: NumberString;
	premiumGroupKeyVersion: NumberString;
	


	freeGroup: null | Id;
	premiumGroup: null | Id;
}

export type SystemKeysReturn = {
    // == values

	_format: NumberString;
	systemAdminPubRsaKey: null | Uint8Array<ArrayBuffer>;
	systemAdminPubKeyVersion: NumberString;
	freeGroupKey: Uint8Array<ArrayBuffer>;
	premiumGroupKey: Uint8Array<ArrayBuffer>;
	systemAdminPubEccKey: null | Uint8Array<ArrayBuffer>;
	systemAdminPubKyberKey: null | Uint8Array<ArrayBuffer>;
	freeGroupKeyVersion: NumberString;
	premiumGroupKeyVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	freeGroup: null | Id;
	premiumGroup: null | Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SystemKeysReturn>;
    _original: Nullable<SystemKeysReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	state: NumberString;
	source: null | string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RegistrationServiceData>;
    _original: Nullable<RegistrationServiceData>
    isAdapter: false,
}
export const RegistrationReturnTypeRef: TypeRef<RegistrationReturn> = new TypeRef("sys", 326)

export function createRegistrationReturn(values: RegistrationReturnParams): RegistrationReturn {
    return Object.assign(create(typeModels[RegistrationReturnTypeRef.typeId], RegistrationReturnTypeRef), values)
}


export type RegistrationReturnParams = {


	authToken: string;
	

}

export type RegistrationReturn = {
    // == values

	_format: NumberString;
	authToken: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RegistrationReturn>;
    _original: Nullable<RegistrationReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	authToken: string;
	language: string;
	accountType: NumberString;
	mobilePhoneNumber: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SendRegistrationCodeData>;
    _original: Nullable<SendRegistrationCodeData>
    isAdapter: false,
}
export const SendRegistrationCodeReturnTypeRef: TypeRef<SendRegistrationCodeReturn> = new TypeRef("sys", 347)

export function createSendRegistrationCodeReturn(values: SendRegistrationCodeReturnParams): SendRegistrationCodeReturn {
    return Object.assign(create(typeModels[SendRegistrationCodeReturnTypeRef.typeId], SendRegistrationCodeReturnTypeRef), values)
}


export type SendRegistrationCodeReturnParams = {


	authToken: string;
	

}

export type SendRegistrationCodeReturn = {
    // == values

	_format: NumberString;
	authToken: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SendRegistrationCodeReturn>;
    _original: Nullable<SendRegistrationCodeReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	authToken: string;
	code: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<VerifyRegistrationCodeData>;
    _original: Nullable<VerifyRegistrationCodeData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	restore: boolean;
	date: null | Date;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	user: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserDataDelete>;
    _original: Nullable<UserDataDelete>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	identifier: string;
	version: null | NumberString;
	identifierType: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PublicKeyGetIn>;
    _original: Nullable<PublicKeyGetIn>
    isAdapter: false,
}
export const PublicKeyGetOutTypeRef: TypeRef<PublicKeyGetOut> = new TypeRef("sys", 412)

export function createPublicKeyGetOut(values: PublicKeyGetOutParams): PublicKeyGetOut {
    return Object.assign(create(typeModels[PublicKeyGetOutTypeRef.typeId], PublicKeyGetOutTypeRef), values)
}


export type PublicKeyGetOutParams = {


	pubRsaKey: null | Uint8Array<ArrayBuffer>;
	pubKeyVersion: NumberString;
	pubEccKey: null | Uint8Array<ArrayBuffer>;
	pubKyberKey: null | Uint8Array<ArrayBuffer>;
	


	signature: null | PublicKeySignature;
}

export type PublicKeyGetOut = {
    // == values

	_format: NumberString;
	pubRsaKey: null | Uint8Array<ArrayBuffer>;
	pubKeyVersion: NumberString;
	pubEccKey: null | Uint8Array<ArrayBuffer>;
	pubKyberKey: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	signature: null | PublicKeySignature;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PublicKeyGetOut>;
    _original: Nullable<PublicKeyGetOut>
    isAdapter: false,
}
export const SaltDataTypeRef: TypeRef<SaltData> = new TypeRef("sys", 417)

export function createSaltData(values: SaltDataParams): SaltData {
    return Object.assign(create(typeModels[SaltDataTypeRef.typeId], SaltDataTypeRef), values)
}


export type SaltDataParams = {


	mailAddress: string;
	

}

export type SaltData = {
    // == values

	_format: NumberString;
	mailAddress: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SaltData>;
    _original: Nullable<SaltData>
    isAdapter: false,
}
export const SaltReturnTypeRef: TypeRef<SaltReturn> = new TypeRef("sys", 420)

export function createSaltReturn(values: SaltReturnParams): SaltReturn {
    return Object.assign(create(typeModels[SaltReturnTypeRef.typeId], SaltReturnTypeRef), values)
}


export type SaltReturnParams = {


	salt: Uint8Array<ArrayBuffer>;
	kdfVersion: NumberString;
	

}

export type SaltReturn = {
    // == values

	_format: NumberString;
	salt: Uint8Array<ArrayBuffer>;
	kdfVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SaltReturn>;
    _original: Nullable<SaltReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	deviceToken: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	userId: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AutoLoginDataGet>;
    _original: Nullable<AutoLoginDataGet>
    isAdapter: false,
}
export const AutoLoginDataDeleteTypeRef: TypeRef<AutoLoginDataDelete> = new TypeRef("sys", 435)

export function createAutoLoginDataDelete(values: AutoLoginDataDeleteParams): AutoLoginDataDelete {
    return Object.assign(create(typeModels[AutoLoginDataDeleteTypeRef.typeId], AutoLoginDataDeleteTypeRef), values)
}


export type AutoLoginDataDeleteParams = {


	deviceToken: string;
	

}

export type AutoLoginDataDelete = {
    // == values

	_format: NumberString;
	deviceToken: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AutoLoginDataDelete>;
    _original: Nullable<AutoLoginDataDelete>
    isAdapter: false,
}
export const AutoLoginDataReturnTypeRef: TypeRef<AutoLoginDataReturn> = new TypeRef("sys", 438)

export function createAutoLoginDataReturn(values: AutoLoginDataReturnParams): AutoLoginDataReturn {
    return Object.assign(create(typeModels[AutoLoginDataReturnTypeRef.typeId], AutoLoginDataReturnTypeRef), values)
}


export type AutoLoginDataReturnParams = {


	deviceKey: Uint8Array<ArrayBuffer>;
	

}

export type AutoLoginDataReturn = {
    // == values

	_format: NumberString;
	deviceKey: Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AutoLoginDataReturn>;
    _original: Nullable<AutoLoginDataReturn>
    isAdapter: false,
}
export const AutoLoginPostReturnTypeRef: TypeRef<AutoLoginPostReturn> = new TypeRef("sys", 441)

export function createAutoLoginPostReturn(values: AutoLoginPostReturnParams): AutoLoginPostReturn {
    return Object.assign(create(typeModels[AutoLoginPostReturnTypeRef.typeId], AutoLoginPostReturnTypeRef), values)
}


export type AutoLoginPostReturnParams = {


	deviceToken: string;
	

}

export type AutoLoginPostReturn = {
    // == values

	_format: NumberString;
	deviceToken: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AutoLoginPostReturn>;
    _original: Nullable<AutoLoginPostReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	ownerEncSessionKey: Uint8Array<ArrayBuffer>;
	ownerKeyVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	permission: IdTuple;
	bucketPermission: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UpdatePermissionKeyData>;
    _original: Nullable<UpdatePermissionKeyData>
    isAdapter: false,
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
    // == values

	_id: Id;
	application: string;
	instanceListId: string;
	instanceId: string;
	operation: NumberString;
	typeId: NumberString;
	instance: null | string;
	blobInstance: null | string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	patch: null | PatchList;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<EntityUpdate>;
    _original: Nullable<EntityUpdate>
    isAdapter: false,
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
    // == values

	_id: Id;
	version: Id;
	timestamp: Date;
	operation: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	author: Id;
	authorGroupInfo: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Version>;
    _original: Nullable<Version>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	application: string;
	typeId: NumberString;
	id: Id;
	listId: null | Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<VersionData>;
    _original: Nullable<VersionData>
    isAdapter: false,
}
export const VersionReturnTypeRef: TypeRef<VersionReturn> = new TypeRef("sys", 493)

export function createVersionReturn(values: VersionReturnParams): VersionReturn {
    return Object.assign(create(typeModels[VersionReturnTypeRef.typeId], VersionReturnTypeRef), values)
}


export type VersionReturnParams = {


	


	versions: Version[];
}

export type VersionReturn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	versions: Version[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<VersionReturn>;
    _original: Nullable<VersionReturn>
    isAdapter: false,
}
export const MembershipAddDataTypeRef: TypeRef<MembershipAddData> = new TypeRef("sys", 505)

export function createMembershipAddData(values: MembershipAddDataParams): MembershipAddData {
    return Object.assign(create(typeModels[MembershipAddDataTypeRef.typeId], MembershipAddDataTypeRef), values)
}


export type MembershipAddDataParams = {


	symEncGKey: Uint8Array<ArrayBuffer>;
	symKeyVersion: NumberString;
	groupKeyVersion: NumberString;
	


	user: Id;
	group: Id;
}

export type MembershipAddData = {
    // == values

	_format: NumberString;
	symEncGKey: Uint8Array<ArrayBuffer>;
	symKeyVersion: NumberString;
	groupKeyVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	user: Id;
	group: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MembershipAddData>;
    _original: Nullable<MembershipAddData>
    isAdapter: false,
}
export const ChangePasswordPostInTypeRef: TypeRef<ChangePasswordPostIn> = new TypeRef("sys", 534)

export function createChangePasswordPostIn(values: ChangePasswordPostInParams): ChangePasswordPostIn {
    return Object.assign(create(typeModels[ChangePasswordPostInTypeRef.typeId], ChangePasswordPostInTypeRef), values)
}


export type ChangePasswordPostInParams = {


	verifier: Uint8Array<ArrayBuffer>;
	salt: Uint8Array<ArrayBuffer>;
	pwEncUserGroupKey: Uint8Array<ArrayBuffer>;
	code: null | string;
	oldVerifier: null | Uint8Array<ArrayBuffer>;
	recoverCodeVerifier: null | Uint8Array<ArrayBuffer>;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
	

}

export type ChangePasswordPostIn = {
    // == values

	_format: NumberString;
	verifier: Uint8Array<ArrayBuffer>;
	salt: Uint8Array<ArrayBuffer>;
	pwEncUserGroupKey: Uint8Array<ArrayBuffer>;
	code: null | string;
	oldVerifier: null | Uint8Array<ArrayBuffer>;
	recoverCodeVerifier: null | Uint8Array<ArrayBuffer>;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ChangePasswordPostIn>;
    _original: Nullable<ChangePasswordPostIn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	type: null | NumberString;
	otpCode: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	u2f: null | U2fResponseData;
	session: null | IdTuple;
	webauthn: null | WebauthnResponseData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SecondFactorAuthData>;
    _original: Nullable<SecondFactorAuthData>
    isAdapter: false,
}
export const SecondFactorAuthAllowedReturnTypeRef: TypeRef<SecondFactorAuthAllowedReturn> = new TypeRef("sys", 546)

export function createSecondFactorAuthAllowedReturn(values: SecondFactorAuthAllowedReturnParams): SecondFactorAuthAllowedReturn {
    return Object.assign(create(typeModels[SecondFactorAuthAllowedReturnTypeRef.typeId], SecondFactorAuthAllowedReturnTypeRef), values)
}


export type SecondFactorAuthAllowedReturnParams = {


	allowed: boolean;
	

}

export type SecondFactorAuthAllowedReturn = {
    // == values

	_format: NumberString;
	allowed: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SecondFactorAuthAllowedReturn>;
    _original: Nullable<SecondFactorAuthAllowedReturn>
    isAdapter: false,
}
export const ResetPasswordPostInTypeRef: TypeRef<ResetPasswordPostIn> = new TypeRef("sys", 584)

export function createResetPasswordPostIn(values: ResetPasswordPostInParams): ResetPasswordPostIn {
    return Object.assign(create(typeModels[ResetPasswordPostInTypeRef.typeId], ResetPasswordPostInTypeRef), values)
}


export type ResetPasswordPostInParams = {


	verifier: Uint8Array<ArrayBuffer>;
	salt: Uint8Array<ArrayBuffer>;
	pwEncUserGroupKey: Uint8Array<ArrayBuffer>;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
	


	user: Id;
}

export type ResetPasswordPostIn = {
    // == values

	_format: NumberString;
	verifier: Uint8Array<ArrayBuffer>;
	salt: Uint8Array<ArrayBuffer>;
	pwEncUserGroupKey: Uint8Array<ArrayBuffer>;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	user: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ResetPasswordPostIn>;
    _original: Nullable<ResetPasswordPostIn>
    isAdapter: false,
}
export const DomainMailAddressAvailabilityDataTypeRef: TypeRef<DomainMailAddressAvailabilityData> = new TypeRef("sys", 599)

export function createDomainMailAddressAvailabilityData(values: DomainMailAddressAvailabilityDataParams): DomainMailAddressAvailabilityData {
    return Object.assign(create(typeModels[DomainMailAddressAvailabilityDataTypeRef.typeId], DomainMailAddressAvailabilityDataTypeRef), values)
}


export type DomainMailAddressAvailabilityDataParams = {


	mailAddress: string;
	

}

export type DomainMailAddressAvailabilityData = {
    // == values

	_format: NumberString;
	mailAddress: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<DomainMailAddressAvailabilityData>;
    _original: Nullable<DomainMailAddressAvailabilityData>
    isAdapter: false,
}
export const DomainMailAddressAvailabilityReturnTypeRef: TypeRef<DomainMailAddressAvailabilityReturn> = new TypeRef("sys", 602)

export function createDomainMailAddressAvailabilityReturn(values: DomainMailAddressAvailabilityReturnParams): DomainMailAddressAvailabilityReturn {
    return Object.assign(create(typeModels[DomainMailAddressAvailabilityReturnTypeRef.typeId], DomainMailAddressAvailabilityReturnTypeRef), values)
}


export type DomainMailAddressAvailabilityReturnParams = {


	available: boolean;
	

}

export type DomainMailAddressAvailabilityReturn = {
    // == values

	_format: NumberString;
	available: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<DomainMailAddressAvailabilityReturn>;
    _original: Nullable<DomainMailAddressAvailabilityReturn>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
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
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	displayName: string;
	lastUsageTime: Date;
	_ownerKeyVersion: null | NumberString;
	app: NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PushIdentifier>;
    _errors: Object;
    _original: Nullable<PushIdentifier>
    isAdapter: false,
}
export const PushIdentifierListTypeRef: TypeRef<PushIdentifierList> = new TypeRef("sys", 635)

export function createPushIdentifierList(values: PushIdentifierListParams): PushIdentifierList {
    return Object.assign(create(typeModels[PushIdentifierListTypeRef.typeId], PushIdentifierListTypeRef), values)
}


export type PushIdentifierListParams = {


	


	list: Id;
}

export type PushIdentifierList = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	list: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PushIdentifierList>;
    _original: Nullable<PushIdentifierList>
    isAdapter: false,
}
export const DeleteCustomerDataTypeRef: TypeRef<DeleteCustomerData> = new TypeRef("sys", 641)

export function createDeleteCustomerData(values: DeleteCustomerDataParams): DeleteCustomerData {
    return Object.assign(create(typeModels[DeleteCustomerDataTypeRef.typeId], DeleteCustomerDataTypeRef), values)
}


export type DeleteCustomerDataParams = {


	undelete: boolean;
	formattedReason: null | string;
	takeoverMailAddress: null | string;
	authVerifier: null | Uint8Array<ArrayBuffer>;
	reason: null | NumberString;
	


	customer: Id;
	surveyData: null | SurveyData;
	abuseDeactivationInfos: AbuseInfo[];
}

export type DeleteCustomerData = {
    // == values

	_format: NumberString;
	undelete: boolean;
	formattedReason: null | string;
	takeoverMailAddress: null | string;
	authVerifier: null | Uint8Array<ArrayBuffer>;
	reason: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	customer: Id;
	surveyData: null | SurveyData;
	abuseDeactivationInfos: AbuseInfo[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<DeleteCustomerData>;
    _original: Nullable<DeleteCustomerData>
    isAdapter: false,
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	externalUserWelcomeMessage: string;
	lastUpgradeReminder: null | Date;
	_ownerGroup: null | Id;
	usageDataOptedOut: boolean;
	requireTwoFactor: boolean;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	smallLogo: null | File;
	bigLogo: null | File;
	notificationMailTemplates: NotificationMailTemplate[];


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomerProperties>;
    _original: Nullable<CustomerProperties>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	message: string;
	accountType: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	smallLogo: null | File;
	bigLogo: null | File;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ExternalPropertiesReturn>;
    _original: Nullable<ExternalPropertiesReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	token: string;
	visualChallengeResponse: null | string;
	audioChallengeResponse: null | string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RegistrationCaptchaServiceData>;
    _original: Nullable<RegistrationCaptchaServiceData>
    isAdapter: false,
}
export const RegistrationCaptchaServiceReturnTypeRef: TypeRef<RegistrationCaptchaServiceReturn> = new TypeRef("sys", 678)

export function createRegistrationCaptchaServiceReturn(values: RegistrationCaptchaServiceReturnParams): RegistrationCaptchaServiceReturn {
    return Object.assign(create(typeModels[RegistrationCaptchaServiceReturnTypeRef.typeId], RegistrationCaptchaServiceReturnTypeRef), values)
}


export type RegistrationCaptchaServiceReturnParams = {


	token: string;
	challenge: null | Uint8Array<ArrayBuffer>;
	


	visualChallenge: null | CaptchaChallenge;
	audioChallenge: null | CaptchaChallenge;
}

export type RegistrationCaptchaServiceReturn = {
    // == values

	_format: NumberString;
	token: string;
	challenge: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	visualChallenge: null | CaptchaChallenge;
	audioChallenge: null | CaptchaChallenge;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RegistrationCaptchaServiceReturn>;
    _original: Nullable<RegistrationCaptchaServiceReturn>
    isAdapter: false,
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
    // == values

	_id: Id;
	mailAddress: string;
	enabled: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MailAddressAlias>;
    _original: Nullable<MailAddressAlias>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	mailAddress: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	group: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MailAddressAliasServiceData>;
    _original: Nullable<MailAddressAliasServiceData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	nbrOfFreeAliases: NumberString;
	totalAliases: NumberString;
	usedAliases: NumberString;
	enabledAliases: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MailAddressAliasServiceReturn>;
    _original: Nullable<MailAddressAliasServiceReturn>
    isAdapter: false,
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
    // == values

	_id: Id;
	domain: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	catchAllMailGroup: null | Id;
	whitelabelConfig: null | Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<DomainInfo>;
    _original: Nullable<DomainInfo>
    isAdapter: false,
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
    // == values

	_id: Id;
	featureType: NumberString;
	currentCount: NumberString;
	maxCount: NumberString;
	totalInvoicedCount: NumberString;
	currentInvoicedCount: NumberString;
	price: NumberString;
	priceType: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BookingItem>;
    _original: Nullable<BookingItem>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
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

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	items: BookingItem[];
	subscriptionReference: SubscriptionReference;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Booking>;
    _original: Nullable<Booking>
    isAdapter: false,
}
export const BookingsRefTypeRef: TypeRef<BookingsRef> = new TypeRef("sys", 722)

export function createBookingsRef(values: BookingsRefParams): BookingsRef {
    return Object.assign(create(typeModels[BookingsRefTypeRef.typeId], BookingsRefTypeRef), values)
}


export type BookingsRefParams = {


	


	items: Id;
}

export type BookingsRef = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	items: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BookingsRef>;
    _original: Nullable<BookingsRef>
    isAdapter: false,
}
export const StringWrapperTypeRef: TypeRef<StringWrapper> = new TypeRef("sys", 728)

export function createStringWrapper(values: StringWrapperParams): StringWrapper {
    return Object.assign(create(typeModels[StringWrapperTypeRef.typeId], StringWrapperTypeRef), values)
}


export type StringWrapperParams = {


	value: string;
	

}

export type StringWrapper = {
    // == values

	_id: Id;
	value: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<StringWrapper>;
    _original: Nullable<StringWrapper>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	validationResult: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	invalidDnsRecords: StringWrapper[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomDomainReturn>;
    _original: Nullable<CustomDomainReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	domain: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	catchAllMailGroup: null | Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomDomainData>;
    _original: Nullable<CustomDomainData>
    isAdapter: false,
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
    // == values

	_id: ElementId;
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

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	paymentErrorInfo: null | PaymentErrorInfo;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<InvoiceInfo>;
    _original: Nullable<InvoiceInfo>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	accountType: NumberString;
	date: null | Date;
	plan: NumberString;
	customer: null | Id;
	specialPriceUserSingle: null | NumberString;
	app: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	referralCode: null | Id;
	surveyData: null | SurveyData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SwitchAccountTypePostIn>;
    _original: Nullable<SwitchAccountTypePostIn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	mailAddress: string;
	restore: boolean;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	group: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MailAddressAliasServiceDataDelete>;
    _original: Nullable<MailAddressAliasServiceDataDelete>
    isAdapter: false,
}
export const PaymentDataServiceGetReturnTypeRef: TypeRef<PaymentDataServiceGetReturn> = new TypeRef("sys", 790)

export function createPaymentDataServiceGetReturn(values: PaymentDataServiceGetReturnParams): PaymentDataServiceGetReturn {
    return Object.assign(create(typeModels[PaymentDataServiceGetReturnTypeRef.typeId], PaymentDataServiceGetReturnTypeRef), values)
}


export type PaymentDataServiceGetReturnParams = {


	loginUrl: string;
	

}

export type PaymentDataServiceGetReturn = {
    // == values

	_format: NumberString;
	loginUrl: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PaymentDataServiceGetReturn>;
    _original: Nullable<PaymentDataServiceGetReturn>
    isAdapter: false,
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
    // == values

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

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	creditCard: null | CreditCard;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PaymentDataServicePutData>;
    _errors: Object;
    _original: Nullable<PaymentDataServicePutData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	result: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	braintree3dsRequest: null | Braintree3ds2Request;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PaymentDataServicePutReturn>;
    _original: Nullable<PaymentDataServicePutReturn>
    isAdapter: false,
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
    // == values

	_id: Id;
	featureType: NumberString;
	count: NumberString;
	business: null | boolean;
	paymentInterval: null | NumberString;
	accountType: null | NumberString;
	reactivate: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PriceRequestData>;
    _original: Nullable<PriceRequestData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	date: null | Date;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	priceRequest: null | PriceRequestData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PriceServiceData>;
    _original: Nullable<PriceServiceData>
    isAdapter: false,
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
    // == values

	_id: Id;
	featureType: NumberString;
	count: NumberString;
	price: NumberString;
	singleType: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PriceItemData>;
    _original: Nullable<PriceItemData>
    isAdapter: false,
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
    // == values

	_id: Id;
	price: NumberString;
	taxIncluded: boolean;
	paymentInterval: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	items: PriceItemData[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PriceData>;
    _original: Nullable<PriceData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	periodEndDate: Date;
	currentPeriodAddedPrice: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	currentPriceThisPeriod: null | PriceData;
	currentPriceNextPeriod: null | PriceData;
	futurePriceNextPeriod: null | PriceData;
	futurePriceThisPeriod: null | PriceData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PriceServiceReturn>;
    _original: Nullable<PriceServiceReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	user: Id;
	group: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MembershipRemoveData>;
    _original: Nullable<MembershipRemoveData>
    isAdapter: false,
}
export const FileTypeRef: TypeRef<File> = new TypeRef("sys", 917)

export function createFile(values: FileParams): File {
    return Object.assign(create(typeModels[FileTypeRef.typeId], FileTypeRef), values)
}


export type FileParams = {


	name: string;
	mimeType: string;
	data: Uint8Array<ArrayBuffer>;
	

}

export type File = {
    // == values

	_id: Id;
	name: string;
	mimeType: string;
	data: Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<File>;
    _original: Nullable<File>
    isAdapter: false,
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
    // == values

	_id: Id;
	hashedValue: string;
	value: string;
	type: NumberString;
	field: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<EmailSenderListElement>;
    _original: Nullable<EmailSenderListElement>
    isAdapter: false,
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	requirePasswordUpdateAfterReset: boolean;
	saveEncryptedIpAddressInSession: boolean;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	emailSenderList: EmailSenderListElement[];


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomerServerProperties>;
    _errors: Object;
    _original: Nullable<CustomerServerProperties>
    isAdapter: false,
}
export const CreateCustomerServerPropertiesDataTypeRef: TypeRef<CreateCustomerServerPropertiesData> = new TypeRef("sys", 961)

export function createCreateCustomerServerPropertiesData(values: CreateCustomerServerPropertiesDataParams): CreateCustomerServerPropertiesData {
    return Object.assign(create(typeModels[CreateCustomerServerPropertiesDataTypeRef.typeId], CreateCustomerServerPropertiesDataTypeRef), values)
}


export type CreateCustomerServerPropertiesDataParams = {


	adminGroupEncSessionKey: Uint8Array<ArrayBuffer>;
	adminGroupKeyVersion: NumberString;
	

}

export type CreateCustomerServerPropertiesData = {
    // == values

	_format: NumberString;
	adminGroupEncSessionKey: Uint8Array<ArrayBuffer>;
	adminGroupKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CreateCustomerServerPropertiesData>;
    _original: Nullable<CreateCustomerServerPropertiesData>
    isAdapter: false,
}
export const CreateCustomerServerPropertiesReturnTypeRef: TypeRef<CreateCustomerServerPropertiesReturn> = new TypeRef("sys", 964)

export function createCreateCustomerServerPropertiesReturn(values: CreateCustomerServerPropertiesReturnParams): CreateCustomerServerPropertiesReturn {
    return Object.assign(create(typeModels[CreateCustomerServerPropertiesReturnTypeRef.typeId], CreateCustomerServerPropertiesReturnTypeRef), values)
}


export type CreateCustomerServerPropertiesReturnParams = {


	


	id: Id;
}

export type CreateCustomerServerPropertiesReturn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	id: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CreateCustomerServerPropertiesReturn>;
    _original: Nullable<CreateCustomerServerPropertiesReturn>
    isAdapter: false,
}
export const UserAreaGroupsTypeRef: TypeRef<UserAreaGroups> = new TypeRef("sys", 988)

export function createUserAreaGroups(values: UserAreaGroupsParams): UserAreaGroups {
    return Object.assign(create(typeModels[UserAreaGroupsTypeRef.typeId], UserAreaGroupsTypeRef), values)
}


export type UserAreaGroupsParams = {


	


	list: Id;
}

export type UserAreaGroups = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	list: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserAreaGroups>;
    _original: Nullable<UserAreaGroups>
    isAdapter: false,
}
export const DebitServicePutDataTypeRef: TypeRef<DebitServicePutData> = new TypeRef("sys", 1041)

export function createDebitServicePutData(values: DebitServicePutDataParams): DebitServicePutData {
    return Object.assign(create(typeModels[DebitServicePutDataTypeRef.typeId], DebitServicePutDataTypeRef), values)
}


export type DebitServicePutDataParams = {


	

}

export type DebitServicePutData = {
    // == values

	_format: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<DebitServicePutData>;
    _original: Nullable<DebitServicePutData>
    isAdapter: false,
}
export const EntityEventBatchTypeRef: TypeRef<EntityEventBatch> = new TypeRef("sys", 1079)

export function createEntityEventBatch(values: EntityEventBatchParams): EntityEventBatch {
    return Object.assign(create(typeModels[EntityEventBatchTypeRef.typeId], EntityEventBatchTypeRef), values)
}


export type EntityEventBatchParams = {


	


	events: EntityUpdate[];
}

export type EntityEventBatch = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	events: EntityUpdate[];


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<EntityEventBatch>;
    _original: Nullable<EntityEventBatch>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	actorMailAddress: string;
	actorIpAddress: null | string;
	action: string;
	modifiedEntity: string;
	date: Date;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	groupInfo: null | IdTuple;
	modifiedGroupInfo: null | IdTuple;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AuditLogEntry>;
    _errors: Object;
    _original: Nullable<AuditLogEntry>
    isAdapter: false,
}
export const AuditLogRefTypeRef: TypeRef<AuditLogRef> = new TypeRef("sys", 1114)

export function createAuditLogRef(values: AuditLogRefParams): AuditLogRef {
    return Object.assign(create(typeModels[AuditLogRefTypeRef.typeId], AuditLogRefTypeRef), values)
}


export type AuditLogRefParams = {


	


	items: Id;
}

export type AuditLogRef = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	items: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AuditLogRef>;
    _original: Nullable<AuditLogRef>
    isAdapter: false,
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	jsonTheme: string;
	metaTags: string;
	germanLanguageCode: null | string;
	imprintUrl: null | string;
	privacyStatementUrl: null | string;
	whitelabelCode: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	bootstrapCustomizations: BootstrapFeature[];
	whitelabelRegistrationDomains: StringWrapper[];


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WhitelabelConfig>;
    _original: Nullable<WhitelabelConfig>
    isAdapter: false,
}
export const BrandingDomainDataTypeRef: TypeRef<BrandingDomainData> = new TypeRef("sys", 1149)

export function createBrandingDomainData(values: BrandingDomainDataParams): BrandingDomainData {
    return Object.assign(create(typeModels[BrandingDomainDataTypeRef.typeId], BrandingDomainDataTypeRef), values)
}


export type BrandingDomainDataParams = {


	domain: string;
	sessionEncPemCertificateChain: null | Uint8Array<ArrayBuffer>;
	sessionEncPemPrivateKey: null | Uint8Array<ArrayBuffer>;
	systemAdminPubEncSessionKey: Uint8Array<ArrayBuffer>;
	systemAdminPublicProtocolVersion: NumberString;
	systemAdminPubKeyVersion: NumberString;
	

}

export type BrandingDomainData = {
    // == values

	_format: NumberString;
	domain: string;
	sessionEncPemCertificateChain: null | Uint8Array<ArrayBuffer>;
	sessionEncPemPrivateKey: null | Uint8Array<ArrayBuffer>;
	systemAdminPubEncSessionKey: Uint8Array<ArrayBuffer>;
	systemAdminPublicProtocolVersion: NumberString;
	systemAdminPubKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BrandingDomainData>;
    _original: Nullable<BrandingDomainData>
    isAdapter: false,
}
export const BrandingDomainDeleteDataTypeRef: TypeRef<BrandingDomainDeleteData> = new TypeRef("sys", 1155)

export function createBrandingDomainDeleteData(values: BrandingDomainDeleteDataParams): BrandingDomainDeleteData {
    return Object.assign(create(typeModels[BrandingDomainDeleteDataTypeRef.typeId], BrandingDomainDeleteDataTypeRef), values)
}


export type BrandingDomainDeleteDataParams = {


	domain: string;
	

}

export type BrandingDomainDeleteData = {
    // == values

	_format: NumberString;
	domain: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BrandingDomainDeleteData>;
    _original: Nullable<BrandingDomainDeleteData>
    isAdapter: false,
}
export const U2fRegisteredDeviceTypeRef: TypeRef<U2fRegisteredDevice> = new TypeRef("sys", 1162)

export function createU2fRegisteredDevice(values: U2fRegisteredDeviceParams): U2fRegisteredDevice {
    return Object.assign(create(typeModels[U2fRegisteredDeviceTypeRef.typeId], U2fRegisteredDeviceTypeRef), values)
}


export type U2fRegisteredDeviceParams = {


	keyHandle: Uint8Array<ArrayBuffer>;
	appId: string;
	publicKey: Uint8Array<ArrayBuffer>;
	counter: NumberString;
	compromised: boolean;
	

}

export type U2fRegisteredDevice = {
    // == values

	_id: Id;
	keyHandle: Uint8Array<ArrayBuffer>;
	appId: string;
	publicKey: Uint8Array<ArrayBuffer>;
	counter: NumberString;
	compromised: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<U2fRegisteredDevice>;
    _original: Nullable<U2fRegisteredDevice>
    isAdapter: false,
}
export const SecondFactorTypeRef: TypeRef<SecondFactor> = new TypeRef("sys", 1169)

export function createSecondFactor(values: SecondFactorParams): SecondFactor {
    return Object.assign(create(typeModels[SecondFactorTypeRef.typeId], SecondFactorTypeRef), values)
}


export type SecondFactorParams = {


	type: NumberString;
	name: string;
	otpSecret: null | Uint8Array<ArrayBuffer>;
	


	u2f: null | U2fRegisteredDevice;
}

export type SecondFactor = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	type: NumberString;
	name: string;
	otpSecret: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	u2f: null | U2fRegisteredDevice;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SecondFactor>;
    _original: Nullable<SecondFactor>
    isAdapter: false,
}
export const U2fKeyTypeRef: TypeRef<U2fKey> = new TypeRef("sys", 1178)

export function createU2fKey(values: U2fKeyParams): U2fKey {
    return Object.assign(create(typeModels[U2fKeyTypeRef.typeId], U2fKeyTypeRef), values)
}


export type U2fKeyParams = {


	keyHandle: Uint8Array<ArrayBuffer>;
	appId: string;
	


	secondFactor: IdTuple;
}

export type U2fKey = {
    // == values

	_id: Id;
	keyHandle: Uint8Array<ArrayBuffer>;
	appId: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	secondFactor: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<U2fKey>;
    _original: Nullable<U2fKey>
    isAdapter: false,
}
export const U2fChallengeTypeRef: TypeRef<U2fChallenge> = new TypeRef("sys", 1183)

export function createU2fChallenge(values: U2fChallengeParams): U2fChallenge {
    return Object.assign(create(typeModels[U2fChallengeTypeRef.typeId], U2fChallengeTypeRef), values)
}


export type U2fChallengeParams = {


	challenge: Uint8Array<ArrayBuffer>;
	


	keys: U2fKey[];
}

export type U2fChallenge = {
    // == values

	_id: Id;
	challenge: Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	keys: U2fKey[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<U2fChallenge>;
    _original: Nullable<U2fChallenge>
    isAdapter: false,
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
    // == values

	_id: Id;
	type: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	u2f: null | U2fChallenge;
	otp: null | OtpChallenge;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Challenge>;
    _original: Nullable<Challenge>
    isAdapter: false,
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
	accessKey: null | Uint8Array<ArrayBuffer>;
	state: NumberString;
	


	challenges: Challenge[];
	user: Id;
}

export type Session = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	clientIdentifier: string;
	loginTime: Date;
	loginIpAddress: null | string;
	lastAccessTime: Date;
	accessKey: null | Uint8Array<ArrayBuffer>;
	state: NumberString;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	challenges: Challenge[];
	user: Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Session>;
    _errors: Object;
    _original: Nullable<Session>
    isAdapter: false,
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
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	sessions: Id;
	secondFactors: Id;
	recoverCode: null | Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserAuthentication>;
    _original: Nullable<UserAuthentication>
    isAdapter: false,
}
export const CreateSessionDataTypeRef: TypeRef<CreateSessionData> = new TypeRef("sys", 1211)

export function createCreateSessionData(values: CreateSessionDataParams): CreateSessionData {
    return Object.assign(create(typeModels[CreateSessionDataTypeRef.typeId], CreateSessionDataTypeRef), values)
}


export type CreateSessionDataParams = {


	mailAddress: null | string;
	authVerifier: null | string;
	clientIdentifier: string;
	accessKey: null | Uint8Array<ArrayBuffer>;
	authToken: null | string;
	recoverCodeVerifier: null | string;
	


	user: null | Id;
}

export type CreateSessionData = {
    // == values

	_format: NumberString;
	mailAddress: null | string;
	authVerifier: null | string;
	clientIdentifier: string;
	accessKey: null | Uint8Array<ArrayBuffer>;
	authToken: null | string;
	recoverCodeVerifier: null | string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	user: null | Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CreateSessionData>;
    _original: Nullable<CreateSessionData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	accessToken: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	challenges: Challenge[];
	user: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CreateSessionReturn>;
    _original: Nullable<CreateSessionReturn>
    isAdapter: false,
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
    // == values

	_id: Id;
	keyHandle: string;
	clientData: string;
	signatureData: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<U2fResponseData>;
    _original: Nullable<U2fResponseData>
    isAdapter: false,
}
export const SecondFactorAuthGetDataTypeRef: TypeRef<SecondFactorAuthGetData> = new TypeRef("sys", 1233)

export function createSecondFactorAuthGetData(values: SecondFactorAuthGetDataParams): SecondFactorAuthGetData {
    return Object.assign(create(typeModels[SecondFactorAuthGetDataTypeRef.typeId], SecondFactorAuthGetDataTypeRef), values)
}


export type SecondFactorAuthGetDataParams = {


	accessToken: string;
	

}

export type SecondFactorAuthGetData = {
    // == values

	_format: NumberString;
	accessToken: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SecondFactorAuthGetData>;
    _original: Nullable<SecondFactorAuthGetData>
    isAdapter: false,
}
export const SecondFactorAuthGetReturnTypeRef: TypeRef<SecondFactorAuthGetReturn> = new TypeRef("sys", 1236)

export function createSecondFactorAuthGetReturn(values: SecondFactorAuthGetReturnParams): SecondFactorAuthGetReturn {
    return Object.assign(create(typeModels[SecondFactorAuthGetReturnTypeRef.typeId], SecondFactorAuthGetReturnTypeRef), values)
}


export type SecondFactorAuthGetReturnParams = {


	secondFactorPending: boolean;
	

}

export type SecondFactorAuthGetReturn = {
    // == values

	_format: NumberString;
	secondFactorPending: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SecondFactorAuthGetReturn>;
    _original: Nullable<SecondFactorAuthGetReturn>
    isAdapter: false,
}
export const OtpChallengeTypeRef: TypeRef<OtpChallenge> = new TypeRef("sys", 1244)

export function createOtpChallenge(values: OtpChallengeParams): OtpChallenge {
    return Object.assign(create(typeModels[OtpChallengeTypeRef.typeId], OtpChallengeTypeRef), values)
}


export type OtpChallengeParams = {


	


	secondFactors: IdTuple[];
}

export type OtpChallenge = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	secondFactors: IdTuple[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<OtpChallenge>;
    _original: Nullable<OtpChallenge>
    isAdapter: false,
}
export const BootstrapFeatureTypeRef: TypeRef<BootstrapFeature> = new TypeRef("sys", 1249)

export function createBootstrapFeature(values: BootstrapFeatureParams): BootstrapFeature {
    return Object.assign(create(typeModels[BootstrapFeatureTypeRef.typeId], BootstrapFeatureTypeRef), values)
}


export type BootstrapFeatureParams = {


	feature: NumberString;
	

}

export type BootstrapFeature = {
    // == values

	_id: Id;
	feature: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BootstrapFeature>;
    _original: Nullable<BootstrapFeature>
    isAdapter: false,
}
export const FeatureTypeRef: TypeRef<Feature> = new TypeRef("sys", 1253)

export function createFeature(values: FeatureParams): Feature {
    return Object.assign(create(typeModels[FeatureTypeRef.typeId], FeatureTypeRef), values)
}


export type FeatureParams = {


	feature: NumberString;
	

}

export type Feature = {
    // == values

	_id: Id;
	feature: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Feature>;
    _original: Nullable<Feature>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	mailAddress: string;
	createdDate: Date;
	deletedDate: null | Date;
	comment: string;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	customer: Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WhitelabelChild>;
    _errors: Object;
    _original: Nullable<WhitelabelChild>
    isAdapter: false,
}
export const WhitelabelChildrenRefTypeRef: TypeRef<WhitelabelChildrenRef> = new TypeRef("sys", 1269)

export function createWhitelabelChildrenRef(values: WhitelabelChildrenRefParams): WhitelabelChildrenRef {
    return Object.assign(create(typeModels[WhitelabelChildrenRefTypeRef.typeId], WhitelabelChildrenRefTypeRef), values)
}


export type WhitelabelChildrenRefParams = {


	


	items: Id;
}

export type WhitelabelChildrenRef = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	items: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WhitelabelChildrenRef>;
    _original: Nullable<WhitelabelChildrenRef>
    isAdapter: false,
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
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	customer: Id;
	whitelabelChildInParent: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WhitelabelParent>;
    _original: Nullable<WhitelabelParent>
    isAdapter: false,
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
    // == values

	_id: Id;
	cardHolderName: string;
	number: string;
	cvv: string;
	expirationMonth: string;
	expirationYear: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CreditCard>;
    _original: Nullable<CreditCard>
    isAdapter: false,
}
export const LocationServiceGetReturnTypeRef: TypeRef<LocationServiceGetReturn> = new TypeRef("sys", 1321)

export function createLocationServiceGetReturn(values: LocationServiceGetReturnParams): LocationServiceGetReturn {
    return Object.assign(create(typeModels[LocationServiceGetReturnTypeRef.typeId], LocationServiceGetReturnTypeRef), values)
}


export type LocationServiceGetReturnParams = {


	country: string;
	

}

export type LocationServiceGetReturn = {
    // == values

	_format: NumberString;
	country: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<LocationServiceGetReturn>;
    _original: Nullable<LocationServiceGetReturn>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	version: string;
	customerAddress: string;
	signatureDate: Date;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	signerUserGroupInfo: IdTuple;
	customer: Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<OrderProcessingAgreement>;
    _errors: Object;
    _original: Nullable<OrderProcessingAgreement>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	version: string;
	customerAddress: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SignOrderProcessingAgreementData>;
    _original: Nullable<SignOrderProcessingAgreementData>
    isAdapter: false,
}
export const GeneratedIdWrapperTypeRef: TypeRef<GeneratedIdWrapper> = new TypeRef("sys", 1349)

export function createGeneratedIdWrapper(values: GeneratedIdWrapperParams): GeneratedIdWrapper {
    return Object.assign(create(typeModels[GeneratedIdWrapperTypeRef.typeId], GeneratedIdWrapperTypeRef), values)
}


export type GeneratedIdWrapperParams = {


	value: Id;
	

}

export type GeneratedIdWrapper = {
    // == values

	_id: Id;
	value: Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GeneratedIdWrapper>;
    _original: Nullable<GeneratedIdWrapper>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	identifier: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	userIds: GeneratedIdWrapper[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SseConnectData>;
    _original: Nullable<SseConnectData>
    isAdapter: false,
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
    // == values

	_id: Id;
	mailAddress: string;
	userId: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	mailId: null | IdTupleWrapper;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<NotificationInfo>;
    _original: Nullable<NotificationInfo>
    isAdapter: false,
}
export const RecoverCodeTypeRef: TypeRef<RecoverCode> = new TypeRef("sys", 1407)

export function createRecoverCode(values: RecoverCodeParams): RecoverCode {
    return Object.assign(create(typeModels[RecoverCodeTypeRef.typeId], RecoverCodeTypeRef), values)
}


export type RecoverCodeParams = {


	userEncRecoverCode: Uint8Array<ArrayBuffer>;
	recoverCodeEncUserGroupKey: Uint8Array<ArrayBuffer>;
	verifier: Uint8Array<ArrayBuffer>;
	userKeyVersion: NumberString;
	

}

export type RecoverCode = {
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	userEncRecoverCode: Uint8Array<ArrayBuffer>;
	recoverCodeEncUserGroupKey: Uint8Array<ArrayBuffer>;
	verifier: Uint8Array<ArrayBuffer>;
	userKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RecoverCode>;
    _original: Nullable<RecoverCode>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ResetFactorsDeleteData>;
    _original: Nullable<ResetFactorsDeleteData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	date: null | Date;
	campaign: null | string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	referralCode: null | Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UpgradePriceServiceData>;
    _original: Nullable<UpgradePriceServiceData>
    isAdapter: false,
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
    // == values

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

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	planConfiguration: PlanConfiguration;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PlanPrices>;
    _original: Nullable<PlanPrices>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	messageTextId: null | string;
	business: boolean;
	bonusMonthsForYearlyPlan: NumberString;
	firstMonthForFreeForYearlyPlan: boolean;
	hasGlobalFirstYearDiscount: boolean;
	globalCampaignName: null | string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

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


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UpgradePriceServiceReturn>;
    _original: Nullable<UpgradePriceServiceReturn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	campaignToken: null | string;
	mailAddress: string;
	signupToken: null | string;
	paidSubscriptionSelected: boolean;
	businessUseSelected: boolean;
	timelockChallengeSolution: null | string;
	language: string;
	isAutomatedBrowser: boolean;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	adAttribution: null | AdAttribution;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RegistrationCaptchaServiceGetData>;
    _original: Nullable<RegistrationCaptchaServiceGetData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	eventBatchId: Id;
	eventBatchOwner: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	entityUpdates: EntityUpdate[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WebsocketEntityData>;
    _original: Nullable<WebsocketEntityData>
    isAdapter: false,
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
    // == values

	_id: Id;
	counterId: Id;
	count: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WebsocketCounterValue>;
    _original: Nullable<WebsocketCounterValue>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	mailGroup: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	counterValues: WebsocketCounterValue[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WebsocketCounterData>;
    _original: Nullable<WebsocketCounterData>
    isAdapter: false,
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
    // == values

	_id: Id;
	expiryDate: null | Date;
	state: NumberString;
	type: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	certificate: null | Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CertificateInfo>;
    _original: Nullable<CertificateInfo>
    isAdapter: false,
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
    // == values

	_id: Id;
	language: string;
	body: string;
	subject: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<NotificationMailTemplate>;
    _original: Nullable<NotificationMailTemplate>
    isAdapter: false,
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
    // == values

	_id: Id;
	elementId: Id;
	listId: Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CalendarEventRef>;
    _original: Nullable<CalendarEventRef>
    isAdapter: false,
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
    // == values

	_id: Id;
	trigger: string;
	alarmIdentifier: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	calendarRef: CalendarEventRef;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AlarmInfo>;
    _original: Nullable<AlarmInfo>
    isAdapter: false,
}
export const UserAlarmInfoTypeRef: TypeRef<UserAlarmInfo> = new TypeRef("sys", 1541)

export function createUserAlarmInfo(values: UserAlarmInfoParams): UserAlarmInfo {
    return Object.assign(create(typeModels[UserAlarmInfoTypeRef.typeId], UserAlarmInfoTypeRef), values)
}


export type UserAlarmInfoParams = {


	


	alarmInfo: AlarmInfo;
}

export type UserAlarmInfo = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	alarmInfo: AlarmInfo;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserAlarmInfo>;
    _errors: Object;
    _original: Nullable<UserAlarmInfo>
    isAdapter: false,
}
export const UserAlarmInfoListTypeTypeRef: TypeRef<UserAlarmInfoListType> = new TypeRef("sys", 1549)

export function createUserAlarmInfoListType(values: UserAlarmInfoListTypeParams): UserAlarmInfoListType {
    return Object.assign(create(typeModels[UserAlarmInfoListTypeTypeRef.typeId], UserAlarmInfoListTypeTypeRef), values)
}


export type UserAlarmInfoListTypeParams = {


	


	alarms: Id;
}

export type UserAlarmInfoListType = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	alarms: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserAlarmInfoListType>;
    _original: Nullable<UserAlarmInfoListType>
    isAdapter: false,
}
export const NotificationSessionKeyTypeRef: TypeRef<NotificationSessionKey> = new TypeRef("sys", 1553)

export function createNotificationSessionKey(values: NotificationSessionKeyParams): NotificationSessionKey {
    return Object.assign(create(typeModels[NotificationSessionKeyTypeRef.typeId], NotificationSessionKeyTypeRef), values)
}


export type NotificationSessionKeyParams = {


	pushIdentifierSessionEncSessionKey: Uint8Array<ArrayBuffer>;
	


	pushIdentifier: IdTuple;
}

export type NotificationSessionKey = {
    // == values

	_id: Id;
	pushIdentifierSessionEncSessionKey: Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	pushIdentifier: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<NotificationSessionKey>;
    _original: Nullable<NotificationSessionKey>
    isAdapter: false,
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
    // == values

	_id: Id;
	frequency: NumberString;
	endType: NumberString;
	endValue: null | NumberString;
	interval: NumberString;
	timeZone: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	excludedDates: DateWrapper[];
	advancedRules: CalendarAdvancedRepeatRule[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RepeatRule>;
    _original: Nullable<RepeatRule>
    isAdapter: false,
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
    // == values

	_id: Id;
	operation: NumberString;
	summary: string;
	eventStart: Date;
	eventEnd: Date;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	alarmInfo: AlarmInfo;
	repeatRule: null | RepeatRule;
	notificationSessionKeys: NotificationSessionKey[];
	user: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AlarmNotification>;
    _original: Nullable<AlarmNotification>
    isAdapter: false,
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
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	alarmNotifications: AlarmNotification[];
	userAlarmInfoData: UserAlarmInfoData[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AlarmServicePost>;
    _errors: Object;
    _original: Nullable<AlarmServicePost>
    isAdapter: false,
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
    // == values

	_id: Id;
	subdomain: null | string;
	type: NumberString;
	value: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<DnsRecord>;
    _original: Nullable<DnsRecord>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	domain: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	customer: null | Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomDomainCheckGetIn>;
    _original: Nullable<CustomDomainCheckGetIn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	checkResult: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	missingRecords: DnsRecord[];
	invalidRecords: DnsRecord[];
	requiredRecords: DnsRecord[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomDomainCheckGetOut>;
    _original: Nullable<CustomDomainCheckGetOut>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	accessToken: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	sessionId: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CloseSessionServicePost>;
    _original: Nullable<CloseSessionServicePost>
    isAdapter: false,
}
export const ReceivedGroupInvitationTypeRef: TypeRef<ReceivedGroupInvitation> = new TypeRef("sys", 1602)

export function createReceivedGroupInvitation(values: ReceivedGroupInvitationParams): ReceivedGroupInvitation {
    return Object.assign(create(typeModels[ReceivedGroupInvitationTypeRef.typeId], ReceivedGroupInvitationTypeRef), values)
}


export type ReceivedGroupInvitationParams = {


	sharedGroupKey: Uint8Array<ArrayBuffer>;
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	sharedGroupKey: Uint8Array<ArrayBuffer>;
	sharedGroupName: string;
	inviterMailAddress: string;
	inviterName: string;
	inviteeMailAddress: string;
	capability: NumberString;
	groupType: null | NumberString;
	_ownerKeyVersion: null | NumberString;
	sharedGroupKeyVersion: NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	sharedGroup: Id;
	sentInvitation: IdTuple;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ReceivedGroupInvitation>;
    _errors: Object;
    _original: Nullable<ReceivedGroupInvitation>
    isAdapter: false,
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	invitations: Id;
	keyRotations: KeyRotationsRef;
	groupKeyUpdates: null | GroupKeyUpdatesRef;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserGroupRoot>;
    _original: Nullable<UserGroupRoot>
    isAdapter: false,
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
    // == values

	_id: Id;
	errorTime: Date;
	errorCode: string;
	thirdPartyErrorId: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PaymentErrorInfo>;
    _original: Nullable<PaymentErrorInfo>
    isAdapter: false,
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
    // == values

	_id: Id;
	amount: NumberString;
	type: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
	singleType: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<InvoiceItem>;
    _original: Nullable<InvoiceItem>
    isAdapter: false,
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
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
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	items: InvoiceItem[];
	customer: Id;
	bookings: IdTuple[];


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Invoice>;
    _errors: Object;
    _original: Nullable<Invoice>
    isAdapter: false,
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
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	lastProcessedNotificationId: null | Id;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	notificationInfos: NotificationInfo[];
	alarmNotifications: AlarmNotification[];


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MissedNotification>;
    _errors: Object;
    _original: Nullable<MissedNotification>
    isAdapter: false,
}
export const BrandingDomainGetReturnTypeRef: TypeRef<BrandingDomainGetReturn> = new TypeRef("sys", 1723)

export function createBrandingDomainGetReturn(values: BrandingDomainGetReturnParams): BrandingDomainGetReturn {
    return Object.assign(create(typeModels[BrandingDomainGetReturnTypeRef.typeId], BrandingDomainGetReturnTypeRef), values)
}


export type BrandingDomainGetReturnParams = {


	


	certificateInfo: null | CertificateInfo;
}

export type BrandingDomainGetReturn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	certificateInfo: null | CertificateInfo;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BrandingDomainGetReturn>;
    _original: Nullable<BrandingDomainGetReturn>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	senderMailAddress: string;
	senderIp: string;
	senderHostname: string;
	recipientMailAddress: string;
	reason: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RejectedSender>;
    _original: Nullable<RejectedSender>
    isAdapter: false,
}
export const RejectedSendersRefTypeRef: TypeRef<RejectedSendersRef> = new TypeRef("sys", 1747)

export function createRejectedSendersRef(values: RejectedSendersRefParams): RejectedSendersRef {
    return Object.assign(create(typeModels[RejectedSendersRefTypeRef.typeId], RejectedSendersRefTypeRef), values)
}


export type RejectedSendersRefParams = {


	


	items: Id;
}

export type RejectedSendersRef = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	items: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RejectedSendersRef>;
    _original: Nullable<RejectedSendersRef>
    isAdapter: false,
}
export const SecondFactorAuthDeleteDataTypeRef: TypeRef<SecondFactorAuthDeleteData> = new TypeRef("sys", 1755)

export function createSecondFactorAuthDeleteData(values: SecondFactorAuthDeleteDataParams): SecondFactorAuthDeleteData {
    return Object.assign(create(typeModels[SecondFactorAuthDeleteDataTypeRef.typeId], SecondFactorAuthDeleteDataTypeRef), values)
}


export type SecondFactorAuthDeleteDataParams = {


	


	session: IdTuple;
}

export type SecondFactorAuthDeleteData = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	session: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SecondFactorAuthDeleteData>;
    _original: Nullable<SecondFactorAuthDeleteData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: null | string;
	targetAccountMailAddress: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<TakeOverDeletedAddressData>;
    _original: Nullable<TakeOverDeletedAddressData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	leaderStatus: boolean;
	applicationVersionSum: null | NumberString;
	applicationTypesHash: null | string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WebsocketLeaderStatus>;
    _original: Nullable<WebsocketLeaderStatus>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	status: NumberString;
	value: NumberString;
	message: string;
	orderDate: Date;
	migrated: boolean;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCard>;
    _errors: Object;
    _original: Nullable<GiftCard>
    isAdapter: false,
}
export const GiftCardsRefTypeRef: TypeRef<GiftCardsRef> = new TypeRef("sys", 1791)

export function createGiftCardsRef(values: GiftCardsRefParams): GiftCardsRef {
    return Object.assign(create(typeModels[GiftCardsRefTypeRef.typeId], GiftCardsRefTypeRef), values)
}


export type GiftCardsRefParams = {


	


	items: Id;
}

export type GiftCardsRef = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	items: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCardsRef>;
    _original: Nullable<GiftCardsRef>
    isAdapter: false,
}
export const GiftCardOptionTypeRef: TypeRef<GiftCardOption> = new TypeRef("sys", 1795)

export function createGiftCardOption(values: GiftCardOptionParams): GiftCardOption {
    return Object.assign(create(typeModels[GiftCardOptionTypeRef.typeId], GiftCardOptionTypeRef), values)
}


export type GiftCardOptionParams = {


	value: NumberString;
	

}

export type GiftCardOption = {
    // == values

	_id: Id;
	value: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCardOption>;
    _original: Nullable<GiftCardOption>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	maxPerPeriod: NumberString;
	period: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	options: GiftCardOption[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCardGetReturn>;
    _original: Nullable<GiftCardGetReturn>
    isAdapter: false,
}
export const GiftCardCreateDataTypeRef: TypeRef<GiftCardCreateData> = new TypeRef("sys", 1803)

export function createGiftCardCreateData(values: GiftCardCreateDataParams): GiftCardCreateData {
    return Object.assign(create(typeModels[GiftCardCreateDataTypeRef.typeId], GiftCardCreateDataTypeRef), values)
}


export type GiftCardCreateDataParams = {


	message: string;
	value: NumberString;
	keyHash: Uint8Array<ArrayBuffer>;
	

}

export type GiftCardCreateData = {
    // == values

	_format: NumberString;
	message: string;
	ownerEncSessionKey: Uint8Array<ArrayBuffer>;
	value: NumberString;
	keyHash: Uint8Array<ArrayBuffer>;
	ownerKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCardCreateData>;
    _errors: Object;
    _original: Nullable<GiftCardCreateData>
    isAdapter: false,
}
export const GiftCardDeleteDataTypeRef: TypeRef<GiftCardDeleteData> = new TypeRef("sys", 1810)

export function createGiftCardDeleteData(values: GiftCardDeleteDataParams): GiftCardDeleteData {
    return Object.assign(create(typeModels[GiftCardDeleteDataTypeRef.typeId], GiftCardDeleteDataTypeRef), values)
}


export type GiftCardDeleteDataParams = {


	


	giftCard: IdTuple;
}

export type GiftCardDeleteData = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	giftCard: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCardDeleteData>;
    _original: Nullable<GiftCardDeleteData>
    isAdapter: false,
}
export const GiftCardCreateReturnTypeRef: TypeRef<GiftCardCreateReturn> = new TypeRef("sys", 1813)

export function createGiftCardCreateReturn(values: GiftCardCreateReturnParams): GiftCardCreateReturn {
    return Object.assign(create(typeModels[GiftCardCreateReturnTypeRef.typeId], GiftCardCreateReturnTypeRef), values)
}


export type GiftCardCreateReturnParams = {


	


	giftCard: IdTuple;
}

export type GiftCardCreateReturn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	giftCard: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCardCreateReturn>;
    _original: Nullable<GiftCardCreateReturn>
    isAdapter: false,
}
export const GiftCardRedeemDataTypeRef: TypeRef<GiftCardRedeemData> = new TypeRef("sys", 1817)

export function createGiftCardRedeemData(values: GiftCardRedeemDataParams): GiftCardRedeemData {
    return Object.assign(create(typeModels[GiftCardRedeemDataTypeRef.typeId], GiftCardRedeemDataTypeRef), values)
}


export type GiftCardRedeemDataParams = {


	keyHash: Uint8Array<ArrayBuffer>;
	countryCode: string;
	


	giftCardInfo: Id;
}

export type GiftCardRedeemData = {
    // == values

	_format: NumberString;
	keyHash: Uint8Array<ArrayBuffer>;
	countryCode: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	giftCardInfo: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCardRedeemData>;
    _original: Nullable<GiftCardRedeemData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	message: string;
	value: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	giftCard: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GiftCardRedeemGetReturn>;
    _errors: Object;
    _original: Nullable<GiftCardRedeemGetReturn>
    isAdapter: false,
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
    // == values

	_id: Id;
	clientToken: string;
	nonce: string;
	bin: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Braintree3ds2Request>;
    _original: Nullable<Braintree3ds2Request>
    isAdapter: false,
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
    // == values

	_id: Id;
	clientToken: string;
	nonce: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Braintree3ds2Response>;
    _original: Nullable<Braintree3ds2Response>
    isAdapter: false,
}
export const PaymentDataServicePostDataTypeRef: TypeRef<PaymentDataServicePostData> = new TypeRef("sys", 1837)

export function createPaymentDataServicePostData(values: PaymentDataServicePostDataParams): PaymentDataServicePostData {
    return Object.assign(create(typeModels[PaymentDataServicePostDataTypeRef.typeId], PaymentDataServicePostDataTypeRef), values)
}


export type PaymentDataServicePostDataParams = {


	


	braintree3dsResponse: Braintree3ds2Response;
}

export type PaymentDataServicePostData = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	braintree3dsResponse: Braintree3ds2Response;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PaymentDataServicePostData>;
    _original: Nullable<PaymentDataServicePostData>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	clientType: null | NumberString;
	subscriptionApp: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PaymentDataServiceGetData>;
    _original: Nullable<PaymentDataServiceGetData>
    isAdapter: false,
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
    // == values

	_id: Id;
	application: string;
	typeId: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<TypeInfo>;
    _original: Nullable<TypeInfo>
    isAdapter: false,
}
export const ArchiveRefTypeRef: TypeRef<ArchiveRef> = new TypeRef("sys", 1873)

export function createArchiveRef(values: ArchiveRefParams): ArchiveRef {
    return Object.assign(create(typeModels[ArchiveRefTypeRef.typeId], ArchiveRefTypeRef), values)
}


export type ArchiveRefParams = {


	archiveId: Id;
	

}

export type ArchiveRef = {
    // == values

	_id: Id;
	archiveId: Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ArchiveRef>;
    _original: Nullable<ArchiveRef>
    isAdapter: false,
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
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	type: TypeInfo;
	active: ArchiveRef;
	inactive: ArchiveRef[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ArchiveType>;
    _original: Nullable<ArchiveType>
    isAdapter: false,
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
    // == values

	_id: Id;
	archiveId: Id;
	size: NumberString;
	blobId: Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Blob>;
    _original: Nullable<Blob>
    isAdapter: false,
}
export const WebauthnResponseDataTypeRef: TypeRef<WebauthnResponseData> = new TypeRef("sys", 1899)

export function createWebauthnResponseData(values: WebauthnResponseDataParams): WebauthnResponseData {
    return Object.assign(create(typeModels[WebauthnResponseDataTypeRef.typeId], WebauthnResponseDataTypeRef), values)
}


export type WebauthnResponseDataParams = {


	keyHandle: Uint8Array<ArrayBuffer>;
	clientData: Uint8Array<ArrayBuffer>;
	authenticatorData: Uint8Array<ArrayBuffer>;
	signature: Uint8Array<ArrayBuffer>;
	

}

export type WebauthnResponseData = {
    // == values

	_id: Id;
	keyHandle: Uint8Array<ArrayBuffer>;
	clientData: Uint8Array<ArrayBuffer>;
	authenticatorData: Uint8Array<ArrayBuffer>;
	signature: Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<WebauthnResponseData>;
    _original: Nullable<WebauthnResponseData>
    isAdapter: false,
}
export const BlobReferenceTokenWrapperTypeRef: TypeRef<BlobReferenceTokenWrapper> = new TypeRef("sys", 1990)

export function createBlobReferenceTokenWrapper(values: BlobReferenceTokenWrapperParams): BlobReferenceTokenWrapper {
    return Object.assign(create(typeModels[BlobReferenceTokenWrapperTypeRef.typeId], BlobReferenceTokenWrapperTypeRef), values)
}


export type BlobReferenceTokenWrapperParams = {


	blobReferenceToken: string;
	

}

export type BlobReferenceTokenWrapper = {
    // == values

	_id: Id;
	blobReferenceToken: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BlobReferenceTokenWrapper>;
    _original: Nullable<BlobReferenceTokenWrapper>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	terminationDate: Date;
	terminationRequestDate: Date;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	customer: Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomerAccountTerminationRequest>;
    _original: Nullable<CustomerAccountTerminationRequest>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	terminationDate: null | Date;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	surveyData: null | SurveyData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomerAccountTerminationPostIn>;
    _original: Nullable<CustomerAccountTerminationPostIn>
    isAdapter: false,
}
export const CustomerAccountTerminationPostOutTypeRef: TypeRef<CustomerAccountTerminationPostOut> = new TypeRef("sys", 2018)

export function createCustomerAccountTerminationPostOut(values: CustomerAccountTerminationPostOutParams): CustomerAccountTerminationPostOut {
    return Object.assign(create(typeModels[CustomerAccountTerminationPostOutTypeRef.typeId], CustomerAccountTerminationPostOutTypeRef), values)
}


export type CustomerAccountTerminationPostOutParams = {


	


	terminationRequest: IdTuple;
}

export type CustomerAccountTerminationPostOut = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	terminationRequest: IdTuple;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CustomerAccountTerminationPostOut>;
    _original: Nullable<CustomerAccountTerminationPostOut>
    isAdapter: false,
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
    // == values

	_id: Id;
	mailAddress: string;
	available: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MailAddressAvailability>;
    _original: Nullable<MailAddressAvailability>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	signupToken: null | string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	mailAddresses: StringWrapper[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MultipleMailAddressAvailabilityData>;
    _original: Nullable<MultipleMailAddressAvailabilityData>
    isAdapter: false,
}
export const MultipleMailAddressAvailabilityReturnTypeRef: TypeRef<MultipleMailAddressAvailabilityReturn> = new TypeRef("sys", 2033)

export function createMultipleMailAddressAvailabilityReturn(values: MultipleMailAddressAvailabilityReturnParams): MultipleMailAddressAvailabilityReturn {
    return Object.assign(create(typeModels[MultipleMailAddressAvailabilityReturnTypeRef.typeId], MultipleMailAddressAvailabilityReturnTypeRef), values)
}


export type MultipleMailAddressAvailabilityReturnParams = {


	


	availabilities: MailAddressAvailability[];
}

export type MultipleMailAddressAvailabilityReturn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	availabilities: MailAddressAvailability[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MultipleMailAddressAvailabilityReturn>;
    _original: Nullable<MultipleMailAddressAvailabilityReturn>
    isAdapter: false,
}
export const InstanceSessionKeyTypeRef: TypeRef<InstanceSessionKey> = new TypeRef("sys", 2037)

export function createInstanceSessionKey(values: InstanceSessionKeyParams): InstanceSessionKey {
    return Object.assign(create(typeModels[InstanceSessionKeyTypeRef.typeId], InstanceSessionKeyTypeRef), values)
}


export type InstanceSessionKeyParams = {


	instanceList: Id;
	instanceId: Id;
	symEncSessionKey: Uint8Array<ArrayBuffer>;
	encryptionAuthStatus: null | Uint8Array<ArrayBuffer>;
	symKeyVersion: NumberString;
	keyVerificationState: null | Uint8Array<ArrayBuffer>;
	


	typeInfo: TypeInfo;
}

export type InstanceSessionKey = {
    // == values

	_id: Id;
	instanceList: Id;
	instanceId: Id;
	symEncSessionKey: Uint8Array<ArrayBuffer>;
	encryptionAuthStatus: null | Uint8Array<ArrayBuffer>;
	symKeyVersion: NumberString;
	keyVerificationState: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	typeInfo: TypeInfo;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<InstanceSessionKey>;
    _original: Nullable<InstanceSessionKey>
    isAdapter: false,
}
export const BucketKeyTypeRef: TypeRef<BucketKey> = new TypeRef("sys", 2043)

export function createBucketKey(values: BucketKeyParams): BucketKey {
    return Object.assign(create(typeModels[BucketKeyTypeRef.typeId], BucketKeyTypeRef), values)
}


export type BucketKeyParams = {


	pubEncBucketKey: null | Uint8Array<ArrayBuffer>;
	groupEncBucketKey: null | Uint8Array<ArrayBuffer>;
	protocolVersion: NumberString;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;
	


	keyGroup: null | Id;
	bucketEncSessionKeys: InstanceSessionKey[];
}

export type BucketKey = {
    // == values

	_id: Id;
	pubEncBucketKey: null | Uint8Array<ArrayBuffer>;
	groupEncBucketKey: null | Uint8Array<ArrayBuffer>;
	protocolVersion: NumberString;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	keyGroup: null | Id;
	bucketEncSessionKeys: InstanceSessionKey[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<BucketKey>;
    _original: Nullable<BucketKey>
    isAdapter: false,
}
export const UpdateSessionKeysPostInTypeRef: TypeRef<UpdateSessionKeysPostIn> = new TypeRef("sys", 2049)

export function createUpdateSessionKeysPostIn(values: UpdateSessionKeysPostInParams): UpdateSessionKeysPostIn {
    return Object.assign(create(typeModels[UpdateSessionKeysPostInTypeRef.typeId], UpdateSessionKeysPostInTypeRef), values)
}


export type UpdateSessionKeysPostInParams = {


	


	ownerEncSessionKeys: InstanceSessionKey[];
}

export type UpdateSessionKeysPostIn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	ownerEncSessionKeys: InstanceSessionKey[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UpdateSessionKeysPostIn>;
    _original: Nullable<UpdateSessionKeysPostIn>
    isAdapter: false,
}
export const ReferralCodeGetInTypeRef: TypeRef<ReferralCodeGetIn> = new TypeRef("sys", 2062)

export function createReferralCodeGetIn(values: ReferralCodeGetInParams): ReferralCodeGetIn {
    return Object.assign(create(typeModels[ReferralCodeGetInTypeRef.typeId], ReferralCodeGetInTypeRef), values)
}


export type ReferralCodeGetInParams = {


	


	referralCode: Id;
}

export type ReferralCodeGetIn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	referralCode: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ReferralCodeGetIn>;
    _original: Nullable<ReferralCodeGetIn>
    isAdapter: false,
}
export const ReferralCodePostInTypeRef: TypeRef<ReferralCodePostIn> = new TypeRef("sys", 2065)

export function createReferralCodePostIn(values: ReferralCodePostInParams): ReferralCodePostIn {
    return Object.assign(create(typeModels[ReferralCodePostInTypeRef.typeId], ReferralCodePostInTypeRef), values)
}


export type ReferralCodePostInParams = {


	

}

export type ReferralCodePostIn = {
    // == values

	_format: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ReferralCodePostIn>;
    _original: Nullable<ReferralCodePostIn>
    isAdapter: false,
}
export const ReferralCodePostOutTypeRef: TypeRef<ReferralCodePostOut> = new TypeRef("sys", 2067)

export function createReferralCodePostOut(values: ReferralCodePostOutParams): ReferralCodePostOut {
    return Object.assign(create(typeModels[ReferralCodePostOutTypeRef.typeId], ReferralCodePostOutTypeRef), values)
}


export type ReferralCodePostOutParams = {


	


	referralCode: Id;
}

export type ReferralCodePostOut = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	referralCode: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ReferralCodePostOut>;
    _original: Nullable<ReferralCodePostOut>
    isAdapter: false,
}
export const DateWrapperTypeRef: TypeRef<DateWrapper> = new TypeRef("sys", 2073)

export function createDateWrapper(values: DateWrapperParams): DateWrapper {
    return Object.assign(create(typeModels[DateWrapperTypeRef.typeId], DateWrapperTypeRef), values)
}


export type DateWrapperParams = {


	date: Date;
	

}

export type DateWrapper = {
    // == values

	_id: Id;
	date: Date;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<DateWrapper>;
    _original: Nullable<DateWrapper>
    isAdapter: false,
}
export const MailAddressAliasGetInTypeRef: TypeRef<MailAddressAliasGetIn> = new TypeRef("sys", 2095)

export function createMailAddressAliasGetIn(values: MailAddressAliasGetInParams): MailAddressAliasGetIn {
    return Object.assign(create(typeModels[MailAddressAliasGetInTypeRef.typeId], MailAddressAliasGetInTypeRef), values)
}


export type MailAddressAliasGetInParams = {


	


	targetGroup: Id;
}

export type MailAddressAliasGetIn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	targetGroup: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MailAddressAliasGetIn>;
    _original: Nullable<MailAddressAliasGetIn>
    isAdapter: false,
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
    // == values

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
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PlanConfiguration>;
    _original: Nullable<PlanConfiguration>
    isAdapter: false,
}
export const PlanServiceGetOutTypeRef: TypeRef<PlanServiceGetOut> = new TypeRef("sys", 2115)

export function createPlanServiceGetOut(values: PlanServiceGetOutParams): PlanServiceGetOut {
    return Object.assign(create(typeModels[PlanServiceGetOutTypeRef.typeId], PlanServiceGetOutTypeRef), values)
}


export type PlanServiceGetOutParams = {


	


	config: PlanConfiguration;
}

export type PlanServiceGetOut = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	config: PlanConfiguration;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PlanServiceGetOut>;
    _original: Nullable<PlanServiceGetOut>
    isAdapter: false,
}
export const PublicKeyPutInTypeRef: TypeRef<PublicKeyPutIn> = new TypeRef("sys", 2150)

export function createPublicKeyPutIn(values: PublicKeyPutInParams): PublicKeyPutIn {
    return Object.assign(create(typeModels[PublicKeyPutInTypeRef.typeId], PublicKeyPutInTypeRef), values)
}


export type PublicKeyPutInParams = {


	pubEccKey: Uint8Array<ArrayBuffer>;
	symEncPrivEccKey: Uint8Array<ArrayBuffer>;
	


	keyGroup: Id;
}

export type PublicKeyPutIn = {
    // == values

	_format: NumberString;
	pubEccKey: Uint8Array<ArrayBuffer>;
	symEncPrivEccKey: Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	keyGroup: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PublicKeyPutIn>;
    _original: Nullable<PublicKeyPutIn>
    isAdapter: false,
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
    // == values

	_id: Id;
	amount: NumberString;
	itemType: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<InvoiceDataItem>;
    _original: Nullable<InvoiceDataItem>
    isAdapter: false,
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
    // == values

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

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	items: InvoiceDataItem[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<InvoiceDataGetOut>;
    _original: Nullable<InvoiceDataGetOut>
    isAdapter: false,
}
export const InvoiceDataGetInTypeRef: TypeRef<InvoiceDataGetIn> = new TypeRef("sys", 2185)

export function createInvoiceDataGetIn(values: InvoiceDataGetInParams): InvoiceDataGetIn {
    return Object.assign(create(typeModels[InvoiceDataGetInTypeRef.typeId], InvoiceDataGetInTypeRef), values)
}


export type InvoiceDataGetInParams = {


	invoiceNumber: string;
	

}

export type InvoiceDataGetIn = {
    // == values

	_format: NumberString;
	invoiceNumber: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<InvoiceDataGetIn>;
    _original: Nullable<InvoiceDataGetIn>
    isAdapter: false,
}
export const ChangeKdfPostInTypeRef: TypeRef<ChangeKdfPostIn> = new TypeRef("sys", 2198)

export function createChangeKdfPostIn(values: ChangeKdfPostInParams): ChangeKdfPostIn {
    return Object.assign(create(typeModels[ChangeKdfPostInTypeRef.typeId], ChangeKdfPostInTypeRef), values)
}


export type ChangeKdfPostInParams = {


	verifier: Uint8Array<ArrayBuffer>;
	salt: Uint8Array<ArrayBuffer>;
	pwEncUserGroupKey: Uint8Array<ArrayBuffer>;
	oldVerifier: Uint8Array<ArrayBuffer>;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
	

}

export type ChangeKdfPostIn = {
    // == values

	_format: NumberString;
	verifier: Uint8Array<ArrayBuffer>;
	salt: Uint8Array<ArrayBuffer>;
	pwEncUserGroupKey: Uint8Array<ArrayBuffer>;
	oldVerifier: Uint8Array<ArrayBuffer>;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ChangeKdfPostIn>;
    _original: Nullable<ChangeKdfPostIn>
    isAdapter: false,
}
export const GroupKeyTypeRef: TypeRef<GroupKey> = new TypeRef("sys", 2255)

export function createGroupKey(values: GroupKeyParams): GroupKey {
    return Object.assign(create(typeModels[GroupKeyTypeRef.typeId], GroupKeyTypeRef), values)
}


export type GroupKeyParams = {


	ownerEncGKey: Uint8Array<ArrayBuffer>;
	adminGroupEncGKey: null | Uint8Array<ArrayBuffer>;
	adminGroupKeyVersion: null | NumberString;
	


	keyPair: null | KeyPair;
	pubAdminGroupEncGKey: null | PubEncKeyData;
}

export type GroupKey = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	ownerEncGKey: Uint8Array<ArrayBuffer>;
	ownerKeyVersion: NumberString;
	adminGroupEncGKey: null | Uint8Array<ArrayBuffer>;
	adminGroupKeyVersion: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	keyPair: null | KeyPair;
	pubAdminGroupEncGKey: null | PubEncKeyData;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupKey>;
    _original: Nullable<GroupKey>
    isAdapter: false,
}
export const GroupKeysRefTypeRef: TypeRef<GroupKeysRef> = new TypeRef("sys", 2267)

export function createGroupKeysRef(values: GroupKeysRefParams): GroupKeysRef {
    return Object.assign(create(typeModels[GroupKeysRefTypeRef.typeId], GroupKeysRefTypeRef), values)
}


export type GroupKeysRefParams = {


	


	list: Id;
}

export type GroupKeysRef = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	list: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupKeysRef>;
    _original: Nullable<GroupKeysRef>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	targetKeyVersion: NumberString;
	groupKeyRotationType: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	adminPubKeyMac: null | KeyMac;
	distEncAdminGroupSymKey: null | PubEncKeyData;
	distKeyMac: null | KeyMac;
	adminDistKeyPair: null | KeyPair;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<KeyRotation>;
    _original: Nullable<KeyRotation>
    isAdapter: false,
}
export const KeyRotationsRefTypeRef: TypeRef<KeyRotationsRef> = new TypeRef("sys", 2291)

export function createKeyRotationsRef(values: KeyRotationsRefParams): KeyRotationsRef {
    return Object.assign(create(typeModels[KeyRotationsRefTypeRef.typeId], KeyRotationsRefTypeRef), values)
}


export type KeyRotationsRefParams = {


	


	list: Id;
}

export type KeyRotationsRef = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	list: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<KeyRotationsRef>;
    _original: Nullable<KeyRotationsRef>
    isAdapter: false,
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
    // == values

	_id: Id;
	category: NumberString;
	reason: NumberString;
	details: null | string;
	version: NumberString;
	clientVersion: string;
	clientPlatform: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SurveyData>;
    _original: Nullable<SurveyData>
    isAdapter: false,
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
    // == values

	_id: Id;
	listId: Id;
	listElementId: Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<IdTupleWrapper>;
    _original: Nullable<IdTupleWrapper>
    isAdapter: false,
}
export const UserGroupKeyDistributionTypeRef: TypeRef<UserGroupKeyDistribution> = new TypeRef("sys", 2320)

export function createUserGroupKeyDistribution(values: UserGroupKeyDistributionParams): UserGroupKeyDistribution {
    return Object.assign(create(typeModels[UserGroupKeyDistributionTypeRef.typeId], UserGroupKeyDistributionTypeRef), values)
}


export type UserGroupKeyDistributionParams = {


	distributionEncUserGroupKey: Uint8Array<ArrayBuffer>;
	userGroupKeyVersion: NumberString;
	

}

export type UserGroupKeyDistribution = {
    // == values

	_id: ElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	distributionEncUserGroupKey: Uint8Array<ArrayBuffer>;
	userGroupKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserGroupKeyDistribution>;
    _original: Nullable<UserGroupKeyDistribution>
    isAdapter: false,
}
export const GroupKeyRotationDataTypeRef: TypeRef<GroupKeyRotationData> = new TypeRef("sys", 2328)

export function createGroupKeyRotationData(values: GroupKeyRotationDataParams): GroupKeyRotationData {
    return Object.assign(create(typeModels[GroupKeyRotationDataTypeRef.typeId], GroupKeyRotationDataTypeRef), values)
}


export type GroupKeyRotationDataParams = {


	groupKeyVersion: NumberString;
	groupEncPreviousGroupKey: Uint8Array<ArrayBuffer>;
	adminGroupEncGroupKey: null | Uint8Array<ArrayBuffer>;
	adminGroupKeyVersion: null | NumberString;
	


	group: Id;
	keyPair: null | KeyPair;
	groupKeyUpdatesForMembers: GroupKeyUpdateData[];
	groupMembershipUpdateData: GroupMembershipUpdateData[];
}

export type GroupKeyRotationData = {
    // == values

	_id: Id;
	groupKeyVersion: NumberString;
	groupEncPreviousGroupKey: Uint8Array<ArrayBuffer>;
	adminGroupEncGroupKey: null | Uint8Array<ArrayBuffer>;
	adminGroupKeyVersion: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	group: Id;
	keyPair: null | KeyPair;
	groupKeyUpdatesForMembers: GroupKeyUpdateData[];
	groupMembershipUpdateData: GroupMembershipUpdateData[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupKeyRotationData>;
    _original: Nullable<GroupKeyRotationData>
    isAdapter: false,
}
export const GroupKeyRotationPostInTypeRef: TypeRef<GroupKeyRotationPostIn> = new TypeRef("sys", 2338)

export function createGroupKeyRotationPostIn(values: GroupKeyRotationPostInParams): GroupKeyRotationPostIn {
    return Object.assign(create(typeModels[GroupKeyRotationPostInTypeRef.typeId], GroupKeyRotationPostInTypeRef), values)
}


export type GroupKeyRotationPostInParams = {


	


	groupKeyUpdates: GroupKeyRotationData[];
}

export type GroupKeyRotationPostIn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	groupKeyUpdates: GroupKeyRotationData[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupKeyRotationPostIn>;
    _original: Nullable<GroupKeyRotationPostIn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	userOrAdminGroupKeyRotationScheduled: boolean;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	groupKeyUpdates: IdTuple[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupKeyRotationInfoGetOut>;
    _original: Nullable<GroupKeyRotationInfoGetOut>
    isAdapter: false,
}
export const RecoverCodeDataTypeRef: TypeRef<RecoverCodeData> = new TypeRef("sys", 2346)

export function createRecoverCodeData(values: RecoverCodeDataParams): RecoverCodeData {
    return Object.assign(create(typeModels[RecoverCodeDataTypeRef.typeId], RecoverCodeDataTypeRef), values)
}


export type RecoverCodeDataParams = {


	userKeyVersion: NumberString;
	recoveryCodeEncUserGroupKey: Uint8Array<ArrayBuffer>;
	userEncRecoveryCode: Uint8Array<ArrayBuffer>;
	recoveryCodeVerifier: Uint8Array<ArrayBuffer>;
	

}

export type RecoverCodeData = {
    // == values

	_id: Id;
	userKeyVersion: NumberString;
	recoveryCodeEncUserGroupKey: Uint8Array<ArrayBuffer>;
	userEncRecoveryCode: Uint8Array<ArrayBuffer>;
	recoveryCodeVerifier: Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RecoverCodeData>;
    _original: Nullable<RecoverCodeData>
    isAdapter: false,
}
export const UserGroupKeyRotationDataTypeRef: TypeRef<UserGroupKeyRotationData> = new TypeRef("sys", 2352)

export function createUserGroupKeyRotationData(values: UserGroupKeyRotationDataParams): UserGroupKeyRotationData {
    return Object.assign(create(typeModels[UserGroupKeyRotationDataTypeRef.typeId], UserGroupKeyRotationDataTypeRef), values)
}


export type UserGroupKeyRotationDataParams = {


	passphraseEncUserGroupKey: Uint8Array<ArrayBuffer>;
	distributionKeyEncUserGroupKey: Uint8Array<ArrayBuffer>;
	userGroupKeyVersion: NumberString;
	userGroupEncPreviousGroupKey: Uint8Array<ArrayBuffer>;
	adminGroupEncUserGroupKey: null | Uint8Array<ArrayBuffer>;
	adminGroupKeyVersion: NumberString;
	authVerifier: Uint8Array<ArrayBuffer>;
	userGroupEncAdminGroupKey: null | Uint8Array<ArrayBuffer>;
	


	keyPair: KeyPair;
	group: Id;
	recoverCodeData: null | RecoverCodeData;
	pubAdminGroupEncUserGroupKey: null | PubEncKeyData;
}

export type UserGroupKeyRotationData = {
    // == values

	_id: Id;
	passphraseEncUserGroupKey: Uint8Array<ArrayBuffer>;
	distributionKeyEncUserGroupKey: Uint8Array<ArrayBuffer>;
	userGroupKeyVersion: NumberString;
	userGroupEncPreviousGroupKey: Uint8Array<ArrayBuffer>;
	adminGroupEncUserGroupKey: null | Uint8Array<ArrayBuffer>;
	adminGroupKeyVersion: NumberString;
	authVerifier: Uint8Array<ArrayBuffer>;
	userGroupEncAdminGroupKey: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	keyPair: KeyPair;
	group: Id;
	recoverCodeData: null | RecoverCodeData;
	pubAdminGroupEncUserGroupKey: null | PubEncKeyData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserGroupKeyRotationData>;
    _original: Nullable<UserGroupKeyRotationData>
    isAdapter: false,
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
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	adminGroupKeyData: GroupKeyRotationData;
	userGroupKeyData: UserGroupKeyRotationData;
	adminPubKeyMacList: KeyMac[];
	distribution: AdminGroupKeyDistributionElement[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AdminGroupKeyRotationPostIn>;
    _original: Nullable<AdminGroupKeyRotationPostIn>
    isAdapter: false,
}
export const GroupKeyUpdateTypeRef: TypeRef<GroupKeyUpdate> = new TypeRef("sys", 2369)

export function createGroupKeyUpdate(values: GroupKeyUpdateParams): GroupKeyUpdate {
    return Object.assign(create(typeModels[GroupKeyUpdateTypeRef.typeId], GroupKeyUpdateTypeRef), values)
}


export type GroupKeyUpdateParams = {


	groupKey: Uint8Array<ArrayBuffer>;
	groupKeyVersion: NumberString;
	


	bucketKey: BucketKey;
}

export type GroupKeyUpdate = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	_ownerKeyVersion: null | NumberString;
	groupKey: Uint8Array<ArrayBuffer>;
	groupKeyVersion: NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	bucketKey: BucketKey;


    //== some entities have these and some don't
    
    
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupKeyUpdate>;
    _errors: Object;
    _original: Nullable<GroupKeyUpdate>
    isAdapter: false,
}
export const GroupKeyUpdatesRefTypeRef: TypeRef<GroupKeyUpdatesRef> = new TypeRef("sys", 2380)

export function createGroupKeyUpdatesRef(values: GroupKeyUpdatesRefParams): GroupKeyUpdatesRef {
    return Object.assign(create(typeModels[GroupKeyUpdatesRefTypeRef.typeId], GroupKeyUpdatesRefTypeRef), values)
}


export type GroupKeyUpdatesRefParams = {


	


	list: Id;
}

export type GroupKeyUpdatesRef = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	list: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupKeyUpdatesRef>;
    _original: Nullable<GroupKeyUpdatesRef>
    isAdapter: false,
}
export const PubEncKeyDataTypeRef: TypeRef<PubEncKeyData> = new TypeRef("sys", 2384)

export function createPubEncKeyData(values: PubEncKeyDataParams): PubEncKeyData {
    return Object.assign(create(typeModels[PubEncKeyDataTypeRef.typeId], PubEncKeyDataTypeRef), values)
}


export type PubEncKeyDataParams = {


	recipientIdentifier: string;
	pubEncSymKey: Uint8Array<ArrayBuffer>;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;
	protocolVersion: NumberString;
	recipientIdentifierType: NumberString;
	senderIdentifier: null | string;
	senderIdentifierType: null | NumberString;
	


	symKeyMac: null | KeyMac;
}

export type PubEncKeyData = {
    // == values

	_id: Id;
	recipientIdentifier: string;
	pubEncSymKey: Uint8Array<ArrayBuffer>;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;
	protocolVersion: NumberString;
	recipientIdentifierType: NumberString;
	senderIdentifier: null | string;
	senderIdentifierType: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	symKeyMac: null | KeyMac;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PubEncKeyData>;
    _original: Nullable<PubEncKeyData>
    isAdapter: false,
}
export const GroupKeyUpdateDataTypeRef: TypeRef<GroupKeyUpdateData> = new TypeRef("sys", 2391)

export function createGroupKeyUpdateData(values: GroupKeyUpdateDataParams): GroupKeyUpdateData {
    return Object.assign(create(typeModels[GroupKeyUpdateDataTypeRef.typeId], GroupKeyUpdateDataTypeRef), values)
}


export type GroupKeyUpdateDataParams = {


	sessionKeyEncGroupKeyVersion: NumberString;
	sessionKeyEncGroupKey: Uint8Array<ArrayBuffer>;
	bucketKeyEncSessionKey: Uint8Array<ArrayBuffer>;
	


	pubEncBucketKeyData: PubEncKeyData;
}

export type GroupKeyUpdateData = {
    // == values

	_id: Id;
	sessionKeyEncGroupKeyVersion: NumberString;
	sessionKeyEncGroupKey: Uint8Array<ArrayBuffer>;
	bucketKeyEncSessionKey: Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	pubEncBucketKeyData: PubEncKeyData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupKeyUpdateData>;
    _original: Nullable<GroupKeyUpdateData>
    isAdapter: false,
}
export const GroupMembershipKeyDataTypeRef: TypeRef<GroupMembershipKeyData> = new TypeRef("sys", 2398)

export function createGroupMembershipKeyData(values: GroupMembershipKeyDataParams): GroupMembershipKeyData {
    return Object.assign(create(typeModels[GroupMembershipKeyDataTypeRef.typeId], GroupMembershipKeyDataTypeRef), values)
}


export type GroupMembershipKeyDataParams = {


	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;
	symEncGKey: Uint8Array<ArrayBuffer>;
	


	group: Id;
}

export type GroupMembershipKeyData = {
    // == values

	_id: Id;
	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;
	symEncGKey: Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	group: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupMembershipKeyData>;
    _original: Nullable<GroupMembershipKeyData>
    isAdapter: false,
}
export const MembershipPutInTypeRef: TypeRef<MembershipPutIn> = new TypeRef("sys", 2404)

export function createMembershipPutIn(values: MembershipPutInParams): MembershipPutIn {
    return Object.assign(create(typeModels[MembershipPutInTypeRef.typeId], MembershipPutInTypeRef), values)
}


export type MembershipPutInParams = {


	


	groupKeyUpdates: GroupMembershipKeyData[];
}

export type MembershipPutIn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	groupKeyUpdates: GroupMembershipKeyData[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<MembershipPutIn>;
    _original: Nullable<MembershipPutIn>
    isAdapter: false,
}
export const GroupMembershipUpdateDataTypeRef: TypeRef<GroupMembershipUpdateData> = new TypeRef("sys", 2427)

export function createGroupMembershipUpdateData(values: GroupMembershipUpdateDataParams): GroupMembershipUpdateData {
    return Object.assign(create(typeModels[GroupMembershipUpdateDataTypeRef.typeId], GroupMembershipUpdateDataTypeRef), values)
}


export type GroupMembershipUpdateDataParams = {


	userEncGroupKey: Uint8Array<ArrayBuffer>;
	userKeyVersion: NumberString;
	


	userId: Id;
}

export type GroupMembershipUpdateData = {
    // == values

	_id: Id;
	userEncGroupKey: Uint8Array<ArrayBuffer>;
	userKeyVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	userId: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<GroupMembershipUpdateData>;
    _original: Nullable<GroupMembershipUpdateData>
    isAdapter: false,
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
    // == values

	_id: Id;
	monthTimestamp: NumberString;
	newFree: NumberString;
	newPaid: NumberString;
	totalFree: NumberString;
	totalPaid: NumberString;
	commission: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AffiliatePartnerKpiMonthSummary>;
    _original: Nullable<AffiliatePartnerKpiMonthSummary>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	promotionId: string;
	accumulatedCommission: NumberString;
	creditedCommission: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	kpis: AffiliatePartnerKpiMonthSummary[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AffiliatePartnerKpiServiceGetOut>;
    _original: Nullable<AffiliatePartnerKpiServiceGetOut>
    isAdapter: false,
}
export const UserGroupKeyRotationPostInTypeRef: TypeRef<UserGroupKeyRotationPostIn> = new TypeRef("sys", 2471)

export function createUserGroupKeyRotationPostIn(values: UserGroupKeyRotationPostInParams): UserGroupKeyRotationPostIn {
    return Object.assign(create(typeModels[UserGroupKeyRotationPostInTypeRef.typeId], UserGroupKeyRotationPostInTypeRef), values)
}


export type UserGroupKeyRotationPostInParams = {


	


	userGroupKeyData: UserGroupKeyRotationData;
}

export type UserGroupKeyRotationPostIn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	userGroupKeyData: UserGroupKeyRotationData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserGroupKeyRotationPostIn>;
    _original: Nullable<UserGroupKeyRotationPostIn>
    isAdapter: false,
}
export const KeyMacTypeRef: TypeRef<KeyMac> = new TypeRef("sys", 2477)

export function createKeyMac(values: KeyMacParams): KeyMac {
    return Object.assign(create(typeModels[KeyMacTypeRef.typeId], KeyMacTypeRef), values)
}


export type KeyMacParams = {


	taggedKeyVersion: NumberString;
	tag: Uint8Array<ArrayBuffer>;
	taggingKeyVersion: NumberString;
	


	taggingGroup: Id;
}

export type KeyMac = {
    // == values

	_id: Id;
	taggedKeyVersion: NumberString;
	tag: Uint8Array<ArrayBuffer>;
	taggingKeyVersion: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	taggingGroup: Id;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<KeyMac>;
    _original: Nullable<KeyMac>
    isAdapter: false,
}
export const AppStoreSubscriptionGetOutTypeRef: TypeRef<AppStoreSubscriptionGetOut> = new TypeRef("sys", 2497)

export function createAppStoreSubscriptionGetOut(values: AppStoreSubscriptionGetOutParams): AppStoreSubscriptionGetOut {
    return Object.assign(create(typeModels[AppStoreSubscriptionGetOutTypeRef.typeId], AppStoreSubscriptionGetOutTypeRef), values)
}


export type AppStoreSubscriptionGetOutParams = {


	app: NumberString;
	

}

export type AppStoreSubscriptionGetOut = {
    // == values

	_format: NumberString;
	app: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AppStoreSubscriptionGetOut>;
    _original: Nullable<AppStoreSubscriptionGetOut>
    isAdapter: false,
}
export const AppStoreSubscriptionGetInTypeRef: TypeRef<AppStoreSubscriptionGetIn> = new TypeRef("sys", 2500)

export function createAppStoreSubscriptionGetIn(values: AppStoreSubscriptionGetInParams): AppStoreSubscriptionGetIn {
    return Object.assign(create(typeModels[AppStoreSubscriptionGetInTypeRef.typeId], AppStoreSubscriptionGetInTypeRef), values)
}


export type AppStoreSubscriptionGetInParams = {


	subscriptionId: string;
	

}

export type AppStoreSubscriptionGetIn = {
    // == values

	_format: NumberString;
	subscriptionId: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AppStoreSubscriptionGetIn>;
    _original: Nullable<AppStoreSubscriptionGetIn>
    isAdapter: false,
}
export const VerifierTokenServiceOutTypeRef: TypeRef<VerifierTokenServiceOut> = new TypeRef("sys", 2510)

export function createVerifierTokenServiceOut(values: VerifierTokenServiceOutParams): VerifierTokenServiceOut {
    return Object.assign(create(typeModels[VerifierTokenServiceOutTypeRef.typeId], VerifierTokenServiceOutTypeRef), values)
}


export type VerifierTokenServiceOutParams = {


	token: string;
	

}

export type VerifierTokenServiceOut = {
    // == values

	_format: NumberString;
	token: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<VerifierTokenServiceOut>;
    _original: Nullable<VerifierTokenServiceOut>
    isAdapter: false,
}
export const VerifierTokenServiceInTypeRef: TypeRef<VerifierTokenServiceIn> = new TypeRef("sys", 2517)

export function createVerifierTokenServiceIn(values: VerifierTokenServiceInParams): VerifierTokenServiceIn {
    return Object.assign(create(typeModels[VerifierTokenServiceInTypeRef.typeId], VerifierTokenServiceInTypeRef), values)
}


export type VerifierTokenServiceInParams = {


	authVerifier: Uint8Array<ArrayBuffer>;
	

}

export type VerifierTokenServiceIn = {
    // == values

	_format: NumberString;
	authVerifier: Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<VerifierTokenServiceIn>;
    _original: Nullable<VerifierTokenServiceIn>
    isAdapter: false,
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
    // == values

	_id: Id;
	ruleType: NumberString;
	interval: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CalendarAdvancedRepeatRule>;
    _original: Nullable<CalendarAdvancedRepeatRule>
    isAdapter: false,
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
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	userGroupId: Id;
	distEncAdminGroupKey: PubEncKeyData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AdminGroupKeyDistributionElement>;
    _original: Nullable<AdminGroupKeyDistributionElement>
    isAdapter: false,
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
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	distKeyMac: KeyMac;
	adminDistKeyPair: KeyPair;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AdminGroupKeyRotationPutIn>;
    _original: Nullable<AdminGroupKeyRotationPutIn>
    isAdapter: false,
}
export const PubDistributionKeyTypeRef: TypeRef<PubDistributionKey> = new TypeRef("sys", 2540)

export function createPubDistributionKey(values: PubDistributionKeyParams): PubDistributionKey {
    return Object.assign(create(typeModels[PubDistributionKeyTypeRef.typeId], PubDistributionKeyTypeRef), values)
}


export type PubDistributionKeyParams = {


	pubEccKey: Uint8Array<ArrayBuffer>;
	pubKyberKey: Uint8Array<ArrayBuffer>;
	


	userGroupId: Id;
	pubKeyMac: KeyMac;
}

export type PubDistributionKey = {
    // == values

	_id: Id;
	pubEccKey: Uint8Array<ArrayBuffer>;
	pubKyberKey: Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	userGroupId: Id;
	pubKeyMac: KeyMac;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PubDistributionKey>;
    _original: Nullable<PubDistributionKey>
    isAdapter: false,
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
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	userGroupIdsMissingDistributionKeys: Id[];
	distributionKeys: PubDistributionKey[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AdminGroupKeyRotationGetOut>;
    _original: Nullable<AdminGroupKeyRotationGetOut>
    isAdapter: false,
}
export const SurveyDataPostInTypeRef: TypeRef<SurveyDataPostIn> = new TypeRef("sys", 2563)

export function createSurveyDataPostIn(values: SurveyDataPostInParams): SurveyDataPostIn {
    return Object.assign(create(typeModels[SurveyDataPostInTypeRef.typeId], SurveyDataPostInTypeRef), values)
}


export type SurveyDataPostInParams = {


	surveyType: NumberString;
	


	surveyData: SurveyData;
}

export type SurveyDataPostIn = {
    // == values

	_format: NumberString;
	surveyType: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	surveyData: SurveyData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SurveyDataPostIn>;
    _original: Nullable<SurveyDataPostIn>
    isAdapter: false,
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
    // == values

	_id: Id;
	patchOperation: NumberString;
	attributePath: string;
	value: null | string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Patch>;
    _original: Nullable<Patch>
    isAdapter: false,
}
export const IdentityKeyPairTypeRef: TypeRef<IdentityKeyPair> = new TypeRef("sys", 2575)

export function createIdentityKeyPair(values: IdentityKeyPairParams): IdentityKeyPair {
    return Object.assign(create(typeModels[IdentityKeyPairTypeRef.typeId], IdentityKeyPairTypeRef), values)
}


export type IdentityKeyPairParams = {


	identityKeyVersion: NumberString;
	encryptingKeyVersion: NumberString;
	publicEd25519Key: Uint8Array<ArrayBuffer>;
	privateEd25519Key: Uint8Array<ArrayBuffer>;
	


	publicKeyMac: KeyMac;
}

export type IdentityKeyPair = {
    // == values

	_id: Id;
	identityKeyVersion: NumberString;
	encryptingKeyVersion: NumberString;
	publicEd25519Key: Uint8Array<ArrayBuffer>;
	privateEd25519Key: Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	publicKeyMac: KeyMac;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<IdentityKeyPair>;
    _original: Nullable<IdentityKeyPair>
    isAdapter: false,
}
export const PublicKeySignatureTypeRef: TypeRef<PublicKeySignature> = new TypeRef("sys", 2582)

export function createPublicKeySignature(values: PublicKeySignatureParams): PublicKeySignature {
    return Object.assign(create(typeModels[PublicKeySignatureTypeRef.typeId], PublicKeySignatureTypeRef), values)
}


export type PublicKeySignatureParams = {


	signature: Uint8Array<ArrayBuffer>;
	signingKeyVersion: NumberString;
	signatureType: NumberString;
	publicKeyVersion: NumberString;
	

}

export type PublicKeySignature = {
    // == values

	_id: Id;
	signature: Uint8Array<ArrayBuffer>;
	signingKeyVersion: NumberString;
	signatureType: NumberString;
	publicKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PublicKeySignature>;
    _original: Nullable<PublicKeySignature>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	version: null | NumberString;
	identifierType: NumberString;
	identifier: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<IdentityKeyGetIn>;
    _original: Nullable<IdentityKeyGetIn>
    isAdapter: false,
}
export const IdentityKeyGetOutTypeRef: TypeRef<IdentityKeyGetOut> = new TypeRef("sys", 2595)

export function createIdentityKeyGetOut(values: IdentityKeyGetOutParams): IdentityKeyGetOut {
    return Object.assign(create(typeModels[IdentityKeyGetOutTypeRef.typeId], IdentityKeyGetOutTypeRef), values)
}


export type IdentityKeyGetOutParams = {


	publicIdentityKey: Uint8Array<ArrayBuffer>;
	publicIdentityKeyVersion: NumberString;
	

}

export type IdentityKeyGetOut = {
    // == values

	_format: NumberString;
	publicIdentityKey: Uint8Array<ArrayBuffer>;
	publicIdentityKeyVersion: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<IdentityKeyGetOut>;
    _original: Nullable<IdentityKeyGetOut>
    isAdapter: false,
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
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	identityKeyPair: IdentityKeyPair;
	signatures: PublicKeySignature[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<IdentityKeyPostIn>;
    _original: Nullable<IdentityKeyPostIn>
    isAdapter: false,
}
export const RolloutTypeRef: TypeRef<Rollout> = new TypeRef("sys", 2604)

export function createRollout(values: RolloutParams): Rollout {
    return Object.assign(create(typeModels[RolloutTypeRef.typeId], RolloutTypeRef), values)
}


export type RolloutParams = {


	rolloutType: NumberString;
	

}

export type Rollout = {
    // == values

	_id: Id;
	rolloutType: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<Rollout>;
    _original: Nullable<Rollout>
    isAdapter: false,
}
export const RolloutGetOutTypeRef: TypeRef<RolloutGetOut> = new TypeRef("sys", 2607)

export function createRolloutGetOut(values: RolloutGetOutParams): RolloutGetOut {
    return Object.assign(create(typeModels[RolloutGetOutTypeRef.typeId], RolloutGetOutTypeRef), values)
}


export type RolloutGetOutParams = {


	


	rollouts: Rollout[];
}

export type RolloutGetOut = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	rollouts: Rollout[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RolloutGetOut>;
    _original: Nullable<RolloutGetOut>
    isAdapter: false,
}
export const PatchListTypeRef: TypeRef<PatchList> = new TypeRef("sys", 2614)

export function createPatchList(values: PatchListParams): PatchList {
    return Object.assign(create(typeModels[PatchListTypeRef.typeId], PatchListTypeRef), values)
}


export type PatchListParams = {


	


	patches: Patch[];
}

export type PatchList = {
    // == values

	_id: Id;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	patches: Patch[];


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PatchList>;
    _original: Nullable<PatchList>
    isAdapter: false,
}
export const CaptchaChallengeTypeRef: TypeRef<CaptchaChallenge> = new TypeRef("sys", 2619)

export function createCaptchaChallenge(values: CaptchaChallengeParams): CaptchaChallenge {
    return Object.assign(create(typeModels[CaptchaChallengeTypeRef.typeId], CaptchaChallengeTypeRef), values)
}


export type CaptchaChallengeParams = {


	challenge: Uint8Array<ArrayBuffer>;
	description: string;
	

}

export type CaptchaChallenge = {
    // == values

	_id: Id;
	challenge: Uint8Array<ArrayBuffer>;
	description: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<CaptchaChallenge>;
    _original: Nullable<CaptchaChallenge>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	signupToken: string;
	timeToSolveCalibrationChallenge: null | NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	deviceInfo: null | ClientPerformanceInfo;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<TimelockCaptchaGetIn>;
    _original: Nullable<TimelockCaptchaGetIn>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	difficulty: string;
	modulus: string;
	base: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<TimelockCaptchaGetOut>;
    _original: Nullable<TimelockCaptchaGetOut>
    isAdapter: false,
}
export const ClientPerformanceInfoTypeRef: TypeRef<ClientPerformanceInfo> = new TypeRef("sys", 2641)

export function createClientPerformanceInfo(values: ClientPerformanceInfoParams): ClientPerformanceInfo {
    return Object.assign(create(typeModels[ClientPerformanceInfoTypeRef.typeId], ClientPerformanceInfoTypeRef), values)
}


export type ClientPerformanceInfoParams = {


	isAutomatedBrowser: boolean;
	

}

export type ClientPerformanceInfo = {
    // == values

	_id: Id;
	isAutomatedBrowser: boolean;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<ClientPerformanceInfo>;
    _original: Nullable<ClientPerformanceInfo>
    isAdapter: false,
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
    // == values

	_id: Id;
	criterion: string;
	value: string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AbuseInfo>;
    _original: Nullable<AbuseInfo>
    isAdapter: false,
}
export const PartnerManagedCustomerTypeRef: TypeRef<PartnerManagedCustomer> = new TypeRef("sys", 2672)

export function createPartnerManagedCustomer(values: PartnerManagedCustomerParams): PartnerManagedCustomer {
    return Object.assign(create(typeModels[PartnerManagedCustomerTypeRef.typeId], PartnerManagedCustomerTypeRef), values)
}


export type PartnerManagedCustomerParams = {


	


	customerInfo: IdTuple;
}

export type PartnerManagedCustomer = {
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	customerInfo: IdTuple;


    //== some entities have these and some don't
    
    bucketKey: null
	
	
	
	
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<PartnerManagedCustomer>;
    _errors: Object;
    _original: Nullable<PartnerManagedCustomer>
    isAdapter: false,
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
    // == values

	_id: Id;
	attributionId: string;
	attributionType: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<AdAttribution>;
    _original: Nullable<AdAttribution>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;
	operationId: Id;
	status: NumberString;
	statusCode: null | NumberString;
	reason: null | string;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<OperationStatusUpdate>;
    _original: Nullable<OperationStatusUpdate>
    isAdapter: false,
}
export const UserAlarmInfoDataTypeRef: TypeRef<UserAlarmInfoData> = new TypeRef("sys", 2722)

export function createUserAlarmInfoData(values: UserAlarmInfoDataParams): UserAlarmInfoData {
    return Object.assign(create(typeModels[UserAlarmInfoDataTypeRef.typeId], UserAlarmInfoDataTypeRef), values)
}


export type UserAlarmInfoDataParams = {


	encryptedTrigger: Uint8Array<ArrayBuffer>;
	alarmIdentifier: string;
	


	ownerGroup: Id;
	calendarEventRef: CalendarEventRef;
}

export type UserAlarmInfoData = {
    // == values

	_id: Id;
	ownerEncSessionKey: Uint8Array<ArrayBuffer>;
	ownerKeyVersion: NumberString;
	encryptedTrigger: Uint8Array<ArrayBuffer>;
	alarmIdentifier: string;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	ownerGroup: Id;
	calendarEventRef: CalendarEventRef;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UserAlarmInfoData>;
    _original: Nullable<UserAlarmInfoData>
    isAdapter: false,
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
    // == values

	_id: Id;
	subscriptionProvider: NumberString;
	foreignKey: null | string;
	subscriptionApp: NumberString;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SubscriptionReference>;
    _original: Nullable<SubscriptionReference>
    isAdapter: false,
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
    // == values

	_format: NumberString;
	isEnabled: boolean;
	customerId: Id;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<RenewalPreferenceServicePostIn>;
    _original: Nullable<RenewalPreferenceServicePostIn>
    isAdapter: false,
}
export const InstanceKdfNonceTypeRef: TypeRef<InstanceKdfNonce> = new TypeRef("sys", 2746)

export function createInstanceKdfNonce(values: InstanceKdfNonceParams): InstanceKdfNonce {
    return Object.assign(create(typeModels[InstanceKdfNonceTypeRef.typeId], InstanceKdfNonceTypeRef), values)
}


export type InstanceKdfNonceParams = {


	instanceList: null | Id;
	instanceId: Id;
	kdfNonce: Uint8Array<ArrayBuffer>;
	


	typeInfo: TypeInfo;
}

export type InstanceKdfNonce = {
    // == values

	_id: Id;
	instanceList: null | Id;
	instanceId: Id;
	kdfNonce: Uint8Array<ArrayBuffer>;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	typeInfo: TypeInfo;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<InstanceKdfNonce>;
    _original: Nullable<InstanceKdfNonce>
    isAdapter: false,
}
export const UpdateKdfNoncePostInTypeRef: TypeRef<UpdateKdfNoncePostIn> = new TypeRef("sys", 2752)

export function createUpdateKdfNoncePostIn(values: UpdateKdfNoncePostInParams): UpdateKdfNoncePostIn {
    return Object.assign(create(typeModels[UpdateKdfNoncePostInTypeRef.typeId], UpdateKdfNoncePostInTypeRef), values)
}


export type UpdateKdfNoncePostInParams = {


	


	instanceKdfNonce: InstanceKdfNonce;
}

export type UpdateKdfNoncePostIn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	instanceKdfNonce: InstanceKdfNonce;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UpdateKdfNoncePostIn>;
    _original: Nullable<UpdateKdfNoncePostIn>
    isAdapter: false,
}
export const UpdateKdfNoncePostOutTypeRef: TypeRef<UpdateKdfNoncePostOut> = new TypeRef("sys", 2755)

export function createUpdateKdfNoncePostOut(values: UpdateKdfNoncePostOutParams): UpdateKdfNoncePostOut {
    return Object.assign(create(typeModels[UpdateKdfNoncePostOutTypeRef.typeId], UpdateKdfNoncePostOutTypeRef), values)
}


export type UpdateKdfNoncePostOutParams = {


	kdfNonce: Uint8Array<ArrayBuffer>;
	

}

export type UpdateKdfNoncePostOut = {
    // == values

	_format: NumberString;
	kdfNonce: Uint8Array<ArrayBuffer>;
	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations



    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<UpdateKdfNoncePostOut>;
    _original: Nullable<UpdateKdfNoncePostOut>
    isAdapter: false,
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
    // == values

	_id: ListElementId;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	revocationRequestDate: Date;
	isRefundProcessed: boolean;
	latestDowngradeFailedNotification: null | Date;
	downgradeGracePeriodEnd: null | Date;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	

    // == associations

	customer: Id;


    //== some entities have these and some don't
    
    bucketKey: null
	
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SubscriptionRevocationRequest>;
    _original: Nullable<SubscriptionRevocationRequest>
    isAdapter: false,
}
export const SubscriptionRevocationServicePostInTypeRef: TypeRef<SubscriptionRevocationServicePostIn> = new TypeRef("sys", 2771)

export function createSubscriptionRevocationServicePostIn(values: SubscriptionRevocationServicePostInParams): SubscriptionRevocationServicePostIn {
    return Object.assign(create(typeModels[SubscriptionRevocationServicePostInTypeRef.typeId], SubscriptionRevocationServicePostInTypeRef), values)
}


export type SubscriptionRevocationServicePostInParams = {


	


	surveyData: null | SurveyData;
}

export type SubscriptionRevocationServicePostIn = {
    // == values

	_format: NumberString;

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

    // == associations

	surveyData: null | SurveyData;


    //== some entities have these and some don't
    _permissions: null
    bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null


	// === these are not present in metamodel
	_type: TypeRef<SubscriptionRevocationServicePostIn>;
    _original: Nullable<SubscriptionRevocationServicePostIn>
    isAdapter: false,
}
