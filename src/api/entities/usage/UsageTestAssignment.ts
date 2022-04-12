import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestStage} from "./UsageTestStage.js"

export const UsageTestAssignmentTypeRef: TypeRef<UsageTestAssignment> = new TypeRef("usage", "UsageTestAssignment")
export const _TypeModel: TypeModel = {
	"name": "UsageTestAssignment",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 59,
	"rootId": "BXVzYWdlADs",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 60,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 62,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sendPings": {
			"id": 64,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testId": {
			"id": 61,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"variant": {
			"id": 63,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"stages": {
			"id": 65,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestStage",
			"dependency": null
		}
	},
	"app": "usage",
	"version": "1"
}

export function createUsageTestAssignment(values?: Partial<UsageTestAssignment>): UsageTestAssignment {
	return Object.assign(create(_TypeModel, UsageTestAssignmentTypeRef), downcast<UsageTestAssignment>(values))
}

export type UsageTestAssignment = {
	_type: TypeRef<UsageTestAssignment>;

	_id: Id;
	name: string;
	sendPings: boolean;
	testId: Id;
	variant: null | NumberString;

	stages: UsageTestStage[];
}