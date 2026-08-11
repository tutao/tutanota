import { create } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { ListElementId, ElementId, DataTransferId } from "@tutao/meta"
import { default as typeModels } from "./TypeModels.js"
import { Nullable } from "@tutao/utils"
import { Blob } from "../sys/TypeRefs.js"
import { BlobReferenceTokenWrapper } from "../sys/TypeRefs.js"

export const DriveFolderTypeRef: TypeRef<DriveFolder> = new TypeRef("drive", 0)

export function createDriveFolder(values: DriveFolderParams): DriveFolder {
	return Object.assign(create(typeModels[DriveFolderTypeRef.typeId], DriveFolderTypeRef), values)
}

export type DriveFolderParams = {
	type: NumberString
	name: string
	createdDate: Date
	updatedDate: Date

	parent: null | IdTuple
	originalParent: null | IdTuple
	files: Id
}

export type DriveFolder = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	type: NumberString
	name: string
	createdDate: Date
	updatedDate: Date
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	parent: null | IdTuple
	originalParent: null | IdTuple
	files: Id

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DriveFolder>
	_errors: Object
	_original: Nullable<DriveFolder>
	isAdapter: false
}
export const DriveFileTypeRef: TypeRef<DriveFile> = new TypeRef("drive", 14)

export function createDriveFile(values: DriveFileParams): DriveFile {
	return Object.assign(create(typeModels[DriveFileTypeRef.typeId], DriveFileTypeRef), values)
}

export type DriveFileParams = {
	name: string
	size: NumberString
	mimeType: string
	createdDate: Date
	updatedDate: Date

	folder: IdTuple
	blobs: Blob[]
	originalParent: null | IdTuple
}

export type DriveFile = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id
	_ownerEncSessionKey: null | Uint8Array<ArrayBuffer>
	_ownerKeyVersion: null | NumberString
	name: string
	size: NumberString
	mimeType: string
	createdDate: Date
	updatedDate: Date
	_kdfNonce: null | Uint8Array<ArrayBuffer>

	// == associations

	folder: IdTuple
	blobs: Blob[]
	originalParent: null | IdTuple

	//== some entities have these and some don't

	bucketKey: null

	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DriveFile>
	_errors: Object
	_original: Nullable<DriveFile>
	isAdapter: false
}
export const DriveFileRefTypeRef: TypeRef<DriveFileRef> = new TypeRef("drive", 30)

export function createDriveFileRef(values: DriveFileRefParams): DriveFileRef {
	return Object.assign(create(typeModels[DriveFileRefTypeRef.typeId], DriveFileRefTypeRef), values)
}

export type DriveFileRefParams = {
	file: null | IdTuple
	folder: null | IdTuple
}

export type DriveFileRef = {
	// == values

	_id: ListElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	file: null | IdTuple
	folder: null | IdTuple

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DriveFileRef>
	_original: Nullable<DriveFileRef>
	isAdapter: false
}
export const DriveFileBagTypeRef: TypeRef<DriveFileBag> = new TypeRef("drive", 39)

export function createDriveFileBag(values: DriveFileBagParams): DriveFileBag {
	return Object.assign(create(typeModels[DriveFileBagTypeRef.typeId], DriveFileBagTypeRef), values)
}

export type DriveFileBagParams = {
	files: Id
}

export type DriveFileBag = {
	// == values

	_id: Id

	// == associations

	files: Id

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
	_type: TypeRef<DriveFileBag>
	_original: Nullable<DriveFileBag>
	isAdapter: false
}
export const DriveFolderBagTypeRef: TypeRef<DriveFolderBag> = new TypeRef("drive", 42)

export function createDriveFolderBag(values: DriveFolderBagParams): DriveFolderBag {
	return Object.assign(create(typeModels[DriveFolderBagTypeRef.typeId], DriveFolderBagTypeRef), values)
}

export type DriveFolderBagParams = {
	folders: Id
}

export type DriveFolderBag = {
	// == values

	_id: Id

	// == associations

	folders: Id

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
	_type: TypeRef<DriveFolderBag>
	_original: Nullable<DriveFolderBag>
	isAdapter: false
}
export const DriveGroupRootTypeRef: TypeRef<DriveGroupRoot> = new TypeRef("drive", 45)

