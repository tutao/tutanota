// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 777,
			"since": 19,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 775, "since": 19, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 779,
			"since": 19,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 778,
			"since": 19,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 776,
			"since": 19,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"date": {"name": "date", "id": 780, "since": 19, "type": "Date", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {
		"values": {
			"name": "values",
			"id": 781,
			"since": 19,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "ContactFormEncryptedStatisticsField",
			"final": true
		},
		"contactForm": {
			"name": "contactForm",
			"id": 782,
			"since": 19,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "ContactForm",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createStatisticLogEntry(values?: $Shape<$Exact<StatisticLogEntry>>): StatisticLogEntry {
	return Object.assign(create(_TypeModel, StatisticLogEntryTypeRef), values)
}
