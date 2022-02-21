import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const GiftCardCreateDataTypeRef: TypeRef<GiftCardCreateData> = new TypeRef("sys", "GiftCardCreateData")
export const _TypeModel: TypeModel = {
	"name": "GiftCardCreateData",
	"since": 65,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1803,
	"rootId": "A3N5cwAHCw",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1804,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"country": {
			"id": 1808,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"keyHash": {
			"id": 1809,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"message": {
			"id": 1805,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"ownerEncSessionKey": {
			"id": 1806,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"id": 1807,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "72"
}

export function createGiftCardCreateData(values?: Partial<GiftCardCreateData>): GiftCardCreateData {
	return Object.assign(create(_TypeModel, GiftCardCreateDataTypeRef), downcast<GiftCardCreateData>(values))
}

export type GiftCardCreateData = {
	_type: TypeRef<GiftCardCreateData>;
	_errors: Object;

	_format: NumberString;
	country: string;
	keyHash: Uint8Array;
	message: string;
	ownerEncSessionKey: Uint8Array;
	value: NumberString;
}