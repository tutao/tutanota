// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const DeleteFileDataTypeRef: TypeRef<DeleteFileData> = new TypeRef("tutanota", "DeleteFileData")
export const _TypeModel: TypeModel = {
	"name": "DeleteFileData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 374,
	"rootId": "CHR1dGFub3RhAAF2",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 375,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"file": {
			"name": "file",
			"id": 377,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "27"
}

export function createDeleteFileData(): DeleteFileData {
	return create(_TypeModel)
}
