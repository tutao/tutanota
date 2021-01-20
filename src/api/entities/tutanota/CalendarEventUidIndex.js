// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CalendarEventUidIndexTypeRef: TypeRef<CalendarEventUidIndex> = new TypeRef("tutanota", "CalendarEventUidIndex")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventUidIndex",
	"since": 42,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1093,
	"rootId": "CHR1dGFub3RhAARF",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1097,
			"since": 42,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1095,
			"since": 42,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1098,
			"since": 42,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1096,
			"since": 42,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"calendarEvent": {
			"name": "calendarEvent",
			"id": 1099,
			"since": 42,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEvent",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarEventUidIndex(values?: $Shape<$Exact<CalendarEventUidIndex>>): CalendarEventUidIndex {
	return Object.assign(create(_TypeModel, CalendarEventUidIndexTypeRef), values)
}

export type CalendarEventUidIndex = {
	_type: TypeRef<CalendarEventUidIndex>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;

	calendarEvent: IdTuple;
}