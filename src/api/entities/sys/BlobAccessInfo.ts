import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {BlobId} from "./BlobId.js"
import type {TargetServer} from "./TargetServer.js"

export const BlobAccessInfoTypeRef: TypeRef<BlobAccessInfo> = new TypeRef("sys", "BlobAccessInfo")
export const _TypeModel: TypeModel = {
	"name": "BlobAccessInfo",
	"since": 69,
	"type": "AGGREGATED_TYPE",
	"id": 1892,
	"rootId": "A3N5cwAHZA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 1893,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"archiveId": {
			"id": 1897,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"storageAccessToken": {
			"id": 1894,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"blobIds": {
			"id": 1908,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "BlobId",
			"dependency": null
		},
		"servers": {
			"id": 1895,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "TargetServer",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "72"
}

export function createBlobAccessInfo(values?: Partial<BlobAccessInfo>): BlobAccessInfo {
	return Object.assign(create(_TypeModel, BlobAccessInfoTypeRef), downcast<BlobAccessInfo>(values))
}

export type BlobAccessInfo = {
	_type: TypeRef<BlobAccessInfo>;

	_id: Id;
	archiveId: Id;
	storageAccessToken: string;

	blobIds: BlobId[];
	servers: TargetServer[];
}