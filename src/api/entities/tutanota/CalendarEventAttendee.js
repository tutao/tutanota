// @flow

import {create} from "../../common/utils/EntityUtils"

import type {EncryptedMailAddress} from "./EncryptedMailAddress"
import {TypeRef} from "../../common/utils/TypeRef";

export const CalendarEventAttendeeTypeRef: TypeRef<CalendarEventAttendee> = new TypeRef("tutanota", "CalendarEventAttendee")
export const _TypeModel: TypeModel = {
	"name": "CalendarEventAttendee",
	"since": 42,
	"type": "AGGREGATED_TYPE",
	"id": 1084,
	"rootId": "CHR1dGFub3RhAAQ8",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1085,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"status": {
			"id": 1086,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"address": {
			"id": 1087,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": true,
			"refType": "EncryptedMailAddress"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarEventAttendee(values?: $Shape<$Exact<CalendarEventAttendee>>): CalendarEventAttendee {
	return Object.assign(create(_TypeModel, CalendarEventAttendeeTypeRef), values)
}

export type CalendarEventAttendee = {
	_type: TypeRef<CalendarEventAttendee>;

	_id: Id;
	status: NumberString;

	address: EncryptedMailAddress;
}