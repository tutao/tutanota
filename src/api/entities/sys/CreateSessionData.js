// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1212,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accessKey": {
			"id": 1216,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"authToken": {
			"id": 1217,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"authVerifier": {
			"id": 1214,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"clientIdentifier": {
			"id": 1215,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"id": 1213,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"recoverCodeVerifier": {
			"id": 1417,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"id": 1218,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "69"
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