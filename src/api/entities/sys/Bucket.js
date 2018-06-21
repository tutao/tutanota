// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_id",
			"id": 130,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"bucketPermissions": {
			"name": "bucketPermissions",
			"id": 131,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "BucketPermission",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createBucket(): Bucket {
	return create(_TypeModel)
}
