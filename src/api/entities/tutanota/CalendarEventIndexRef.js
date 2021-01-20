// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const CalendarEventIndexRefTypeRef: TypeRef<CalendarEventIndexRef> = new TypeRef("tutanota", "CalendarEventIndexRef")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventIndexRef",
	"since": 42,
	"type": "AGGREGATED_TYPE",
	"id": 1100,
	"rootId": "CHR1dGFub3RhAARM",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1101,
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
			"id": 1102,
			"since": 42,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "CalendarEventUidIndex",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarEventIndexRef(values?: $Shape<$Exact<CalendarEventIndexRef>>): CalendarEventIndexRef {
	return Object.assign(create(_TypeModel, CalendarEventIndexRefTypeRef), values)
}

export type CalendarEventIndexRef = {
	_type: TypeRef<CalendarEventIndexRef>;

	_id: Id;

	list: Id;
}