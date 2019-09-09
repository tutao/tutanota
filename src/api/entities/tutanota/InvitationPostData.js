// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const InvitationPostDataTypeRef: TypeRef<InvitationPostData> = new TypeRef("tutanota", "InvitationPostData")
export const _TypeModel: TypeModel = {
	"name": "InvitationPostData",
	"since": 37,
	"type": "DATA_TRANSFER_TYPE",
	"id": 997,
	"rootId": "CHR1dGFub3RhAAPl",
	"versioned": false,
	"encrypted": false,
	"values": {"_format": {"name": "_format", "id": 998, "since": 37, "type": "Number", "cardinality": "One", "final": false, "encrypted": false}},
	"associations": {
		"internalKeyData": {
			"name": "internalKeyData",
			"id": 1000,
			"since": 37,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InternalRecipientKeyData",
			"final": false
		},
		"sharedGroupData": {
			"name": "sharedGroupData",
			"id": 999,
			"since": 37,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "SharedGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "37"
}

export function createInvitationPostData(values?: $Shape<$Exact<InvitationPostData>>): InvitationPostData {
	return Object.assign(create(_TypeModel, InvitationPostDataTypeRef), values)
}
