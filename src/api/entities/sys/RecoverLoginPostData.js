// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const RecoverLoginPostDataTypeRef: TypeRef<RecoverLoginPostData> = new TypeRef("sys", "RecoverLoginPostData")
export const _TypeModel: TypeModel = {
	"name": "RecoverLoginPostData",
	"since": 36,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1424,
	"rootId": "A3N5cwAFkA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 1425, "since": 36, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"newPasswordVerifier": {
			"name": "newPasswordVerifier",
			"id": 1428,
			"since": 36,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pwEncUserGroupKey": {"name": "pwEncUserGroupKey", "id": 1430, "since": 36, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"recoverCodeVerifier": {
			"name": "recoverCodeVerifier",
			"id": 1426,
			"since": 36,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"salt": {"name": "salt", "id": 1429, "since": 36, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"userEmailAddress": {"name": "userEmailAddress", "id": 1427, "since": 36, "type": "String", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "sys",
	"version": "36"
}

export function createRecoverLoginPostData(): RecoverLoginPostData {
	return create(_TypeModel)
}
