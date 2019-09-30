// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DataBlockTypeRef: TypeRef<DataBlock> = new TypeRef("tutanota", "DataBlock")
export const _TypeModel: TypeModel = {
	"name": "DataBlock",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 0,
	"rootId": "CHR1dGFub3RhAAA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {"name": "_id", "id": 1, "since": 1, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false},
		"blockData": {
			"name": "blockData",
			"id": 3,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"size": {"name": "size", "id": 2, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createDataBlock(values?: $Shape<$Exact<DataBlock>>): DataBlock {
	return Object.assign(create(_TypeModel, DataBlockTypeRef), values)
}
