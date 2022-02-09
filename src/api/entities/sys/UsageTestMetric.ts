import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UsageTestMetricTypeRef: TypeRef<UsageTestMetric> = new TypeRef("sys", "UsageTestMetric")
export const _TypeModel: TypeModel = {
	"name": "UsageTestMetric",
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

export function createUsageTestMetric(values?: Partial<UsageTestMetric>): UsageTestMetric {
	return Object.assign(create(_TypeModel, UsageTestMetricTypeRef), downcast<UsageTestMetric>(values))
}

export type UsageTestMetric = {
	_type: TypeRef<UsageTestMetric>;

	_id: Id;
	type: string;
	value: string;
}