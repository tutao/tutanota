// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const BootstrapFeatureTypeRef: TypeRef<BootstrapFeature> = new TypeRef("sys", "BootstrapFeature")
export const _TypeModel: TypeModel = {
	"name": "BootstrapFeature",
	"since": 24,
	"type": "AGGREGATED_TYPE",
	"id": 1249,
	"rootId": "A3N5cwAE4Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1250,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"feature": {
			"id": 1309,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createBootstrapFeature(values?: $Shape<$Exact<BootstrapFeature>>): BootstrapFeature {
	return Object.assign(create(_TypeModel, BootstrapFeatureTypeRef), values)
}

export type BootstrapFeature = {
	_type: TypeRef<BootstrapFeature>;

	_id: Id;
	feature: NumberString;
}