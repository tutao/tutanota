// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {EntityUpdate} from "./EntityUpdate"

export const WebsocketEntityDataTypeRef: TypeRef<WebsocketEntityData> = new TypeRef("sys", "WebsocketEntityData")
export const _TypeModel: TypeModel = {
	"name": "WebsocketEntityData",
	"since": 41,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1483,
	"rootId": "A3N5cwAFyw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1484,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"eventBatchId": {
			"id": 1485,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"eventBatchOwner": {
			"id": 1486,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"eventBatch": {
			"id": 1487,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "EntityUpdate"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createWebsocketEntityData(values?: $Shape<$Exact<WebsocketEntityData>>): WebsocketEntityData {
	return Object.assign(create(_TypeModel, WebsocketEntityDataTypeRef), values)
}

export type WebsocketEntityData = {
	_type: TypeRef<WebsocketEntityData>;

	_format: NumberString;
	eventBatchId: Id;
	eventBatchOwner: Id;

	eventBatch: EntityUpdate[];
}