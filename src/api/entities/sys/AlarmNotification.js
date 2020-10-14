// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {AlarmInfo} from "./AlarmInfo"
import type {NotificationSessionKey} from "./NotificationSessionKey"
import type {RepeatRule} from "./RepeatRule"

export const AlarmNotificationTypeRef: TypeRef<AlarmNotification> = new TypeRef("sys", "AlarmNotification")
export const _TypeModel: TypeModel = {
	"name": "AlarmNotification",
	"since": 48,
	"type": "AGGREGATED_TYPE",
	"id": 1564,
	"rootId": "A3N5cwAGHA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1565,
			"since": 48,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"eventEnd": {
			"name": "eventEnd",
			"id": 1569,
			"since": 48,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"eventStart": {
			"name": "eventStart",
			"id": 1568,
			"since": 48,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"operation": {
			"name": "operation",
			"id": 1566,
			"since": 48,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"summary": {
			"name": "summary",
			"id": 1567,
			"since": 48,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"alarmInfo": {
			"name": "alarmInfo",
			"id": 1570,
			"since": 48,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "AlarmInfo",
			"final": true
		},
		"notificationSessionKeys": {
			"name": "notificationSessionKeys",
			"id": 1572,
			"since": 48,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "NotificationSessionKey",
			"final": true
		},
		"repeatRule": {
			"name": "repeatRule",
			"id": 1571,
			"since": 48,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "RepeatRule",
			"final": true
		},
		"user": {
			"name": "user",
			"id": 1573,
			"since": 48,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createAlarmNotification(values?: $Shape<$Exact<AlarmNotification>>): AlarmNotification {
	return Object.assign(create(_TypeModel, AlarmNotificationTypeRef), values)
}

export type AlarmNotification = {
	_type: TypeRef<AlarmNotification>;

	_id: Id;
	eventEnd: Date;
	eventStart: Date;
	operation: NumberString;
	summary: string;

	alarmInfo: AlarmInfo;
	notificationSessionKeys: NotificationSessionKey[];
	repeatRule: ?RepeatRule;
	user: Id;
}