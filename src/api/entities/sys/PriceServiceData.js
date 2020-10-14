// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {PriceRequestData} from "./PriceRequestData"

export const PriceServiceDataTypeRef: TypeRef<PriceServiceData> = new TypeRef("sys", "PriceServiceData")
export const _TypeModel: TypeModel = {
	"name": "PriceServiceData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 843,
	"rootId": "A3N5cwADSw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 844,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"campaign": {
			"name": "campaign",
			"id": 1455,
			"since": 38,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"date": {
			"name": "date",
			"id": 846,
			"since": 9,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"priceRequest": {
			"name": "priceRequest",
			"id": 845,
			"since": 9,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "PriceRequestData",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createPriceServiceData(values?: $Shape<$Exact<PriceServiceData>>): PriceServiceData {
	return Object.assign(create(_TypeModel, PriceServiceDataTypeRef), values)
}

export type PriceServiceData = {
	_type: TypeRef<PriceServiceData>;

	_format: NumberString;
	campaign: ?string;
	date: ?Date;

	priceRequest: ?PriceRequestData;
}