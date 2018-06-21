// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const MissedNotificationsTypeRef: TypeRef<MissedNotifications> = new TypeRef("sys", "MissedNotifications")
export const _TypeModel: TypeModel = {
	"name": "MissedNotifications",
	"since": 32,
	"type": "AGGREGATED_TYPE",
	"id": 1376,
	"rootId": "A3N5cwAFYA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1377,
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
			"id": 1378,
			"since": 32,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "MissedNotification",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createMissedNotifications(): MissedNotifications {
	return create(_TypeModel)
}
