// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
		"_id": {
			"id": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"blockData": {
			"id": 3,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"size": {
			"id": 2,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "46"
}

export function createDataBlock(values?: $Shape<$Exact<DataBlock>>): DataBlock {
	return Object.assign(create(_TypeModel, DataBlockTypeRef), values)
}

export type DataBlock = {
	_type: TypeRef<DataBlock>;

	_id: Id;
	blockData: Id;
	size: NumberString;
}