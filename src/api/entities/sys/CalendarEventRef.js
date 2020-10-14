// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CalendarEventRefTypeRef: TypeRef<CalendarEventRef> = new TypeRef("sys", "CalendarEventRef")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventRef",
	"since": 48,
	"type": "AGGREGATED_TYPE",
	"id": 1532,
	"rootId": "A3N5cwAF_A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1533,
			"since": 48,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"elementId": {
			"name": "elementId",
			"id": 1534,
			"since": 48,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"listId": {
			"name": "listId",
			"id": 1535,
			"since": 48,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createCalendarEventRef(values?: $Shape<$Exact<CalendarEventRef>>): CalendarEventRef {
	return Object.assign(create(_TypeModel, CalendarEventRefTypeRef), values)
}

export type CalendarEventRef = {
	_type: TypeRef<CalendarEventRef>;

	_id: Id;
	elementId: Id;
	listId: Id;
}