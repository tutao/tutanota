import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BucketTypeRef: TypeRef<Bucket> = new TypeRef("sys", "Bucket")
export const _TypeModel: TypeModel = {
	"name": "Bucket",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 129,
	"rootId": "A3N5cwAAgQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 130,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"bucketPermissions": {
			"id": 131,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "BucketPermission",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createBucket(values?: Partial<Bucket>): Bucket {
	return Object.assign(create(_TypeModel, BucketTypeRef), downcast<Bucket>(values))
}

export type Bucket = {
	_type: TypeRef<Bucket>;

	_id: Id;

	bucketPermissions: Id;
}