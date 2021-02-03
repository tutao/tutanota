// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


export const FileDataDataReturnTypeRef: TypeRef<FileDataDataReturn> = new TypeRef("tutanota", "FileDataDataReturn")
export const _TypeModel: TypeModel = {
	"name": "FileDataDataReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 339,
	"rootId": "CHR1dGFub3RhAAFT",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 340,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"size": {
			"id": 341,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "44"
}

export function createFileDataDataReturn(values?: $Shape<$Exact<FileDataDataReturn>>): FileDataDataReturn {
	return Object.assign(create(_TypeModel, FileDataDataReturnTypeRef), values)
}

export type FileDataDataReturn = {
	_type: TypeRef<FileDataDataReturn>;
	_errors: Object;

	_format: NumberString;
	size: NumberString;
}