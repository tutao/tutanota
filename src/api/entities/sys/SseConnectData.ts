import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {GeneratedIdWrapper} from "./GeneratedIdWrapper.js"

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
			"refType": "GeneratedIdWrapper",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createSseConnectData(values?: Partial<SseConnectData>): SseConnectData {
	return Object.assign(create(_TypeModel, SseConnectDataTypeRef), downcast<SseConnectData>(values))
}

export type SseConnectData = {
	_type: TypeRef<SseConnectData>;

	_format: NumberString;
	identifier: string;

	userIds: GeneratedIdWrapper[];
}