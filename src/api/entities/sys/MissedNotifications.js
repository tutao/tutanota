// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MissedNotificationsTypeRef: TypeRef<MissedNotifications> = new TypeRef("sys", "MissedNotifications")
export const _TypeModel: TypeModel = {
	"name": "MissedNotifications",
	"since": 32,
	"type": "AGGREGATED_TYPE",
	"id": 1377,
	"rootId": "A3N5cwAFYQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1378,
			"since": 32,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"notifications": {
			"name": "notifications",
			"id": 1379,
			"since": 32,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "MissedNotification",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "34"
}

export function createMissedNotifications(): MissedNotifications {
	return create(_TypeModel)
}
