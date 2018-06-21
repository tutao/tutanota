// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

export const FileTypeRef: TypeRef<SysFile> = new TypeRef("sys", "File")
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
			"name": "_id",
			"id": 918,
			"since": 11,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"data": {
			"name": "data",
			"id": 921,
			"since": 11,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"mimeType": {
			"name": "mimeType",
			"id": 920,
			"since": 11,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"name": {
			"name": "name",
			"id": 919,
			"since": 11,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "32"
}

export function createFile(): SysFile {
	return create(_TypeModel)
}
