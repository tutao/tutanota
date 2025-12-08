import { DriveFolderServicePostInTypeRef } from "./TypeRefs.js"
import { DriveFolderServicePostOutTypeRef } from "./TypeRefs.js"
import { DriveFolderServicePutInTypeRef } from "./TypeRefs.js"
import { DriveFolderServiceDeleteInTypeRef } from "./TypeRefs.js"
import { DriveCreateDataTypeRef } from "./TypeRefs.js"
import { DriveCreateReturnTypeRef } from "./TypeRefs.js"
import { DrivePutInTypeRef } from "./TypeRefs.js"
import { DriveDeleteInTypeRef } from "./TypeRefs.js"
import { DriveDeleteOutTypeRef } from "./TypeRefs.js"

export const DriveFolderService = Object.freeze({
	app: "drive",
	name: "DriveFolderService",
	get: null,
	post: { data: DriveFolderServicePostInTypeRef, return: DriveFolderServicePostOutTypeRef },
	put: { data: DriveFolderServicePutInTypeRef, return: null },
	delete: { data: DriveFolderServiceDeleteInTypeRef, return: null },
} as const)

export const DriveService = Object.freeze({
	app: "drive",
	name: "DriveService",
	get: null,
	post: { data: DriveCreateDataTypeRef, return: DriveCreateReturnTypeRef },
	put: { data: DrivePutInTypeRef, return: null },
	delete: { data: DriveDeleteInTypeRef, return: DriveDeleteOutTypeRef },
} as const)