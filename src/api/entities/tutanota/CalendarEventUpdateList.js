// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", "CalendarEventUpdateList")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventUpdateList",
	"since": 42,
	"type": "AGGREGATED_TYPE",
	"id": 1113,
	"rootId": "CHR1dGFub3RhAARZ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1114,
			"since": 42,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"name": "list",
			"id": 1115,
			"since": 42,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEventUpdate",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarEventUpdateList(values?: $Shape<$Exact<CalendarEventUpdateList>>): CalendarEventUpdateList {
	return Object.assign(create(_TypeModel, CalendarEventUpdateListTypeRef), values)
}

export type CalendarEventUpdateList = {
	_type: TypeRef<CalendarEventUpdateList>;

	_id: Id;

	list: Id;
}