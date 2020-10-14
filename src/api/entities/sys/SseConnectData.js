// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1353,
			"since": 32,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"identifier": {
			"name": "identifier",
			"id": 1354,
			"since": 32,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"userIds": {
			"name": "userIds",
			"id": 1355,
			"since": 32,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "GeneratedIdWrapper",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
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