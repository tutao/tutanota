import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 1811,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"giftCard": {
			"id": 1812,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GiftCard",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createGiftCardDeleteData(values?: Partial<GiftCardDeleteData>): GiftCardDeleteData {
	return Object.assign(create(_TypeModel, GiftCardDeleteDataTypeRef), downcast<GiftCardDeleteData>(values))
}

export type GiftCardDeleteData = {
	_type: TypeRef<GiftCardDeleteData>;

	_format: NumberString;

	giftCard: IdTuple;
}