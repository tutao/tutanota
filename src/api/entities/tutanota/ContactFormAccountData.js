// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 792,
			"since": 19,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"statisticFields": {
			"name": "statisticFields",
			"id": 795,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactFormStatisticField",
			"final": false
		},
		"statistics": {
			"name": "statistics",
			"id": 831,
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "ContactFormStatisticEntry",
			"final": true
		},
		"userData": {
			"name": "userData",
			"id": 793,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "ContactFormUserData",
			"final": false
		},
		"userGroupData": {
			"name": "userGroupData",
			"id": 794,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "InternalGroupData",
			"final": false
		},
		"contactForm": {
			"name": "contactForm",
			"id": 796,
			"since": 19,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "ContactForm",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createContactFormAccountData(values?: $Shape<$Exact<ContactFormAccountData>>): ContactFormAccountData {
	return Object.assign(create(_TypeModel, ContactFormAccountDataTypeRef), values)
}
