// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {MailAddress} from "./MailAddress"

export const GroupInvitationPostReturnTypeRef: TypeRef<GroupInvitationPostReturn> = new TypeRef("tutanota", "GroupInvitationPostReturn")
export const _TypeModel: TypeModel = {
	"name": "GroupInvitationPostReturn",
	"since": 38,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1006,
	"rootId": "CHR1dGFub3RhAAPu",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1007,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"existingMailAddresses": {
			"id": 1008,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "MailAddress"
		},
		"invalidMailAddresses": {
			"id": 1009,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "MailAddress"
		},
		"invitedMailAddresses": {
			"id": 1010,
			"type": "AGGREGATION",
			"cardinality": "Any",
			"final": false,
			"refType": "MailAddress"
		}
	},
	"app": "tutanota",
	"version": "46"
}

export function createGroupInvitationPostReturn(values?: $Shape<$Exact<GroupInvitationPostReturn>>): GroupInvitationPostReturn {
	return Object.assign(create(_TypeModel, GroupInvitationPostReturnTypeRef), values)
}

export type GroupInvitationPostReturn = {
	_type: TypeRef<GroupInvitationPostReturn>;

	_format: NumberString;

	existingMailAddresses: MailAddress[];
	invalidMailAddresses: MailAddress[];
	invitedMailAddresses: MailAddress[];
}