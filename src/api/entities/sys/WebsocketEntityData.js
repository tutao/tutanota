// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1484,
			"since": 41,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"eventBatchId": {
			"name": "eventBatchId",
			"id": 1485,
			"since": 41,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"eventBatchOwner": {
			"name": "eventBatchOwner",
			"id": 1486,
			"since": 41,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"eventBatch": {
			"name": "eventBatch",
			"id": 1487,
			"since": 41,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "EntityUpdate",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
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