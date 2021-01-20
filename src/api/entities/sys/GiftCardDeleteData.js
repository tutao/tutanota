// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const GiftCardDeleteDataTypeRef: TypeRef<GiftCardDeleteData> = new TypeRef("sys", "GiftCardDeleteData")
export const _TypeModel: TypeModel = {
	"name": "GiftCardDeleteData",
	"since": 65,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1810,
	"rootId": "A3N5cwAHEg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1811,
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
			"id": 1812,
			"since": 65,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GiftCard",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "67"
}

export function createGiftCardDeleteData(values?: $Shape<$Exact<GiftCardDeleteData>>): GiftCardDeleteData {
	return Object.assign(create(_TypeModel, GiftCardDeleteDataTypeRef), values)
}

export type GiftCardDeleteData = {
	_type: TypeRef<GiftCardDeleteData>;

	_format: NumberString;

	giftCard: IdTuple;
}