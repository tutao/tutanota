// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_format",
			"id": 1003,
			"since": 38,
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
			"since": 38,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"refType": "InternalRecipientKeyData",
			"final": false
		},
		"sharedGroupData": {
			"name": "sharedGroupData",
			"id": 1004,
			"since": 38,
			"type": "AGGREGATION",
			"cardinality": "One",
			"refType": "SharedGroupData",
			"final": false
		}
	},
	"app": "tutanota",
	"version": "44"
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