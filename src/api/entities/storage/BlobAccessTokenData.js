// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {BlobWriteData} from "./BlobWriteData"

export const BlobAccessTokenDataTypeRef: TypeRef<BlobAccessTokenData> = new TypeRef("storage", "BlobAccessTokenData")
export const _TypeModel: TypeModel = {
	"name": "BlobAccessTokenData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 77,
	"rootId": "B3N0b3JhZ2UATQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 78,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"readArchiveId": {
			"id": 79,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"write": {
			"id": 80,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "BlobWriteData",
			"dependency": null
		}
	},
	"app": "storage",
	"version": "1"
}

export function createBlobAccessTokenData(values?: $Shape<$Exact<BlobAccessTokenData>>): BlobAccessTokenData {
	return Object.assign(create(_TypeModel, BlobAccessTokenDataTypeRef), values)
}

export type BlobAccessTokenData = {
	_type: TypeRef<BlobAccessTokenData>;

	_format: NumberString;
	readArchiveId: ?Id;

	write: ?BlobWriteData;
}