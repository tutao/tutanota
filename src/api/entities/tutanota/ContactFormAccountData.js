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
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactFormStatisticField",
			"final": false
		},
		"statistics": {
			"name": "statistics",
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "ContactFormStatisticEntry",
			"final": true
		},
		"userData": {
			"name": "userData",
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "ContactFormUserData",
			"final": false
		},
		"userGroupData": {
			"name": "userGroupData",
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "InternalGroupData",
			"final": false
		},
		"contactForm": {
			"name": "contactForm",
			"since": 19,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "ContactForm",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "23"
}

export function createContactFormAccountData(): ContactFormAccountData {
	return create(_TypeModel)
}
