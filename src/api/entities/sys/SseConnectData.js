// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {GeneratedIdWrapper} from "./GeneratedIdWrapper"

export const SseConnectDataTypeRef: TypeRef<SseConnectData> = new TypeRef("sys", "SseConnectData")
export const _TypeModel: TypeModel = {
	"name": "SseConnectData",
	"since": 32,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1352,
	"rootId": "A3N5cwAFSA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1353,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"identifier": {
			"id": 1354,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"userIds": {
			"id": 1355,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "GeneratedIdWrapper"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createSseConnectData(values?: $Shape<$Exact<SseConnectData>>): SseConnectData {
	return Object.assign(create(_TypeModel, SseConnectDataTypeRef), values)
}

export type SseConnectData = {
	_type: TypeRef<SseConnectData>;

	_format: NumberString;
	identifier: string;

	userIds: GeneratedIdWrapper[];
}