import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 32,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 30,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 582,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 581,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 31,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"files": {
			"id": 35,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createFileSystem(values?: Partial<FileSystem>): FileSystem {
	return Object.assign(create(_TypeModel, FileSystemTypeRef), downcast<FileSystem>(values))
}

export type FileSystem = {
	_type: TypeRef<FileSystem>;
	_errors: Object;

	_format: NumberString;
	_id: Id;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;

	files: Id;
}