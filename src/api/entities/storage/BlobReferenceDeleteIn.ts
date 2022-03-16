import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {Blob} from "../sys/Blob.js"

export const BlobReferenceDeleteInTypeRef: TypeRef<BlobReferenceDeleteIn> = new TypeRef("storage", "BlobReferenceDeleteIn")
export const _TypeModel: TypeModel = {
	"name": "BlobReferenceDeleteIn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 100,
	"rootId": "B3N0b3JhZ2UAZA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 101,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"archiveDataType": {
			"id": 124,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceId": {
			"id": 103,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceListId": {
			"id": 102,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"blobs": {
			"id": 105,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "Blob",
			"dependency": "sys"
		}
	},
	"app": "storage",
	"version": "4"
}

export function createBlobReferenceDeleteIn(values?: Partial<BlobReferenceDeleteIn>): BlobReferenceDeleteIn {
	return Object.assign(create(_TypeModel, BlobReferenceDeleteInTypeRef), downcast<BlobReferenceDeleteIn>(values))
}

export type BlobReferenceDeleteIn = {
	_type: TypeRef<BlobReferenceDeleteIn>;

	_format: NumberString;
	archiveDataType: NumberString;
	instanceId: Id;
	instanceListId: null | Id;

	blobs: Blob[];
}