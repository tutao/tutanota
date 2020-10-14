// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const PremiumFeatureDataTypeRef: TypeRef<PremiumFeatureData> = new TypeRef("sys", "PremiumFeatureData")
export const _TypeModel: TypeModel = {
	"name": "PremiumFeatureData",
	"since": 6,
	"type": "DATA_TRANSFER_TYPE",
	"id": 651,
	"rootId": "A3N5cwACiw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 652,
			"since": 6,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"activationCode": {
			"name": "activationCode",
			"id": 654,
			"since": 6,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"featureName": {
			"name": "featureName",
			"id": 653,
			"since": 6,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "63"
}

export function createPremiumFeatureData(values?: $Shape<$Exact<PremiumFeatureData>>): PremiumFeatureData {
	return Object.assign(create(_TypeModel, PremiumFeatureDataTypeRef), values)
}

export type PremiumFeatureData = {
	_type: TypeRef<PremiumFeatureData>;

	_format: NumberString;
	activationCode: string;
	featureName: string;
}