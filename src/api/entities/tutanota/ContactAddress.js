// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactAddressTypeRef: TypeRef<ContactAddress> = new TypeRef("tutanota", "ContactAddress")
export const _TypeModel: TypeModel = {
	"name": "ContactAddress",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 54,
	"rootId": "CHR1dGFub3RhADY",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 55, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"address": {"name": "address", "id": 57, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"customTypeName": {
			"name": "customTypeName",
			"id": 58,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"type": {"name": "type", "id": 56, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createContactAddress(values?: $Shape<$Exact<ContactAddress>>): ContactAddress {
	return Object.assign(create(_TypeModel, ContactAddressTypeRef), values)
}
