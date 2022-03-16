import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BlobIdTypeRef: TypeRef<BlobId> = new TypeRef("storage", "BlobId")
export const _TypeModel: TypeModel = {
	"name": "BlobId",
	"since": 4,
	"type": "AGGREGATED_TYPE",
	"id": 144,
	"rootId": "B3N0b3JhZ2UAAJA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 145,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"blobId": {
			"id": 146,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "storage",
	"version": "4"
}

export function createBlobId(values?: Partial<BlobId>): BlobId {
	return Object.assign(create(_TypeModel, BlobIdTypeRef), downcast<BlobId>(values))
}

export type BlobId = {
	_type: TypeRef<BlobId>;

	_id: Id;
	blobId: Id;
}