import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1489,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"count": {
			"id": 1491,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailListId": {
			"id": 1490,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createWebsocketCounterValue(values?: Partial<WebsocketCounterValue>): WebsocketCounterValue {
	return Object.assign(create(_TypeModel, WebsocketCounterValueTypeRef), downcast<WebsocketCounterValue>(values))
}

export type WebsocketCounterValue = {
	_type: TypeRef<WebsocketCounterValue>;

	_id: Id;
	count: NumberString;
	mailListId: Id;
}