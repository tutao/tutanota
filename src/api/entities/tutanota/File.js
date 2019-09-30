// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const FileTypeRef: TypeRef<TutanotaFile> = new TypeRef("tutanota", "File")
export const _TypeModel: TypeModel = {
	"name": "File",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 13,
	"rootId": "CHR1dGFub3RhAA0",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_area": {"name": "_area", "id": 20, "since": 1, "type": "Number", "cardinality": "One", "final": true, "encrypted": false},
		"_format": {"name": "_format", "id": 17, "since": 1, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 15, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_owner": {"name": "_owner", "id": 19, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 18,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 580,
			"since": 13,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 16,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"cid": {"name": "cid", "id": 924, "since": 32, "type": "String", "cardinality": "ZeroOrOne", "final": true, "encrypted": true},
		"mimeType": {
			"name": "mimeType",
			"id": 23,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"name": {"name": "name", "id": 21, "since": 1, "type": "String", "cardinality": "One", "final": false, "encrypted": true},
		"size": {"name": "size", "id": 22, "since": 1, "type": "Number", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {
		"subFiles": {
			"name": "subFiles",
			"id": 26,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "Subfiles",
			"final": true
		},
		"data": {
			"name": "data",
			"id": 24,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "FileData",
			"final": true,
			"external": false
		},
		"parent": {
			"name": "parent",
			"id": 25,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "36"
}

export function createFile(values?: $Shape<$Exact<TutanotaFile>>): TutanotaFile {
	return Object.assign(create(_TypeModel, FileTypeRef), values)
}
