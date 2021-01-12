// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"

import type {CreateGroupData} from "./CreateGroupData"

export const CreateGroupListDataTypeRef: TypeRef<CreateGroupListData> = new TypeRef("sys", "CreateGroupListData")
export const _TypeModel: TypeModel = {
	"name": "CreateGroupListData",
	"since": 1,
	"type": "AGGREGATED_TYPE",
	"id": 365,
	"rootId": "A3N5cwABbQ",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 366,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminEncGroupInfoListKey": {
			"id": 368,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncGroupInfoListKey": {
			"id": 367,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"createGroupData": {
			"id": 369,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"final": false,
			"refType": "CreateGroupData"
		}
	},
	"app": "sys",
	"version": "68"
}

export function createCreateGroupListData(values?: $Shape<$Exact<CreateGroupListData>>): CreateGroupListData {
	return Object.assign(create(_TypeModel, CreateGroupListDataTypeRef), values)
}

export type CreateGroupListData = {
	_type: TypeRef<CreateGroupListData>;

	_id: Id;
	adminEncGroupInfoListKey: Uint8Array;
	customerEncGroupInfoListKey: Uint8Array;

	createGroupData: ?CreateGroupData;
}