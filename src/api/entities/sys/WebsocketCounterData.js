// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 1493,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mailGroup": {
			"id": 1494,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"counterValues": {
			"id": 1495,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "WebsocketCounterValue"
		}
	},
	"app": "sys",
	"version": "68"
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