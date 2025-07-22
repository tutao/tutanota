import { UsageTestAssignmentInTypeRef } from "./TypeRefs.js"
import { UsageTestAssignmentOutTypeRef } from "./TypeRefs.js"
import { UsageTestParticipationInTypeRef } from "./TypeRefs.js"
import { UsageTestParticipationOutTypeRef } from "./TypeRefs.js"
import { UsageTestParticipationDeleteInTypeRef } from "./TypeRefs.js"

export const UsageTestAssignmentService = Object.freeze({
	app: "usage",
	name: "UsageTestAssignmentService",
	get: null,
	post: { data: UsageTestAssignmentInTypeRef, return: UsageTestAssignmentOutTypeRef },
	put: { data: UsageTestAssignmentInTypeRef, return: UsageTestAssignmentOutTypeRef },
	delete: null,
} as const)

export const UsageTestParticipationService = Object.freeze({
	app: "usage",
	name: "UsageTestParticipationService",
	get: null,
	post: { data: UsageTestParticipationInTypeRef, return: UsageTestParticipationOutTypeRef },
	put: null,
	delete: { data: UsageTestParticipationDeleteInTypeRef, return: null },
} as const)