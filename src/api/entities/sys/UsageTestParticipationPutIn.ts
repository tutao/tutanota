import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestMetricData} from "./UsageTestMetricData.js"

export const UsageTestParticipationPutInTypeRef: TypeRef<UsageTestParticipationPutIn> = new TypeRef("sys", "UsageTestParticipationPutIn")
export const _TypeModel: TypeModel = {
	"name": "UsageTestParticipationPutIn",
	"since": 73,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1974,
	"rootId": "A3N5cwAHtg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1975,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"participationId": {
			"id": 1977,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"stage": {
			"id": 1978,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testId": {
			"id": 1976,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"metrics": {
			"id": 1979,
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

export function createUsageTestParticipationPutIn(values?: Partial<UsageTestParticipationPutIn>): UsageTestParticipationPutIn {
	return Object.assign(create(_TypeModel, UsageTestParticipationPutInTypeRef), downcast<UsageTestParticipationPutIn>(values))
}

export type UsageTestParticipationPutIn = {
	_type: TypeRef<UsageTestParticipationPutIn>;

	_format: NumberString;
	participationId: Id;
	stage: NumberString;
	testId: Id;

	metrics: UsageTestMetricData[];
}