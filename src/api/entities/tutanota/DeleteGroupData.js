// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const DeleteGroupDataTypeRef: TypeRef<DeleteGroupData> = new TypeRef("tutanota", "DeleteGroupData")
export const _TypeModel: TypeModel = {
	"name": "DeleteGroupData",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 713,
	"rootId": "CHR1dGFub3RhAALJ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 714,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"restore": {
			"id": 715,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 716,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createDeleteGroupData(values?: $Shape<$Exact<DeleteGroupData>>): DeleteGroupData {
	return Object.assign(create(_TypeModel, DeleteGroupDataTypeRef), values)
}

export type DeleteGroupData = {
	_type: TypeRef<DeleteGroupData>;

	_format: NumberString;
	restore: boolean;

	group: Id;
}