// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileDataReturnPostTypeRef: TypeRef<FileDataReturnPost> = new TypeRef("tutanota", "FileDataReturnPost")
export const _TypeModel: TypeModel = {
	"name": "FileDataReturnPost",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 342,
	"rootId": "CHR1dGFub3RhAAFW",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 343,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"fileData": {
			"name": "fileData",
			"id": 344,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "FileData",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createFileDataReturnPost(values?: $Shape<$Exact<FileDataReturnPost>>): FileDataReturnPost {
	return Object.assign(create(_TypeModel, FileDataReturnPostTypeRef), values)
}
