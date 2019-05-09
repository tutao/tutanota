// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ContactFormStatisticEntryTypeRef: TypeRef<ContactFormStatisticEntry> = new TypeRef("tutanota", "ContactFormStatisticEntry")
export const _TypeModel: TypeModel = {
	"name": "ContactFormStatisticEntry",
	"since": 22,
	"type": "AGGREGATED_TYPE",
	"id": 826,
	"rootId": "CHR1dGFub3RhAAM6",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 827, "since": 22, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"bucketEncSessionKey": {
			"name": "bucketEncSessionKey",
			"id": 828,
			"since": 22,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customerPubEncBucketKey": {
			"name": "customerPubEncBucketKey",
			"id": 829,
			"since": 22,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"customerPubKeyVersion": {
			"name": "customerPubKeyVersion",
			"id": 830,
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
			"id": 831,
			"since": 22,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactFormStatisticField",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createContactFormStatisticEntry(): ContactFormStatisticEntry {
	return create(_TypeModel, ContactFormStatisticEntryTypeRef)
}
