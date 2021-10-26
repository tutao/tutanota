// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {TypeInfo} from "../sys/TypeInfo"

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
		"instanceListElementId": {
			"id": 98,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceListId": {
			"id": 97,
			"type": "GeneratedId",
			"cardinality": "One",
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
	"version": "1"
}

export function createBlobReferenceDataPut(values?: $Shape<$Exact<BlobReferenceDataPut>>): BlobReferenceDataPut {
	return Object.assign(create(_TypeModel, BlobReferenceDataPutTypeRef), values)
}

export type BlobReferenceDataPut = {
	_type: TypeRef<BlobReferenceDataPut>;

	_format: NumberString;
	blobReferenceToken: Uint8Array;
	instanceListElementId: Id;
	instanceListId: Id;

	type: TypeInfo;
}