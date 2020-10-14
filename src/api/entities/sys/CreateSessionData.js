// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CreateSessionDataTypeRef: TypeRef<CreateSessionData> = new TypeRef("sys", "CreateSessionData")
export const _TypeModel: TypeModel = {
	"name": "CreateSessionData",
	"since": 23,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1211,
	"rootId": "A3N5cwAEuw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1212,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accessKey": {
			"name": "accessKey",
			"id": 1216,
			"since": 23,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"authToken": {
			"name": "authToken",
			"id": 1217,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"authVerifier": {
			"name": "authVerifier",
			"id": 1214,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"clientIdentifier": {
			"name": "clientIdentifier",
			"id": 1215,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 1213,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"name": "recoverCodeVerifier",
			"id": 1417,
			"since": 36,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"name": "user",
			"id": 1218,
			"since": 23,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "User",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createCreateSessionData(values?: $Shape<$Exact<CreateSessionData>>): CreateSessionData {
	return Object.assign(create(_TypeModel, CreateSessionDataTypeRef), values)
}

export type CreateSessionData = {
	_type: TypeRef<CreateSessionData>;

	_format: NumberString;
	accessKey: ?Uint8Array;
	authToken: ?string;
	authVerifier: ?string;
	clientIdentifier: string;
	mailAddress: ?string;
	recoverCodeVerifier: ?string;

	user: ?Id;
}