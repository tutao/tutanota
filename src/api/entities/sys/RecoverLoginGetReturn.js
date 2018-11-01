// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const RecoverLoginGetReturnTypeRef: TypeRef<RecoverLoginGetReturn> = new TypeRef("sys", "RecoverLoginGetReturn")
export const _TypeModel: TypeModel = {
	"name": "RecoverLoginGetReturn",
	"since": 36,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1421,
	"rootId": "A3N5cwAFjQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 1422, "since": 36, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"recoverCodeEncUserGroupKey": {
			"name": "recoverCodeEncUserGroupKey",
			"id": 1423,
			"since": 36,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "36"
}

export function createRecoverLoginGetReturn(): RecoverLoginGetReturn {
	return create(_TypeModel)
}
