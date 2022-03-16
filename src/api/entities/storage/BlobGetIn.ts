import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BlobGetInTypeRef: TypeRef<BlobGetIn> = new TypeRef("storage", "BlobGetIn")
export const _TypeModel: TypeModel = {
	"name": "BlobGetIn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 50,
	"rootId": "B3N0b3JhZ2UAMg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 51,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"archiveId": {
			"id": 52,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"blobId": {
			"id": 110,
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

export function createBlobGetIn(values?: Partial<BlobGetIn>): BlobGetIn {
	return Object.assign(create(_TypeModel, BlobGetInTypeRef), downcast<BlobGetIn>(values))
}

export type BlobGetIn = {
	_type: TypeRef<BlobGetIn>;

	_format: NumberString;
	archiveId: Id;
	blobId: Id;
}