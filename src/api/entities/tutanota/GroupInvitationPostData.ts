import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {InternalRecipientKeyData} from "./InternalRecipientKeyData.js"
import type {SharedGroupData} from "./SharedGroupData.js"

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
			"refType": "InternalRecipientKeyData",
			"dependency": null
		},
		"sharedGroupData": {
			"id": 1004,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "SharedGroupData",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createGroupInvitationPostData(values?: Partial<GroupInvitationPostData>): GroupInvitationPostData {
	return Object.assign(create(_TypeModel, GroupInvitationPostDataTypeRef), downcast<GroupInvitationPostData>(values))
}

export type GroupInvitationPostData = {
	_type: TypeRef<GroupInvitationPostData>;

	_format: NumberString;

	internalKeyData: InternalRecipientKeyData[];
	sharedGroupData: SharedGroupData;
}