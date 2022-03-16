import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {GiftCardOption} from "./GiftCardOption.js"

export const GiftCardGetReturnTypeRef: TypeRef<GiftCardGetReturn> = new TypeRef("sys", "GiftCardGetReturn")
export const _TypeModel: TypeModel = {
	"name": "GiftCardGetReturn",
	"since": 65,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1798,
	"rootId": "A3N5cwAHBg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1799,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"maxPerPeriod": {
			"id": 1800,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"period": {
			"id": 1801,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"options": {
			"id": 1802,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "GiftCardOption",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createGiftCardGetReturn(values?: Partial<GiftCardGetReturn>): GiftCardGetReturn {
	return Object.assign(create(_TypeModel, GiftCardGetReturnTypeRef), downcast<GiftCardGetReturn>(values))
}

export type GiftCardGetReturn = {
	_type: TypeRef<GiftCardGetReturn>;

	_format: NumberString;
	maxPerPeriod: NumberString;
	period: NumberString;

	options: GiftCardOption[];
}