import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestPingData} from "./UsageTestPingData.js"

export const UsageTestParticipationPutInTypeRef: TypeRef<UsageTestParticipationPutIn> = new TypeRef("sys", "UsageTestParticipationPutIn")
export const _TypeModel: TypeModel = {
	"name": "UsageTestParticipationPutIn",
	"since": 72,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1958,
	"rootId": "A3N5cwAHpg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1959,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"participationId": {
			"id": 1961,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"stage": {
			"id": 1962,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"testId": {
			"id": 1960,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"pingData": {
			"id": 1963,
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

export function createUsageTestParticipationPutIn(values?: Partial<UsageTestParticipationPutIn>): UsageTestParticipationPutIn {
	return Object.assign(create(_TypeModel, UsageTestParticipationPutInTypeRef), downcast<UsageTestParticipationPutIn>(values))
}

export type UsageTestParticipationPutIn = {
	_type: TypeRef<UsageTestParticipationPutIn>;

	_format: NumberString;
	participationId: Id;
	stage: NumberString;
	testId: Id;

	pingData: UsageTestPingData[];
}