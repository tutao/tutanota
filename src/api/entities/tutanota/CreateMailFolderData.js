// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const CreateMailFolderDataTypeRef: TypeRef<CreateMailFolderData> = new TypeRef("tutanota", "CreateMailFolderData")
export const _TypeModel: TypeModel = {
	"name": "CreateMailFolderData",
	"since": 7,
	"type": "DATA_TRANSFER_TYPE",
	"id": 450,
	"rootId": "CHR1dGFub3RhAAHC",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 451,
			"since": 7,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"folderName": {
			"name": "folderName",
			"id": 453,
			"since": 7,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"ownerEncSessionKey": {
			"name": "ownerEncSessionKey",
			"id": 454,
			"since": 7,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"parentFolder": {
			"name": "parentFolder",
			"id": 452,
			"since": 7,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "MailFolder",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createCreateMailFolderData(values?: $Shape<$Exact<CreateMailFolderData>>): CreateMailFolderData {
	return Object.assign(create(_TypeModel, CreateMailFolderDataTypeRef), values)
}
