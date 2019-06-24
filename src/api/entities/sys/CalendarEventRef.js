// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventRefTypeRef: TypeRef<CalendarEventRef> = new TypeRef("sys", "CalendarEventRef")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventRef",
	"since": 47,
	"type": "AGGREGATED_TYPE",
	"id": 1525,
	"rootId": "A3N5cwAF9Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1526, "since": 47, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"elementId": {"name": "elementId", "id": 1527, "since": 47, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"listId": {"name": "listId", "id": 1528, "since": 47, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {},
	"app": "sys",
	"version": "47"
}

export function createCalendarEventRef(): CalendarEventRef {
	return create(_TypeModel, CalendarEventRefTypeRef)
}
