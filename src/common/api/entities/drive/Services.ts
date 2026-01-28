import { DriveCopyServicePostInTypeRef } from "./TypeRefs.js"
import { DriveFolderServicePostInTypeRef } from "./TypeRefs.js"
import { DriveFolderServicePostOutTypeRef } from "./TypeRefs.js"
import { DriveFolderServicePutInTypeRef } from "./TypeRefs.js"
import { DriveFolderServiceDeleteInTypeRef } from "./TypeRefs.js"
import { DriveItemPostInTypeRef } from "./TypeRefs.js"
import { DriveItemPostOutTypeRef } from "./TypeRefs.js"
import { DriveItemPutInTypeRef } from "./TypeRefs.js"
import { DriveItemDeleteInTypeRef } from "./TypeRefs.js"
import { DrivePostInTypeRef } from "./TypeRefs.js"

export const DriveCopyService = Object.freeze({
	app: "drive",
	name: "DriveCopyService",
	get: null,
	post: { data: DriveCopyServicePostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const DriveFolderService = Object.freeze({
	app: "drive",
	name: "DriveFolderService",
	get: null,
	post: { data: DriveFolderServicePostInTypeRef, return: DriveFolderServicePostOutTypeRef },
	put: { data: DriveFolderServicePutInTypeRef, return: null },
	delete: { data: DriveFolderServiceDeleteInTypeRef, return: null },
} as const)

export const DriveItemService = Object.freeze({
	app: "drive",
	name: "DriveItemService",
	get: null,
	post: { data: DriveItemPostInTypeRef, return: DriveItemPostOutTypeRef },
	put: { data: DriveItemPutInTypeRef, return: null },
	delete: { data: DriveItemDeleteInTypeRef, return: null },
} as const)

export const DriveService = Object.freeze({
	app: "drive",
	name: "DriveService",
	get: null,
	post: { data: DrivePostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)