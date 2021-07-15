// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const MailFolderRefTypeRef: TypeRef<MailFolderRef> = new TypeRef("tutanota", "MailFolderRef")
export const _TypeModel: TypeModel = {
	"name": "MailFolderRef",
	"since": 7,
	"type": "AGGREGATED_TYPE",
	"id": 440,
	"rootId": "CHR1dGFub3RhAAG4",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 441,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"folders": {
			"id": 442,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailFolder"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createMailFolderRef(values?: $Shape<$Exact<MailFolderRef>>): MailFolderRef {
	return Object.assign(create(_TypeModel, MailFolderRefTypeRef), values)
}

export type MailFolderRef = {
	_type: TypeRef<MailFolderRef>;

	_id: Id;

	folders: Id;
}