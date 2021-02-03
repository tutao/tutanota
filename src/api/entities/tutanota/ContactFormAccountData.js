// @flow

import {create} from "../../common/utils/EntityUtils"

import type {ContactFormStatisticField} from "./ContactFormStatisticField"
import type {ContactFormStatisticEntry} from "./ContactFormStatisticEntry"
import type {ContactFormUserData} from "./ContactFormUserData"
import type {InternalGroupData} from "./InternalGroupData"
import {TypeRef} from "../../common/utils/TypeRef";

export const ContactFormAccountDataTypeRef: TypeRef<ContactFormAccountData> = new TypeRef("tutanota", "ContactFormAccountData")
export const _TypeModel: TypeModel = {
	"name": "ContactFormAccountData",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 791,
	"rootId": "CHR1dGFub3RhAAMX",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 792,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"statisticFields": {
			"id": 795,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactFormStatisticField"
		},
		"statistics": {
			"id": 831,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "ContactFormStatisticEntry"
		},
		"userData": {
			"id": 793,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "ContactFormUserData"
		},
		"userGroupData": {
			"id": 794,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "InternalGroupData"
		},
		"contactForm": {
			"id": 796,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "ContactForm"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createContactFormAccountData(values?: $Shape<$Exact<ContactFormAccountData>>): ContactFormAccountData {
	return Object.assign(create(_TypeModel, ContactFormAccountDataTypeRef), values)
}

export type ContactFormAccountData = {
	_type: TypeRef<ContactFormAccountData>;

	_format: NumberString;

	statisticFields: ContactFormStatisticField[];
	statistics: ?ContactFormStatisticEntry;
	userData: ContactFormUserData;
	userGroupData: InternalGroupData;
	contactForm: IdTuple;
}