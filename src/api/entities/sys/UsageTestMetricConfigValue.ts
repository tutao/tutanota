import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestMetricConfigValueTypeRef: TypeRef<UsageTestMetricConfigValue> = new TypeRef("sys", "UsageTestMetricConfigValue")
export const _TypeModel: TypeModel = {
	"name": "UsageTestMetricConfigValue",
	"since": 74,
	"type": "AGGREGATED_TYPE",
	"id": 1992,
	"rootId": "A3N5cwAHyA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1993,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"key": {
			"id": 1994,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"id": 1995,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createUsageTestMetricConfigValue(values?: Partial<UsageTestMetricConfigValue>): UsageTestMetricConfigValue {
	return Object.assign(create(_TypeModel, UsageTestMetricConfigValueTypeRef), downcast<UsageTestMetricConfigValue>(values))
}

export type UsageTestMetricConfigValue = {
	_type: TypeRef<UsageTestMetricConfigValue>;

	_id: Id;
	key: string;
	value: string;
}