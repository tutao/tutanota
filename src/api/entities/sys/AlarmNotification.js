// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 1565,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"eventEnd": {
			"id": 1569,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"eventStart": {
			"id": 1568,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"operation": {
			"id": 1566,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"summary": {
			"id": 1567,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"alarmInfo": {
			"id": 1570,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": true,
			"refType": "AlarmInfo"
		},
		"notificationSessionKeys": {
			"id": 1572,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "NotificationSessionKey"
		},
		"repeatRule": {
			"id": 1571,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "RepeatRule"
		},
		"user": {
			"id": 1573,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "68"
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