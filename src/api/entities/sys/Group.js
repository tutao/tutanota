// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 9,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"name": "_id",
			"id": 7,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 981,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 8,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminGroupEncGKey": {
			"name": "adminGroupEncGKey",
			"id": 11,
			"since": 1,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"enabled": {
			"name": "enabled",
			"id": 12,
			"since": 1,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"external": {
			"name": "external",
			"id": 982,
			"since": 17,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"type": {
			"name": "type",
			"id": 10,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"administratedGroups": {
			"name": "administratedGroups",
			"id": 1306,
			"since": 27,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "AdministratedGroupsRef",
			"final": true
		},
		"keys": {
			"name": "keys",
			"id": 13,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "KeyPair",
			"final": true
		},
		"admin": {
			"name": "admin",
			"id": 224,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"customer": {
			"name": "customer",
			"id": 226,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Customer",
			"final": true,
			"external": false
		},
		"groupInfo": {
			"name": "groupInfo",
			"id": 227,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"invitations": {
			"name": "invitations",
			"id": 228,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "SentGroupInvitation",
			"final": true,
			"external": false
		},
		"members": {
			"name": "members",
			"id": 229,
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupMember",
			"final": true,
			"external": false
		},
		"user": {
			"name": "user",
			"id": 225,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "User",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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