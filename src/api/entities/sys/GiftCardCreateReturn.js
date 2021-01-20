// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const GiftCardCreateReturnTypeRef: TypeRef<GiftCardCreateReturn> = new TypeRef("sys", "GiftCardCreateReturn")
export const _TypeModel: TypeModel = {
	"name": "GiftCardCreateReturn",
	"since": 65,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1813,
	"rootId": "A3N5cwAHFQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1814,
			"since": 65,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"giftCard": {
			"name": "giftCard",
			"id": 1815,
			"since": 65,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GiftCard",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "66"
}

export function createGiftCardCreateReturn(values?: $Shape<$Exact<GiftCardCreateReturn>>): GiftCardCreateReturn {
	return Object.assign(create(_TypeModel, GiftCardCreateReturnTypeRef), values)
}

export type GiftCardCreateReturn = {
	_type: TypeRef<GiftCardCreateReturn>;

	_format: NumberString;

	giftCard: IdTuple;
}