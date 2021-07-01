// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


export const UserAreaGroupsTypeRef: TypeRef<UserAreaGroups> = new TypeRef("sys", "UserAreaGroups")
export const _TypeModel: TypeModel = {
	"name": "UserAreaGroups",
	"since": 17,
	"type": "AGGREGATED_TYPE",
	"id": 988,
	"rootId": "A3N5cwAD3A",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_id": {
			"id": 989,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"id": 990,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"final": true,
			"refType": "GroupInfo"
		}
	},
	"app": "sys",
	"version": "69"
}

export function createUserAreaGroups(values?: $Shape<$Exact<UserAreaGroups>>): UserAreaGroups {
	return Object.assign(create(_TypeModel, UserAreaGroupsTypeRef), values)
}

export type UserAreaGroups = {
	_type: TypeRef<UserAreaGroups>;

	_id: Id;

	list: Id;
}