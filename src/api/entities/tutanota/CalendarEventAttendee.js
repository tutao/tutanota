// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CalendarEventAttendeeTypeRef: TypeRef<CalendarEventAttendee> = new TypeRef("tutanota", "CalendarEventAttendee")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventAttendee",
	"since": 37,
	"type": "AGGREGATED_TYPE",
	"id": 991,
	"rootId": "CHR1dGFub3RhAAPf",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 992, "since": 37, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"status": {"name": "status", "id": 993, "since": 37, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"address": {
			"name": "address",
			"id": 994,
			"since": 37,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "MailAddress",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "37"
}

export function createCalendarEventAttendee(values?: $Shape<$Exact<CalendarEventAttendee>>): CalendarEventAttendee {
	return Object.assign(create(_TypeModel, CalendarEventAttendeeTypeRef), values)
}
