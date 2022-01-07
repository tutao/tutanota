import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const CreateMailFolderReturnTypeRef: TypeRef<CreateMailFolderReturn> = new TypeRef("tutanota", "CreateMailFolderReturn")
export const _TypeModel: TypeModel = {
	"name": "CreateMailFolderReturn",
	"since": 7,
	"type": "DATA_TRANSFER_TYPE",
	"id": 455,
	"rootId": "CHR1dGFub3RhAAHH",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 456,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"newFolder": {
			"id": 457,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "MailFolder"
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createCreateMailFolderReturn(values?: Partial<CreateMailFolderReturn>): CreateMailFolderReturn {
	return Object.assign(create(_TypeModel, CreateMailFolderReturnTypeRef), downcast<CreateMailFolderReturn>(values))
}

export type CreateMailFolderReturn = {
	_type: TypeRef<CreateMailFolderReturn>;
	_errors: Object;

	_format: NumberString;

	newFolder: IdTuple;
}