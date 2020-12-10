// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1804,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"country": {
			"name": "country",
			"id": 1808,
			"since": 65,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"keyHash": {
			"name": "keyHash",
			"id": 1809,
			"since": 65,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"message": {
			"name": "message",
			"id": 1805,
			"since": 65,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"ownerEncSessionKey": {
			"name": "ownerEncSessionKey",
			"id": 1806,
			"since": 65,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"value": {
			"name": "value",
			"id": 1807,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "65"
}

export function createGiftCardCreateData(values?: $Shape<$Exact<GiftCardCreateData>>): GiftCardCreateData {
	return Object.assign(create(_TypeModel, GiftCardCreateDataTypeRef), values)
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