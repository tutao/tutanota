// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const WebsocketWrapperTypeRef: TypeRef<WebsocketWrapper> = new TypeRef("sys", "WebsocketWrapper")
export const _TypeModel: TypeModel = {
	"name": "WebsocketWrapper",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 472,
	"rootId": "A3N5cwAB2A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 473,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"clientVersion": {
			"name": "clientVersion",
			"id": 1086,
			"since": 20,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"eventBatchId": {
			"name": "eventBatchId",
			"id": 1087,
			"since": 20,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"eventBatchOwner": {
			"name": "eventBatchOwner",
			"id": 1088,
			"since": 20,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"modelVersions": {
			"name": "modelVersions",
			"id": 683,
			"since": 7,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"msgId": {
			"name": "msgId",
			"id": 474,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 475,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"authentication": {
			"name": "authentication",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "Authentication",
			"final": false
		},
		"chat": {
			"name": "chat",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "Chat",
			"final": false
		},
		"entityUpdate": {
			"name": "entityUpdate",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "EntityUpdate",
			"final": false
		},
		"eventBatch": {
			"name": "eventBatch",
			"since": 20,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "EntityUpdate",
			"final": false
		},
		"exception": {
			"name": "exception",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "Exception",
			"final": false
		}
	},
	"app": "sys",
	"version": "23"
}

export function createWebsocketWrapper(): WebsocketWrapper {
	return create(_TypeModel)
}
