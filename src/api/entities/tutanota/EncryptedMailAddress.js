// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const EncryptedMailAddressTypeRef: TypeRef<EncryptedMailAddress> = new TypeRef("tutanota", "EncryptedMailAddress")
export const _TypeModel: TypeModel = {
	"name": "EncryptedMailAddress",
	"since": 14,
	"type": "AGGREGATED_TYPE",
	"id": 612,
	"rootId": "CHR1dGFub3RhAAJk",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 613,
			"since": 14,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"address": {
			"name": "address",
			"id": 615,
			"since": 14,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"name": {
			"name": "name",
			"id": 614,
			"since": 14,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "40"
}

export function createEncryptedMailAddress(values?: $Shape<$Exact<EncryptedMailAddress>>): EncryptedMailAddress {
	return Object.assign(create(_TypeModel, EncryptedMailAddressTypeRef), values)
}
