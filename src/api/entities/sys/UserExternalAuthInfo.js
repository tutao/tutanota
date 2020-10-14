// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const UserExternalAuthInfoTypeRef: TypeRef<UserExternalAuthInfo> = new TypeRef("sys", "UserExternalAuthInfo")
export const _TypeModel: TypeModel = {
	"name": "UserExternalAuthInfo",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 77,
	"rootId": "A3N5cwBN",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 78,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"authUpdateCounter": {
			"name": "authUpdateCounter",
			"id": 82,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"autoAuthenticationId": {
			"name": "autoAuthenticationId",
			"id": 79,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"autoTransmitPassword": {
			"name": "autoTransmitPassword",
			"id": 81,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"latestSaltHash": {
			"name": "latestSaltHash",
			"id": 80,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"variableAuthInfo": {
			"name": "variableAuthInfo",
			"id": 83,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "VariableExternalAuthInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createUserExternalAuthInfo(values?: $Shape<$Exact<UserExternalAuthInfo>>): UserExternalAuthInfo {
	return Object.assign(create(_TypeModel, UserExternalAuthInfoTypeRef), values)
}

export type UserExternalAuthInfo = {
	_type: TypeRef<UserExternalAuthInfo>;

	_id: Id;
	authUpdateCounter: NumberString;
	autoAuthenticationId: Id;
	autoTransmitPassword: ?string;
	latestSaltHash: ?Uint8Array;

	variableAuthInfo: Id;
}