import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "User",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createCreateSessionData(values?: Partial<CreateSessionData>): CreateSessionData {
	return Object.assign(create(_TypeModel, CreateSessionDataTypeRef), downcast<CreateSessionData>(values))
}

export type CreateSessionData = {
	_type: TypeRef<CreateSessionData>;

	_format: NumberString;
	accessKey: null | Uint8Array;
	authToken: null | string;
	authVerifier: null | string;
	clientIdentifier: string;
	mailAddress: null | string;
	recoverCodeVerifier: null | string;

	user:  null | Id;
}