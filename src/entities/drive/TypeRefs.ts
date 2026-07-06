import { create, StrippedEntity } from "../../platform-kit/meta/EntityUtils.js"
import { TypeRef } from "../../platform-kit/meta/TypeRef.js"
import { default as typeModels } from "./TypeModels.js"
import { AggregatedEntity, ElementEntity, Entity, ListElementEntity, BlobElementEntity, DataTransferEntity, AttributeId } from "@tutao/meta"
import { Blob } from '../sys/TypeRefs.js'
import { BlobReferenceTokenWrapper } from '../sys/TypeRefs.js'

export const DriveFolderTypeRef: TypeRef<DriveFolder> = new TypeRef("drive", 0)

export function createDriveFolder(values: StrippedEntity<DriveFolder>): DriveFolder {
    return Object.assign(create(typeModels[DriveFolderTypeRef.typeId], DriveFolderTypeRef), values)
}

export type DriveFolderParams = {

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
	_kdfNonce: null | Uint8Array;

	parent: null | IdTuple;
	originalParent: null | IdTuple;
	files: Id;
}

export class DriveFolder extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFolder> { return DriveFolderTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[2] }
	get _permissions(): Id { return this._attrs[3] }
	get _format(): NumberString { return this._attrs[4] }
	get _ownerGroup(): null | Id { return this._attrs[5] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[6] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[7] }
	get type(): NumberString { return this._attrs[8] }
	get name(): string { return this._attrs[9] }
	get createdDate(): Date { return this._attrs[10] }
	get updatedDate(): Date { return this._attrs[11] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[121] }
	

	get parent(): null | IdTuple { return this._attrs[121] }
	get originalParent(): null | IdTuple { return this._attrs[121] }
	get files(): Id { return this._attrs[121] }
}
export const DriveFileTypeRef: TypeRef<DriveFile> = new TypeRef("drive", 14)

export function createDriveFile(values: StrippedEntity<DriveFile>): DriveFile {
    return Object.assign(create(typeModels[DriveFileTypeRef.typeId], DriveFileTypeRef), values)
}

export type DriveFileParams = {

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
	_kdfNonce: null | Uint8Array;

	folder: IdTuple;
	blobs: Blob[];
	originalParent: null | IdTuple;
}

export class DriveFile extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFile> { return DriveFileTypeRef };
	
	_errors: Object = {} 

	get _id(): IdTuple { return this._attrs[16] }
	get _permissions(): Id { return this._attrs[17] }
	get _format(): NumberString { return this._attrs[18] }
	get _ownerGroup(): null | Id { return this._attrs[19] }
	get _ownerEncSessionKey(): null | Uint8Array { return this._attrs[20] }
	get _ownerKeyVersion(): null | NumberString { return this._attrs[21] }
	get name(): string { return this._attrs[22] }
	get size(): NumberString { return this._attrs[23] }
	get mimeType(): string { return this._attrs[24] }
	get createdDate(): Date { return this._attrs[25] }
	get updatedDate(): Date { return this._attrs[26] }
	get _kdfNonce(): null | Uint8Array { return this._attrs[122] }
	

	get folder(): IdTuple { return this._attrs[122] }
	get blobs(): Blob[] { return this._attrs[122] }
	get originalParent(): null | IdTuple { return this._attrs[122] }
}
export const DriveFileRefTypeRef: TypeRef<DriveFileRef> = new TypeRef("drive", 30)

export function createDriveFileRef(values: StrippedEntity<DriveFileRef>): DriveFileRef {
    return Object.assign(create(typeModels[DriveFileRefTypeRef.typeId], DriveFileRefTypeRef), values)
}

export type DriveFileRefParams = {

	_id: IdTuple;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	file: null | IdTuple;
	folder: null | IdTuple;
}

export class DriveFileRef extends ListElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFileRef> { return DriveFileRefTypeRef };
	

	get _id(): IdTuple { return this._attrs[32] }
	get _permissions(): Id { return this._attrs[33] }
	get _format(): NumberString { return this._attrs[34] }
	get _ownerGroup(): null | Id { return this._attrs[35] }
	

	get file(): null | IdTuple { return this._attrs[35] }
	get folder(): null | IdTuple { return this._attrs[35] }
}
export const DriveFileBagTypeRef: TypeRef<DriveFileBag> = new TypeRef("drive", 39)

