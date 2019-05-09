// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileDataDataGetTypeRef: TypeRef<FileDataDataGet> = new TypeRef("tutanota", "FileDataDataGet")
export const _TypeModel: TypeModel = {
	"name": "FileDataDataGet",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 332,
	"rootId": "CHR1dGFub3RhAAFM",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 333, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"base64": {"name": "base64", "id": 334, "since": 1, "type": "Boolean", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"file": {
			"name": "file",
			"id": 335,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createFileDataDataGet(): FileDataDataGet {
	return create(_TypeModel, FileDataDataGetTypeRef)
}
