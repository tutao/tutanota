import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
	"version": "74"
}

export function createBootstrapFeature(values?: Partial<BootstrapFeature>): BootstrapFeature {
	return Object.assign(create(_TypeModel, BootstrapFeatureTypeRef), downcast<BootstrapFeature>(values))
}

export type BootstrapFeature = {
	_type: TypeRef<BootstrapFeature>;

	_id: Id;
	feature: NumberString;
}