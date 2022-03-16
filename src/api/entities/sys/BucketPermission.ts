import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const BucketPermissionTypeRef: TypeRef<BucketPermission> = new TypeRef("sys", "BucketPermission")
export const _TypeModel: TypeModel = {
	"name": "BucketPermission",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 118,
	"rootId": "A3N5cwB2",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 122,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 120,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1000,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 121,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"ownerEncBucketKey": {
			"id": 1001,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"pubEncBucketKey": {
			"id": 125,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"pubKeyVersion": {
			"id": 126,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"symEncBucketKey": {
			"id": 124,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 123,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 128,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createBucketPermission(values?: Partial<BucketPermission>): BucketPermission {
	return Object.assign(create(_TypeModel, BucketPermissionTypeRef), downcast<BucketPermission>(values))
}

export type BucketPermission = {
	_type: TypeRef<BucketPermission>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	ownerEncBucketKey: null | Uint8Array;
	pubEncBucketKey: null | Uint8Array;
	pubKeyVersion: null | NumberString;
	symEncBucketKey: null | Uint8Array;
	type: NumberString;

	group: Id;
}