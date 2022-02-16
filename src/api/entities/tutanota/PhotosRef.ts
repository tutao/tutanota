import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const PhotosRefTypeRef: TypeRef<PhotosRef> = new TypeRef("tutanota", "PhotosRef")
export const _TypeModel: TypeModel = {
	"name": "PhotosRef",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 853,
	"rootId": "CHR1dGFub3RhAANV",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 854,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"files": {
			"id": 855,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "File"
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createPhotosRef(values?: Partial<PhotosRef>): PhotosRef {
	return Object.assign(create(_TypeModel, PhotosRefTypeRef), downcast<PhotosRef>(values))
}

export type PhotosRef = {
	_type: TypeRef<PhotosRef>;

	_id: Id;

	files: Id;
}