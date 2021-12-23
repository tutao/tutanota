import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


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
			"id": 1888,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "71"
}

export function createBlobId(values?: Partial<BlobId>): BlobId {
	return Object.assign(create(_TypeModel, BlobIdTypeRef), downcast<BlobId>(values))
}

export type BlobId = {
	_type: TypeRef<BlobId>;

	_id: Id;
	blobId: Uint8Array;
}