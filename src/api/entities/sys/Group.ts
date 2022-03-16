import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {AdministratedGroupsRef} from "./AdministratedGroupsRef.js"
import type {ArchiveType} from "./ArchiveType.js"
import type {KeyPair} from "./KeyPair.js"

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
		"admin": {
			"id": 224,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Group",
			"dependency": null
		},
		"administratedGroups": {
			"id": 1306,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "AdministratedGroupsRef",
			"dependency": null
		},
		"archives": {
			"id": 1881,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "ArchiveType",
			"dependency": null
		},
		"customer": {
			"id": 226,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "Customer",
			"dependency": null
		},
		"groupInfo": {
			"id": 227,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo",
			"dependency": null
		},
		"invitations": {
			"id": 228,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "SentGroupInvitation",
			"dependency": null
		},
		"keys": {
			"id": 13,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": true,
			"refType": "KeyPair",
			"dependency": null
		},
		"members": {
			"id": 229,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupMember",
			"dependency": null
		},
		"user": {
			"id": 225,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": true,
			"refType": "User",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createGroup(values?: Partial<Group>): Group {
	return Object.assign(create(_TypeModel, GroupTypeRef), downcast<Group>(values))
}

export type Group = {
	_type: TypeRef<Group>;

	_format: NumberString;
	_id: Id;
	_ownerGroup: null | Id;
	_permissions: Id;
	adminGroupEncGKey: null | Uint8Array;
	enabled: boolean;
	external: boolean;
	type: NumberString;

	admin:  null | Id;
	administratedGroups:  null | AdministratedGroupsRef;
	archives: ArchiveType[];
	customer:  null | Id;
	groupInfo: IdTuple;
	invitations: Id;
	keys: KeyPair[];
	members: Id;
	user:  null | Id;
}