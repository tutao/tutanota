// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const SaltDataTypeRef: TypeRef<SaltData> = new TypeRef("sys", "SaltData")
export const _TypeModel: TypeModel = {
	"name": "SaltData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 417,
	"rootId": "A3N5cwABoQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 418,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"name": "mailAddress",
			"id": 419,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "24"
}

export function createSaltData(): SaltData {
	return create(_TypeModel)
}
