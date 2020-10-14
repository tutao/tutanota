// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {WebsocketCounterValue} from "./WebsocketCounterValue"

export const WebsocketCounterDataTypeRef: TypeRef<WebsocketCounterData> = new TypeRef("sys", "WebsocketCounterData")
export const _TypeModel: TypeModel = {
	"name": "WebsocketCounterData",
	"since": 41,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1492,
	"rootId": "A3N5cwAF1A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1493,
			"since": 41,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailGroup": {
			"name": "mailGroup",
			"id": 1494,
			"since": 41,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"counterValues": {
			"name": "counterValues",
			"id": 1495,
			"since": 41,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "WebsocketCounterValue",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createWebsocketCounterData(values?: $Shape<$Exact<WebsocketCounterData>>): WebsocketCounterData {
	return Object.assign(create(_TypeModel, WebsocketCounterDataTypeRef), values)
}

export type WebsocketCounterData = {
	_type: TypeRef<WebsocketCounterData>;

	_format: NumberString;
	mailGroup: Id;

	counterValues: WebsocketCounterValue[];
}