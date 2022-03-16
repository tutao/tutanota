import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const FeatureTypeRef: TypeRef<Feature> = new TypeRef("sys", "Feature")
export const _TypeModel: TypeModel = {
	"name": "Feature",
	"since": 25,
	"type": "AGGREGATED_TYPE",
	"id": 1253,
	"rootId": "A3N5cwAE5Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1254,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"feature": {
			"id": 1255,
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

export function createFeature(values?: Partial<Feature>): Feature {
	return Object.assign(create(_TypeModel, FeatureTypeRef), downcast<Feature>(values))
}

export type Feature = {
	_type: TypeRef<Feature>;

	_id: Id;
	feature: NumberString;
}