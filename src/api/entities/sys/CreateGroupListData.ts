import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {CreateGroupData} from "./CreateGroupData.js"

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
			"refType": "CreateGroupData",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createCreateGroupListData(values?: Partial<CreateGroupListData>): CreateGroupListData {
	return Object.assign(create(_TypeModel, CreateGroupListDataTypeRef), downcast<CreateGroupListData>(values))
}

export type CreateGroupListData = {
	_type: TypeRef<CreateGroupListData>;

	_id: Id;
	adminEncGroupInfoListKey: Uint8Array;
	customerEncGroupInfoListKey: Uint8Array;

	createGroupData:  null | CreateGroupData;
}