// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserGroupRootTypeRef: TypeRef<UserGroupRoot> = new TypeRef("sys", "UserGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "UserGroupRoot",
	"since": 50,
	"type": "ELEMENT_TYPE",
	"id": 1606,
	"rootId": "A3N5cwAGRg",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 1610, "since": 50, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 1608, "since": 50, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {"name": "_ownerGroup", "id": 1611, "since": 50, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 1609, "since": 50, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false}
	},
	"associations": {
		"invites": {
			"name": "invites",
			"id": 1612,
			"since": 50,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "IncomingInvite",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "50"
}

export function createUserGroupRoot(values?: $Shape<$Exact<UserGroupRoot>>): UserGroupRoot {
	return Object.assign(create(_TypeModel, UserGroupRootTypeRef), values)
}
