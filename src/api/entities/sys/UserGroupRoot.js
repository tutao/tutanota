// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 1622,
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 1620,
			"since": 52,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1623,
			"since": 52,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1621,
			"since": 52,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"invitations": {
			"name": "invitations",
			"id": 1624,
			"since": 52,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "ReceivedGroupInvitation",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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