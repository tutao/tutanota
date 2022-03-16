import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1097,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1095,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1098,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1096,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"calendarEvent": {
			"id": 1099,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "CalendarEvent",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createCalendarEventUidIndex(values?: Partial<CalendarEventUidIndex>): CalendarEventUidIndex {
	return Object.assign(create(_TypeModel, CalendarEventUidIndexTypeRef), downcast<CalendarEventUidIndex>(values))
}

export type CalendarEventUidIndex = {
	_type: TypeRef<CalendarEventUidIndex>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;

	calendarEvent: IdTuple;
}