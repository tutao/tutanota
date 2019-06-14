// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const AlarmNotificationTypeRef: TypeRef<AlarmNotification> = new TypeRef("sys", "AlarmNotification")
export const _TypeModel: TypeModel = {
	"name": "AlarmNotification",
	"since": 47,
	"type": "AGGREGATED_TYPE",
	"id": 1552,
	"rootId": "A3N5cwAGEA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1553, "since": 47, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"eventStart": {"name": "eventStart", "id": 1556, "since": 47, "type": "Date", "cardinality": "One", "final": true, "encrypted": true},
		"operation": {"name": "operation", "id": 1554, "since": 47, "type": "Number", "cardinality": "One", "final": true, "encrypted": false},
		"summary": {"name": "summary", "id": 1555, "since": 47, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {
		"alarmInfo": {
			"name": "alarmInfo",
			"id": 1557,
			"since": 47,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "AlarmInfo",
			"final": true
		},
		"deviceSessionKeys": {
			"name": "deviceSessionKeys",
			"id": 1559,
			"since": 47,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "NotificationSessionKey",
			"final": true
		},
		"repeatRule": {"name": "repeatRule", "id": 1558, "since": 47, "type": "AGGREGATION", "cardinality": "ZeroOrOne", "refType": "RepeatRule", "final": true}
	},
	"app": "sys",
	"version": "47"
}

export function createAlarmNotification(): AlarmNotification {
	return create(_TypeModel, AlarmNotificationTypeRef)
}
