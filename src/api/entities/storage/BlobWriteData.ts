import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BlobWriteDataTypeRef: TypeRef<BlobWriteData> = new TypeRef("storage", "BlobWriteData")
export const _TypeModel: TypeModel = {
	"name": "BlobWriteData",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 73,
	"rootId": "B3N0b3JhZ2UASQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 74,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"archiveOwnerGroup": {
			"id": 75,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "storage",
	"version": "4"
}

export function createBlobWriteData(values?: Partial<BlobWriteData>): BlobWriteData {
	return Object.assign(create(_TypeModel, BlobWriteDataTypeRef), downcast<BlobWriteData>(values))
}

export type BlobWriteData = {
	_type: TypeRef<BlobWriteData>;

	_id: Id;
	archiveOwnerGroup: Id;
}