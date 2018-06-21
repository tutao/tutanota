// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const U2fRegisteredDeviceTypeRef: TypeRef<U2fRegisteredDevice> = new TypeRef("sys", "U2fRegisteredDevice")
export const _TypeModel: TypeModel = {
	"name": "U2fRegisteredDevice",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 1162,
	"rootId": "A3N5cwAEig",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1163,
			"since": 23,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"appId": {
			"name": "appId",
			"id": 1165,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"compromised": {
			"name": "compromised",
			"id": 1168,
			"since": 23,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"counter": {
			"name": "counter",
			"id": 1167,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"keyHandle": {
			"name": "keyHandle",
			"id": 1164,
			"since": 23,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"publicKey": {
			"name": "publicKey",
			"id": 1166,
			"since": 23,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createU2fRegisteredDevice(): U2fRegisteredDevice {
	return create(_TypeModel)
}
