import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestMetricConfigValueTypeRef: TypeRef<UsageTestMetricConfigValue> = new TypeRef("usage", "UsageTestMetricConfigValue")
export const _TypeModel: TypeModel = {
	"name": "UsageTestMetricConfigValue",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 11,
	"rootId": "BXVzYWdlAAs",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 12,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"key": {
			"id": 13,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"id": 14,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "usage",
	"version": "1"
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