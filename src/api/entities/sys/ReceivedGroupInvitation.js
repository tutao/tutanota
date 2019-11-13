// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const ReceivedGroupInvitationTypeRef: TypeRef<ReceivedGroupInvitation> = new TypeRef("sys", "ReceivedGroupInvitation")
export const _TypeModel: TypeModel = {
	"name": "ReceivedGroupInvitation",
	"since": 51,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1602,
	"rootId": "A3N5cwAGQg",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {"name": "_format", "id": 1606, "since": 51, "type": "Number", "cardinality": "One", "final": false, "encrypted": false},
		"_id": {"name": "_id", "id": 1604, "since": 51, "type": "GeneratedId", "cardinality": "One", "final": true, "encrypted": false},
		"_ownerEncSessionKey": {
			"name": "_ownerEncSessionKey",
			"id": 1608,
			"since": 51,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"name": "_ownerGroup",
			"id": 1607,
			"since": 51,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"name": "_permissions",
			"id": 1605,
			"since": 51,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"capability": {
			"name": "capability",
			"id": 1614,
			"since": 51,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"inviteeMailAddress": {
			"name": "inviteeMailAddress",
			"id": 1613,
			"since": 51,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"inviterMailAddress": {
			"name": "inviterMailAddress",
			"id": 1611,
			"since": 51,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"inviterName": {
			"name": "inviterName",
			"id": 1612,
			"since": 51,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"notificationLanguage": {
			"name": "notificationLanguage",
			"id": 1615,
			"since": 51,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sharedGroupKey": {
			"name": "sharedGroupKey",
			"id": 1609,
			"since": 51,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"sharedGroupName": {
			"name": "sharedGroupName",
			"id": 1610,
			"since": 51,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"sentInvitation": {
			"name": "sentInvitation",
			"id": 1617,
			"since": 51,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "SentGroupInvitation",
			"final": false,
			"external": false
		},
		"sharedGroup": {
			"name": "sharedGroup",
			"id": 1616,
			"since": 51,
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

export function createReceivedGroupInvitation(values?: $Shape<$Exact<ReceivedGroupInvitation>>): ReceivedGroupInvitation {
	return Object.assign(create(_TypeModel, ReceivedGroupInvitationTypeRef), values)
}
