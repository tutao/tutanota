import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestMetricConfig} from "./UsageTestMetricConfig.js"

export const UsageTestStageTypeRef: TypeRef<UsageTestStage> = new TypeRef("sys", "UsageTestStage")
export const _TypeModel: TypeModel = {
	"name": "UsageTestStage",
	"since": 73,
	"type": "AGGREGATED_TYPE",
	"id": 1939,
	"rootId": "A3N5cwAHkw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1940,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 1941,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"metrics": {
			"id": 1942,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestMetricConfig",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUsageTestStage(values?: Partial<UsageTestStage>): UsageTestStage {
	return Object.assign(create(_TypeModel, UsageTestStageTypeRef), downcast<UsageTestStage>(values))
}

export type UsageTestStage = {
	_type: TypeRef<UsageTestStage>;

	_id: Id;
	name: string;

	metrics: UsageTestMetricConfig[];
}