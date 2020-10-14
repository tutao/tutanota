// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 848,
			"since": 9,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"count": {
			"name": "count",
			"id": 850,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"featureType": {
			"name": "featureType",
			"id": 849,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"price": {
			"name": "price",
			"id": 851,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"singleType": {
			"name": "singleType",
			"id": 852,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createPriceItemData(values?: $Shape<$Exact<PriceItemData>>): PriceItemData {
	return Object.assign(create(_TypeModel, PriceItemDataTypeRef), values)
}

export type PriceItemData = {
	_type: TypeRef<PriceItemData>;

	_id: Id;
	count: NumberString;
	featureType: NumberString;
	price: NumberString;
	singleType: boolean;
}