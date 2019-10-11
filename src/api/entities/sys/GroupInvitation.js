// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const GroupInvitationTypeRef: TypeRef<GroupInvitation> = new TypeRef("sys", "GroupInvitation")
export const _TypeModel: TypeModel = {
	"name": "GroupInvitation",
	"since": 1,
	"type": "LIST_ELEMENT_TYPE",
	"id": 195,
	"rootId": "A3N5cwAAww",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 199,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {"name": "_id", "id": 197, "since": 1, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1018,
			"since": 17,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 198,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"capability": {
			"name": "capability",
			"id": 1601,
			"since": 51,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"invitedMailAddress": {
			"name": "invitedMailAddress",
			"id": 1600,
			"since": 51,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 203,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "51"
}

export function createGroupInvitation(values?: $Shape<$Exact<GroupInvitation>>): GroupInvitation {
	return Object.assign(create(_TypeModel, GroupInvitationTypeRef), values)
}
