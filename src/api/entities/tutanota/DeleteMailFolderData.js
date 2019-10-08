// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DeleteMailFolderDataTypeRef: TypeRef<DeleteMailFolderData> = new TypeRef("tutanota", "DeleteMailFolderData")
export const _TypeModel: TypeModel = {
	"name": "DeleteMailFolderData",
	"since": 7,
	"type": "DATA_TRANSFER_TYPE",
	"id": 458,
	"rootId": "CHR1dGFub3RhAAHK",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 459,
			"since": 7,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"folders": {
			"name": "folders",
			"id": 460,
			"since": 7,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "MailFolder",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createDeleteMailFolderData(values?: $Shape<$Exact<DeleteMailFolderData>>): DeleteMailFolderData {
	return Object.assign(create(_TypeModel, DeleteMailFolderDataTypeRef), values)
}
