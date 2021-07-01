// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"id": 199,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 197,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1018,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 198,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"capability": {
			"id": 1601,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"inviteeMailAddress": {
			"id": 1600,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"receivedInvitation": {
			"id": 1617,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "ReceivedGroupInvitation"
		},
		"sharedGroup": {
			"id": 203,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "69"
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