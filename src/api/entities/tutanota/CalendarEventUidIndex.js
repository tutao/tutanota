// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventUidIndexTypeRef: TypeRef<CalendarEventUidIndex> = new TypeRef("tutanota", "CalendarEventUidIndex")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventUidIndex",
	"since": 37,
	"type": "LIST_ELEMENT_TYPE",
	"id": 998,
	"rootId": "CHR1dGFub3RhAAPm",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1002,
			"since": 37,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 1000, "since": 37, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1003,
			"since": 37,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1001,
			"since": 37,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"calendarEvent": {
			"name": "calendarEvent",
			"id": 1004,
			"since": 37,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEvent",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "37"
}

export function createCalendarEventUidIndex(values?: $Shape<$Exact<CalendarEventUidIndex>>): CalendarEventUidIndex {
	return Object.assign(create(_TypeModel, CalendarEventUidIndexTypeRef), values)
}
