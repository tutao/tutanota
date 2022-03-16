import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {AlarmInfo} from "./AlarmInfo.js"
import type {NotificationSessionKey} from "./NotificationSessionKey.js"
import type {RepeatRule} from "./RepeatRule.js"

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
			"refType": "AlarmInfo",
			"dependency": null
		},
		"notificationSessionKeys": {
			"id": 1572,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "NotificationSessionKey",
			"dependency": null
		},
		"repeatRule": {
			"id": 1571,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "RepeatRule",
			"dependency": null
		},
		"user": {
			"id": 1573,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "User",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createAlarmNotification(values?: Partial<AlarmNotification>): AlarmNotification {
	return Object.assign(create(_TypeModel, AlarmNotificationTypeRef), downcast<AlarmNotification>(values))
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
	repeatRule:  null | RepeatRule;
	user: Id;
}