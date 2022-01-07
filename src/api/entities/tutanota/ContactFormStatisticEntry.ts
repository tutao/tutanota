import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {ContactFormStatisticField} from "./ContactFormStatisticField"

export const ContactFormStatisticEntryTypeRef: TypeRef<ContactFormStatisticEntry> = new TypeRef("tutanota", "ContactFormStatisticEntry")
export const _TypeModel: TypeModel = {
	"name": "ContactFormStatisticEntry",
	"since": 22,
	"type": "AGGREGATED_TYPE",
	"id": 825,
	"rootId": "CHR1dGFub3RhAAM5",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 826,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bucketEncSessionKey": {
			"id": 827,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customerPubEncBucketKey": {
			"id": 828,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customerPubKeyVersion": {
			"id": 829,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"statisticFields": {
			"id": 830,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "ContactFormStatisticField",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createContactFormStatisticEntry(values?: Partial<ContactFormStatisticEntry>): ContactFormStatisticEntry {
	return Object.assign(create(_TypeModel, ContactFormStatisticEntryTypeRef), downcast<ContactFormStatisticEntry>(values))
}

export type ContactFormStatisticEntry = {
	_type: TypeRef<ContactFormStatisticEntry>;

	_id: Id;
	bucketEncSessionKey: Uint8Array;
	customerPubEncBucketKey: Uint8Array;
	customerPubKeyVersion: NumberString;

	statisticFields: ContactFormStatisticField[];
}