// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MailFolderRefTypeRef: TypeRef<MailFolderRef> = new TypeRef("tutanota", "MailFolderRef")
export const _TypeModel: TypeModel = {
	"name": "MailFolderRef",
	"since": 7,
	"type": "AGGREGATED_TYPE",
	"id": 441,
	"rootId": "CHR1dGFub3RhAAG5",
	"versioned": false,
	"encrypted": false,
	"values": {"_id": {"name": "_id", "id": 442, "since": 7, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false}},
	"associations": {
		"folders": {
			"name": "folders",
			"id": 443,
			"since": 7,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "MailFolder",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createMailFolderRef(): MailFolderRef {
	return create(_TypeModel, MailFolderRefTypeRef)
}
