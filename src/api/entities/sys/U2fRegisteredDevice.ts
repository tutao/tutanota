import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1163,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"appId": {
			"id": 1165,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"compromised": {
			"id": 1168,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"counter": {
			"id": 1167,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"keyHandle": {
			"id": 1164,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"publicKey": {
			"id": 1166,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createU2fRegisteredDevice(values?: Partial<U2fRegisteredDevice>): U2fRegisteredDevice {
	return Object.assign(create(_TypeModel, U2fRegisteredDeviceTypeRef), downcast<U2fRegisteredDevice>(values))
}

export type U2fRegisteredDevice = {
	_type: TypeRef<U2fRegisteredDevice>;

	_id: Id;
	appId: string;
	compromised: boolean;
	counter: NumberString;
	keyHandle: Uint8Array;
	publicKey: Uint8Array;
}