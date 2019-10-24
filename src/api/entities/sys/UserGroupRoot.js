// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const UserGroupRootTypeRef: TypeRef<UserGroupRoot> = new TypeRef("sys", "UserGroupRoot")
export const _TypeModel: TypeModel = {
	"name": "UserGroupRoot",
	"since": 51,
	"type": "ELEMENT_TYPE",
	"id": 1615,
	"rootId": "A3N5cwAGTw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1619,
			"since": 51,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 1617, "since": 51, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1620,
			"since": 51,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1618,
			"since": 51,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"invitations": {
			"name": "invitations",
			"id": 1621,
			"since": 51,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "ReceivedGroupInvitation",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "51"
}

export function createUserGroupRoot(values?: $Shape<$Exact<UserGroupRoot>>): UserGroupRoot {
	return Object.assign(create(_TypeModel, UserGroupRootTypeRef), values)
}
