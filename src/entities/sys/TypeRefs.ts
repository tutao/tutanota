import { create, StrippedEntity } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import { AggregatedEntity, ElementEntity, Entity, ListElementEntity, BlobElementEntity, DataTransferEntity, AttributeId } from "@tutao/meta"


export const KeyPairTypeRef: TypeRef<KeyPair> = new TypeRef("sys", 0)

export function createKeyPair(values: StrippedEntity<KeyPair>): KeyPair {
    return Object.assign(create(typeModels[KeyPairTypeRef.typeId], KeyPairTypeRef), values)
}

export type KeyPairParams = {

	_id: Id;
	pubRsaKey: null | Uint8Array;
	symEncPrivRsaKey: null | Uint8Array;
	pubEccKey: null | Uint8Array;
	symEncPrivEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;
	symEncPrivKyberKey: null | Uint8Array;

	signature: null | PublicKeySignature;
}

export class KeyPair extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<KeyPair> { return KeyPairTypeRef };
	

	get _id(): Id { return this._attrs[1] }
	get pubRsaKey(): null | Uint8Array { return this._attrs[2] }
	get symEncPrivRsaKey(): null | Uint8Array { return this._attrs[3] }
	get pubEccKey(): null | Uint8Array { return this._attrs[2144] }
	get symEncPrivEccKey(): null | Uint8Array { return this._attrs[2145] }
	get pubKyberKey(): null | Uint8Array { return this._attrs[2146] }
	get symEncPrivKyberKey(): null | Uint8Array { return this._attrs[2147] }
	

	get signature(): null | PublicKeySignature { return this._attrs[2147] }
	set signature(a: PublicKeySignature)  { this._attrs[2589] = a } 
}
export const GroupTypeRef: TypeRef<Group> = new TypeRef("sys", 5)

export function createGroup(values: StrippedEntity<Group>): Group {
    return Object.assign(create(typeModels[GroupTypeRef.typeId], GroupTypeRef), values)
}

export type GroupParams = {

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

export class Group extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Group> { return GroupTypeRef };
	

	get _id(): Id { return this._attrs[7] }
	get _permissions(): Id { return this._attrs[8] }
	get _format(): NumberString { return this._attrs[9] }
	get type(): NumberString { return this._attrs[10] }
	get adminGroupEncGKey(): null | Uint8Array { return this._attrs[11] }
	get enabled(): boolean { return this._attrs[12] }
	get _ownerGroup(): null | Id { return this._attrs[981] }
	get external(): boolean { return this._attrs[982] }
	get adminGroupKeyVersion(): null | NumberString { return this._attrs[2270] }
	get groupKeyVersion(): NumberString { return this._attrs[2271] }
    set groupKeyVersion(v: NumberString) { this._attrs[2271] = v }
	

	get currentKeys(): null | KeyPair { return this._attrs[2271] }
	get admin(): null | Id { return this._attrs[2271] }
	get user(): null | Id { return this._attrs[2271] }
	get customer(): null | Id { return this._attrs[2271] }
	get groupInfo(): IdTuple { return this._attrs[2271] }
	get invitations(): Id { return this._attrs[2271] }
	get members(): Id { return this._attrs[2271] }
	get archives(): ArchiveType[] { return this._attrs[2271] }
	get storageCounter(): null | Id { return this._attrs[2271] }
	get formerGroupKeys(): GroupKeysRef { return this._attrs[2271] }
	set formerGroupKeys(a: GroupKeysRef)  { this._attrs[2273] = a } 
	get pubAdminGroupEncGKey(): null | PubEncKeyData { return this._attrs[2271] }
	get identityKeyPair(): null | IdentityKeyPair { return this._attrs[2271] }
	set identityKeyPair(a: IdentityKeyPair)  { this._attrs[2588] = a } 
}
export const GroupInfoTypeRef: TypeRef<GroupInfo> = new TypeRef("sys", 14)

export function createGroupInfo(values: StrippedEntity<GroupInfo>): GroupInfo {
    return Object.assign(create(typeModels[GroupInfoTypeRef.typeId], GroupInfoTypeRef), values)
}

export type GroupInfoParams = {

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

export class GroupInfo extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupInfo> { return GroupInfoTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[16] }
	get _permissions(): Id { return this._attrs[17] }
	get _format(): NumberString { return this._attrs[18] }
	get _listEncSessionKey(): null | Uint8Array { return this._attrs[19] }
	get name(): string { return this._attrs[21] }
	get mailAddress(): null | string { return this._attrs[22] }
	get created(): Date { return this._attrs[23] }
	get deleted(): null | Date { return this._attrs[24] }
	get _ownerGroup(): null | Id { return this._attrs[983] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[984] }
	get groupType(): null | NumberString { return this._attrs[1286] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2225] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2703] }
	

	get group(): Id { return this._attrs[2703] }
	get mailAddressAliases(): MailAddressAlias[] { return this._attrs[2703] }
}
export const GroupMembershipTypeRef: TypeRef<GroupMembership> = new TypeRef("sys", 25)

export function createGroupMembership(values: StrippedEntity<GroupMembership>): GroupMembership {
    return Object.assign(create(typeModels[GroupMembershipTypeRef.typeId], GroupMembershipTypeRef), values)
}

export type GroupMembershipParams = {

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

export class GroupMembership extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupMembership> { return GroupMembershipTypeRef };
	

	get _id(): Id { return this._attrs[26] }
	get symEncGKey(): Uint8Array { return this._attrs[27] }
	get admin(): boolean { return this._attrs[28] }
	get groupType(): null | NumberString { return this._attrs[1030] }
	get capability(): null | NumberString { return this._attrs[1626] }
	get groupKeyVersion(): NumberString { return this._attrs[2246] }
	get symKeyVersion(): NumberString { return this._attrs[2247] }
	

	get group(): Id { return this._attrs[2247] }
	get groupInfo(): IdTuple { return this._attrs[2247] }
	get groupMember(): IdTuple { return this._attrs[2247] }
}
export const CustomerTypeRef: TypeRef<Customer> = new TypeRef("sys", 31)

export function createCustomer(values: StrippedEntity<Customer>): Customer {
    return Object.assign(create(typeModels[CustomerTypeRef.typeId], CustomerTypeRef), values)
}

export type CustomerParams = {

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

export class Customer extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Customer> { return CustomerTypeRef };
	

	get _id(): Id { return this._attrs[33] }
	get _permissions(): Id { return this._attrs[34] }
	get _format(): NumberString { return this._attrs[35] }
	get type(): NumberString { return this._attrs[36] }
	get approvalStatus(): NumberString { return this._attrs[926] }
	get _ownerGroup(): null | Id { return this._attrs[991] }
	get orderProcessingAgreementNeeded(): boolean { return this._attrs[1347] }
	get businessUse(): boolean { return this._attrs[1754] }
    set businessUse(v: boolean) { this._attrs[1754] = v }
	

	get adminGroup(): Id { return this._attrs[1754] }
	get customerGroup(): Id { return this._attrs[1754] }
	get adminGroups(): Id { return this._attrs[1754] }
	get customerGroups(): Id { return this._attrs[1754] }
	get userGroups(): Id { return this._attrs[1754] }
	get teamGroups(): Id { return this._attrs[1754] }
	get customerInfo(): IdTuple { return this._attrs[1754] }
	get properties(): null | Id { return this._attrs[1754] }
	get serverProperties(): null | Id { return this._attrs[1754] }
	get userAreaGroups(): null | UserAreaGroups { return this._attrs[1754] }
	get auditLog(): null | AuditLogRef { return this._attrs[1754] }
	get customizations(): Feature[] { return this._attrs[1754] }
	set customizations(a: Feature[])  { this._attrs[1256] = a } 
	get whitelabelParent(): null | WhitelabelParent { return this._attrs[1754] }
	get whitelabelChildren(): null | WhitelabelChildrenRef { return this._attrs[1754] }
	get orderProcessingAgreement(): null | IdTuple { return this._attrs[1754] }
	get rejectedSenders(): null | RejectedSendersRef { return this._attrs[1754] }
	get referralCode(): null | Id { return this._attrs[1754] }
	set referralCode(a: Id)  { this._attrs[2061] = a } 
}
export const AuthenticatedDeviceTypeRef: TypeRef<AuthenticatedDevice> = new TypeRef("sys", 43)

export function createAuthenticatedDevice(values: StrippedEntity<AuthenticatedDevice>): AuthenticatedDevice {
    return Object.assign(create(typeModels[AuthenticatedDeviceTypeRef.typeId], AuthenticatedDeviceTypeRef), values)
}

export type AuthenticatedDeviceParams = {

	_id: Id;
	authType: NumberString;
	deviceToken: string;
	deviceKey: Uint8Array;
}

export class AuthenticatedDevice extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AuthenticatedDevice> { return AuthenticatedDeviceTypeRef };
	

	get _id(): Id { return this._attrs[44] }
	get authType(): NumberString { return this._attrs[45] }
	get deviceToken(): string { return this._attrs[46] }
	get deviceKey(): Uint8Array { return this._attrs[47] }
	
}
export const LoginTypeRef: TypeRef<Login> = new TypeRef("sys", 48)

export function createLogin(values: StrippedEntity<Login>): Login {
    return Object.assign(create(typeModels[LoginTypeRef.typeId], LoginTypeRef), values)
}

export type LoginParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	time: Date;
	_ownerGroup: null | Id;
}

export class Login extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Login> { return LoginTypeRef };
	

	get _id(): IdTuple { return this._attrs[50] }
	get _permissions(): Id { return this._attrs[51] }
	get _format(): NumberString { return this._attrs[52] }
	get time(): Date { return this._attrs[53] }
	get _ownerGroup(): null | Id { return this._attrs[993] }
	
}
export const SecondFactorAuthenticationTypeRef: TypeRef<SecondFactorAuthentication> = new TypeRef("sys", 54)

export function createSecondFactorAuthentication(values: StrippedEntity<SecondFactorAuthentication>): SecondFactorAuthentication {
    return Object.assign(create(typeModels[SecondFactorAuthenticationTypeRef.typeId], SecondFactorAuthenticationTypeRef), values)
}

export type SecondFactorAuthenticationParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	code: string;
	verifyCount: NumberString;
	finished: boolean;
	service: string;
	_ownerGroup: null | Id;
}

export class SecondFactorAuthentication extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SecondFactorAuthentication> { return SecondFactorAuthenticationTypeRef };
	

	get _id(): IdTuple { return this._attrs[56] }
	get _permissions(): Id { return this._attrs[57] }
	get _format(): NumberString { return this._attrs[58] }
	get code(): string { return this._attrs[59] }
	get verifyCount(): NumberString { return this._attrs[60] }
	get finished(): boolean { return this._attrs[61] }
	get service(): string { return this._attrs[62] }
	get _ownerGroup(): null | Id { return this._attrs[994] }
	
}
export const VariableExternalAuthInfoTypeRef: TypeRef<VariableExternalAuthInfo> = new TypeRef("sys", 66)

export function createVariableExternalAuthInfo(values: StrippedEntity<VariableExternalAuthInfo>): VariableExternalAuthInfo {
    return Object.assign(create(typeModels[VariableExternalAuthInfoTypeRef.typeId], VariableExternalAuthInfoTypeRef), values)
}

export type VariableExternalAuthInfoParams = {

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

export class VariableExternalAuthInfo extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<VariableExternalAuthInfo> { return VariableExternalAuthInfoTypeRef };
	

	get _id(): Id { return this._attrs[68] }
	get _permissions(): Id { return this._attrs[69] }
	get _format(): NumberString { return this._attrs[70] }
	get loggedInVerifier(): null | Uint8Array { return this._attrs[71] }
	get loggedInTimestamp(): null | Date { return this._attrs[72] }
	get loggedInIpAddressHash(): null | Uint8Array { return this._attrs[73] }
	get sentCount(): NumberString { return this._attrs[74] }
	get lastSentTimestamp(): Date { return this._attrs[75] }
	get authUpdateCounter(): NumberString { return this._attrs[76] }
	get _ownerGroup(): null | Id { return this._attrs[995] }
	
}
export const UserExternalAuthInfoTypeRef: TypeRef<UserExternalAuthInfo> = new TypeRef("sys", 77)

export function createUserExternalAuthInfo(values: StrippedEntity<UserExternalAuthInfo>): UserExternalAuthInfo {
    return Object.assign(create(typeModels[UserExternalAuthInfoTypeRef.typeId], UserExternalAuthInfoTypeRef), values)
}

export type UserExternalAuthInfoParams = {

	_id: Id;
	autoAuthenticationId: Id;
	latestSaltHash: null | Uint8Array;
	autoTransmitPassword: null | string;
	authUpdateCounter: NumberString;

	variableAuthInfo: Id;
}

export class UserExternalAuthInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserExternalAuthInfo> { return UserExternalAuthInfoTypeRef };
	

	get _id(): Id { return this._attrs[78] }
	get autoAuthenticationId(): Id { return this._attrs[79] }
	get latestSaltHash(): null | Uint8Array { return this._attrs[80] }
	get autoTransmitPassword(): null | string { return this._attrs[81] }
	get authUpdateCounter(): NumberString { return this._attrs[82] }
    set authUpdateCounter(v: NumberString) { this._attrs[82] = v }
	

	get variableAuthInfo(): Id { return this._attrs[82] }
}
export const UserTypeRef: TypeRef<User> = new TypeRef("sys", 84)

export function createUser(values: StrippedEntity<User>): User {
    return Object.assign(create(typeModels[UserTypeRef.typeId], UserTypeRef), values)
}

export type UserParams = {

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

export class User extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<User> { return UserTypeRef };
	

	get _id(): Id { return this._attrs[86] }
	get _permissions(): Id { return this._attrs[87] }
	get _format(): NumberString { return this._attrs[88] }
	get salt(): null | Uint8Array { return this._attrs[90] }
	get verifier(): Uint8Array { return this._attrs[91] }
	get accountType(): NumberString { return this._attrs[92] }
	get enabled(): boolean { return this._attrs[93] }
	get _ownerGroup(): null | Id { return this._attrs[996] }
	get requirePasswordUpdate(): boolean { return this._attrs[1117] }
	get kdfVersion(): NumberString { return this._attrs[2132] }
	

	get userGroup(): GroupMembership { return this._attrs[2132] }
	get memberships(): GroupMembership[] { return this._attrs[2132] }
	get authenticatedDevices(): AuthenticatedDevice[] { return this._attrs[2132] }
	get externalAuthInfo(): null | UserExternalAuthInfo { return this._attrs[2132] }
	get customer(): null | Id { return this._attrs[2132] }
	get successfulLogins(): Id { return this._attrs[2132] }
	get failedLogins(): Id { return this._attrs[2132] }
	get secondFactorAuthentications(): Id { return this._attrs[2132] }
	get pushIdentifierList(): null | PushIdentifierList { return this._attrs[2132] }
	set pushIdentifierList(a: PushIdentifierList)  { this._attrs[638] = a } 
	get auth(): null | UserAuthentication { return this._attrs[2132] }
	get alarmInfoList(): null | UserAlarmInfoListType { return this._attrs[2132] }
	set alarmInfoList(a: UserAlarmInfoListType)  { this._attrs[1552] = a } 
}
export const ExternalUserReferenceTypeRef: TypeRef<ExternalUserReference> = new TypeRef("sys", 103)

export function createExternalUserReference(values: StrippedEntity<ExternalUserReference>): ExternalUserReference {
    return Object.assign(create(typeModels[ExternalUserReferenceTypeRef.typeId], ExternalUserReferenceTypeRef), values)
}

export type ExternalUserReferenceParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	user: Id;
	userGroup: Id;
}

export class ExternalUserReference extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ExternalUserReference> { return ExternalUserReferenceTypeRef };
	

	get _id(): IdTuple { return this._attrs[105] }
	get _permissions(): Id { return this._attrs[106] }
	get _format(): NumberString { return this._attrs[107] }
	get _ownerGroup(): null | Id { return this._attrs[997] }
	

	get user(): Id { return this._attrs[997] }
	get userGroup(): Id { return this._attrs[997] }
}
export const GroupRootTypeRef: TypeRef<GroupRoot> = new TypeRef("sys", 110)

export function createGroupRoot(values: StrippedEntity<GroupRoot>): GroupRoot {
    return Object.assign(create(typeModels[GroupRootTypeRef.typeId], GroupRootTypeRef), values)
}

export type GroupRootParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	externalGroupInfos: Id;
	externalUserReferences: Id;
	externalUserAreaGroupInfos: null | UserAreaGroups;
}

export class GroupRoot extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupRoot> { return GroupRootTypeRef };
	

	get _id(): Id { return this._attrs[112] }
	get _permissions(): Id { return this._attrs[113] }
	get _format(): NumberString { return this._attrs[114] }
	get _ownerGroup(): null | Id { return this._attrs[998] }
	

	get externalGroupInfos(): Id { return this._attrs[998] }
	get externalUserReferences(): Id { return this._attrs[998] }
	get externalUserAreaGroupInfos(): null | UserAreaGroups { return this._attrs[998] }
}
export const BucketPermissionTypeRef: TypeRef<BucketPermission> = new TypeRef("sys", 118)

export function createBucketPermission(values: StrippedEntity<BucketPermission>): BucketPermission {
    return Object.assign(create(typeModels[BucketPermissionTypeRef.typeId], BucketPermissionTypeRef), values)
}

export type BucketPermissionParams = {

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

export class BucketPermission extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BucketPermission> { return BucketPermissionTypeRef };
	

	get _id(): IdTuple { return this._attrs[120] }
	get _permissions(): Id { return this._attrs[121] }
	get _format(): NumberString { return this._attrs[122] }
	get type(): NumberString { return this._attrs[123] }
	get symEncBucketKey(): null | Uint8Array { return this._attrs[124] }
	get pubEncBucketKey(): null | Uint8Array { return this._attrs[125] }
	get pubKeyVersion(): null | NumberString { return this._attrs[126] }
	get _ownerGroup(): null | Id { return this._attrs[1000] }
	get ownerEncBucketKey(): null | Uint8Array { return this._attrs[1001] }
	get protocolVersion(): NumberString { return this._attrs[2157] }
	get ownerKeyVersion(): null | NumberString { return this._attrs[2248] }
	get symKeyVersion(): null | NumberString { return this._attrs[2249] }
	get senderKeyVersion(): null | NumberString { return this._attrs[2250] }
	

	get group(): Id { return this._attrs[2250] }
	set group(a: Id)  { this._attrs[128] = a } 
}
export const BucketTypeRef: TypeRef<Bucket> = new TypeRef("sys", 129)

export function createBucket(values: StrippedEntity<Bucket>): Bucket {
    return Object.assign(create(typeModels[BucketTypeRef.typeId], BucketTypeRef), values)
}

export type BucketParams = {

	_id: Id;

	bucketPermissions: Id;
}

export class Bucket extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Bucket> { return BucketTypeRef };
	

	get _id(): Id { return this._attrs[130] }
	

	get bucketPermissions(): Id { return this._attrs[130] }
}
export const PermissionTypeRef: TypeRef<Permission> = new TypeRef("sys", 132)

export function createPermission(values: StrippedEntity<Permission>): Permission {
    return Object.assign(create(typeModels[PermissionTypeRef.typeId], PermissionTypeRef), values)
}

export type PermissionParams = {

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

export class Permission extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Permission> { return PermissionTypeRef };
	

	get _id(): IdTuple { return this._attrs[134] }
	get _permissions(): Id { return this._attrs[135] }
	get _format(): NumberString { return this._attrs[136] }
	get type(): NumberString { return this._attrs[137] }
	get symEncSessionKey(): null | Uint8Array { return this._attrs[138] }
	get bucketEncSessionKey(): null | Uint8Array { return this._attrs[139] }
	get ops(): null | string { return this._attrs[140] }
	get _ownerGroup(): null | Id { return this._attrs[1002] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1003] }
	get listElementTypeId(): null | NumberString { return this._attrs[1523] }
	get listElementApplication(): null | string { return this._attrs[1524] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2242] }
	get symKeyVersion(): null | NumberString { return this._attrs[2251] }
	

	get group(): null | Id { return this._attrs[2251] }
	set group(a: Id)  { this._attrs[141] = a } 
	get bucket(): null | Bucket { return this._attrs[2251] }
	set bucket(a: Bucket)  { this._attrs[142] = a } 
}
export const AccountingInfoTypeRef: TypeRef<AccountingInfo> = new TypeRef("sys", 143)

export function createAccountingInfo(values: StrippedEntity<AccountingInfo>): AccountingInfo {
    return Object.assign(create(typeModels[AccountingInfoTypeRef.typeId], AccountingInfoTypeRef), values)
}

export type AccountingInfoParams = {

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

export class AccountingInfo extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AccountingInfo> { return AccountingInfoTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[145] }
	get _permissions(): Id { return this._attrs[146] }
	get _format(): NumberString { return this._attrs[147] }
	get lastInvoiceTimestamp(): null | Date { return this._attrs[592] }
	get lastInvoiceNbrOfSentSms(): NumberString { return this._attrs[593] }
	get invoiceName(): string { return this._attrs[762] }
	get invoiceAddress(): string { return this._attrs[763] }
	get invoiceCountry(): null | string { return this._attrs[764] }
	get secondCountryInfo(): NumberString { return this._attrs[765] }
	get invoiceVatIdNo(): string { return this._attrs[766] }
	get paymentMethod(): null | NumberString { return this._attrs[767] }
	get paymentMethodInfo(): null | string { return this._attrs[768] }
	get paymentInterval(): NumberString { return this._attrs[769] }
	get paymentProviderCustomerId(): null | string { return this._attrs[770] }
	get _ownerGroup(): null | Id { return this._attrs[1009] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1010] }
	get paymentAccountIdentifier(): null | string { return this._attrs[1060] }
	get paypalBillingAgreement(): null | string { return this._attrs[1312] }
	get _modified(): Date { return this._attrs[1499] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2223] }
	get lastUsedOffer(): null | string { return this._attrs[2690] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2712] }
	

	get invoiceInfo(): null | Id { return this._attrs[2712] }
	get appStoreSubscription(): null | IdTuple { return this._attrs[2712] }
	set appStoreSubscription(a: IdTuple)  { this._attrs[2424] = a } 
}
export const CustomerInfoTypeRef: TypeRef<CustomerInfo> = new TypeRef("sys", 148)

export function createCustomerInfo(values: StrippedEntity<CustomerInfo>): CustomerInfo {
    return Object.assign(create(typeModels[CustomerInfoTypeRef.typeId], CustomerInfoTypeRef), values)
}

export type CustomerInfoParams = {

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
}

export class CustomerInfo extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerInfo> { return CustomerInfoTypeRef };
	

	get _id(): IdTuple { return this._attrs[150] }
	get _permissions(): Id { return this._attrs[151] }
	get _format(): NumberString { return this._attrs[152] }
	get company(): null | string { return this._attrs[153] }
	get domain(): string { return this._attrs[154] }
	get creationTime(): Date { return this._attrs[155] }
	get testEndTime(): null | Date { return this._attrs[156] }
	get activationTime(): null | Date { return this._attrs[157] }
	get registrationMailAddress(): string { return this._attrs[597] }
	get deletionTime(): null | Date { return this._attrs[639] }
	get deletionReason(): null | string { return this._attrs[640] }
	get promotionStorageCapacity(): NumberString { return this._attrs[650] }
	get source(): string { return this._attrs[725] }
	get promotionEmailAliases(): NumberString { return this._attrs[976] }
	get usedSharedEmailAliases(): NumberString { return this._attrs[977] }
	get _ownerGroup(): null | Id { return this._attrs[1011] }
	get includedEmailAliases(): NumberString { return this._attrs[1067] }
	get includedStorageCapacity(): NumberString { return this._attrs[1068] }
	get erased(): boolean { return this._attrs[1381] }
	get perUserStorageCapacity(): NumberString { return this._attrs[2093] }
	get perUserAliasCount(): NumberString { return this._attrs[2094] }
	get plan(): NumberString { return this._attrs[2098] }
	get promotionId(): null | string { return this._attrs[2682] }
	get confirmedHuman(): boolean { return this._attrs[2691] }
	get adAttributionCampaignId(): null | string { return this._attrs[2732] }
	

	get customer(): Id { return this._attrs[2732] }
	get accountingInfo(): Id { return this._attrs[2732] }
	get domainInfos(): DomainInfo[] { return this._attrs[2732] }
	get bookings(): null | BookingsRef { return this._attrs[2732] }
	get takeoverCustomer(): null | Id { return this._attrs[2732] }
	set takeoverCustomer(a: Id)  { this._attrs[1076] = a } 
	get giftCards(): null | GiftCardsRef { return this._attrs[2732] }
	get terminationRequest(): null | IdTuple { return this._attrs[2732] }
	set terminationRequest(a: IdTuple)  { this._attrs[2014] = a } 
	get referredBy(): null | Id { return this._attrs[2732] }
	set referredBy(a: Id)  { this._attrs[2072] = a } 
	get customPlan(): null | PlanConfiguration { return this._attrs[2732] }
	get supportInfo(): null | Id { return this._attrs[2732] }
	get managedByPartner(): null | Id { return this._attrs[2732] }
	get partnerManagedCustomers(): null | Id { return this._attrs[2732] }
}
export const SentGroupInvitationTypeRef: TypeRef<SentGroupInvitation> = new TypeRef("sys", 195)

export function createSentGroupInvitation(values: StrippedEntity<SentGroupInvitation>): SentGroupInvitation {
    return Object.assign(create(typeModels[SentGroupInvitationTypeRef.typeId], SentGroupInvitationTypeRef), values)
}

export type SentGroupInvitationParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	inviteeMailAddress: string;
	capability: NumberString;

	sharedGroup: Id;
	receivedInvitation: null | IdTuple;
}

export class SentGroupInvitation extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SentGroupInvitation> { return SentGroupInvitationTypeRef };
	

	get _id(): IdTuple { return this._attrs[197] }
	get _permissions(): Id { return this._attrs[198] }
	get _format(): NumberString { return this._attrs[199] }
	get _ownerGroup(): null | Id { return this._attrs[1018] }
	get inviteeMailAddress(): string { return this._attrs[1600] }
	get capability(): NumberString { return this._attrs[1601] }
    set capability(v: NumberString) { this._attrs[1601] = v }
	

	get sharedGroup(): Id { return this._attrs[1601] }
	set sharedGroup(a: Id)  { this._attrs[203] = a } 
	get receivedInvitation(): null | IdTuple { return this._attrs[1601] }
	set receivedInvitation(a: IdTuple)  { this._attrs[1617] = a } 
}
export const MailAddressToGroupTypeRef: TypeRef<MailAddressToGroup> = new TypeRef("sys", 204)

export function createMailAddressToGroup(values: StrippedEntity<MailAddressToGroup>): MailAddressToGroup {
    return Object.assign(create(typeModels[MailAddressToGroupTypeRef.typeId], MailAddressToGroupTypeRef), values)
}

export type MailAddressToGroupParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	internalGroup: null | Id;
}

export class MailAddressToGroup extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddressToGroup> { return MailAddressToGroupTypeRef };
	

	get _id(): Id { return this._attrs[206] }
	get _permissions(): Id { return this._attrs[207] }
	get _format(): NumberString { return this._attrs[208] }
	get _ownerGroup(): null | Id { return this._attrs[1019] }
	

	get internalGroup(): null | Id { return this._attrs[1019] }
	set internalGroup(a: Id)  { this._attrs[209] = a } 
}
export const GroupMemberTypeRef: TypeRef<GroupMember> = new TypeRef("sys", 216)

export function createGroupMember(values: StrippedEntity<GroupMember>): GroupMember {
    return Object.assign(create(typeModels[GroupMemberTypeRef.typeId], GroupMemberTypeRef), values)
}

export type GroupMemberParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	capability: null | NumberString;

	userGroupInfo: IdTuple;
	group: Id;
	user: Id;
}

export class GroupMember extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupMember> { return GroupMemberTypeRef };
	

	get _id(): IdTuple { return this._attrs[218] }
	get _permissions(): Id { return this._attrs[219] }
	get _format(): NumberString { return this._attrs[220] }
	get _ownerGroup(): null | Id { return this._attrs[1021] }
	get capability(): null | NumberString { return this._attrs[1625] }
	

	get userGroupInfo(): IdTuple { return this._attrs[1625] }
	get group(): Id { return this._attrs[1625] }
	get user(): Id { return this._attrs[1625] }
}
export const RootInstanceTypeRef: TypeRef<RootInstance> = new TypeRef("sys", 231)

export function createRootInstance(values: StrippedEntity<RootInstance>): RootInstance {
    return Object.assign(create(typeModels[RootInstanceTypeRef.typeId], RootInstanceTypeRef), values)
}

export type RootInstanceParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	reference: Id;
	_ownerGroup: null | Id;
}

export class RootInstance extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RootInstance> { return RootInstanceTypeRef };
	

	get _id(): IdTuple { return this._attrs[233] }
	get _permissions(): Id { return this._attrs[234] }
	get _format(): NumberString { return this._attrs[235] }
	get reference(): Id { return this._attrs[236] }
	get _ownerGroup(): null | Id { return this._attrs[1022] }
	
}
export const VersionInfoTypeRef: TypeRef<VersionInfo> = new TypeRef("sys", 237)

export function createVersionInfo(values: StrippedEntity<VersionInfo>): VersionInfo {
    return Object.assign(create(typeModels[VersionInfoTypeRef.typeId], VersionInfoTypeRef), values)
}

export type VersionInfoParams = {

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

export class VersionInfo extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<VersionInfo> { return VersionInfoTypeRef };
	

	get _id(): IdTuple { return this._attrs[239] }
	get _permissions(): Id { return this._attrs[240] }
	get _format(): NumberString { return this._attrs[241] }
	get app(): string { return this._attrs[242] }
	get type(): NumberString { return this._attrs[243] }
	get referenceList(): null | Id { return this._attrs[244] }
	get timestamp(): Date { return this._attrs[245] }
	get operation(): string { return this._attrs[246] }
	get versionData(): null | Uint8Array { return this._attrs[247] }
	get _ownerGroup(): null | Id { return this._attrs[1023] }
	

	get author(): Id { return this._attrs[1023] }
	set author(a: Id)  { this._attrs[248] = a } 
	get authorGroupInfo(): IdTuple { return this._attrs[1023] }
}
export const SystemKeysReturnTypeRef: TypeRef<SystemKeysReturn> = new TypeRef("sys", 301)

export function createSystemKeysReturn(values: StrippedEntity<SystemKeysReturn>): SystemKeysReturn {
    return Object.assign(create(typeModels[SystemKeysReturnTypeRef.typeId], SystemKeysReturnTypeRef), values)
}

export type SystemKeysReturnParams = {

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

export class SystemKeysReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SystemKeysReturn> { return SystemKeysReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[302] }
	get systemAdminPubRsaKey(): null | Uint8Array { return this._attrs[303] }
	get systemAdminPubKeyVersion(): NumberString { return this._attrs[304] }
	get freeGroupKey(): Uint8Array { return this._attrs[305] }
	get premiumGroupKey(): Uint8Array { return this._attrs[306] }
	get systemAdminPubEccKey(): null | Uint8Array { return this._attrs[2155] }
	get systemAdminPubKyberKey(): null | Uint8Array { return this._attrs[2156] }
	get freeGroupKeyVersion(): NumberString { return this._attrs[2278] }
	get premiumGroupKeyVersion(): NumberString { return this._attrs[2279] }
    set premiumGroupKeyVersion(v: NumberString) { this._attrs[2279] = v }
	

	get freeGroup(): null | Id { return this._attrs[2279] }
	set freeGroup(a: Id)  { this._attrs[880] = a } 
	get premiumGroup(): null | Id { return this._attrs[2279] }
	set premiumGroup(a: Id)  { this._attrs[881] = a } 
}
export const RegistrationServiceDataTypeRef: TypeRef<RegistrationServiceData> = new TypeRef("sys", 316)

