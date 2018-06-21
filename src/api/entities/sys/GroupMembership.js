// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_id",
			"id": 26,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"admin": {
			"name": "admin",
			"id": 28,
			"since": 1,
			"type": "Boolean",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"groupType": {
			"name": "groupType",
			"id": 1030,
			"since": 17,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"symEncGKey": {
			"name": "symEncGKey",
			"id": 27,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 29,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"groupInfo": {
			"name": "groupInfo",
			"id": 30,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"groupMember": {
			"name": "groupMember",
			"id": 230,
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupMember",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createGroupMembership(): GroupMembership {
	return create(_TypeModel)
}
