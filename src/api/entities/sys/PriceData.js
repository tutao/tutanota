// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const PriceDataTypeRef: TypeRef<PriceData> = new TypeRef("sys", "PriceData")
export const _TypeModel: TypeModel = {
	"name": "PriceData",
	"since": 9,
	"type": "AGGREGATED_TYPE",
	"id": 853,
	"rootId": "A3N5cwADVQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 854,
			"since": 9,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"paymentInterval": {
			"name": "paymentInterval",
			"id": 857,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"price": {
			"name": "price",
			"id": 855,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"taxIncluded": {
			"name": "taxIncluded",
			"id": 856,
			"since": 9,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"name": "items",
			"id": 858,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "PriceItemData",
			"final": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createPriceData(): PriceData {
	return create(_TypeModel)
}
