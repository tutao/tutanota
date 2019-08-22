// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateSessionReturnTypeRef: TypeRef<CreateSessionReturn> = new TypeRef("sys", "CreateSessionReturn")
export const _TypeModel: TypeModel = {
	"name": "CreateSessionReturn",
	"since": 23,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1219,
	"rootId": "A3N5cwAEww",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1220,
			"since": 23,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"accessToken": {
			"name": "accessToken",
			"id": 1221,
			"since": 23,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"challenges": {
			"name": "challenges",
			"id": 1222,
			"since": 23,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "Challenge",
			"final": true
		},
		"user": {
			"name": "user",
			"id": 1223,
			"since": 23,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "49"
}

export function createCreateSessionReturn(values?: $Shape<$Exact<CreateSessionReturn>>): CreateSessionReturn {
	return Object.assign(create(_TypeModel, CreateSessionReturnTypeRef), values)
}
