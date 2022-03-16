import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const WebauthnResponseDataTypeRef: TypeRef<WebauthnResponseData> = new TypeRef("sys", "WebauthnResponseData")
export const _TypeModel: TypeModel = {
	"name": "WebauthnResponseData",
	"since": 71,
	"type": "AGGREGATED_TYPE",
	"id": 1899,
	"rootId": "A3N5cwAHaw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1900,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"authenticatorData": {
			"id": 1903,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"clientData": {
			"id": 1902,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"keyHandle": {
			"id": 1901,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"signature": {
			"id": 1904,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createWebauthnResponseData(values?: Partial<WebauthnResponseData>): WebauthnResponseData {
	return Object.assign(create(_TypeModel, WebauthnResponseDataTypeRef), downcast<WebauthnResponseData>(values))
}

export type WebauthnResponseData = {
	_type: TypeRef<WebauthnResponseData>;

	_id: Id;
	authenticatorData: Uint8Array;
	clientData: Uint8Array;
	keyHandle: Uint8Array;
	signature: Uint8Array;
}