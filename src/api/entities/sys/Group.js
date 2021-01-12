// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {AdministratedGroupsRef} from "./AdministratedGroupsRef"
import type {KeyPair} from "./KeyPair"

export const GroupTypeRef: TypeRef<Group> = new TypeRef("sys", "Group")
export const _TypeModel: TypeModel = {
	"name": "Group",
	"since": 1,
	"type": "ELEMENT_TYPE",
	"id": 5,
	"rootId": "A3N5cwAF",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 7,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 981,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 8,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminGroupEncGKey": {
			"id": 11,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"id": 12,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"external": {
			"id": 982,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"id": 10,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"administratedGroups": {
			"id": 1306,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "AdministratedGroupsRef"
		},
		"keys": {
			"id": 13,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "KeyPair"
		},
		"admin": {
			"id": 224,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Group"
		},
		"customer": {
			"id": 226,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Customer"
		},
		"groupInfo": {
			"id": 227,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		},
		"invitations": {
			"id": 228,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "SentGroupInvitation"
		},
		"members": {
			"id": 229,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupMember"
		},
		"user": {
			"id": 225,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createGroup(values?: $Shape<$Exact<Group>>): Group {
	return Object.assign(create(_TypeModel, GroupTypeRef), values)
}

export type Group = {
	_type: TypeRef<Group>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: ?Id;
	_permissions: Id;
	adminGroupEncGKey: ?Uint8Array;
	enabled: boolean;
	external: boolean;
	type: NumberString;

	administratedGroups: ?AdministratedGroupsRef;
	keys: KeyPair[];
	admin: ?Id;
	customer: ?Id;
	groupInfo: IdTuple;
	invitations: Id;
	members: Id;
	user: ?Id;
}