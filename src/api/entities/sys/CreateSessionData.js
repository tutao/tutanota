// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateSessionDataTypeRef: TypeRef<CreateSessionData> = new TypeRef("sys", "CreateSessionData")
export const _TypeModel: TypeModel = {
	"name": "CreateSessionData",
	"since": 23,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1209,
	"rootId": "A3N5cwAEuQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1210,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accessKey": {
			"name": "accessKey",
			"id": 1214,
			"since": 23,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"authToken": {
			"name": "authToken",
			"id": 1215,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"authVerifier": {
			"name": "authVerifier",
			"id": 1212,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"clientIdentifier": {
			"name": "clientIdentifier",
			"id": 1213,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 1211,
			"since": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"name": "user",
			"since": 23,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "User",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "23"
}

export function createCreateSessionData(): CreateSessionData {
	return create(_TypeModel)
}
