// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const PhotosRefTypeRef: TypeRef<PhotosRef> = new TypeRef("tutanota", "PhotosRef")
export const _TypeModel: TypeModel = {
	"name": "PhotosRef",
	"since": 23,
	"type": "AGGREGATED_TYPE",
	"id": 854,
	"rootId": "CHR1dGFub3RhAANW",
	"versioned": false,
	"encrypted": false,
	"values": {"_id": {"name": "_id", "id": 855, "since": 23, "type": "CustomId", "cardinality": "One", "final": true, "encrypted": false}},
	"associations": {
		"files": {
			"name": "files",
			"id": 856,
			"since": 23,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "File",
			"final": true,
			"external": false
		}
	},
	"app": "tutanota",
	"version": "31"
}

export function createPhotosRef(): PhotosRef {
	return create(_TypeModel, PhotosRefTypeRef)
}
