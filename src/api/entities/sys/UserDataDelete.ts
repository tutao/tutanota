import {create} from "../../common/utils/EntityUtils.js"
import {TypeRef, downcast} from "@tutao/tutanota-utils"
import type {TypeModel} from "../../common/EntityTypes.js"


export const UserDataDeleteTypeRef: TypeRef<UserDataDelete> = new TypeRef("sys", "UserDataDelete")
export const _TypeModel: TypeModel = {
	"name": "UserDataDelete",
	"since": 1,
	"type": "DATA_TRANSFER_TYPE",
	"id": 404,
	"rootId": "A3N5cwABlA",
	"versioned": false,
	"encrypted": false,
	"values": {
		"_format": {
			"id": 405,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		},
		"date": {
			"id": 879,
			"type": "Date",
			"cardinality": "ZeroOrOne",
			"final": false,
			"encrypted": false
		},
		"restore": {
			"id": 406,
			"type": "Boolean",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"id": 407,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "User",
			"dependency": null
		}
	},
	"app": "sys",
	"version": "74"
}

export function createUserDataDelete(values?: Partial<UserDataDelete>): UserDataDelete {
	return Object.assign(create(_TypeModel, UserDataDeleteTypeRef), downcast<UserDataDelete>(values))
}

export type UserDataDelete = {
	_type: TypeRef<UserDataDelete>;

	_format: NumberString;
	date: null | Date;
	restore: boolean;

	user: Id;
}