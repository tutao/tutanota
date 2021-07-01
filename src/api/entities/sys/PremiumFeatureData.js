// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 652,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"activationCode": {
			"id": 654,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"featureName": {
			"id": 653,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
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