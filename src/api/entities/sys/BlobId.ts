import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BlobIdTypeRef: TypeRef<BlobId> = new TypeRef("sys", "BlobId")
export const _TypeModel: TypeModel = {
	"name": "BlobId",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1886,
	"rootId": "A3N5cwAHXg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1887,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"blobId": {
			"id": 1907,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "72"
}

export function createBlobId(values?: Partial<BlobId>): BlobId {
	return Object.assign(create(_TypeModel, BlobIdTypeRef), downcast<BlobId>(values))
}

export type BlobId = {
	_type: TypeRef<BlobId>;

	_id: Id;
	blobId: Id;
}