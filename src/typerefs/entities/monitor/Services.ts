import * as monitorTypeRefs from "./TypeRefs.js"
export const CounterService = Object.freeze({
	app: "monitor",
	name: "CounterService",
	get: { data: monitorTypeRefs.ReadCounterDataTypeRef, return: monitorTypeRefs.ReadCounterReturnTypeRef },
	post: { data: monitorTypeRefs.WriteCounterDataTypeRef, return: null },
	put: null,
	delete: null,
} as const)

export const ReportErrorService = Object.freeze({
	app: "monitor",
	name: "ReportErrorService",
	get: null,
	post: { data: monitorTypeRefs.ReportErrorInTypeRef, return: null },
	put: null,
	delete: null,
} as const)