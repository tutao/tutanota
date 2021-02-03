// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const DeleteMailDataTypeRef: TypeRef<DeleteMailData> = new TypeRef("tutanota", "DeleteMailData")
export const _TypeModel: TypeModel = {
	"name": "DeleteMailData",
	"since": 5,
	"type": "DATA_TRANSFER_TYPE",
	"id": 419,
	"rootId": "CHR1dGFub3RhAAGj",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 420,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"folder": {
			"id": 724,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "MailFolder"
		},
		"mails": {
			"id": 421,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "Mail"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createDeleteMailData(values?: $Shape<$Exact<DeleteMailData>>): DeleteMailData {
	return Object.assign(create(_TypeModel, DeleteMailDataTypeRef), values)
}

export type DeleteMailData = {
	_type: TypeRef<DeleteMailData>;

	_format: NumberString;

	folder: ?IdTuple;
	mails: IdTuple[];
}