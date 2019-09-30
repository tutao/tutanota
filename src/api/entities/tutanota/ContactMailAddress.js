// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactMailAddressTypeRef: TypeRef<ContactMailAddress> = new TypeRef("tutanota", "ContactMailAddress")
export const _TypeModel: TypeModel = {
	"name": "ContactMailAddress",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 44,
	"rootId": "CHR1dGFub3RhACw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 45, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"address": {"name": "address", "id": 47, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"customTypeName": {
			"name": "customTypeName",
			"id": 48,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"type": {"name": "type", "id": 46, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createContactMailAddress(values?: $Shape<$Exact<ContactMailAddress>>): ContactMailAddress {
	return Object.assign(create(_TypeModel, ContactMailAddressTypeRef), values)
}
