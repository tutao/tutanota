import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const FileDataReturnPostTypeRef: TypeRef<FileDataReturnPost> = new TypeRef("tutanota", "FileDataReturnPost")
export const _TypeModel: TypeModel = {
	"name": "FileDataReturnPost",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 342,
	"rootId": "CHR1dGFub3RhAAFW",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 343,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"fileData": {
			"id": 344,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "FileData",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "52"
}

export function createFileDataReturnPost(values?: Partial<FileDataReturnPost>): FileDataReturnPost {
	return Object.assign(create(_TypeModel, FileDataReturnPostTypeRef), downcast<FileDataReturnPost>(values))
}

export type FileDataReturnPost = {
	_type: TypeRef<FileDataReturnPost>;
	_errors: Object;

	_format: NumberString;

	fileData: Id;
}