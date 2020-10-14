// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 860,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"currentPeriodAddedPrice": {
			"name": "currentPeriodAddedPrice",
			"id": 862,
			"since": 9,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"periodEndDate": {
			"name": "periodEndDate",
			"id": 861,
			"since": 9,
			"type": "Date",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"currentPriceNextPeriod": {
			"name": "currentPriceNextPeriod",
			"id": 864,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PriceData",
			"final": false
		},
		"currentPriceThisPeriod": {
			"name": "currentPriceThisPeriod",
			"id": 863,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PriceData",
			"final": false
		},
		"futurePriceNextPeriod": {
			"name": "futurePriceNextPeriod",
			"id": 865,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PriceData",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
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