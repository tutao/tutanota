// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"id": 1309,
			"since": 28,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createBootstrapFeature(): BootstrapFeature {
	return create(_TypeModel)
}
