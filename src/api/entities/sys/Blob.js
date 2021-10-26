// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"


export const BlobTypeRef: TypeRef<Blob> = new TypeRef("sys", "Blob")
export const _TypeModel: TypeModel = {
	"name": "Blob",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1882,
	"rootId": "A3N5cwAHWg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1883,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"archiveId": {
			"id": 1884,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"blobId": {
			"id": 1885,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "sys",
	"version": "69"
}

export function createBlob(values?: $Shape<$Exact<Blob>>): Blob {
	return Object.assign(create(_TypeModel, BlobTypeRef), values)
}

export type Blob = {
	_type: TypeRef<Blob>;

	_id: Id;
	archiveId: Id;
	blobId: Uint8Array;
}