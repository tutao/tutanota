// @flow

import {create, TypeRef} from "../../common/utils/EntityUtils"


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
	"version": "66"
}

export function createPremiumFeatureReturn(values?: $Shape<$Exact<PremiumFeatureReturn>>): PremiumFeatureReturn {
	return Object.assign(create(_TypeModel, PremiumFeatureReturnTypeRef), values)
}

export type PremiumFeatureReturn = {
	_type: TypeRef<PremiumFeatureReturn>;

	_format: NumberString;
	activatedFeature: NumberString;
}