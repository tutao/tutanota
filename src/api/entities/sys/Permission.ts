import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {Bucket} from "./Bucket.js"

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
			"refType": "Bucket",
			"dependency": null
		},
		"group": {
			"id": 141,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createPermission(values?: Partial<Permission>): Permission {
	return Object.assign(create(_TypeModel, PermissionTypeRef), downcast<Permission>(values))
}

export type Permission = {
	_type: TypeRef<Permission>;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: null | Uint8Array;
	_ownerGroup: null | Id;
	_permissions: Id;
	bucketEncSessionKey: null | Uint8Array;
	listElementApplication: null | string;
	listElementTypeId: null | NumberString;
	ops: null | string;
	symEncSessionKey: null | Uint8Array;
	type: NumberString;

	bucket:  null | Bucket;
	group:  null | Id;
}