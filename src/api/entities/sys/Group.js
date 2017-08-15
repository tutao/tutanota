// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
		"keys": {
			"name": "keys",
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "KeyPair",
			"final": true
		},
		"admin": {
			"name": "admin",
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Group",
			"final": true,
			"external": false
		},
		"customer": {
			"name": "customer",
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "Customer",
			"final": true,
			"external": false
		},
		"groupInfo": {
			"name": "groupInfo",
			"since": 1,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		},
		"invitations": {
			"name": "invitations",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInvitation",
			"final": true,
			"external": false
		},
		"members": {
			"name": "members",
			"since": 1,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupMember",
			"final": true,
			"external": false
		},
		"user": {
			"name": "user",
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "User",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "23"
}

export function createGroup(): Group {
	return create(_TypeModel)
}
