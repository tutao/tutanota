import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const PremiumFeatureReturnTypeRef: TypeRef<PremiumFeatureReturn> = new TypeRef("sys", "PremiumFeatureReturn")
export const _TypeModel: TypeModel = {
	"name": "PremiumFeatureReturn",
	"since": 16,
	"type": "DATA_TRANSFER_TYPE",
	"id": 978,
	"rootId": "A3N5cwAD0g",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 979,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"activatedFeature": {
			"id": 980,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createPremiumFeatureReturn(values?: Partial<PremiumFeatureReturn>): PremiumFeatureReturn {
	return Object.assign(create(_TypeModel, PremiumFeatureReturnTypeRef), downcast<PremiumFeatureReturn>(values))
}

export type PremiumFeatureReturn = {
	_type: TypeRef<PremiumFeatureReturn>;

	_format: NumberString;
	activatedFeature: NumberString;
}