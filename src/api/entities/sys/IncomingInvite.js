// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const IncomingInviteTypeRef: TypeRef<IncomingInvite> = new TypeRef("sys", "IncomingInvite")
export const _TypeModel: TypeModel = {
	"name": "IncomingInvite",
	"since": 50,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1596,
	"rootId": "A3N5cwAGPA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {"name": "_format", "id": 1600, "since": 50, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 1598, "since": 50, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerGroup": {"name": "_ownerGroup", "id": 1601, "since": 50, "type": "GeneratedId", "cardinality": "ZeroOrOne", "final": true, "encrypted": false},
		"_permissions": {"name": "_permissions", "id": 1599, "since": 50, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"pubEncGKey": {"name": "pubEncGKey", "id": 1602, "since": 50, "type": "Bytes", "cardinality": "One", "final": false, "encrypted": false},
		"pubKeyVersion": {"name": "pubKeyVersion", "id": 1603, "since": 50, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}
	},
	"associations": {
		"groupInfo": {
			"name": "groupInfo",
			"id": 1605,
			"since": 50,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": false,
			"external": false
		},
		"groupInvitation": {
			"name": "groupInvitation",
			"id": 1604,
			"since": 50,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInvitation",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "50"
}

export function createIncomingInvite(values?: $Shape<$Exact<IncomingInvite>>): IncomingInvite {
	return Object.assign(create(_TypeModel, IncomingInviteTypeRef), values)
}
