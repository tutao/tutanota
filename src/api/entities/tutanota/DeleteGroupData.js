// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DeleteGroupDataTypeRef: TypeRef<DeleteGroupData> = new TypeRef("tutanota", "DeleteGroupData")
export const _TypeModel: TypeModel = {
	"name": "DeleteGroupData",
	"since": 19,
	"type": "DATA_TRANSFER_TYPE",
	"id": 714,
	"rootId": "CHR1dGFub3RhAALK",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 715, "since": 19, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"restore": {"name": "restore", "id": 716, "since": 19, "type": "Boolean", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 717,
			"since": 19,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createDeleteGroupData(): DeleteGroupData {
	return create(_TypeModel, DeleteGroupDataTypeRef)
}
