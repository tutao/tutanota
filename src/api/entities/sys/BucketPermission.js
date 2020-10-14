// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 122,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 120,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1000,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 121,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"ownerEncBucketKey": {
			"name": "ownerEncBucketKey",
			"id": 1001,
			"since": 17,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"pubEncBucketKey": {
			"name": "pubEncBucketKey",
			"id": 125,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"pubKeyVersion": {
			"name": "pubKeyVersion",
			"id": 126,
			"since": 1,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"symEncBucketKey": {
			"name": "symEncBucketKey",
			"id": 124,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 123,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 128,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createBucketPermission(values?: $Shape<$Exact<BucketPermission>>): BucketPermission {
	return Object.assign(create(_TypeModel, BucketPermissionTypeRef), values)
}

export type BucketPermission = {
	_type: TypeRef<BucketPermission>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	ownerEncBucketKey: ?Uint8Array;
	pubEncBucketKey: ?Uint8Array;
	pubKeyVersion: ?NumberString;
	symEncBucketKey: ?Uint8Array;
	type: NumberString;

	group: Id;
}