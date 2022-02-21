import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestMetric} from "./UsageTestMetric.js"

export const UsageTestParticipationPostInTypeRef: TypeRef<UsageTestParticipationPostIn> = new TypeRef("sys", "UsageTestParticipationPostIn")
export const _TypeModel: TypeModel = {
	"name": "UsageTestParticipationPostIn",
	"since": 72,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1959,
	"rootId": "A3N5cwAHpw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1960,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testId": {
			"id": 1961,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"metrics": {
			"id": 1962,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestMetric",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "72"
}

export function createUsageTestParticipationPostIn(values?: Partial<UsageTestParticipationPostIn>): UsageTestParticipationPostIn {
	return Object.assign(create(_TypeModel, UsageTestParticipationPostInTypeRef), downcast<UsageTestParticipationPostIn>(values))
}

export type UsageTestParticipationPostIn = {
	_type: TypeRef<UsageTestParticipationPostIn>;

	_format: NumberString;
	testId: Id;

	metrics: UsageTestMetric[];
}