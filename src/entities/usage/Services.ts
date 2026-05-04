import * as usageTypeRefs from "./TypeRefs.js"
export const UsageTestAssignmentService = Object.freeze({
	app: "usage",
	name: "UsageTestAssignmentService",
	get: null,
	post: { data: usageTypeRefs.UsageTestAssignmentInTypeRef, return: usageTypeRefs.UsageTestAssignmentOutTypeRef },
	put: { data: usageTypeRefs.UsageTestAssignmentInTypeRef, return: usageTypeRefs.UsageTestAssignmentOutTypeRef },
	delete: null,
} as const)

export const UsageTestParticipationService = Object.freeze({
	app: "usage",
	name: "UsageTestParticipationService",
	get: null,
	post: { data: usageTypeRefs.UsageTestParticipationInTypeRef, return: usageTypeRefs.UsageTestParticipationOutTypeRef },
	put: null,
	delete: { data: usageTypeRefs.UsageTestParticipationDeleteInTypeRef, return: null },
} as const)