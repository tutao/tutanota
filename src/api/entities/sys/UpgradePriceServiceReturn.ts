import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {PlanPrices} from "./PlanPrices.js"

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
			"refType": "PlanPrices",
			"dependency": null
		},
		"premiumPrices": {
			"id": 1473,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices",
			"dependency": null
		},
		"proPrices": {
			"id": 1474,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices",
			"dependency": null
		},
		"teamsBusinessPrices": {
			"id": 1867,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices",
			"dependency": null
		},
		"teamsPrices": {
			"id": 1729,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "PlanPrices",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUpgradePriceServiceReturn(values?: Partial<UpgradePriceServiceReturn>): UpgradePriceServiceReturn {
	return Object.assign(create(_TypeModel, UpgradePriceServiceReturnTypeRef), downcast<UpgradePriceServiceReturn>(values))
}

export type UpgradePriceServiceReturn = {
	_type: TypeRef<UpgradePriceServiceReturn>;

	_format: NumberString;
	business: boolean;
	messageTextId: null | string;

	premiumBusinessPrices: PlanPrices;
	premiumPrices: PlanPrices;
	proPrices: PlanPrices;
	teamsBusinessPrices: PlanPrices;
	teamsPrices: PlanPrices;
}