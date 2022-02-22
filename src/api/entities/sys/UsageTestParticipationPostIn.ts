import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestMetricData} from "./UsageTestMetricData.js"

export const UsageTestParticipationPostInTypeRef: TypeRef<UsageTestParticipationPostIn> = new TypeRef("sys", "UsageTestParticipationPostIn")
export const _TypeModel: TypeModel = {
	"name": "UsageTestParticipationPostIn",
	"since": 73,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1970,
	"rootId": "A3N5cwAHsg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1971,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testId": {
			"id": 1972,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"metrics": {
			"id": 1973,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestMetricData",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "73"
}

export function createUsageTestParticipationPostIn(values?: Partial<UsageTestParticipationPostIn>): UsageTestParticipationPostIn {
	return Object.assign(create(_TypeModel, UsageTestParticipationPostInTypeRef), downcast<UsageTestParticipationPostIn>(values))
}

export type UsageTestParticipationPostIn = {
	_type: TypeRef<UsageTestParticipationPostIn>;

	_format: NumberString;
	testId: Id;

	metrics: UsageTestMetricData[];
}