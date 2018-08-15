// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const RollupTypeRef: TypeRef<Rollup> = new TypeRef("monitor", "Rollup")
export const _TypeModel: TypeModel = {
	"name": "Rollup",
	"since": 6,
	"type": "LIST_ELEMENT_TYPE",
	"id": 60,
	"rootId": "B21vbml0b3IAPA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 64,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 62,
			"since": 6,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 65,
			"since": 6,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 63,
			"since": 6,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"values": {
			"name": "values",
			"id": 66,
			"since": 6,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "MonitorValue",
			"final": false
		}
	},
	"app": "monitor",
	"version": "6"
}

export function createRollup(): Rollup {
	return create(_TypeModel)
}
