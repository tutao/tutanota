// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const UpdateFileDataTypeRef: TypeRef<UpdateFileData> = new TypeRef("tutanota", "UpdateFileData")
export const _TypeModel: TypeModel = {
	"name": "UpdateFileData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 369,
	"rootId": "CHR1dGFub3RhAAFx",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 370,
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
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		},
		"fileData": {
			"name": "fileData",
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "FileData",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "21"
}

export function createUpdateFileData(): UpdateFileData {
	return create(_TypeModel)
}
