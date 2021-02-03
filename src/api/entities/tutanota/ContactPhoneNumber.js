// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
		"_id": {
			"id": 50,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customTypeName": {
			"id": 53,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"number": {
			"id": 52,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"type": {
			"id": 51,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createContactPhoneNumber(values?: $Shape<$Exact<ContactPhoneNumber>>): ContactPhoneNumber {
	return Object.assign(create(_TypeModel, ContactPhoneNumberTypeRef), values)
}

export type ContactPhoneNumber = {
	_type: TypeRef<ContactPhoneNumber>;

	_id: Id;
	customTypeName: string;
	number: string;
	type: NumberString;
}