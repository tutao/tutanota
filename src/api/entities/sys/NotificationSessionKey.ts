import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const NotificationSessionKeyTypeRef: TypeRef<NotificationSessionKey> = new TypeRef("sys", "NotificationSessionKey")
export const _TypeModel: TypeModel = {
	"name": "NotificationSessionKey",
	"since": 48,
	"type": "AGGREGATED_TYPE",
	"id": 1553,
	"rootId": "A3N5cwAGEQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1554,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pushIdentifierSessionEncSessionKey": {
			"id": 1556,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"pushIdentifier": {
			"id": 1555,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "PushIdentifier",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createNotificationSessionKey(values?: Partial<NotificationSessionKey>): NotificationSessionKey {
	return Object.assign(create(_TypeModel, NotificationSessionKeyTypeRef), downcast<NotificationSessionKey>(values))
}

export type NotificationSessionKey = {
	_type: TypeRef<NotificationSessionKey>;

	_id: Id;
	pushIdentifierSessionEncSessionKey: Uint8Array;

	pushIdentifier: IdTuple;
}