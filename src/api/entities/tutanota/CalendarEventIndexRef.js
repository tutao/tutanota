// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
			"id": 1101,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"id": 1102,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "CalendarEventUidIndex"
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