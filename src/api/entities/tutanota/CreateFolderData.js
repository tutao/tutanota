// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateFolderDataTypeRef: TypeRef<CreateFolderData> = new TypeRef("tutanota", "CreateFolderData")
export const _TypeModel: TypeModel = {
	"name": "CreateFolderData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 358,
	"rootId": "CHR1dGFub3RhAAFm",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 359,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"fileName": {
			"name": "fileName",
			"id": 360,
			"since": 1,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"group": {
			"name": "group",
			"id": 361,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncSessionKey": {
			"name": "ownerEncSessionKey",
			"id": 363,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"symEncSessionKey": {
			"name": "symEncSessionKey",
			"id": 362,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"parentFolder": {
			"name": "parentFolder",
			"id": 364,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "28"
}

export function createCreateFolderData(): CreateFolderData {
	return create(_TypeModel)
}
