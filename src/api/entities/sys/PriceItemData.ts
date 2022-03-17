import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const PriceItemDataTypeRef: TypeRef<PriceItemData> = new TypeRef("sys", "PriceItemData")
export const _TypeModel: TypeModel = {
	"name": "PriceItemData",
	"since": 9,
	"type": "AGGREGATED_TYPE",
	"id": 847,
	"rootId": "A3N5cwADTw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 848,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"count": {
			"id": 850,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"featureType": {
			"id": 849,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"price": {
			"id": 851,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"singleType": {
			"id": 852,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "73"
}

export function createPriceItemData(values?: Partial<PriceItemData>): PriceItemData {
	return Object.assign(create(_TypeModel, PriceItemDataTypeRef), downcast<PriceItemData>(values))
}

export type PriceItemData = {
	_type: TypeRef<PriceItemData>;

	_id: Id;
	count: NumberString;
	featureType: NumberString;
	price: NumberString;
	singleType: boolean;
}