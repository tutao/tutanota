// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

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
			"id": 136,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 134,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1003,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1002,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 135,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"bucketEncSessionKey": {
			"id": 139,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"listElementApplication": {
			"id": 1524,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"listElementTypeId": {
			"id": 1523,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"ops": {
			"id": 140,
			"type": "String",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"symEncSessionKey": {
			"id": 138,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"type": {
			"id": 137,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bucket": {
			"id": 142,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Bucket"
		},
		"group": {
			"id": 141,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "68"
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