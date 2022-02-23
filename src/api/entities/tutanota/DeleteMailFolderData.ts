import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 459,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"folders": {
			"id": 460,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "Any",
			"final": false,
			"refType": "MailFolder"
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createDeleteMailFolderData(values?: Partial<DeleteMailFolderData>): DeleteMailFolderData {
	return Object.assign(create(_TypeModel, DeleteMailFolderDataTypeRef), downcast<DeleteMailFolderData>(values))
}

export type DeleteMailFolderData = {
	_type: TypeRef<DeleteMailFolderData>;
	_errors: Object;

	_format: NumberString;

	folders: IdTuple[];
}