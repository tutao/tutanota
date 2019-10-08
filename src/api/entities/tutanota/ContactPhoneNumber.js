// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactPhoneNumberTypeRef: TypeRef<ContactPhoneNumber> = new TypeRef("tutanota", "ContactPhoneNumber")
export const _TypeModel: TypeModel = {
	"name": "ContactPhoneNumber",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 49,
	"rootId": "CHR1dGFub3RhADE",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 50, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"customTypeName": {
			"name": "customTypeName",
			"id": 53,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"number": {"name": "number", "id": 52, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"type": {"name": "type", "id": 51, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createContactPhoneNumber(values?: $Shape<$Exact<ContactPhoneNumber>>): ContactPhoneNumber {
	return Object.assign(create(_TypeModel, ContactPhoneNumberTypeRef), values)
}
