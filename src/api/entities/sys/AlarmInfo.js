// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 1537,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"alarmIdentifier": {
			"id": 1539,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"trigger": {
			"id": 1538,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"calendarRef": {
			"id": 1540,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "CalendarEventRef"
		}
	},
	"app": "sys",
	"version": "68"
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