// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarPostDataTypeRef: TypeRef<CalendarPostData> = new TypeRef("tutanota", "CalendarPostData")
export const _TypeModel: TypeModel = {
	"name": "CalendarPostData",
	"since": 33,
	"type": "DATA_TRANSFER_TYPE",
	"id": 964,
	"rootId": "CHR1dGFub3RhAAPE",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 965,
			"since": 33,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"calendarData": {
			"name": "calendarData",
			"id": 966,
			"since": 33,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CalendarGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createCalendarPostData(values?: $Shape<$Exact<CalendarPostData>>): CalendarPostData {
	return Object.assign(create(_TypeModel, CalendarPostDataTypeRef), values)
}