export function createDriveGroupRoot(values: DriveGroupRootParams): DriveGroupRoot {
	return Object.assign(create(typeModels[DriveGroupRootTypeRef.typeId], DriveGroupRootTypeRef), values)
}

export type DriveGroupRootParams = {
	fileBags: DriveFileBag[]
	folderBags: DriveFolderBag[]
	root: IdTuple
	trash: IdTuple
}

export type DriveGroupRoot = {
	// == values

	_id: ElementId
	_permissions: Id
	_format: NumberString
	_ownerGroup: null | Id

	// == associations

	fileBags: DriveFileBag[]
	folderBags: DriveFolderBag[]
	root: IdTuple
	trash: IdTuple

	//== some entities have these and some don't

	bucketKey: null

	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null
	ownerEncSessionKey: null
	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DriveGroupRoot>
	_original: Nullable<DriveGroupRoot>
	isAdapter: false
}
export const DriveUploadedFileTypeRef: TypeRef<DriveUploadedFile> = new TypeRef("drive", 55)

export function createDriveUploadedFile(values: DriveUploadedFileParams): DriveUploadedFile {
	return Object.assign(create(typeModels[DriveUploadedFileTypeRef.typeId], DriveUploadedFileTypeRef), values)
}

export type DriveUploadedFileParams = {
	fileName: string
	mimeType: string

	referenceTokens: BlobReferenceTokenWrapper[]
}

export type DriveUploadedFile = {
	// == values

	_id: Id
	fileName: string
	mimeType: string
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString

	// == associations

	referenceTokens: BlobReferenceTokenWrapper[]

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DriveUploadedFile>
	_original: Nullable<DriveUploadedFile>
	isAdapter: false
}
export const DrivePostInTypeRef: TypeRef<DrivePostIn> = new TypeRef("drive", 61)

export function createDrivePostIn(values: DrivePostInParams): DrivePostIn {
	return Object.assign(create(typeModels[DrivePostInTypeRef.typeId], DrivePostInTypeRef), values)
}

export type DrivePostInParams = {
	ownerEncRootFolderSessionKey: Uint8Array<ArrayBuffer>
	ownerEncTrashFolderSessionKey: Uint8Array<ArrayBuffer>

	fileGroupId: Id
}

export type DrivePostIn = {
	// == values

	_format: NumberString
	ownerEncRootFolderSessionKey: Uint8Array<ArrayBuffer>
	ownerEncTrashFolderSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	fileGroupId: Id

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
	_type: TypeRef<DrivePostIn>
	_original: Nullable<DrivePostIn>
	isAdapter: false
}
export const DriveItemPostInTypeRef: TypeRef<DriveItemPostIn> = new TypeRef("drive", 67)

export function createDriveItemPostIn(values: DriveItemPostInParams): DriveItemPostIn {
	return Object.assign(create(typeModels[DriveItemPostInTypeRef.typeId], DriveItemPostInTypeRef), values)
}

export type DriveItemPostInParams = {
	parent: IdTuple
	uploadedFile: DriveUploadedFile
}

export type DriveItemPostIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	parent: IdTuple
	uploadedFile: DriveUploadedFile

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
	_type: TypeRef<DriveItemPostIn>
	_errors: Object
	_original: Nullable<DriveItemPostIn>
	isAdapter: false
}
export const DriveItemPostOutTypeRef: TypeRef<DriveItemPostOut> = new TypeRef("drive", 71)

export function createDriveItemPostOut(values: DriveItemPostOutParams): DriveItemPostOut {
	return Object.assign(create(typeModels[DriveItemPostOutTypeRef.typeId], DriveItemPostOutTypeRef), values)
}

export type DriveItemPostOutParams = {
	createdFile: IdTuple
}

export type DriveItemPostOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	createdFile: IdTuple

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
	_type: TypeRef<DriveItemPostOut>
	_original: Nullable<DriveItemPostOut>
	isAdapter: false
}
export const DriveItemPutInTypeRef: TypeRef<DriveItemPutIn> = new TypeRef("drive", 74)

