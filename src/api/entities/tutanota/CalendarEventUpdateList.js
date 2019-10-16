// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventUpdateListTypeRef: TypeRef<CalendarEventUpdateList> = new TypeRef("tutanota", "CalendarEventUpdateList")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventUpdateList",
	"since": 37,
	"type": "AGGREGATED_TYPE",
	"id": 1021,
	"rootId": "CHR1dGFub3RhAAP9",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1022,
			"since": 37,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"name": "list",
			"id": 1023,
			"since": 37,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEventUpdate",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "37"
}

export function createCalendarEventUpdateList(values?: $Shape<$Exact<CalendarEventUpdateList>>): CalendarEventUpdateList {
	return Object.assign(create(_TypeModel, CalendarEventUpdateListTypeRef), values)
}
