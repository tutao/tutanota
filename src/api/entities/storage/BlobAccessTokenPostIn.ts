import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {BlobReadData} from "./BlobReadData.js"
import type {BlobWriteData} from "./BlobWriteData.js"

export const BlobAccessTokenPostInTypeRef: TypeRef<BlobAccessTokenPostIn> = new TypeRef("storage", "BlobAccessTokenPostIn")
export const _TypeModel: TypeModel = {
	"name": "BlobAccessTokenPostIn",
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
		"archiveDataType": {
			"id": 180,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"read": {
			"id": 181,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "BlobReadData",
			"dependency": null
		},
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
	"version": "4"
}

export function createBlobAccessTokenPostIn(values?: Partial<BlobAccessTokenPostIn>): BlobAccessTokenPostIn {
	return Object.assign(create(_TypeModel, BlobAccessTokenPostInTypeRef), downcast<BlobAccessTokenPostIn>(values))
}

export type BlobAccessTokenPostIn = {
	_type: TypeRef<BlobAccessTokenPostIn>;

	_format: NumberString;
	archiveDataType: NumberString;

	read:  null | BlobReadData;
	write:  null | BlobWriteData;
}