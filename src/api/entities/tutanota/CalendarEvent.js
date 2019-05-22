// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", "CalendarEvent")
export const _TypeModel: TypeModel = {
	"name": "CalendarEvent",
	"since": 33,
	"type": "LIST_ELEMENT_TYPE",
	"id": 936,
	"rootId": "CHR1dGFub3RhAAOo",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 940, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 938, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 942,
			"since": 33,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {"name": "_ownerGroup", "id": 941, "since": 33, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 939, "since": 33, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"description": {"name": "description", "id": 944, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"duration": {"name": "duration", "id": 946, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": true},
		"location": {"name": "location", "id": 947, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"startTime": {"name": "startTime", "id": 945, "since": 33, "type": "Date", "cardinality": "One", "final": false, "encrypted": true},
		"summary": {"name": "summary", "id": 943, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true}
	},
	"associations": {
		"repeatRule": {
			"name": "repeatRule",
			"id": 948,
			"since": 33,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "RepeatRule",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "33"
}

export function createCalendarEvent(): CalendarEvent {
	return create(_TypeModel, CalendarEventTypeRef)
}
