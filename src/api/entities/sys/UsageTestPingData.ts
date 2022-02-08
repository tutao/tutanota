import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestPingDataTypeRef: TypeRef<UsageTestPingData> = new TypeRef("sys", "UsageTestPingData")
export const _TypeModel: TypeModel = {
	"name": "UsageTestPingData",
	"since": 72,
	"type": "AGGREGATED_TYPE",
	"id": 1915,
	"rootId": "A3N5cwAHew",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1916,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 1917,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"id": 1918,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "72"
}

export function createUsageTestPingData(values?: Partial<UsageTestPingData>): UsageTestPingData {
	return Object.assign(create(_TypeModel, UsageTestPingDataTypeRef), downcast<UsageTestPingData>(values))
}

export type UsageTestPingData = {
	_type: TypeRef<UsageTestPingData>;

	_id: Id;
	type: string;
	value: string;
}