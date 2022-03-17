import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestAssignment} from "./UsageTestAssignment.js"

export const UsageTestAssignmentPostOutTypeRef: TypeRef<UsageTestAssignmentPostOut> = new TypeRef("sys", "UsageTestAssignmentPostOut")
export const _TypeModel: TypeModel = {
	"name": "UsageTestAssignmentPostOut",
	"since": 73,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1967,
	"rootId": "A3N5cwAHrw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1968,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"assignments": {
			"id": 1969,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestAssignment",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "73"
}

export function createUsageTestAssignmentPostOut(values?: Partial<UsageTestAssignmentPostOut>): UsageTestAssignmentPostOut {
	return Object.assign(create(_TypeModel, UsageTestAssignmentPostOutTypeRef), downcast<UsageTestAssignmentPostOut>(values))
}

export type UsageTestAssignmentPostOut = {
	_type: TypeRef<UsageTestAssignmentPostOut>;

	_format: NumberString;

	assignments: UsageTestAssignment[];
}