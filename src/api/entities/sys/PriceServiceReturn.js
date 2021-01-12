// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {PriceData} from "./PriceData"

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
			"refType": "PriceData"
		},
		"currentPriceThisPeriod": {
			"id": 863,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "PriceData"
		},
		"futurePriceNextPeriod": {
			"id": 865,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "PriceData"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createPriceServiceReturn(values?: $Shape<$Exact<PriceServiceReturn>>): PriceServiceReturn {
	return Object.assign(create(_TypeModel, PriceServiceReturnTypeRef), values)
}

export type PriceServiceReturn = {
	_type: TypeRef<PriceServiceReturn>;

	_format: NumberString;
	currentPeriodAddedPrice: ?NumberString;
	periodEndDate: Date;

	currentPriceNextPeriod: ?PriceData;
	currentPriceThisPeriod: ?PriceData;
	futurePriceNextPeriod: ?PriceData;
}