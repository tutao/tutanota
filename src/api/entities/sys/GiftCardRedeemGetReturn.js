// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1822,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"country": {
			"name": "country",
			"id": 1826,
			"since": 65,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"message": {
			"name": "message",
			"id": 1824,
			"since": 65,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"value": {
			"name": "value",
			"id": 1825,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"giftCard": {
			"name": "giftCard",
			"id": 1823,
			"since": 65,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GiftCard",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "65"
}

export function createGiftCardRedeemGetReturn(values?: $Shape<$Exact<GiftCardRedeemGetReturn>>): GiftCardRedeemGetReturn {
	return Object.assign(create(_TypeModel, GiftCardRedeemGetReturnTypeRef), values)
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