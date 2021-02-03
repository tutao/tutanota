// @flow

import {create} from "../../common/utils/EntityUtils"

import type {CalendarGroupData} from "./CalendarGroupData"
import {TypeRef} from "../../common/utils/TypeRef";

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
			"id": 965,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"calendarData": {
			"id": 966,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "CalendarGroupData"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarPostData(values?: $Shape<$Exact<CalendarPostData>>): CalendarPostData {
	return Object.assign(create(_TypeModel, CalendarPostDataTypeRef), values)
}

export type CalendarPostData = {
	_type: TypeRef<CalendarPostData>;

	_format: NumberString;

	calendarData: CalendarGroupData;
}