export function createDriveItemPutIn(values: DriveItemPutInParams): DriveItemPutIn {
	return Object.assign(create(typeModels[DriveItemPutInTypeRef.typeId], DriveItemPutInTypeRef), values)
}

export type DriveItemPutInParams = {
	newName: string

	file: null | IdTuple
	folder: null | IdTuple
}

export type DriveItemPutIn = {
	// == values

	_format: NumberString
	newName: string

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	file: null | IdTuple
	folder: null | IdTuple

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
	_type: TypeRef<DriveItemPutIn>
	_errors: Object
	_original: Nullable<DriveItemPutIn>
	isAdapter: false
}
export const DriveItemDeleteInTypeRef: TypeRef<DriveItemDeleteIn> = new TypeRef("drive", 79)

export function createDriveItemDeleteIn(values: DriveItemDeleteInParams): DriveItemDeleteIn {
	return Object.assign(create(typeModels[DriveItemDeleteInTypeRef.typeId], DriveItemDeleteInTypeRef), values)
}

export type DriveItemDeleteInParams = {
	files: IdTuple[]
	folders: IdTuple[]
}

export type DriveItemDeleteIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	files: IdTuple[]
	folders: IdTuple[]

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
	_type: TypeRef<DriveItemDeleteIn>
	_original: Nullable<DriveItemDeleteIn>
	isAdapter: false
}
export const DriveFolderServicePostInTypeRef: TypeRef<DriveFolderServicePostIn> = new TypeRef("drive", 84)

export function createDriveFolderServicePostIn(values: DriveFolderServicePostInParams): DriveFolderServicePostIn {
	return Object.assign(create(typeModels[DriveFolderServicePostInTypeRef.typeId], DriveFolderServicePostInTypeRef), values)
}

export type DriveFolderServicePostInParams = {
	folderName: string

	parent: IdTuple
}

export type DriveFolderServicePostIn = {
	// == values

	_format: NumberString
	folderName: string
	ownerEncSessionKey: Uint8Array<ArrayBuffer>
	ownerKeyVersion: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	parent: IdTuple

	//== some entities have these and some don't
	_permissions: null
	bucketKey: null
	_ownerGroup: null
	_ownerEncSessionKey: null
	_ownerKeyVersion: null
	_kdfNonce: null

	ownerEncSessionKeyVersion: null

	// === these are not present in metamodel
	_type: TypeRef<DriveFolderServicePostIn>
	_errors: Object
	_original: Nullable<DriveFolderServicePostIn>
	isAdapter: false
}
export const DriveFolderServicePostOutTypeRef: TypeRef<DriveFolderServicePostOut> = new TypeRef("drive", 89)

export function createDriveFolderServicePostOut(values: DriveFolderServicePostOutParams): DriveFolderServicePostOut {
	return Object.assign(create(typeModels[DriveFolderServicePostOutTypeRef.typeId], DriveFolderServicePostOutTypeRef), values)
}

export type DriveFolderServicePostOutParams = {
	folder: IdTuple
}

export type DriveFolderServicePostOut = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	folder: IdTuple

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
	_type: TypeRef<DriveFolderServicePostOut>
	_original: Nullable<DriveFolderServicePostOut>
	isAdapter: false
}
export const DriveRenameDataTypeRef: TypeRef<DriveRenameData> = new TypeRef("drive", 92)

export function createDriveRenameData(values: DriveRenameDataParams): DriveRenameData {
	return Object.assign(create(typeModels[DriveRenameDataTypeRef.typeId], DriveRenameDataTypeRef), values)
}

export type DriveRenameDataParams = {
	encNewName: null | Uint8Array<ArrayBuffer>

	file: null | IdTuple
	folder: null | IdTuple
}

export type DriveRenameData = {
	// == values

	_id: Id
	encNewName: null | Uint8Array<ArrayBuffer>

	// == associations

	file: null | IdTuple
	folder: null | IdTuple

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
	_type: TypeRef<DriveRenameData>
	_original: Nullable<DriveRenameData>
	isAdapter: false
}
export const DriveFolderServicePutInTypeRef: TypeRef<DriveFolderServicePutIn> = new TypeRef("drive", 97)

