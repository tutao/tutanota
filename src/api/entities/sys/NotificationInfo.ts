import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const NotificationInfoTypeRef: TypeRef<NotificationInfo> = new TypeRef("sys", "NotificationInfo")
export const _TypeModel: TypeModel = {
	"name": "NotificationInfo",
	"since": 32,
	"type": "AGGREGATED_TYPE",
	"id": 1364,
	"rootId": "A3N5cwAFVA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1365,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"counter": {
			"id": 1367,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailAddress": {
			"id": 1366,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"userId": {
			"id": 1368,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createNotificationInfo(values?: Partial<NotificationInfo>): NotificationInfo {
	return Object.assign(create(_TypeModel, NotificationInfoTypeRef), downcast<NotificationInfo>(values))
}

export type NotificationInfo = {
	_type: TypeRef<NotificationInfo>;

	_id: Id;
	counter: NumberString;
	mailAddress: string;
	userId: Id;
}