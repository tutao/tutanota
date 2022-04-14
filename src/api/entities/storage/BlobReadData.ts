import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {InstanceId} from "./InstanceId.js"

export const BlobReadDataTypeRef: TypeRef<BlobReadData> = new TypeRef("storage", "BlobReadData")
export const _TypeModel: TypeModel = {
	"name": "BlobReadData",
	"since": 4,
	"type": "AGGREGATED_TYPE",
	"id": 175,
	"rootId": "B3N0b3JhZ2UAAK8",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 176,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"archiveId": {
			"id": 177,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"instanceListId": {
			"id": 178,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"instanceIds": {
			"id": 179,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "InstanceId",
			"dependency": null
		}
	},
	"app": "storage",
	"version": "4"
}

export function createBlobReadData(values?: Partial<BlobReadData>): BlobReadData {
	return Object.assign(create(_TypeModel, BlobReadDataTypeRef), downcast<BlobReadData>(values))
}

export type BlobReadData = {
	_type: TypeRef<BlobReadData>;

	_id: Id;
	archiveId: Id;
	instanceListId: null | Id;

	instanceIds: InstanceId[];
}