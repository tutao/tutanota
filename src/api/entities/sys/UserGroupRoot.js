// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const UserGroupRootTypeRef: TypeRef<UserGroupRoot> = new TypeRef("sys", "UserGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "UserGroupRoot",
	"since": 52,
	"type": "ELEMENT_TYPE",
	"id": 1618,
	"rootId": "A3N5cwAGUg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1622,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1620,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1623,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1621,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"invitations": {
			"id": 1624,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "ReceivedGroupInvitation"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createUserGroupRoot(values?: $Shape<$Exact<UserGroupRoot>>): UserGroupRoot {
	return Object.assign(create(_TypeModel, UserGroupRootTypeRef), values)
}

export type UserGroupRoot = {
	_type: TypeRef<UserGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;

	invitations: Id;
}