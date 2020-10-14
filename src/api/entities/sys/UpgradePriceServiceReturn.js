// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {PlanPrices} from "./PlanPrices"

export const UpgradePriceServiceReturnTypeRef: TypeRef<UpgradePriceServiceReturn> = new TypeRef("sys", "UpgradePriceServiceReturn")
export const _TypeModel: TypeModel = {
	"name": "UpgradePriceServiceReturn",
	"since": 39,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1469,
	"rootId": "A3N5cwAFvQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1470,
			"since": 39,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"business": {
			"name": "business",
			"id": 1472,
			"since": 39,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"messageTextId": {
			"name": "messageTextId",
			"id": 1471,
			"since": 39,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"premiumPrices": {
			"name": "premiumPrices",
			"id": 1473,
			"since": 39,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "PlanPrices",
			"final": false
		},
		"proPrices": {
			"name": "proPrices",
			"id": 1474,
			"since": 39,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "PlanPrices",
			"final": false
		},
		"teamsPrices": {
			"name": "teamsPrices",
			"id": 1729,
			"since": 57,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "PlanPrices",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createUpgradePriceServiceReturn(values?: $Shape<$Exact<UpgradePriceServiceReturn>>): UpgradePriceServiceReturn {
	return Object.assign(create(_TypeModel, UpgradePriceServiceReturnTypeRef), values)
}

export type UpgradePriceServiceReturn = {
	_type: TypeRef<UpgradePriceServiceReturn>;

	_format: NumberString;
	business: boolean;
	messageTextId: ?string;

	premiumPrices: PlanPrices;
	proPrices: PlanPrices;
	teamsPrices: PlanPrices;
}