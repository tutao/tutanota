// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"refType": "BucketPermission"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createBucket(values?: $Shape<$Exact<Bucket>>): Bucket {
	return Object.assign(create(_TypeModel, BucketTypeRef), values)
}

export type Bucket = {
	_type: TypeRef<Bucket>;

	_id: Id;

	bucketPermissions: Id;
}