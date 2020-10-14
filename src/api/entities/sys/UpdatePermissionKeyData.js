// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const UpdatePermissionKeyDataTypeRef: TypeRef<UpdatePermissionKeyData> = new TypeRef("sys", "UpdatePermissionKeyData")
export const _TypeModel: TypeModel = {
	"name": "UpdatePermissionKeyData",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 445,
	"rootId": "A3N5cwABvQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 446,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncSessionKey": {
			"name": "ownerEncSessionKey",
			"id": 1031,
			"since": 17,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"symEncSessionKey": {
			"name": "symEncSessionKey",
			"id": 447,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bucketPermission": {
			"name": "bucketPermission",
			"id": 451,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "BucketPermission",
			"final": false,
			"external": false
		},
		"permission": {
			"name": "permission",
			"id": 450,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Permission",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createUpdatePermissionKeyData(values?: $Shape<$Exact<UpdatePermissionKeyData>>): UpdatePermissionKeyData {
	return Object.assign(create(_TypeModel, UpdatePermissionKeyDataTypeRef), values)
}

export type UpdatePermissionKeyData = {
	_type: TypeRef<UpdatePermissionKeyData>;

	_format: NumberString;
	ownerEncSessionKey: ?Uint8Array;
	symEncSessionKey: ?Uint8Array;

	bucketPermission: IdTuple;
	permission: IdTuple;
}