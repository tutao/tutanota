import { ApplicationTypesGetOutTypeRef } from "./TypeRefs.js"

export const ApplicationTypesService = Object.freeze({
	app: "base",
	name: "ApplicationTypesService",
	get: { data: null, return: ApplicationTypesGetOutTypeRef },
	post: null,
	put: null,
	delete: null,
} as const)