// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
			"id": 1114,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"id": 1115,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "CalendarEventUpdate"
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