import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UsageTestMetricConfigValue} from "./UsageTestMetricConfigValue.js"

export const UsageTestMetricConfigTypeRef: TypeRef<UsageTestMetricConfig> = new TypeRef("usage", "UsageTestMetricConfig")
export const _TypeModel: TypeModel = {
	"name": "UsageTestMetricConfig",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 15,
	"rootId": "BXVzYWdlAA8",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 16,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"id": 17,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 18,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"configValues": {
			"id": 19,
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