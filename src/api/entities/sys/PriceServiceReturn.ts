import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {PriceData} from "./PriceData.js"

export const PriceServiceReturnTypeRef: TypeRef<PriceServiceReturn> = new TypeRef("sys", "PriceServiceReturn")
export const _TypeModel: TypeModel = {
	"name": "PriceServiceReturn",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 859,
	"rootId": "A3N5cwADWw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 860,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"currentPeriodAddedPrice": {
			"id": 862,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"periodEndDate": {
			"id": 861,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"currentPriceNextPeriod": {
			"id": 864,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "PriceData",
			"dependency": null
		},
		"currentPriceThisPeriod": {
			"id": 863,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "PriceData",
			"dependency": null
		},
		"futurePriceNextPeriod": {
			"id": 865,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "PriceData",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createPriceServiceReturn(values?: Partial<PriceServiceReturn>): PriceServiceReturn {
	return Object.assign(create(_TypeModel, PriceServiceReturnTypeRef), downcast<PriceServiceReturn>(values))
}

export type PriceServiceReturn = {
	_type: TypeRef<PriceServiceReturn>;

	_format: NumberString;
	currentPeriodAddedPrice: null | NumberString;
	periodEndDate: Date;

	currentPriceNextPeriod:  null | PriceData;
	currentPriceThisPeriod:  null | PriceData;
	futurePriceNextPeriod:  null | PriceData;
}