// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventIndexRefTypeRef: TypeRef<CalendarEventIndexRef> = new TypeRef("tutanota", "CalendarEventIndexRef")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventIndexRef",
	"since": 37,
	"type": "AGGREGATED_TYPE",
	"id": 1005,
	"rootId": "CHR1dGFub3RhAAPt",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1006,
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
			"id": 1007,
			"since": 37,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEventUidIndex",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "37"
}

export function createCalendarEventIndexRef(values?: $Shape<$Exact<CalendarEventIndexRef>>): CalendarEventIndexRef {
	return Object.assign(create(_TypeModel, CalendarEventIndexRefTypeRef), values)
}
