// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 1554,
			"since": 48,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"pushIdentifierSessionEncSessionKey": {
			"name": "pushIdentifierSessionEncSessionKey",
			"id": 1556,
			"since": 48,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"pushIdentifier": {
			"name": "pushIdentifier",
			"id": 1555,
			"since": 48,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "PushIdentifier",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createNotificationSessionKey(values?: $Shape<$Exact<NotificationSessionKey>>): NotificationSessionKey {
	return Object.assign(create(_TypeModel, NotificationSessionKeyTypeRef), values)
}

export type NotificationSessionKey = {
	_type: TypeRef<NotificationSessionKey>;

	_id: Id;
	pushIdentifierSessionEncSessionKey: Uint8Array;

	pushIdentifier: IdTuple;
}