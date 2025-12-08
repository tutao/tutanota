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
	originalParent: null | IdTuple;
	files: Id;
}
export const DriveFileTypeRef: TypeRef<DriveFile> = new TypeRef("drive", 14)

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
	originalParent: null | IdTuple;
}
export const DriveFileRefTypeRef: TypeRef<DriveFileRef> = new TypeRef("drive", 30)

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
export const DriveFileBagTypeRef: TypeRef<DriveFileBag> = new TypeRef("drive", 39)

export function createDriveFileBag(values: StrippedEntity<DriveFileBag>): DriveFileBag {
    return Object.assign(create(typeModels[DriveFileBagTypeRef.typeId], DriveFileBagTypeRef), values)
}

export type DriveFileBag = {
	_type: TypeRef<DriveFileBag>;
	_original?: DriveFileBag

	_id: Id;

	files: Id;
}
export const DriveFolderBagTypeRef: TypeRef<DriveFolderBag> = new TypeRef("drive", 42)

export function createDriveFolderBag(values: StrippedEntity<DriveFolderBag>): DriveFolderBag {
    return Object.assign(create(typeModels[DriveFolderBagTypeRef.typeId], DriveFolderBagTypeRef), values)
}

export type DriveFolderBag = {
	_type: TypeRef<DriveFolderBag>;
	_original?: DriveFolderBag

	_id: Id;

	folders: Id;
}
export const DriveGroupRootTypeRef: TypeRef<DriveGroupRoot> = new TypeRef("drive", 45)

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
export const DriveUploadedFileTypeRef: TypeRef<DriveUploadedFile> = new TypeRef("drive", 55)

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
export const DriveCreateDataTypeRef: TypeRef<DriveCreateData> = new TypeRef("drive", 63)

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
export const DriveCreateReturnTypeRef: TypeRef<DriveCreateReturn> = new TypeRef("drive", 67)

export function createDriveCreateReturn(values: StrippedEntity<DriveCreateReturn>): DriveCreateReturn {
    return Object.assign(create(typeModels[DriveCreateReturnTypeRef.typeId], DriveCreateReturnTypeRef), values)
}

export type DriveCreateReturn = {
	_type: TypeRef<DriveCreateReturn>;
	_original?: DriveCreateReturn

	_format: NumberString;

	createdFile: IdTuple;
}
export const DrivePutInTypeRef: TypeRef<DrivePutIn> = new TypeRef("drive", 70)

export function createDrivePutIn(values: StrippedEntity<DrivePutIn>): DrivePutIn {
    return Object.assign(create(typeModels[DrivePutInTypeRef.typeId], DrivePutInTypeRef), values)
}

export type DrivePutIn = {
	_type: TypeRef<DrivePutIn>;
	_errors: Object;
	_original?: DrivePutIn

	_format: NumberString;
	newName: string;
	updatedDate: Date;

	file: null | IdTuple;
	folder: null | IdTuple;
}
export const DriveDeleteInTypeRef: TypeRef<DriveDeleteIn> = new TypeRef("drive", 76)

export function createDriveDeleteIn(values: StrippedEntity<DriveDeleteIn>): DriveDeleteIn {
    return Object.assign(create(typeModels[DriveDeleteInTypeRef.typeId], DriveDeleteInTypeRef), values)
}

export type DriveDeleteIn = {
	_type: TypeRef<DriveDeleteIn>;
	_original?: DriveDeleteIn

	_format: NumberString;

	fileToDelete: IdTuple;
}
export const DriveDeleteOutTypeRef: TypeRef<DriveDeleteOut> = new TypeRef("drive", 79)

export function createDriveDeleteOut(values: StrippedEntity<DriveDeleteOut>): DriveDeleteOut {
    return Object.assign(create(typeModels[DriveDeleteOutTypeRef.typeId], DriveDeleteOutTypeRef), values)
}

export type DriveDeleteOut = {
	_type: TypeRef<DriveDeleteOut>;
	_original?: DriveDeleteOut

	_format: NumberString;
}
export const DriveFolderServicePostInTypeRef: TypeRef<DriveFolderServicePostIn> = new TypeRef("drive", 82)

