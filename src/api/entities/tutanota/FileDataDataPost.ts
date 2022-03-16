import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const FileDataDataPostTypeRef: TypeRef<FileDataDataPost> = new TypeRef("tutanota", "FileDataDataPost")
export const _TypeModel: TypeModel = {
	"name": "FileDataDataPost",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 335,
	"rootId": "CHR1dGFub3RhAAFP",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 336,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"group": {
			"id": 337,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"size": {
			"id": 338,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "tutanota",
	"version": "52"
}

export function createFileDataDataPost(values?: Partial<FileDataDataPost>): FileDataDataPost {
	return Object.assign(create(_TypeModel, FileDataDataPostTypeRef), downcast<FileDataDataPost>(values))
}

export type FileDataDataPost = {
	_type: TypeRef<FileDataDataPost>;
	_errors: Object;

	_format: NumberString;
	group: Id;
	size: NumberString;
}