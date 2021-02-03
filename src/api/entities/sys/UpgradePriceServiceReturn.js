// @flow

import {create} from "../../common/utils/EntityUtils"

import type {PlanPrices} from "./PlanPrices"
import {TypeRef} from "../../common/utils/TypeRef";

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
		"teamsPrices": {
			"id": 1729,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices"
		}
	},
	"app": "sys",
	"version": "67"
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