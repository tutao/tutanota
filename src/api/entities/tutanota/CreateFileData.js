// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const CreateFileDataTypeRef: TypeRef<CreateFileData> = new TypeRef("tutanota", "CreateFileData")
export const _TypeModel: TypeModel = {
	"name": "CreateFileData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 346,
	"rootId": "CHR1dGFub3RhAAFa",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 347,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"fileName": {
			"id": 348,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		},
		"group": {
			"id": 350,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncSessionKey": {
			"id": 351,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mimeType": {
			"id": 349,
			"type": "String",
			"cardinality": "One",
			"final": true,
			"encrypted": true
		}
	},
	"associations": {
		"fileData": {
			"id": 352,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "FileData"
		},
		"parentFolder": {
			"id": 353,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createCreateFileData(values?: $Shape<$Exact<CreateFileData>>): CreateFileData {
	return Object.assign(create(_TypeModel, CreateFileDataTypeRef), values)
}

export type CreateFileData = {
	_type: TypeRef<CreateFileData>;
	_errors: Object;

	_format: NumberString;
	fileName: string;
	group: Id;
	ownerEncSessionKey: Uint8Array;
	mimeType: string;

	fileData: Id;
	parentFolder: ?IdTuple;
}