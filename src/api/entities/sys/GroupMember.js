// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 220,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 218,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1021,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 219,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"capability": {
			"id": 1625,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 222,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group"
		},
		"user": {
			"id": 223,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "User"
		},
		"userGroupInfo": {
			"id": 221,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		}
	},
	"app": "sys",
	"version": "68"
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