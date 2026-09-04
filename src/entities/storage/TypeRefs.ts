import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId, DataTransferId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"
import { Nullable } from "@tutao/utils"
import { BlobReferenceTokenWrapper } from "../sys/TypeRefs.js"
import { Blob } from "../sys/TypeRefs.js"

export const BlobGetInTypeRef: TypeRef<BlobGetIn> = new TypeRef("storage", 50)

export function createBlobGetIn(values: BlobGetInParams): BlobGetIn {
	return Object.assign(create(typeModels[BlobGetInTypeRef.typeId], BlobGetInTypeRef), values)
}

export type BlobGetInParams = {
	archiveId: Id
	blobId: null | Id

	blobIds: BlobId[]
}

export type BlobGetIn = {
	// == values

	_format: NumberString
	archiveId: Id
	blobId: null | Id

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	blobIds: BlobId[]

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
	_type: TypeRef<BlobGetIn>
	_original: Nullable<BlobGetIn>
	isAdapter: false
}
export const BlobWriteDataTypeRef: TypeRef<BlobWriteData> = new TypeRef("storage", 73)

export function createBlobWriteData(values: BlobWriteDataParams): BlobWriteData {
	return Object.assign(create(typeModels[BlobWriteDataTypeRef.typeId], BlobWriteDataTypeRef), values)
}

export type BlobWriteDataParams = {
	archiveOwnerGroup: Id
}

export type BlobWriteData = {
	// == values

	_id: Id
	archiveOwnerGroup: Id

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
	_type: TypeRef<BlobWriteData>
	_original: Nullable<BlobWriteData>
	isAdapter: false
}
export const BlobAccessTokenPostInTypeRef: TypeRef<BlobAccessTokenPostIn> = new TypeRef("storage", 77)

export function createBlobAccessTokenPostIn(values: BlobAccessTokenPostInParams): BlobAccessTokenPostIn {
	return Object.assign(create(typeModels[BlobAccessTokenPostInTypeRef.typeId], BlobAccessTokenPostInTypeRef), values)
}

export type BlobAccessTokenPostInParams = {
	archiveDataType: null | NumberString

	write: null | BlobWriteData
	read: null | BlobReadData
}

export type BlobAccessTokenPostIn = {
	// == values

	_format: NumberString
	archiveDataType: null | NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	write: null | BlobWriteData
	read: null | BlobReadData

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
	_type: TypeRef<BlobAccessTokenPostIn>
	_original: Nullable<BlobAccessTokenPostIn>
	isAdapter: false
}
export const BlobAccessTokenPostOutTypeRef: TypeRef<BlobAccessTokenPostOut> = new TypeRef("storage", 81)

export function createBlobAccessTokenPostOut(values: BlobAccessTokenPostOutParams): BlobAccessTokenPostOut {
	return Object.assign(create(typeModels[BlobAccessTokenPostOutTypeRef.typeId], BlobAccessTokenPostOutTypeRef), values)
}

export type BlobAccessTokenPostOutParams = {
	blobAccessInfo: BlobServerAccessInfo
}

export type BlobAccessTokenPostOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	blobAccessInfo: BlobServerAccessInfo

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
	_type: TypeRef<BlobAccessTokenPostOut>
	_original: Nullable<BlobAccessTokenPostOut>
	isAdapter: false
}
export const BlobReferencePutInTypeRef: TypeRef<BlobReferencePutIn> = new TypeRef("storage", 94)

export function createBlobReferencePutIn(values: BlobReferencePutInParams): BlobReferencePutIn {
	return Object.assign(create(typeModels[BlobReferencePutInTypeRef.typeId], BlobReferencePutInTypeRef), values)
}

export type BlobReferencePutInParams = {
	instanceListId: null | Id
	instanceId: Id
	archiveDataType: NumberString

	referenceTokens: BlobReferenceTokenWrapper[]
}

export type BlobReferencePutIn = {
	// == values

	_format: NumberString
	instanceListId: null | Id
	instanceId: Id
	archiveDataType: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	referenceTokens: BlobReferenceTokenWrapper[]

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
	_type: TypeRef<BlobReferencePutIn>
	_original: Nullable<BlobReferencePutIn>
	isAdapter: false
}
export const BlobReferenceDeleteInTypeRef: TypeRef<BlobReferenceDeleteIn> = new TypeRef("storage", 100)

export function createBlobReferenceDeleteIn(values: BlobReferenceDeleteInParams): BlobReferenceDeleteIn {
	return Object.assign(create(typeModels[BlobReferenceDeleteInTypeRef.typeId], BlobReferenceDeleteInTypeRef), values)
}

export type BlobReferenceDeleteInParams = {
	instanceListId: null | Id
	instanceId: Id
	archiveDataType: NumberString

	blobs: Blob[]
}

export type BlobReferenceDeleteIn = {
	// == values

	_format: NumberString
	instanceListId: null | Id
	instanceId: Id
	archiveDataType: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	blobs: Blob[]

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
	_type: TypeRef<BlobReferenceDeleteIn>
	_original: Nullable<BlobReferenceDeleteIn>
	isAdapter: false
}
export const BlobPostOutTypeRef: TypeRef<BlobPostOut> = new TypeRef("storage", 125)

export function createBlobPostOut(values: BlobPostOutParams): BlobPostOut {
	return Object.assign(create(typeModels[BlobPostOutTypeRef.typeId], BlobPostOutTypeRef), values)
}

export type BlobPostOutParams = {
	blobReferenceToken: null | string

	blobReferenceTokens: BlobReferenceTokenWrapper[]
}

