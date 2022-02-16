import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {TypeInfo} from "../sys/TypeInfo.js"

export const BlobReferenceDataPutTypeRef: TypeRef<BlobReferenceDataPut> = new TypeRef("storage", "BlobReferenceDataPut")
export const _TypeModel: TypeModel = {
	"name": "BlobReferenceDataPut",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 94,
	"rootId": "B3N0b3JhZ2UAXg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 95,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"blobReferenceToken": {
			"id": 96,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"field": {
			"id": 108,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceElementId": {
			"id": 107,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"instanceListElementId": {
			"id": 98,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"instanceListId": {
			"id": 97,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"type": {
			"id": 99,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": true,
			"refType": "TypeInfo",
			"dependency": "sys"
		}
	},
	"app": "storage",
	"version": "3"
}

export function createBlobReferenceDataPut(values?: Partial<BlobReferenceDataPut>): BlobReferenceDataPut {
	return Object.assign(create(_TypeModel, BlobReferenceDataPutTypeRef), downcast<BlobReferenceDataPut>(values))
}

export type BlobReferenceDataPut = {
	_type: TypeRef<BlobReferenceDataPut>;

	_format: NumberString;
	blobReferenceToken: Uint8Array;
	field: string;
	instanceElementId: null | Id;
	instanceListElementId: null | Id;
	instanceListId: null | Id;

	type: TypeInfo;
}