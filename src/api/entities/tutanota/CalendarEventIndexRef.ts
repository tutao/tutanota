import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "CalendarEventUidIndex",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createCalendarEventIndexRef(values?: Partial<CalendarEventIndexRef>): CalendarEventIndexRef {
	return Object.assign(create(_TypeModel, CalendarEventIndexRefTypeRef), downcast<CalendarEventIndexRef>(values))
}

export type CalendarEventIndexRef = {
	_type: TypeRef<CalendarEventIndexRef>;

	_id: Id;

	list: Id;
}