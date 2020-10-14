// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1697,
			"since": 53,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1695,
			"since": 53,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1699,
			"since": 53,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1698,
			"since": 53,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1696,
			"since": 53,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"changeTime": {
			"name": "changeTime",
			"id": 1701,
			"since": 53,
			"type": "Date",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"confirmationId": {
			"name": "confirmationId",
			"id": 1700,
			"since": 53,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"lastProcessedNotificationId": {
			"name": "lastProcessedNotificationId",
			"id": 1722,
			"since": 55,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"alarmNotifications": {
			"name": "alarmNotifications",
			"id": 1703,
			"since": 53,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "AlarmNotification",
			"final": false
		},
		"notificationInfos": {
			"name": "notificationInfos",
			"id": 1702,
			"since": 53,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "NotificationInfo",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
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