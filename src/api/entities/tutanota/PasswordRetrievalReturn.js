// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PasswordRetrievalReturnTypeRef: TypeRef<PasswordRetrievalReturn> = new TypeRef("tutanota", "PasswordRetrievalReturn")
export const _TypeModel: TypeModel = {
	"name": "PasswordRetrievalReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 323,
	"rootId": "CHR1dGFub3RhAAFD",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 324,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"transmissionKeyEncryptedPassword": {
			"name": "transmissionKeyEncryptedPassword",
			"id": 325,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createPasswordRetrievalReturn(values?: $Shape<$Exact<PasswordRetrievalReturn>>): PasswordRetrievalReturn {
	return Object.assign(create(_TypeModel, PasswordRetrievalReturnTypeRef), values)
}
