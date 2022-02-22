import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestMetricDataTypeRef: TypeRef<UsageTestMetricData> = new TypeRef("sys", "UsageTestMetricData")
export const _TypeModel: TypeModel = {
	"name": "UsageTestMetricData",
	"since": 73,
	"type": "AGGREGATED_TYPE",
	"id": 1922,
	"rootId": "A3N5cwAHgg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1923,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 1924,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"id": 1925,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "73"
}

export function createUsageTestMetricData(values?: Partial<UsageTestMetricData>): UsageTestMetricData {
	return Object.assign(create(_TypeModel, UsageTestMetricDataTypeRef), downcast<UsageTestMetricData>(values))
}

export type UsageTestMetricData = {
	_type: TypeRef<UsageTestMetricData>;

	_id: Id;
	name: string;
	value: null | string;
}