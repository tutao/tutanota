import {UsageTestAssignmentInTypeRef} from "./UsageTestAssignmentIn.js"
import {UsageTestAssignmentOutTypeRef} from "./UsageTestAssignmentOut.js"
import {UsageTestParticipationInTypeRef} from "./UsageTestParticipationIn.js"

export const UsageTestAssignmentService = Object.freeze({
	app: "usage",
	name: "UsageTestAssignmentService",
	get: null,
	post: {data: UsageTestAssignmentInTypeRef, return: UsageTestAssignmentOutTypeRef},
	put: {data: UsageTestAssignmentInTypeRef, return: UsageTestAssignmentOutTypeRef},
	delete: null,
} as const)

export const UsageTestParticipationService = Object.freeze({
	app: "usage",
	name: "UsageTestParticipationService",
	get: null,
	post: {data: UsageTestParticipationInTypeRef, return: null},
	put: null,
	delete: null,
} as const)