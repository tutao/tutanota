// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactFormAccountReturnTypeRef: TypeRef<ContactFormAccountReturn> = new TypeRef("tutanota", "ContactFormAccountReturn")
export const _TypeModel: TypeModel = {
	"name": "ContactFormAccountReturn",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 750,
	"rootId": "CHR1dGFub3RhAALu",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 751,
			"since": 19,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"requestMailAddress": {
			"name": "requestMailAddress",
			"id": 752,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"responseMailAddress": {
			"name": "responseMailAddress",
			"id": 753,
			"since": 19,
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

export function createContactFormAccountReturn(values?: $Shape<$Exact<ContactFormAccountReturn>>): ContactFormAccountReturn {
	return Object.assign(create(_TypeModel, ContactFormAccountReturnTypeRef), values)
}
