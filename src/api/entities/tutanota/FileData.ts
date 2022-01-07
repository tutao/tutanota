import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {Blob} from "../sys/Blob"
import type {DataBlock} from "./DataBlock"

export const FileDataTypeRef: TypeRef<FileData> = new TypeRef("tutanota", "FileData")
export const _TypeModel: TypeModel = {
	"name": "FileData",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 4,
	"rootId": "CHR1dGFub3RhAAQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 8,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 6,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 579,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 7,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"size": {
			"id": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"unreferenced": {
			"id": 409,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"blobs": {
			"id": 1221,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "Blob",
			"dependency": "sys"
		},
		"blocks": {
			"id": 10,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "DataBlock",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "49"
}

export function createFileData(values?: Partial<FileData>): FileData {
	return Object.assign(create(_TypeModel, FileDataTypeRef), downcast<FileData>(values))
}

export type FileData = {
	_type: TypeRef<FileData>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	size: NumberString;
	unreferenced: boolean;

	blobs: Blob[];
	blocks: DataBlock[];
}