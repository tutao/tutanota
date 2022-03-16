import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


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
			"refType": "GroupInfo",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUserAreaGroups(values?: Partial<UserAreaGroups>): UserAreaGroups {
	return Object.assign(create(_TypeModel, UserAreaGroupsTypeRef), downcast<UserAreaGroups>(values))
}

export type UserAreaGroups = {
	_type: TypeRef<UserAreaGroups>;

	_id: Id;

	list: Id;
}