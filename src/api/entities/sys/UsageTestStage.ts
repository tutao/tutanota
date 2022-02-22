import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestMetricConfig} from "./UsageTestMetricConfig.js"

export const UsageTestStageTypeRef: TypeRef<UsageTestStage> = new TypeRef("sys", "UsageTestStage")
export const _TypeModel: TypeModel = {
	"name": "UsageTestStage",
	"since": 73,
	"type": "AGGREGATED_TYPE",
	"id": 1941,
	"rootId": "A3N5cwAHlQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1942,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 1943,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"metrics": {
			"id": 1944,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestMetricConfig",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "73"
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