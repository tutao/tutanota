import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UserReturnTypeRef: TypeRef<UserReturn> = new TypeRef("sys", "UserReturn")
export const _TypeModel: TypeModel = {
	"name": "UserReturn",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 392,
	"rootId": "A3N5cwABiA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 393,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"id": 394,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User",
			"dependency": null
		},
		"userGroup": {
			"id": 395,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUserReturn(values?: Partial<UserReturn>): UserReturn {
	return Object.assign(create(_TypeModel, UserReturnTypeRef), downcast<UserReturn>(values))
}

export type UserReturn = {
	_type: TypeRef<UserReturn>;

	_format: NumberString;

	user: Id;
	userGroup: Id;
}