import {ReadCounterDataTypeRef} from "./TypeRefs.js"
import {ReadCounterReturnTypeRef} from "./TypeRefs.js"
import {WriteCounterDataTypeRef} from "./TypeRefs.js"

export const CounterService = Object.freeze({
	app: "monitor",
	name: "CounterService",
	get: {data: ReadCounterDataTypeRef, return: ReadCounterReturnTypeRef},
	post: {data: WriteCounterDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)