export function createDriveFolderServicePostIn(values: StrippedEntity<DriveFolderServicePostIn>): DriveFolderServicePostIn {
    return Object.assign(create(typeModels[DriveFolderServicePostInTypeRef.typeId], DriveFolderServicePostInTypeRef), values)
}

export type DriveFolderServicePostIn = {
	_type: TypeRef<DriveFolderServicePostIn>;
	_errors: Object;
	_original?: DriveFolderServicePostIn

	_format: NumberString;
	folderName: string;
	createdDate: Date;
	updatedDate: Date;
	ownerEncSessionKey: Uint8Array;

	parent: IdTuple;
}
export const DriveFolderServicePostOutTypeRef: TypeRef<DriveFolderServicePostOut> = new TypeRef("drive", 89)

export function createDriveFolderServicePostOut(values: StrippedEntity<DriveFolderServicePostOut>): DriveFolderServicePostOut {
    return Object.assign(create(typeModels[DriveFolderServicePostOutTypeRef.typeId], DriveFolderServicePostOutTypeRef), values)
}

export type DriveFolderServicePostOut = {
	_type: TypeRef<DriveFolderServicePostOut>;
	_original?: DriveFolderServicePostOut

	_format: NumberString;

	folder: IdTuple;
}
export const DriveFolderServicePutInTypeRef: TypeRef<DriveFolderServicePutIn> = new TypeRef("drive", 92)

export function createDriveFolderServicePutIn(values: StrippedEntity<DriveFolderServicePutIn>): DriveFolderServicePutIn {
    return Object.assign(create(typeModels[DriveFolderServicePutInTypeRef.typeId], DriveFolderServicePutInTypeRef), values)
}

export type DriveFolderServicePutIn = {
	_type: TypeRef<DriveFolderServicePutIn>;
	_original?: DriveFolderServicePutIn

	_format: NumberString;

	files: IdTuple[];
	folders: IdTuple[];
	destination: IdTuple;
}
export const DriveFolderServiceDeleteInTypeRef: TypeRef<DriveFolderServiceDeleteIn> = new TypeRef("drive", 97)

export function createDriveFolderServiceDeleteIn(values: StrippedEntity<DriveFolderServiceDeleteIn>): DriveFolderServiceDeleteIn {
    return Object.assign(create(typeModels[DriveFolderServiceDeleteInTypeRef.typeId], DriveFolderServiceDeleteInTypeRef), values)
}

export type DriveFolderServiceDeleteIn = {
	_type: TypeRef<DriveFolderServiceDeleteIn>;
	_original?: DriveFolderServiceDeleteIn

	_format: NumberString;
	restore: boolean;

	files: IdTuple[];
	folders: IdTuple[];
}
export const DriveRenameDataTypeRef: TypeRef<DriveRenameData> = new TypeRef("drive", 103)

export function createDriveRenameData(values: StrippedEntity<DriveRenameData>): DriveRenameData {
    return Object.assign(create(typeModels[DriveRenameDataTypeRef.typeId], DriveRenameDataTypeRef), values)
}

export type DriveRenameData = {
	_type: TypeRef<DriveRenameData>;
	_original?: DriveRenameData

	_id: Id;
	encNewName: Uint8Array;
	encNewDate: Uint8Array;

	file: null | IdTuple;
	folder: null | IdTuple;
}
export const DriveCopyServicePostInTypeRef: TypeRef<DriveCopyServicePostIn> = new TypeRef("drive", 109)

export function createDriveCopyServicePostIn(values: StrippedEntity<DriveCopyServicePostIn>): DriveCopyServicePostIn {
    return Object.assign(create(typeModels[DriveCopyServicePostInTypeRef.typeId], DriveCopyServicePostInTypeRef), values)
}

export type DriveCopyServicePostIn = {
	_type: TypeRef<DriveCopyServicePostIn>;
	_original?: DriveCopyServicePostIn

	_format: NumberString;

	items: DriveRenameData[];
	destination: IdTuple;
}
