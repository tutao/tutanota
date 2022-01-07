import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {ContactFormStatisticField} from "./ContactFormStatisticField"
import type {ContactFormStatisticEntry} from "./ContactFormStatisticEntry"
import type {ContactFormUserData} from "./ContactFormUserData"
import type {InternalGroupData} from "./InternalGroupData"

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
			"refType": "ContactFormStatisticField",
			"dependency": null
		},
		"statistics": {
			"id": 831,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "ContactFormStatisticEntry",
			"dependency": null
		},
		"userData": {
			"id": 793,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "ContactFormUserData",
			"dependency": null
		},
		"userGroupData": {
			"id": 794,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "InternalGroupData",
			"dependency": null
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
	"version": "49"
}

export function createContactFormAccountData(values?: Partial<ContactFormAccountData>): ContactFormAccountData {
	return Object.assign(create(_TypeModel, ContactFormAccountDataTypeRef), downcast<ContactFormAccountData>(values))
}

export type ContactFormAccountData = {
	_type: TypeRef<ContactFormAccountData>;

	_format: NumberString;

	statisticFields: ContactFormStatisticField[];
	statistics:  null | ContactFormStatisticEntry;
	userData: ContactFormUserData;
	userGroupData: InternalGroupData;
	contactForm: IdTuple;
}