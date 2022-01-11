import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"id": 446,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"ownerEncSessionKey": {
			"id": 1031,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"symEncSessionKey": {
			"id": 447,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"bucketPermission": {
			"id": 451,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "BucketPermission"
		},
		"permission": {
			"id": 450,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Permission"
		}
	},
	"app": "sys",
	"version": "71"
}

export function createUpdatePermissionKeyData(values?: Partial<UpdatePermissionKeyData>): UpdatePermissionKeyData {
	return Object.assign(create(_TypeModel, UpdatePermissionKeyDataTypeRef), downcast<UpdatePermissionKeyData>(values))
}

export type UpdatePermissionKeyData = {
	_type: TypeRef<UpdatePermissionKeyData>;

	_format: NumberString;
	ownerEncSessionKey: null | Uint8Array;
	symEncSessionKey: null | Uint8Array;

	bucketPermission: IdTuple;
	permission: IdTuple;
}