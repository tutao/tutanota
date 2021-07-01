// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const GiftCardsRefTypeRef: TypeRef<GiftCardsRef> = new TypeRef("sys", "GiftCardsRef")
export const _TypeModel: TypeModel = {
	"name": "GiftCardsRef",
	"since": 65,
	"type": "AGGREGATED_TYPE",
	"id": 1791,
	"rootId": "A3N5cwAG_w",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1792,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 1793,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GiftCard"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createGiftCardsRef(values?: $Shape<$Exact<GiftCardsRef>>): GiftCardsRef {
	return Object.assign(create(_TypeModel, GiftCardsRefTypeRef), values)
}

export type GiftCardsRef = {
	_type: TypeRef<GiftCardsRef>;

	_id: Id;

	items: Id;
}