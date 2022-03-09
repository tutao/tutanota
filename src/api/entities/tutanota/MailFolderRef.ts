import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "MailFolder",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createMailFolderRef(values?: Partial<MailFolderRef>): MailFolderRef {
	return Object.assign(create(_TypeModel, MailFolderRefTypeRef), downcast<MailFolderRef>(values))
}

export type MailFolderRef = {
	_type: TypeRef<MailFolderRef>;

	_id: Id;

	folders: Id;
}