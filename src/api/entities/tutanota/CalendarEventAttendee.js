// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {EncryptedMailAddress} from "./EncryptedMailAddress"

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
			"name": "_id",
			"id": 1085,
			"since": 42,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"status": {
			"name": "status",
			"id": 1086,
			"since": 42,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"address": {
			"name": "address",
			"id": 1087,
			"since": 42,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "EncryptedMailAddress",
			"final": true
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