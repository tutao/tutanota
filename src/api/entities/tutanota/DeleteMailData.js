// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const DeleteMailDataTypeRef: TypeRef<DeleteMailData> = new TypeRef("tutanota", "DeleteMailData")
export const _TypeModel: TypeModel = {
	"name": "DeleteMailData",
	"since": 5,
	"type": "DATA_TRANSFER_TYPE",
	"id": 420,
	"rootId": "CHR1dGFub3RhAAGk",
	"versioned": false,
	"encrypted": false,
	"values": {"_format": {"name": "_format", "id": 421, "since": 5, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}},
	"associations": {
		"folder": {
			"name": "folder",
			"id": 725,
			"since": 19,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "MailFolder",
			"final": true,
			"external": false
		},
		"mails": {
			"name": "mails",
			"id": 422,
			"since": 5,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "Mail",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createDeleteMailData(): DeleteMailData {
	return create(_TypeModel, DeleteMailDataTypeRef)
}
