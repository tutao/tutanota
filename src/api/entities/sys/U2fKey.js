// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const U2fKeyTypeRef: TypeRef<U2fKey> = new TypeRef("sys", "U2fKey")
export const _TypeModel: TypeModel = {
	"name": "U2fKey",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1178,
	"rootId": "A3N5cwAEmg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1179, "since": 23, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"appId": {"name": "appId", "id": 1181, "since": 23, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"keyHandle": {
			"name": "keyHandle",
			"id": 1180,
			"since": 23,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"secondFactor": {
			"name": "secondFactor",
			"id": 1182,
			"since": 23,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "SecondFactor",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "49"
}

export function createU2fKey(values?: $Shape<$Exact<U2fKey>>): U2fKey {
	return Object.assign(create(_TypeModel, U2fKeyTypeRef), values)
}
