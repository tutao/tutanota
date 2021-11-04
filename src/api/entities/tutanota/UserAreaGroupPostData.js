// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes"

import type {UserAreaGroupData} from "./UserAreaGroupData"

export const UserAreaGroupPostDataTypeRef: TypeRef<UserAreaGroupPostData> = new TypeRef("tutanota", "UserAreaGroupPostData")
export const _TypeModel: TypeModel = {
	"name": "UserAreaGroupPostData",
	"since": 33,
	"type": "DATA_TRANSFER_TYPE",
	"id": 964,
	"rootId": "CHR1dGFub3RhAAPE",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 965,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"groupData": {
			"id": 966,
			"type": "AGGREGATION",
			"cardinality": "One",
			"final": false,
			"refType": "UserAreaGroupData",
			"dependency": null
		}
	},
	"app": "tutanota",
	"version": "48"
}

export function createUserAreaGroupPostData(values?: $Shape<$Exact<UserAreaGroupPostData>>): UserAreaGroupPostData {
	return Object.assign(create(_TypeModel, UserAreaGroupPostDataTypeRef), values)
}

export type UserAreaGroupPostData = {
	_type: TypeRef<UserAreaGroupPostData>;

	_format: NumberString;

	groupData: UserAreaGroupData;
}