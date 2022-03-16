import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "ReceivedGroupInvitation",
			"dependency": null
		},
		"sharedGroup": {
			"id": 203,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createSentGroupInvitation(values?: Partial<SentGroupInvitation>): SentGroupInvitation {
	return Object.assign(create(_TypeModel, SentGroupInvitationTypeRef), downcast<SentGroupInvitation>(values))
}

export type SentGroupInvitation = {
	_type: TypeRef<SentGroupInvitation>;

	_format: NumberString;
	_id: IdTuple;
	_ownerGroup: null | Id;
	_permissions: Id;
	capability: NumberString;
	inviteeMailAddress: string;

	receivedInvitation:  null | IdTuple;
	sharedGroup: Id;
}