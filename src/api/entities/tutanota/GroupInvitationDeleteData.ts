import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const GroupInvitationDeleteDataTypeRef: TypeRef<GroupInvitationDeleteData> = new TypeRef("tutanota", "GroupInvitationDeleteData")
export const _TypeModel: TypeModel = {
	"name": "GroupInvitationDeleteData",
	"since": 38,
	"type": "DATA_TRANSFER_TYPE",
	"id": 1016,
	"rootId": "CHR1dGFub3RhAAP4",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 1017,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"receivedInvitation": {
			"id": 1018,
			"type": "LIST_ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "ReceivedGroupInvitation"
		}
	},
	"app": "tutanota",
	"version": "51"
}

export function createGroupInvitationDeleteData(values?: Partial<GroupInvitationDeleteData>): GroupInvitationDeleteData {
	return Object.assign(create(_TypeModel, GroupInvitationDeleteDataTypeRef), downcast<GroupInvitationDeleteData>(values))
}

export type GroupInvitationDeleteData = {
	_type: TypeRef<GroupInvitationDeleteData>;

	_format: NumberString;

	receivedInvitation: IdTuple;
}