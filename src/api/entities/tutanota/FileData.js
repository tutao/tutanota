// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileDataTypeRef: TypeRef<FileData> = new TypeRef("tutanota", "FileData")
export const _TypeModel: TypeModel = {
	"name": "FileData",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 4,
	"rootId": "CHR1dGFub3RhAAQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 8,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 6, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 579,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 7,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"size": {"name": "size", "id": 9, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"unreferenced": {
			"name": "unreferenced",
			"id": 409,
			"since": 2,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"blocks": {
			"name": "blocks",
			"id": 10,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "DataBlock",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createFileData(values?: $Shape<$Exact<FileData>>): FileData {
	return Object.assign(create(_TypeModel, FileDataTypeRef), values)
}
