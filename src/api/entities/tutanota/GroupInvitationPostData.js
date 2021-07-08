// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {InternalRecipientKeyData} from "./InternalRecipientKeyData"
import type {SharedGroupData} from "./SharedGroupData"

export const GroupInvitationPostDataTypeRef: TypeRef<GroupInvitationPostData> = new TypeRef("tutanota", "GroupInvitationPostData")
export const _TypeModel: TypeModel = {
	"name": "GroupInvitationPostData",
	"since": 38,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1002,
	"rootId": "CHR1dGFub3RhAAPq",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1003,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"internalKeyData": {
			"id": 1005,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "InternalRecipientKeyData"
		},
		"sharedGroupData": {
			"id": 1004,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "SharedGroupData"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createGroupInvitationPostData(values?: $Shape<$Exact<GroupInvitationPostData>>): GroupInvitationPostData {
	return Object.assign(create(_TypeModel, GroupInvitationPostDataTypeRef), values)
}

export type GroupInvitationPostData = {
	_type: TypeRef<GroupInvitationPostData>;

	_format: NumberString;

	internalKeyData: InternalRecipientKeyData[];
	sharedGroupData: SharedGroupData;
}