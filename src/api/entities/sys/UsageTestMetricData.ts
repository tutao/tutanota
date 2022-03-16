import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestMetricDataTypeRef: TypeRef<UsageTestMetricData> = new TypeRef("sys", "UsageTestMetricData")
export const _TypeModel: TypeModel = {
	"name": "UsageTestMetricData",
	"since": 73,
	"type": "AGGREGATED_TYPE",
	"id": 1921,
	"rootId": "A3N5cwAHgQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1922,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 1923,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"id": 1924,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createUsageTestMetricData(values?: Partial<UsageTestMetricData>): UsageTestMetricData {
	return Object.assign(create(_TypeModel, UsageTestMetricDataTypeRef), downcast<UsageTestMetricData>(values))
}

export type UsageTestMetricData = {
	_type: TypeRef<UsageTestMetricData>;

	_id: Id;
	name: string;
	value: string;
}