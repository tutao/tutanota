// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const DisabledFeatureTypeRef: TypeRef<DisabledFeature> = new TypeRef("sys", "DisabledFeature")
export const _TypeModel: TypeModel = {
	"name": "DisabledFeature",
	"since": 24,
	"type": "AGGREGATED_TYPE",
	"id": 1249,
	"rootId": "A3N5cwAE4Q",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 1250,
			"since": 24,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"feature": {
			"name": "feature",
			"id": 1251,
			"since": 24,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "25"
}

export function createDisabledFeature(): DisabledFeature {
	return create(_TypeModel)
}
