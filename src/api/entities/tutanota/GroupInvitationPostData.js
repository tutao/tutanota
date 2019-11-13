// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const GroupInvitationPostDataTypeRef: TypeRef<GroupInvitationPostData> = new TypeRef("tutanota", "GroupInvitationPostData")
export const _TypeModel: TypeModel = {
	"name": "GroupInvitationPostData",
	"since": 37,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1002,
	"rootId": "CHR1dGFub3RhAAPq",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1003,
			"since": 37,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"internalKeyData": {
			"name": "internalKeyData",
			"id": 1005,
			"since": 37,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InternalRecipientKeyData",
			"final": false
		},
		"sharedGroupData": {
			"name": "sharedGroupData",
			"id": 1004,
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

export function createGroupInvitationPostData(values?: $Shape<$Exact<GroupInvitationPostData>>): GroupInvitationPostData {
	return Object.assign(create(_TypeModel, GroupInvitationPostDataTypeRef), values)
}
