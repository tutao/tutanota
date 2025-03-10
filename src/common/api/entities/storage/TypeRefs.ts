import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { typeModels } from "./TypeModels.js"
import { BlobReferenceTokenWrapper } from '../sys/TypeRefs.js'
import { Blob } from '../sys/TypeRefs.js'

export const BlobGetInTypeRef: TypeRef<BlobGetIn> = new TypeRef("storage", 50)

export function createBlobGetIn(values: StrippedEntity<BlobGetIn>): BlobGetIn {
	return Object.assign(create(typeModels[BlobGetInTypeRef.typeId], BlobGetInTypeRef), values)
}

export type BlobGetIn = {
	_type: TypeRef<BlobGetIn>;

	_format: NumberString;
	archiveId: Id;
	blobId: null | Id;

	blobIds: BlobId[];
}
export const BlobWriteDataTypeRef: TypeRef<BlobWriteData> = new TypeRef("storage", 73)

export function createBlobWriteData(values: StrippedEntity<BlobWriteData>): BlobWriteData {
	return Object.assign(create(typeModels[BlobWriteDataTypeRef.typeId], BlobWriteDataTypeRef), values)
}

export type BlobWriteData = {
	_type: TypeRef<BlobWriteData>;

	_id: Id;
	archiveOwnerGroup: Id;
}
export const BlobAccessTokenPostInTypeRef: TypeRef<BlobAccessTokenPostIn> = new TypeRef("storage", 77)

export function createBlobAccessTokenPostIn(values: StrippedEntity<BlobAccessTokenPostIn>): BlobAccessTokenPostIn {
	return Object.assign(create(typeModels[BlobAccessTokenPostInTypeRef.typeId], BlobAccessTokenPostInTypeRef), values)
}

export type BlobAccessTokenPostIn = {
	_type: TypeRef<BlobAccessTokenPostIn>;

	_format: NumberString;
	archiveDataType: null | NumberString;

	write: null | BlobWriteData;
	read: null | BlobReadData;
}
export const BlobAccessTokenPostOutTypeRef: TypeRef<BlobAccessTokenPostOut> = new TypeRef("storage", 81)

export function createBlobAccessTokenPostOut(values: StrippedEntity<BlobAccessTokenPostOut>): BlobAccessTokenPostOut {
	return Object.assign(create(typeModels[BlobAccessTokenPostOutTypeRef.typeId], BlobAccessTokenPostOutTypeRef), values)
}

export type BlobAccessTokenPostOut = {
	_type: TypeRef<BlobAccessTokenPostOut>;

	_format: NumberString;

	blobAccessInfo: BlobServerAccessInfo;
}
export const BlobReferencePutInTypeRef: TypeRef<BlobReferencePutIn> = new TypeRef("storage", 94)

export function createBlobReferencePutIn(values: StrippedEntity<BlobReferencePutIn>): BlobReferencePutIn {
	return Object.assign(create(typeModels[BlobReferencePutInTypeRef.typeId], BlobReferencePutInTypeRef), values)
}

export type BlobReferencePutIn = {
	_type: TypeRef<BlobReferencePutIn>;

	_format: NumberString;
	instanceListId: null | Id;
	instanceId: Id;
	archiveDataType: NumberString;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const BlobReferenceDeleteInTypeRef: TypeRef<BlobReferenceDeleteIn> = new TypeRef("storage", 100)

export function createBlobReferenceDeleteIn(values: StrippedEntity<BlobReferenceDeleteIn>): BlobReferenceDeleteIn {
	return Object.assign(create(typeModels[BlobReferenceDeleteInTypeRef.typeId], BlobReferenceDeleteInTypeRef), values)
}

export type BlobReferenceDeleteIn = {
	_type: TypeRef<BlobReferenceDeleteIn>;

	_format: NumberString;
	instanceListId: null | Id;
	instanceId: Id;
	archiveDataType: NumberString;

	blobs: Blob[];
}
export const BlobPostOutTypeRef: TypeRef<BlobPostOut> = new TypeRef("storage", 125)

export function createBlobPostOut(values: StrippedEntity<BlobPostOut>): BlobPostOut {
	return Object.assign(create(typeModels[BlobPostOutTypeRef.typeId], BlobPostOutTypeRef), values)
}

export type BlobPostOut = {
	_type: TypeRef<BlobPostOut>;

	_format: NumberString;
	blobReferenceToken: null | string;

	blobReferenceTokens: BlobReferenceTokenWrapper[];
}
export const BlobArchiveRefTypeRef: TypeRef<BlobArchiveRef> = new TypeRef("storage", 129)

export function createBlobArchiveRef(values: StrippedEntity<BlobArchiveRef>): BlobArchiveRef {
	return Object.assign(create(typeModels[BlobArchiveRefTypeRef.typeId], BlobArchiveRefTypeRef), values)
}

export type BlobArchiveRef = {
	_type: TypeRef<BlobArchiveRef>;

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	archive: Id;
}
export const BlobIdTypeRef: TypeRef<BlobId> = new TypeRef("storage", 144)

export function createBlobId(values: StrippedEntity<BlobId>): BlobId {
	return Object.assign(create(typeModels[BlobIdTypeRef.typeId], BlobIdTypeRef), values)
}

export type BlobId = {
	_type: TypeRef<BlobId>;

	_id: Id;
	blobId: Id;
}
export const BlobServerUrlTypeRef: TypeRef<BlobServerUrl> = new TypeRef("storage", 154)

export function createBlobServerUrl(values: StrippedEntity<BlobServerUrl>): BlobServerUrl {
	return Object.assign(create(typeModels[BlobServerUrlTypeRef.typeId], BlobServerUrlTypeRef), values)
}

export type BlobServerUrl = {
	_type: TypeRef<BlobServerUrl>;

	_id: Id;
	url: string;
}
export const BlobServerAccessInfoTypeRef: TypeRef<BlobServerAccessInfo> = new TypeRef("storage", 157)

export function createBlobServerAccessInfo(values: StrippedEntity<BlobServerAccessInfo>): BlobServerAccessInfo {
	return Object.assign(create(typeModels[BlobServerAccessInfoTypeRef.typeId], BlobServerAccessInfoTypeRef), values)
}

export type BlobServerAccessInfo = {
	_type: TypeRef<BlobServerAccessInfo>;

	_id: Id;
	blobAccessToken: string;
	expires: Date;
	tokenKind: NumberString;

	servers: BlobServerUrl[];
}
export const InstanceIdTypeRef: TypeRef<InstanceId> = new TypeRef("storage", 172)

export function createInstanceId(values: StrippedEntity<InstanceId>): InstanceId {
	return Object.assign(create(typeModels[InstanceIdTypeRef.typeId], InstanceIdTypeRef), values)
}

export type InstanceId = {
	_type: TypeRef<InstanceId>;

	_id: Id;
	instanceId: null | Id;
}
export const BlobReadDataTypeRef: TypeRef<BlobReadData> = new TypeRef("storage", 175)

export function createBlobReadData(values: StrippedEntity<BlobReadData>): BlobReadData {
	return Object.assign(create(typeModels[BlobReadDataTypeRef.typeId], BlobReadDataTypeRef), values)
}

export type BlobReadData = {
	_type: TypeRef<BlobReadData>;

	_id: Id;
	archiveId: Id;
	instanceListId: null | Id;

	instanceIds: InstanceId[];
}
