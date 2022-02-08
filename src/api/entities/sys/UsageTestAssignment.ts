import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestAssignmentTypeRef: TypeRef<UsageTestAssignment> = new TypeRef("sys", "UsageTestAssignment")
export const _TypeModel: TypeModel = {
	"name": "UsageTestAssignment",
	"since": 72,
	"type": "AGGREGATED_TYPE",
	"id": 1947,
	"rootId": "A3N5cwAHmw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1948,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"testId": {
			"id": 1949,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"variant": {
			"id": 1950,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "72"
}

export function createUsageTestAssignment(values?: Partial<UsageTestAssignment>): UsageTestAssignment {
	return Object.assign(create(_TypeModel, UsageTestAssignmentTypeRef), downcast<UsageTestAssignment>(values))
}

export type UsageTestAssignment = {
	_type: TypeRef<UsageTestAssignment>;

	_id: Id;
	testId: Id;
	variant: null | NumberString;
}