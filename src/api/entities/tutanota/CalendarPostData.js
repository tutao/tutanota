// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarPostDataTypeRef: TypeRef<CalendarPostData> = new TypeRef("tutanota", "CalendarPostData")
export const _TypeModel: TypeModel = {
	"name": "CalendarPostData",
	"since": 33,
	"type": "DATA_TRANSFER_TYPE",
	"id": 975,
	"rootId": "CHR1dGFub3RhAAPP",
	"versioned": false,
	"encrypted": false,
	"values": {"_format": {"name": "_format", "id": 976, "since": 33, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}},
	"associations": {
		"calendarData": {
			"name": "calendarData",
			"id": 977,
			"since": 33,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CalendarGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "33"
}

export function createCalendarPostData(): CalendarPostData {
	return create(_TypeModel, CalendarPostDataTypeRef)
}
