// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const FileTypeRef: TypeRef<File> = new TypeRef("sys", "File")
export const _TypeModel: TypeModel = {
	"name": "File",
	"since": 11,
	"type": "AGGREGATED_TYPE",
	"id": 917,
	"rootId": "A3N5cwADlQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 918,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"data": {
			"id": 921,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mimeType": {
			"id": 920,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"name": {
			"id": 919,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createFile(values?: $Shape<$Exact<File>>): File {
	return Object.assign(create(_TypeModel, FileTypeRef), values)
}

export type File = {
	_type: TypeRef<File>;

	_id: Id;
	data: Uint8Array;
	mimeType: string;
	name: string;
}