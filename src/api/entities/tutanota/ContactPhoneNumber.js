// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactPhoneNumberTypeRef: TypeRef<ContactPhoneNumber> = new TypeRef("tutanota", "ContactPhoneNumber")
export const _TypeModel: TypeModel = {
	"name": "ContactPhoneNumber",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 50,
	"rootId": "CHR1dGFub3RhADI",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 51, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"customTypeName": {"name": "customTypeName", "id": 54, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"number": {"name": "number", "id": 53, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"type": {"name": "type", "id": 52, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createContactPhoneNumber(): ContactPhoneNumber {
	return create(_TypeModel, ContactPhoneNumberTypeRef)
}