export function createRegistrationServiceData(values: StrippedEntity<RegistrationServiceData>): RegistrationServiceData {
    return Object.assign(create(typeModels[RegistrationServiceDataTypeRef.typeId], RegistrationServiceDataTypeRef), values)
}

export type RegistrationServiceDataParams = {

	_format: NumberString;
	state: NumberString;
	source: null | string;
}

export class RegistrationServiceData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RegistrationServiceData> { return RegistrationServiceDataTypeRef };
	

	get _format(): NumberString { return this._attrs[317] }
	get state(): NumberString { return this._attrs[325] }
	get source(): null | string { return this._attrs[874] }
    set source(v: null | string) { this._attrs[874] = v }
	
}
export const RegistrationReturnTypeRef: TypeRef<RegistrationReturn> = new TypeRef("sys", 326)

export function createRegistrationReturn(values: StrippedEntity<RegistrationReturn>): RegistrationReturn {
    return Object.assign(create(typeModels[RegistrationReturnTypeRef.typeId], RegistrationReturnTypeRef), values)
}

export type RegistrationReturnParams = {

	_format: NumberString;
	authToken: string;
}

export class RegistrationReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RegistrationReturn> { return RegistrationReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[327] }
	get authToken(): string { return this._attrs[328] }
    set authToken(v: string) { this._attrs[328] = v }
	
}
export const SendRegistrationCodeDataTypeRef: TypeRef<SendRegistrationCodeData> = new TypeRef("sys", 341)

export function createSendRegistrationCodeData(values: StrippedEntity<SendRegistrationCodeData>): SendRegistrationCodeData {
    return Object.assign(create(typeModels[SendRegistrationCodeDataTypeRef.typeId], SendRegistrationCodeDataTypeRef), values)
}

export type SendRegistrationCodeDataParams = {

	_format: NumberString;
	authToken: string;
	language: string;
	accountType: NumberString;
	mobilePhoneNumber: string;
}

export class SendRegistrationCodeData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SendRegistrationCodeData> { return SendRegistrationCodeDataTypeRef };
	

	get _format(): NumberString { return this._attrs[342] }
	get authToken(): string { return this._attrs[343] }
	get language(): string { return this._attrs[344] }
	get accountType(): NumberString { return this._attrs[345] }
	get mobilePhoneNumber(): string { return this._attrs[346] }
    set mobilePhoneNumber(v: string) { this._attrs[346] = v }
	
}
export const SendRegistrationCodeReturnTypeRef: TypeRef<SendRegistrationCodeReturn> = new TypeRef("sys", 347)

export function createSendRegistrationCodeReturn(values: StrippedEntity<SendRegistrationCodeReturn>): SendRegistrationCodeReturn {
    return Object.assign(create(typeModels[SendRegistrationCodeReturnTypeRef.typeId], SendRegistrationCodeReturnTypeRef), values)
}

export type SendRegistrationCodeReturnParams = {

	_format: NumberString;
	authToken: string;
}

export class SendRegistrationCodeReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SendRegistrationCodeReturn> { return SendRegistrationCodeReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[348] }
	get authToken(): string { return this._attrs[349] }
    set authToken(v: string) { this._attrs[349] = v }
	
}
export const VerifyRegistrationCodeDataTypeRef: TypeRef<VerifyRegistrationCodeData> = new TypeRef("sys", 351)

export function createVerifyRegistrationCodeData(values: StrippedEntity<VerifyRegistrationCodeData>): VerifyRegistrationCodeData {
    return Object.assign(create(typeModels[VerifyRegistrationCodeDataTypeRef.typeId], VerifyRegistrationCodeDataTypeRef), values)
}

export type VerifyRegistrationCodeDataParams = {

	_format: NumberString;
	authToken: string;
	code: string;
}

export class VerifyRegistrationCodeData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<VerifyRegistrationCodeData> { return VerifyRegistrationCodeDataTypeRef };
	

	get _format(): NumberString { return this._attrs[352] }
	get authToken(): string { return this._attrs[353] }
	get code(): string { return this._attrs[354] }
    set code(v: string) { this._attrs[354] = v }
	
}
export const UserDataDeleteTypeRef: TypeRef<UserDataDelete> = new TypeRef("sys", 404)

export function createUserDataDelete(values: StrippedEntity<UserDataDelete>): UserDataDelete {
    return Object.assign(create(typeModels[UserDataDeleteTypeRef.typeId], UserDataDeleteTypeRef), values)
}

export type UserDataDeleteParams = {

	_format: NumberString;
	restore: boolean;
	date: null | Date;

	user: Id;
}

export class UserDataDelete extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserDataDelete> { return UserDataDeleteTypeRef };
	

	get _format(): NumberString { return this._attrs[405] }
	get restore(): boolean { return this._attrs[406] }
	get date(): null | Date { return this._attrs[879] }
    set date(v: null | Date) { this._attrs[879] = v }
	

	get user(): Id { return this._attrs[879] }
	set user(a: Id)  { this._attrs[407] = a } 
}
export const PublicKeyGetInTypeRef: TypeRef<PublicKeyGetIn> = new TypeRef("sys", 409)

export function createPublicKeyGetIn(values: StrippedEntity<PublicKeyGetIn>): PublicKeyGetIn {
    return Object.assign(create(typeModels[PublicKeyGetInTypeRef.typeId], PublicKeyGetInTypeRef), values)
}

export type PublicKeyGetInParams = {

	_format: NumberString;
	identifier: string;
	version: null | NumberString;
	identifierType: NumberString;
}

export class PublicKeyGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PublicKeyGetIn> { return PublicKeyGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[410] }
	get identifier(): string { return this._attrs[411] }
	get version(): null | NumberString { return this._attrs[2244] }
	get identifierType(): NumberString { return this._attrs[2468] }
    set identifierType(v: NumberString) { this._attrs[2468] = v }
	
}
export const PublicKeyGetOutTypeRef: TypeRef<PublicKeyGetOut> = new TypeRef("sys", 412)

export function createPublicKeyGetOut(values: StrippedEntity<PublicKeyGetOut>): PublicKeyGetOut {
    return Object.assign(create(typeModels[PublicKeyGetOutTypeRef.typeId], PublicKeyGetOutTypeRef), values)
}

export type PublicKeyGetOutParams = {

	_format: NumberString;
	pubRsaKey: null | Uint8Array;
	pubKeyVersion: NumberString;
	pubEccKey: null | Uint8Array;
	pubKyberKey: null | Uint8Array;

	signature: null | PublicKeySignature;
}

export class PublicKeyGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PublicKeyGetOut> { return PublicKeyGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[413] }
	get pubRsaKey(): null | Uint8Array { return this._attrs[414] }
	get pubKeyVersion(): NumberString { return this._attrs[415] }
	get pubEccKey(): null | Uint8Array { return this._attrs[2148] }
	get pubKyberKey(): null | Uint8Array { return this._attrs[2149] }
	

	get signature(): null | PublicKeySignature { return this._attrs[2149] }
	set signature(a: PublicKeySignature)  { this._attrs[2611] = a } 
}
export const SaltDataTypeRef: TypeRef<SaltData> = new TypeRef("sys", 417)

export function createSaltData(values: StrippedEntity<SaltData>): SaltData {
    return Object.assign(create(typeModels[SaltDataTypeRef.typeId], SaltDataTypeRef), values)
}

export type SaltDataParams = {

	_format: NumberString;
	mailAddress: string;
}

export class SaltData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SaltData> { return SaltDataTypeRef };
	

	get _format(): NumberString { return this._attrs[418] }
	get mailAddress(): string { return this._attrs[419] }
    set mailAddress(v: string) { this._attrs[419] = v }
	
}
export const SaltReturnTypeRef: TypeRef<SaltReturn> = new TypeRef("sys", 420)

export function createSaltReturn(values: StrippedEntity<SaltReturn>): SaltReturn {
    return Object.assign(create(typeModels[SaltReturnTypeRef.typeId], SaltReturnTypeRef), values)
}

export type SaltReturnParams = {

	_format: NumberString;
	salt: Uint8Array;
	kdfVersion: NumberString;
}

export class SaltReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SaltReturn> { return SaltReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[421] }
	get salt(): Uint8Array { return this._attrs[422] }
	get kdfVersion(): NumberString { return this._attrs[2133] }
    set kdfVersion(v: NumberString) { this._attrs[2133] = v }
	
}
export const AutoLoginDataGetTypeRef: TypeRef<AutoLoginDataGet> = new TypeRef("sys", 431)

export function createAutoLoginDataGet(values: StrippedEntity<AutoLoginDataGet>): AutoLoginDataGet {
    return Object.assign(create(typeModels[AutoLoginDataGetTypeRef.typeId], AutoLoginDataGetTypeRef), values)
}

export type AutoLoginDataGetParams = {

	_format: NumberString;
	deviceToken: string;

	userId: Id;
}

export class AutoLoginDataGet extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AutoLoginDataGet> { return AutoLoginDataGetTypeRef };
	

	get _format(): NumberString { return this._attrs[432] }
	get deviceToken(): string { return this._attrs[434] }
    set deviceToken(v: string) { this._attrs[434] = v }
	

	get userId(): Id { return this._attrs[434] }
	set userId(a: Id)  { this._attrs[433] = a } 
}
export const AutoLoginDataDeleteTypeRef: TypeRef<AutoLoginDataDelete> = new TypeRef("sys", 435)

export function createAutoLoginDataDelete(values: StrippedEntity<AutoLoginDataDelete>): AutoLoginDataDelete {
    return Object.assign(create(typeModels[AutoLoginDataDeleteTypeRef.typeId], AutoLoginDataDeleteTypeRef), values)
}

export type AutoLoginDataDeleteParams = {

	_format: NumberString;
	deviceToken: string;
}

export class AutoLoginDataDelete extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AutoLoginDataDelete> { return AutoLoginDataDeleteTypeRef };
	

	get _format(): NumberString { return this._attrs[436] }
	get deviceToken(): string { return this._attrs[437] }
    set deviceToken(v: string) { this._attrs[437] = v }
	
}
export const AutoLoginDataReturnTypeRef: TypeRef<AutoLoginDataReturn> = new TypeRef("sys", 438)

export function createAutoLoginDataReturn(values: StrippedEntity<AutoLoginDataReturn>): AutoLoginDataReturn {
    return Object.assign(create(typeModels[AutoLoginDataReturnTypeRef.typeId], AutoLoginDataReturnTypeRef), values)
}

export type AutoLoginDataReturnParams = {

	_format: NumberString;
	deviceKey: Uint8Array;
}

export class AutoLoginDataReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AutoLoginDataReturn> { return AutoLoginDataReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[439] }
	get deviceKey(): Uint8Array { return this._attrs[440] }
    set deviceKey(v: Uint8Array) { this._attrs[440] = v }
	
}
export const AutoLoginPostReturnTypeRef: TypeRef<AutoLoginPostReturn> = new TypeRef("sys", 441)

export function createAutoLoginPostReturn(values: StrippedEntity<AutoLoginPostReturn>): AutoLoginPostReturn {
    return Object.assign(create(typeModels[AutoLoginPostReturnTypeRef.typeId], AutoLoginPostReturnTypeRef), values)
}

export type AutoLoginPostReturnParams = {

	_format: NumberString;
	deviceToken: string;
}

export class AutoLoginPostReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AutoLoginPostReturn> { return AutoLoginPostReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[442] }
	get deviceToken(): string { return this._attrs[443] }
    set deviceToken(v: string) { this._attrs[443] = v }
	
}
export const UpdatePermissionKeyDataTypeRef: TypeRef<UpdatePermissionKeyData> = new TypeRef("sys", 445)

export function createUpdatePermissionKeyData(values: StrippedEntity<UpdatePermissionKeyData>): UpdatePermissionKeyData {
    return Object.assign(create(typeModels[UpdatePermissionKeyDataTypeRef.typeId], UpdatePermissionKeyDataTypeRef), values)
}

export type UpdatePermissionKeyDataParams = {

	_format: NumberString;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	permission: IdTuple;
	bucketPermission: IdTuple;
}

export class UpdatePermissionKeyData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UpdatePermissionKeyData> { return UpdatePermissionKeyDataTypeRef };
	

	get _format(): NumberString { return this._attrs[446] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[1031] }
	get ownerKeyVersion(): NumberString { return this._attrs[2245] }
    set ownerKeyVersion(v: NumberString) { this._attrs[2245] = v }
	

	get permission(): IdTuple { return this._attrs[2245] }
	set permission(a: IdTuple)  { this._attrs[450] = a } 
	get bucketPermission(): IdTuple { return this._attrs[2245] }
	set bucketPermission(a: IdTuple)  { this._attrs[451] = a } 
}
export const EntityUpdateTypeRef: TypeRef<EntityUpdate> = new TypeRef("sys", 462)

export function createEntityUpdate(values: StrippedEntity<EntityUpdate>): EntityUpdate {
    return Object.assign(create(typeModels[EntityUpdateTypeRef.typeId], EntityUpdateTypeRef), values)
}

export type EntityUpdateParams = {

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

export class EntityUpdate extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<EntityUpdate> { return EntityUpdateTypeRef };
	

	get _id(): Id { return this._attrs[463] }
	get application(): string { return this._attrs[464] }
	get instanceListId(): string { return this._attrs[466] }
	get instanceId(): string { return this._attrs[467] }
	get operation(): NumberString { return this._attrs[624] }
	get typeId(): NumberString { return this._attrs[2556] }
	get instance(): null | string { return this._attrs[2617] }
	get blobInstance(): null | string { return this._attrs[2701] }
    set blobInstance(v: null | string) { this._attrs[2701] = v }
	

	get patch(): null | PatchList { return this._attrs[2701] }
	set patch(a: PatchList)  { this._attrs[2618] = a } 
}
export const VersionTypeRef: TypeRef<Version> = new TypeRef("sys", 480)

export function createVersion(values: StrippedEntity<Version>): Version {
    return Object.assign(create(typeModels[VersionTypeRef.typeId], VersionTypeRef), values)
}

export type VersionParams = {

	_id: Id;
	version: Id;
	timestamp: Date;
	operation: string;

	author: Id;
	authorGroupInfo: IdTuple;
}

export class Version extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Version> { return VersionTypeRef };
	

	get _id(): Id { return this._attrs[481] }
	get version(): Id { return this._attrs[482] }
	get timestamp(): Date { return this._attrs[483] }
	get operation(): string { return this._attrs[484] }
    set operation(v: string) { this._attrs[484] = v }
	

	get author(): Id { return this._attrs[484] }
	set author(a: Id)  { this._attrs[485] = a } 
	get authorGroupInfo(): IdTuple { return this._attrs[484] }
	set authorGroupInfo(a: IdTuple)  { this._attrs[486] = a } 
}
export const VersionDataTypeRef: TypeRef<VersionData> = new TypeRef("sys", 487)

export function createVersionData(values: StrippedEntity<VersionData>): VersionData {
    return Object.assign(create(typeModels[VersionDataTypeRef.typeId], VersionDataTypeRef), values)
}

export type VersionDataParams = {

	_format: NumberString;
	application: string;
	typeId: NumberString;
	id: Id;
	listId: null | Id;
}

export class VersionData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<VersionData> { return VersionDataTypeRef };
	

	get _format(): NumberString { return this._attrs[488] }
	get application(): string { return this._attrs[489] }
	get typeId(): NumberString { return this._attrs[490] }
	get id(): Id { return this._attrs[491] }
	get listId(): null | Id { return this._attrs[492] }
    set listId(v: null | Id) { this._attrs[492] = v }
	
}
export const VersionReturnTypeRef: TypeRef<VersionReturn> = new TypeRef("sys", 493)

export function createVersionReturn(values: StrippedEntity<VersionReturn>): VersionReturn {
    return Object.assign(create(typeModels[VersionReturnTypeRef.typeId], VersionReturnTypeRef), values)
}

export type VersionReturnParams = {

	_format: NumberString;

	versions: Version[];
}

export class VersionReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<VersionReturn> { return VersionReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[494] }
    set _format(v: NumberString) { this._attrs[494] = v }
	

	get versions(): Version[] { return this._attrs[494] }
	set versions(a: Version[])  { this._attrs[495] = a } 
}
export const MembershipAddDataTypeRef: TypeRef<MembershipAddData> = new TypeRef("sys", 505)

export function createMembershipAddData(values: StrippedEntity<MembershipAddData>): MembershipAddData {
    return Object.assign(create(typeModels[MembershipAddDataTypeRef.typeId], MembershipAddDataTypeRef), values)
}

export type MembershipAddDataParams = {

	_format: NumberString;
	symEncGKey: Uint8Array;
	symKeyVersion: NumberString;
	groupKeyVersion: NumberString;

	user: Id;
	group: Id;
}

export class MembershipAddData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MembershipAddData> { return MembershipAddDataTypeRef };
	

	get _format(): NumberString { return this._attrs[506] }
	get symEncGKey(): Uint8Array { return this._attrs[507] }
	get symKeyVersion(): NumberString { return this._attrs[2276] }
	get groupKeyVersion(): NumberString { return this._attrs[2277] }
    set groupKeyVersion(v: NumberString) { this._attrs[2277] = v }
	

	get user(): Id { return this._attrs[2277] }
	set user(a: Id)  { this._attrs[508] = a } 
	get group(): Id { return this._attrs[2277] }
	set group(a: Id)  { this._attrs[509] = a } 
}
export const ChangePasswordPostInTypeRef: TypeRef<ChangePasswordPostIn> = new TypeRef("sys", 534)

export function createChangePasswordPostIn(values: StrippedEntity<ChangePasswordPostIn>): ChangePasswordPostIn {
    return Object.assign(create(typeModels[ChangePasswordPostInTypeRef.typeId], ChangePasswordPostInTypeRef), values)
}

export type ChangePasswordPostInParams = {

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

export class ChangePasswordPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ChangePasswordPostIn> { return ChangePasswordPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[535] }
	get verifier(): Uint8Array { return this._attrs[536] }
	get salt(): Uint8Array { return this._attrs[537] }
	get pwEncUserGroupKey(): Uint8Array { return this._attrs[538] }
	get code(): null | string { return this._attrs[539] }
	get oldVerifier(): null | Uint8Array { return this._attrs[1240] }
	get recoverCodeVerifier(): null | Uint8Array { return this._attrs[1418] }
	get kdfVersion(): NumberString { return this._attrs[2134] }
	get userGroupKeyVersion(): NumberString { return this._attrs[2408] }
    set userGroupKeyVersion(v: NumberString) { this._attrs[2408] = v }
	
}
export const SecondFactorAuthDataTypeRef: TypeRef<SecondFactorAuthData> = new TypeRef("sys", 541)

export function createSecondFactorAuthData(values: StrippedEntity<SecondFactorAuthData>): SecondFactorAuthData {
    return Object.assign(create(typeModels[SecondFactorAuthDataTypeRef.typeId], SecondFactorAuthDataTypeRef), values)
}

export type SecondFactorAuthDataParams = {

	_format: NumberString;
	type: null | NumberString;
	otpCode: null | NumberString;

	u2f: null | U2fResponseData;
	session: null | IdTuple;
	webauthn: null | WebauthnResponseData;
}

export class SecondFactorAuthData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SecondFactorAuthData> { return SecondFactorAuthDataTypeRef };
	

	get _format(): NumberString { return this._attrs[542] }
	get type(): null | NumberString { return this._attrs[1230] }
	get otpCode(): null | NumberString { return this._attrs[1243] }
	

	get u2f(): null | U2fResponseData { return this._attrs[1243] }
	get session(): null | IdTuple { return this._attrs[1243] }
	get webauthn(): null | WebauthnResponseData { return this._attrs[1243] }
}
export const SecondFactorAuthAllowedReturnTypeRef: TypeRef<SecondFactorAuthAllowedReturn> = new TypeRef("sys", 546)

export function createSecondFactorAuthAllowedReturn(values: StrippedEntity<SecondFactorAuthAllowedReturn>): SecondFactorAuthAllowedReturn {
    return Object.assign(create(typeModels[SecondFactorAuthAllowedReturnTypeRef.typeId], SecondFactorAuthAllowedReturnTypeRef), values)
}

export type SecondFactorAuthAllowedReturnParams = {

	_format: NumberString;
	allowed: boolean;
}

export class SecondFactorAuthAllowedReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SecondFactorAuthAllowedReturn> { return SecondFactorAuthAllowedReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[547] }
	get allowed(): boolean { return this._attrs[548] }
    set allowed(v: boolean) { this._attrs[548] = v }
	
}
export const ResetPasswordPostInTypeRef: TypeRef<ResetPasswordPostIn> = new TypeRef("sys", 584)

export function createResetPasswordPostIn(values: StrippedEntity<ResetPasswordPostIn>): ResetPasswordPostIn {
    return Object.assign(create(typeModels[ResetPasswordPostInTypeRef.typeId], ResetPasswordPostInTypeRef), values)
}

export type ResetPasswordPostInParams = {

	_format: NumberString;
	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;

	user: Id;
}

export class ResetPasswordPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ResetPasswordPostIn> { return ResetPasswordPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[585] }
	get verifier(): Uint8Array { return this._attrs[586] }
	get salt(): Uint8Array { return this._attrs[587] }
	get pwEncUserGroupKey(): Uint8Array { return this._attrs[588] }
	get kdfVersion(): NumberString { return this._attrs[2135] }
	get userGroupKeyVersion(): NumberString { return this._attrs[2409] }
    set userGroupKeyVersion(v: NumberString) { this._attrs[2409] = v }
	

	get user(): Id { return this._attrs[2409] }
	set user(a: Id)  { this._attrs[589] = a } 
}
export const DomainMailAddressAvailabilityDataTypeRef: TypeRef<DomainMailAddressAvailabilityData> = new TypeRef("sys", 599)

export function createDomainMailAddressAvailabilityData(values: StrippedEntity<DomainMailAddressAvailabilityData>): DomainMailAddressAvailabilityData {
    return Object.assign(create(typeModels[DomainMailAddressAvailabilityDataTypeRef.typeId], DomainMailAddressAvailabilityDataTypeRef), values)
}

export type DomainMailAddressAvailabilityDataParams = {

	_format: NumberString;
	mailAddress: string;
}

export class DomainMailAddressAvailabilityData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DomainMailAddressAvailabilityData> { return DomainMailAddressAvailabilityDataTypeRef };
	

	get _format(): NumberString { return this._attrs[600] }
	get mailAddress(): string { return this._attrs[601] }
    set mailAddress(v: string) { this._attrs[601] = v }
	
}
export const DomainMailAddressAvailabilityReturnTypeRef: TypeRef<DomainMailAddressAvailabilityReturn> = new TypeRef("sys", 602)

export function createDomainMailAddressAvailabilityReturn(values: StrippedEntity<DomainMailAddressAvailabilityReturn>): DomainMailAddressAvailabilityReturn {
    return Object.assign(create(typeModels[DomainMailAddressAvailabilityReturnTypeRef.typeId], DomainMailAddressAvailabilityReturnTypeRef), values)
}

export type DomainMailAddressAvailabilityReturnParams = {

	_format: NumberString;
	available: boolean;
}

export class DomainMailAddressAvailabilityReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DomainMailAddressAvailabilityReturn> { return DomainMailAddressAvailabilityReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[603] }
	get available(): boolean { return this._attrs[604] }
    set available(v: boolean) { this._attrs[604] = v }
	
}
export const PushIdentifierTypeRef: TypeRef<PushIdentifier> = new TypeRef("sys", 625)

export function createPushIdentifier(values: StrippedEntity<PushIdentifier>): PushIdentifier {
    return Object.assign(create(typeModels[PushIdentifierTypeRef.typeId], PushIdentifierTypeRef), values)
}

export type PushIdentifierParams = {

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

export class PushIdentifier extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PushIdentifier> { return PushIdentifierTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[627] }
	get _permissions(): Id { return this._attrs[628] }
	get _format(): NumberString { return this._attrs[629] }
	get _owner(): Id { return this._attrs[630] }
	get _area(): NumberString { return this._attrs[631] }
	get pushServiceType(): NumberString { return this._attrs[632] }
	get identifier(): string { return this._attrs[633] }
	get language(): string { return this._attrs[634] }
	get _ownerGroup(): null | Id { return this._attrs[1029] }
	get lastNotificationDate(): null | Date { return this._attrs[1248] }
	get disabled(): boolean { return this._attrs[1476] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1497] }
	get displayName(): string { return this._attrs[1498] }
	get lastUsageTime(): Date { return this._attrs[1704] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2241] }
	get app(): NumberString { return this._attrs[2426] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2709] }
	
}
export const PushIdentifierListTypeRef: TypeRef<PushIdentifierList> = new TypeRef("sys", 635)

export function createPushIdentifierList(values: StrippedEntity<PushIdentifierList>): PushIdentifierList {
    return Object.assign(create(typeModels[PushIdentifierListTypeRef.typeId], PushIdentifierListTypeRef), values)
}

export type PushIdentifierListParams = {

	_id: Id;

	list: Id;
}

export class PushIdentifierList extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PushIdentifierList> { return PushIdentifierListTypeRef };
	

	get _id(): Id { return this._attrs[636] }
	

	get list(): Id { return this._attrs[636] }
}
export const DeleteCustomerDataTypeRef: TypeRef<DeleteCustomerData> = new TypeRef("sys", 641)

export function createDeleteCustomerData(values: StrippedEntity<DeleteCustomerData>): DeleteCustomerData {
    return Object.assign(create(typeModels[DeleteCustomerDataTypeRef.typeId], DeleteCustomerDataTypeRef), values)
}

export type DeleteCustomerDataParams = {

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

export class DeleteCustomerData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DeleteCustomerData> { return DeleteCustomerDataTypeRef };
	

	get _format(): NumberString { return this._attrs[642] }
	get undelete(): boolean { return this._attrs[643] }
	get formattedReason(): null | string { return this._attrs[644] }
	get takeoverMailAddress(): null | string { return this._attrs[1077] }
	get authVerifier(): null | Uint8Array { return this._attrs[1325] }
	get reason(): null | NumberString { return this._attrs[2659] }
    set reason(v: null | NumberString) { this._attrs[2659] = v }
	

	get customer(): Id { return this._attrs[2659] }
	set customer(a: Id)  { this._attrs[645] = a } 
	get surveyData(): null | SurveyData { return this._attrs[2659] }
	set surveyData(a: SurveyData)  { this._attrs[2312] = a } 
	get abuseDeactivationInfos(): AbuseInfo[] { return this._attrs[2659] }
	set abuseDeactivationInfos(a: AbuseInfo[])  { this._attrs[2660] = a } 
}
export const CustomerPropertiesTypeRef: TypeRef<CustomerProperties> = new TypeRef("sys", 656)

export function createCustomerProperties(values: StrippedEntity<CustomerProperties>): CustomerProperties {
    return Object.assign(create(typeModels[CustomerPropertiesTypeRef.typeId], CustomerPropertiesTypeRef), values)
}

export type CustomerPropertiesParams = {

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

export class CustomerProperties extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerProperties> { return CustomerPropertiesTypeRef };
	

	get _id(): Id { return this._attrs[658] }
	get _permissions(): Id { return this._attrs[659] }
	get _format(): NumberString { return this._attrs[660] }
	get externalUserWelcomeMessage(): string { return this._attrs[661] }
	get lastUpgradeReminder(): null | Date { return this._attrs[975] }
	get _ownerGroup(): null | Id { return this._attrs[985] }
	get usageDataOptedOut(): boolean { return this._attrs[2025] }
	get requireTwoFactor(): boolean { return this._attrs[2661] }
    set requireTwoFactor(v: boolean) { this._attrs[2661] = v }
	

	get smallLogo(): null | File { return this._attrs[2661] }
	set smallLogo(a: File)  { this._attrs[922] = a } 
	get bigLogo(): null | File { return this._attrs[2661] }
	set bigLogo(a: File)  { this._attrs[923] = a } 
	get notificationMailTemplates(): NotificationMailTemplate[] { return this._attrs[2661] }
	set notificationMailTemplates(a: NotificationMailTemplate[])  { this._attrs[1522] = a } 
}
export const ExternalPropertiesReturnTypeRef: TypeRef<ExternalPropertiesReturn> = new TypeRef("sys", 663)

export function createExternalPropertiesReturn(values: StrippedEntity<ExternalPropertiesReturn>): ExternalPropertiesReturn {
    return Object.assign(create(typeModels[ExternalPropertiesReturnTypeRef.typeId], ExternalPropertiesReturnTypeRef), values)
}

export type ExternalPropertiesReturnParams = {

	_format: NumberString;
	message: string;
	accountType: NumberString;

	smallLogo: null | File;
	bigLogo: null | File;
}

export class ExternalPropertiesReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ExternalPropertiesReturn> { return ExternalPropertiesReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[664] }
	get message(): string { return this._attrs[665] }
	get accountType(): NumberString { return this._attrs[666] }
    set accountType(v: NumberString) { this._attrs[666] = v }
	

	get smallLogo(): null | File { return this._attrs[666] }
	set smallLogo(a: File)  { this._attrs[924] = a } 
	get bigLogo(): null | File { return this._attrs[666] }
	set bigLogo(a: File)  { this._attrs[925] = a } 
}
export const RegistrationCaptchaServiceDataTypeRef: TypeRef<RegistrationCaptchaServiceData> = new TypeRef("sys", 674)

export function createRegistrationCaptchaServiceData(values: StrippedEntity<RegistrationCaptchaServiceData>): RegistrationCaptchaServiceData {
    return Object.assign(create(typeModels[RegistrationCaptchaServiceDataTypeRef.typeId], RegistrationCaptchaServiceDataTypeRef), values)
}

export type RegistrationCaptchaServiceDataParams = {

	_format: NumberString;
	token: string;
	visualChallengeResponse: null | string;
	audioChallengeResponse: null | string;
}

export class RegistrationCaptchaServiceData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RegistrationCaptchaServiceData> { return RegistrationCaptchaServiceDataTypeRef };
	

	get _format(): NumberString { return this._attrs[675] }
	get token(): string { return this._attrs[676] }
	get visualChallengeResponse(): null | string { return this._attrs[677] }
	get audioChallengeResponse(): null | string { return this._attrs[2627] }
    set audioChallengeResponse(v: null | string) { this._attrs[2627] = v }
	
}
export const RegistrationCaptchaServiceReturnTypeRef: TypeRef<RegistrationCaptchaServiceReturn> = new TypeRef("sys", 678)

export function createRegistrationCaptchaServiceReturn(values: StrippedEntity<RegistrationCaptchaServiceReturn>): RegistrationCaptchaServiceReturn {
    return Object.assign(create(typeModels[RegistrationCaptchaServiceReturnTypeRef.typeId], RegistrationCaptchaServiceReturnTypeRef), values)
}

export type RegistrationCaptchaServiceReturnParams = {

	_format: NumberString;
	token: string;
	challenge: null | Uint8Array;

	visualChallenge: null | CaptchaChallenge;
	audioChallenge: null | CaptchaChallenge;
}

export class RegistrationCaptchaServiceReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RegistrationCaptchaServiceReturn> { return RegistrationCaptchaServiceReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[679] }
	get token(): string { return this._attrs[680] }
	get challenge(): null | Uint8Array { return this._attrs[681] }
    set challenge(v: null | Uint8Array) { this._attrs[681] = v }
	

	get visualChallenge(): null | CaptchaChallenge { return this._attrs[681] }
	set visualChallenge(a: CaptchaChallenge)  { this._attrs[2625] = a } 
	get audioChallenge(): null | CaptchaChallenge { return this._attrs[681] }
	set audioChallenge(a: CaptchaChallenge)  { this._attrs[2626] = a } 
}
export const MailAddressAliasTypeRef: TypeRef<MailAddressAlias> = new TypeRef("sys", 684)

