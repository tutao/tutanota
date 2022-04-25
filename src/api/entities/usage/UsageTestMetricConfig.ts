import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestMetricConfigValue} from "./UsageTestMetricConfigValue.js"

export const UsageTestMetricConfigTypeRef: TypeRef<UsageTestMetricConfig> = new TypeRef("usage", "UsageTestMetricConfig")
export const _TypeModel: TypeModel = {
	"name": "UsageTestMetricConfig",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 12,
	"rootId": "BXVzYWdlAAw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 13,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 14,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 15,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"configValues": {
			"id": 16,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UsageTestMetricConfigValue",
			"dependency": null
		}
	},
	"app": "usage",
	"version": "1"
}

export function createUsageTestMetricConfig(values?: Partial<UsageTestMetricConfig>): UsageTestMetricConfig {
	return Object.assign(create(_TypeModel, UsageTestMetricConfigTypeRef), downcast<UsageTestMetricConfig>(values))
}

export type UsageTestMetricConfig = {
	_type: TypeRef<UsageTestMetricConfig>;

	_id: Id;
	name: string;
	type: NumberString;

	configValues: UsageTestMetricConfigValue[];
}