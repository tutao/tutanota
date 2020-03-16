// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const NameTypeRef: TypeRef<Name> = new TypeRef("tutanota", "Name")
export const _TypeModel: TypeModel = {
	"name": "Name",
	"since": 19,
	"type": "AGGREGATED_TYPE",
	"id": 725,
	"rootId": "CHR1dGFub3RhAALV",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"name": "_id",
			"id": 726,
			"since": 19,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"name": {
			"name": "name",
			"id": 727,
			"since": 19,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "40"
}

export function createName(values?: $Shape<$Exact<Name>>): Name {
	return Object.assign(create(_TypeModel, NameTypeRef), values)
}
