import {BlobAccessTokenPostInTypeRef} from "./BlobAccessTokenPostIn.js"
import {BlobAccessTokenPostOutTypeRef} from "./BlobAccessTokenPostOut.js"
import {BlobReferencePutInTypeRef} from "./BlobReferencePutIn.js"
import {BlobReferenceDeleteInTypeRef} from "./BlobReferenceDeleteIn.js"
import {BlobGetInTypeRef} from "./BlobGetIn.js"
import {BlobPostOutTypeRef} from "./BlobPostOut.js"

export const BlobAccessTokenService = Object.freeze({
	app: "storage",
	name: "BlobAccessTokenService",
	get: null,
	post: {data: BlobAccessTokenPostInTypeRef, return: BlobAccessTokenPostOutTypeRef},
	put: null,
	delete: null,
} as const)

export const BlobReferenceService = Object.freeze({
	app: "storage",
	name: "BlobReferenceService",
	get: null,
	post: null,
	put: {data: BlobReferencePutInTypeRef, return: null},
	delete: {data: BlobReferenceDeleteInTypeRef, return: null},
} as const)

export const BlobService = Object.freeze({
	app: "storage",
	name: "BlobService",
	get: {data: BlobGetInTypeRef, return: null},
	post: {data: null, return: BlobPostOutTypeRef},
	put: null,
	delete: null,
} as const)