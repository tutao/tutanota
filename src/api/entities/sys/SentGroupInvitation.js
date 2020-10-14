// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


export const SentGroupInvitationTypeRef: TypeRef<SentGroupInvitation> = new TypeRef("sys", "SentGroupInvitation")
export const _TypeModel: TypeModel = {
	"name": "SentGroupInvitation",
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
		"_id": {
			"name": "_id",
			"id": 197,
			"since": 1,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
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
			"since": 52,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"inviteeMailAddress": {
			"name": "inviteeMailAddress",
			"id": 1600,
			"since": 52,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"receivedInvitation": {
			"name": "receivedInvitation",
			"id": 1617,
			"since": 52,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"refType": "ReceivedGroupInvitation",
			"final": false,
			"external": false
		},
		"sharedGroup": {
			"name": "sharedGroup",
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
	"version": "63"
}

export function createSentGroupInvitation(values?: $Shape<$Exact<SentGroupInvitation>>): SentGroupInvitation {
	return Object.assign(create(_TypeModel, SentGroupInvitationTypeRef), values)
}

export type SentGroupInvitation = {
	_type: TypeRef<SentGroupInvitation>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: ?Id;
	_permissions: Id;
	capability: NumberString;
	inviteeMailAddress: string;

	receivedInvitation: ?IdTuple;
	sharedGroup: Id;
}