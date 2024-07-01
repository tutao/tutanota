import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import {TypeRef} from "@tutao/tutanota-utils"
import {typeModels} from "./TypeModels.js"
import {Blob} from '../sys/TypeRefs.js'
import {BlobReferenceTokenWrapper} from '../sys/TypeRefs.js'

export const BlobAccessTokenPostInTypeRef: TypeRef<BlobAccessTokenPostIn> = new TypeRef("storage", "BlobAccessTokenPostIn")

export function createBlobAccessTokenPostIn(values: StrippedEntity<BlobAccessTokenPostIn>): BlobAccessTokenPostIn {
	return Object.assign(create(typeModels.BlobAccessTokenPostIn, BlobAccessTokenPostInTypeRef), values)
}

export type BlobAccessTokenPostIn = {
	_type: TypeRef<BlobAccessTokenPostIn>;

	_format: NumberString;
	archiveDataType: null | NumberString;

	read:  null | BlobReadData;
	write:  null | BlobWriteData;
}
export const BlobAccessTokenPostOutTypeRef: TypeRef<BlobAccessTokenPostOut> = new TypeRef("storage", "BlobAccessTokenPostOut")

export function createBlobAccessTokenPostOut(values: StrippedEntity<BlobAccessTokenPostOut>): BlobAccessTokenPostOut {
	return Object.assign(create(typeModels.BlobAccessTokenPostOut, BlobAccessTokenPostOutTypeRef), values)
}

export type BlobAccessTokenPostOut = {
	_type: TypeRef<BlobAccessTokenPostOut>;

	_format: NumberString;

	blobAccessInfo: BlobServerAccessInfo;
}
export const BlobArchiveRefTypeRef: TypeRef<BlobArchiveRef> = new TypeRef("storage", "BlobArchiveRef")

export function createBlobArchiveRef(values: StrippedEntity<BlobArchiveRef>): BlobArchiveRef {
	return Object.assign(create(typeModels.BlobArchiveRef, BlobArchiveRefTypeRef), values)
}

export type BlobArchiveRef = {
	_type: TypeRef<BlobArchiveRef>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	archive: Id;
}
export const BlobGetInTypeRef: TypeRef<BlobGetIn> = new TypeRef("storage", "BlobGetIn")

export function createBlobGetIn(values: StrippedEntity<BlobGetIn>): BlobGetIn {
	return Object.assign(create(typeModels.BlobGetIn, BlobGetInTypeRef), values)
}

export type BlobGetIn = {
	_type: TypeRef<BlobGetIn>;

	_format: NumberString;
	archiveId: Id;
	blobId: null | Id;

	blobIds: BlobId[];
}
export const BlobIdTypeRef: TypeRef<BlobId> = new TypeRef("storage", "BlobId")

export function createBlobId(values: StrippedEntity<BlobId>): BlobId {
	return Object.assign(create(typeModels.BlobId, BlobIdTypeRef), values)
}

export type BlobId = {
	_type: TypeRef<BlobId>;

	_id: Id;
	blobId: Id;
}
export const BlobPostOutTypeRef: TypeRef<BlobPostOut> = new TypeRef("storage", "BlobPostOut")

export function createBlobPostOut(values: StrippedEntity<BlobPostOut>): BlobPostOut {
	return Object.assign(create(typeModels.BlobPostOut, BlobPostOutTypeRef), values)
}

export type BlobPostOut = {
	_type: TypeRef<BlobPostOut>;

	_format: NumberString;
	blobReferenceToken: string;
}
export const BlobReadDataTypeRef: TypeRef<BlobReadData> = new TypeRef("storage", "BlobReadData")

export function createBlobReadData(values: StrippedEntity<BlobReadData>): BlobReadData {
	return Object.assign(create(typeModels.BlobReadData, BlobReadDataTypeRef), values)
}

export type BlobReadData = {
	_type: TypeRef<BlobReadData>;

	_id: Id;
	archiveId: Id;
	instanceListId: null | Id;

	instanceIds: InstanceId[];
}
export const BlobReferenceDeleteInTypeRef: TypeRef<BlobReferenceDeleteIn> = new TypeRef("storage", "BlobReferenceDeleteIn")

export function createBlobReferenceDeleteIn(values: StrippedEntity<BlobReferenceDeleteIn>): BlobReferenceDeleteIn {
	return Object.assign(create(typeModels.BlobReferenceDeleteIn, BlobReferenceDeleteInTypeRef), values)
}

export type BlobReferenceDeleteIn = {
	_type: TypeRef<BlobReferenceDeleteIn>;

	_format: NumberString;
	archiveDataType: NumberString;
	instanceId: Id;
	instanceListId: null | Id;

	blobs: Blob[];
}
export const BlobReferencePutInTypeRef: TypeRef<BlobReferencePutIn> = new TypeRef("storage", "BlobReferencePutIn")

export function createBlobReferencePutIn(values: StrippedEntity<BlobReferencePutIn>): BlobReferencePutIn {
	return Object.assign(create(typeModels.BlobReferencePutIn, BlobReferencePutInTypeRef), values)
}

export type BlobReferencePutIn = {
	_type: TypeRef<BlobReferencePutIn>;

	_format: NumberString;
	archiveDataType: NumberString;
	instanceId: Id;
	instanceListId: null | Id;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const BlobServerAccessInfoTypeRef: TypeRef<BlobServerAccessInfo> = new TypeRef("storage", "BlobServerAccessInfo")

export function createBlobServerAccessInfo(values: StrippedEntity<BlobServerAccessInfo>): BlobServerAccessInfo {
	return Object.assign(create(typeModels.BlobServerAccessInfo, BlobServerAccessInfoTypeRef), values)
}

export type BlobServerAccessInfo = {
	_type: TypeRef<BlobServerAccessInfo>;

	_id: Id;
	blobAccessToken: string;
	expires: Date;

	servers: BlobServerUrl[];
}
export const BlobServerUrlTypeRef: TypeRef<BlobServerUrl> = new TypeRef("storage", "BlobServerUrl")

export function createBlobServerUrl(values: StrippedEntity<BlobServerUrl>): BlobServerUrl {
	return Object.assign(create(typeModels.BlobServerUrl, BlobServerUrlTypeRef), values)
}

export type BlobServerUrl = {
	_type: TypeRef<BlobServerUrl>;

	_id: Id;
	url: string;
}
export const BlobWriteDataTypeRef: TypeRef<BlobWriteData> = new TypeRef("storage", "BlobWriteData")

export function createBlobWriteData(values: StrippedEntity<BlobWriteData>): BlobWriteData {
	return Object.assign(create(typeModels.BlobWriteData, BlobWriteDataTypeRef), values)
}

export type BlobWriteData = {
	_type: TypeRef<BlobWriteData>;

	_id: Id;
	archiveOwnerGroup: Id;
}
export const InstanceIdTypeRef: TypeRef<InstanceId> = new TypeRef("storage", "InstanceId")

export function createInstanceId(values: StrippedEntity<InstanceId>): InstanceId {
	return Object.assign(create(typeModels.InstanceId, InstanceIdTypeRef), values)
}

export type InstanceId = {
	_type: TypeRef<InstanceId>;

	_id: Id;
	instanceId: null | Id;
}
