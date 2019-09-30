// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileDataDataGetTypeRef: TypeRef<FileDataDataGet> = new TypeRef("tutanota", "FileDataDataGet")
export const _TypeModel: TypeModel = {
	"name": "FileDataDataGet",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 331,
	"rootId": "CHR1dGFub3RhAAFL",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 332,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}, "base64": {"name": "base64", "id": 333, "since": 1, "type": "Boolean", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"file": {
			"name": "file",
			"id": 334,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createFileDataDataGet(values?: $Shape<$Exact<FileDataDataGet>>): FileDataDataGet {
	return Object.assign(create(_TypeModel, FileDataDataGetTypeRef), values)
}
