import {create} from "../../common/utils/EntityUtils"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {Blob} from "../sys/Blob"
import type {TypeInfo} from "../sys/TypeInfo"

export const BlobReferenceDataDeleteTypeRef: TypeRef<BlobReferenceDataDelete> = new TypeRef("storage", "BlobReferenceDataDelete")
export const _TypeModel: TypeModel = {
	"name": "BlobReferenceDataDelete",
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
		"field": {
			"id": 109,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceListElementId": {
			"id": 103,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceListId": {
			"id": 102,
			"type": "GeneratedId",
			"cardinality": "One",
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
		},
		"type": {
			"id": 104,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": true,
			"refType": "TypeInfo",
			"dependency": "sys"
		}
	},
	"app": "storage",
	"version": "2"
}

export function createBlobReferenceDataDelete(values?: Partial<BlobReferenceDataDelete>): BlobReferenceDataDelete {
	return Object.assign(create(_TypeModel, BlobReferenceDataDeleteTypeRef), downcast<BlobReferenceDataDelete>(values))
}

export type BlobReferenceDataDelete = {
	_type: TypeRef<BlobReferenceDataDelete>;

	_format: NumberString;
	field: string;
	instanceListElementId: Id;
	instanceListId: Id;

	blobs: Blob[];
	type: TypeInfo;
}