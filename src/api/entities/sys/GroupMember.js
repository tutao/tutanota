// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const GroupMemberTypeRef: TypeRef<GroupMember> = new TypeRef("sys", "GroupMember")
export const _TypeModel: TypeModel = {
	"name": "GroupMember",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 216,
	"rootId": "A3N5cwAA2A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 220,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 218,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1021,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 219,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"capability": {
			"name": "capability",
			"id": 1625,
			"since": 52,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 222,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"user": {
			"name": "user",
			"id": 223,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": true,
			"external": false
		},
		"userGroupInfo": {
			"name": "userGroupInfo",
			"id": 221,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createGroupMember(values?: $Shape<$Exact<GroupMember>>): GroupMember {
	return Object.assign(create(_TypeModel, GroupMemberTypeRef), values)
}

export type GroupMember = {
	_type: TypeRef<GroupMember>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	capability: ?NumberString;

	group: Id;
	user: Id;
	userGroupInfo: IdTuple;
}