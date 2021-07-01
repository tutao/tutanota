// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
	"version": "69"
}

export function createNotificationInfo(values?: $Shape<$Exact<NotificationInfo>>): NotificationInfo {
	return Object.assign(create(_TypeModel, NotificationInfoTypeRef), values)
}

export type NotificationInfo = {
	_type: TypeRef<NotificationInfo>;

	_id: Id;
	counter: NumberString;
	mailAddress: string;
	userId: Id;
}