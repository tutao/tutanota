import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"

import type {UserAreaGroupData} from "./UserAreaGroupData.js"

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
	"version": "49"
}

export function createUserAreaGroupPostData(values?: Partial<UserAreaGroupPostData>): UserAreaGroupPostData {
	return Object.assign(create(_TypeModel, UserAreaGroupPostDataTypeRef), downcast<UserAreaGroupPostData>(values))
}

export type UserAreaGroupPostData = {
	_type: TypeRef<UserAreaGroupPostData>;

	_format: NumberString;

	groupData: UserAreaGroupData;
}