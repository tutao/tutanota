// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef";


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
			"id": 1012,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"sharedGroupEncInviteeGroupInfoKey": {
			"id": 1014,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"userGroupEncGroupKey": {
			"id": 1013,
			"type": "Bytes",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"receivedInvitation": {
			"id": 1015,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "ReceivedGroupInvitation"
		}
	},
	"app": "tutanota",
	"version": "44"
}

export function createGroupInvitationPutData(values?: $Shape<$Exact<GroupInvitationPutData>>): GroupInvitationPutData {
	return Object.assign(create(_TypeModel, GroupInvitationPutDataTypeRef), values)
}

export type GroupInvitationPutData = {
	_type: TypeRef<GroupInvitationPutData>;

	_format: NumberString;
	sharedGroupEncInviteeGroupInfoKey: Uint8Array;
	userGroupEncGroupKey: Uint8Array;

	receivedInvitation: IdTuple;
}