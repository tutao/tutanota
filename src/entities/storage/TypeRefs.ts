import { create, StrippedEntity } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import { AggregatedEntity, ElementEntity, Entity, ListElementEntity, BlobElementEntity, DataTransferEntity, AttributeId } from "@tutao/meta"
import { BlobReferenceTokenWrapper } from '../sys/TypeRefs.js'
import { Blob } from '../sys/TypeRefs.js'

export const BlobGetInTypeRef: TypeRef<BlobGetIn> = new TypeRef("storage", 50)

export function createBlobGetIn(values: StrippedEntity<BlobGetIn>): BlobGetIn {
    return Object.assign(create(typeModels[BlobGetInTypeRef.typeId], BlobGetInTypeRef), values)
}

export type BlobGetInParams = {

	_format: NumberString;
	archiveId: Id;
	blobId: null | Id;

	blobIds: BlobId[];
}

export class BlobGetIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobGetIn> { return BlobGetInTypeRef };
	

	get _format(): NumberString { return this._attrs[51] }
	get archiveId(): Id { return this._attrs[52] }
	get blobId(): null | Id { return this._attrs[110] }
    set blobId(v: null | Id) { this._attrs[110] = v }
	

	get blobIds(): BlobId[] { return this._attrs[110] }
}
export const BlobWriteDataTypeRef: TypeRef<BlobWriteData> = new TypeRef("storage", 73)

export function createBlobWriteData(values: StrippedEntity<BlobWriteData>): BlobWriteData {
    return Object.assign(create(typeModels[BlobWriteDataTypeRef.typeId], BlobWriteDataTypeRef), values)
}

export type BlobWriteDataParams = {

	_id: Id;
	archiveOwnerGroup: Id;
}

export class BlobWriteData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobWriteData> { return BlobWriteDataTypeRef };
	

	get _id(): Id { return this._attrs[74] }
	get archiveOwnerGroup(): Id { return this._attrs[75] }
    set archiveOwnerGroup(v: Id) { this._attrs[75] = v }
	
}
export const BlobAccessTokenPostInTypeRef: TypeRef<BlobAccessTokenPostIn> = new TypeRef("storage", 77)

export function createBlobAccessTokenPostIn(values: StrippedEntity<BlobAccessTokenPostIn>): BlobAccessTokenPostIn {
    return Object.assign(create(typeModels[BlobAccessTokenPostInTypeRef.typeId], BlobAccessTokenPostInTypeRef), values)
}

export type BlobAccessTokenPostInParams = {

	_format: NumberString;
	archiveDataType: null | NumberString;

	write: null | BlobWriteData;
	read: null | BlobReadData;
}

export class BlobAccessTokenPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobAccessTokenPostIn> { return BlobAccessTokenPostInTypeRef };
	

	get _format(): NumberString { return this._attrs[78] }
	get archiveDataType(): null | NumberString { return this._attrs[180] }
    set archiveDataType(v: null | NumberString) { this._attrs[180] = v }
	

	get write(): null | BlobWriteData { return this._attrs[180] }
	set write(a: BlobWriteData)  { this._attrs[80] = a } 
	get read(): null | BlobReadData { return this._attrs[180] }
}
export const BlobAccessTokenPostOutTypeRef: TypeRef<BlobAccessTokenPostOut> = new TypeRef("storage", 81)

export function createBlobAccessTokenPostOut(values: StrippedEntity<BlobAccessTokenPostOut>): BlobAccessTokenPostOut {
    return Object.assign(create(typeModels[BlobAccessTokenPostOutTypeRef.typeId], BlobAccessTokenPostOutTypeRef), values)
}

export type BlobAccessTokenPostOutParams = {

	_format: NumberString;

	blobAccessInfo: BlobServerAccessInfo;
}

