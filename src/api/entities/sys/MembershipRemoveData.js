// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 868,
			"since": 9,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"group": {
			"name": "group",
			"id": 870,
			"since": 9,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		},
		"user": {
			"name": "user",
			"id": 869,
			"since": 9,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
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