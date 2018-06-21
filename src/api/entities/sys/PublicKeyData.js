// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const PublicKeyDataTypeRef: TypeRef<PublicKeyData> = new TypeRef("sys", "PublicKeyData")
export const _TypeModel: TypeModel = {
	"name": "PublicKeyData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 409,
	"rootId": "A3N5cwABmQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 410,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 411,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createPublicKeyData(): PublicKeyData {
	return create(_TypeModel)
}
