// @flow

import {create, TypeRef} from "../../common/EntityFunctions"


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
			"name": "_format",
			"id": 393,
			"since": 1,
			"type": "Number",
			"cardinality": "One",
			"final": false,
			"encrypted": false
		}
	},
	"associations": {
		"user": {
			"name": "user",
			"id": 394,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "User",
			"final": false,
			"external": false
		},
		"userGroup": {
			"name": "userGroup",
			"id": 395,
			"since": 1,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"refType": "Group",
			"final": false,
			"external": false
		}
	},
	"app": "sys",
	"version": "63"
}

export function createUserReturn(values?: $Shape<$Exact<UserReturn>>): UserReturn {
	return Object.assign(create(_TypeModel, UserReturnTypeRef), values)
}

export type UserReturn = {
	_type: TypeRef<UserReturn>;

	_format: NumberString;

	user: Id;
	userGroup: Id;
}