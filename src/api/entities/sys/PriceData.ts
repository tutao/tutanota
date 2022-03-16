import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {PriceItemData} from "./PriceItemData.js"

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
			"id": 854,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"paymentInterval": {
			"id": 857,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"price": {
			"id": 855,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"taxIncluded": {
			"id": 856,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"items": {
			"id": 858,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "PriceItemData",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createPriceData(values?: Partial<PriceData>): PriceData {
	return Object.assign(create(_TypeModel, PriceDataTypeRef), downcast<PriceData>(values))
}

export type PriceData = {
	_type: TypeRef<PriceData>;

	_id: Id;
	paymentInterval: NumberString;
	price: NumberString;
	taxIncluded: boolean;

	items: PriceItemData[];
}