export function createMailAddressAlias(values: StrippedEntity<MailAddressAlias>): MailAddressAlias {
    return Object.assign(create(typeModels[MailAddressAliasTypeRef.typeId], MailAddressAliasTypeRef), values)
}

export type MailAddressAliasParams = {

	_id: Id;
	mailAddress: string;
	enabled: boolean;
}

export class MailAddressAlias extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddressAlias> { return MailAddressAliasTypeRef };
	

	get _id(): Id { return this._attrs[685] }
	get mailAddress(): string { return this._attrs[686] }
	get enabled(): boolean { return this._attrs[784] }
	
}
export const MailAddressAliasServiceDataTypeRef: TypeRef<MailAddressAliasServiceData> = new TypeRef("sys", 688)

export function createMailAddressAliasServiceData(values: StrippedEntity<MailAddressAliasServiceData>): MailAddressAliasServiceData {
    return Object.assign(create(typeModels[MailAddressAliasServiceDataTypeRef.typeId], MailAddressAliasServiceDataTypeRef), values)
}

export type MailAddressAliasServiceDataParams = {

	_format: NumberString;
	mailAddress: string;

	group: Id;
}

export class MailAddressAliasServiceData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddressAliasServiceData> { return MailAddressAliasServiceDataTypeRef };
	

	get _format(): NumberString { return this._attrs[689] }
	get mailAddress(): string { return this._attrs[690] }
    set mailAddress(v: string) { this._attrs[690] = v }
	

	get group(): Id { return this._attrs[690] }
	set group(a: Id)  { this._attrs[691] = a } 
}
export const MailAddressAliasServiceReturnTypeRef: TypeRef<MailAddressAliasServiceReturn> = new TypeRef("sys", 692)

export function createMailAddressAliasServiceReturn(values: StrippedEntity<MailAddressAliasServiceReturn>): MailAddressAliasServiceReturn {
    return Object.assign(create(typeModels[MailAddressAliasServiceReturnTypeRef.typeId], MailAddressAliasServiceReturnTypeRef), values)
}

export type MailAddressAliasServiceReturnParams = {

	_format: NumberString;
	nbrOfFreeAliases: NumberString;
	totalAliases: NumberString;
	usedAliases: NumberString;
	enabledAliases: NumberString;
}

export class MailAddressAliasServiceReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddressAliasServiceReturn> { return MailAddressAliasServiceReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[693] }
	get nbrOfFreeAliases(): NumberString { return this._attrs[694] }
	get totalAliases(): NumberString { return this._attrs[1069] }
	get usedAliases(): NumberString { return this._attrs[1070] }
	get enabledAliases(): NumberString { return this._attrs[1071] }
    set enabledAliases(v: NumberString) { this._attrs[1071] = v }
	
}
export const DomainInfoTypeRef: TypeRef<DomainInfo> = new TypeRef("sys", 696)

export function createDomainInfo(values: StrippedEntity<DomainInfo>): DomainInfo {
    return Object.assign(create(typeModels[DomainInfoTypeRef.typeId], DomainInfoTypeRef), values)
}

export type DomainInfoParams = {

	_id: Id;
	domain: string;

	catchAllMailGroup: null | Id;
	whitelabelConfig: null | Id;
}

export class DomainInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DomainInfo> { return DomainInfoTypeRef };
	

	get _id(): Id { return this._attrs[697] }
	get domain(): string { return this._attrs[698] }
	

	get catchAllMailGroup(): null | Id { return this._attrs[698] }
	get whitelabelConfig(): null | Id { return this._attrs[698] }
}
export const BookingItemTypeRef: TypeRef<BookingItem> = new TypeRef("sys", 700)

export function createBookingItem(values: StrippedEntity<BookingItem>): BookingItem {
    return Object.assign(create(typeModels[BookingItemTypeRef.typeId], BookingItemTypeRef), values)
}

export type BookingItemParams = {

	_id: Id;
	featureType: NumberString;
	currentCount: NumberString;
	maxCount: NumberString;
	totalInvoicedCount: NumberString;
	currentInvoicedCount: NumberString;
	price: NumberString;
	priceType: NumberString;
}

export class BookingItem extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BookingItem> { return BookingItemTypeRef };
	

	get _id(): Id { return this._attrs[701] }
	get featureType(): NumberString { return this._attrs[702] }
	get currentCount(): NumberString { return this._attrs[703] }
	get maxCount(): NumberString { return this._attrs[704] }
	get totalInvoicedCount(): NumberString { return this._attrs[705] }
	get currentInvoicedCount(): NumberString { return this._attrs[706] }
	get price(): NumberString { return this._attrs[707] }
	get priceType(): NumberString { return this._attrs[708] }
    set priceType(v: NumberString) { this._attrs[708] = v }
	
}
export const BookingTypeRef: TypeRef<Booking> = new TypeRef("sys", 709)

export function createBooking(values: StrippedEntity<Booking>): Booking {
    return Object.assign(create(typeModels[BookingTypeRef.typeId], BookingTypeRef), values)
}

export type BookingParams = {

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

export class Booking extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Booking> { return BookingTypeRef };
	

	get _id(): IdTuple { return this._attrs[711] }
	get _permissions(): Id { return this._attrs[712] }
	get _format(): NumberString { return this._attrs[713] }
	get _owner(): Id { return this._attrs[714] }
	get _area(): NumberString { return this._attrs[715] }
	get createDate(): Date { return this._attrs[716] }
	get paymentMonths(): NumberString { return this._attrs[717] }
	get endDate(): null | Date { return this._attrs[718] }
	get paymentInterval(): NumberString { return this._attrs[719] }
	get _ownerGroup(): null | Id { return this._attrs[1004] }
	get bonusMonth(): NumberString { return this._attrs[2103] }
	get renewalEnabled(): boolean { return this._attrs[2739] }
    set renewalEnabled(v: boolean) { this._attrs[2739] = v }
	

	get items(): BookingItem[] { return this._attrs[2739] }
	set items(a: BookingItem[])  { this._attrs[721] = a } 
	get subscriptionReference(): SubscriptionReference { return this._attrs[2739] }
	set subscriptionReference(a: SubscriptionReference)  { this._attrs[2738] = a } 
}
export const BookingsRefTypeRef: TypeRef<BookingsRef> = new TypeRef("sys", 722)

export function createBookingsRef(values: StrippedEntity<BookingsRef>): BookingsRef {
    return Object.assign(create(typeModels[BookingsRefTypeRef.typeId], BookingsRefTypeRef), values)
}

export type BookingsRefParams = {

	_id: Id;

	items: Id;
}

export class BookingsRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BookingsRef> { return BookingsRefTypeRef };
	

	get _id(): Id { return this._attrs[723] }
	

	get items(): Id { return this._attrs[723] }
}
export const StringWrapperTypeRef: TypeRef<StringWrapper> = new TypeRef("sys", 728)

export function createStringWrapper(values: StrippedEntity<StringWrapper>): StringWrapper {
    return Object.assign(create(typeModels[StringWrapperTypeRef.typeId], StringWrapperTypeRef), values)
}

export type StringWrapperParams = {

	_id: Id;
	value: string;
}

export class StringWrapper extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<StringWrapper> { return StringWrapperTypeRef };
	

	get _id(): Id { return this._attrs[729] }
	get value(): string { return this._attrs[730] }
    set value(v: string) { this._attrs[730] = v }
	
}
export const CustomDomainReturnTypeRef: TypeRef<CustomDomainReturn> = new TypeRef("sys", 731)

export function createCustomDomainReturn(values: StrippedEntity<CustomDomainReturn>): CustomDomainReturn {
    return Object.assign(create(typeModels[CustomDomainReturnTypeRef.typeId], CustomDomainReturnTypeRef), values)
}

export type CustomDomainReturnParams = {

	_format: NumberString;
	validationResult: NumberString;

	invalidDnsRecords: StringWrapper[];
}

export class CustomDomainReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomDomainReturn> { return CustomDomainReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[732] }
	get validationResult(): NumberString { return this._attrs[733] }
    set validationResult(v: NumberString) { this._attrs[733] = v }
	

	get invalidDnsRecords(): StringWrapper[] { return this._attrs[733] }
}
export const CustomDomainDataTypeRef: TypeRef<CustomDomainData> = new TypeRef("sys", 735)

export function createCustomDomainData(values: StrippedEntity<CustomDomainData>): CustomDomainData {
    return Object.assign(create(typeModels[CustomDomainDataTypeRef.typeId], CustomDomainDataTypeRef), values)
}

export type CustomDomainDataParams = {

	_format: NumberString;
	domain: string;

	catchAllMailGroup: null | Id;
}

export class CustomDomainData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomDomainData> { return CustomDomainDataTypeRef };
	

	get _format(): NumberString { return this._attrs[736] }
	get domain(): string { return this._attrs[737] }
    set domain(v: string) { this._attrs[737] = v }
	

	get catchAllMailGroup(): null | Id { return this._attrs[737] }
	set catchAllMailGroup(a: Id)  { this._attrs[1045] = a } 
}
export const InvoiceInfoTypeRef: TypeRef<InvoiceInfo> = new TypeRef("sys", 752)

export function createInvoiceInfo(values: StrippedEntity<InvoiceInfo>): InvoiceInfo {
    return Object.assign(create(typeModels[InvoiceInfoTypeRef.typeId], InvoiceInfoTypeRef), values)
}

export type InvoiceInfoParams = {

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

export class InvoiceInfo extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InvoiceInfo> { return InvoiceInfoTypeRef };
	

	get _id(): Id { return this._attrs[754] }
	get _permissions(): Id { return this._attrs[755] }
	get _format(): NumberString { return this._attrs[756] }
	get specialPriceUserTotal(): null | NumberString { return this._attrs[757] }
	get specialPriceUserSingle(): null | NumberString { return this._attrs[758] }
	get publishInvoices(): boolean { return this._attrs[759] }
	get _ownerGroup(): null | Id { return this._attrs[1008] }
	get specialPriceBrandingPerUser(): null | NumberString { return this._attrs[1282] }
	get specialPriceSharedGroupSingle(): null | NumberString { return this._attrs[1283] }
	get specialPriceContactFormSingle(): null | NumberString { return this._attrs[1284] }
	get specialPriceSharingPerUser(): null | NumberString { return this._attrs[1627] }
	get reminderState(): NumberString { return this._attrs[1637] }
	get extendedPeriodOfPaymentDays(): NumberString { return this._attrs[1638] }
	get persistentPaymentPeriodExtension(): boolean { return this._attrs[1639] }
	get specialPriceBusinessPerUser(): null | NumberString { return this._attrs[1864] }
	get discountPercentage(): null | NumberString { return this._attrs[2126] }
    set discountPercentage(v: null | NumberString) { this._attrs[2126] = v }
	

	get paymentErrorInfo(): null | PaymentErrorInfo { return this._attrs[2126] }
}
export const SwitchAccountTypePostInTypeRef: TypeRef<SwitchAccountTypePostIn> = new TypeRef("sys", 772)

export function createSwitchAccountTypePostIn(values: StrippedEntity<SwitchAccountTypePostIn>): SwitchAccountTypePostIn {
    return Object.assign(create(typeModels[SwitchAccountTypePostInTypeRef.typeId], SwitchAccountTypePostInTypeRef), values)
}

export type SwitchAccountTypePostInParams = {

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

export class SwitchAccountTypePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SwitchAccountTypePostIn> { return SwitchAccountTypePostInTypeRef };
	

	get _format(): NumberString { return this._attrs[773] }
	get accountType(): NumberString { return this._attrs[774] }
	get date(): null | Date { return this._attrs[775] }
	get plan(): NumberString { return this._attrs[1310] }
	get customer(): null | Id { return this._attrs[2123] }
	get specialPriceUserSingle(): null | NumberString { return this._attrs[2124] }
	get app(): null | NumberString { return this._attrs[2496] }
    set app(v: null | NumberString) { this._attrs[2496] = v }
	

	get referralCode(): null | Id { return this._attrs[2496] }
	set referralCode(a: Id)  { this._attrs[2071] = a } 
	get surveyData(): null | SurveyData { return this._attrs[2496] }
	set surveyData(a: SurveyData)  { this._attrs[2314] = a } 
}
export const MailAddressAliasServiceDataDeleteTypeRef: TypeRef<MailAddressAliasServiceDataDelete> = new TypeRef("sys", 785)

export function createMailAddressAliasServiceDataDelete(values: StrippedEntity<MailAddressAliasServiceDataDelete>): MailAddressAliasServiceDataDelete {
    return Object.assign(create(typeModels[MailAddressAliasServiceDataDeleteTypeRef.typeId], MailAddressAliasServiceDataDeleteTypeRef), values)
}

export type MailAddressAliasServiceDataDeleteParams = {

	_format: NumberString;
	mailAddress: string;
	restore: boolean;

	group: Id;
}

export class MailAddressAliasServiceDataDelete extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddressAliasServiceDataDelete> { return MailAddressAliasServiceDataDeleteTypeRef };
	

	get _format(): NumberString { return this._attrs[786] }
	get mailAddress(): string { return this._attrs[787] }
	get restore(): boolean { return this._attrs[788] }
    set restore(v: boolean) { this._attrs[788] = v }
	

	get group(): Id { return this._attrs[788] }
	set group(a: Id)  { this._attrs[789] = a } 
}
export const PaymentDataServiceGetReturnTypeRef: TypeRef<PaymentDataServiceGetReturn> = new TypeRef("sys", 790)

export function createPaymentDataServiceGetReturn(values: StrippedEntity<PaymentDataServiceGetReturn>): PaymentDataServiceGetReturn {
    return Object.assign(create(typeModels[PaymentDataServiceGetReturnTypeRef.typeId], PaymentDataServiceGetReturnTypeRef), values)
}

export type PaymentDataServiceGetReturnParams = {

	_format: NumberString;
	loginUrl: string;
}

export class PaymentDataServiceGetReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PaymentDataServiceGetReturn> { return PaymentDataServiceGetReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[791] }
	get loginUrl(): string { return this._attrs[792] }
    set loginUrl(v: string) { this._attrs[792] = v }
	
}
export const PaymentDataServicePutDataTypeRef: TypeRef<PaymentDataServicePutData> = new TypeRef("sys", 793)

export function createPaymentDataServicePutData(values: StrippedEntity<PaymentDataServicePutData>): PaymentDataServicePutData {
    return Object.assign(create(typeModels[PaymentDataServicePutDataTypeRef.typeId], PaymentDataServicePutDataTypeRef), values)
}

export type PaymentDataServicePutDataParams = {

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

export class PaymentDataServicePutData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PaymentDataServicePutData> { return PaymentDataServicePutDataTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[794] }
	get invoiceName(): string { return this._attrs[796] }
	get invoiceAddress(): string { return this._attrs[797] }
	get invoiceCountry(): null | string { return this._attrs[798] }
	get invoiceVatIdNo(): string { return this._attrs[799] }
	get paymentMethod(): NumberString { return this._attrs[800] }
	get paymentMethodInfo(): null | string { return this._attrs[801] }
	get paymentInterval(): NumberString { return this._attrs[802] }
	get paymentToken(): null | string { return this._attrs[803] }
	get confirmedCountry(): null | string { return this._attrs[804] }
    set confirmedCountry(v: null | string) { this._attrs[804] = v }
	

	get creditCard(): null | CreditCard { return this._attrs[804] }
	set creditCard(a: CreditCard)  { this._attrs[1320] = a } 
}
export const PaymentDataServicePutReturnTypeRef: TypeRef<PaymentDataServicePutReturn> = new TypeRef("sys", 805)

export function createPaymentDataServicePutReturn(values: StrippedEntity<PaymentDataServicePutReturn>): PaymentDataServicePutReturn {
    return Object.assign(create(typeModels[PaymentDataServicePutReturnTypeRef.typeId], PaymentDataServicePutReturnTypeRef), values)
}

export type PaymentDataServicePutReturnParams = {

	_format: NumberString;
	result: NumberString;

	braintree3dsRequest: null | Braintree3ds2Request;
}

export class PaymentDataServicePutReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PaymentDataServicePutReturn> { return PaymentDataServicePutReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[806] }
	get result(): NumberString { return this._attrs[807] }
    set result(v: NumberString) { this._attrs[807] = v }
	

	get braintree3dsRequest(): null | Braintree3ds2Request { return this._attrs[807] }
	set braintree3dsRequest(a: Braintree3ds2Request)  { this._attrs[1840] = a } 
}
export const PriceRequestDataTypeRef: TypeRef<PriceRequestData> = new TypeRef("sys", 836)

export function createPriceRequestData(values: StrippedEntity<PriceRequestData>): PriceRequestData {
    return Object.assign(create(typeModels[PriceRequestDataTypeRef.typeId], PriceRequestDataTypeRef), values)
}

export type PriceRequestDataParams = {

	_id: Id;
	featureType: NumberString;
	count: NumberString;
	business: null | boolean;
	paymentInterval: null | NumberString;
	accountType: null | NumberString;
	reactivate: boolean;
}

export class PriceRequestData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PriceRequestData> { return PriceRequestDataTypeRef };
	

	get _id(): Id { return this._attrs[837] }
	get featureType(): NumberString { return this._attrs[838] }
	get count(): NumberString { return this._attrs[839] }
	get business(): null | boolean { return this._attrs[840] }
	get paymentInterval(): null | NumberString { return this._attrs[841] }
	get accountType(): null | NumberString { return this._attrs[842] }
	get reactivate(): boolean { return this._attrs[1285] }
    set reactivate(v: boolean) { this._attrs[1285] = v }
	
}
export const PriceServiceDataTypeRef: TypeRef<PriceServiceData> = new TypeRef("sys", 843)

export function createPriceServiceData(values: StrippedEntity<PriceServiceData>): PriceServiceData {
    return Object.assign(create(typeModels[PriceServiceDataTypeRef.typeId], PriceServiceDataTypeRef), values)
}

export type PriceServiceDataParams = {

	_format: NumberString;
	date: null | Date;

	priceRequest: null | PriceRequestData;
}

export class PriceServiceData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PriceServiceData> { return PriceServiceDataTypeRef };
	

	get _format(): NumberString { return this._attrs[844] }
	get date(): null | Date { return this._attrs[846] }
    set date(v: null | Date) { this._attrs[846] = v }
	

	get priceRequest(): null | PriceRequestData { return this._attrs[846] }
	set priceRequest(a: PriceRequestData)  { this._attrs[845] = a } 
}
export const PriceItemDataTypeRef: TypeRef<PriceItemData> = new TypeRef("sys", 847)

export function createPriceItemData(values: StrippedEntity<PriceItemData>): PriceItemData {
    return Object.assign(create(typeModels[PriceItemDataTypeRef.typeId], PriceItemDataTypeRef), values)
}

export type PriceItemDataParams = {

	_id: Id;
	featureType: NumberString;
	count: NumberString;
	price: NumberString;
	singleType: boolean;
}

export class PriceItemData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PriceItemData> { return PriceItemDataTypeRef };
	

	get _id(): Id { return this._attrs[848] }
	get featureType(): NumberString { return this._attrs[849] }
	get count(): NumberString { return this._attrs[850] }
	get price(): NumberString { return this._attrs[851] }
	get singleType(): boolean { return this._attrs[852] }
    set singleType(v: boolean) { this._attrs[852] = v }
	
}
export const PriceDataTypeRef: TypeRef<PriceData> = new TypeRef("sys", 853)

export function createPriceData(values: StrippedEntity<PriceData>): PriceData {
    return Object.assign(create(typeModels[PriceDataTypeRef.typeId], PriceDataTypeRef), values)
}

export type PriceDataParams = {

	_id: Id;
	price: NumberString;
	taxIncluded: boolean;
	paymentInterval: NumberString;

	items: PriceItemData[];
}

export class PriceData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PriceData> { return PriceDataTypeRef };
	

	get _id(): Id { return this._attrs[854] }
	get price(): NumberString { return this._attrs[855] }
	get taxIncluded(): boolean { return this._attrs[856] }
	get paymentInterval(): NumberString { return this._attrs[857] }
    set paymentInterval(v: NumberString) { this._attrs[857] = v }
	

	get items(): PriceItemData[] { return this._attrs[857] }
	set items(a: PriceItemData[])  { this._attrs[858] = a } 
}
export const PriceServiceReturnTypeRef: TypeRef<PriceServiceReturn> = new TypeRef("sys", 859)

export function createPriceServiceReturn(values: StrippedEntity<PriceServiceReturn>): PriceServiceReturn {
    return Object.assign(create(typeModels[PriceServiceReturnTypeRef.typeId], PriceServiceReturnTypeRef), values)
}

export type PriceServiceReturnParams = {

	_format: NumberString;
	periodEndDate: Date;
	currentPeriodAddedPrice: null | NumberString;

	currentPriceThisPeriod: null | PriceData;
	currentPriceNextPeriod: null | PriceData;
	futurePriceNextPeriod: null | PriceData;
	futurePriceThisPeriod: null | PriceData;
}

export class PriceServiceReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PriceServiceReturn> { return PriceServiceReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[860] }
	get periodEndDate(): Date { return this._attrs[861] }
	get currentPeriodAddedPrice(): null | NumberString { return this._attrs[862] }
    set currentPeriodAddedPrice(v: null | NumberString) { this._attrs[862] = v }
	

	get currentPriceThisPeriod(): null | PriceData { return this._attrs[862] }
	set currentPriceThisPeriod(a: PriceData)  { this._attrs[863] = a } 
	get currentPriceNextPeriod(): null | PriceData { return this._attrs[862] }
	set currentPriceNextPeriod(a: PriceData)  { this._attrs[864] = a } 
	get futurePriceNextPeriod(): null | PriceData { return this._attrs[862] }
	set futurePriceNextPeriod(a: PriceData)  { this._attrs[865] = a } 
	get futurePriceThisPeriod(): null | PriceData { return this._attrs[862] }
	set futurePriceThisPeriod(a: PriceData)  { this._attrs[2745] = a } 
}
export const MembershipRemoveDataTypeRef: TypeRef<MembershipRemoveData> = new TypeRef("sys", 867)

export function createMembershipRemoveData(values: StrippedEntity<MembershipRemoveData>): MembershipRemoveData {
    return Object.assign(create(typeModels[MembershipRemoveDataTypeRef.typeId], MembershipRemoveDataTypeRef), values)
}

export type MembershipRemoveDataParams = {

	_format: NumberString;

	user: Id;
	group: Id;
}

export class MembershipRemoveData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MembershipRemoveData> { return MembershipRemoveDataTypeRef };
	

	get _format(): NumberString { return this._attrs[868] }
    set _format(v: NumberString) { this._attrs[868] = v }
	

	get user(): Id { return this._attrs[868] }
	set user(a: Id)  { this._attrs[869] = a } 
	get group(): Id { return this._attrs[868] }
	set group(a: Id)  { this._attrs[870] = a } 
}
export const FileTypeRef: TypeRef<File> = new TypeRef("sys", 917)

export function createFile(values: StrippedEntity<File>): File {
    return Object.assign(create(typeModels[FileTypeRef.typeId], FileTypeRef), values)
}

export type FileParams = {

	_id: Id;
	name: string;
	mimeType: string;
	data: Uint8Array;
}

export class File extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<File> { return FileTypeRef };
	

	get _id(): Id { return this._attrs[918] }
	get name(): string { return this._attrs[919] }
	get mimeType(): string { return this._attrs[920] }
	get data(): Uint8Array { return this._attrs[921] }
    set data(v: Uint8Array) { this._attrs[921] = v }
	
}
export const EmailSenderListElementTypeRef: TypeRef<EmailSenderListElement> = new TypeRef("sys", 949)

export function createEmailSenderListElement(values: StrippedEntity<EmailSenderListElement>): EmailSenderListElement {
    return Object.assign(create(typeModels[EmailSenderListElementTypeRef.typeId], EmailSenderListElementTypeRef), values)
}

export type EmailSenderListElementParams = {

	_id: Id;
	hashedValue: string;
	value: string;
	type: NumberString;
	field: NumberString;
}

export class EmailSenderListElement extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<EmailSenderListElement> { return EmailSenderListElementTypeRef };
	

	get _id(): Id { return this._attrs[950] }
	get hashedValue(): string { return this._attrs[951] }
	get value(): string { return this._attrs[952] }
	get type(): NumberString { return this._attrs[953] }
	get field(): NumberString { return this._attrs[1705] }
    set field(v: NumberString) { this._attrs[1705] = v }
	
}
export const CustomerServerPropertiesTypeRef: TypeRef<CustomerServerProperties> = new TypeRef("sys", 954)

export function createCustomerServerProperties(values: StrippedEntity<CustomerServerProperties>): CustomerServerProperties {
    return Object.assign(create(typeModels[CustomerServerPropertiesTypeRef.typeId], CustomerServerPropertiesTypeRef), values)
}

export type CustomerServerPropertiesParams = {

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

export class CustomerServerProperties extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerServerProperties> { return CustomerServerPropertiesTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[956] }
	get _permissions(): Id { return this._attrs[957] }
	get _format(): NumberString { return this._attrs[958] }
	get _ownerGroup(): null | Id { return this._attrs[986] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[987] }
	get requirePasswordUpdateAfterReset(): boolean { return this._attrs[1100] }
	get saveEncryptedIpAddressInSession(): boolean { return this._attrs[1406] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2224] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2720] }
	

	get emailSenderList(): EmailSenderListElement[] { return this._attrs[2720] }
	set emailSenderList(a: EmailSenderListElement[])  { this._attrs[959] = a } 
}
export const CreateCustomerServerPropertiesDataTypeRef: TypeRef<CreateCustomerServerPropertiesData> = new TypeRef("sys", 961)

export function createCreateCustomerServerPropertiesData(values: StrippedEntity<CreateCustomerServerPropertiesData>): CreateCustomerServerPropertiesData {
    return Object.assign(create(typeModels[CreateCustomerServerPropertiesDataTypeRef.typeId], CreateCustomerServerPropertiesDataTypeRef), values)
}

export type CreateCustomerServerPropertiesDataParams = {

	_format: NumberString;
	adminGroupEncSessionKey: Uint8Array;
	adminGroupKeyVersion: NumberString;
}

export class CreateCustomerServerPropertiesData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateCustomerServerPropertiesData> { return CreateCustomerServerPropertiesDataTypeRef };
	

	get _format(): NumberString { return this._attrs[962] }
	get adminGroupEncSessionKey(): Uint8Array { return this._attrs[963] }
	get adminGroupKeyVersion(): NumberString { return this._attrs[2274] }
    set adminGroupKeyVersion(v: NumberString) { this._attrs[2274] = v }
	
}
export const CreateCustomerServerPropertiesReturnTypeRef: TypeRef<CreateCustomerServerPropertiesReturn> = new TypeRef("sys", 964)

export function createCreateCustomerServerPropertiesReturn(values: StrippedEntity<CreateCustomerServerPropertiesReturn>): CreateCustomerServerPropertiesReturn {
    return Object.assign(create(typeModels[CreateCustomerServerPropertiesReturnTypeRef.typeId], CreateCustomerServerPropertiesReturnTypeRef), values)
}

export type CreateCustomerServerPropertiesReturnParams = {

	_format: NumberString;

	id: Id;
}

export class CreateCustomerServerPropertiesReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateCustomerServerPropertiesReturn> { return CreateCustomerServerPropertiesReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[965] }
    set _format(v: NumberString) { this._attrs[965] = v }
	

	get id(): Id { return this._attrs[965] }
	set id(a: Id)  { this._attrs[966] = a } 
}
export const UserAreaGroupsTypeRef: TypeRef<UserAreaGroups> = new TypeRef("sys", 988)

export function createUserAreaGroups(values: StrippedEntity<UserAreaGroups>): UserAreaGroups {
    return Object.assign(create(typeModels[UserAreaGroupsTypeRef.typeId], UserAreaGroupsTypeRef), values)
}

export type UserAreaGroupsParams = {

	_id: Id;

	list: Id;
}

export class UserAreaGroups extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAreaGroups> { return UserAreaGroupsTypeRef };
	

	get _id(): Id { return this._attrs[989] }
	

	get list(): Id { return this._attrs[989] }
}
export const DebitServicePutDataTypeRef: TypeRef<DebitServicePutData> = new TypeRef("sys", 1041)

export function createDebitServicePutData(values: StrippedEntity<DebitServicePutData>): DebitServicePutData {
    return Object.assign(create(typeModels[DebitServicePutDataTypeRef.typeId], DebitServicePutDataTypeRef), values)
}

export type DebitServicePutDataParams = {

	_format: NumberString;
}

export class DebitServicePutData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DebitServicePutData> { return DebitServicePutDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1042] }
    set _format(v: NumberString) { this._attrs[1042] = v }
	
}
export const EntityEventBatchTypeRef: TypeRef<EntityEventBatch> = new TypeRef("sys", 1079)

export function createEntityEventBatch(values: StrippedEntity<EntityEventBatch>): EntityEventBatch {
    return Object.assign(create(typeModels[EntityEventBatchTypeRef.typeId], EntityEventBatchTypeRef), values)
}

export type EntityEventBatchParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	events: EntityUpdate[];
}

export class EntityEventBatch extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<EntityEventBatch> { return EntityEventBatchTypeRef };
	

	get _id(): IdTuple { return this._attrs[1081] }
	get _permissions(): Id { return this._attrs[1082] }
	get _format(): NumberString { return this._attrs[1083] }
	get _ownerGroup(): null | Id { return this._attrs[1084] }
	

	get events(): EntityUpdate[] { return this._attrs[1084] }
}
export const AuditLogEntryTypeRef: TypeRef<AuditLogEntry> = new TypeRef("sys", 1101)

export function createAuditLogEntry(values: StrippedEntity<AuditLogEntry>): AuditLogEntry {
    return Object.assign(create(typeModels[AuditLogEntryTypeRef.typeId], AuditLogEntryTypeRef), values)
}

export type AuditLogEntryParams = {

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

export class AuditLogEntry extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AuditLogEntry> { return AuditLogEntryTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1103] }
	get _permissions(): Id { return this._attrs[1104] }
	get _format(): NumberString { return this._attrs[1105] }
	get _ownerGroup(): null | Id { return this._attrs[1106] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1107] }
	get actorMailAddress(): string { return this._attrs[1108] }
	get actorIpAddress(): null | string { return this._attrs[1109] }
	get action(): string { return this._attrs[1110] }
	get modifiedEntity(): string { return this._attrs[1111] }
	get date(): Date { return this._attrs[1112] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2227] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2706] }
	

	get groupInfo(): null | IdTuple { return this._attrs[2706] }
	get modifiedGroupInfo(): null | IdTuple { return this._attrs[2706] }
}
export const AuditLogRefTypeRef: TypeRef<AuditLogRef> = new TypeRef("sys", 1114)

export function createAuditLogRef(values: StrippedEntity<AuditLogRef>): AuditLogRef {
    return Object.assign(create(typeModels[AuditLogRefTypeRef.typeId], AuditLogRefTypeRef), values)
}

export type AuditLogRefParams = {

	_id: Id;

	items: Id;
}

export class AuditLogRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AuditLogRef> { return AuditLogRefTypeRef };
	

	get _id(): Id { return this._attrs[1115] }
	

	get items(): Id { return this._attrs[1115] }
}
export const WhitelabelConfigTypeRef: TypeRef<WhitelabelConfig> = new TypeRef("sys", 1127)

