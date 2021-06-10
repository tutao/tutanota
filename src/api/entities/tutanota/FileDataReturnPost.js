// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"refType": "FileData"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createFileDataReturnPost(values?: $Shape<$Exact<FileDataReturnPost>>): FileDataReturnPost {
	return Object.assign(create(_TypeModel, FileDataReturnPostTypeRef), values)
}

export type FileDataReturnPost = {
	_type: TypeRef<FileDataReturnPost>;
	_errors: Object;

	_format: NumberString;

	fileData: Id;
}