export type BlobPostOut = {
	// == values

	_format: NumberString
	blobReferenceToken: null | string

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	blobReferenceTokens: BlobReferenceTokenWrapper[]

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
	_type: TypeRef<BlobPostOut>
	_original: Nullable<BlobPostOut>
	isAdapter: false
}
export const BlobArchiveRefTypeRef: TypeRef<BlobArchiveRef> = new TypeRef("storage", 129)

export function createBlobArchiveRef(values: BlobArchiveRefParams): BlobArchiveRef {
	return Object.assign(create(typeModels[BlobArchiveRefTypeRef.typeId], BlobArchiveRefTypeRef), values)
}

export type BlobArchiveRefParams = {
	archive: Id
}

export type BlobArchiveRef = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	archive: Id

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<BlobArchiveRef>
	_original: Nullable<BlobArchiveRef>
	isAdapter: false
}
export const BlobIdTypeRef: TypeRef<BlobId> = new TypeRef("storage", 144)

export function createBlobId(values: BlobIdParams): BlobId {
	return Object.assign(create(typeModels[BlobIdTypeRef.typeId], BlobIdTypeRef), values)
}

export type BlobIdParams = {
	blobId: Id
}

export type BlobId = {
	// == values

	_id: Id
	blobId: Id

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
	_type: TypeRef<BlobId>
	_original: Nullable<BlobId>
	isAdapter: false
}
export const BlobServerUrlTypeRef: TypeRef<BlobServerUrl> = new TypeRef("storage", 154)

export function createBlobServerUrl(values: BlobServerUrlParams): BlobServerUrl {
	return Object.assign(create(typeModels[BlobServerUrlTypeRef.typeId], BlobServerUrlTypeRef), values)
}

export type BlobServerUrlParams = {
	url: string
}

export type BlobServerUrl = {
	// == values

	_id: Id
	url: string

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
	_type: TypeRef<BlobServerUrl>
	_original: Nullable<BlobServerUrl>
	isAdapter: false
}
export const BlobServerAccessInfoTypeRef: TypeRef<BlobServerAccessInfo> = new TypeRef("storage", 157)

export function createBlobServerAccessInfo(values: BlobServerAccessInfoParams): BlobServerAccessInfo {
	return Object.assign(create(typeModels[BlobServerAccessInfoTypeRef.typeId], BlobServerAccessInfoTypeRef), values)
}

export type BlobServerAccessInfoParams = {
	blobAccessToken: string
	expires: Date
	tokenKind: NumberString

	servers: BlobServerUrl[]
}

export type BlobServerAccessInfo = {
	// == values

	_id: Id
	blobAccessToken: string
	expires: Date
	tokenKind: NumberString

	// == associations

	servers: BlobServerUrl[]

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
	_type: TypeRef<BlobServerAccessInfo>
	_original: Nullable<BlobServerAccessInfo>
	isAdapter: false
}
export const InstanceIdTypeRef: TypeRef<InstanceId> = new TypeRef("storage", 172)

export function createInstanceId(values: InstanceIdParams): InstanceId {
	return Object.assign(create(typeModels[InstanceIdTypeRef.typeId], InstanceIdTypeRef), values)
}

export type InstanceIdParams = {
	instanceId: null | Id
}

export type InstanceId = {
	// == values

	_id: Id
	instanceId: null | Id

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
	_type: TypeRef<InstanceId>
	_original: Nullable<InstanceId>
	isAdapter: false
}
export const BlobReadDataTypeRef: TypeRef<BlobReadData> = new TypeRef("storage", 175)

export function createBlobReadData(values: BlobReadDataParams): BlobReadData {
	return Object.assign(create(typeModels[BlobReadDataTypeRef.typeId], BlobReadDataTypeRef), values)
}

export type BlobReadDataParams = {
	archiveId: Id
	instanceListId: null | Id

	instanceIds: InstanceId[]
}

export type BlobReadData = {
	// == values

	_id: Id
	archiveId: Id
	instanceListId: null | Id

	// == associations

	instanceIds: InstanceId[]

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
	_type: TypeRef<BlobReadData>
	_original: Nullable<BlobReadData>
	isAdapter: false
}
export const ArchiveEnumerationGetInTypeRef: TypeRef<ArchiveEnumerationGetIn> = new TypeRef("storage", 211)

export function createArchiveEnumerationGetIn(values: ArchiveEnumerationGetInParams): ArchiveEnumerationGetIn {
	return Object.assign(create(typeModels[ArchiveEnumerationGetInTypeRef.typeId], ArchiveEnumerationGetInTypeRef), values)
}

export type ArchiveEnumerationGetInParams = {
	archiveType: NumberString

	group: Id
}

export type ArchiveEnumerationGetIn = {
	// == values

	_format: NumberString
	archiveType: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	group: Id

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
	_type: TypeRef<ArchiveEnumerationGetIn>
	_original: Nullable<ArchiveEnumerationGetIn>
	isAdapter: false
}
export const ArchiveEnumerationGetOutTypeRef: TypeRef<ArchiveEnumerationGetOut> = new TypeRef("storage", 215)

export function createArchiveEnumerationGetOut(values: ArchiveEnumerationGetOutParams): ArchiveEnumerationGetOut {
	return Object.assign(create(typeModels[ArchiveEnumerationGetOutTypeRef.typeId], ArchiveEnumerationGetOutTypeRef), values)
}

export type ArchiveEnumerationGetOutParams = {
	archives: Id[]
}

export type ArchiveEnumerationGetOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	archives: Id[]

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
	_type: TypeRef<ArchiveEnumerationGetOut>
	_original: Nullable<ArchiveEnumerationGetOut>
	isAdapter: false
}