export function createWhitelabelConfig(values: StrippedEntity<WhitelabelConfig>): WhitelabelConfig {
    return Object.assign(create(typeModels[WhitelabelConfigTypeRef.typeId], WhitelabelConfigTypeRef), values)
}

export type WhitelabelConfigParams = {

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

export class WhitelabelConfig extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WhitelabelConfig> { return WhitelabelConfigTypeRef };
	

	get _id(): Id { return this._attrs[1129] }
	get _permissions(): Id { return this._attrs[1130] }
	get _format(): NumberString { return this._attrs[1131] }
	get _ownerGroup(): null | Id { return this._attrs[1132] }
	get jsonTheme(): string { return this._attrs[1133] }
	get metaTags(): string { return this._attrs[1281] }
	get germanLanguageCode(): null | string { return this._attrs[1308] }
	get imprintUrl(): null | string { return this._attrs[1425] }
	get privacyStatementUrl(): null | string { return this._attrs[1496] }
	get whitelabelCode(): string { return this._attrs[1727] }
    set whitelabelCode(v: string) { this._attrs[1727] = v }
	

	get bootstrapCustomizations(): BootstrapFeature[] { return this._attrs[1727] }
	set bootstrapCustomizations(a: BootstrapFeature[])  { this._attrs[1252] = a } 
	get whitelabelRegistrationDomains(): StringWrapper[] { return this._attrs[1727] }
	set whitelabelRegistrationDomains(a: StringWrapper[])  { this._attrs[1728] = a } 
}
export const BrandingDomainDataTypeRef: TypeRef<BrandingDomainData> = new TypeRef("sys", 1149)

export function createBrandingDomainData(values: StrippedEntity<BrandingDomainData>): BrandingDomainData {
    return Object.assign(create(typeModels[BrandingDomainDataTypeRef.typeId], BrandingDomainDataTypeRef), values)
}

export type BrandingDomainDataParams = {

	_format: NumberString;
	domain: string;
	sessionEncPemCertificateChain: null | Uint8Array;
	sessionEncPemPrivateKey: null | Uint8Array;
	systemAdminPubEncSessionKey: Uint8Array;
	systemAdminPublicProtocolVersion: NumberString;
	systemAdminPubKeyVersion: NumberString;
}

export class BrandingDomainData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BrandingDomainData> { return BrandingDomainDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1150] }
	get domain(): string { return this._attrs[1151] }
	get sessionEncPemCertificateChain(): null | Uint8Array { return this._attrs[1152] }
	get sessionEncPemPrivateKey(): null | Uint8Array { return this._attrs[1153] }
	get systemAdminPubEncSessionKey(): Uint8Array { return this._attrs[1154] }
	get systemAdminPublicProtocolVersion(): NumberString { return this._attrs[2161] }
	get systemAdminPubKeyVersion(): NumberString { return this._attrs[2282] }
	
}
export const BrandingDomainDeleteDataTypeRef: TypeRef<BrandingDomainDeleteData> = new TypeRef("sys", 1155)

export function createBrandingDomainDeleteData(values: StrippedEntity<BrandingDomainDeleteData>): BrandingDomainDeleteData {
    return Object.assign(create(typeModels[BrandingDomainDeleteDataTypeRef.typeId], BrandingDomainDeleteDataTypeRef), values)
}

export type BrandingDomainDeleteDataParams = {

	_format: NumberString;
	domain: string;
}

export class BrandingDomainDeleteData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BrandingDomainDeleteData> { return BrandingDomainDeleteDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1156] }
	get domain(): string { return this._attrs[1157] }
	
}
export const U2fRegisteredDeviceTypeRef: TypeRef<U2fRegisteredDevice> = new TypeRef("sys", 1162)

export function createU2fRegisteredDevice(values: StrippedEntity<U2fRegisteredDevice>): U2fRegisteredDevice {
    return Object.assign(create(typeModels[U2fRegisteredDeviceTypeRef.typeId], U2fRegisteredDeviceTypeRef), values)
}

export type U2fRegisteredDeviceParams = {

	_id: Id;
	keyHandle: Uint8Array;
	appId: string;
	publicKey: Uint8Array;
	counter: NumberString;
	compromised: boolean;
}

export class U2fRegisteredDevice extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<U2fRegisteredDevice> { return U2fRegisteredDeviceTypeRef };
	

	get _id(): Id { return this._attrs[1163] }
	get keyHandle(): Uint8Array { return this._attrs[1164] }
	get appId(): string { return this._attrs[1165] }
	get publicKey(): Uint8Array { return this._attrs[1166] }
	get counter(): NumberString { return this._attrs[1167] }
	get compromised(): boolean { return this._attrs[1168] }
	
}
export const SecondFactorTypeRef: TypeRef<SecondFactor> = new TypeRef("sys", 1169)

export function createSecondFactor(values: StrippedEntity<SecondFactor>): SecondFactor {
    return Object.assign(create(typeModels[SecondFactorTypeRef.typeId], SecondFactorTypeRef), values)
}

export type SecondFactorParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	type: NumberString;
	name: string;
	otpSecret: null | Uint8Array;

	u2f: null | U2fRegisteredDevice;
}

export class SecondFactor extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SecondFactor> { return SecondFactorTypeRef };
	

	get _id(): IdTuple { return this._attrs[1171] }
	get _permissions(): Id { return this._attrs[1172] }
	get _format(): NumberString { return this._attrs[1173] }
	get _ownerGroup(): null | Id { return this._attrs[1174] }
	get type(): NumberString { return this._attrs[1175] }
	get name(): string { return this._attrs[1176] }
	get otpSecret(): null | Uint8Array { return this._attrs[1242] }
	

	get u2f(): null | U2fRegisteredDevice { return this._attrs[1242] }
}
export const U2fKeyTypeRef: TypeRef<U2fKey> = new TypeRef("sys", 1178)

export function createU2fKey(values: StrippedEntity<U2fKey>): U2fKey {
    return Object.assign(create(typeModels[U2fKeyTypeRef.typeId], U2fKeyTypeRef), values)
}

export type U2fKeyParams = {

	_id: Id;
	keyHandle: Uint8Array;
	appId: string;

	secondFactor: IdTuple;
}

export class U2fKey extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<U2fKey> { return U2fKeyTypeRef };
	

	get _id(): Id { return this._attrs[1179] }
	get keyHandle(): Uint8Array { return this._attrs[1180] }
	get appId(): string { return this._attrs[1181] }
	

	get secondFactor(): IdTuple { return this._attrs[1181] }
	set secondFactor(a: IdTuple)  { this._attrs[1182] = a } 
}
export const U2fChallengeTypeRef: TypeRef<U2fChallenge> = new TypeRef("sys", 1183)

export function createU2fChallenge(values: StrippedEntity<U2fChallenge>): U2fChallenge {
    return Object.assign(create(typeModels[U2fChallengeTypeRef.typeId], U2fChallengeTypeRef), values)
}

export type U2fChallengeParams = {

	_id: Id;
	challenge: Uint8Array;

	keys: U2fKey[];
}

export class U2fChallenge extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<U2fChallenge> { return U2fChallengeTypeRef };
	

	get _id(): Id { return this._attrs[1184] }
	get challenge(): Uint8Array { return this._attrs[1185] }
	

	get keys(): U2fKey[] { return this._attrs[1185] }
}
export const ChallengeTypeRef: TypeRef<Challenge> = new TypeRef("sys", 1187)

export function createChallenge(values: StrippedEntity<Challenge>): Challenge {
    return Object.assign(create(typeModels[ChallengeTypeRef.typeId], ChallengeTypeRef), values)
}

export type ChallengeParams = {

	_id: Id;
	type: NumberString;

	u2f: null | U2fChallenge;
	otp: null | OtpChallenge;
}

export class Challenge extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Challenge> { return ChallengeTypeRef };
	

	get _id(): Id { return this._attrs[1188] }
	get type(): NumberString { return this._attrs[1189] }
	

	get u2f(): null | U2fChallenge { return this._attrs[1189] }
	get otp(): null | OtpChallenge { return this._attrs[1189] }
}
export const SessionTypeRef: TypeRef<Session> = new TypeRef("sys", 1191)

export function createSession(values: StrippedEntity<Session>): Session {
    return Object.assign(create(typeModels[SessionTypeRef.typeId], SessionTypeRef), values)
}

export type SessionParams = {

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

export class Session extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Session> { return SessionTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1193] }
	get _permissions(): Id { return this._attrs[1194] }
	get _format(): NumberString { return this._attrs[1195] }
	get _ownerGroup(): null | Id { return this._attrs[1196] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1197] }
	get clientIdentifier(): string { return this._attrs[1198] }
	get loginTime(): Date { return this._attrs[1199] }
	get loginIpAddress(): null | string { return this._attrs[1200] }
	get lastAccessTime(): Date { return this._attrs[1201] }
	get accessKey(): null | Uint8Array { return this._attrs[1202] }
	get state(): NumberString { return this._attrs[1203] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2229] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2714] }
	

	get challenges(): Challenge[] { return this._attrs[2714] }
	get user(): Id { return this._attrs[2714] }
}
export const UserAuthenticationTypeRef: TypeRef<UserAuthentication> = new TypeRef("sys", 1206)

export function createUserAuthentication(values: StrippedEntity<UserAuthentication>): UserAuthentication {
    return Object.assign(create(typeModels[UserAuthenticationTypeRef.typeId], UserAuthenticationTypeRef), values)
}

export type UserAuthenticationParams = {

	_id: Id;

	sessions: Id;
	secondFactors: Id;
	recoverCode: null | Id;
}

export class UserAuthentication extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAuthentication> { return UserAuthenticationTypeRef };
	

	get _id(): Id { return this._attrs[1207] }
	

	get sessions(): Id { return this._attrs[1207] }
	get secondFactors(): Id { return this._attrs[1207] }
	get recoverCode(): null | Id { return this._attrs[1207] }
	set recoverCode(a: Id)  { this._attrs[1416] = a } 
}
export const CreateSessionDataTypeRef: TypeRef<CreateSessionData> = new TypeRef("sys", 1211)

export function createCreateSessionData(values: StrippedEntity<CreateSessionData>): CreateSessionData {
    return Object.assign(create(typeModels[CreateSessionDataTypeRef.typeId], CreateSessionDataTypeRef), values)
}

export type CreateSessionDataParams = {

	_format: NumberString;
	mailAddress: null | string;
	authVerifier: null | string;
	clientIdentifier: string;
	accessKey: null | Uint8Array;
	authToken: null | string;
	recoverCodeVerifier: null | string;

	user: null | Id;
}

export class CreateSessionData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateSessionData> { return CreateSessionDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1212] }
	get mailAddress(): null | string { return this._attrs[1213] }
	get authVerifier(): null | string { return this._attrs[1214] }
	get clientIdentifier(): string { return this._attrs[1215] }
	get accessKey(): null | Uint8Array { return this._attrs[1216] }
	get authToken(): null | string { return this._attrs[1217] }
	get recoverCodeVerifier(): null | string { return this._attrs[1417] }
	

	get user(): null | Id { return this._attrs[1417] }
}
export const CreateSessionReturnTypeRef: TypeRef<CreateSessionReturn> = new TypeRef("sys", 1219)

export function createCreateSessionReturn(values: StrippedEntity<CreateSessionReturn>): CreateSessionReturn {
    return Object.assign(create(typeModels[CreateSessionReturnTypeRef.typeId], CreateSessionReturnTypeRef), values)
}

export type CreateSessionReturnParams = {

	_format: NumberString;
	accessToken: string;

	challenges: Challenge[];
	user: Id;
}

export class CreateSessionReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreateSessionReturn> { return CreateSessionReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1220] }
	get accessToken(): string { return this._attrs[1221] }
	

	get challenges(): Challenge[] { return this._attrs[1221] }
	get user(): Id { return this._attrs[1221] }
}
export const U2fResponseDataTypeRef: TypeRef<U2fResponseData> = new TypeRef("sys", 1225)

export function createU2fResponseData(values: StrippedEntity<U2fResponseData>): U2fResponseData {
    return Object.assign(create(typeModels[U2fResponseDataTypeRef.typeId], U2fResponseDataTypeRef), values)
}

export type U2fResponseDataParams = {

	_id: Id;
	keyHandle: string;
	clientData: string;
	signatureData: string;
}

export class U2fResponseData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<U2fResponseData> { return U2fResponseDataTypeRef };
	

	get _id(): Id { return this._attrs[1226] }
	get keyHandle(): string { return this._attrs[1227] }
	get clientData(): string { return this._attrs[1228] }
	get signatureData(): string { return this._attrs[1229] }
	
}
export const SecondFactorAuthGetDataTypeRef: TypeRef<SecondFactorAuthGetData> = new TypeRef("sys", 1233)

export function createSecondFactorAuthGetData(values: StrippedEntity<SecondFactorAuthGetData>): SecondFactorAuthGetData {
    return Object.assign(create(typeModels[SecondFactorAuthGetDataTypeRef.typeId], SecondFactorAuthGetDataTypeRef), values)
}

export type SecondFactorAuthGetDataParams = {

	_format: NumberString;
	accessToken: string;
}

export class SecondFactorAuthGetData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SecondFactorAuthGetData> { return SecondFactorAuthGetDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1234] }
	get accessToken(): string { return this._attrs[1235] }
	
}
export const SecondFactorAuthGetReturnTypeRef: TypeRef<SecondFactorAuthGetReturn> = new TypeRef("sys", 1236)

export function createSecondFactorAuthGetReturn(values: StrippedEntity<SecondFactorAuthGetReturn>): SecondFactorAuthGetReturn {
    return Object.assign(create(typeModels[SecondFactorAuthGetReturnTypeRef.typeId], SecondFactorAuthGetReturnTypeRef), values)
}

export type SecondFactorAuthGetReturnParams = {

	_format: NumberString;
	secondFactorPending: boolean;
}

export class SecondFactorAuthGetReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SecondFactorAuthGetReturn> { return SecondFactorAuthGetReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1237] }
	get secondFactorPending(): boolean { return this._attrs[1238] }
	
}
export const OtpChallengeTypeRef: TypeRef<OtpChallenge> = new TypeRef("sys", 1244)

export function createOtpChallenge(values: StrippedEntity<OtpChallenge>): OtpChallenge {
    return Object.assign(create(typeModels[OtpChallengeTypeRef.typeId], OtpChallengeTypeRef), values)
}

export type OtpChallengeParams = {

	_id: Id;

	secondFactors: IdTuple[];
}

export class OtpChallenge extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<OtpChallenge> { return OtpChallengeTypeRef };
	

	get _id(): Id { return this._attrs[1245] }
	

	get secondFactors(): IdTuple[] { return this._attrs[1245] }
	set secondFactors(a: IdTuple[])  { this._attrs[1246] = a } 
}
export const BootstrapFeatureTypeRef: TypeRef<BootstrapFeature> = new TypeRef("sys", 1249)

export function createBootstrapFeature(values: StrippedEntity<BootstrapFeature>): BootstrapFeature {
    return Object.assign(create(typeModels[BootstrapFeatureTypeRef.typeId], BootstrapFeatureTypeRef), values)
}

export type BootstrapFeatureParams = {

	_id: Id;
	feature: NumberString;
}

export class BootstrapFeature extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BootstrapFeature> { return BootstrapFeatureTypeRef };
	

	get _id(): Id { return this._attrs[1250] }
	get feature(): NumberString { return this._attrs[1309] }
    set feature(v: NumberString) { this._attrs[1309] = v }
	
}
export const FeatureTypeRef: TypeRef<Feature> = new TypeRef("sys", 1253)

export function createFeature(values: StrippedEntity<Feature>): Feature {
    return Object.assign(create(typeModels[FeatureTypeRef.typeId], FeatureTypeRef), values)
}

export type FeatureParams = {

	_id: Id;
	feature: NumberString;
}

export class Feature extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Feature> { return FeatureTypeRef };
	

	get _id(): Id { return this._attrs[1254] }
	get feature(): NumberString { return this._attrs[1255] }
    set feature(v: NumberString) { this._attrs[1255] = v }
	
}
export const WhitelabelChildTypeRef: TypeRef<WhitelabelChild> = new TypeRef("sys", 1257)

export function createWhitelabelChild(values: StrippedEntity<WhitelabelChild>): WhitelabelChild {
    return Object.assign(create(typeModels[WhitelabelChildTypeRef.typeId], WhitelabelChildTypeRef), values)
}

export type WhitelabelChildParams = {

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

export class WhitelabelChild extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WhitelabelChild> { return WhitelabelChildTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1259] }
	get _permissions(): Id { return this._attrs[1260] }
	get _format(): NumberString { return this._attrs[1261] }
	get _ownerGroup(): null | Id { return this._attrs[1262] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1263] }
	get mailAddress(): string { return this._attrs[1264] }
	get createdDate(): Date { return this._attrs[1265] }
	get deletedDate(): null | Date { return this._attrs[1266] }
	get comment(): string { return this._attrs[1267] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2230] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2716] }
	

	get customer(): Id { return this._attrs[2716] }
}
export const WhitelabelChildrenRefTypeRef: TypeRef<WhitelabelChildrenRef> = new TypeRef("sys", 1269)

export function createWhitelabelChildrenRef(values: StrippedEntity<WhitelabelChildrenRef>): WhitelabelChildrenRef {
    return Object.assign(create(typeModels[WhitelabelChildrenRefTypeRef.typeId], WhitelabelChildrenRefTypeRef), values)
}

export type WhitelabelChildrenRefParams = {

	_id: Id;

	items: Id;
}

export class WhitelabelChildrenRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WhitelabelChildrenRef> { return WhitelabelChildrenRefTypeRef };
	

	get _id(): Id { return this._attrs[1270] }
	

	get items(): Id { return this._attrs[1270] }
}
export const WhitelabelParentTypeRef: TypeRef<WhitelabelParent> = new TypeRef("sys", 1272)

export function createWhitelabelParent(values: StrippedEntity<WhitelabelParent>): WhitelabelParent {
    return Object.assign(create(typeModels[WhitelabelParentTypeRef.typeId], WhitelabelParentTypeRef), values)
}

export type WhitelabelParentParams = {

	_id: Id;

	customer: Id;
	whitelabelChildInParent: IdTuple;
}

export class WhitelabelParent extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WhitelabelParent> { return WhitelabelParentTypeRef };
	

	get _id(): Id { return this._attrs[1273] }
	

	get customer(): Id { return this._attrs[1273] }
	get whitelabelChildInParent(): IdTuple { return this._attrs[1273] }
}
export const CreditCardTypeRef: TypeRef<CreditCard> = new TypeRef("sys", 1313)

export function createCreditCard(values: StrippedEntity<CreditCard>): CreditCard {
    return Object.assign(create(typeModels[CreditCardTypeRef.typeId], CreditCardTypeRef), values)
}

export type CreditCardParams = {

	_id: Id;
	cardHolderName: string;
	number: string;
	cvv: string;
	expirationMonth: string;
	expirationYear: string;
}

export class CreditCard extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CreditCard> { return CreditCardTypeRef };
	

	get _id(): Id { return this._attrs[1314] }
	get cardHolderName(): string { return this._attrs[1315] }
	get number(): string { return this._attrs[1316] }
	get cvv(): string { return this._attrs[1317] }
	get expirationMonth(): string { return this._attrs[1318] }
	get expirationYear(): string { return this._attrs[1319] }
    set expirationYear(v: string) { this._attrs[1319] = v }
	
}
export const LocationServiceGetReturnTypeRef: TypeRef<LocationServiceGetReturn> = new TypeRef("sys", 1321)

export function createLocationServiceGetReturn(values: StrippedEntity<LocationServiceGetReturn>): LocationServiceGetReturn {
    return Object.assign(create(typeModels[LocationServiceGetReturnTypeRef.typeId], LocationServiceGetReturnTypeRef), values)
}

export type LocationServiceGetReturnParams = {

	_format: NumberString;
	country: string;
}

export class LocationServiceGetReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<LocationServiceGetReturn> { return LocationServiceGetReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1322] }
	get country(): string { return this._attrs[1323] }
    set country(v: string) { this._attrs[1323] = v }
	
}
export const OrderProcessingAgreementTypeRef: TypeRef<OrderProcessingAgreement> = new TypeRef("sys", 1326)

export function createOrderProcessingAgreement(values: StrippedEntity<OrderProcessingAgreement>): OrderProcessingAgreement {
    return Object.assign(create(typeModels[OrderProcessingAgreementTypeRef.typeId], OrderProcessingAgreementTypeRef), values)
}

export type OrderProcessingAgreementParams = {

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

export class OrderProcessingAgreement extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<OrderProcessingAgreement> { return OrderProcessingAgreementTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1328] }
	get _permissions(): Id { return this._attrs[1329] }
	get _format(): NumberString { return this._attrs[1330] }
	get _ownerGroup(): null | Id { return this._attrs[1331] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1332] }
	get version(): string { return this._attrs[1333] }
	get customerAddress(): string { return this._attrs[1334] }
	get signatureDate(): Date { return this._attrs[1335] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2231] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2718] }
	

	get signerUserGroupInfo(): IdTuple { return this._attrs[2718] }
	set signerUserGroupInfo(a: IdTuple)  { this._attrs[1336] = a } 
	get customer(): Id { return this._attrs[2718] }
}
export const SignOrderProcessingAgreementDataTypeRef: TypeRef<SignOrderProcessingAgreementData> = new TypeRef("sys", 1342)

export function createSignOrderProcessingAgreementData(values: StrippedEntity<SignOrderProcessingAgreementData>): SignOrderProcessingAgreementData {
    return Object.assign(create(typeModels[SignOrderProcessingAgreementDataTypeRef.typeId], SignOrderProcessingAgreementDataTypeRef), values)
}

export type SignOrderProcessingAgreementDataParams = {

	_format: NumberString;
	version: string;
	customerAddress: string;
}

export class SignOrderProcessingAgreementData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SignOrderProcessingAgreementData> { return SignOrderProcessingAgreementDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1343] }
	get version(): string { return this._attrs[1344] }
	get customerAddress(): string { return this._attrs[1345] }
    set customerAddress(v: string) { this._attrs[1345] = v }
	
}
export const GeneratedIdWrapperTypeRef: TypeRef<GeneratedIdWrapper> = new TypeRef("sys", 1349)

export function createGeneratedIdWrapper(values: StrippedEntity<GeneratedIdWrapper>): GeneratedIdWrapper {
    return Object.assign(create(typeModels[GeneratedIdWrapperTypeRef.typeId], GeneratedIdWrapperTypeRef), values)
}

export type GeneratedIdWrapperParams = {

	_id: Id;
	value: Id;
}

export class GeneratedIdWrapper extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GeneratedIdWrapper> { return GeneratedIdWrapperTypeRef };
	

	get _id(): Id { return this._attrs[1350] }
	get value(): Id { return this._attrs[1351] }
    set value(v: Id) { this._attrs[1351] = v }
	
}
export const SseConnectDataTypeRef: TypeRef<SseConnectData> = new TypeRef("sys", 1352)

export function createSseConnectData(values: StrippedEntity<SseConnectData>): SseConnectData {
    return Object.assign(create(typeModels[SseConnectDataTypeRef.typeId], SseConnectDataTypeRef), values)
}

export type SseConnectDataParams = {

	_format: NumberString;
	identifier: string;

	userIds: GeneratedIdWrapper[];
}

export class SseConnectData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SseConnectData> { return SseConnectDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1353] }
	get identifier(): string { return this._attrs[1354] }
	

	get userIds(): GeneratedIdWrapper[] { return this._attrs[1354] }
	set userIds(a: GeneratedIdWrapper[])  { this._attrs[1355] = a } 
}
export const NotificationInfoTypeRef: TypeRef<NotificationInfo> = new TypeRef("sys", 1364)

export function createNotificationInfo(values: StrippedEntity<NotificationInfo>): NotificationInfo {
    return Object.assign(create(typeModels[NotificationInfoTypeRef.typeId], NotificationInfoTypeRef), values)
}

export type NotificationInfoParams = {

	_id: Id;
	mailAddress: string;
	userId: Id;

	mailId: null | IdTupleWrapper;
}

export class NotificationInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NotificationInfo> { return NotificationInfoTypeRef };
	

	get _id(): Id { return this._attrs[1365] }
	get mailAddress(): string { return this._attrs[1366] }
	get userId(): Id { return this._attrs[1368] }
    set userId(v: Id) { this._attrs[1368] = v }
	

	get mailId(): null | IdTupleWrapper { return this._attrs[1368] }
}
export const RecoverCodeTypeRef: TypeRef<RecoverCode> = new TypeRef("sys", 1407)

export function createRecoverCode(values: StrippedEntity<RecoverCode>): RecoverCode {
    return Object.assign(create(typeModels[RecoverCodeTypeRef.typeId], RecoverCodeTypeRef), values)
}

export type RecoverCodeParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	userEncRecoverCode: Uint8Array;
	recoverCodeEncUserGroupKey: Uint8Array;
	verifier: Uint8Array;
	userKeyVersion: NumberString;
}

export class RecoverCode extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RecoverCode> { return RecoverCodeTypeRef };
	

	get _id(): Id { return this._attrs[1409] }
	get _permissions(): Id { return this._attrs[1410] }
	get _format(): NumberString { return this._attrs[1411] }
	get _ownerGroup(): null | Id { return this._attrs[1412] }
	get userEncRecoverCode(): Uint8Array { return this._attrs[1413] }
	get recoverCodeEncUserGroupKey(): Uint8Array { return this._attrs[1414] }
	get verifier(): Uint8Array { return this._attrs[1415] }
	get userKeyVersion(): NumberString { return this._attrs[2281] }
	
}
export const ResetFactorsDeleteDataTypeRef: TypeRef<ResetFactorsDeleteData> = new TypeRef("sys", 1419)

export function createResetFactorsDeleteData(values: StrippedEntity<ResetFactorsDeleteData>): ResetFactorsDeleteData {
    return Object.assign(create(typeModels[ResetFactorsDeleteDataTypeRef.typeId], ResetFactorsDeleteDataTypeRef), values)
}

export type ResetFactorsDeleteDataParams = {

	_format: NumberString;
	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: string;
}

export class ResetFactorsDeleteData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ResetFactorsDeleteData> { return ResetFactorsDeleteDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1420] }
	get mailAddress(): string { return this._attrs[1421] }
	get authVerifier(): string { return this._attrs[1422] }
	get recoverCodeVerifier(): string { return this._attrs[1423] }
	
}
export const UpgradePriceServiceDataTypeRef: TypeRef<UpgradePriceServiceData> = new TypeRef("sys", 1456)

export function createUpgradePriceServiceData(values: StrippedEntity<UpgradePriceServiceData>): UpgradePriceServiceData {
    return Object.assign(create(typeModels[UpgradePriceServiceDataTypeRef.typeId], UpgradePriceServiceDataTypeRef), values)
}

export type UpgradePriceServiceDataParams = {

	_format: NumberString;
	date: null | Date;
	campaign: null | string;

	referralCode: null | Id;
}

export class UpgradePriceServiceData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UpgradePriceServiceData> { return UpgradePriceServiceDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1457] }
	get date(): null | Date { return this._attrs[1458] }
	get campaign(): null | string { return this._attrs[1459] }
    set campaign(v: null | string) { this._attrs[1459] = v }
	

	get referralCode(): null | Id { return this._attrs[1459] }
	set referralCode(a: Id)  { this._attrs[2077] = a } 
}
export const PlanPricesTypeRef: TypeRef<PlanPrices> = new TypeRef("sys", 1460)

export function createPlanPrices(values: StrippedEntity<PlanPrices>): PlanPrices {
    return Object.assign(create(typeModels[PlanPricesTypeRef.typeId], PlanPricesTypeRef), values)
}

export type PlanPricesParams = {

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

export class PlanPrices extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PlanPrices> { return PlanPricesTypeRef };
	

	get _id(): Id { return this._attrs[1461] }
	get monthlyReferencePrice(): NumberString { return this._attrs[1462] }
	get monthlyPrice(): NumberString { return this._attrs[1463] }
	get firstYearDiscount(): NumberString { return this._attrs[1464] }
	get additionalUserPriceMonthly(): NumberString { return this._attrs[1465] }
	get includedAliases(): NumberString { return this._attrs[1467] }
	get includedStorage(): NumberString { return this._attrs[1468] }
	get sharing(): boolean { return this._attrs[2099] }
	get business(): boolean { return this._attrs[2100] }
	get whitelabel(): boolean { return this._attrs[2101] }
	get customDomains(): NumberString { return this._attrs[2102] }
	get planName(): string { return this._attrs[2128] }
	get businessPlan(): boolean { return this._attrs[2129] }
    set businessPlan(v: boolean) { this._attrs[2129] = v }
	

	get planConfiguration(): PlanConfiguration { return this._attrs[2129] }
	set planConfiguration(a: PlanConfiguration)  { this._attrs[2127] = a } 
}
export const UpgradePriceServiceReturnTypeRef: TypeRef<UpgradePriceServiceReturn> = new TypeRef("sys", 1469)

export function createUpgradePriceServiceReturn(values: StrippedEntity<UpgradePriceServiceReturn>): UpgradePriceServiceReturn {
    return Object.assign(create(typeModels[UpgradePriceServiceReturnTypeRef.typeId], UpgradePriceServiceReturnTypeRef), values)
}

export type UpgradePriceServiceReturnParams = {

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

export class UpgradePriceServiceReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UpgradePriceServiceReturn> { return UpgradePriceServiceReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1470] }
	get messageTextId(): null | string { return this._attrs[1471] }
	get business(): boolean { return this._attrs[1472] }
	get bonusMonthsForYearlyPlan(): NumberString { return this._attrs[2084] }
	get firstMonthForFreeForYearlyPlan(): boolean { return this._attrs[2555] }
	get hasGlobalFirstYearDiscount(): boolean { return this._attrs[2613] }
	get globalCampaignName(): null | string { return this._attrs[2731] }
    set globalCampaignName(v: null | string) { this._attrs[2731] = v }
	

	get premiumPrices(): PlanPrices { return this._attrs[2731] }
	set premiumPrices(a: PlanPrices)  { this._attrs[1473] = a } 
	get proPrices(): PlanPrices { return this._attrs[2731] }
	set proPrices(a: PlanPrices)  { this._attrs[1474] = a } 
	get teamsPrices(): PlanPrices { return this._attrs[2731] }
	set teamsPrices(a: PlanPrices)  { this._attrs[1729] = a } 
	get premiumBusinessPrices(): PlanPrices { return this._attrs[2731] }
	set premiumBusinessPrices(a: PlanPrices)  { this._attrs[1866] = a } 
	get teamsBusinessPrices(): PlanPrices { return this._attrs[2731] }
	set teamsBusinessPrices(a: PlanPrices)  { this._attrs[1867] = a } 
	get freePrices(): PlanPrices { return this._attrs[2731] }
	set freePrices(a: PlanPrices)  { this._attrs[2078] = a } 
	get revolutionaryPrices(): PlanPrices { return this._attrs[2731] }
	set revolutionaryPrices(a: PlanPrices)  { this._attrs[2079] = a } 
	get legendaryPrices(): PlanPrices { return this._attrs[2731] }
	set legendaryPrices(a: PlanPrices)  { this._attrs[2080] = a } 
	get essentialPrices(): PlanPrices { return this._attrs[2731] }
	set essentialPrices(a: PlanPrices)  { this._attrs[2081] = a } 
	get advancedPrices(): PlanPrices { return this._attrs[2731] }
	set advancedPrices(a: PlanPrices)  { this._attrs[2082] = a } 
	get unlimitedPrices(): PlanPrices { return this._attrs[2731] }
	set unlimitedPrices(a: PlanPrices)  { this._attrs[2083] = a } 
	get plans(): PlanPrices[] { return this._attrs[2731] }
	set plans(a: PlanPrices[])  { this._attrs[2131] = a } 
}
export const RegistrationCaptchaServiceGetDataTypeRef: TypeRef<RegistrationCaptchaServiceGetData> = new TypeRef("sys", 1479)

