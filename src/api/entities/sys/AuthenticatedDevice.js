// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const AuthenticatedDeviceTypeRef: TypeRef<AuthenticatedDevice> = new TypeRef("sys", "AuthenticatedDevice")
export const _TypeModel: TypeModel = {
	"name": "AuthenticatedDevice",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 43,
	"rootId": "A3N5cwAr",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 44,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"authType": {
			"id": 45,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deviceKey": {
			"id": 47,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deviceToken": {
			"id": 46,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "68"
}

export function createAuthenticatedDevice(values?: $Shape<$Exact<AuthenticatedDevice>>): AuthenticatedDevice {
	return Object.assign(create(_TypeModel, AuthenticatedDeviceTypeRef), values)
}

export type AuthenticatedDevice = {
	_type: TypeRef<AuthenticatedDevice>;

	_id: Id;
	authType: NumberString;
	deviceKey: Uint8Array;
	deviceToken: string;
}