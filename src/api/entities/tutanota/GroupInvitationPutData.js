// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

export const GroupInvitationPutDataTypeRef: TypeRef<GroupInvitationPutData> = new TypeRef("tutanota", "GroupInvitationPutData")
export const _TypeModel: TypeModel = {
	"name": "GroupInvitationPutData",
	"since": 38,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1011,
	"rootId": "CHR1dGFub3RhAAPz",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"name": "_format",
			"id": 1012,
			"since": 38,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sharedGroupEncInviteeGroupInfoKey": {
			"name": "sharedGroupEncInviteeGroupInfoKey",
			"id": 1014,
			"since": 38,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"userGroupEncGroupKey": {
			"name": "userGroupEncGroupKey",
			"id": 1013,
			"since": 38,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"receivedInvitation": {
			"name": "receivedInvitation",
			"id": 1015,
			"since": 38,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "ReceivedGroupInvitation",
			"final": false,
			"external": true
		}
	},
	"app": "tutanota",
	"version": "40"
}

export function createGroupInvitationPutData(values?: $Shape<$Exact<GroupInvitationPutData>>): GroupInvitationPutData {
	return Object.assign(create(_TypeModel, GroupInvitationPutDataTypeRef), values)
}