export function createRegistrationCaptchaServiceGetData(values: StrippedEntity<RegistrationCaptchaServiceGetData>): RegistrationCaptchaServiceGetData {
    return Object.assign(create(typeModels[RegistrationCaptchaServiceGetDataTypeRef.typeId], RegistrationCaptchaServiceGetDataTypeRef), values)
}

export type RegistrationCaptchaServiceGetDataParams = {

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

export class RegistrationCaptchaServiceGetData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RegistrationCaptchaServiceGetData> { return RegistrationCaptchaServiceGetDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1480] }
	get campaignToken(): null | string { return this._attrs[1481] }
	get mailAddress(): string { return this._attrs[1482] }
	get signupToken(): null | string { return this._attrs[1731] }
	get paidSubscriptionSelected(): boolean { return this._attrs[1751] }
	get businessUseSelected(): boolean { return this._attrs[1752] }
	get timelockChallengeSolution(): null | string { return this._attrs[2623] }
	get language(): string { return this._attrs[2624] }
	get isAutomatedBrowser(): boolean { return this._attrs[2640] }
    set isAutomatedBrowser(v: boolean) { this._attrs[2640] = v }
	

	get adAttribution(): null | AdAttribution { return this._attrs[2640] }
	set adAttribution(a: AdAttribution)  { this._attrs[2689] = a } 
}
export const WebsocketEntityDataTypeRef: TypeRef<WebsocketEntityData> = new TypeRef("sys", 1483)

export function createWebsocketEntityData(values: StrippedEntity<WebsocketEntityData>): WebsocketEntityData {
    return Object.assign(create(typeModels[WebsocketEntityDataTypeRef.typeId], WebsocketEntityDataTypeRef), values)
}

export type WebsocketEntityDataParams = {

	_format: NumberString;
	eventBatchId: Id;
	eventBatchOwner: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	entityUpdates: EntityUpdate[];
}

export class WebsocketEntityData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WebsocketEntityData> { return WebsocketEntityDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1484] }
	get eventBatchId(): Id { return this._attrs[1485] }
	get eventBatchOwner(): Id { return this._attrs[1486] }
	get applicationVersionSum(): NumberString { return this._attrs[2557] }
	get applicationTypesHash(): string { return this._attrs[2558] }
    set applicationTypesHash(v: string) { this._attrs[2558] = v }
	

	get entityUpdates(): EntityUpdate[] { return this._attrs[2558] }
	set entityUpdates(a: EntityUpdate[])  { this._attrs[1487] = a } 
}
export const WebsocketCounterValueTypeRef: TypeRef<WebsocketCounterValue> = new TypeRef("sys", 1488)

export function createWebsocketCounterValue(values: StrippedEntity<WebsocketCounterValue>): WebsocketCounterValue {
    return Object.assign(create(typeModels[WebsocketCounterValueTypeRef.typeId], WebsocketCounterValueTypeRef), values)
}

export type WebsocketCounterValueParams = {

	_id: Id;
	counterId: Id;
	count: NumberString;
}

export class WebsocketCounterValue extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WebsocketCounterValue> { return WebsocketCounterValueTypeRef };
	

	get _id(): Id { return this._attrs[1489] }
	get counterId(): Id { return this._attrs[1490] }
	get count(): NumberString { return this._attrs[1491] }
    set count(v: NumberString) { this._attrs[1491] = v }
	
}
export const WebsocketCounterDataTypeRef: TypeRef<WebsocketCounterData> = new TypeRef("sys", 1492)

export function createWebsocketCounterData(values: StrippedEntity<WebsocketCounterData>): WebsocketCounterData {
    return Object.assign(create(typeModels[WebsocketCounterDataTypeRef.typeId], WebsocketCounterDataTypeRef), values)
}

export type WebsocketCounterDataParams = {

	_format: NumberString;
	mailGroup: Id;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;

	counterValues: WebsocketCounterValue[];
}

export class WebsocketCounterData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WebsocketCounterData> { return WebsocketCounterDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1493] }
	get mailGroup(): Id { return this._attrs[1494] }
	get applicationVersionSum(): NumberString { return this._attrs[2559] }
	get applicationTypesHash(): string { return this._attrs[2560] }
    set applicationTypesHash(v: string) { this._attrs[2560] = v }
	

	get counterValues(): WebsocketCounterValue[] { return this._attrs[2560] }
	set counterValues(a: WebsocketCounterValue[])  { this._attrs[1495] = a } 
}
export const CertificateInfoTypeRef: TypeRef<CertificateInfo> = new TypeRef("sys", 1500)

export function createCertificateInfo(values: StrippedEntity<CertificateInfo>): CertificateInfo {
    return Object.assign(create(typeModels[CertificateInfoTypeRef.typeId], CertificateInfoTypeRef), values)
}

export type CertificateInfoParams = {

	_id: Id;
	expiryDate: null | Date;
	state: NumberString;
	type: NumberString;

	certificate: null | Id;
}

export class CertificateInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CertificateInfo> { return CertificateInfoTypeRef };
	

	get _id(): Id { return this._attrs[1501] }
	get expiryDate(): null | Date { return this._attrs[1502] }
	get state(): NumberString { return this._attrs[1503] }
	get type(): NumberString { return this._attrs[1504] }
	

	get certificate(): null | Id { return this._attrs[1504] }
}
export const NotificationMailTemplateTypeRef: TypeRef<NotificationMailTemplate> = new TypeRef("sys", 1517)

export function createNotificationMailTemplate(values: StrippedEntity<NotificationMailTemplate>): NotificationMailTemplate {
    return Object.assign(create(typeModels[NotificationMailTemplateTypeRef.typeId], NotificationMailTemplateTypeRef), values)
}

export type NotificationMailTemplateParams = {

	_id: Id;
	language: string;
	body: string;
	subject: string;
}

export class NotificationMailTemplate extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NotificationMailTemplate> { return NotificationMailTemplateTypeRef };
	

	get _id(): Id { return this._attrs[1518] }
	get language(): string { return this._attrs[1519] }
	get body(): string { return this._attrs[1520] }
	get subject(): string { return this._attrs[1521] }
    set subject(v: string) { this._attrs[1521] = v }
	
}
export const CalendarEventRefTypeRef: TypeRef<CalendarEventRef> = new TypeRef("sys", 1532)

export function createCalendarEventRef(values: StrippedEntity<CalendarEventRef>): CalendarEventRef {
    return Object.assign(create(typeModels[CalendarEventRefTypeRef.typeId], CalendarEventRefTypeRef), values)
}

export type CalendarEventRefParams = {

	_id: Id;
	elementId: Id;
	listId: Id;
}

export class CalendarEventRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarEventRef> { return CalendarEventRefTypeRef };
	

	get _id(): Id { return this._attrs[1533] }
	get elementId(): Id { return this._attrs[1534] }
	get listId(): Id { return this._attrs[1535] }
	
}
export const AlarmInfoTypeRef: TypeRef<AlarmInfo> = new TypeRef("sys", 1536)

export function createAlarmInfo(values: StrippedEntity<AlarmInfo>): AlarmInfo {
    return Object.assign(create(typeModels[AlarmInfoTypeRef.typeId], AlarmInfoTypeRef), values)
}

export type AlarmInfoParams = {

	_id: Id;
	trigger: string;
	alarmIdentifier: string;

	calendarRef: CalendarEventRef;
}

export class AlarmInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AlarmInfo> { return AlarmInfoTypeRef };
	

	get _id(): Id { return this._attrs[1537] }
	get trigger(): string { return this._attrs[1538] }
	get alarmIdentifier(): string { return this._attrs[1539] }
	

	get calendarRef(): CalendarEventRef { return this._attrs[1539] }
	set calendarRef(a: CalendarEventRef)  { this._attrs[1540] = a } 
}
export const UserAlarmInfoTypeRef: TypeRef<UserAlarmInfo> = new TypeRef("sys", 1541)

export function createUserAlarmInfo(values: StrippedEntity<UserAlarmInfo>): UserAlarmInfo {
    return Object.assign(create(typeModels[UserAlarmInfoTypeRef.typeId], UserAlarmInfoTypeRef), values)
}

export type UserAlarmInfoParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	alarmInfo: AlarmInfo;
}

export class UserAlarmInfo extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAlarmInfo> { return UserAlarmInfoTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1543] }
	get _permissions(): Id { return this._attrs[1544] }
	get _format(): NumberString { return this._attrs[1545] }
	get _ownerGroup(): null | Id { return this._attrs[1546] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1547] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2233] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2702] }
	

	get alarmInfo(): AlarmInfo { return this._attrs[2702] }
	set alarmInfo(a: AlarmInfo)  { this._attrs[1548] = a } 
}
export const UserAlarmInfoListTypeTypeRef: TypeRef<UserAlarmInfoListType> = new TypeRef("sys", 1549)

export function createUserAlarmInfoListType(values: StrippedEntity<UserAlarmInfoListType>): UserAlarmInfoListType {
    return Object.assign(create(typeModels[UserAlarmInfoListTypeTypeRef.typeId], UserAlarmInfoListTypeTypeRef), values)
}

export type UserAlarmInfoListTypeParams = {

	_id: Id;

	alarms: Id;
}

export class UserAlarmInfoListType extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAlarmInfoListType> { return UserAlarmInfoListTypeTypeRef };
	

	get _id(): Id { return this._attrs[1550] }
	

	get alarms(): Id { return this._attrs[1550] }
}
export const NotificationSessionKeyTypeRef: TypeRef<NotificationSessionKey> = new TypeRef("sys", 1553)

export function createNotificationSessionKey(values: StrippedEntity<NotificationSessionKey>): NotificationSessionKey {
    return Object.assign(create(typeModels[NotificationSessionKeyTypeRef.typeId], NotificationSessionKeyTypeRef), values)
}

export type NotificationSessionKeyParams = {

	_id: Id;
	pushIdentifierSessionEncSessionKey: Uint8Array;

	pushIdentifier: IdTuple;
}

export class NotificationSessionKey extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<NotificationSessionKey> { return NotificationSessionKeyTypeRef };
	

	get _id(): Id { return this._attrs[1554] }
	get pushIdentifierSessionEncSessionKey(): Uint8Array { return this._attrs[1556] }
    set pushIdentifierSessionEncSessionKey(v: Uint8Array) { this._attrs[1556] = v }
	

	get pushIdentifier(): IdTuple { return this._attrs[1556] }
	set pushIdentifier(a: IdTuple)  { this._attrs[1555] = a } 
}
export const RepeatRuleTypeRef: TypeRef<RepeatRule> = new TypeRef("sys", 1557)

export function createRepeatRule(values: StrippedEntity<RepeatRule>): RepeatRule {
    return Object.assign(create(typeModels[RepeatRuleTypeRef.typeId], RepeatRuleTypeRef), values)
}

export type RepeatRuleParams = {

	_id: Id;
	frequency: NumberString;
	endType: NumberString;
	endValue: null | NumberString;
	interval: NumberString;
	timeZone: string;

	excludedDates: DateWrapper[];
	advancedRules: CalendarAdvancedRepeatRule[];
}

export class RepeatRule extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RepeatRule> { return RepeatRuleTypeRef };
	

	get _id(): Id { return this._attrs[1558] }
	get frequency(): NumberString { return this._attrs[1559] }
	get endType(): NumberString { return this._attrs[1560] }
	get endValue(): null | NumberString { return this._attrs[1561] }
	get interval(): NumberString { return this._attrs[1562] }
	get timeZone(): string { return this._attrs[1563] }
    set timeZone(v: string) { this._attrs[1563] = v }
	

	get excludedDates(): DateWrapper[] { return this._attrs[1563] }
	set excludedDates(a: DateWrapper[])  { this._attrs[2076] = a } 
	get advancedRules(): CalendarAdvancedRepeatRule[] { return this._attrs[1563] }
	set advancedRules(a: CalendarAdvancedRepeatRule[])  { this._attrs[2525] = a } 
}
export const AlarmNotificationTypeRef: TypeRef<AlarmNotification> = new TypeRef("sys", 1564)

export function createAlarmNotification(values: StrippedEntity<AlarmNotification>): AlarmNotification {
    return Object.assign(create(typeModels[AlarmNotificationTypeRef.typeId], AlarmNotificationTypeRef), values)
}

export type AlarmNotificationParams = {

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

export class AlarmNotification extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AlarmNotification> { return AlarmNotificationTypeRef };
	

	get _id(): Id { return this._attrs[1565] }
	get operation(): NumberString { return this._attrs[1566] }
	get summary(): string { return this._attrs[1567] }
	get eventStart(): Date { return this._attrs[1568] }
	get eventEnd(): Date { return this._attrs[1569] }
	

	get alarmInfo(): AlarmInfo { return this._attrs[1569] }
	get repeatRule(): null | RepeatRule { return this._attrs[1569] }
	get notificationSessionKeys(): NotificationSessionKey[] { return this._attrs[1569] }
	get user(): Id { return this._attrs[1569] }
}
export const AlarmServicePostTypeRef: TypeRef<AlarmServicePost> = new TypeRef("sys", 1576)

export function createAlarmServicePost(values: StrippedEntity<AlarmServicePost>): AlarmServicePost {
    return Object.assign(create(typeModels[AlarmServicePostTypeRef.typeId], AlarmServicePostTypeRef), values)
}

export type AlarmServicePostParams = {

	_format: NumberString;

	alarmNotifications: AlarmNotification[];
	userAlarmInfoData: UserAlarmInfoData[];
}

export class AlarmServicePost extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AlarmServicePost> { return AlarmServicePostTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[1577] }
    set _format(v: NumberString) { this._attrs[1577] = v }
	

	get alarmNotifications(): AlarmNotification[] { return this._attrs[1577] }
	set alarmNotifications(a: AlarmNotification[])  { this._attrs[1578] = a } 
	get userAlarmInfoData(): UserAlarmInfoData[] { return this._attrs[1577] }
	set userAlarmInfoData(a: UserAlarmInfoData[])  { this._attrs[2730] = a } 
}
export const DnsRecordTypeRef: TypeRef<DnsRecord> = new TypeRef("sys", 1581)

export function createDnsRecord(values: StrippedEntity<DnsRecord>): DnsRecord {
    return Object.assign(create(typeModels[DnsRecordTypeRef.typeId], DnsRecordTypeRef), values)
}

export type DnsRecordParams = {

	_id: Id;
	subdomain: null | string;
	type: NumberString;
	value: string;
}

export class DnsRecord extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DnsRecord> { return DnsRecordTypeRef };
	

	get _id(): Id { return this._attrs[1582] }
	get subdomain(): null | string { return this._attrs[1583] }
	get type(): NumberString { return this._attrs[1584] }
	get value(): string { return this._attrs[1585] }
    set value(v: string) { this._attrs[1585] = v }
	
}
export const CustomDomainCheckGetInTypeRef: TypeRef<CustomDomainCheckGetIn> = new TypeRef("sys", 1586)

export function createCustomDomainCheckGetIn(values: StrippedEntity<CustomDomainCheckGetIn>): CustomDomainCheckGetIn {
    return Object.assign(create(typeModels[CustomDomainCheckGetInTypeRef.typeId], CustomDomainCheckGetInTypeRef), values)
}

export type CustomDomainCheckGetInParams = {

	_format: NumberString;
	domain: string;

	customer: null | Id;
}

export class CustomDomainCheckGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomDomainCheckGetIn> { return CustomDomainCheckGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[1587] }
	get domain(): string { return this._attrs[1588] }
    set domain(v: string) { this._attrs[1588] = v }
	

	get customer(): null | Id { return this._attrs[1588] }
	set customer(a: Id)  { this._attrs[2053] = a } 
}
export const CustomDomainCheckGetOutTypeRef: TypeRef<CustomDomainCheckGetOut> = new TypeRef("sys", 1589)

export function createCustomDomainCheckGetOut(values: StrippedEntity<CustomDomainCheckGetOut>): CustomDomainCheckGetOut {
    return Object.assign(create(typeModels[CustomDomainCheckGetOutTypeRef.typeId], CustomDomainCheckGetOutTypeRef), values)
}

export type CustomDomainCheckGetOutParams = {

	_format: NumberString;
	checkResult: NumberString;

	missingRecords: DnsRecord[];
	invalidRecords: DnsRecord[];
	requiredRecords: DnsRecord[];
}

export class CustomDomainCheckGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomDomainCheckGetOut> { return CustomDomainCheckGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[1590] }
	get checkResult(): NumberString { return this._attrs[1591] }
    set checkResult(v: NumberString) { this._attrs[1591] = v }
	

	get missingRecords(): DnsRecord[] { return this._attrs[1591] }
	set missingRecords(a: DnsRecord[])  { this._attrs[1592] = a } 
	get invalidRecords(): DnsRecord[] { return this._attrs[1591] }
	set invalidRecords(a: DnsRecord[])  { this._attrs[1593] = a } 
	get requiredRecords(): DnsRecord[] { return this._attrs[1591] }
	set requiredRecords(a: DnsRecord[])  { this._attrs[1758] = a } 
}
export const CloseSessionServicePostTypeRef: TypeRef<CloseSessionServicePost> = new TypeRef("sys", 1595)

export function createCloseSessionServicePost(values: StrippedEntity<CloseSessionServicePost>): CloseSessionServicePost {
    return Object.assign(create(typeModels[CloseSessionServicePostTypeRef.typeId], CloseSessionServicePostTypeRef), values)
}

export type CloseSessionServicePostParams = {

	_format: NumberString;
	accessToken: string;

	sessionId: IdTuple;
}

export class CloseSessionServicePost extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CloseSessionServicePost> { return CloseSessionServicePostTypeRef };
	

	get _format(): NumberString { return this._attrs[1596] }
	get accessToken(): string { return this._attrs[1597] }
    set accessToken(v: string) { this._attrs[1597] = v }
	

	get sessionId(): IdTuple { return this._attrs[1597] }
	set sessionId(a: IdTuple)  { this._attrs[1598] = a } 
}
export const ReceivedGroupInvitationTypeRef: TypeRef<ReceivedGroupInvitation> = new TypeRef("sys", 1602)

export function createReceivedGroupInvitation(values: StrippedEntity<ReceivedGroupInvitation>): ReceivedGroupInvitation {
    return Object.assign(create(typeModels[ReceivedGroupInvitationTypeRef.typeId], ReceivedGroupInvitationTypeRef), values)
}

export type ReceivedGroupInvitationParams = {

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

export class ReceivedGroupInvitation extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReceivedGroupInvitation> { return ReceivedGroupInvitationTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1604] }
	get _permissions(): Id { return this._attrs[1605] }
	get _format(): NumberString { return this._attrs[1606] }
	get _ownerGroup(): null | Id { return this._attrs[1607] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1608] }
	get sharedGroupKey(): Uint8Array { return this._attrs[1609] }
	get sharedGroupName(): string { return this._attrs[1610] }
	get inviterMailAddress(): string { return this._attrs[1611] }
	get inviterName(): string { return this._attrs[1612] }
	get inviteeMailAddress(): string { return this._attrs[1613] }
	get capability(): NumberString { return this._attrs[1614] }
	get groupType(): null | NumberString { return this._attrs[1868] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2234] }
	get sharedGroupKeyVersion(): NumberString { return this._attrs[2280] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2705] }
	

	get sharedGroup(): Id { return this._attrs[2705] }
	set sharedGroup(a: Id)  { this._attrs[1615] = a } 
	get sentInvitation(): IdTuple { return this._attrs[2705] }
	set sentInvitation(a: IdTuple)  { this._attrs[1616] = a } 
}
export const UserGroupRootTypeRef: TypeRef<UserGroupRoot> = new TypeRef("sys", 1618)

export function createUserGroupRoot(values: StrippedEntity<UserGroupRoot>): UserGroupRoot {
    return Object.assign(create(typeModels[UserGroupRootTypeRef.typeId], UserGroupRootTypeRef), values)
}

export type UserGroupRootParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	invitations: Id;
	keyRotations: KeyRotationsRef;
	groupKeyUpdates: null | GroupKeyUpdatesRef;
}

export class UserGroupRoot extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserGroupRoot> { return UserGroupRootTypeRef };
	

	get _id(): Id { return this._attrs[1620] }
	get _permissions(): Id { return this._attrs[1621] }
	get _format(): NumberString { return this._attrs[1622] }
	get _ownerGroup(): null | Id { return this._attrs[1623] }
	

	get invitations(): Id { return this._attrs[1623] }
	get keyRotations(): KeyRotationsRef { return this._attrs[1623] }
	set keyRotations(a: KeyRotationsRef)  { this._attrs[2294] = a } 
	get groupKeyUpdates(): null | GroupKeyUpdatesRef { return this._attrs[1623] }
	set groupKeyUpdates(a: GroupKeyUpdatesRef)  { this._attrs[2383] = a } 
}
export const PaymentErrorInfoTypeRef: TypeRef<PaymentErrorInfo> = new TypeRef("sys", 1632)

export function createPaymentErrorInfo(values: StrippedEntity<PaymentErrorInfo>): PaymentErrorInfo {
    return Object.assign(create(typeModels[PaymentErrorInfoTypeRef.typeId], PaymentErrorInfoTypeRef), values)
}

export type PaymentErrorInfoParams = {

	_id: Id;
	errorTime: Date;
	errorCode: string;
	thirdPartyErrorId: string;
}

export class PaymentErrorInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PaymentErrorInfo> { return PaymentErrorInfoTypeRef };
	

	get _id(): Id { return this._attrs[1633] }
	get errorTime(): Date { return this._attrs[1634] }
	get errorCode(): string { return this._attrs[1635] }
	get thirdPartyErrorId(): string { return this._attrs[1636] }
	
}
export const InvoiceItemTypeRef: TypeRef<InvoiceItem> = new TypeRef("sys", 1641)

export function createInvoiceItem(values: StrippedEntity<InvoiceItem>): InvoiceItem {
    return Object.assign(create(typeModels[InvoiceItemTypeRef.typeId], InvoiceItemTypeRef), values)
}

export type InvoiceItemParams = {

	_id: Id;
	amount: NumberString;
	type: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
	singleType: boolean;
}

export class InvoiceItem extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InvoiceItem> { return InvoiceItemTypeRef };
	

	get _id(): Id { return this._attrs[1642] }
	get amount(): NumberString { return this._attrs[1643] }
	get type(): NumberString { return this._attrs[1644] }
	get singlePrice(): null | NumberString { return this._attrs[1645] }
	get totalPrice(): NumberString { return this._attrs[1646] }
	get startDate(): null | Date { return this._attrs[1647] }
	get endDate(): null | Date { return this._attrs[1648] }
	get singleType(): boolean { return this._attrs[1649] }
	
}
export const InvoiceTypeRef: TypeRef<Invoice> = new TypeRef("sys", 1650)

export function createInvoice(values: StrippedEntity<Invoice>): Invoice {
    return Object.assign(create(typeModels[InvoiceTypeRef.typeId], InvoiceTypeRef), values)
}

export type InvoiceParams = {

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

export class Invoice extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Invoice> { return InvoiceTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[1652] }
	get _permissions(): Id { return this._attrs[1653] }
	get _format(): NumberString { return this._attrs[1654] }
	get _ownerGroup(): null | Id { return this._attrs[1655] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1656] }
	get type(): NumberString { return this._attrs[1657] }
	get date(): Date { return this._attrs[1658] }
	get paymentMethod(): NumberString { return this._attrs[1659] }
	get country(): string { return this._attrs[1660] }
	get address(): string { return this._attrs[1661] }
	get business(): boolean { return this._attrs[1662] }
	get vatIdNumber(): null | string { return this._attrs[1663] }
	get vatRate(): NumberString { return this._attrs[1664] }
	get vat(): NumberString { return this._attrs[1665] }
	get subTotal(): NumberString { return this._attrs[1666] }
	get grandTotal(): NumberString { return this._attrs[1667] }
	get adminUser(): null | string { return this._attrs[1668] }
	get reason(): null | string { return this._attrs[1669] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2235] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2710] }
	

	get items(): InvoiceItem[] { return this._attrs[2710] }
	get customer(): Id { return this._attrs[2710] }
	get bookings(): IdTuple[] { return this._attrs[2710] }
}
export const MissedNotificationTypeRef: TypeRef<MissedNotification> = new TypeRef("sys", 1693)

export function createMissedNotification(values: StrippedEntity<MissedNotification>): MissedNotification {
    return Object.assign(create(typeModels[MissedNotificationTypeRef.typeId], MissedNotificationTypeRef), values)
}

export type MissedNotificationParams = {

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

export class MissedNotification extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MissedNotification> { return MissedNotificationTypeRef };
	
	_errors: Object = {} 

	get _id(): Id { return this._attrs[1695] }
	get _permissions(): Id { return this._attrs[1696] }
	get _format(): NumberString { return this._attrs[1697] }
	get _ownerGroup(): null | Id { return this._attrs[1698] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1699] }
	get lastProcessedNotificationId(): null | Id { return this._attrs[1722] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2236] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2713] }
	

	get notificationInfos(): NotificationInfo[] { return this._attrs[2713] }
	set notificationInfos(a: NotificationInfo[])  { this._attrs[1702] = a } 
	get alarmNotifications(): AlarmNotification[] { return this._attrs[2713] }
	set alarmNotifications(a: AlarmNotification[])  { this._attrs[1703] = a } 
}
export const BrandingDomainGetReturnTypeRef: TypeRef<BrandingDomainGetReturn> = new TypeRef("sys", 1723)

export function createBrandingDomainGetReturn(values: StrippedEntity<BrandingDomainGetReturn>): BrandingDomainGetReturn {
    return Object.assign(create(typeModels[BrandingDomainGetReturnTypeRef.typeId], BrandingDomainGetReturnTypeRef), values)
}

export type BrandingDomainGetReturnParams = {

	_format: NumberString;

	certificateInfo: null | CertificateInfo;
}

export class BrandingDomainGetReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BrandingDomainGetReturn> { return BrandingDomainGetReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1724] }
    set _format(v: NumberString) { this._attrs[1724] = v }
	

	get certificateInfo(): null | CertificateInfo { return this._attrs[1724] }
	set certificateInfo(a: CertificateInfo)  { this._attrs[1725] = a } 
}
export const RejectedSenderTypeRef: TypeRef<RejectedSender> = new TypeRef("sys", 1736)

export function createRejectedSender(values: StrippedEntity<RejectedSender>): RejectedSender {
    return Object.assign(create(typeModels[RejectedSenderTypeRef.typeId], RejectedSenderTypeRef), values)
}

export type RejectedSenderParams = {

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

export class RejectedSender extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RejectedSender> { return RejectedSenderTypeRef };
	

	get _id(): IdTuple { return this._attrs[1738] }
	get _permissions(): Id { return this._attrs[1739] }
	get _format(): NumberString { return this._attrs[1740] }
	get _ownerGroup(): null | Id { return this._attrs[1741] }
	get senderMailAddress(): string { return this._attrs[1742] }
	get senderIp(): string { return this._attrs[1743] }
	get senderHostname(): string { return this._attrs[1744] }
	get recipientMailAddress(): string { return this._attrs[1745] }
	get reason(): string { return this._attrs[1746] }
	
}
export const RejectedSendersRefTypeRef: TypeRef<RejectedSendersRef> = new TypeRef("sys", 1747)

export function createRejectedSendersRef(values: StrippedEntity<RejectedSendersRef>): RejectedSendersRef {
    return Object.assign(create(typeModels[RejectedSendersRefTypeRef.typeId], RejectedSendersRefTypeRef), values)
}

export type RejectedSendersRefParams = {

	_id: Id;

	items: Id;
}

export class RejectedSendersRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RejectedSendersRef> { return RejectedSendersRefTypeRef };
	

	get _id(): Id { return this._attrs[1748] }
	

	get items(): Id { return this._attrs[1748] }
}
export const SecondFactorAuthDeleteDataTypeRef: TypeRef<SecondFactorAuthDeleteData> = new TypeRef("sys", 1755)

export function createSecondFactorAuthDeleteData(values: StrippedEntity<SecondFactorAuthDeleteData>): SecondFactorAuthDeleteData {
    return Object.assign(create(typeModels[SecondFactorAuthDeleteDataTypeRef.typeId], SecondFactorAuthDeleteDataTypeRef), values)
}

export type SecondFactorAuthDeleteDataParams = {

	_format: NumberString;

	session: IdTuple;
}

export class SecondFactorAuthDeleteData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SecondFactorAuthDeleteData> { return SecondFactorAuthDeleteDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1756] }
    set _format(v: NumberString) { this._attrs[1756] = v }
	

	get session(): IdTuple { return this._attrs[1756] }
}
export const TakeOverDeletedAddressDataTypeRef: TypeRef<TakeOverDeletedAddressData> = new TypeRef("sys", 1759)

export function createTakeOverDeletedAddressData(values: StrippedEntity<TakeOverDeletedAddressData>): TakeOverDeletedAddressData {
    return Object.assign(create(typeModels[TakeOverDeletedAddressDataTypeRef.typeId], TakeOverDeletedAddressDataTypeRef), values)
}

export type TakeOverDeletedAddressDataParams = {

	_format: NumberString;
	mailAddress: string;
	authVerifier: string;
	recoverCodeVerifier: null | string;
	targetAccountMailAddress: string;
}

export class TakeOverDeletedAddressData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<TakeOverDeletedAddressData> { return TakeOverDeletedAddressDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1760] }
	get mailAddress(): string { return this._attrs[1761] }
	get authVerifier(): string { return this._attrs[1762] }
	get recoverCodeVerifier(): null | string { return this._attrs[1763] }
	get targetAccountMailAddress(): string { return this._attrs[1764] }
    set targetAccountMailAddress(v: string) { this._attrs[1764] = v }
	
}
export const WebsocketLeaderStatusTypeRef: TypeRef<WebsocketLeaderStatus> = new TypeRef("sys", 1766)

export function createWebsocketLeaderStatus(values: StrippedEntity<WebsocketLeaderStatus>): WebsocketLeaderStatus {
    return Object.assign(create(typeModels[WebsocketLeaderStatusTypeRef.typeId], WebsocketLeaderStatusTypeRef), values)
}

export type WebsocketLeaderStatusParams = {

	_format: NumberString;
	leaderStatus: boolean;
	applicationVersionSum: null | NumberString;
	applicationTypesHash: null | string;
}

export class WebsocketLeaderStatus extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WebsocketLeaderStatus> { return WebsocketLeaderStatusTypeRef };
	

	get _format(): NumberString { return this._attrs[1767] }
	get leaderStatus(): boolean { return this._attrs[1768] }
	get applicationVersionSum(): null | NumberString { return this._attrs[2561] }
	get applicationTypesHash(): null | string { return this._attrs[2562] }
    set applicationTypesHash(v: null | string) { this._attrs[2562] = v }
	
}
export const GiftCardTypeRef: TypeRef<GiftCard> = new TypeRef("sys", 1769)

export function createGiftCard(values: StrippedEntity<GiftCard>): GiftCard {
    return Object.assign(create(typeModels[GiftCardTypeRef.typeId], GiftCardTypeRef), values)
}

