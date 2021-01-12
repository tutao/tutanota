// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const GroupMembershipTypeRef: TypeRef<GroupMembership> = new TypeRef("sys", "GroupMembership")
export const _TypeModel: TypeModel = {
	"name": "GroupMembership",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 25,
	"rootId": "A3N5cwAZ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 26,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"admin": {
			"id": 28,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"capability": {
			"id": 1626,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"groupType": {
			"id": 1030,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"symEncGKey": {
			"id": 27,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 29,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "Group"
		},
		"groupInfo": {
			"id": 30,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		},
		"groupMember": {
			"id": 230,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupMember"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createGroupMembership(values?: $Shape<$Exact<GroupMembership>>): GroupMembership {
	return Object.assign(create(_TypeModel, GroupMembershipTypeRef), values)
}

export type GroupMembership = {
	_type: TypeRef<GroupMembership>;

	_id: Id;
	admin: boolean;
	capability: ?NumberString;
	groupType: ?NumberString;
	symEncGKey: Uint8Array;

	group: Id;
	groupInfo: IdTuple;
	groupMember: IdTuple;
}