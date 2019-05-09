// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileDataReturnPostTypeRef: TypeRef<FileDataReturnPost> = new TypeRef("tutanota", "FileDataReturnPost")
export const _TypeModel: TypeModel = {
	"name": "FileDataReturnPost",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 343,
	"rootId": "CHR1dGFub3RhAAFX",
	"versioned": false,
	"encrypted": true,
	"values": {"_format": {"name": "_format", "id": 344, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}},
	"associations": {
		"fileData": {
			"name": "fileData",
			"id": 345,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "FileData",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createFileDataReturnPost(): FileDataReturnPost {
	return create(_TypeModel, FileDataReturnPostTypeRef)
}