export function createDriveFileBag(values: StrippedEntity<DriveFileBag>): DriveFileBag {
    return Object.assign(create(typeModels[DriveFileBagTypeRef.typeId], DriveFileBagTypeRef), values)
}

export type DriveFileBagParams = {

	_id: Id;

	files: Id;
}

export class DriveFileBag extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFileBag> { return DriveFileBagTypeRef };
	

	get _id(): Id { return this._attrs[40] }
	

	get files(): Id { return this._attrs[40] }
}
export const DriveFolderBagTypeRef: TypeRef<DriveFolderBag> = new TypeRef("drive", 42)

export function createDriveFolderBag(values: StrippedEntity<DriveFolderBag>): DriveFolderBag {
    return Object.assign(create(typeModels[DriveFolderBagTypeRef.typeId], DriveFolderBagTypeRef), values)
}

export type DriveFolderBagParams = {

	_id: Id;

	folders: Id;
}

export class DriveFolderBag extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFolderBag> { return DriveFolderBagTypeRef };
	

	get _id(): Id { return this._attrs[43] }
	

	get folders(): Id { return this._attrs[43] }
}
export const DriveGroupRootTypeRef: TypeRef<DriveGroupRoot> = new TypeRef("drive", 45)

export function createDriveGroupRoot(values: StrippedEntity<DriveGroupRoot>): DriveGroupRoot {
    return Object.assign(create(typeModels[DriveGroupRootTypeRef.typeId], DriveGroupRootTypeRef), values)
}

export type DriveGroupRootParams = {

	_id: Id;
	_permissions: Id;
	_format: NumberString;
	_ownerGroup: null | Id;

	fileBags: DriveFileBag[];
	folderBags: DriveFolderBag[];
	root: IdTuple;
	trash: IdTuple;
}

export class DriveGroupRoot extends ElementEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveGroupRoot> { return DriveGroupRootTypeRef };
	

	get _id(): Id { return this._attrs[47] }
	get _permissions(): Id { return this._attrs[48] }
	get _format(): NumberString { return this._attrs[49] }
	get _ownerGroup(): null | Id { return this._attrs[50] }
	

	get fileBags(): DriveFileBag[] { return this._attrs[50] }
	set fileBags(a: DriveFileBag[])  { this._attrs[51] = a } 
	get folderBags(): DriveFolderBag[] { return this._attrs[50] }
	set folderBags(a: DriveFolderBag[])  { this._attrs[52] = a } 
	get root(): IdTuple { return this._attrs[50] }
	set root(a: IdTuple)  { this._attrs[53] = a } 
	get trash(): IdTuple { return this._attrs[50] }
	set trash(a: IdTuple)  { this._attrs[54] = a } 
}
export const DriveUploadedFileTypeRef: TypeRef<DriveUploadedFile> = new TypeRef("drive", 55)

export function createDriveUploadedFile(values: StrippedEntity<DriveUploadedFile>): DriveUploadedFile {
    return Object.assign(create(typeModels[DriveUploadedFileTypeRef.typeId], DriveUploadedFileTypeRef), values)
}

export type DriveUploadedFileParams = {

	_id: Id;
	fileName: string;
	mimeType: string;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	referenceTokens: BlobReferenceTokenWrapper[];
}

export class DriveUploadedFile extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveUploadedFile> { return DriveUploadedFileTypeRef };
	

	get _id(): Id { return this._attrs[56] }
	get fileName(): string { return this._attrs[57] }
	get mimeType(): string { return this._attrs[58] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[59] }
	get ownerKeyVersion(): NumberString { return this._attrs[112] }
    set ownerKeyVersion(v: NumberString) { this._attrs[112] = v }
	

	get referenceTokens(): BlobReferenceTokenWrapper[] { return this._attrs[112] }
}
export const DrivePostInTypeRef: TypeRef<DrivePostIn> = new TypeRef("drive", 61)

