import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestAssignment} from "./UsageTestAssignment.js"

export const UsageTestAssignmentOutTypeRef: TypeRef<UsageTestAssignmentOut> = new TypeRef("sys", "UsageTestAssignmentOut")
export const _TypeModel: TypeModel = {
	"name": "UsageTestAssignmentOut",
	"since": 73,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1966,
	"rootId": "A3N5cwAHrg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1967,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testDeviceId": {
			"id": 1968,
			"type": "GeneratedId",
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
	"version": "74"
}

export function createUsageTestAssignmentOut(values?: Partial<UsageTestAssignmentOut>): UsageTestAssignmentOut {
	return Object.assign(create(_TypeModel, UsageTestAssignmentOutTypeRef), downcast<UsageTestAssignmentOut>(values))
}

export type UsageTestAssignmentOut = {
	_type: TypeRef<UsageTestAssignmentOut>;

	_format: NumberString;
	testDeviceId: Id;

	assignments: UsageTestAssignment[];
}