import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BlobServerUrlTypeRef: TypeRef<BlobServerUrl> = new TypeRef("storage", "BlobServerUrl")
export const _TypeModel: TypeModel = {
	"name": "BlobServerUrl",
	"since": 4,
	"type": "AGGREGATED_TYPE",
	"id": 154,
	"rootId": "B3N0b3JhZ2UAAJo",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 155,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"url": {
			"id": 156,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {},
	"app": "storage",
	"version": "4"
}

export function createBlobServerUrl(values?: Partial<BlobServerUrl>): BlobServerUrl {
	return Object.assign(create(_TypeModel, BlobServerUrlTypeRef), downcast<BlobServerUrl>(values))
}

export type BlobServerUrl = {
	_type: TypeRef<BlobServerUrl>;

	_id: Id;
	url: string;
}