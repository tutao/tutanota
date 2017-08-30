// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const BrandingThemeTypeRef: TypeRef<BrandingTheme> = new TypeRef("sys", "BrandingTheme")
export const _TypeModel: TypeModel = {
	"name": "BrandingTheme",
	"since": 22,
	"type": "ELEMENT_TYPE",
	"id": 1127,
	"rootId": "A3N5cwAEZw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1131,
			"since": 22,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1129,
			"since": 22,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1132,
			"since": 22,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1130,
			"since": 22,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"jsonTheme": {
			"name": "jsonTheme",
			"id": 1133,
			"since": 22,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"disabledFeatures": {
			"name": "disabledFeatures",
			"since": 24,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "DisabledFeature",
			"final": false
		}
	},
	"app": "sys",
	"version": "24"
}

export function createBrandingTheme(): BrandingTheme {
	return create(_TypeModel)
}
