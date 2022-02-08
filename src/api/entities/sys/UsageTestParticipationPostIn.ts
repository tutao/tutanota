import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestPingData} from "./UsageTestPingData.js"

export const UsageTestParticipationPostInTypeRef: TypeRef<UsageTestParticipationPostIn> = new TypeRef("sys", "UsageTestParticipationPostIn")
export const _TypeModel: TypeModel = {
	"name": "UsageTestParticipationPostIn",
	"since": 72,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1954,
	"rootId": "A3N5cwAHog",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1955,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testId": {
			"id": 1956,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"pingData": {
			"id": 1957,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestPingData",
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

	pingData: UsageTestPingData[];
}