// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 751,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"requestMailAddress": {
			"id": 752,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"responseMailAddress": {
			"id": 753,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createContactFormAccountReturn(values?: $Shape<$Exact<ContactFormAccountReturn>>): ContactFormAccountReturn {
	return Object.assign(create(_TypeModel, ContactFormAccountReturnTypeRef), values)
}

export type ContactFormAccountReturn = {
	_type: TypeRef<ContactFormAccountReturn>;

	_format: NumberString;
	requestMailAddress: string;
	responseMailAddress: string;
}