// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const WebsocketCounterValueTypeRef: TypeRef<WebsocketCounterValue> = new TypeRef("sys", "WebsocketCounterValue")
export const _TypeModel: TypeModel = {
	"name": "WebsocketCounterValue",
	"since": 41,
	"type": "AGGREGATED_TYPE",
	"id": 1488,
	"rootId": "A3N5cwAF0A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1489,
			"since": 41,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"count": {
			"name": "count",
			"id": 1491,
			"since": 41,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailListId": {
			"name": "mailListId",
			"id": 1490,
			"since": 41,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createWebsocketCounterValue(values?: $Shape<$Exact<WebsocketCounterValue>>): WebsocketCounterValue {
	return Object.assign(create(_TypeModel, WebsocketCounterValueTypeRef), values)
}

export type WebsocketCounterValue = {
	_type: TypeRef<WebsocketCounterValue>;

	_id: Id;
	count: NumberString;
	mailListId: Id;
}