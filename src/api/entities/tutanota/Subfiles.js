// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const SubfilesTypeRef: TypeRef<Subfiles> = new TypeRef("tutanota", "Subfiles")
export const _TypeModel: TypeModel = {
	"name": "Subfiles",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 11,
	"rootId": "CHR1dGFub3RhAAs",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 12,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"files": {
			"id": 27,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createSubfiles(values?: $Shape<$Exact<Subfiles>>): Subfiles {
	return Object.assign(create(_TypeModel, SubfilesTypeRef), values)
}

export type Subfiles = {
	_type: TypeRef<Subfiles>;

	_id: Id;

	files: Id;
}