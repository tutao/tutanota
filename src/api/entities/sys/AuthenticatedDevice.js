// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 44,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"authType": {
			"name": "authType",
			"id": 45,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deviceKey": {
			"name": "deviceKey",
			"id": 47,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"deviceToken": {
			"name": "deviceToken",
			"id": 46,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
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