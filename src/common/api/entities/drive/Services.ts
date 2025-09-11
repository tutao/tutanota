import { DriveCreateDataTypeRef } from "./TypeRefs.js"
import { DriveCreateReturnTypeRef } from "./TypeRefs.js"
import { DriveDeleteInTypeRef } from "./TypeRefs.js"
import { DriveDeleteOutTypeRef } from "./TypeRefs.js"

export const DriveService = Object.freeze({
	app: "drive",
	name: "DriveService",
	get: null,
	post: { data: DriveCreateDataTypeRef, return: DriveCreateReturnTypeRef },
	put: null,
	delete: { data: DriveDeleteInTypeRef, return: DriveDeleteOutTypeRef },
} as const)