export function createDrivePostIn(values: StrippedEntity<DrivePostIn>): DrivePostIn {
    return Object.assign(create(typeModels[DrivePostInTypeRef.typeId], DrivePostInTypeRef), values)
}

export type DrivePostInParams = {

	_format: NumberString;
	ownerEncRootFolderSessionKey: Uint8Array;
	ownerEncTrashFolderSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	fileGroupId: Id;
}

export class DrivePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DrivePostIn> { return DrivePostInTypeRef };
	

	get _format(): NumberString { return this._attrs[62] }
	get ownerEncRootFolderSessionKey(): Uint8Array { return this._attrs[64] }
	get ownerEncTrashFolderSessionKey(): Uint8Array { return this._attrs[65] }
	get ownerKeyVersion(): NumberString { return this._attrs[113] }
    set ownerKeyVersion(v: NumberString) { this._attrs[113] = v }
	

	get fileGroupId(): Id { return this._attrs[113] }
}
export const DriveItemPostInTypeRef: TypeRef<DriveItemPostIn> = new TypeRef("drive", 67)

export function createDriveItemPostIn(values: StrippedEntity<DriveItemPostIn>): DriveItemPostIn {
    return Object.assign(create(typeModels[DriveItemPostInTypeRef.typeId], DriveItemPostInTypeRef), values)
}

export type DriveItemPostInParams = {

	_format: NumberString;

	parent: IdTuple;
	uploadedFile: DriveUploadedFile;
}

export class DriveItemPostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveItemPostIn> { return DriveItemPostInTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[68] }
    set _format(v: NumberString) { this._attrs[68] = v }
	

	get parent(): IdTuple { return this._attrs[68] }
	get uploadedFile(): DriveUploadedFile { return this._attrs[68] }
}
export const DriveItemPostOutTypeRef: TypeRef<DriveItemPostOut> = new TypeRef("drive", 71)

export function createDriveItemPostOut(values: StrippedEntity<DriveItemPostOut>): DriveItemPostOut {
    return Object.assign(create(typeModels[DriveItemPostOutTypeRef.typeId], DriveItemPostOutTypeRef), values)
}

export type DriveItemPostOutParams = {

	_format: NumberString;

	createdFile: IdTuple;
}

export class DriveItemPostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveItemPostOut> { return DriveItemPostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[72] }
    set _format(v: NumberString) { this._attrs[72] = v }
	

	get createdFile(): IdTuple { return this._attrs[72] }
	set createdFile(a: IdTuple)  { this._attrs[73] = a } 
}
export const DriveItemPutInTypeRef: TypeRef<DriveItemPutIn> = new TypeRef("drive", 74)

export function createDriveItemPutIn(values: StrippedEntity<DriveItemPutIn>): DriveItemPutIn {
    return Object.assign(create(typeModels[DriveItemPutInTypeRef.typeId], DriveItemPutInTypeRef), values)
}

export type DriveItemPutInParams = {

	_format: NumberString;
	newName: string;

	file: null | IdTuple;
	folder: null | IdTuple;
}

export class DriveItemPutIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveItemPutIn> { return DriveItemPutInTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[75] }
	get newName(): string { return this._attrs[76] }
	

	get file(): null | IdTuple { return this._attrs[76] }
	get folder(): null | IdTuple { return this._attrs[76] }
}
export const DriveItemDeleteInTypeRef: TypeRef<DriveItemDeleteIn> = new TypeRef("drive", 79)

export function createDriveItemDeleteIn(values: StrippedEntity<DriveItemDeleteIn>): DriveItemDeleteIn {
    return Object.assign(create(typeModels[DriveItemDeleteInTypeRef.typeId], DriveItemDeleteInTypeRef), values)
}

export type DriveItemDeleteInParams = {

	_format: NumberString;

	files: IdTuple[];
	folders: IdTuple[];
}

