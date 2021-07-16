// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {BlobId} from "../sys/BlobId"

export const BlobServiceGetDataTypeRef: TypeRef<BlobServiceGetData> = new TypeRef("storage", "BlobServiceGetData")
export const _TypeModel: TypeModel = {
	"name": "BlobServiceGetData",
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
		"blobIds": {
			"id": 53,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "BlobId",
			"dependency": "sys"
		}
	},
	"app": "storage",
	"version": "1"
}

export function createBlobServiceGetData(values?: $Shape<$Exact<BlobServiceGetData>>): BlobServiceGetData {
	return Object.assign(create(_TypeModel, BlobServiceGetDataTypeRef), values)
}

export type BlobServiceGetData = {
	_type: TypeRef<BlobServiceGetData>;

	_format: NumberString;
	archiveId: Id;

	blobIds: BlobId[];
}