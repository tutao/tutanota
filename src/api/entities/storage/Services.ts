import {BlobAccessTokenDataTypeRef} from "./BlobAccessTokenData.js"
import {BlobAccessTokenReturnTypeRef} from "./BlobAccessTokenReturn.js"
import {BlobReferenceDataPutTypeRef} from "./BlobReferenceDataPut.js"
import {BlobReferenceDataDeleteTypeRef} from "./BlobReferenceDataDelete.js"
import {BlobDataGetTypeRef} from "./BlobDataGet.js"

export const BlobAccessTokenService = Object.freeze({
	app: "storage",
	name: "BlobAccessTokenService",
	get: null,
	post: {data: BlobAccessTokenDataTypeRef, return: BlobAccessTokenReturnTypeRef},
	put: null,
	delete: null,
} as const)

export const BlobReferenceService = Object.freeze({
	app: "storage",
	name: "BlobReferenceService",
	get: null,
	post: null,
	put: {data: BlobReferenceDataPutTypeRef, return: null},
	delete: {data: BlobReferenceDataDeleteTypeRef, return: null},
} as const)

export const BlobService = Object.freeze({
	app: "storage",
	name: "BlobService",
	get: {data: BlobDataGetTypeRef, return: null},
	post: null,
	put: null,
	delete: null,
} as const)