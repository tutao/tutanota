// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileDataDataPostTypeRef: TypeRef<FileDataDataPost> = new TypeRef("tutanota", "FileDataDataPost")
export const _TypeModel: TypeModel = {
	"name": "FileDataDataPost",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 335,
	"rootId": "CHR1dGFub3RhAAFP",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 336,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"group": {"name": "group", "id": 337, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": false, "encrypted": false},
		"size": {"name": "size", "id": 338, "since": 1, "type": "Number", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "36"
}

export function createFileDataDataPost(values?: $Shape<$Exact<FileDataDataPost>>): FileDataDataPost {
	return Object.assign(create(_TypeModel, FileDataDataPostTypeRef), values)
}
