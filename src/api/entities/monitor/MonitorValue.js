// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MonitorValueTypeRef: TypeRef<MonitorValue> = new TypeRef("monitor", "MonitorValue")
export const _TypeModel: TypeModel = {
	"name": "MonitorValue",
	"since": 6,
	"type": "AGGREGATED_TYPE",
	"id": 55,
	"rootId": "B21vbml0b3IANw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 56,
			"since": 6,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"avg": {
			"name": "avg",
			"id": 58,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"max": {
			"name": "max",
			"id": 59,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"name": {
			"name": "name",
			"id": 57,
			"since": 6,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "monitor",
	"version": "6"
}

export function createMonitorValue(): MonitorValue {
	return create(_TypeModel)
}
