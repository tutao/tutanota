// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateFolderReturnTypeRef: TypeRef<CreateFolderReturn> = new TypeRef("tutanota", "CreateFolderReturn")
export const _TypeModel: TypeModel = {
	"name": "CreateFolderReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 365,
	"rootId": "CHR1dGFub3RhAAFt",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 366,
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
			"id": 367,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "27"
}

export function createCreateFolderReturn(): CreateFolderReturn {
	return create(_TypeModel)
}
