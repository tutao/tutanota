// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_id",
			"id": 1254,
			"since": 25,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"feature": {
			"name": "feature",
			"id": 1255,
			"since": 25,
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

export function createFeature(values?: $Shape<$Exact<Feature>>): Feature {
	return Object.assign(create(_TypeModel, FeatureTypeRef), values)
}

export type Feature = {
	_type: TypeRef<Feature>;

	_id: Id;
	feature: NumberString;
}