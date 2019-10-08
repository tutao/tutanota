// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", "CalendarEvent")
export const _TypeModel: TypeModel = {
	"name": "CalendarEvent",
	"since": 33,
	"type": "LIST_ELEMENT_TYPE",
	"id": 933,
	"rootId": "CHR1dGFub3RhAAOl",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 937, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 935, "since": 33, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 939,
			"since": 33,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 938,
			"since": 33,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 936,
			"since": 33,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"description": {
			"name": "description",
			"id": 941,
			"since": 33,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"endTime": {"name": "endTime", "id": 943, "since": 33, "type": "Date", "cardinality": "One", "final": false, "encrypted": true},
		"location": {"name": "location", "id": 944, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"startTime": {"name": "startTime", "id": 942, "since": 33, "type": "Date", "cardinality": "One", "final": false, "encrypted": true},
		"summary": {"name": "summary", "id": 940, "since": 33, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"uid": {"name": "uid", "id": 988, "since": 35, "type": "String", "cardinality": "ZeroOrOne", "final": false, "encrypted": true}
	},
	"associations": {
		"repeatRule": {
			"name": "repeatRule",
			"id": 945,
			"since": 33,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "CalendarRepeatRule",
			"final": false
		},
		"alarmInfos": {
			"name": "alarmInfos",
			"id": 946,
			"since": 33,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "UserAlarmInfo",
			"final": false,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createCalendarEvent(values?: $Shape<$Exact<CalendarEvent>>): CalendarEvent {
	return Object.assign(create(_TypeModel, CalendarEventTypeRef), values)
}