export type GiftCardParams = {

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

export class GiftCard extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCard> { return GiftCardTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[1771] }
	get _permissions(): Id { return this._attrs[1772] }
	get _format(): NumberString { return this._attrs[1773] }
	get _ownerGroup(): null | Id { return this._attrs[1774] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[1775] }
	get status(): NumberString { return this._attrs[1776] }
	get value(): NumberString { return this._attrs[1777] }
	get message(): string { return this._attrs[1778] }
	get orderDate(): Date { return this._attrs[1779] }
	get migrated(): boolean { return this._attrs[1993] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2238] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2717] }
	
}
export const GiftCardsRefTypeRef: TypeRef<GiftCardsRef> = new TypeRef("sys", 1791)

export function createGiftCardsRef(values: StrippedEntity<GiftCardsRef>): GiftCardsRef {
    return Object.assign(create(typeModels[GiftCardsRefTypeRef.typeId], GiftCardsRefTypeRef), values)
}

export type GiftCardsRefParams = {

	_id: Id;

	items: Id;
}

export class GiftCardsRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCardsRef> { return GiftCardsRefTypeRef };
	

	get _id(): Id { return this._attrs[1792] }
	

	get items(): Id { return this._attrs[1792] }
}
export const GiftCardOptionTypeRef: TypeRef<GiftCardOption> = new TypeRef("sys", 1795)

export function createGiftCardOption(values: StrippedEntity<GiftCardOption>): GiftCardOption {
    return Object.assign(create(typeModels[GiftCardOptionTypeRef.typeId], GiftCardOptionTypeRef), values)
}

export type GiftCardOptionParams = {

	_id: Id;
	value: NumberString;
}

export class GiftCardOption extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCardOption> { return GiftCardOptionTypeRef };
	

	get _id(): Id { return this._attrs[1796] }
	get value(): NumberString { return this._attrs[1797] }
    set value(v: NumberString) { this._attrs[1797] = v }
	
}
export const GiftCardGetReturnTypeRef: TypeRef<GiftCardGetReturn> = new TypeRef("sys", 1798)

export function createGiftCardGetReturn(values: StrippedEntity<GiftCardGetReturn>): GiftCardGetReturn {
    return Object.assign(create(typeModels[GiftCardGetReturnTypeRef.typeId], GiftCardGetReturnTypeRef), values)
}

export type GiftCardGetReturnParams = {

	_format: NumberString;
	maxPerPeriod: NumberString;
	period: NumberString;

	options: GiftCardOption[];
}

export class GiftCardGetReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCardGetReturn> { return GiftCardGetReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1799] }
	get maxPerPeriod(): NumberString { return this._attrs[1800] }
	get period(): NumberString { return this._attrs[1801] }
    set period(v: NumberString) { this._attrs[1801] = v }
	

	get options(): GiftCardOption[] { return this._attrs[1801] }
	set options(a: GiftCardOption[])  { this._attrs[1802] = a } 
}
export const GiftCardCreateDataTypeRef: TypeRef<GiftCardCreateData> = new TypeRef("sys", 1803)

export function createGiftCardCreateData(values: StrippedEntity<GiftCardCreateData>): GiftCardCreateData {
    return Object.assign(create(typeModels[GiftCardCreateDataTypeRef.typeId], GiftCardCreateDataTypeRef), values)
}

export type GiftCardCreateDataParams = {

	_format: NumberString;
	message: string;
	ownerEncSessionKey: Uint8Array;
	value: NumberString;
	keyHash: Uint8Array;
	ownerKeyVersion: NumberString;
}

export class GiftCardCreateData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCardCreateData> { return GiftCardCreateDataTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[1804] }
	get message(): string { return this._attrs[1805] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[1806] }
	get value(): NumberString { return this._attrs[1807] }
	get keyHash(): Uint8Array { return this._attrs[1809] }
	get ownerKeyVersion(): NumberString { return this._attrs[2275] }
    set ownerKeyVersion(v: NumberString) { this._attrs[2275] = v }
	
}
export const GiftCardDeleteDataTypeRef: TypeRef<GiftCardDeleteData> = new TypeRef("sys", 1810)

export function createGiftCardDeleteData(values: StrippedEntity<GiftCardDeleteData>): GiftCardDeleteData {
    return Object.assign(create(typeModels[GiftCardDeleteDataTypeRef.typeId], GiftCardDeleteDataTypeRef), values)
}

export type GiftCardDeleteDataParams = {

	_format: NumberString;

	giftCard: IdTuple;
}

export class GiftCardDeleteData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCardDeleteData> { return GiftCardDeleteDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1811] }
    set _format(v: NumberString) { this._attrs[1811] = v }
	

	get giftCard(): IdTuple { return this._attrs[1811] }
}
export const GiftCardCreateReturnTypeRef: TypeRef<GiftCardCreateReturn> = new TypeRef("sys", 1813)

export function createGiftCardCreateReturn(values: StrippedEntity<GiftCardCreateReturn>): GiftCardCreateReturn {
    return Object.assign(create(typeModels[GiftCardCreateReturnTypeRef.typeId], GiftCardCreateReturnTypeRef), values)
}

export type GiftCardCreateReturnParams = {

	_format: NumberString;

	giftCard: IdTuple;
}

export class GiftCardCreateReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCardCreateReturn> { return GiftCardCreateReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[1814] }
    set _format(v: NumberString) { this._attrs[1814] = v }
	

	get giftCard(): IdTuple { return this._attrs[1814] }
}
export const GiftCardRedeemDataTypeRef: TypeRef<GiftCardRedeemData> = new TypeRef("sys", 1817)

export function createGiftCardRedeemData(values: StrippedEntity<GiftCardRedeemData>): GiftCardRedeemData {
    return Object.assign(create(typeModels[GiftCardRedeemDataTypeRef.typeId], GiftCardRedeemDataTypeRef), values)
}

export type GiftCardRedeemDataParams = {

	_format: NumberString;
	keyHash: Uint8Array;
	countryCode: string;

	giftCardInfo: Id;
}

export class GiftCardRedeemData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCardRedeemData> { return GiftCardRedeemDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1818] }
	get keyHash(): Uint8Array { return this._attrs[1820] }
	get countryCode(): string { return this._attrs[1995] }
    set countryCode(v: string) { this._attrs[1995] = v }
	

	get giftCardInfo(): Id { return this._attrs[1995] }
}
export const GiftCardRedeemGetReturnTypeRef: TypeRef<GiftCardRedeemGetReturn> = new TypeRef("sys", 1821)

export function createGiftCardRedeemGetReturn(values: StrippedEntity<GiftCardRedeemGetReturn>): GiftCardRedeemGetReturn {
    return Object.assign(create(typeModels[GiftCardRedeemGetReturnTypeRef.typeId], GiftCardRedeemGetReturnTypeRef), values)
}

export type GiftCardRedeemGetReturnParams = {

	_format: NumberString;
	message: string;
	value: NumberString;

	giftCard: IdTuple;
}

export class GiftCardRedeemGetReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GiftCardRedeemGetReturn> { return GiftCardRedeemGetReturnTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[1822] }
	get message(): string { return this._attrs[1824] }
	get value(): NumberString { return this._attrs[1825] }
	

	get giftCard(): IdTuple { return this._attrs[1825] }
}
export const Braintree3ds2RequestTypeRef: TypeRef<Braintree3ds2Request> = new TypeRef("sys", 1828)

export function createBraintree3ds2Request(values: StrippedEntity<Braintree3ds2Request>): Braintree3ds2Request {
    return Object.assign(create(typeModels[Braintree3ds2RequestTypeRef.typeId], Braintree3ds2RequestTypeRef), values)
}

export type Braintree3ds2RequestParams = {

	_id: Id;
	clientToken: string;
	nonce: string;
	bin: string;
}

export class Braintree3ds2Request extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Braintree3ds2Request> { return Braintree3ds2RequestTypeRef };
	

	get _id(): Id { return this._attrs[1829] }
	get clientToken(): string { return this._attrs[1830] }
	get nonce(): string { return this._attrs[1831] }
	get bin(): string { return this._attrs[1832] }
    set bin(v: string) { this._attrs[1832] = v }
	
}
export const Braintree3ds2ResponseTypeRef: TypeRef<Braintree3ds2Response> = new TypeRef("sys", 1833)

export function createBraintree3ds2Response(values: StrippedEntity<Braintree3ds2Response>): Braintree3ds2Response {
    return Object.assign(create(typeModels[Braintree3ds2ResponseTypeRef.typeId], Braintree3ds2ResponseTypeRef), values)
}

export type Braintree3ds2ResponseParams = {

	_id: Id;
	clientToken: string;
	nonce: string;
}

export class Braintree3ds2Response extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Braintree3ds2Response> { return Braintree3ds2ResponseTypeRef };
	

	get _id(): Id { return this._attrs[1834] }
	get clientToken(): string { return this._attrs[1835] }
	get nonce(): string { return this._attrs[1836] }
    set nonce(v: string) { this._attrs[1836] = v }
	
}
export const PaymentDataServicePostDataTypeRef: TypeRef<PaymentDataServicePostData> = new TypeRef("sys", 1837)

export function createPaymentDataServicePostData(values: StrippedEntity<PaymentDataServicePostData>): PaymentDataServicePostData {
    return Object.assign(create(typeModels[PaymentDataServicePostDataTypeRef.typeId], PaymentDataServicePostDataTypeRef), values)
}

export type PaymentDataServicePostDataParams = {

	_format: NumberString;

	braintree3dsResponse: Braintree3ds2Response;
}

export class PaymentDataServicePostData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PaymentDataServicePostData> { return PaymentDataServicePostDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1838] }
    set _format(v: NumberString) { this._attrs[1838] = v }
	

	get braintree3dsResponse(): Braintree3ds2Response { return this._attrs[1838] }
	set braintree3dsResponse(a: Braintree3ds2Response)  { this._attrs[1839] = a } 
}
export const PaymentDataServiceGetDataTypeRef: TypeRef<PaymentDataServiceGetData> = new TypeRef("sys", 1861)

export function createPaymentDataServiceGetData(values: StrippedEntity<PaymentDataServiceGetData>): PaymentDataServiceGetData {
    return Object.assign(create(typeModels[PaymentDataServiceGetDataTypeRef.typeId], PaymentDataServiceGetDataTypeRef), values)
}

export type PaymentDataServiceGetDataParams = {

	_format: NumberString;
	clientType: null | NumberString;
	subscriptionApp: NumberString;
}

export class PaymentDataServiceGetData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PaymentDataServiceGetData> { return PaymentDataServiceGetDataTypeRef };
	

	get _format(): NumberString { return this._attrs[1862] }
	get clientType(): null | NumberString { return this._attrs[1863] }
	get subscriptionApp(): NumberString { return this._attrs[2638] }
    set subscriptionApp(v: NumberString) { this._attrs[2638] = v }
	
}
export const TypeInfoTypeRef: TypeRef<TypeInfo> = new TypeRef("sys", 1869)

export function createTypeInfo(values: StrippedEntity<TypeInfo>): TypeInfo {
    return Object.assign(create(typeModels[TypeInfoTypeRef.typeId], TypeInfoTypeRef), values)
}

export type TypeInfoParams = {

	_id: Id;
	application: string;
	typeId: NumberString;
}

export class TypeInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<TypeInfo> { return TypeInfoTypeRef };
	

	get _id(): Id { return this._attrs[1870] }
	get application(): string { return this._attrs[1871] }
	get typeId(): NumberString { return this._attrs[1872] }
    set typeId(v: NumberString) { this._attrs[1872] = v }
	
}
export const ArchiveRefTypeRef: TypeRef<ArchiveRef> = new TypeRef("sys", 1873)

export function createArchiveRef(values: StrippedEntity<ArchiveRef>): ArchiveRef {
    return Object.assign(create(typeModels[ArchiveRefTypeRef.typeId], ArchiveRefTypeRef), values)
}

export type ArchiveRefParams = {

	_id: Id;
	archiveId: Id;
}

export class ArchiveRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ArchiveRef> { return ArchiveRefTypeRef };
	

	get _id(): Id { return this._attrs[1874] }
	get archiveId(): Id { return this._attrs[1875] }
	
}
export const ArchiveTypeTypeRef: TypeRef<ArchiveType> = new TypeRef("sys", 1876)

export function createArchiveType(values: StrippedEntity<ArchiveType>): ArchiveType {
    return Object.assign(create(typeModels[ArchiveTypeTypeRef.typeId], ArchiveTypeTypeRef), values)
}

export type ArchiveTypeParams = {

	_id: Id;

	type: TypeInfo;
	active: ArchiveRef;
	inactive: ArchiveRef[];
}

export class ArchiveType extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ArchiveType> { return ArchiveTypeTypeRef };
	

	get _id(): Id { return this._attrs[1877] }
	

	get type(): TypeInfo { return this._attrs[1877] }
	set type(a: TypeInfo)  { this._attrs[1878] = a } 
	get active(): ArchiveRef { return this._attrs[1877] }
	set active(a: ArchiveRef)  { this._attrs[1879] = a } 
	get inactive(): ArchiveRef[] { return this._attrs[1877] }
	set inactive(a: ArchiveRef[])  { this._attrs[1880] = a } 
}
export const BlobTypeRef: TypeRef<Blob> = new TypeRef("sys", 1882)

export function createBlob(values: StrippedEntity<Blob>): Blob {
    return Object.assign(create(typeModels[BlobTypeRef.typeId], BlobTypeRef), values)
}

export type BlobParams = {

	_id: Id;
	archiveId: Id;
	size: NumberString;
	blobId: Id;
}

export class Blob extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Blob> { return BlobTypeRef };
	

	get _id(): Id { return this._attrs[1883] }
	get archiveId(): Id { return this._attrs[1884] }
	get size(): NumberString { return this._attrs[1898] }
	get blobId(): Id { return this._attrs[1906] }
    set blobId(v: Id) { this._attrs[1906] = v }
	
}
export const WebauthnResponseDataTypeRef: TypeRef<WebauthnResponseData> = new TypeRef("sys", 1899)

export function createWebauthnResponseData(values: StrippedEntity<WebauthnResponseData>): WebauthnResponseData {
    return Object.assign(create(typeModels[WebauthnResponseDataTypeRef.typeId], WebauthnResponseDataTypeRef), values)
}

export type WebauthnResponseDataParams = {

	_id: Id;
	keyHandle: Uint8Array;
	clientData: Uint8Array;
	authenticatorData: Uint8Array;
	signature: Uint8Array;
}

export class WebauthnResponseData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<WebauthnResponseData> { return WebauthnResponseDataTypeRef };
	

	get _id(): Id { return this._attrs[1900] }
	get keyHandle(): Uint8Array { return this._attrs[1901] }
	get clientData(): Uint8Array { return this._attrs[1902] }
	get authenticatorData(): Uint8Array { return this._attrs[1903] }
	get signature(): Uint8Array { return this._attrs[1904] }
	
}
export const BlobReferenceTokenWrapperTypeRef: TypeRef<BlobReferenceTokenWrapper> = new TypeRef("sys", 1990)

export function createBlobReferenceTokenWrapper(values: StrippedEntity<BlobReferenceTokenWrapper>): BlobReferenceTokenWrapper {
    return Object.assign(create(typeModels[BlobReferenceTokenWrapperTypeRef.typeId], BlobReferenceTokenWrapperTypeRef), values)
}

export type BlobReferenceTokenWrapperParams = {

	_id: Id;
	blobReferenceToken: string;
}

export class BlobReferenceTokenWrapper extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobReferenceTokenWrapper> { return BlobReferenceTokenWrapperTypeRef };
	

	get _id(): Id { return this._attrs[1991] }
	get blobReferenceToken(): string { return this._attrs[1992] }
	
}
export const CustomerAccountTerminationRequestTypeRef: TypeRef<CustomerAccountTerminationRequest> = new TypeRef("sys", 2005)

export function createCustomerAccountTerminationRequest(values: StrippedEntity<CustomerAccountTerminationRequest>): CustomerAccountTerminationRequest {
    return Object.assign(create(typeModels[CustomerAccountTerminationRequestTypeRef.typeId], CustomerAccountTerminationRequestTypeRef), values)
}

export type CustomerAccountTerminationRequestParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	terminationDate: Date;
	terminationRequestDate: Date;

	customer: Id;
}

export class CustomerAccountTerminationRequest extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerAccountTerminationRequest> { return CustomerAccountTerminationRequestTypeRef };
	

	get _id(): IdTuple { return this._attrs[2007] }
	get _permissions(): Id { return this._attrs[2008] }
	get _format(): NumberString { return this._attrs[2009] }
	get _ownerGroup(): null | Id { return this._attrs[2010] }
	get terminationDate(): Date { return this._attrs[2012] }
	get terminationRequestDate(): Date { return this._attrs[2013] }
	

	get customer(): Id { return this._attrs[2013] }
	set customer(a: Id)  { this._attrs[2011] = a } 
}
export const CustomerAccountTerminationPostInTypeRef: TypeRef<CustomerAccountTerminationPostIn> = new TypeRef("sys", 2015)

export function createCustomerAccountTerminationPostIn(values: StrippedEntity<CustomerAccountTerminationPostIn>): CustomerAccountTerminationPostIn {
    return Object.assign(create(typeModels[CustomerAccountTerminationPostInTypeRef.typeId], CustomerAccountTerminationPostInTypeRef), values)
}

export type CustomerAccountTerminationPostInParams = {

	_format: NumberString;
	terminationDate: null | Date;

	surveyData: null | SurveyData;
}

export class CustomerAccountTerminationPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerAccountTerminationPostIn> { return CustomerAccountTerminationPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2016] }
	get terminationDate(): null | Date { return this._attrs[2017] }
	

	get surveyData(): null | SurveyData { return this._attrs[2017] }
	set surveyData(a: SurveyData)  { this._attrs[2313] = a } 
}
export const CustomerAccountTerminationPostOutTypeRef: TypeRef<CustomerAccountTerminationPostOut> = new TypeRef("sys", 2018)

export function createCustomerAccountTerminationPostOut(values: StrippedEntity<CustomerAccountTerminationPostOut>): CustomerAccountTerminationPostOut {
    return Object.assign(create(typeModels[CustomerAccountTerminationPostOutTypeRef.typeId], CustomerAccountTerminationPostOutTypeRef), values)
}

export type CustomerAccountTerminationPostOutParams = {

	_format: NumberString;

	terminationRequest: IdTuple;
}

export class CustomerAccountTerminationPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CustomerAccountTerminationPostOut> { return CustomerAccountTerminationPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2019] }
    set _format(v: NumberString) { this._attrs[2019] = v }
	

	get terminationRequest(): IdTuple { return this._attrs[2019] }
	set terminationRequest(a: IdTuple)  { this._attrs[2020] = a } 
}
export const MailAddressAvailabilityTypeRef: TypeRef<MailAddressAvailability> = new TypeRef("sys", 2026)

export function createMailAddressAvailability(values: StrippedEntity<MailAddressAvailability>): MailAddressAvailability {
    return Object.assign(create(typeModels[MailAddressAvailabilityTypeRef.typeId], MailAddressAvailabilityTypeRef), values)
}

export type MailAddressAvailabilityParams = {

	_id: Id;
	mailAddress: string;
	available: boolean;
}

export class MailAddressAvailability extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddressAvailability> { return MailAddressAvailabilityTypeRef };
	

	get _id(): Id { return this._attrs[2027] }
	get mailAddress(): string { return this._attrs[2028] }
	get available(): boolean { return this._attrs[2029] }
    set available(v: boolean) { this._attrs[2029] = v }
	
}
export const MultipleMailAddressAvailabilityDataTypeRef: TypeRef<MultipleMailAddressAvailabilityData> = new TypeRef("sys", 2030)

export function createMultipleMailAddressAvailabilityData(values: StrippedEntity<MultipleMailAddressAvailabilityData>): MultipleMailAddressAvailabilityData {
    return Object.assign(create(typeModels[MultipleMailAddressAvailabilityDataTypeRef.typeId], MultipleMailAddressAvailabilityDataTypeRef), values)
}

export type MultipleMailAddressAvailabilityDataParams = {

	_format: NumberString;
	signupToken: null | string;

	mailAddresses: StringWrapper[];
}

export class MultipleMailAddressAvailabilityData extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MultipleMailAddressAvailabilityData> { return MultipleMailAddressAvailabilityDataTypeRef };
	

	get _format(): NumberString { return this._attrs[2031] }
	get signupToken(): null | string { return this._attrs[2612] }
    set signupToken(v: null | string) { this._attrs[2612] = v }
	

	get mailAddresses(): StringWrapper[] { return this._attrs[2612] }
	set mailAddresses(a: StringWrapper[])  { this._attrs[2032] = a } 
}
export const MultipleMailAddressAvailabilityReturnTypeRef: TypeRef<MultipleMailAddressAvailabilityReturn> = new TypeRef("sys", 2033)

export function createMultipleMailAddressAvailabilityReturn(values: StrippedEntity<MultipleMailAddressAvailabilityReturn>): MultipleMailAddressAvailabilityReturn {
    return Object.assign(create(typeModels[MultipleMailAddressAvailabilityReturnTypeRef.typeId], MultipleMailAddressAvailabilityReturnTypeRef), values)
}

export type MultipleMailAddressAvailabilityReturnParams = {

	_format: NumberString;

	availabilities: MailAddressAvailability[];
}

export class MultipleMailAddressAvailabilityReturn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MultipleMailAddressAvailabilityReturn> { return MultipleMailAddressAvailabilityReturnTypeRef };
	

	get _format(): NumberString { return this._attrs[2034] }
    set _format(v: NumberString) { this._attrs[2034] = v }
	

	get availabilities(): MailAddressAvailability[] { return this._attrs[2034] }
	set availabilities(a: MailAddressAvailability[])  { this._attrs[2035] = a } 
}
export const InstanceSessionKeyTypeRef: TypeRef<InstanceSessionKey> = new TypeRef("sys", 2037)

export function createInstanceSessionKey(values: StrippedEntity<InstanceSessionKey>): InstanceSessionKey {
    return Object.assign(create(typeModels[InstanceSessionKeyTypeRef.typeId], InstanceSessionKeyTypeRef), values)
}

export type InstanceSessionKeyParams = {

	_id: Id;
	instanceList: Id;
	instanceId: Id;
	symEncSessionKey: Uint8Array;
	encryptionAuthStatus: null | Uint8Array;
	symKeyVersion: NumberString;
	keyVerificationState: null | Uint8Array;

	typeInfo: TypeInfo;
}

export class InstanceSessionKey extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InstanceSessionKey> { return InstanceSessionKeyTypeRef };
	

	get _id(): Id { return this._attrs[2038] }
	get instanceList(): Id { return this._attrs[2040] }
	get instanceId(): Id { return this._attrs[2041] }
	get symEncSessionKey(): Uint8Array { return this._attrs[2042] }
	get encryptionAuthStatus(): null | Uint8Array { return this._attrs[2159] }
	get symKeyVersion(): NumberString { return this._attrs[2254] }
	get keyVerificationState(): null | Uint8Array { return this._attrs[2639] }
	

	get typeInfo(): TypeInfo { return this._attrs[2639] }
	set typeInfo(a: TypeInfo)  { this._attrs[2039] = a } 
}
export const BucketKeyTypeRef: TypeRef<BucketKey> = new TypeRef("sys", 2043)

export function createBucketKey(values: StrippedEntity<BucketKey>): BucketKey {
    return Object.assign(create(typeModels[BucketKeyTypeRef.typeId], BucketKeyTypeRef), values)
}

export type BucketKeyParams = {

	_id: Id;
	pubEncBucketKey: null | Uint8Array;
	groupEncBucketKey: null | Uint8Array;
	protocolVersion: NumberString;
	recipientKeyVersion: NumberString;
	senderKeyVersion: null | NumberString;

	keyGroup: null | Id;
	bucketEncSessionKeys: InstanceSessionKey[];
}

export class BucketKey extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BucketKey> { return BucketKeyTypeRef };
	

	get _id(): Id { return this._attrs[2044] }
	get pubEncBucketKey(): null | Uint8Array { return this._attrs[2045] }
	get groupEncBucketKey(): null | Uint8Array { return this._attrs[2046] }
	get protocolVersion(): NumberString { return this._attrs[2158] }
	get recipientKeyVersion(): NumberString { return this._attrs[2252] }
	get senderKeyVersion(): null | NumberString { return this._attrs[2253] }
	

	get keyGroup(): null | Id { return this._attrs[2253] }
	get bucketEncSessionKeys(): InstanceSessionKey[] { return this._attrs[2253] }
}
export const UpdateSessionKeysPostInTypeRef: TypeRef<UpdateSessionKeysPostIn> = new TypeRef("sys", 2049)

export function createUpdateSessionKeysPostIn(values: StrippedEntity<UpdateSessionKeysPostIn>): UpdateSessionKeysPostIn {
    return Object.assign(create(typeModels[UpdateSessionKeysPostInTypeRef.typeId], UpdateSessionKeysPostInTypeRef), values)
}

export type UpdateSessionKeysPostInParams = {

	_format: NumberString;

	ownerEncSessionKeys: InstanceSessionKey[];
}

export class UpdateSessionKeysPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UpdateSessionKeysPostIn> { return UpdateSessionKeysPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2050] }
    set _format(v: NumberString) { this._attrs[2050] = v }
	

	get ownerEncSessionKeys(): InstanceSessionKey[] { return this._attrs[2050] }
	set ownerEncSessionKeys(a: InstanceSessionKey[])  { this._attrs[2051] = a } 
}
export const ReferralCodeGetInTypeRef: TypeRef<ReferralCodeGetIn> = new TypeRef("sys", 2062)

export function createReferralCodeGetIn(values: StrippedEntity<ReferralCodeGetIn>): ReferralCodeGetIn {
    return Object.assign(create(typeModels[ReferralCodeGetInTypeRef.typeId], ReferralCodeGetInTypeRef), values)
}

export type ReferralCodeGetInParams = {

	_format: NumberString;

	referralCode: Id;
}

export class ReferralCodeGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReferralCodeGetIn> { return ReferralCodeGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[2063] }
    set _format(v: NumberString) { this._attrs[2063] = v }
	

	get referralCode(): Id { return this._attrs[2063] }
	set referralCode(a: Id)  { this._attrs[2064] = a } 
}
export const ReferralCodePostInTypeRef: TypeRef<ReferralCodePostIn> = new TypeRef("sys", 2065)

export function createReferralCodePostIn(values: StrippedEntity<ReferralCodePostIn>): ReferralCodePostIn {
    return Object.assign(create(typeModels[ReferralCodePostInTypeRef.typeId], ReferralCodePostInTypeRef), values)
}

export type ReferralCodePostInParams = {

	_format: NumberString;
}

export class ReferralCodePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReferralCodePostIn> { return ReferralCodePostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2066] }
    set _format(v: NumberString) { this._attrs[2066] = v }
	
}
export const ReferralCodePostOutTypeRef: TypeRef<ReferralCodePostOut> = new TypeRef("sys", 2067)

export function createReferralCodePostOut(values: StrippedEntity<ReferralCodePostOut>): ReferralCodePostOut {
    return Object.assign(create(typeModels[ReferralCodePostOutTypeRef.typeId], ReferralCodePostOutTypeRef), values)
}

export type ReferralCodePostOutParams = {

	_format: NumberString;

	referralCode: Id;
}

export class ReferralCodePostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ReferralCodePostOut> { return ReferralCodePostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2068] }
    set _format(v: NumberString) { this._attrs[2068] = v }
	

	get referralCode(): Id { return this._attrs[2068] }
	set referralCode(a: Id)  { this._attrs[2069] = a } 
}
export const DateWrapperTypeRef: TypeRef<DateWrapper> = new TypeRef("sys", 2073)

export function createDateWrapper(values: StrippedEntity<DateWrapper>): DateWrapper {
    return Object.assign(create(typeModels[DateWrapperTypeRef.typeId], DateWrapperTypeRef), values)
}

export type DateWrapperParams = {

	_id: Id;
	date: Date;
}

export class DateWrapper extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DateWrapper> { return DateWrapperTypeRef };
	

	get _id(): Id { return this._attrs[2074] }
	get date(): Date { return this._attrs[2075] }
	
}
export const MailAddressAliasGetInTypeRef: TypeRef<MailAddressAliasGetIn> = new TypeRef("sys", 2095)

export function createMailAddressAliasGetIn(values: StrippedEntity<MailAddressAliasGetIn>): MailAddressAliasGetIn {
    return Object.assign(create(typeModels[MailAddressAliasGetInTypeRef.typeId], MailAddressAliasGetInTypeRef), values)
}

export type MailAddressAliasGetInParams = {

	_format: NumberString;

	targetGroup: Id;
}

export class MailAddressAliasGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MailAddressAliasGetIn> { return MailAddressAliasGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[2096] }
    set _format(v: NumberString) { this._attrs[2096] = v }
	

	get targetGroup(): Id { return this._attrs[2096] }
	set targetGroup(a: Id)  { this._attrs[2097] = a } 
}
export const PlanConfigurationTypeRef: TypeRef<PlanConfiguration> = new TypeRef("sys", 2104)

export function createPlanConfiguration(values: StrippedEntity<PlanConfiguration>): PlanConfiguration {
    return Object.assign(create(typeModels[PlanConfigurationTypeRef.typeId], PlanConfigurationTypeRef), values)
}

export type PlanConfigurationParams = {

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

export class PlanConfiguration extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PlanConfiguration> { return PlanConfigurationTypeRef };
	

	get _id(): Id { return this._attrs[2105] }
	get nbrOfAliases(): NumberString { return this._attrs[2106] }
	get storageGb(): NumberString { return this._attrs[2107] }
	get sharing(): boolean { return this._attrs[2108] }
	get eventInvites(): boolean { return this._attrs[2109] }
	get whitelabel(): boolean { return this._attrs[2110] }
	get customDomainType(): NumberString { return this._attrs[2111] }
	get multiUser(): boolean { return this._attrs[2112] }
	get templates(): boolean { return this._attrs[2113] }
	get autoResponder(): boolean { return this._attrs[2130] }
	get contactList(): boolean { return this._attrs[2136] }
	get maxLabels(): NumberString { return this._attrs[2526] }
	get scheduledMails(): boolean { return this._attrs[2662] }
	get drive(): boolean { return this._attrs[2700] }
    set drive(v: boolean) { this._attrs[2700] = v }
	
}
export const PlanServiceGetOutTypeRef: TypeRef<PlanServiceGetOut> = new TypeRef("sys", 2115)

export function createPlanServiceGetOut(values: StrippedEntity<PlanServiceGetOut>): PlanServiceGetOut {
    return Object.assign(create(typeModels[PlanServiceGetOutTypeRef.typeId], PlanServiceGetOutTypeRef), values)
}

export type PlanServiceGetOutParams = {

	_format: NumberString;

	config: PlanConfiguration;
}

export class PlanServiceGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PlanServiceGetOut> { return PlanServiceGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2116] }
    set _format(v: NumberString) { this._attrs[2116] = v }
	

	get config(): PlanConfiguration { return this._attrs[2116] }
	set config(a: PlanConfiguration)  { this._attrs[2117] = a } 
}
export const PublicKeyPutInTypeRef: TypeRef<PublicKeyPutIn> = new TypeRef("sys", 2150)

export function createPublicKeyPutIn(values: StrippedEntity<PublicKeyPutIn>): PublicKeyPutIn {
    return Object.assign(create(typeModels[PublicKeyPutInTypeRef.typeId], PublicKeyPutInTypeRef), values)
}

export type PublicKeyPutInParams = {

	_format: NumberString;
	pubEccKey: Uint8Array;
	symEncPrivEccKey: Uint8Array;

	keyGroup: Id;
}

export class PublicKeyPutIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PublicKeyPutIn> { return PublicKeyPutInTypeRef };
	

	get _format(): NumberString { return this._attrs[2151] }
	get pubEccKey(): Uint8Array { return this._attrs[2152] }
	get symEncPrivEccKey(): Uint8Array { return this._attrs[2153] }
	

	get keyGroup(): Id { return this._attrs[2153] }
	set keyGroup(a: Id)  { this._attrs[2154] = a } 
}
export const InvoiceDataItemTypeRef: TypeRef<InvoiceDataItem> = new TypeRef("sys", 2162)

