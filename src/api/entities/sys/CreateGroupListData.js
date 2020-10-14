// @flow

import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_id",
			"id": 366,
			"since": 1,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		},
		"adminEncGroupInfoListKey": {
			"name": "adminEncGroupInfoListKey",
			"id": 368,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"customerEncGroupInfoListKey": {
			"name": "customerEncGroupInfoListKey",
			"id": 367,
			"since": 1,
			"type": "Bytes",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"createGroupData": {
			"name": "createGroupData",
			"id": 369,
			"since": 1,
			"type": "AGGREGATION",
			"cardinality": "ZeroOrOne",
			"refType": "CreateGroupData",
			"final": false
		}
	},
	"app": "sys",
	"version": "63"
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