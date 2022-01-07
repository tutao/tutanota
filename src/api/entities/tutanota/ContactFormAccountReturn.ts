import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
	"version": "49"
}

export function createContactFormAccountReturn(values?: Partial<ContactFormAccountReturn>): ContactFormAccountReturn {
	return Object.assign(create(_TypeModel, ContactFormAccountReturnTypeRef), downcast<ContactFormAccountReturn>(values))
}

export type ContactFormAccountReturn = {
	_type: TypeRef<ContactFormAccountReturn>;

	_format: NumberString;
	requestMailAddress: string;
	responseMailAddress: string;
}