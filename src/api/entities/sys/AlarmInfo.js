// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {CalendarEventRef} from "./CalendarEventRef"

export const AlarmInfoTypeRef: TypeRef<AlarmInfo> = new TypeRef("sys", "AlarmInfo")
export const _TypeModel: TypeModel = {
	"name": "AlarmInfo",
	"since": 48,
	"type": "AGGREGATED_TYPE",
	"id": 1536,
	"rootId": "A3N5cwAGAA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1537,
			"since": 48,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"alarmIdentifier": {
			"name": "alarmIdentifier",
			"id": 1539,
			"since": 48,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"trigger": {
			"name": "trigger",
			"id": 1538,
			"since": 48,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"calendarRef": {
			"name": "calendarRef",
			"id": 1540,
			"since": 48,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CalendarEventRef",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createAlarmInfo(values?: $Shape<$Exact<AlarmInfo>>): AlarmInfo {
	return Object.assign(create(_TypeModel, AlarmInfoTypeRef), values)
}

export type AlarmInfo = {
	_type: TypeRef<AlarmInfo>;

	_id: Id;
	alarmIdentifier: string;
	trigger: string;

	calendarRef: CalendarEventRef;
}