export class BlobAccessTokenPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobAccessTokenPostOut> { return BlobAccessTokenPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[82] }
    set _format(v: NumberString) { this._attrs[82] = v }
	

	get blobAccessInfo(): BlobServerAccessInfo { return this._attrs[82] }
	set blobAccessInfo(a: BlobServerAccessInfo)  { this._attrs[161] = a } 
}
export const BlobReferencePutInTypeRef: TypeRef<BlobReferencePutIn> = new TypeRef("storage", 94)

export function createBlobReferencePutIn(values: StrippedEntity<BlobReferencePutIn>): BlobReferencePutIn {
    return Object.assign(create(typeModels[BlobReferencePutInTypeRef.typeId], BlobReferencePutInTypeRef), values)
}

export type BlobReferencePutInParams = {

	_format: NumberString;
	instanceListId: null | Id;
	instanceId: Id;
	archiveDataType: NumberString;

	referenceTokens: BlobReferenceTokenWrapper[];
}

export class BlobReferencePutIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobReferencePutIn> { return BlobReferencePutInTypeRef };
	

	get _format(): NumberString { return this._attrs[95] }
	get instanceListId(): null | Id { return this._attrs[97] }
	get instanceId(): Id { return this._attrs[107] }
	get archiveDataType(): NumberString { return this._attrs[123] }
    set archiveDataType(v: NumberString) { this._attrs[123] = v }
	

	get referenceTokens(): BlobReferenceTokenWrapper[] { return this._attrs[123] }
}
export const BlobReferenceDeleteInTypeRef: TypeRef<BlobReferenceDeleteIn> = new TypeRef("storage", 100)

export function createBlobReferenceDeleteIn(values: StrippedEntity<BlobReferenceDeleteIn>): BlobReferenceDeleteIn {
    return Object.assign(create(typeModels[BlobReferenceDeleteInTypeRef.typeId], BlobReferenceDeleteInTypeRef), values)
}

export type BlobReferenceDeleteInParams = {

	_format: NumberString;
	instanceListId: null | Id;
	instanceId: Id;
	archiveDataType: NumberString;

	blobs: Blob[];
}

export class BlobReferenceDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobReferenceDeleteIn> { return BlobReferenceDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[101] }
	get instanceListId(): null | Id { return this._attrs[102] }
	get instanceId(): Id { return this._attrs[103] }
	get archiveDataType(): NumberString { return this._attrs[124] }
    set archiveDataType(v: NumberString) { this._attrs[124] = v }
	

	get blobs(): Blob[] { return this._attrs[124] }
}
export const BlobPostOutTypeRef: TypeRef<BlobPostOut> = new TypeRef("storage", 125)

export function createBlobPostOut(values: StrippedEntity<BlobPostOut>): BlobPostOut {
    return Object.assign(create(typeModels[BlobPostOutTypeRef.typeId], BlobPostOutTypeRef), values)
}

export type BlobPostOutParams = {

	_format: NumberString;
	blobReferenceToken: null | string;

	blobReferenceTokens: BlobReferenceTokenWrapper[];
}

export class BlobPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobPostOut> { return BlobPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[126] }
	get blobReferenceToken(): null | string { return this._attrs[127] }
    set blobReferenceToken(v: null | string) { this._attrs[127] = v }
	

	get blobReferenceTokens(): BlobReferenceTokenWrapper[] { return this._attrs[127] }
}
export const BlobArchiveRefTypeRef: TypeRef<BlobArchiveRef> = new TypeRef("storage", 129)

export function createBlobArchiveRef(values: StrippedEntity<BlobArchiveRef>): BlobArchiveRef {
    return Object.assign(create(typeModels[BlobArchiveRefTypeRef.typeId], BlobArchiveRefTypeRef), values)
}

export type BlobArchiveRefParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	archive: Id;
}

export class BlobArchiveRef extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobArchiveRef> { return BlobArchiveRefTypeRef };
	

	get _id(): IdTuple { return this._attrs[131] }
	get _permissions(): Id { return this._attrs[132] }
	get _format(): NumberString { return this._attrs[133] }
	get _ownerGroup(): null | Id { return this._attrs[134] }
	

	get archive(): Id { return this._attrs[134] }
	set archive(a: Id)  { this._attrs[135] = a } 
}
export const BlobIdTypeRef: TypeRef<BlobId> = new TypeRef("storage", 144)

