// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const RecoverLoginGetDataTypeRef: TypeRef<RecoverLoginGetData> = new TypeRef("sys", "RecoverLoginGetData")
export const _TypeModel: TypeModel = {
	"name": "RecoverLoginGetData",
	"since": 36,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1417,
	"rootId": "A3N5cwAFiQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 1418, "since": 36, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"recoverCodeVerifier": {
			"name": "recoverCodeVerifier",
			"id": 1419,
			"since": 36,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userEmailAddress": {"name": "userEmailAddress", "id": 1420, "since": 36, "type": "String", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "sys",
	"version": "36"
}

export function createRecoverLoginGetData(): RecoverLoginGetData {
	return create(_TypeModel)
}
