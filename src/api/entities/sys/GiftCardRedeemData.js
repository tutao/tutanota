// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const GiftCardRedeemDataTypeRef: TypeRef<GiftCardRedeemData> = new TypeRef("sys", "GiftCardRedeemData")
export const _TypeModel: TypeModel = {
	"name": "GiftCardRedeemData",
	"since": 65,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1817,
	"rootId": "A3N5cwAHGQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1818,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"keyHash": {
			"name": "keyHash",
			"id": 1820,
			"since": 65,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"giftCardInfo": {
			"name": "giftCardInfo",
			"id": 1819,
			"since": 65,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GiftCardInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "67"
}

export function createGiftCardRedeemData(values?: $Shape<$Exact<GiftCardRedeemData>>): GiftCardRedeemData {
	return Object.assign(create(_TypeModel, GiftCardRedeemDataTypeRef), values)
}

export type GiftCardRedeemData = {
	_type: TypeRef<GiftCardRedeemData>;

	_format: NumberString;
	keyHash: Uint8Array;

	giftCardInfo: Id;
}