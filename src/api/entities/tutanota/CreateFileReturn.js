// @flow

import {create, TypeRef} from '../../common/EntityFunctions'

export const CreateFileReturnTypeRef: TypeRef<CreateFileReturn> = new TypeRef("tutanota", "CreateFileReturn")
export const _TypeModel: TypeModel = {
	"name": "CreateFileReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 354,
	"rootId": "CHR1dGFub3RhAAFi",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 355,
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
			"id": 356,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "23"
}

export function createCreateFileReturn(): CreateFileReturn {
	return create(_TypeModel)
}
