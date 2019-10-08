// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileSystemTypeRef: TypeRef<FileSystem> = new TypeRef("tutanota", "FileSystem")
export const _TypeModel: TypeModel = {
	"name": "FileSystem",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 28,
	"rootId": "CHR1dGFub3RhABw",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"name": "_format",
			"id": 32,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 30, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 582,
			"since": 13,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 581,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 31,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"files": {
			"name": "files",
			"id": 35,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createFileSystem(values?: $Shape<$Exact<FileSystem>>): FileSystem {
	return Object.assign(create(_TypeModel, FileSystemTypeRef), values)
}
