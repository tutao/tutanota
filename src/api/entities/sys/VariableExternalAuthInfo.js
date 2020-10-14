// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 70,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 68,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 995,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 69,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"authUpdateCounter": {
			"name": "authUpdateCounter",
			"id": 76,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"lastSentTimestamp": {
			"name": "lastSentTimestamp",
			"id": 75,
			"since": 1,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"loggedInIpAddressHash": {
			"name": "loggedInIpAddressHash",
			"id": 73,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"loggedInTimestamp": {
			"name": "loggedInTimestamp",
			"id": 72,
			"since": 1,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"loggedInVerifier": {
			"name": "loggedInVerifier",
			"id": 71,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"sentCount": {
			"name": "sentCount",
			"id": 74,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
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