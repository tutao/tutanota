import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 451,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"folderName": {
			"id": 453,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"ownerEncSessionKey": {
			"id": 454,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"parentFolder": {
			"id": 452,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "MailFolder",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createCreateMailFolderData(values?: Partial<CreateMailFolderData>): CreateMailFolderData {
	return Object.assign(create(_TypeModel, CreateMailFolderDataTypeRef), downcast<CreateMailFolderData>(values))
}

export type CreateMailFolderData = {
	_type: TypeRef<CreateMailFolderData>;
	_errors: Object;

	_format: NumberString;
	folderName: string;
	ownerEncSessionKey: Uint8Array;

	parentFolder: IdTuple;
}