export class DriveItemDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveItemDeleteIn> { return DriveItemDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[80] }
    set _format(v: NumberString) { this._attrs[80] = v }
	

	get files(): IdTuple[] { return this._attrs[80] }
	set files(a: IdTuple[])  { this._attrs[81] = a } 
	get folders(): IdTuple[] { return this._attrs[80] }
	set folders(a: IdTuple[])  { this._attrs[82] = a } 
}
export const DriveFolderServicePostInTypeRef: TypeRef<DriveFolderServicePostIn> = new TypeRef("drive", 84)

export function createDriveFolderServicePostIn(values: StrippedEntity<DriveFolderServicePostIn>): DriveFolderServicePostIn {
    return Object.assign(create(typeModels[DriveFolderServicePostInTypeRef.typeId], DriveFolderServicePostInTypeRef), values)
}

export type DriveFolderServicePostInParams = {

	_format: NumberString;
	folderName: string;
	ownerEncSessionKey: Uint8Array;
	ownerKeyVersion: NumberString;

	parent: IdTuple;
}

export class DriveFolderServicePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFolderServicePostIn> { return DriveFolderServicePostInTypeRef };
	
	_errors: Object = {} 

	get _format(): NumberString { return this._attrs[85] }
	get folderName(): string { return this._attrs[86] }
	get ownerEncSessionKey(): Uint8Array { return this._attrs[87] }
	get ownerKeyVersion(): NumberString { return this._attrs[114] }
    set ownerKeyVersion(v: NumberString) { this._attrs[114] = v }
	

	get parent(): IdTuple { return this._attrs[114] }
}
export const DriveFolderServicePostOutTypeRef: TypeRef<DriveFolderServicePostOut> = new TypeRef("drive", 89)

export function createDriveFolderServicePostOut(values: StrippedEntity<DriveFolderServicePostOut>): DriveFolderServicePostOut {
    return Object.assign(create(typeModels[DriveFolderServicePostOutTypeRef.typeId], DriveFolderServicePostOutTypeRef), values)
}

export type DriveFolderServicePostOutParams = {

	_format: NumberString;

	folder: IdTuple;
}

export class DriveFolderServicePostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFolderServicePostOut> { return DriveFolderServicePostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[90] }
    set _format(v: NumberString) { this._attrs[90] = v }
	

	get folder(): IdTuple { return this._attrs[90] }
}
export const DriveRenameDataTypeRef: TypeRef<DriveRenameData> = new TypeRef("drive", 92)

export function createDriveRenameData(values: StrippedEntity<DriveRenameData>): DriveRenameData {
    return Object.assign(create(typeModels[DriveRenameDataTypeRef.typeId], DriveRenameDataTypeRef), values)
}

export type DriveRenameDataParams = {

	_id: Id;
	encNewName: null | Uint8Array;

	file: null | IdTuple;
	folder: null | IdTuple;
}

export class DriveRenameData extends AggregatedEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveRenameData> { return DriveRenameDataTypeRef };
	

	get _id(): Id { return this._attrs[93] }
	get encNewName(): null | Uint8Array { return this._attrs[94] }
	

	get file(): null | IdTuple { return this._attrs[94] }
	get folder(): null | IdTuple { return this._attrs[94] }
}
export const DriveFolderServicePutInTypeRef: TypeRef<DriveFolderServicePutIn> = new TypeRef("drive", 97)

export function createDriveFolderServicePutIn(values: StrippedEntity<DriveFolderServicePutIn>): DriveFolderServicePutIn {
    return Object.assign(create(typeModels[DriveFolderServicePutInTypeRef.typeId], DriveFolderServicePutInTypeRef), values)
}

export type DriveFolderServicePutInParams = {

	_format: NumberString;

	items: DriveRenameData[];
	destination: IdTuple;
}

export class DriveFolderServicePutIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFolderServicePutIn> { return DriveFolderServicePutInTypeRef };
	

	get _format(): NumberString { return this._attrs[98] }
    set _format(v: NumberString) { this._attrs[98] = v }
	

	get items(): DriveRenameData[] { return this._attrs[98] }
	set items(a: DriveRenameData[])  { this._attrs[99] = a } 
	get destination(): IdTuple { return this._attrs[98] }
}
export const DriveFolderServiceDeleteInTypeRef: TypeRef<DriveFolderServiceDeleteIn> = new TypeRef("drive", 101)

