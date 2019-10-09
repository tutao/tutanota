// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const SharedGroupDataTypeRef: TypeRef<SharedGroupData> = new TypeRef("tutanota", "SharedGroupData")
export const _TypeModel: TypeModel = {
	"name": "SharedGroupData",
	"since": 37,
	"type": "AGGREGATED_TYPE",
	"id": 991,
	"rootId": "CHR1dGFub3RhAAPf",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 992, "since": 37, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"bucketEncGInfoKey": {
			"name": "bucketEncGInfoKey",
			"id": 995,
			"since": 37,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"bucketEncGKey": {
			"name": "bucketEncGKey",
			"id": 994,
			"since": 37,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"capability": {
			"name": "capability",
			"id": 993,
			"since": 37,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"group": {"name": "group", "id": 996, "since": 37, "type": "GeneratedId", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "37"
}

export function createSharedGroupData(values?: $Shape<$Exact<SharedGroupData>>): SharedGroupData {
	return Object.assign(create(_TypeModel, SharedGroupDataTypeRef), values)
}
