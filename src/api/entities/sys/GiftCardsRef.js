// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const GiftCardsRefTypeRef: TypeRef<GiftCardsRef> = new TypeRef("sys", "GiftCardsRef")
export const _TypeModel: TypeModel = {
	"name": "GiftCardsRef",
	"since": 65,
	"type": "AGGREGATED_TYPE",
	"id": 1790,
	"rootId": "A3N5cwAG_g",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1791,
			"since": 65,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 1792,
			"since": 65,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GiftCard",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "65"
}

export function createGiftCardsRef(values?: $Shape<$Exact<GiftCardsRef>>): GiftCardsRef {
	return Object.assign(create(_TypeModel, GiftCardsRefTypeRef), values)
}

export type GiftCardsRef = {
	_type: TypeRef<GiftCardsRef>;

	_id: Id;

	items: Id;
}