// @flow

import {create} from "../../common/utils/EntityUtils"

import type {ContactFormStatisticField} from "./ContactFormStatisticField"
import {TypeRef} from "../../common/utils/TypeRef";

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
			"refType": "ContactFormStatisticField"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createContactFormStatisticEntry(values?: $Shape<$Exact<ContactFormStatisticEntry>>): ContactFormStatisticEntry {
	return Object.assign(create(_TypeModel, ContactFormStatisticEntryTypeRef), values)
}

export type ContactFormStatisticEntry = {
	_type: TypeRef<ContactFormStatisticEntry>;

	_id: Id;
	bucketEncSessionKey: Uint8Array;
	customerPubEncBucketKey: Uint8Array;
	customerPubKeyVersion: NumberString;

	statisticFields: ContactFormStatisticField[];
}