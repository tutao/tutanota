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
		"_id": {"name": "_id", "id": 1254, "since": 25, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"feature": {"name": "feature", "id": 1255, "since": 25, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "sys",
	"version": "42"
}

export function createFeature(): Feature {
	return create(_TypeModel)
}
