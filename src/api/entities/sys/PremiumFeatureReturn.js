// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 979,
			"since": 16,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"activatedFeature": {
			"name": "activatedFeature",
			"id": 980,
			"since": 16,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createPremiumFeatureReturn(values?: $Shape<$Exact<PremiumFeatureReturn>>): PremiumFeatureReturn {
	return Object.assign(create(_TypeModel, PremiumFeatureReturnTypeRef), values)
}

export type PremiumFeatureReturn = {
	_type: TypeRef<PremiumFeatureReturn>;

	_format: NumberString;
	activatedFeature: NumberString;
}