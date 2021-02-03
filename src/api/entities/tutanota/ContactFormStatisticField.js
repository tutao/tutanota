// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const ContactFormStatisticFieldTypeRef: TypeRef<ContactFormStatisticField> = new TypeRef("tutanota", "ContactFormStatisticField")
export const _TypeModel: TypeModel = {
	"name": "ContactFormStatisticField",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 765,
	"rootId": "CHR1dGFub3RhAAL9",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 766,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"encryptedName": {
			"id": 823,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"encryptedValue": {
			"id": 824,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createContactFormStatisticField(values?: $Shape<$Exact<ContactFormStatisticField>>): ContactFormStatisticField {
	return Object.assign(create(_TypeModel, ContactFormStatisticFieldTypeRef), values)
}

export type ContactFormStatisticField = {
	_type: TypeRef<ContactFormStatisticField>;

	_id: Id;
	encryptedName: Uint8Array;
	encryptedValue: Uint8Array;
}