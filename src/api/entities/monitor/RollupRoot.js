// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const RollupRootTypeRef: TypeRef<RollupRoot> = new TypeRef("monitor", "RollupRoot")
export const _TypeModel: TypeModel = {
	"name": "RollupRoot",
	"since": 6,
	"type": "ELEMENT_TYPE",
	"id": 67,
	"rootId": "B21vbml0b3IAQw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 71,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 69,
			"since": 6,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 72,
			"since": 6,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 70,
			"since": 6,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"rollupDay": {
			"name": "rollupDay",
			"id": 75,
			"since": 6,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Rollup",
			"final": true,
			"external": false
		},
		"rollupHour": {
			"name": "rollupHour",
			"id": 74,
			"since": 6,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Rollup",
			"final": true,
			"external": false
		},
		"rollupMinute": {
			"name": "rollupMinute",
			"id": 73,
			"since": 6,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "Rollup",
			"final": true,
			"external": false
		}
	},
	"app": "monitor",
	"version": "6"
}

export function createRollupRoot(): RollupRoot {
	return create(_TypeModel)
}