export function createBlobId(values: StrippedEntity<BlobId>): BlobId {
    return Object.assign(create(typeModels[BlobIdTypeRef.typeId], BlobIdTypeRef), values)
}

export type BlobIdParams = {

	_id: Id;
	blobId: Id;
}

export class BlobId extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobId> { return BlobIdTypeRef };
	

	get _id(): Id { return this._attrs[145] }
	get blobId(): Id { return this._attrs[146] }
    set blobId(v: Id) { this._attrs[146] = v }
	
}
export const BlobServerUrlTypeRef: TypeRef<BlobServerUrl> = new TypeRef("storage", 154)

export function createBlobServerUrl(values: StrippedEntity<BlobServerUrl>): BlobServerUrl {
    return Object.assign(create(typeModels[BlobServerUrlTypeRef.typeId], BlobServerUrlTypeRef), values)
}

export type BlobServerUrlParams = {

	_id: Id;
	url: string;
}

export class BlobServerUrl extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobServerUrl> { return BlobServerUrlTypeRef };
	

	get _id(): Id { return this._attrs[155] }
	get url(): string { return this._attrs[156] }
    set url(v: string) { this._attrs[156] = v }
	
}
export const BlobServerAccessInfoTypeRef: TypeRef<BlobServerAccessInfo> = new TypeRef("storage", 157)

export function createBlobServerAccessInfo(values: StrippedEntity<BlobServerAccessInfo>): BlobServerAccessInfo {
    return Object.assign(create(typeModels[BlobServerAccessInfoTypeRef.typeId], BlobServerAccessInfoTypeRef), values)
}

export type BlobServerAccessInfoParams = {

	_id: Id;
	blobAccessToken: string;
	expires: Date;
	tokenKind: NumberString;

	servers: BlobServerUrl[];
}

export class BlobServerAccessInfo extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobServerAccessInfo> { return BlobServerAccessInfoTypeRef };
	

	get _id(): Id { return this._attrs[158] }
	get blobAccessToken(): string { return this._attrs[159] }
	get expires(): Date { return this._attrs[192] }
	get tokenKind(): NumberString { return this._attrs[209] }
    set tokenKind(v: NumberString) { this._attrs[209] = v }
	

	get servers(): BlobServerUrl[] { return this._attrs[209] }
	set servers(a: BlobServerUrl[])  { this._attrs[160] = a } 
}
export const InstanceIdTypeRef: TypeRef<InstanceId> = new TypeRef("storage", 172)

export function createInstanceId(values: StrippedEntity<InstanceId>): InstanceId {
    return Object.assign(create(typeModels[InstanceIdTypeRef.typeId], InstanceIdTypeRef), values)
}

export type InstanceIdParams = {

	_id: Id;
	instanceId: null | Id;
}

export class InstanceId extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<InstanceId> { return InstanceIdTypeRef };
	

	get _id(): Id { return this._attrs[173] }
	get instanceId(): null | Id { return this._attrs[174] }
	
}
export const BlobReadDataTypeRef: TypeRef<BlobReadData> = new TypeRef("storage", 175)

export function createBlobReadData(values: StrippedEntity<BlobReadData>): BlobReadData {
    return Object.assign(create(typeModels[BlobReadDataTypeRef.typeId], BlobReadDataTypeRef), values)
}

export type BlobReadDataParams = {

	_id: Id;
	archiveId: Id;
	instanceListId: null | Id;

	instanceIds: InstanceId[];
}

export class BlobReadData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<BlobReadData> { return BlobReadDataTypeRef };
	

	get _id(): Id { return this._attrs[176] }
	get archiveId(): Id { return this._attrs[177] }
	get instanceListId(): null | Id { return this._attrs[178] }
	

	get instanceIds(): InstanceId[] { return this._attrs[178] }
}
