// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const MembershipRemoveDataTypeRef: TypeRef<MembershipRemoveData> = new TypeRef("sys", "MembershipRemoveData")
export const _TypeModel: TypeModel = {
	"name": "MembershipRemoveData",
	"since": 9,
	"type": "DATA_TRANSFER_TYPE",
	"id": 867,
	"rootId": "A3N5cwADYw",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 868,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"id": 870,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		},
		"user": {
			"id": 869,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createMembershipRemoveData(values?: $Shape<$Exact<MembershipRemoveData>>): MembershipRemoveData {
	return Object.assign(create(_TypeModel, MembershipRemoveDataTypeRef), values)
}

export type MembershipRemoveData = {
	_type: TypeRef<MembershipRemoveData>;

	_format: NumberString;

	group: Id;
	user: Id;
}