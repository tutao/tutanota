// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1818,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"keyHash": {
			"id": 1820,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"giftCardInfo": {
			"id": 1819,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GiftCardInfo"
		}
	},
	"app": "sys",
	"version": "69"
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