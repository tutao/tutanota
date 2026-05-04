import * as driveTypeRefs from "./TypeRefs.js"
export const DriveCopyService = Object.freeze({
	app: "drive",
	name: "DriveCopyService",
	get: null,
	post: { data: driveTypeRefs.DriveCopyServicePostInTypeRef, return: driveTypeRefs.DriveCopyServicePostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const DriveFolderService = Object.freeze({
	app: "drive",
	name: "DriveFolderService",
	get: null,
	post: { data: driveTypeRefs.DriveFolderServicePostInTypeRef, return: driveTypeRefs.DriveFolderServicePostOutTypeRef },
	put: { data: driveTypeRefs.DriveFolderServicePutInTypeRef, return: null },
	delete: { data: driveTypeRefs.DriveFolderServiceDeleteInTypeRef, return: null },
} as const)

export const DriveItemService = Object.freeze({
	app: "drive",
	name: "DriveItemService",
	get: null,
	post: { data: driveTypeRefs.DriveItemPostInTypeRef, return: driveTypeRefs.DriveItemPostOutTypeRef },
	put: { data: driveTypeRefs.DriveItemPutInTypeRef, return: null },
	delete: { data: driveTypeRefs.DriveItemDeleteInTypeRef, return: driveTypeRefs.DriveItemServiceDeleteOutTypeRef },
} as const)

export const DriveService = Object.freeze({
	app: "drive",
	name: "DriveService",
	get: null,
	post: { data: driveTypeRefs.DrivePostInTypeRef, return: null },
	put: null,
	delete: null,
} as const)