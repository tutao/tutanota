import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {ContactFormEncryptedStatisticsField} from "./ContactFormEncryptedStatisticsField.js"

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
			"refType": "ContactFormEncryptedStatisticsField",
			"dependency": null
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
	"version": "49"
}

export function createStatisticLogEntry(values?: Partial<StatisticLogEntry>): StatisticLogEntry {
	return Object.assign(create(_TypeModel, StatisticLogEntryTypeRef), downcast<StatisticLogEntry>(values))
}

export type StatisticLogEntry = {
	_type: TypeRef<StatisticLogEntry>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	date: Date;

	values: ContactFormEncryptedStatisticsField[];
	contactForm: IdTuple;
}