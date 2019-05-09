// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactFormAccountReturnTypeRef: TypeRef<ContactFormAccountReturn> = new TypeRef("tutanota", "ContactFormAccountReturn")
export const _TypeModel: TypeModel = {
	"name": "ContactFormAccountReturn",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 751,
	"rootId": "CHR1dGFub3RhAALv",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 752, "since": 19, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"requestMailAddress": {"name": "requestMailAddress", "id": 753, "since": 19, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"responseMailAddress": {
			"name": "responseMailAddress",
			"id": 754,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createContactFormAccountReturn(): ContactFormAccountReturn {
	return create(_TypeModel, ContactFormAccountReturnTypeRef)
}
