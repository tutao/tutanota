// @flow

import {create} from "../../common/utils/EntityUtils"

import type {CalendarEventAttendee} from "./CalendarEventAttendee"
import type {EncryptedMailAddress} from "./EncryptedMailAddress"
import type {CalendarRepeatRule} from "./CalendarRepeatRule"
import {TypeRef} from "../../common/utils/TypeRef";

export const CalendarEventTypeRef: TypeRef<CalendarEvent> = new TypeRef("tutanota", "CalendarEvent")
export const _TypeModel: TypeModel = {
	"name": "CalendarEvent",
	"since": 33,
	"type": "LIST_ELEMENT_TYPE",
	"id": 933,
	"rootId": "CHR1dGFub3RhAAOl",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 937,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 935,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 939,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 938,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 936,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"description": {
			"id": 941,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"endTime": {
			"id": 943,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"hashedUid": {
			"id": 1088,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"invitedConfidentially": {
			"id": 1090,
			"type": "Boolean",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		},
		"location": {
			"id": 944,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"sequence": {
			"id": 1089,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"startTime": {
			"id": 942,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"summary": {
			"id": 940,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"uid": {
			"id": 988,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"attendees": {
			"id": 1091,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "CalendarEventAttendee"
		},
		"organizer": {
			"id": 1092,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "EncryptedMailAddress"
		},
		"repeatRule": {
			"id": 945,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "CalendarRepeatRule"
		},
		"alarmInfos": {
			"id": 946,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "UserAlarmInfo"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCalendarEvent(values?: $Shape<$Exact<CalendarEvent>>): CalendarEvent {
	return Object.assign(create(_TypeModel, CalendarEventTypeRef), values)
}

export type CalendarEvent = {
	_type: TypeRef<CalendarEvent>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	description: string;
	endTime: Date;
	hashedUid: ?Uint8Array;
	invitedConfidentially: ?boolean;
	location: string;
	sequence: NumberString;
	startTime: Date;
	summary: string;
	uid: ?string;

	attendees: CalendarEventAttendee[];
	organizer: ?EncryptedMailAddress;
	repeatRule: ?CalendarRepeatRule;
	alarmInfos: IdTuple[];
}