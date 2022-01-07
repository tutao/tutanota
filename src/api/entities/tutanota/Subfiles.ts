import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
	"version": "49"
}

export function createSubfiles(values?: Partial<Subfiles>): Subfiles {
	return Object.assign(create(_TypeModel, SubfilesTypeRef), downcast<Subfiles>(values))
}

export type Subfiles = {
	_type: TypeRef<Subfiles>;

	_id: Id;

	files: Id;
}