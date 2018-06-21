// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const PublicKeyReturnTypeRef: TypeRef<PublicKeyReturn> = new TypeRef("sys", "PublicKeyReturn")
export const _TypeModel: TypeModel = {
	"name": "PublicKeyReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 412,
	"rootId": "A3N5cwABnA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 413,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pubKey": {
			"name": "pubKey",
			"id": 414,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"pubKeyVersion": {
			"name": "pubKeyVersion",
			"id": 415,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createPublicKeyReturn(): PublicKeyReturn {
	return create(_TypeModel)
}
