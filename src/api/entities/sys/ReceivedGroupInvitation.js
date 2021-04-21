// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const ReceivedGroupInvitationTypeRef: TypeRef<ReceivedGroupInvitation> = new TypeRef("sys", "ReceivedGroupInvitation")
export const _TypeModel: TypeModel = {
	"name": "ReceivedGroupInvitation",
	"since": 52,
	"type": "LIST_ELEMENT_TYPE",
	"id": 1602,
	"rootId": "A3N5cwAGQg",
	"versioned": false,
	"encrypted": true,
	"values": {
		"_format": {
			"id": 1606,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"_id": {
			"id": 1604,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"_ownerEncSessionKey": {
			"id": 1608,
			"type": "Bytes",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_ownerGroup": {
			"id": 1607,
			"type": "GeneratedId",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"_permissions": {
			"id": 1605,
			"type": "GeneratedId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"capability": {
			"id": 1614,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"groupType": {
			"id": 1868,
			"type": "Number",
			"cardinality": "ZeroOrOne",
			"final": true,
			"encrypted": false
		},
		"inviteeMailAddress": {
			"id": 1613,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"inviterMailAddress": {
			"id": 1611,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"inviterName": {
			"id": 1612,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"sharedGroupKey": {
			"id": 1609,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		},
		"sharedGroupName": {
			"id": 1610,
			"type": "String",
			"cardinality": "One",
			"final": false,
			"encrypted": true
		}
	},
	"associations": {
		"sentInvitation": {
			"id": 1616,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "SentGroupInvitation"
		},
		"sharedGroup": {
			"id": 1615,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createReceivedGroupInvitation(values?: $Shape<$Exact<ReceivedGroupInvitation>>): ReceivedGroupInvitation {
	return Object.assign(create(_TypeModel, ReceivedGroupInvitationTypeRef), values)
}

export type ReceivedGroupInvitation = {
	_type: TypeRef<ReceivedGroupInvitation>;
	_errors: Object;

	_format: NumberString;
	_id: IdTuple;
	_ownerEncSessionKey: ?Uint8Array;
	_ownerGroup: ?Id;
	_permissions: Id;
	capability: NumberString;
	groupType: ?NumberString;
	inviteeMailAddress: string;
	inviterMailAddress: string;
	inviterName: string;
	sharedGroupKey: Uint8Array;
	sharedGroupName: string;

	sentInvitation: IdTuple;
	sharedGroup: Id;
}