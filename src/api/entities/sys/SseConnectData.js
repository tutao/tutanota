// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
	"version": "32"
}

export function createSseConnectData(): SseConnectData {
	return create(_TypeModel)
}
