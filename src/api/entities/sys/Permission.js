// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

import type {Bucket} from "./Bucket"

export const PermissionTypeRef: TypeRef<Permission> = new TypeRef("sys", "Permission")
export const _TypeModel: TypeModel = {
	"name": "Permission",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 132,
	"rootId": "A3N5cwAAhA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 136,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 134,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1003,
			"since": 17,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1002,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 135,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bucketEncSessionKey": {
			"name": "bucketEncSessionKey",
			"id": 139,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"listElementApplication": {
			"name": "listElementApplication",
			"id": 1524,
			"since": 46,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"listElementTypeId": {
			"name": "listElementTypeId",
			"id": 1523,
			"since": 46,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"ops": {
			"name": "ops",
			"id": 140,
			"since": 1,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"symEncSessionKey": {
			"name": "symEncSessionKey",
			"id": 138,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 137,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bucket": {
			"name": "bucket",
			"id": 142,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "Bucket",
			"final": false
		},
		"group": {
			"name": "group",
			"id": 141,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createPermission(values?: $Shape<$Exact<Permission>>): Permission {
	return Object.assign(create(_TypeModel, PermissionTypeRef), values)
}

export type Permission = {
	_type: TypeRef<Permission>;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	bucketEncSessionKey: ?Uint8Array;
	listElementApplication: ?string;
	listElementTypeId: ?NumberString;
	ops: ?string;
	symEncSessionKey: ?Uint8Array;
	type: NumberString;

	bucket: ?Bucket;
	group: ?Id;
}