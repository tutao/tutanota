// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const AlarmNotificationTypeRef: TypeRef<AlarmNotification> = new TypeRef("sys", "AlarmNotification")
export const _TypeModel: TypeModel = {
	"name": "AlarmNotification",
	"since": 47,
	"type": "AGGREGATED_TYPE",
	"id": 1557,
	"rootId": "A3N5cwAGFQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1558, "since": 47, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"eventEnd": {"name": "eventEnd", "id": 1562, "since": 47, "type": "Date", "cardinality": "One", "final": true, "encrypted": true},
		"eventStart": {"name": "eventStart", "id": 1561, "since": 47, "type": "Date", "cardinality": "One", "final": true, "encrypted": true},
		"operation": {"name": "operation", "id": 1559, "since": 47, "type": "Number", "cardinality": "One", "final": true, "encrypted": false},
		"summary": {"name": "summary", "id": 1560, "since": 47, "type": "String", "cardinality": "One", "final": true, "encrypted": true}
	},
	"associations": {
		"alarmInfo": {
			"name": "alarmInfo",
			"id": 1563,
			"since": 47,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "AlarmInfo",
			"final": true
		},
		"notificationSessionKeys": {
			"name": "notificationSessionKeys",
			"id": 1565,
			"since": 47,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "NotificationSessionKey",
			"final": true
		},
		"repeatRule": {
			"name": "repeatRule",
			"id": 1564,
			"since": 47,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "RepeatRule",
			"final": true
		},
		"user": {
			"name": "user",
			"id": 1566,
			"since": 47,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "47"
}

export function createAlarmNotification(): AlarmNotification {
	return create(_TypeModel, AlarmNotificationTypeRef)
}
