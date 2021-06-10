// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"refType": "MailFolder"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createCreateMailFolderData(values?: $Shape<$Exact<CreateMailFolderData>>): CreateMailFolderData {
	return Object.assign(create(_TypeModel, CreateMailFolderDataTypeRef), values)
}

export type CreateMailFolderData = {
	_type: TypeRef<CreateMailFolderData>;
	_errors: Object;

	_format: NumberString;
	folderName: string;
	ownerEncSessionKey: Uint8Array;

	parentFolder: IdTuple;
}