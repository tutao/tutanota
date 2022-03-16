import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "ReceivedGroupInvitation",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUserGroupRoot(values?: Partial<UserGroupRoot>): UserGroupRoot {
	return Object.assign(create(_TypeModel, UserGroupRootTypeRef), downcast<UserGroupRoot>(values))
}

export type UserGroupRoot = {
	_type: TypeRef<UserGroupRoot>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;

	invitations: Id;
}