export function createDriveFolderServicePutIn(values: DriveFolderServicePutInParams): DriveFolderServicePutIn {
	return Object.assign(create(typeModels[DriveFolderServicePutInTypeRef.typeId], DriveFolderServicePutInTypeRef), values)
}

export type DriveFolderServicePutInParams = {
	items: DriveRenameData[]
	destination: IdTuple
}

export type DriveFolderServicePutIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	items: DriveRenameData[]
	destination: IdTuple

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
	_type: TypeRef<DriveFolderServicePutIn>
	_original: Nullable<DriveFolderServicePutIn>
	isAdapter: false
}
export const DriveFolderServiceDeleteInTypeRef: TypeRef<DriveFolderServiceDeleteIn> = new TypeRef("drive", 101)

export function createDriveFolderServiceDeleteIn(values: DriveFolderServiceDeleteInParams): DriveFolderServiceDeleteIn {
	return Object.assign(create(typeModels[DriveFolderServiceDeleteInTypeRef.typeId], DriveFolderServiceDeleteInTypeRef), values)
}

export type DriveFolderServiceDeleteInParams = {
	restore: boolean

	files: IdTuple[]
	folders: IdTuple[]
}

export type DriveFolderServiceDeleteIn = {
	// == values

	_format: NumberString
	restore: boolean

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	files: IdTuple[]
	folders: IdTuple[]

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
	_type: TypeRef<DriveFolderServiceDeleteIn>
	_original: Nullable<DriveFolderServiceDeleteIn>
	isAdapter: false
}
export const DriveCopyServicePostInTypeRef: TypeRef<DriveCopyServicePostIn> = new TypeRef("drive", 107)

export function createDriveCopyServicePostIn(values: DriveCopyServicePostInParams): DriveCopyServicePostIn {
	return Object.assign(create(typeModels[DriveCopyServicePostInTypeRef.typeId], DriveCopyServicePostInTypeRef), values)
}

export type DriveCopyServicePostInParams = {
	items: DriveRenameData[]
	destination: IdTuple
}

export type DriveCopyServicePostIn = {
	// == values

	_format: NumberString

	// == _id does not exist in metamodel, this is just to satisfy the DataTransferEntity interface
	_id: DataTransferId

	// == associations

	items: DriveRenameData[]
	destination: IdTuple

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
	_type: TypeRef<DriveCopyServicePostIn>
	_original: Nullable<DriveCopyServicePostIn>
	isAdapter: false
}
export const DriveCopyServicePostOutTypeRef: TypeRef<DriveCopyServicePostOut> = new TypeRef("drive", 115)

export function createDriveCopyServicePostOut(values: DriveCopyServicePostOutParams): DriveCopyServicePostOut {
	return Object.assign(create(typeModels[DriveCopyServicePostOutTypeRef.typeId], DriveCopyServicePostOutTypeRef), values)
}

export type DriveCopyServicePostOutParams = {
	operationId: Id
}

export type DriveCopyServicePostOut = {
	// == values

	_format: NumberString
	operationId: Id
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
	_type: TypeRef<DriveCopyServicePostOut>
	_original: Nullable<DriveCopyServicePostOut>
	isAdapter: false
}
export const DriveItemServiceDeleteOutTypeRef: TypeRef<DriveItemServiceDeleteOut> = new TypeRef("drive", 118)

export function createDriveItemServiceDeleteOut(values: DriveItemServiceDeleteOutParams): DriveItemServiceDeleteOut {
	return Object.assign(create(typeModels[DriveItemServiceDeleteOutTypeRef.typeId], DriveItemServiceDeleteOutTypeRef), values)
}

export type DriveItemServiceDeleteOutParams = {
	operationId: Id
}

export type DriveItemServiceDeleteOut = {
	// == values

	_format: NumberString
	operationId: Id
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
	_type: TypeRef<DriveItemServiceDeleteOut>
	_original: Nullable<DriveItemServiceDeleteOut>
	isAdapter: false
}
