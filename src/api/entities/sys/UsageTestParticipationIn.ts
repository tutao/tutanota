import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestMetricData} from "./UsageTestMetricData.js"

export const UsageTestParticipationInTypeRef: TypeRef<UsageTestParticipationIn> = new TypeRef("sys", "UsageTestParticipationIn")
export const _TypeModel: TypeModel = {
	"name": "UsageTestParticipationIn",
	"since": 73,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1983,
	"rootId": "A3N5cwAHvw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1984,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"stage": {
			"id": 1986,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testDeviceId": {
			"id": 1987,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testId": {
			"id": 1985,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"metrics": {
			"id": 1988,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestMetricData",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUsageTestParticipationIn(values?: Partial<UsageTestParticipationIn>): UsageTestParticipationIn {
	return Object.assign(create(_TypeModel, UsageTestParticipationInTypeRef), downcast<UsageTestParticipationIn>(values))
}

export type UsageTestParticipationIn = {
	_type: TypeRef<UsageTestParticipationIn>;

	_format: NumberString;
	stage: NumberString;
	testDeviceId: Id;
	testId: Id;

	metrics: UsageTestMetricData[];
}