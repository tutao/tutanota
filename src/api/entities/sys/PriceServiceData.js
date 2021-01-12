// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 844,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"campaign": {
			"id": 1455,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 846,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"priceRequest": {
			"id": 845,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "PriceRequestData"
		}
	},
	"app": "sys",
	"version": "68"
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