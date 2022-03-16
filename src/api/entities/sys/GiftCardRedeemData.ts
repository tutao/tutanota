import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "GiftCardInfo",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createGiftCardRedeemData(values?: Partial<GiftCardRedeemData>): GiftCardRedeemData {
	return Object.assign(create(_TypeModel, GiftCardRedeemDataTypeRef), downcast<GiftCardRedeemData>(values))
}

export type GiftCardRedeemData = {
	_type: TypeRef<GiftCardRedeemData>;

	_format: NumberString;
	keyHash: Uint8Array;

	giftCardInfo: Id;
}