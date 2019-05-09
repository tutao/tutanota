// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactAddressTypeRef: TypeRef<ContactAddress> = new TypeRef("tutanota", "ContactAddress")
export const _TypeModel: TypeModel = {
	"name": "ContactAddress",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 55,
	"rootId": "CHR1dGFub3RhADc",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 56, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"address": {"name": "address", "id": 58, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"customTypeName": {"name": "customTypeName", "id": 59, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"type": {"name": "type", "id": 57, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createContactAddress(): ContactAddress {
	return create(_TypeModel, ContactAddressTypeRef)
}