export function createInvoiceDataItem(values: StrippedEntity<InvoiceDataItem>): InvoiceDataItem {
    return Object.assign(create(typeModels[InvoiceDataItemTypeRef.typeId], InvoiceDataItemTypeRef), values)
}

export type InvoiceDataItemParams = {

	_id: Id;
	amount: NumberString;
	itemType: NumberString;
	singlePrice: null | NumberString;
	totalPrice: NumberString;
	startDate: null | Date;
	endDate: null | Date;
}

export class InvoiceDataItem extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InvoiceDataItem> { return InvoiceDataItemTypeRef };
	

	get _id(): Id { return this._attrs[2163] }
	get amount(): NumberString { return this._attrs[2164] }
	get itemType(): NumberString { return this._attrs[2165] }
	get singlePrice(): null | NumberString { return this._attrs[2166] }
	get totalPrice(): NumberString { return this._attrs[2167] }
	get startDate(): null | Date { return this._attrs[2168] }
	get endDate(): null | Date { return this._attrs[2169] }
	
}
export const InvoiceDataGetOutTypeRef: TypeRef<InvoiceDataGetOut> = new TypeRef("sys", 2170)

export function createInvoiceDataGetOut(values: StrippedEntity<InvoiceDataGetOut>): InvoiceDataGetOut {
    return Object.assign(create(typeModels[InvoiceDataGetOutTypeRef.typeId], InvoiceDataGetOutTypeRef), values)
}

export type InvoiceDataGetOutParams = {

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

export class InvoiceDataGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InvoiceDataGetOut> { return InvoiceDataGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2171] }
	get invoiceId(): Id { return this._attrs[2172] }
	get invoiceType(): NumberString { return this._attrs[2173] }
	get date(): Date { return this._attrs[2174] }
	get paymentMethod(): NumberString { return this._attrs[2175] }
	get country(): string { return this._attrs[2176] }
	get address(): string { return this._attrs[2177] }
	get vatIdNumber(): null | string { return this._attrs[2178] }
	get vatRate(): NumberString { return this._attrs[2179] }
	get vat(): NumberString { return this._attrs[2180] }
	get subTotal(): NumberString { return this._attrs[2181] }
	get grandTotal(): NumberString { return this._attrs[2182] }
	get vatType(): NumberString { return this._attrs[2183] }
	

	get items(): InvoiceDataItem[] { return this._attrs[2183] }
}
export const InvoiceDataGetInTypeRef: TypeRef<InvoiceDataGetIn> = new TypeRef("sys", 2185)

export function createInvoiceDataGetIn(values: StrippedEntity<InvoiceDataGetIn>): InvoiceDataGetIn {
    return Object.assign(create(typeModels[InvoiceDataGetInTypeRef.typeId], InvoiceDataGetInTypeRef), values)
}

export type InvoiceDataGetInParams = {

	_format: NumberString;
	invoiceNumber: string;
}

export class InvoiceDataGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InvoiceDataGetIn> { return InvoiceDataGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[2186] }
	get invoiceNumber(): string { return this._attrs[2187] }
    set invoiceNumber(v: string) { this._attrs[2187] = v }
	
}
export const ChangeKdfPostInTypeRef: TypeRef<ChangeKdfPostIn> = new TypeRef("sys", 2198)

export function createChangeKdfPostIn(values: StrippedEntity<ChangeKdfPostIn>): ChangeKdfPostIn {
    return Object.assign(create(typeModels[ChangeKdfPostInTypeRef.typeId], ChangeKdfPostInTypeRef), values)
}

export type ChangeKdfPostInParams = {

	_format: NumberString;
	verifier: Uint8Array;
	salt: Uint8Array;
	pwEncUserGroupKey: Uint8Array;
	oldVerifier: Uint8Array;
	kdfVersion: NumberString;
	userGroupKeyVersion: NumberString;
}

export class ChangeKdfPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ChangeKdfPostIn> { return ChangeKdfPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2199] }
	get verifier(): Uint8Array { return this._attrs[2200] }
	get salt(): Uint8Array { return this._attrs[2201] }
	get pwEncUserGroupKey(): Uint8Array { return this._attrs[2202] }
	get oldVerifier(): Uint8Array { return this._attrs[2203] }
	get kdfVersion(): NumberString { return this._attrs[2204] }
	get userGroupKeyVersion(): NumberString { return this._attrs[2410] }
    set userGroupKeyVersion(v: NumberString) { this._attrs[2410] = v }
	
}
export const GroupKeyTypeRef: TypeRef<GroupKey> = new TypeRef("sys", 2255)

export function createGroupKey(values: StrippedEntity<GroupKey>): GroupKey {
    return Object.assign(create(typeModels[GroupKeyTypeRef.typeId], GroupKeyTypeRef), values)
}

export type GroupKeyParams = {

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

export class GroupKey extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupKey> { return GroupKeyTypeRef };
	

	get _id(): IdTuple { return this._attrs[2257] }
	get _permissions(): Id { return this._attrs[2258] }
	get _format(): NumberString { return this._attrs[2259] }
	get _ownerGroup(): null | Id { return this._attrs[2260] }
	get ownerEncGKey(): Uint8Array { return this._attrs[2261] }
	get ownerKeyVersion(): NumberString { return this._attrs[2262] }
	get adminGroupEncGKey(): null | Uint8Array { return this._attrs[2263] }
	get adminGroupKeyVersion(): null | NumberString { return this._attrs[2265] }
    set adminGroupKeyVersion(v: null | NumberString) { this._attrs[2265] = v }
	

	get keyPair(): null | KeyPair { return this._attrs[2265] }
	set keyPair(a: KeyPair)  { this._attrs[2266] = a } 
	get pubAdminGroupEncGKey(): null | PubEncKeyData { return this._attrs[2265] }
}
export const GroupKeysRefTypeRef: TypeRef<GroupKeysRef> = new TypeRef("sys", 2267)

export function createGroupKeysRef(values: StrippedEntity<GroupKeysRef>): GroupKeysRef {
    return Object.assign(create(typeModels[GroupKeysRefTypeRef.typeId], GroupKeysRefTypeRef), values)
}

export type GroupKeysRefParams = {

	_id: Id;

	list: Id;
}

export class GroupKeysRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupKeysRef> { return GroupKeysRefTypeRef };
	

	get _id(): Id { return this._attrs[2268] }
	

	get list(): Id { return this._attrs[2268] }
}
export const KeyRotationTypeRef: TypeRef<KeyRotation> = new TypeRef("sys", 2283)

export function createKeyRotation(values: StrippedEntity<KeyRotation>): KeyRotation {
    return Object.assign(create(typeModels[KeyRotationTypeRef.typeId], KeyRotationTypeRef), values)
}

export type KeyRotationParams = {

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

export class KeyRotation extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<KeyRotation> { return KeyRotationTypeRef };
	

	get _id(): IdTuple { return this._attrs[2285] }
	get _permissions(): Id { return this._attrs[2286] }
	get _format(): NumberString { return this._attrs[2287] }
	get _ownerGroup(): null | Id { return this._attrs[2288] }
	get targetKeyVersion(): NumberString { return this._attrs[2289] }
	get groupKeyRotationType(): NumberString { return this._attrs[2290] }
	

	get adminPubKeyMac(): null | KeyMac { return this._attrs[2290] }
	set adminPubKeyMac(a: KeyMac)  { this._attrs[2482] = a } 
	get distEncAdminGroupSymKey(): null | PubEncKeyData { return this._attrs[2290] }
	set distEncAdminGroupSymKey(a: PubEncKeyData)  { this._attrs[2528] = a } 
	get distKeyMac(): null | KeyMac { return this._attrs[2290] }
	set distKeyMac(a: KeyMac)  { this._attrs[2529] = a } 
	get adminDistKeyPair(): null | KeyPair { return this._attrs[2290] }
	set adminDistKeyPair(a: KeyPair)  { this._attrs[2530] = a } 
}
export const KeyRotationsRefTypeRef: TypeRef<KeyRotationsRef> = new TypeRef("sys", 2291)

export function createKeyRotationsRef(values: StrippedEntity<KeyRotationsRef>): KeyRotationsRef {
    return Object.assign(create(typeModels[KeyRotationsRefTypeRef.typeId], KeyRotationsRefTypeRef), values)
}

export type KeyRotationsRefParams = {

	_id: Id;

	list: Id;
}

export class KeyRotationsRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<KeyRotationsRef> { return KeyRotationsRefTypeRef };
	

	get _id(): Id { return this._attrs[2292] }
	

	get list(): Id { return this._attrs[2292] }
}
export const SurveyDataTypeRef: TypeRef<SurveyData> = new TypeRef("sys", 2295)

export function createSurveyData(values: StrippedEntity<SurveyData>): SurveyData {
    return Object.assign(create(typeModels[SurveyDataTypeRef.typeId], SurveyDataTypeRef), values)
}

export type SurveyDataParams = {

	_id: Id;
	category: NumberString;
	reason: NumberString;
	details: null | string;
	version: NumberString;
	clientVersion: string;
	clientPlatform: NumberString;
}

export class SurveyData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SurveyData> { return SurveyDataTypeRef };
	

	get _id(): Id { return this._attrs[2296] }
	get category(): NumberString { return this._attrs[2297] }
	get reason(): NumberString { return this._attrs[2298] }
	get details(): null | string { return this._attrs[2299] }
	get version(): NumberString { return this._attrs[2300] }
	get clientVersion(): string { return this._attrs[2646] }
	get clientPlatform(): NumberString { return this._attrs[2647] }
	
}
export const IdTupleWrapperTypeRef: TypeRef<IdTupleWrapper> = new TypeRef("sys", 2315)

export function createIdTupleWrapper(values: StrippedEntity<IdTupleWrapper>): IdTupleWrapper {
    return Object.assign(create(typeModels[IdTupleWrapperTypeRef.typeId], IdTupleWrapperTypeRef), values)
}

export type IdTupleWrapperParams = {

	_id: Id;
	listId: Id;
	listElementId: Id;
}

export class IdTupleWrapper extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<IdTupleWrapper> { return IdTupleWrapperTypeRef };
	

	get _id(): Id { return this._attrs[2316] }
	get listId(): Id { return this._attrs[2317] }
	get listElementId(): Id { return this._attrs[2318] }
	
}
export const UserGroupKeyDistributionTypeRef: TypeRef<UserGroupKeyDistribution> = new TypeRef("sys", 2320)

export function createUserGroupKeyDistribution(values: StrippedEntity<UserGroupKeyDistribution>): UserGroupKeyDistribution {
    return Object.assign(create(typeModels[UserGroupKeyDistributionTypeRef.typeId], UserGroupKeyDistributionTypeRef), values)
}

export type UserGroupKeyDistributionParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	distributionEncUserGroupKey: Uint8Array;
	userGroupKeyVersion: NumberString;
}

export class UserGroupKeyDistribution extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserGroupKeyDistribution> { return UserGroupKeyDistributionTypeRef };
	

	get _id(): Id { return this._attrs[2322] }
	get _permissions(): Id { return this._attrs[2323] }
	get _format(): NumberString { return this._attrs[2324] }
	get _ownerGroup(): null | Id { return this._attrs[2325] }
	get distributionEncUserGroupKey(): Uint8Array { return this._attrs[2326] }
	get userGroupKeyVersion(): NumberString { return this._attrs[2327] }
	
}
export const GroupKeyRotationDataTypeRef: TypeRef<GroupKeyRotationData> = new TypeRef("sys", 2328)

export function createGroupKeyRotationData(values: StrippedEntity<GroupKeyRotationData>): GroupKeyRotationData {
    return Object.assign(create(typeModels[GroupKeyRotationDataTypeRef.typeId], GroupKeyRotationDataTypeRef), values)
}

export type GroupKeyRotationDataParams = {

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

export class GroupKeyRotationData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupKeyRotationData> { return GroupKeyRotationDataTypeRef };
	

	get _id(): Id { return this._attrs[2329] }
	get groupKeyVersion(): NumberString { return this._attrs[2332] }
	get groupEncPreviousGroupKey(): Uint8Array { return this._attrs[2333] }
	get adminGroupEncGroupKey(): null | Uint8Array { return this._attrs[2334] }
	get adminGroupKeyVersion(): null | NumberString { return this._attrs[2335] }
    set adminGroupKeyVersion(v: null | NumberString) { this._attrs[2335] = v }
	

	get group(): Id { return this._attrs[2335] }
	set group(a: Id)  { this._attrs[2336] = a } 
	get keyPair(): null | KeyPair { return this._attrs[2335] }
	set keyPair(a: KeyPair)  { this._attrs[2337] = a } 
	get groupKeyUpdatesForMembers(): GroupKeyUpdateData[] { return this._attrs[2335] }
	get groupMembershipUpdateData(): GroupMembershipUpdateData[] { return this._attrs[2335] }
}
export const GroupKeyRotationPostInTypeRef: TypeRef<GroupKeyRotationPostIn> = new TypeRef("sys", 2338)

export function createGroupKeyRotationPostIn(values: StrippedEntity<GroupKeyRotationPostIn>): GroupKeyRotationPostIn {
    return Object.assign(create(typeModels[GroupKeyRotationPostInTypeRef.typeId], GroupKeyRotationPostInTypeRef), values)
}

export type GroupKeyRotationPostInParams = {

	_format: NumberString;

	groupKeyUpdates: GroupKeyRotationData[];
}

export class GroupKeyRotationPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupKeyRotationPostIn> { return GroupKeyRotationPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2339] }
    set _format(v: NumberString) { this._attrs[2339] = v }
	

	get groupKeyUpdates(): GroupKeyRotationData[] { return this._attrs[2339] }
	set groupKeyUpdates(a: GroupKeyRotationData[])  { this._attrs[2340] = a } 
}
export const GroupKeyRotationInfoGetOutTypeRef: TypeRef<GroupKeyRotationInfoGetOut> = new TypeRef("sys", 2342)

export function createGroupKeyRotationInfoGetOut(values: StrippedEntity<GroupKeyRotationInfoGetOut>): GroupKeyRotationInfoGetOut {
    return Object.assign(create(typeModels[GroupKeyRotationInfoGetOutTypeRef.typeId], GroupKeyRotationInfoGetOutTypeRef), values)
}

export type GroupKeyRotationInfoGetOutParams = {

	_format: NumberString;
	userOrAdminGroupKeyRotationScheduled: boolean;

	groupKeyUpdates: IdTuple[];
}

export class GroupKeyRotationInfoGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupKeyRotationInfoGetOut> { return GroupKeyRotationInfoGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2343] }
	get userOrAdminGroupKeyRotationScheduled(): boolean { return this._attrs[2344] }
    set userOrAdminGroupKeyRotationScheduled(v: boolean) { this._attrs[2344] = v }
	

	get groupKeyUpdates(): IdTuple[] { return this._attrs[2344] }
	set groupKeyUpdates(a: IdTuple[])  { this._attrs[2407] = a } 
}
export const RecoverCodeDataTypeRef: TypeRef<RecoverCodeData> = new TypeRef("sys", 2346)

export function createRecoverCodeData(values: StrippedEntity<RecoverCodeData>): RecoverCodeData {
    return Object.assign(create(typeModels[RecoverCodeDataTypeRef.typeId], RecoverCodeDataTypeRef), values)
}

export type RecoverCodeDataParams = {

	_id: Id;
	userKeyVersion: NumberString;
	recoveryCodeEncUserGroupKey: Uint8Array;
	userEncRecoveryCode: Uint8Array;
	recoveryCodeVerifier: Uint8Array;
}

export class RecoverCodeData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RecoverCodeData> { return RecoverCodeDataTypeRef };
	

	get _id(): Id { return this._attrs[2347] }
	get userKeyVersion(): NumberString { return this._attrs[2348] }
	get recoveryCodeEncUserGroupKey(): Uint8Array { return this._attrs[2349] }
	get userEncRecoveryCode(): Uint8Array { return this._attrs[2350] }
	get recoveryCodeVerifier(): Uint8Array { return this._attrs[2351] }
    set recoveryCodeVerifier(v: Uint8Array) { this._attrs[2351] = v }
	
}
export const UserGroupKeyRotationDataTypeRef: TypeRef<UserGroupKeyRotationData> = new TypeRef("sys", 2352)

export function createUserGroupKeyRotationData(values: StrippedEntity<UserGroupKeyRotationData>): UserGroupKeyRotationData {
    return Object.assign(create(typeModels[UserGroupKeyRotationDataTypeRef.typeId], UserGroupKeyRotationDataTypeRef), values)
}

export type UserGroupKeyRotationDataParams = {

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

export class UserGroupKeyRotationData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserGroupKeyRotationData> { return UserGroupKeyRotationDataTypeRef };
	

	get _id(): Id { return this._attrs[2353] }
	get passphraseEncUserGroupKey(): Uint8Array { return this._attrs[2354] }
	get distributionKeyEncUserGroupKey(): Uint8Array { return this._attrs[2355] }
	get userGroupKeyVersion(): NumberString { return this._attrs[2356] }
	get userGroupEncPreviousGroupKey(): Uint8Array { return this._attrs[2357] }
	get adminGroupEncUserGroupKey(): null | Uint8Array { return this._attrs[2359] }
	get adminGroupKeyVersion(): NumberString { return this._attrs[2360] }
	get authVerifier(): Uint8Array { return this._attrs[2362] }
	get userGroupEncAdminGroupKey(): null | Uint8Array { return this._attrs[2550] }
    set userGroupEncAdminGroupKey(v: null | Uint8Array) { this._attrs[2550] = v }
	

	get keyPair(): KeyPair { return this._attrs[2550] }
	set keyPair(a: KeyPair)  { this._attrs[2358] = a } 
	get group(): Id { return this._attrs[2550] }
	set group(a: Id)  { this._attrs[2361] = a } 
	get recoverCodeData(): null | RecoverCodeData { return this._attrs[2550] }
	set recoverCodeData(a: RecoverCodeData)  { this._attrs[2363] = a } 
	get pubAdminGroupEncUserGroupKey(): null | PubEncKeyData { return this._attrs[2550] }
	set pubAdminGroupEncUserGroupKey(a: PubEncKeyData)  { this._attrs[2470] = a } 
}
export const AdminGroupKeyRotationPostInTypeRef: TypeRef<AdminGroupKeyRotationPostIn> = new TypeRef("sys", 2364)

export function createAdminGroupKeyRotationPostIn(values: StrippedEntity<AdminGroupKeyRotationPostIn>): AdminGroupKeyRotationPostIn {
    return Object.assign(create(typeModels[AdminGroupKeyRotationPostInTypeRef.typeId], AdminGroupKeyRotationPostInTypeRef), values)
}

export type AdminGroupKeyRotationPostInParams = {

	_format: NumberString;

	adminGroupKeyData: GroupKeyRotationData;
	userGroupKeyData: UserGroupKeyRotationData;
	adminPubKeyMacList: KeyMac[];
	distribution: AdminGroupKeyDistributionElement[];
}

export class AdminGroupKeyRotationPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AdminGroupKeyRotationPostIn> { return AdminGroupKeyRotationPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2365] }
    set _format(v: NumberString) { this._attrs[2365] = v }
	

	get adminGroupKeyData(): GroupKeyRotationData { return this._attrs[2365] }
	set adminGroupKeyData(a: GroupKeyRotationData)  { this._attrs[2366] = a } 
	get userGroupKeyData(): UserGroupKeyRotationData { return this._attrs[2365] }
	set userGroupKeyData(a: UserGroupKeyRotationData)  { this._attrs[2367] = a } 
	get adminPubKeyMacList(): KeyMac[] { return this._attrs[2365] }
	set adminPubKeyMacList(a: KeyMac[])  { this._attrs[2483] = a } 
	get distribution(): AdminGroupKeyDistributionElement[] { return this._attrs[2365] }
	set distribution(a: AdminGroupKeyDistributionElement[])  { this._attrs[2535] = a } 
}
export const GroupKeyUpdateTypeRef: TypeRef<GroupKeyUpdate> = new TypeRef("sys", 2369)

export function createGroupKeyUpdate(values: StrippedEntity<GroupKeyUpdate>): GroupKeyUpdate {
    return Object.assign(create(typeModels[GroupKeyUpdateTypeRef.typeId], GroupKeyUpdateTypeRef), values)
}

export type GroupKeyUpdateParams = {

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

export class GroupKeyUpdate extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupKeyUpdate> { return GroupKeyUpdateTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[2371] }
	get _permissions(): Id { return this._attrs[2372] }
	get _format(): NumberString { return this._attrs[2373] }
	get _ownerGroup(): null | Id { return this._attrs[2374] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[2375] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2376] }
	get groupKey(): Uint8Array { return this._attrs[2377] }
	get groupKeyVersion(): NumberString { return this._attrs[2378] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2719] }
	

	get bucketKey(): BucketKey { return this._attrs[2719] }
}
export const GroupKeyUpdatesRefTypeRef: TypeRef<GroupKeyUpdatesRef> = new TypeRef("sys", 2380)

export function createGroupKeyUpdatesRef(values: StrippedEntity<GroupKeyUpdatesRef>): GroupKeyUpdatesRef {
    return Object.assign(create(typeModels[GroupKeyUpdatesRefTypeRef.typeId], GroupKeyUpdatesRefTypeRef), values)
}

export type GroupKeyUpdatesRefParams = {

	_id: Id;

	list: Id;
}

export class GroupKeyUpdatesRef extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupKeyUpdatesRef> { return GroupKeyUpdatesRefTypeRef };
	

	get _id(): Id { return this._attrs[2381] }
	

	get list(): Id { return this._attrs[2381] }
}
export const PubEncKeyDataTypeRef: TypeRef<PubEncKeyData> = new TypeRef("sys", 2384)

export function createPubEncKeyData(values: StrippedEntity<PubEncKeyData>): PubEncKeyData {
    return Object.assign(create(typeModels[PubEncKeyDataTypeRef.typeId], PubEncKeyDataTypeRef), values)
}

export type PubEncKeyDataParams = {

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

export class PubEncKeyData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PubEncKeyData> { return PubEncKeyDataTypeRef };
	

	get _id(): Id { return this._attrs[2385] }
	get recipientIdentifier(): string { return this._attrs[2386] }
	get pubEncSymKey(): Uint8Array { return this._attrs[2387] }
	get recipientKeyVersion(): NumberString { return this._attrs[2388] }
	get senderKeyVersion(): null | NumberString { return this._attrs[2389] }
	get protocolVersion(): NumberString { return this._attrs[2390] }
	get recipientIdentifierType(): NumberString { return this._attrs[2469] }
	get senderIdentifier(): null | string { return this._attrs[2551] }
	get senderIdentifierType(): null | NumberString { return this._attrs[2552] }
	

	get symKeyMac(): null | KeyMac { return this._attrs[2552] }
	set symKeyMac(a: KeyMac)  { this._attrs[2553] = a } 
}
export const GroupKeyUpdateDataTypeRef: TypeRef<GroupKeyUpdateData> = new TypeRef("sys", 2391)

export function createGroupKeyUpdateData(values: StrippedEntity<GroupKeyUpdateData>): GroupKeyUpdateData {
    return Object.assign(create(typeModels[GroupKeyUpdateDataTypeRef.typeId], GroupKeyUpdateDataTypeRef), values)
}

export type GroupKeyUpdateDataParams = {

	_id: Id;
	sessionKeyEncGroupKeyVersion: NumberString;
	sessionKeyEncGroupKey: Uint8Array;
	bucketKeyEncSessionKey: Uint8Array;

	pubEncBucketKeyData: PubEncKeyData;
}

export class GroupKeyUpdateData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupKeyUpdateData> { return GroupKeyUpdateDataTypeRef };
	

	get _id(): Id { return this._attrs[2392] }
	get sessionKeyEncGroupKeyVersion(): NumberString { return this._attrs[2393] }
	get sessionKeyEncGroupKey(): Uint8Array { return this._attrs[2394] }
	get bucketKeyEncSessionKey(): Uint8Array { return this._attrs[2395] }
    set bucketKeyEncSessionKey(v: Uint8Array) { this._attrs[2395] = v }
	

	get pubEncBucketKeyData(): PubEncKeyData { return this._attrs[2395] }
}
export const GroupMembershipKeyDataTypeRef: TypeRef<GroupMembershipKeyData> = new TypeRef("sys", 2398)

export function createGroupMembershipKeyData(values: StrippedEntity<GroupMembershipKeyData>): GroupMembershipKeyData {
    return Object.assign(create(typeModels[GroupMembershipKeyDataTypeRef.typeId], GroupMembershipKeyDataTypeRef), values)
}

export type GroupMembershipKeyDataParams = {

	_id: Id;
	groupKeyVersion: NumberString;
	symKeyVersion: NumberString;
	symEncGKey: Uint8Array;

	group: Id;
}

export class GroupMembershipKeyData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupMembershipKeyData> { return GroupMembershipKeyDataTypeRef };
	

	get _id(): Id { return this._attrs[2399] }
	get groupKeyVersion(): NumberString { return this._attrs[2401] }
	get symKeyVersion(): NumberString { return this._attrs[2402] }
	get symEncGKey(): Uint8Array { return this._attrs[2403] }
    set symEncGKey(v: Uint8Array) { this._attrs[2403] = v }
	

	get group(): Id { return this._attrs[2403] }
	set group(a: Id)  { this._attrs[2400] = a } 
}
export const MembershipPutInTypeRef: TypeRef<MembershipPutIn> = new TypeRef("sys", 2404)

export function createMembershipPutIn(values: StrippedEntity<MembershipPutIn>): MembershipPutIn {
    return Object.assign(create(typeModels[MembershipPutInTypeRef.typeId], MembershipPutInTypeRef), values)
}

export type MembershipPutInParams = {

	_format: NumberString;

	groupKeyUpdates: GroupMembershipKeyData[];
}

export class MembershipPutIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<MembershipPutIn> { return MembershipPutInTypeRef };
	

	get _format(): NumberString { return this._attrs[2405] }
    set _format(v: NumberString) { this._attrs[2405] = v }
	

	get groupKeyUpdates(): GroupMembershipKeyData[] { return this._attrs[2405] }
	set groupKeyUpdates(a: GroupMembershipKeyData[])  { this._attrs[2406] = a } 
}
export const GroupMembershipUpdateDataTypeRef: TypeRef<GroupMembershipUpdateData> = new TypeRef("sys", 2427)

export function createGroupMembershipUpdateData(values: StrippedEntity<GroupMembershipUpdateData>): GroupMembershipUpdateData {
    return Object.assign(create(typeModels[GroupMembershipUpdateDataTypeRef.typeId], GroupMembershipUpdateDataTypeRef), values)
}

export type GroupMembershipUpdateDataParams = {

	_id: Id;
	userEncGroupKey: Uint8Array;
	userKeyVersion: NumberString;

	userId: Id;
}

export class GroupMembershipUpdateData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<GroupMembershipUpdateData> { return GroupMembershipUpdateDataTypeRef };
	

	get _id(): Id { return this._attrs[2428] }
	get userEncGroupKey(): Uint8Array { return this._attrs[2430] }
	get userKeyVersion(): NumberString { return this._attrs[2431] }
    set userKeyVersion(v: NumberString) { this._attrs[2431] = v }
	

	get userId(): Id { return this._attrs[2431] }
	set userId(a: Id)  { this._attrs[2429] = a } 
}
export const AffiliatePartnerKpiMonthSummaryTypeRef: TypeRef<AffiliatePartnerKpiMonthSummary> = new TypeRef("sys", 2453)

export function createAffiliatePartnerKpiMonthSummary(values: StrippedEntity<AffiliatePartnerKpiMonthSummary>): AffiliatePartnerKpiMonthSummary {
    return Object.assign(create(typeModels[AffiliatePartnerKpiMonthSummaryTypeRef.typeId], AffiliatePartnerKpiMonthSummaryTypeRef), values)
}

export type AffiliatePartnerKpiMonthSummaryParams = {

	_id: Id;
	monthTimestamp: NumberString;
	newFree: NumberString;
	newPaid: NumberString;
	totalFree: NumberString;
	totalPaid: NumberString;
	commission: NumberString;
}

export class AffiliatePartnerKpiMonthSummary extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AffiliatePartnerKpiMonthSummary> { return AffiliatePartnerKpiMonthSummaryTypeRef };
	

	get _id(): Id { return this._attrs[2454] }
	get monthTimestamp(): NumberString { return this._attrs[2455] }
	get newFree(): NumberString { return this._attrs[2456] }
	get newPaid(): NumberString { return this._attrs[2457] }
	get totalFree(): NumberString { return this._attrs[2458] }
	get totalPaid(): NumberString { return this._attrs[2459] }
	get commission(): NumberString { return this._attrs[2460] }
    set commission(v: NumberString) { this._attrs[2460] = v }
	
}
export const AffiliatePartnerKpiServiceGetOutTypeRef: TypeRef<AffiliatePartnerKpiServiceGetOut> = new TypeRef("sys", 2461)

export function createAffiliatePartnerKpiServiceGetOut(values: StrippedEntity<AffiliatePartnerKpiServiceGetOut>): AffiliatePartnerKpiServiceGetOut {
    return Object.assign(create(typeModels[AffiliatePartnerKpiServiceGetOutTypeRef.typeId], AffiliatePartnerKpiServiceGetOutTypeRef), values)
}

export type AffiliatePartnerKpiServiceGetOutParams = {

	_format: NumberString;
	promotionId: string;
	accumulatedCommission: NumberString;
	creditedCommission: NumberString;

	kpis: AffiliatePartnerKpiMonthSummary[];
}

export class AffiliatePartnerKpiServiceGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AffiliatePartnerKpiServiceGetOut> { return AffiliatePartnerKpiServiceGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2462] }
	get promotionId(): string { return this._attrs[2463] }
	get accumulatedCommission(): NumberString { return this._attrs[2464] }
	get creditedCommission(): NumberString { return this._attrs[2465] }
    set creditedCommission(v: NumberString) { this._attrs[2465] = v }
	

	get kpis(): AffiliatePartnerKpiMonthSummary[] { return this._attrs[2465] }
	set kpis(a: AffiliatePartnerKpiMonthSummary[])  { this._attrs[2466] = a } 
}
export const UserGroupKeyRotationPostInTypeRef: TypeRef<UserGroupKeyRotationPostIn> = new TypeRef("sys", 2471)

export function createUserGroupKeyRotationPostIn(values: StrippedEntity<UserGroupKeyRotationPostIn>): UserGroupKeyRotationPostIn {
    return Object.assign(create(typeModels[UserGroupKeyRotationPostInTypeRef.typeId], UserGroupKeyRotationPostInTypeRef), values)
}

export type UserGroupKeyRotationPostInParams = {

	_format: NumberString;

	userGroupKeyData: UserGroupKeyRotationData;
}

export class UserGroupKeyRotationPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserGroupKeyRotationPostIn> { return UserGroupKeyRotationPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2472] }
    set _format(v: NumberString) { this._attrs[2472] = v }
	

	get userGroupKeyData(): UserGroupKeyRotationData { return this._attrs[2472] }
	set userGroupKeyData(a: UserGroupKeyRotationData)  { this._attrs[2473] = a } 
}
export const KeyMacTypeRef: TypeRef<KeyMac> = new TypeRef("sys", 2477)

export function createKeyMac(values: StrippedEntity<KeyMac>): KeyMac {
    return Object.assign(create(typeModels[KeyMacTypeRef.typeId], KeyMacTypeRef), values)
}

