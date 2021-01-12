// @flow

import {create} from "../../common/utils/EntityUtils"
import {TypeRef} from "../../common/utils/TypeRef"


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
			"refType": "User"
		},
		"userGroup": {
			"id": 395,
			"type": "ELEMENT_ASSOCIATION",
			"cardinality": "One",
			"final": false,
			"refType": "Group"
		}
	},
	"app": "sys",
	"version": "68"
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