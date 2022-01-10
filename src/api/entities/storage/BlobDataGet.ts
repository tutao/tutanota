import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {BlobId} from "../sys/BlobId.js"

export const BlobDataGetTypeRef: TypeRef<BlobDataGet> = new TypeRef("storage", "BlobDataGet")
export const _TypeModel: TypeModel = {
	"name": "BlobDataGet",
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
		}
	},
	"associations": {
		"blobId": {
			"id": 53,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": true,
			"refType": "BlobId",
			"dependency": "sys"
		}
	},
	"app": "storage",
	"version": "2"
}

export function createBlobDataGet(values?: Partial<BlobDataGet>): BlobDataGet {
	return Object.assign(create(_TypeModel, BlobDataGetTypeRef), downcast<BlobDataGet>(values))
}

export type BlobDataGet = {
	_type: TypeRef<BlobDataGet>;

	_format: NumberString;
	archiveId: Id;

	blobId: BlobId;
}