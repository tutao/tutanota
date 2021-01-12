// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 1470,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"business": {
			"id": 1472,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"messageTextId": {
			"id": 1471,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"premiumBusinessPrices": {
			"id": 1866,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices"
		},
		"premiumPrices": {
			"id": 1473,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices"
		},
		"proPrices": {
			"id": 1474,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices"
		},
		"teamsBusinessPrices": {
			"id": 1867,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices"
		},
		"teamsPrices": {
			"id": 1729,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createUpgradePriceServiceReturn(values?: $Shape<$Exact<UpgradePriceServiceReturn>>): UpgradePriceServiceReturn {
	return Object.assign(create(_TypeModel, UpgradePriceServiceReturnTypeRef), values)
}

export type UpgradePriceServiceReturn = {
	_type: TypeRef<UpgradePriceServiceReturn>;

	_format: NumberString;
	business: boolean;
	messageTextId: ?string;

	premiumBusinessPrices: PlanPrices;
	premiumPrices: PlanPrices;
	proPrices: PlanPrices;
	teamsBusinessPrices: PlanPrices;
	teamsPrices: PlanPrices;
}