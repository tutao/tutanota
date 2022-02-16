import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestAssignmentTypeRef: TypeRef<UsageTestAssignment> = new TypeRef("sys", "UsageTestAssignment")
export const _TypeModel: TypeModel = {
	"name": "UsageTestAssignment",
	"since": 72,
	"type": "AGGREGATED_TYPE",
	"id": 1949,
	"rootId": "A3N5cwAHnQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1950,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 1952,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"numberOfStages": {
			"id": 1954,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testId": {
			"id": 1951,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"variant": {
			"id": 1953,
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
	name: string;
	numberOfStages: NumberString;
	testId: Id;
	variant: null | NumberString;
}