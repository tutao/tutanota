// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const AlarmInfoTypeRef: TypeRef<AlarmInfo> = new TypeRef("sys", "AlarmInfo")
export const _TypeModel: TypeModel = {
	"name": "AlarmInfo",
	"since": 47,
	"type": "AGGREGATED_TYPE",
	"id": 1529,
	"rootId": "A3N5cwAF-Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1530, "since": 47, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"alarmIdentifier": {"name": "alarmIdentifier", "id": 1532, "since": 47, "type": "String", "cardinality": "One", "final": true, "encrypted": false},
		"trigger": {"name": "trigger", "id": 1531, "since": 47, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {
		"calendarRef": {
			"name": "calendarRef",
			"id": 1533,
			"since": 47,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "CalendarEventRef",
			"final": false
		}
	},
	"app": "sys",
	"version": "47"
}

export function createAlarmInfo(): AlarmInfo {
	return create(_TypeModel, AlarmInfoTypeRef)
}
