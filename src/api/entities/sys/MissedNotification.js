// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const MissedNotificationTypeRef: TypeRef<MissedNotification> = new TypeRef("sys", "MissedNotification")
export const _TypeModel: TypeModel = {
	"name": "MissedNotification",
	"since": 32,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1369,
	"rootId": "A3N5cwAFWQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1373,
			"since": 32,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1371,
			"since": 32,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1374,
			"since": 32,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1372,
			"since": 32,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"confirmationId": {
			"name": "confirmationId",
			"id": 1376,
			"since": 32,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"notificationInfos": {
			"name": "notificationInfos",
			"id": 1375,
			"since": 32,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "NotificationInfo",
			"final": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createMissedNotification(): MissedNotification {
	return create(_TypeModel)
}
