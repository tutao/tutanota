// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const VariableExternalAuthInfoTypeRef: TypeRef<VariableExternalAuthInfo> = new TypeRef("sys", "VariableExternalAuthInfo")
export const _TypeModel: TypeModel = {
	"name": "VariableExternalAuthInfo",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 66,
	"rootId": "A3N5cwBC",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 70,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 68,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 995,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 69,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"authUpdateCounter": {
			"id": 76,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"lastSentTimestamp": {
			"id": 75,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"loggedInIpAddressHash": {
			"id": 73,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"loggedInTimestamp": {
			"id": 72,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"loggedInVerifier": {
			"id": 71,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"sentCount": {
			"id": 74,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createVariableExternalAuthInfo(values?: $Shape<$Exact<VariableExternalAuthInfo>>): VariableExternalAuthInfo {
	return Object.assign(create(_TypeModel, VariableExternalAuthInfoTypeRef), values)
}

export type VariableExternalAuthInfo = {
	_type: TypeRef<VariableExternalAuthInfo>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	authUpdateCounter: NumberString;
	lastSentTimestamp: Date;
	loggedInIpAddressHash: ?Uint8Array;
	loggedInTimestamp: ?Date;
	loggedInVerifier: ?Uint8Array;
	sentCount: NumberString;
}