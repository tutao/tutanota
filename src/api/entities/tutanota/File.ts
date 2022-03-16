import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {Blob} from "../sys/Blob.js"
import type {Subfiles} from "./Subfiles.js"

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
		"blobs": {
			"id": 1225,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "Blob",
			"dependency": "sys"
		},
		"data": {
			"id": 24,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "FileData",
			"dependency": null
		},
		"parent": {
			"id": 25,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "File",
			"dependency": null
		},
		"subFiles": {
			"id": 26,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Subfiles",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createFile(values?: Partial<File>): File {
	return Object.assign(create(_TypeModel, FileTypeRef), downcast<File>(values))
}

export type File = {
	_type: TypeRef<File>;
	_errors: Object;

	_area: NumberString;
	_format: NumberString;
	_id: IdTuple;
	_owner: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	cid: null | string;
	mimeType: null | string;
	name: string;
	size: NumberString;

	blobs: Blob[];
	data:  null | Id;
	parent:  null | IdTuple;
	subFiles:  null | Subfiles;
}