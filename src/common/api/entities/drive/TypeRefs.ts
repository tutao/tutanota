import { create, Stripped, StrippedEntity } from "../../common/utils/EntityUtils.js"
import { TypeRef } from "@tutao/tutanota-utils"
import { typeModels } from "./TypeModels.js"
import { Blob } from '../sys/TypeRefs.js'
import { BlobReferenceTokenWrapper } from '../sys/TypeRefs.js'

export const DriveFolderTypeRef: TypeRef<DriveFolder> = new TypeRef("drive", 0)

export function createDriveFolder(values: StrippedEntity<DriveFolder>): DriveFolder {
    return Object.assign(create(typeModels[DriveFolderTypeRef.typeId], DriveFolderTypeRef), values)
}

export type DriveFolder = {
	_type: TypeRef<DriveFolder>;
	_errors: Object;
	_original?: DriveFolder

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	type: NumberString;
	name: string;
	createdDate: Date;
	updatedDate: Date;

	parent: null | IdTuple;
	files: Id;
}
export const DriveFileTypeRef: TypeRef<DriveFile> = new TypeRef("drive", 13)

export function createDriveFile(values: StrippedEntity<DriveFile>): DriveFile {
    return Object.assign(create(typeModels[DriveFileTypeRef.typeId], DriveFileTypeRef), values)
}

export type DriveFile = {
	_type: TypeRef<DriveFile>;
	_errors: Object;
	_original?: DriveFile

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerKeyVersion: null | NumberString;
	name: string;
	size: NumberString;
	mimeType: string;
	createdDate: Date;
	updatedDate: Date;

	folder: IdTuple;
	blobs: Blob[];
}
export const DriveFileRefTypeRef: TypeRef<DriveFileRef> = new TypeRef("drive", 28)

export function createDriveFileRef(values: StrippedEntity<DriveFileRef>): DriveFileRef {
    return Object.assign(create(typeModels[DriveFileRefTypeRef.typeId], DriveFileRefTypeRef), values)
}

export type DriveFileRef = {
	_type: TypeRef<DriveFileRef>;
	_original?: DriveFileRef

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	file: null | IdTuple;
	folder: null | IdTuple;
}
export const DriveFileBagTypeRef: TypeRef<DriveFileBag> = new TypeRef("drive", 37)

export function createDriveFileBag(values: StrippedEntity<DriveFileBag>): DriveFileBag {
    return Object.assign(create(typeModels[DriveFileBagTypeRef.typeId], DriveFileBagTypeRef), values)
}

export type DriveFileBag = {
	_type: TypeRef<DriveFileBag>;
	_original?: DriveFileBag

	_id: Id;

	files: Id;
}
export const DriveFolderBagTypeRef: TypeRef<DriveFolderBag> = new TypeRef("drive", 40)

export function createDriveFolderBag(values: StrippedEntity<DriveFolderBag>): DriveFolderBag {
    return Object.assign(create(typeModels[DriveFolderBagTypeRef.typeId], DriveFolderBagTypeRef), values)
}

export type DriveFolderBag = {
	_type: TypeRef<DriveFolderBag>;
	_original?: DriveFolderBag

	_id: Id;

	folders: Id;
}
export const DriveGroupRootTypeRef: TypeRef<DriveGroupRoot> = new TypeRef("drive", 43)

export function createDriveGroupRoot(values: StrippedEntity<DriveGroupRoot>): DriveGroupRoot {
    return Object.assign(create(typeModels[DriveGroupRootTypeRef.typeId], DriveGroupRootTypeRef), values)
}

export type DriveGroupRoot = {
	_type: TypeRef<DriveGroupRoot>;
	_original?: DriveGroupRoot

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	fileBags: DriveFileBag[];
	folderBags: DriveFolderBag[];
	root: IdTuple;
	trash: IdTuple;
}
export const DriveUploadedFileTypeRef: TypeRef<DriveUploadedFile> = new TypeRef("drive", 53)

export function createDriveUploadedFile(values: StrippedEntity<DriveUploadedFile>): DriveUploadedFile {
    return Object.assign(create(typeModels[DriveUploadedFileTypeRef.typeId], DriveUploadedFileTypeRef), values)
}

export type DriveUploadedFile = {
	_type: TypeRef<DriveUploadedFile>;
	_original?: DriveUploadedFile

	_id: Id;
	fileName: string;
	mimeType: string;
	createdDate: Date;
	updatedDate: Date;
	ownerEncSessionKey: Uint8Array;

	referenceTokens: BlobReferenceTokenWrapper[];
}
export const DriveCreateDataTypeRef: TypeRef<DriveCreateData> = new TypeRef("drive", 61)

export function createDriveCreateData(values: StrippedEntity<DriveCreateData>): DriveCreateData {
    return Object.assign(create(typeModels[DriveCreateDataTypeRef.typeId], DriveCreateDataTypeRef), values)
}

export type DriveCreateData = {
	_type: TypeRef<DriveCreateData>;
	_errors: Object;
	_original?: DriveCreateData

	_format: NumberString;

	parent: IdTuple;
	uploadedFile: DriveUploadedFile;
}
export const DriveCreateReturnTypeRef: TypeRef<DriveCreateReturn> = new TypeRef("drive", 65)

export function createDriveCreateReturn(values: StrippedEntity<DriveCreateReturn>): DriveCreateReturn {
    return Object.assign(create(typeModels[DriveCreateReturnTypeRef.typeId], DriveCreateReturnTypeRef), values)
}

export type DriveCreateReturn = {
	_type: TypeRef<DriveCreateReturn>;
	_original?: DriveCreateReturn

	_format: NumberString;

	createdFile: IdTuple;
}
export const DriveDeleteInTypeRef: TypeRef<DriveDeleteIn> = new TypeRef("drive", 68)

export function createDriveDeleteIn(values: StrippedEntity<DriveDeleteIn>): DriveDeleteIn {
    return Object.assign(create(typeModels[DriveDeleteInTypeRef.typeId], DriveDeleteInTypeRef), values)
}

export type DriveDeleteIn = {
	_type: TypeRef<DriveDeleteIn>;
	_original?: DriveDeleteIn

	_format: NumberString;

	fileToDelete: IdTuple;
}
export const DriveDeleteOutTypeRef: TypeRef<DriveDeleteOut> = new TypeRef("drive", 71)

export function createDriveDeleteOut(values: StrippedEntity<DriveDeleteOut>): DriveDeleteOut {
    return Object.assign(create(typeModels[DriveDeleteOutTypeRef.typeId], DriveDeleteOutTypeRef), values)
}

export type DriveDeleteOut = {
	_type: TypeRef<DriveDeleteOut>;
	_original?: DriveDeleteOut

	_format: NumberString;
}
