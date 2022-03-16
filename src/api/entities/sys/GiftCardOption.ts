import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const GiftCardOptionTypeRef: TypeRef<GiftCardOption> = new TypeRef("sys", "GiftCardOption")
export const _TypeModel: TypeModel = {
	"name": "GiftCardOption",
	"since": 65,
	"type": "AGGREGATED_TYPE",
	"id": 1795,
	"rootId": "A3N5cwAHAw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1796,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"value": {
			"id": 1797,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createGiftCardOption(values?: Partial<GiftCardOption>): GiftCardOption {
	return Object.assign(create(_TypeModel, GiftCardOptionTypeRef), downcast<GiftCardOption>(values))
}

export type GiftCardOption = {
	_type: TypeRef<GiftCardOption>;

	_id: Id;
	value: NumberString;
}