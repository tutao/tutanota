// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
		"_id": {
			"id": 55,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"address": {
			"id": 57,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"customTypeName": {
			"id": 58,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"type": {
			"id": 56,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createContactAddress(values?: $Shape<$Exact<ContactAddress>>): ContactAddress {
	return Object.assign(create(_TypeModel, ContactAddressTypeRef), values)
}

export type ContactAddress = {
	_type: TypeRef<ContactAddress>;

	_id: Id;
	address: string;
	customTypeName: string;
	type: NumberString;
}