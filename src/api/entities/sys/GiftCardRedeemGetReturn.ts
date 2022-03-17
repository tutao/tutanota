import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const GiftCardRedeemGetReturnTypeRef: TypeRef<GiftCardRedeemGetReturn> = new TypeRef("sys", "GiftCardRedeemGetReturn")
export const _TypeModel: TypeModel = {
	"name": "GiftCardRedeemGetReturn",
	"since": 65,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1821,
	"rootId": "A3N5cwAHHQ",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1822,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"country": {
			"id": 1826,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"message": {
			"id": 1824,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"value": {
			"id": 1825,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"giftCard": {
			"id": 1823,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GiftCard"
		}
	},
	"app": "sys",
	"version": "73"
}

export function createGiftCardRedeemGetReturn(values?: Partial<GiftCardRedeemGetReturn>): GiftCardRedeemGetReturn {
	return Object.assign(create(_TypeModel, GiftCardRedeemGetReturnTypeRef), downcast<GiftCardRedeemGetReturn>(values))
}

export type GiftCardRedeemGetReturn = {
	_type: TypeRef<GiftCardRedeemGetReturn>;
	_errors: Object;

	_format: NumberString;
	country: string;
	message: string;
	value: NumberString;

	giftCard: IdTuple;
}