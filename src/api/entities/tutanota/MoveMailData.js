// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const MoveMailDataTypeRef: TypeRef<MoveMailData> = new TypeRef("tutanota", "MoveMailData")
export const _TypeModel: TypeModel = {
	"name": "MoveMailData",
	"since": 7,
	"type": "DATA_TRANSFER_TYPE",
	"id": 445,
	"rootId": "CHR1dGFub3RhAAG9",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 446,
			"since": 7,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"mails": {
			"name": "mails",
			"id": 448,
			"since": 7,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"refType": "Mail",
			"final": false,
			"external": false
		},
		"targetFolder": {
			"name": "targetFolder",
			"id": 447,
			"since": 7,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "MailFolder",
			"final": false,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createMoveMailData(values?: $Shape<$Exact<MoveMailData>>): MoveMailData {
	return Object.assign(create(_TypeModel, MoveMailDataTypeRef), values)
}