export function createDriveFolderServiceDeleteIn(values: StrippedEntity<DriveFolderServiceDeleteIn>): DriveFolderServiceDeleteIn {
    return Object.assign(create(typeModels[DriveFolderServiceDeleteInTypeRef.typeId], DriveFolderServiceDeleteInTypeRef), values)
}

export type DriveFolderServiceDeleteInParams = {

	_format: NumberString;
	restore: boolean;

	files: IdTuple[];
	folders: IdTuple[];
}

export class DriveFolderServiceDeleteIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveFolderServiceDeleteIn> { return DriveFolderServiceDeleteInTypeRef };
	

	get _format(): NumberString { return this._attrs[102] }
	get restore(): boolean { return this._attrs[105] }
    set restore(v: boolean) { this._attrs[105] = v }
	

	get files(): IdTuple[] { return this._attrs[105] }
	get folders(): IdTuple[] { return this._attrs[105] }
}
export const DriveCopyServicePostInTypeRef: TypeRef<DriveCopyServicePostIn> = new TypeRef("drive", 107)

export function createDriveCopyServicePostIn(values: StrippedEntity<DriveCopyServicePostIn>): DriveCopyServicePostIn {
    return Object.assign(create(typeModels[DriveCopyServicePostInTypeRef.typeId], DriveCopyServicePostInTypeRef), values)
}

export type DriveCopyServicePostInParams = {

	_format: NumberString;

	items: DriveRenameData[];
	destination: IdTuple;
}

export class DriveCopyServicePostIn extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveCopyServicePostIn> { return DriveCopyServicePostInTypeRef };
	

	get _format(): NumberString { return this._attrs[108] }
    set _format(v: NumberString) { this._attrs[108] = v }
	

	get items(): DriveRenameData[] { return this._attrs[108] }
	set items(a: DriveRenameData[])  { this._attrs[109] = a } 
	get destination(): IdTuple { return this._attrs[108] }
	set destination(a: IdTuple)  { this._attrs[110] = a } 
}
export const DriveCopyServicePostOutTypeRef: TypeRef<DriveCopyServicePostOut> = new TypeRef("drive", 115)

export function createDriveCopyServicePostOut(values: StrippedEntity<DriveCopyServicePostOut>): DriveCopyServicePostOut {
    return Object.assign(create(typeModels[DriveCopyServicePostOutTypeRef.typeId], DriveCopyServicePostOutTypeRef), values)
}

export type DriveCopyServicePostOutParams = {

	_format: NumberString;
	operationId: Id;
}

export class DriveCopyServicePostOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveCopyServicePostOut> { return DriveCopyServicePostOutTypeRef };
	

	get _format(): NumberString { return this._attrs[116] }
	get operationId(): Id { return this._attrs[117] }
    set operationId(v: Id) { this._attrs[117] = v }
	
}
export const DriveItemServiceDeleteOutTypeRef: TypeRef<DriveItemServiceDeleteOut> = new TypeRef("drive", 118)

export function createDriveItemServiceDeleteOut(values: StrippedEntity<DriveItemServiceDeleteOut>): DriveItemServiceDeleteOut {
    return Object.assign(create(typeModels[DriveItemServiceDeleteOutTypeRef.typeId], DriveItemServiceDeleteOutTypeRef), values)
}

export type DriveItemServiceDeleteOutParams = {

	_format: NumberString;
	operationId: Id;
}

export class DriveItemServiceDeleteOut extends DataTransferEntity {
	_attrs: Record<AttributeId, any> = {}
	_original: Record<AttributeId, any> = {}
	get _type(): TypeRef<DriveItemServiceDeleteOut> { return DriveItemServiceDeleteOutTypeRef };
	

	get _format(): NumberString { return this._attrs[119] }
	get operationId(): Id { return this._attrs[120] }
    set operationId(v: Id) { this._attrs[120] = v }
	
}
