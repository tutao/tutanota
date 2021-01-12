// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {AlarmNotification} from "./AlarmNotification"
import type {NotificationInfo} from "./NotificationInfo"

export const MissedNotificationTypeRef: TypeRef<MissedNotification> = new TypeRef("sys", "MissedNotification")
export const _TypeModel: TypeModel = {
	"name": "MissedNotification",
	"since": 53,
	"type": "ELEMENT_TYPE",
	"id": 1693,
	"rootId": "A3N5cwAGnQ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1697,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1695,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1699,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1698,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1696,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"changeTime": {
			"id": 1701,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"confirmationId": {
			"id": 1700,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"lastProcessedNotificationId": {
			"id": 1722,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"alarmNotifications": {
			"id": 1703,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "AlarmNotification"
		},
		"notificationInfos": {
			"id": 1702,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "NotificationInfo"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createMissedNotification(values?: $Shape<$Exact<MissedNotification>>): MissedNotification {
	return Object.assign(create(_TypeModel, MissedNotificationTypeRef), values)
}

export type MissedNotification = {
	_type: TypeRef<MissedNotification>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	changeTime: Date;
	confirmationId: Id;
	lastProcessedNotificationId: ?Id;

	alarmNotifications: AlarmNotification[];
	notificationInfos: NotificationInfo[];
}