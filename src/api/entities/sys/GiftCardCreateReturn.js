// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 1814,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"giftCard": {
			"id": 1815,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GiftCard"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createGiftCardCreateReturn(values?: $Shape<$Exact<GiftCardCreateReturn>>): GiftCardCreateReturn {
	return Object.assign(create(_TypeModel, GiftCardCreateReturnTypeRef), values)
}

export type GiftCardCreateReturn = {
	_type: TypeRef<GiftCardCreateReturn>;

	_format: NumberString;

	giftCard: IdTuple;
}