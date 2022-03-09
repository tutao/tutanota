import {ReadCounterDataTypeRef} from "./ReadCounterData.js"
import {ReadCounterReturnTypeRef} from "./ReadCounterReturn.js"
import {WriteCounterDataTypeRef} from "./WriteCounterData.js"

export const CounterService = Object.freeze({
	app: "monitor",
	name: "CounterService",
	get: {data: ReadCounterDataTypeRef, return: ReadCounterReturnTypeRef},
	post: {data: WriteCounterDataTypeRef, return: null},
	put: null,
	delete: null,
} as const)