export type KeyMacParams = {

	_id: Id;
	taggedKeyVersion: NumberString;
	tag: Uint8Array;
	taggingKeyVersion: NumberString;

	taggingGroup: Id;
}

export class KeyMac extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<KeyMac> { return KeyMacTypeRef };
	

	get _id(): Id { return this._attrs[2478] }
	get taggedKeyVersion(): NumberString { return this._attrs[2480] }
	get tag(): Uint8Array { return this._attrs[2481] }
	get taggingKeyVersion(): NumberString { return this._attrs[2527] }
    set taggingKeyVersion(v: NumberString) { this._attrs[2527] = v }
	

	get taggingGroup(): Id { return this._attrs[2527] }
	set taggingGroup(a: Id)  { this._attrs[2479] = a } 
}
export const AppStoreSubscriptionGetOutTypeRef: TypeRef<AppStoreSubscriptionGetOut> = new TypeRef("sys", 2497)

export function createAppStoreSubscriptionGetOut(values: StrippedEntity<AppStoreSubscriptionGetOut>): AppStoreSubscriptionGetOut {
    return Object.assign(create(typeModels[AppStoreSubscriptionGetOutTypeRef.typeId], AppStoreSubscriptionGetOutTypeRef), values)
}

export type AppStoreSubscriptionGetOutParams = {

	_format: NumberString;
	app: NumberString;
}

export class AppStoreSubscriptionGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AppStoreSubscriptionGetOut> { return AppStoreSubscriptionGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2498] }
	get app(): NumberString { return this._attrs[2499] }
    set app(v: NumberString) { this._attrs[2499] = v }
	
}
export const AppStoreSubscriptionGetInTypeRef: TypeRef<AppStoreSubscriptionGetIn> = new TypeRef("sys", 2500)

export function createAppStoreSubscriptionGetIn(values: StrippedEntity<AppStoreSubscriptionGetIn>): AppStoreSubscriptionGetIn {
    return Object.assign(create(typeModels[AppStoreSubscriptionGetInTypeRef.typeId], AppStoreSubscriptionGetInTypeRef), values)
}

export type AppStoreSubscriptionGetInParams = {

	_format: NumberString;
	subscriptionId: string;
}

export class AppStoreSubscriptionGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AppStoreSubscriptionGetIn> { return AppStoreSubscriptionGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[2501] }
	get subscriptionId(): string { return this._attrs[2502] }
    set subscriptionId(v: string) { this._attrs[2502] = v }
	
}
export const VerifierTokenServiceOutTypeRef: TypeRef<VerifierTokenServiceOut> = new TypeRef("sys", 2510)

export function createVerifierTokenServiceOut(values: StrippedEntity<VerifierTokenServiceOut>): VerifierTokenServiceOut {
    return Object.assign(create(typeModels[VerifierTokenServiceOutTypeRef.typeId], VerifierTokenServiceOutTypeRef), values)
}

export type VerifierTokenServiceOutParams = {

	_format: NumberString;
	token: string;
}

export class VerifierTokenServiceOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<VerifierTokenServiceOut> { return VerifierTokenServiceOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2511] }
	get token(): string { return this._attrs[2512] }
    set token(v: string) { this._attrs[2512] = v }
	
}
export const VerifierTokenServiceInTypeRef: TypeRef<VerifierTokenServiceIn> = new TypeRef("sys", 2517)

export function createVerifierTokenServiceIn(values: StrippedEntity<VerifierTokenServiceIn>): VerifierTokenServiceIn {
    return Object.assign(create(typeModels[VerifierTokenServiceInTypeRef.typeId], VerifierTokenServiceInTypeRef), values)
}

export type VerifierTokenServiceInParams = {

	_format: NumberString;
	authVerifier: Uint8Array;
}

export class VerifierTokenServiceIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<VerifierTokenServiceIn> { return VerifierTokenServiceInTypeRef };
	

	get _format(): NumberString { return this._attrs[2518] }
	get authVerifier(): Uint8Array { return this._attrs[2519] }
    set authVerifier(v: Uint8Array) { this._attrs[2519] = v }
	
}
export const CalendarAdvancedRepeatRuleTypeRef: TypeRef<CalendarAdvancedRepeatRule> = new TypeRef("sys", 2521)

export function createCalendarAdvancedRepeatRule(values: StrippedEntity<CalendarAdvancedRepeatRule>): CalendarAdvancedRepeatRule {
    return Object.assign(create(typeModels[CalendarAdvancedRepeatRuleTypeRef.typeId], CalendarAdvancedRepeatRuleTypeRef), values)
}

export type CalendarAdvancedRepeatRuleParams = {

	_id: Id;
	ruleType: NumberString;
	interval: string;
}

export class CalendarAdvancedRepeatRule extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CalendarAdvancedRepeatRule> { return CalendarAdvancedRepeatRuleTypeRef };
	

	get _id(): Id { return this._attrs[2522] }
	get ruleType(): NumberString { return this._attrs[2523] }
	get interval(): string { return this._attrs[2524] }
    set interval(v: string) { this._attrs[2524] = v }
	
}
export const AdminGroupKeyDistributionElementTypeRef: TypeRef<AdminGroupKeyDistributionElement> = new TypeRef("sys", 2531)

export function createAdminGroupKeyDistributionElement(values: StrippedEntity<AdminGroupKeyDistributionElement>): AdminGroupKeyDistributionElement {
    return Object.assign(create(typeModels[AdminGroupKeyDistributionElementTypeRef.typeId], AdminGroupKeyDistributionElementTypeRef), values)
}

export type AdminGroupKeyDistributionElementParams = {

	_id: Id;

	userGroupId: Id;
	distEncAdminGroupKey: PubEncKeyData;
}

export class AdminGroupKeyDistributionElement extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AdminGroupKeyDistributionElement> { return AdminGroupKeyDistributionElementTypeRef };
	

	get _id(): Id { return this._attrs[2532] }
	

	get userGroupId(): Id { return this._attrs[2532] }
	set userGroupId(a: Id)  { this._attrs[2533] = a } 
	get distEncAdminGroupKey(): PubEncKeyData { return this._attrs[2532] }
	set distEncAdminGroupKey(a: PubEncKeyData)  { this._attrs[2534] = a } 
}
export const AdminGroupKeyRotationPutInTypeRef: TypeRef<AdminGroupKeyRotationPutIn> = new TypeRef("sys", 2536)

export function createAdminGroupKeyRotationPutIn(values: StrippedEntity<AdminGroupKeyRotationPutIn>): AdminGroupKeyRotationPutIn {
    return Object.assign(create(typeModels[AdminGroupKeyRotationPutInTypeRef.typeId], AdminGroupKeyRotationPutInTypeRef), values)
}

export type AdminGroupKeyRotationPutInParams = {

	_format: NumberString;

	distKeyMac: KeyMac;
	adminDistKeyPair: KeyPair;
}

export class AdminGroupKeyRotationPutIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AdminGroupKeyRotationPutIn> { return AdminGroupKeyRotationPutInTypeRef };
	

	get _format(): NumberString { return this._attrs[2537] }
    set _format(v: NumberString) { this._attrs[2537] = v }
	

	get distKeyMac(): KeyMac { return this._attrs[2537] }
	set distKeyMac(a: KeyMac)  { this._attrs[2538] = a } 
	get adminDistKeyPair(): KeyPair { return this._attrs[2537] }
	set adminDistKeyPair(a: KeyPair)  { this._attrs[2539] = a } 
}
export const PubDistributionKeyTypeRef: TypeRef<PubDistributionKey> = new TypeRef("sys", 2540)

export function createPubDistributionKey(values: StrippedEntity<PubDistributionKey>): PubDistributionKey {
    return Object.assign(create(typeModels[PubDistributionKeyTypeRef.typeId], PubDistributionKeyTypeRef), values)
}

export type PubDistributionKeyParams = {

	_id: Id;
	pubEccKey: Uint8Array;
	pubKyberKey: Uint8Array;

	userGroupId: Id;
	pubKeyMac: KeyMac;
}

export class PubDistributionKey extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PubDistributionKey> { return PubDistributionKeyTypeRef };
	

	get _id(): Id { return this._attrs[2541] }
	get pubEccKey(): Uint8Array { return this._attrs[2544] }
	get pubKyberKey(): Uint8Array { return this._attrs[2545] }
	

	get userGroupId(): Id { return this._attrs[2545] }
	set userGroupId(a: Id)  { this._attrs[2542] = a } 
	get pubKeyMac(): KeyMac { return this._attrs[2545] }
	set pubKeyMac(a: KeyMac)  { this._attrs[2543] = a } 
}
export const AdminGroupKeyRotationGetOutTypeRef: TypeRef<AdminGroupKeyRotationGetOut> = new TypeRef("sys", 2546)

export function createAdminGroupKeyRotationGetOut(values: StrippedEntity<AdminGroupKeyRotationGetOut>): AdminGroupKeyRotationGetOut {
    return Object.assign(create(typeModels[AdminGroupKeyRotationGetOutTypeRef.typeId], AdminGroupKeyRotationGetOutTypeRef), values)
}

export type AdminGroupKeyRotationGetOutParams = {

	_format: NumberString;

	userGroupIdsMissingDistributionKeys: Id[];
	distributionKeys: PubDistributionKey[];
}

export class AdminGroupKeyRotationGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AdminGroupKeyRotationGetOut> { return AdminGroupKeyRotationGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2547] }
    set _format(v: NumberString) { this._attrs[2547] = v }
	

	get userGroupIdsMissingDistributionKeys(): Id[] { return this._attrs[2547] }
	set userGroupIdsMissingDistributionKeys(a: Id[])  { this._attrs[2548] = a } 
	get distributionKeys(): PubDistributionKey[] { return this._attrs[2547] }
	set distributionKeys(a: PubDistributionKey[])  { this._attrs[2549] = a } 
}
export const SurveyDataPostInTypeRef: TypeRef<SurveyDataPostIn> = new TypeRef("sys", 2563)

export function createSurveyDataPostIn(values: StrippedEntity<SurveyDataPostIn>): SurveyDataPostIn {
    return Object.assign(create(typeModels[SurveyDataPostInTypeRef.typeId], SurveyDataPostInTypeRef), values)
}

export type SurveyDataPostInParams = {

	_format: NumberString;

	surveyData: SurveyData;
}

export class SurveyDataPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SurveyDataPostIn> { return SurveyDataPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2564] }
    set _format(v: NumberString) { this._attrs[2564] = v }
	

	get surveyData(): SurveyData { return this._attrs[2564] }
	set surveyData(a: SurveyData)  { this._attrs[2565] = a } 
}
export const PatchTypeRef: TypeRef<Patch> = new TypeRef("sys", 2567)

export function createPatch(values: StrippedEntity<Patch>): Patch {
    return Object.assign(create(typeModels[PatchTypeRef.typeId], PatchTypeRef), values)
}

export type PatchParams = {

	_id: Id;
	patchOperation: NumberString;
	attributePath: string;
	value: null | string;
}

export class Patch extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Patch> { return PatchTypeRef };
	

	get _id(): Id { return this._attrs[2568] }
	get patchOperation(): NumberString { return this._attrs[2569] }
	get attributePath(): string { return this._attrs[2570] }
	get value(): null | string { return this._attrs[2571] }
    set value(v: null | string) { this._attrs[2571] = v }
	
}
export const IdentityKeyPairTypeRef: TypeRef<IdentityKeyPair> = new TypeRef("sys", 2575)

export function createIdentityKeyPair(values: StrippedEntity<IdentityKeyPair>): IdentityKeyPair {
    return Object.assign(create(typeModels[IdentityKeyPairTypeRef.typeId], IdentityKeyPairTypeRef), values)
}

export type IdentityKeyPairParams = {

	_id: Id;
	identityKeyVersion: NumberString;
	encryptingKeyVersion: NumberString;
	publicEd25519Key: Uint8Array;
	privateEd25519Key: Uint8Array;

	publicKeyMac: KeyMac;
}

export class IdentityKeyPair extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<IdentityKeyPair> { return IdentityKeyPairTypeRef };
	

	get _id(): Id { return this._attrs[2576] }
	get identityKeyVersion(): NumberString { return this._attrs[2577] }
	get encryptingKeyVersion(): NumberString { return this._attrs[2578] }
	get publicEd25519Key(): Uint8Array { return this._attrs[2579] }
	get privateEd25519Key(): Uint8Array { return this._attrs[2580] }
    set privateEd25519Key(v: Uint8Array) { this._attrs[2580] = v }
	

	get publicKeyMac(): KeyMac { return this._attrs[2580] }
	set publicKeyMac(a: KeyMac)  { this._attrs[2581] = a } 
}
export const PublicKeySignatureTypeRef: TypeRef<PublicKeySignature> = new TypeRef("sys", 2582)

export function createPublicKeySignature(values: StrippedEntity<PublicKeySignature>): PublicKeySignature {
    return Object.assign(create(typeModels[PublicKeySignatureTypeRef.typeId], PublicKeySignatureTypeRef), values)
}

export type PublicKeySignatureParams = {

	_id: Id;
	signature: Uint8Array;
	signingKeyVersion: NumberString;
	signatureType: NumberString;
	publicKeyVersion: NumberString;
}

export class PublicKeySignature extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PublicKeySignature> { return PublicKeySignatureTypeRef };
	

	get _id(): Id { return this._attrs[2583] }
	get signature(): Uint8Array { return this._attrs[2584] }
	get signingKeyVersion(): NumberString { return this._attrs[2585] }
	get signatureType(): NumberString { return this._attrs[2586] }
	get publicKeyVersion(): NumberString { return this._attrs[2587] }
    set publicKeyVersion(v: NumberString) { this._attrs[2587] = v }
	
}
export const IdentityKeyGetInTypeRef: TypeRef<IdentityKeyGetIn> = new TypeRef("sys", 2590)

export function createIdentityKeyGetIn(values: StrippedEntity<IdentityKeyGetIn>): IdentityKeyGetIn {
    return Object.assign(create(typeModels[IdentityKeyGetInTypeRef.typeId], IdentityKeyGetInTypeRef), values)
}

export type IdentityKeyGetInParams = {

	_format: NumberString;
	version: null | NumberString;
	identifierType: NumberString;
	identifier: string;
}

export class IdentityKeyGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<IdentityKeyGetIn> { return IdentityKeyGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[2591] }
	get version(): null | NumberString { return this._attrs[2592] }
	get identifierType(): NumberString { return this._attrs[2593] }
	get identifier(): string { return this._attrs[2594] }
    set identifier(v: string) { this._attrs[2594] = v }
	
}
export const IdentityKeyGetOutTypeRef: TypeRef<IdentityKeyGetOut> = new TypeRef("sys", 2595)

export function createIdentityKeyGetOut(values: StrippedEntity<IdentityKeyGetOut>): IdentityKeyGetOut {
    return Object.assign(create(typeModels[IdentityKeyGetOutTypeRef.typeId], IdentityKeyGetOutTypeRef), values)
}

export type IdentityKeyGetOutParams = {

	_format: NumberString;
	publicIdentityKey: Uint8Array;
	publicIdentityKeyVersion: NumberString;
}

export class IdentityKeyGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<IdentityKeyGetOut> { return IdentityKeyGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2596] }
	get publicIdentityKey(): Uint8Array { return this._attrs[2597] }
	get publicIdentityKeyVersion(): NumberString { return this._attrs[2598] }
    set publicIdentityKeyVersion(v: NumberString) { this._attrs[2598] = v }
	
}
export const IdentityKeyPostInTypeRef: TypeRef<IdentityKeyPostIn> = new TypeRef("sys", 2599)

export function createIdentityKeyPostIn(values: StrippedEntity<IdentityKeyPostIn>): IdentityKeyPostIn {
    return Object.assign(create(typeModels[IdentityKeyPostInTypeRef.typeId], IdentityKeyPostInTypeRef), values)
}

export type IdentityKeyPostInParams = {

	_format: NumberString;

	identityKeyPair: IdentityKeyPair;
	signatures: PublicKeySignature[];
}

export class IdentityKeyPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<IdentityKeyPostIn> { return IdentityKeyPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2600] }
    set _format(v: NumberString) { this._attrs[2600] = v }
	

	get identityKeyPair(): IdentityKeyPair { return this._attrs[2600] }
	set identityKeyPair(a: IdentityKeyPair)  { this._attrs[2601] = a } 
	get signatures(): PublicKeySignature[] { return this._attrs[2600] }
	set signatures(a: PublicKeySignature[])  { this._attrs[2602] = a } 
}
export const RolloutTypeRef: TypeRef<Rollout> = new TypeRef("sys", 2604)

export function createRollout(values: StrippedEntity<Rollout>): Rollout {
    return Object.assign(create(typeModels[RolloutTypeRef.typeId], RolloutTypeRef), values)
}

export type RolloutParams = {

	_id: Id;
	rolloutType: NumberString;
}

export class Rollout extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<Rollout> { return RolloutTypeRef };
	

	get _id(): Id { return this._attrs[2605] }
	get rolloutType(): NumberString { return this._attrs[2606] }
    set rolloutType(v: NumberString) { this._attrs[2606] = v }
	
}
export const RolloutGetOutTypeRef: TypeRef<RolloutGetOut> = new TypeRef("sys", 2607)

export function createRolloutGetOut(values: StrippedEntity<RolloutGetOut>): RolloutGetOut {
    return Object.assign(create(typeModels[RolloutGetOutTypeRef.typeId], RolloutGetOutTypeRef), values)
}

export type RolloutGetOutParams = {

	_format: NumberString;

	rollouts: Rollout[];
}

export class RolloutGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RolloutGetOut> { return RolloutGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2608] }
    set _format(v: NumberString) { this._attrs[2608] = v }
	

	get rollouts(): Rollout[] { return this._attrs[2608] }
	set rollouts(a: Rollout[])  { this._attrs[2609] = a } 
}
export const PatchListTypeRef: TypeRef<PatchList> = new TypeRef("sys", 2614)

export function createPatchList(values: StrippedEntity<PatchList>): PatchList {
    return Object.assign(create(typeModels[PatchListTypeRef.typeId], PatchListTypeRef), values)
}

export type PatchListParams = {

	_id: Id;

	patches: Patch[];
}

export class PatchList extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PatchList> { return PatchListTypeRef };
	

	get _id(): Id { return this._attrs[2615] }
	

	get patches(): Patch[] { return this._attrs[2615] }
	set patches(a: Patch[])  { this._attrs[2616] = a } 
}
export const CaptchaChallengeTypeRef: TypeRef<CaptchaChallenge> = new TypeRef("sys", 2619)

export function createCaptchaChallenge(values: StrippedEntity<CaptchaChallenge>): CaptchaChallenge {
    return Object.assign(create(typeModels[CaptchaChallengeTypeRef.typeId], CaptchaChallengeTypeRef), values)
}

export type CaptchaChallengeParams = {

	_id: Id;
	challenge: Uint8Array;
	description: string;
}

export class CaptchaChallenge extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<CaptchaChallenge> { return CaptchaChallengeTypeRef };
	

	get _id(): Id { return this._attrs[2620] }
	get challenge(): Uint8Array { return this._attrs[2621] }
	get description(): string { return this._attrs[2622] }
    set description(v: string) { this._attrs[2622] = v }
	
}
export const TimelockCaptchaGetInTypeRef: TypeRef<TimelockCaptchaGetIn> = new TypeRef("sys", 2629)

export function createTimelockCaptchaGetIn(values: StrippedEntity<TimelockCaptchaGetIn>): TimelockCaptchaGetIn {
    return Object.assign(create(typeModels[TimelockCaptchaGetInTypeRef.typeId], TimelockCaptchaGetInTypeRef), values)
}

export type TimelockCaptchaGetInParams = {

	_format: NumberString;
	signupToken: string;
	timeToSolveCalibrationChallenge: null | NumberString;

	deviceInfo: null | ClientPerformanceInfo;
}

export class TimelockCaptchaGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<TimelockCaptchaGetIn> { return TimelockCaptchaGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[2630] }
	get signupToken(): string { return this._attrs[2631] }
	get timeToSolveCalibrationChallenge(): null | NumberString { return this._attrs[2645] }
    set timeToSolveCalibrationChallenge(v: null | NumberString) { this._attrs[2645] = v }
	

	get deviceInfo(): null | ClientPerformanceInfo { return this._attrs[2645] }
	set deviceInfo(a: ClientPerformanceInfo)  { this._attrs[2644] = a } 
}
export const TimelockCaptchaGetOutTypeRef: TypeRef<TimelockCaptchaGetOut> = new TypeRef("sys", 2632)

export function createTimelockCaptchaGetOut(values: StrippedEntity<TimelockCaptchaGetOut>): TimelockCaptchaGetOut {
    return Object.assign(create(typeModels[TimelockCaptchaGetOutTypeRef.typeId], TimelockCaptchaGetOutTypeRef), values)
}

export type TimelockCaptchaGetOutParams = {

	_format: NumberString;
	difficulty: string;
	modulus: string;
	base: string;
}

export class TimelockCaptchaGetOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<TimelockCaptchaGetOut> { return TimelockCaptchaGetOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2633] }
	get difficulty(): string { return this._attrs[2634] }
	get modulus(): string { return this._attrs[2635] }
	get base(): string { return this._attrs[2636] }
    set base(v: string) { this._attrs[2636] = v }
	
}
export const ClientPerformanceInfoTypeRef: TypeRef<ClientPerformanceInfo> = new TypeRef("sys", 2641)

export function createClientPerformanceInfo(values: StrippedEntity<ClientPerformanceInfo>): ClientPerformanceInfo {
    return Object.assign(create(typeModels[ClientPerformanceInfoTypeRef.typeId], ClientPerformanceInfoTypeRef), values)
}

export type ClientPerformanceInfoParams = {

	_id: Id;
	isAutomatedBrowser: boolean;
}

export class ClientPerformanceInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<ClientPerformanceInfo> { return ClientPerformanceInfoTypeRef };
	

	get _id(): Id { return this._attrs[2642] }
	get isAutomatedBrowser(): boolean { return this._attrs[2643] }
    set isAutomatedBrowser(v: boolean) { this._attrs[2643] = v }
	
}
export const AbuseInfoTypeRef: TypeRef<AbuseInfo> = new TypeRef("sys", 2650)

export function createAbuseInfo(values: StrippedEntity<AbuseInfo>): AbuseInfo {
    return Object.assign(create(typeModels[AbuseInfoTypeRef.typeId], AbuseInfoTypeRef), values)
}

export type AbuseInfoParams = {

	_id: Id;
	criterion: string;
	value: string;
}

export class AbuseInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AbuseInfo> { return AbuseInfoTypeRef };
	

	get _id(): Id { return this._attrs[2651] }
	get criterion(): string { return this._attrs[2652] }
	get value(): string { return this._attrs[2653] }
	
}
export const PartnerManagedCustomerTypeRef: TypeRef<PartnerManagedCustomer> = new TypeRef("sys", 2672)

export function createPartnerManagedCustomer(values: StrippedEntity<PartnerManagedCustomer>): PartnerManagedCustomer {
    return Object.assign(create(typeModels[PartnerManagedCustomerTypeRef.typeId], PartnerManagedCustomerTypeRef), values)
}

export type PartnerManagedCustomerParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	_kdfNonce: null | Uint8Array;

	customerInfo: IdTuple;
}

export class PartnerManagedCustomer extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<PartnerManagedCustomer> { return PartnerManagedCustomerTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[2674] }
	get _permissions(): Id { return this._attrs[2675] }
	get _format(): NumberString { return this._attrs[2676] }
	get _ownerGroup(): null | Id { return this._attrs[2677] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[2678] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[2679] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[2708] }
	

	get customerInfo(): IdTuple { return this._attrs[2708] }
	set customerInfo(a: IdTuple)  { this._attrs[2680] = a } 
}
export const AdAttributionTypeRef: TypeRef<AdAttribution> = new TypeRef("sys", 2684)

export function createAdAttribution(values: StrippedEntity<AdAttribution>): AdAttribution {
    return Object.assign(create(typeModels[AdAttributionTypeRef.typeId], AdAttributionTypeRef), values)
}

export type AdAttributionParams = {

	_id: Id;
	attributionId: string;
	attributionType: NumberString;
}

export class AdAttribution extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<AdAttribution> { return AdAttributionTypeRef };
	

	get _id(): Id { return this._attrs[2685] }
	get attributionId(): string { return this._attrs[2686] }
	get attributionType(): NumberString { return this._attrs[2687] }
	
}
export const OperationStatusUpdateTypeRef: TypeRef<OperationStatusUpdate> = new TypeRef("sys", 2692)

export function createOperationStatusUpdate(values: StrippedEntity<OperationStatusUpdate>): OperationStatusUpdate {
    return Object.assign(create(typeModels[OperationStatusUpdateTypeRef.typeId], OperationStatusUpdateTypeRef), values)
}

export type OperationStatusUpdateParams = {

	_format: NumberString;
	applicationVersionSum: NumberString;
	applicationTypesHash: string;
	operationId: Id;
	status: NumberString;
	statusCode: null | NumberString;
	reason: null | string;
}

export class OperationStatusUpdate extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<OperationStatusUpdate> { return OperationStatusUpdateTypeRef };
	

	get _format(): NumberString { return this._attrs[2693] }
	get applicationVersionSum(): NumberString { return this._attrs[2694] }
	get applicationTypesHash(): string { return this._attrs[2695] }
	get operationId(): Id { return this._attrs[2696] }
	get status(): NumberString { return this._attrs[2697] }
	get statusCode(): null | NumberString { return this._attrs[2698] }
	get reason(): null | string { return this._attrs[2699] }
    set reason(v: null | string) { this._attrs[2699] = v }
	
}
export const UserAlarmInfoDataTypeRef: TypeRef<UserAlarmInfoData> = new TypeRef("sys", 2722)

export function createUserAlarmInfoData(values: StrippedEntity<UserAlarmInfoData>): UserAlarmInfoData {
    return Object.assign(create(typeModels[UserAlarmInfoDataTypeRef.typeId], UserAlarmInfoDataTypeRef), values)
}

export type UserAlarmInfoDataParams = {

	_id: Id;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;
	encryptedTrigger: Uint8Array;
	alarmIdentifier: string;

	ownerGroup: Id;
	calendarEventRef: CalendarEventRef;
}

export class UserAlarmInfoData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UserAlarmInfoData> { return UserAlarmInfoDataTypeRef };
	

	get _id(): Id { return this._attrs[2723] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[2724] }
	get ownerKeyVersion(): NumberString { return this._attrs[2725] }
	get encryptedTrigger(): Uint8Array { return this._attrs[2727] }
	get alarmIdentifier(): string { return this._attrs[2728] }
	

	get ownerGroup(): Id { return this._attrs[2728] }
	set ownerGroup(a: Id)  { this._attrs[2726] = a } 
	get calendarEventRef(): CalendarEventRef { return this._attrs[2728] }
	set calendarEventRef(a: CalendarEventRef)  { this._attrs[2729] = a } 
}
export const SubscriptionReferenceTypeRef: TypeRef<SubscriptionReference> = new TypeRef("sys", 2733)

export function createSubscriptionReference(values: StrippedEntity<SubscriptionReference>): SubscriptionReference {
    return Object.assign(create(typeModels[SubscriptionReferenceTypeRef.typeId], SubscriptionReferenceTypeRef), values)
}

export type SubscriptionReferenceParams = {

	_id: Id;
	subscriptionProvider: NumberString;
	foreignKey: null | string;
	subscriptionApp: NumberString;
}

export class SubscriptionReference extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<SubscriptionReference> { return SubscriptionReferenceTypeRef };
	

	get _id(): Id { return this._attrs[2734] }
	get subscriptionProvider(): NumberString { return this._attrs[2735] }
	get foreignKey(): null | string { return this._attrs[2736] }
	get subscriptionApp(): NumberString { return this._attrs[2737] }
    set subscriptionApp(v: NumberString) { this._attrs[2737] = v }
	
}
export const RenewalPreferenceServicePostInTypeRef: TypeRef<RenewalPreferenceServicePostIn> = new TypeRef("sys", 2740)

export function createRenewalPreferenceServicePostIn(values: StrippedEntity<RenewalPreferenceServicePostIn>): RenewalPreferenceServicePostIn {
    return Object.assign(create(typeModels[RenewalPreferenceServicePostInTypeRef.typeId], RenewalPreferenceServicePostInTypeRef), values)
}

export type RenewalPreferenceServicePostInParams = {

	_format: NumberString;
	isEnabled: boolean;
	customerId: Id;
}

export class RenewalPreferenceServicePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<RenewalPreferenceServicePostIn> { return RenewalPreferenceServicePostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2741] }
	get isEnabled(): boolean { return this._attrs[2742] }
	get customerId(): Id { return this._attrs[2743] }
    set customerId(v: Id) { this._attrs[2743] = v }
	
}
export const InstanceKdfNonceTypeRef: TypeRef<InstanceKdfNonce> = new TypeRef("sys", 2746)

export function createInstanceKdfNonce(values: StrippedEntity<InstanceKdfNonce>): InstanceKdfNonce {
    return Object.assign(create(typeModels[InstanceKdfNonceTypeRef.typeId], InstanceKdfNonceTypeRef), values)
}

export type InstanceKdfNonceParams = {

	_id: Id;
	instanceList: null | Id;
	instanceId: Id;
	kdfNonce: Uint8Array;

	typeInfo: TypeInfo;
}

export class InstanceKdfNonce extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InstanceKdfNonce> { return InstanceKdfNonceTypeRef };
	

	get _id(): Id { return this._attrs[2747] }
	get instanceList(): null | Id { return this._attrs[2749] }
	get instanceId(): Id { return this._attrs[2750] }
	get kdfNonce(): Uint8Array { return this._attrs[2751] }
	

	get typeInfo(): TypeInfo { return this._attrs[2751] }
	set typeInfo(a: TypeInfo)  { this._attrs[2748] = a } 
}
export const UpdateKdfNoncePostInTypeRef: TypeRef<UpdateKdfNoncePostIn> = new TypeRef("sys", 2752)

export function createUpdateKdfNoncePostIn(values: StrippedEntity<UpdateKdfNoncePostIn>): UpdateKdfNoncePostIn {
    return Object.assign(create(typeModels[UpdateKdfNoncePostInTypeRef.typeId], UpdateKdfNoncePostInTypeRef), values)
}

export type UpdateKdfNoncePostInParams = {

	_format: NumberString;

	instanceKdfNonce: InstanceKdfNonce;
}

export class UpdateKdfNoncePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UpdateKdfNoncePostIn> { return UpdateKdfNoncePostInTypeRef };
	

	get _format(): NumberString { return this._attrs[2753] }
    set _format(v: NumberString) { this._attrs[2753] = v }
	

	get instanceKdfNonce(): InstanceKdfNonce { return this._attrs[2753] }
	set instanceKdfNonce(a: InstanceKdfNonce)  { this._attrs[2754] = a } 
}
export const UpdateKdfNoncePostOutTypeRef: TypeRef<UpdateKdfNoncePostOut> = new TypeRef("sys", 2755)

export function createUpdateKdfNoncePostOut(values: StrippedEntity<UpdateKdfNoncePostOut>): UpdateKdfNoncePostOut {
    return Object.assign(create(typeModels[UpdateKdfNoncePostOutTypeRef.typeId], UpdateKdfNoncePostOutTypeRef), values)
}

export type UpdateKdfNoncePostOutParams = {

	_format: NumberString;
	kdfNonce: Uint8Array;
}

export class UpdateKdfNoncePostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<UpdateKdfNoncePostOut> { return UpdateKdfNoncePostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[2756] }
	get kdfNonce(): Uint8Array { return this._attrs[2757] }
    set kdfNonce(v: Uint8Array) { this._attrs[2757] = v }
	
}
