// @flow

import {create} from "../../common/utils/EntityUtils"

import type {Subfiles} from "./Subfiles"
import {TypeRef} from "../../common/utils/TypeRef";

export const FileTypeRef: TypeRef<File> = new TypeRef("tutanota", "File")
export const _TypeModel: TypeModel = {
	"name": "File",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 13,
	"rootId": "CHR1dGFub3RhAA0",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_area": {
			"id": 20,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_format": {
			"id": 17,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 15,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_owner": {
			"id": 19,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 18,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 580,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 16,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"cid": {
			"id": 924,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"mimeType": {
			"id": 23,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": true
		},
		"name": {
			"id": 21,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"size": {
			"id": 22,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"subFiles": {
			"id": 26,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Subfiles"
		},
		"data": {
			"id": 24,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "FileData"
		},
		"parent": {
			"id": 25,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createFile(values?: $Shape<$Exact<File>>): File {
	return Object.assign(create(_TypeModel, FileTypeRef), values)
}

export type File = {
	_type: TypeRef<File>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	cid: ?string;
	mimeType: ?string;
	name: string;
	size: NumberString;

	subFiles: ?Subfiles;
	data: ?Id;
	parent: ?IdTuple;
}