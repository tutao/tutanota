import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BlobTypeRef: TypeRef<Blob> = new TypeRef("sys", "Blob")
export const _TypeModel: TypeModel = {
	"name": "Blob",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1882,
	"rootId": "A3N5cwAHWg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1883,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"archiveId": {
			"id": 1884,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"blobId": {
			"id": 1906,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"size": {
			"id": 1898,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "74"
}

export function createBlob(values?: Partial<Blob>): Blob {
	return Object.assign(create(_TypeModel, BlobTypeRef), downcast<Blob>(values))
}

export type Blob = {
	_type: TypeRef<Blob>;

	_id: Id;
	archiveId: Id;
	blobId: Id;
	size: NumberString;
}