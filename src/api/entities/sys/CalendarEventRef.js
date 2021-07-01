// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1533,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"elementId": {
			"id": 1534,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"listId": {
			"id": 1535,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
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