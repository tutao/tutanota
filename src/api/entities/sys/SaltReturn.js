// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SaltReturnTypeRef: TypeRef<SaltReturn> = new TypeRef("sys", "SaltReturn")
export const _TypeModel: TypeModel = {
	"name": "SaltReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 420,
	"rootId": "A3N5cwABpA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 421, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"salt": {"name": "salt", "id": 422, "since": 1, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "sys",
	"version": "43"
}

export function createSaltReturn(): SaltReturn {
	return create(_TypeModel)
}
