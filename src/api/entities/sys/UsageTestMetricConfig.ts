import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestMetricConfigTypeRef: TypeRef<UsageTestMetricConfig> = new TypeRef("sys", "UsageTestMetricConfig")
export const _TypeModel: TypeModel = {
	"name": "UsageTestMetricConfig",
	"since": 73,
	"type": "AGGREGATED_TYPE",
	"id": 1917,
	"rootId": "A3N5cwAHfQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1918,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 1919,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 1920,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createUsageTestMetricConfig(values?: Partial<UsageTestMetricConfig>): UsageTestMetricConfig {
	return Object.assign(create(_TypeModel, UsageTestMetricConfigTypeRef), downcast<UsageTestMetricConfig>(values))
}

export type UsageTestMetricConfig = {
	_type: TypeRef<UsageTestMetricConfig>;

	_id: Id;
	name: string;
	type: NumberString;
}