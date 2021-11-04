// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {BlobAccessInfo} from "../sys/BlobAccessInfo"

export const BlobAccessTokenReturnTypeRef: TypeRef<BlobAccessTokenReturn> = new TypeRef("storage", "BlobAccessTokenReturn")
export const _TypeModel: TypeModel = {
	"name": "BlobAccessTokenReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 81,
	"rootId": "B3N0b3JhZ2UAUQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 82,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"blobAccessInfo": {
			"id": 83,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "BlobAccessInfo",
			"dependency": "sys"
		}
	},
	"app": "storage",
	"version": "1"
}

export function createBlobAccessTokenReturn(values?: $Shape<$Exact<BlobAccessTokenReturn>>): BlobAccessTokenReturn {
	return Object.assign(create(_TypeModel, BlobAccessTokenReturnTypeRef), values)
}

export type BlobAccessTokenReturn = {
	_type: TypeRef<BlobAccessTokenReturn>;

	_format: NumberString;

	blobAccessInfo: BlobAccessInfo;
}