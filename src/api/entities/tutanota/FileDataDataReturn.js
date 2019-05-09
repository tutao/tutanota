// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileDataDataReturnTypeRef: TypeRef<FileDataDataReturn> = new TypeRef("tutanota", "FileDataDataReturn")
export const _TypeModel: TypeModel = {
	"name": "FileDataDataReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 340,
	"rootId": "CHR1dGFub3RhAAFU",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 341, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"size": {"name": "size", "id": 342, "since": 1, "type": "Number", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {},
	"app": "tutanota",
	"version": "31"
}

export function createFileDataDataReturn(): FileDataDataReturn {
	return create(_TypeModel, FileDataDataReturnTypeRef)
}
