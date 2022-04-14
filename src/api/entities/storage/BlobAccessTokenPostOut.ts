import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {BlobServerAccessInfo} from "./BlobServerAccessInfo.js"

export const BlobAccessTokenPostOutTypeRef: TypeRef<BlobAccessTokenPostOut> = new TypeRef("storage", "BlobAccessTokenPostOut")
export const _TypeModel: TypeModel = {
	"name": "BlobAccessTokenPostOut",
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
			"id": 161,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "BlobServerAccessInfo",
			"dependency": null
		}
	},
	"app": "storage",
	"version": "4"
}

export function createBlobAccessTokenPostOut(values?: Partial<BlobAccessTokenPostOut>): BlobAccessTokenPostOut {
	return Object.assign(create(_TypeModel, BlobAccessTokenPostOutTypeRef), downcast<BlobAccessTokenPostOut>(values))
}

export type BlobAccessTokenPostOut = {
	_type: TypeRef<BlobAccessTokenPostOut>;

	_format: NumberString;

	blobAccessInfo: BlobServerAccessInfo;
}