// @flow
import {create, TypeRef} from "../../common/EntityFunctions"

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
			"name": "_id",
			"id": 989,
			"since": 17,
			"type": "CustomId",
			"cardinality": "One",
			"final": true,
			"encrypted": false
		}
	},
	"associations": {
		"list": {
			"name": "list",
			"id": 990,
			"since": 17,
			"type": "LIST_ASSOCIATION",
			"cardinality": "One",
			"refType": "GroupInfo",
			"final": true,
			"external": false
		}
	},
	"app": "sys",
	"version": "32"
}

export function createUserAreaGroups(): UserAreaGroups {
	return create(_TypeModel)
}
