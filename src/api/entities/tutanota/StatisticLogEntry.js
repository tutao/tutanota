// @flow

import {create} from "../../common/utils/EntityUtils"

import type {ContactFormEncryptedStatisticsField} from "./ContactFormEncryptedStatisticsField"
import {TypeRef} from "../../common/utils/TypeRef";

export const StatisticLogEntryTypeRef: TypeRef<StatisticLogEntry> = new TypeRef("tutanota", "StatisticLogEntry")
export const _TypeModel: TypeModel = {
	"name": "StatisticLogEntry",
	"since": 19,
	"type": "LIST_ELEMENT_TYPE",
	"id": 773,
	"rootId": "CHR1dGFub3RhAAMF",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 777,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 775,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 779,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 778,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 776,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"date": {
			"id": 780,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"values": {
			"id": 781,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "ContactFormEncryptedStatisticsField"
		},
		"contactForm": {
			"id": 782,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "ContactForm"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createStatisticLogEntry(values?: $Shape<$Exact<StatisticLogEntry>>): StatisticLogEntry {
	return Object.assign(create(_TypeModel, StatisticLogEntryTypeRef), values)
}

export type StatisticLogEntry = {
	_type: TypeRef<StatisticLogEntry>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	date: Date;

	values: ContactFormEncryptedStatisticsField[];
	contactForm: IdTuple;
}