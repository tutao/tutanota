// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_id",
			"id": 826,
			"since": 22,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bucketEncSessionKey": {
			"name": "bucketEncSessionKey",
			"id": 827,
			"since": 22,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customerPubEncBucketKey": {
			"name": "customerPubEncBucketKey",
			"id": 828,
			"since": 22,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customerPubKeyVersion": {
			"name": "customerPubKeyVersion",
			"id": 829,
			"since": 22,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"statisticFields": {
			"name": "statisticFields",
			"id": 830,
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactFormStatisticField",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "40"
}

export function createContactFormStatisticEntry(values?: $Shape<$Exact<ContactFormStatisticEntry>>): ContactFormStatisticEntry {
	return Object.assign(create(_TypeModel, ContactFormStatisticEntryTypeRef), values)
}
