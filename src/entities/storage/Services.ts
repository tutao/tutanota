import * as storageTypeRefs from "./TypeRefs.js"
export const BlobAccessTokenService = Object.freeze({
	app: "storage",
	name: "BlobAccessTokenService",
	get: null,
	post: { data: storageTypeRefs.BlobAccessTokenPostInTypeRef, return: storageTypeRefs.BlobAccessTokenPostOutTypeRef },
	put: null,
	delete: null,
} as const)

export const BlobReferenceService = Object.freeze({
	app: "storage",
	name: "BlobReferenceService",
	get: null,
	post: null,
	put: { data: storageTypeRefs.BlobReferencePutInTypeRef, return: null },
	delete: { data: storageTypeRefs.BlobReferenceDeleteInTypeRef, return: null },
} as const)

export const BlobService = Object.freeze({
	app: "storage",
	name: "BlobService",
	get: { data: storageTypeRefs.BlobGetInTypeRef, return: null },
	post: { data: null, return: storageTypeRefs.BlobPostOutTypeRef },
	put: null,
	delete: null,
} as const)