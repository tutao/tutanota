import {CustomerAccountReturnTypeRef} from "./TypeRefs.js"

export const CustomerAccountService = Object.freeze({
	app: "accounting",
	name: "CustomerAccountService",
	get: {data: null, return: CustomerAccountReturnTypeRef},
	post: null,
	put: null,
	delete: null,
} as const)